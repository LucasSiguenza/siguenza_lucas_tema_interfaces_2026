import { Component, inject, signal, Signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Util } from 'src/app/services/util';
import {
  IonContent,
  IonGrid,
  IonRow,
  IonCol,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButton, IonInput } from '@ionic/angular/standalone';
import { Photo } from '@capacitor/camera';
import { CamaraService } from 'src/app/services/camara-service';
import { environment } from 'src/environments/environment';
import { Capacitor } from '@capacitor/core';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { InputMjorComponent } from "src/app/components/elementos/input-mjor/input-mjor.component";
import { AnonUsuario } from 'src/app/models/UsuarioAnonimo';


@Component({
  selector: 'app-login-anonimo',
  templateUrl: './login-anonimo.page.html',
  styleUrls: ['./login-anonimo.page.scss'],
  standalone: true,
  imports: [ IonButton, IonCardContent, IonCardTitle, IonCardHeader, IonCard, IonCol, IonRow, IonGrid, IonContent,
    CommonModule, FormsModule, ReactiveFormsModule, InputMjorComponent],})
export class LoginAnonimoPage {

  private utilSvc = inject(Util);
  private fotoSvc = inject(CamaraService)
  private userSvc = inject(UsuarioSb);

  protected fotoPreview= signal<string | undefined>(`assets/camara.png`)


  formulario = new FormGroup({
    nombre: new FormControl('', [Validators.required, Validators.minLength(3)]),
    foto: new FormControl('', [Validators.required]),
  });

  async ingresar(){
    if(this.formulario.invalid){
      this.utilSvc.mostrarToast('Rellene correctamente los campos','error','middle',200)
      return
    }
    const carga = await this.utilSvc.loading();

    
    
    
    const usr: AnonUsuario ={
      foto: this.formulario.controls.foto.value!,
      nombre: this.formulario.controls.nombre.value!,
    }
    
    await carga.present()
    try{
      await this.userSvc.ingresarAnonimo(usr);
      this.utilSvc.mostrarToast('¡Ingreso exitoso!', 'success', 'middle', 500);
      this.utilSvc.redirigir('/cliente');
    } catch(e){
      this.utilSvc.mostrarToast('¡Hubo un error!', 'error', 'middle', 500);
      console.log((e as Error).message);
    }finally{
      await carga.dismiss()
    }

    
  }

  async sacarFoto() {
    (document.activeElement as HTMLElement)?.blur();
    if(Capacitor.getPlatform() === 'web'){
      this.formulario.patchValue({ foto: this.fotoPreview()});
      await this.utilSvc.mostrarToast("Felicidades, foto tomada",'success');
      return
    }
    const carga = await this.utilSvc.loading();
    try {
        await carga.present()
        const foto = await this.fotoSvc.tomarFotoCelular();

        //* Caso 1: el usuario cierra la cámara o cancela
        if (!foto) {
          this.utilSvc.mostrarToast(
            'Acción cancelada: no se tomó ninguna foto.',
            'info',
            'middle'
          );
          await carga.dismiss()
          return;
        }

        //* Caso 2: el plugin devuelve un objeto vacío o sin rutas válidas
        if (!foto.webPath) {
          this.utilSvc.mostrarToast(
            'No se pudo obtener la foto. Intente nuevamente.',
            'error',
            'middle'
          );
          await carga.dismiss()
          return;
        }
        
        //* Caso 3: todo correcto → actualizar señal y formulario
        this.fotoPreview.set(foto.webPath as string);
        this.formulario.patchValue({ foto: foto.path });
        this.utilSvc.mostrarToast('¡Foto tomada!', 'success', 'middle');
        await carga.dismiss()
      }
      
      //* Caso 4: error interno del plugin, permisos o excepciones no controladas
      catch (error) {
        const mensaje =
        error instanceof Error
        ? error.message
        : 'Ocurrió un error inesperado al intentar tomar la foto.';
        
        if (String(mensaje).toLowerCase().includes('permission')) {
          this.utilSvc.mostrarToast(
            'No se otorgaron permisos para usar la cámara.',
            'info',
            'middle'
          );
        } else if (String(mensaje).toLowerCase().includes('cancel')) {
          this.utilSvc.mostrarToast(
            'Captura cancelada por el usuario.',
            'info',
            'middle'
          );
        } else {
          this.utilSvc.mostrarToast(mensaje, 'error', 'middle');
        }
        
        await carga.dismiss()
        console.error('[sacarFoto] Error capturado:', error);
      }
    }

}
