import { Component, inject, NgZone, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormControl,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonItem,
  IonButton,
} from '@ionic/angular/standalone';
import { Util } from 'src/app/services/util';
import { Usuario } from 'src/app/models/usuario';
import { RouterModule } from '@angular/router';
import { Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { EmailService } from 'src/app/services/email-service';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { LectorQrService } from 'src/app/services/lector-qr-service';
import { environment } from 'src/environments/environment';
import { CamaraService } from 'src/app/services/camara-service';
import { InputMjorComponent } from "src/app/components/elementos/input-mjor/input-mjor.component";
import { NotificationService } from 'src/app/services/notification.service';
import { INotification } from 'src/app/services/notification';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    IonContent,
    IonGrid,
    IonRow,
    IonCol,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonItem,
    IonButton,
    InputMjorComponent
],})
export class RegisterPage {
  //! ==================== Variables y servicios ====================
  protected fotoPreview: string | null | undefined = null;
  protected currentStep = signal(1);
  private isWeb = Capacitor.getPlatform() === 'web';
  
  private utilSvc = inject(Util);
  private userSvc = inject(UsuarioSb);
  private scanSvc = inject(LectorQrService);
  private emailSvc = inject(EmailService);
  private fotoSvc = inject(CamaraService)
  private notificacionSvc = inject(NotificationService);
  
  //! ==================== Formulario ====================
  protected formRegistro = new FormGroup({
    nombre: new FormControl('', [Validators.required,Validators.minLength(3),
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),]),
    apellido: new FormControl('', [Validators.required,Validators.minLength(3),
      Validators.pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/),]),
    documento: new FormControl('', [Validators.required,Validators.minLength(7),
      Validators.maxLength(8),Validators.pattern(/^\d{7,8}$/),]),
    cuil: new FormControl('', [Validators.required,Validators.minLength(10),
      Validators.maxLength(11),Validators.pattern(/^\d{11}$/),]),
    email: new FormControl('', [Validators.required,Validators.email,
      Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/),]),
    contrasenia: new FormControl('', [Validators.required,Validators.minLength(8),]),
    repetirContrasenia: new FormControl('', [Validators.required]),
    foto: new FormControl('', [Validators.required]),
  }, { validators: this.checkPasswords });

  checkPasswords(group: AbstractControl) {
    const pass = group.get('contrasenia')?.value;
    const confirmPass = group.get('repetirContrasenia')?.value;
    return pass === confirmPass ? null : { notSame: true };
  }
  
  //! ==================== Métodos visuales ====================
  nextStep() {
    const step = this.currentStep();
    if (step === 1) {
      if (this.formRegistro.controls.nombre.invalid || this.formRegistro.controls.apellido.invalid) {
        this.formRegistro.controls.nombre.markAsTouched();
        this.formRegistro.controls.apellido.markAsTouched();
        return;
      }
    } else if (step === 2) {
      if (this.formRegistro.controls.documento.invalid || this.formRegistro.controls.cuil.invalid) {
        this.formRegistro.controls.documento.markAsTouched();
        this.formRegistro.controls.cuil.markAsTouched();
        return;
      }
    } else if (step === 3) {
      if (this.formRegistro.controls.email.invalid || 
          this.formRegistro.controls.contrasenia.invalid || 
          this.formRegistro.controls.repetirContrasenia.invalid || 
          this.formRegistro.hasError('notSame')) {
        this.formRegistro.controls.email.markAsTouched();
        this.formRegistro.controls.contrasenia.markAsTouched();
        this.formRegistro.controls.repetirContrasenia.markAsTouched();
        return;
      }
    }
    this.currentStep.update(v => v + 1);
  }

  prevStep() {
    this.currentStep.update(v => v - 1);
  }
  //! ==================== Métodos funcionales ====================


  async escanearDNI() {
    const carga = await this.utilSvc.loading();
    carga.present();
    const text = await this.scanSvc.scanDni();
    if (!text || text.length === 0 || text == null || text == undefined) {
      this.utilSvc.mostrarToast(
        'Error, no se pudo leer el QR del DNI',
        'error',
        'middle',
        1000
      );
      carga.dismiss();
      return;
    }

    const textoDecodificado = this.utilSvc.formatearPdf147(text[0].rawValue!);
    const dni = textoDecodificado.split('@');

    const cuilNum = Array.from(dni[8]);
    const cuil = `${cuilNum[0]}${cuilNum[1]}${dni[4]}${cuilNum[2]}`;

    this.formRegistro.patchValue({
      nombre: this.utilSvc.toTitleCase(dni[2]),
      apellido: this.utilSvc.toTitleCase(dni[1]),
      documento: dni[4],
      cuil: cuil,
    });

    carga.dismiss();
    await this.utilSvc.mostrarToast(
      '¡Datos agregados con éxito! Corrija los posibles errores',
      'info',
      'middle',
      1000
    );
    return;
  }

  async sacarFoto() {
    if (this.isWeb) {
      this.formRegistro.patchValue({
        foto: `${environment.supabaseStorageUrl}foto-usuario/user-placeholder.png`,
      });
      this.fotoPreview = this.formRegistro.controls.foto.value;
      this.utilSvc.mostrarToast('Foto tomada correctamente');
      return;
    }

    try {
      const foto = (await this.fotoSvc.tomarFotoCelular()) as Photo;

      if (foto && foto.webPath) {
        this.fotoPreview = foto.webPath;
        this.formRegistro.patchValue({ foto: foto.path });
        this.utilSvc.mostrarToast('Foto tomada correctamente','success');
      } else {
        this.utilSvc.mostrarToast(
          'No se pudo tomar la foto. Por favor intente nuevamente.', 'error'
        );
      }
    } catch (error) {
      this.utilSvc.mostrarAlert('Error', (error as Error).message);
    }
  }

  async registrar() {
    if (this.formRegistro.invalid) {
      this.utilSvc.mostrarToast(
        'Formulario incompleto. Por favor complete todos los campos correctamente antes de continuar.'
      );
      this.formRegistro.markAllAsTouched();
      return;
    }

    const carga = this.utilSvc.loading();
    (await carga).present();

    try {
      const dni = String(this.formRegistro.value.documento);
      const email = String(this.formRegistro.value.email);

      const usuario: Usuario = {
        dni: dni,
        cuil: String(this.formRegistro.value.cuil),
        nombre: this.utilSvc.toTitleCase(
          String(this.formRegistro.value.nombre)
        ),
        apellido: this.utilSvc.toTitleCase(
          String(this.formRegistro.value.apellido)
        ),
        email: email.toLowerCase(),
        perfil: 'cliente',
        foto: String(this.formRegistro.controls.foto.value),
        contrasenia: this.formRegistro.value.contrasenia ?? ''
      };

      await this.userSvc.agregarUsuario(usuario);

      this.utilSvc.mostrarToast(
        '¡Registro exitoso! Su cuenta está pendiente de aprobación. Recibirá un email cuando sea aprobada.', 'success',
        'middle',2000
      );

      this.formRegistro.reset();
      this.fotoPreview = null;


      this.utilSvc.redirigir('/login-usuario');
    } catch (error) {
     this.utilSvc.mostrarAlert('¡Hubo un error!', (error as Error).message)
    } finally {
      (await carga).dismiss();
    }
  }



}
