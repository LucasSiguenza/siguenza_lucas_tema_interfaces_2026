import { CommonModule, TitleCasePipe } from '@angular/common';
import { Component, inject, ViewChild, signal } from '@angular/core';
import {AbstractControl,FormControl,FormGroup,ReactiveFormsModule,ValidationErrors,Validators,
} from '@angular/forms';
import { Photo } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { ModalController, IonButton, IonContent, IonItem, IonCard, IonCardHeader, IonCardContent,
  IonCardTitle, IonList, IonAccordion, IonAccordionGroup, IonIcon,
  IonGrid, IonRow, IonCol, IonLabel} from '@ionic/angular/standalone';
import { Usuario } from 'src/app/models/usuario';
import { Util } from 'src/app/services/util';
import { LectorQrService } from 'src/app/services/lector-qr-service';
import { environment } from 'src/environments/environment';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { addIcons } from 'ionicons';
import { InputMjorComponent } from "../../input-mjor/input-mjor.component";
import { CamaraService } from 'src/app/services/camara-service';
import { arrowBack, arrowBackOutline, arrowForwardOutline, cameraOutline,
   caretDownOutline, checkmarkCircleOutline, personOutline } from 'ionicons/icons';
import { INotification } from 'src/app/services/notification';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-form-alta-usuario-modal',
  templateUrl: './form-alta-usuario-modal.component.html',
  styleUrls: ['./form-alta-usuario-modal.component.scss'],
  imports: [ IonAccordionGroup, IonAccordion, IonCardTitle, IonItem, IonContent,
     IonButton, CommonModule, ReactiveFormsModule, IonCard, IonCardHeader, IonCardContent,
      IonList, IonLabel, IonIcon, IonGrid, IonRow, IonCol, 
      IonContent, InputMjorComponent],
})
export class FormAltaUsuarioModalComponent  {
  
  //! ================ Variables y servicios ================
  private scanSvc = inject(LectorQrService);
  private utilSvc = inject(Util);
  private userSvc = inject(UsuarioSb);
  private camaraSvc = inject(CamaraService);
  private modalCtrl = inject(ModalController);
  private notificacionSvc = inject(NotificationService)


  @ViewChild('accordion2') accordionCtrl!: IonAccordionGroup;
  protected isNuevo!: boolean;
  protected isEmpleado = this.userSvc.usrSeleccionado()?.perfil !== 'maitre';

  protected form = new FormGroup({
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

    contrasenia: new FormControl('', [Validators.minLength(8)]),
    repetirContrasenia: new FormControl(''),
    foto: new FormControl('', [Validators.required]),
    perfil: new FormControl('')
  },
  { validators: this.checkPasswords });

  checkPasswords(group: AbstractControl) {
    const pass = group.get('contrasenia')?.value;
    const confirmPass = group.get('repetirContrasenia')?.value;

    if (!pass && !confirmPass) return null;

    return pass === confirmPass ? null : { notSame: true };
  }

  isWeb = this.utilSvc.isWeb();

  //! ================ Inicialización de formulario ================

  ionViewDidEnter() {
    this.currentStep.set(1);
    this.isNuevo = this.userSvc.usrSeleccionado() === null || this.userSvc.usrSeleccionado() === undefined
      if (this.userSvc.usrSeleccionado()) {
        this.form.patchValue({
          ...this.userSvc.usrSeleccionado(),
          nombre: this.userSvc.usrSeleccionado()!.nombre,
          apellido: this.userSvc.usrSeleccionado()!.apellido,
          documento: this.userSvc.usrSeleccionado()!.dni,
          cuil: this.userSvc.usrSeleccionado()!.cuil,
          email: this.userSvc.usrSeleccionado()!.email,
          perfil: this.userSvc.usrSeleccionado()!.perfil,
          foto: this.userSvc.usrSeleccionado()!.uid,
        });
        this.fotoPreview = this.userSvc.usrSeleccionado()!.foto;
      }
      if (this.userSvc.usrSeleccionado()?.perfil === 'cliente' && this.userSvc.usrActual()?.perfil === 'dueño') {
        this.form.patchValue({
          perfil: 'cliente',
        });
      } 
      if (this.userSvc.usrActual()?.perfil === 'dueño' || this.userSvc.usrActual()?.perfil === 'supervisor') {
        this.form.patchValue({
          perfil: 'mozo',
        });
      } 
      if (this.userSvc.usrActual()?.perfil === 'maitre') {
        this.form.patchValue({
          perfil: 'cliente',
        });
      } 
    }
  constructor() {
    addIcons({arrowBack, arrowBackOutline,arrowForwardOutline,
       cameraOutline,checkmarkCircleOutline,personOutline, caretDownOutline});
   }

  ngOnInit() {
  }
  //! ================ Visuales ================
  protected fotoPreview: string | null | undefined = null;

  //~ ================ Stepper ================
  protected currentStep = signal(1);
  nextStep() {
    const step = this.currentStep();
    if (step === 1) {
      if (this.form.controls.nombre.invalid || this.form.controls.apellido.invalid) {
        this.form.controls.nombre.markAsTouched();
        this.form.controls.apellido.markAsTouched();
        return;
      }
    } else if (step === 2) {
      if (this.form.controls.documento.invalid || this.form.controls.cuil.invalid) {
        this.form.controls.documento.markAsTouched();
        this.form.controls.cuil.markAsTouched();
        return;
      }
    } else if (step === 3 && this.userSvc.usrSeleccionado === null) {
      if (this.form.controls.email.invalid || 
          this.form.controls.contrasenia.invalid || 
          this.form.controls.repetirContrasenia.invalid || 
          this.form.hasError('notSame')) {
        this.form.controls.email.markAsTouched();
        this.form.controls.contrasenia.markAsTouched();
        this.form.controls.repetirContrasenia.markAsTouched();
        return;
      }
    }
    this.currentStep.update(v => v + 1);
  }

  prevStep() {
    this.currentStep.update(v => v - 1);
  }

  //~ Funciones de los botones del footer
  cancel() {
    return this.modalCtrl.dismiss(null, 'cancel');
  }
  
  seleccionarPerfil(valor: string) {
    this.form.controls['perfil'].setValue(valor);
    this.accordionCtrl.value = null;
  }
  

  //! ================ Métodos funcionales ================
   async confirm() {

    if(this.form.invalid){
      this.utilSvc.mostrarToast('Rellene correctamente los campos.','error','middle',100)
      return;
    }
    let usuarioNuevo: Usuario = {
      apellido: this.form.controls.apellido.value as string,
      cuil: this.form.controls.cuil.value as string,
      dni: this.form.controls.documento.value as string,
      email: this.form.controls.email.value as string,
      nombre: this.form.controls.nombre.value as string,
      perfil: this.form.controls.perfil.value as Usuario['perfil'],
      foto: this.form.controls.foto.value as string,
      contrasenia: this.form.controls.contrasenia.value as string,
    };
    usuarioNuevo.estado = usuarioNuevo.perfil !== 'cliente'
    if(this.isNuevo === false){
      usuarioNuevo ={
        ...usuarioNuevo,
        uid: this.userSvc.usrSeleccionado()!.uid,
        id: this.userSvc.usrSeleccionado()!.id
      }
    }

    const carga = await this.utilSvc.loading();
    await carga.present();
    try {      
      if(this.isNuevo === false) {
        await this.userSvc.actualizarUsuario(usuarioNuevo);
      }
      else {          
        await this.userSvc.agregarUsuario(usuarioNuevo)
      };
      this.userSvc.usrSeleccionado.set(null)
      await this.modalCtrl.dismiss(this.userSvc.usrSeleccionado, 'confirm');
    } catch (e: any) {
      if (
        e.message?.includes('User already registered') ||
        e.message?.includes('already exists') ||
        e.message?.includes('duplicate key value')
      ) {
        await this.utilSvc.mostrarToast('Este email ya está en uso. Por favor, use otro email.', 'error','middle',500);
        return;
      }
      return;
    } finally{
        await carga.dismiss()
      }
      
    }

  async escanearDNI() {
    const carga = await this.utilSvc.loading();
    await carga.present();
    const text = await this.scanSvc.scanDni();

    if (!text || text.length === 0) {
      this.utilSvc.mostrarAlert('Error', 'No se pudo leer el QR del DNI');
      await carga.dismiss();
      return;
    }
    const textoDecodificado = this.utilSvc.formatearPdf147(text[0].rawValue!);
    const dni = textoDecodificado.split('@');

    const cuilNum = Array.from(dni[8]);
    const cuil = `${cuilNum[0]}${cuilNum[1]}${dni[4]}${cuilNum[2]}`;

    this.form.patchValue({
      nombre: this.utilSvc.toTitleCase(dni[2]),
      apellido: this.utilSvc.toTitleCase(dni[1]),
      documento: dni[4],
      cuil: cuil,
    });

    await carga.dismiss();
    this.utilSvc.mostrarToast(
      '¡Escaneo exitoso! Corrija los posibles errores',
      'success',
      'top',
      4000
    );
    return;
  }

  async tomarFoto() {
    if (Capacitor.getPlatform() === 'web') {
      this.fotoPreview =
        `${environment.supabaseStorageUrl}foto-usuario/user-placeholder.png`;
      this.form.patchValue({
        foto: this.fotoPreview,
      });
      return;
    }

    let fotoNueva!: String | null | Photo;
    fotoNueva = await this.camaraSvc.tomarFotoCelular();
    if (fotoNueva) {
      this.fotoPreview = Capacitor.convertFileSrc(fotoNueva.path!);
      this.form.patchValue({
        foto: fotoNueva.path,
      });
    }
  }


    private enviarNotificacion(){
      var notificacion: INotification = {
        title: 'Nuevo usuario en espera de aprobación.',
        body: `El usuario ${this.form.controls.nombre.value}
         ${this.form.controls.nombre.value} se encuentra en espera de aprobación.`,
        data:{url: '/control'},
        segments: ["dueño"]
      }
    var idCanal: string = environment.oneSignalAvisoChannel
    
    this.notificacionSvc.enviarNotificacion(notificacion, idCanal)
    
    }
    
  }



