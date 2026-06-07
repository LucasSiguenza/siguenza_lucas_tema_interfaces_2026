import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { IonContent, IonGrid, IonRow, IonCol, IonCard, IonCardHeader, 
  IonCardTitle, IonCardContent, IonInputPasswordToggle, IonButton, IonInput, IonText } from "@ionic/angular/standalone";
import { RouterModule } from '@angular/router';
import { Util } from 'src/app/services/util';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { InputMjorComponent } from "src/app/components/elementos/input-mjor/input-mjor.component";
import { SupabaseService } from 'src/app/services/supabase-service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
imports: [ IonButton, IonCardContent, IonCardTitle, IonCardHeader,
    IonCard, IonCol, IonRow, IonGrid, IonContent,
    ReactiveFormsModule, CommonModule, FormsModule, RouterModule, MatButtonModule, MatMenuModule, InputMjorComponent],})


export class LoginPage {
 protected mostrarAccesoRapido= signal(false);
  
  //! =============== Form ===============

   protected formulario = new FormGroup({
    email: new FormControl('', [Validators.required, Validators.email]),
    contrasenia: new FormControl('', [Validators.required, Validators.minLength(6)])
  });

  //! =============== Servicios ===============  
  private utilSvc = inject(Util);
  private userSvc = inject(UsuarioSb);
  private supabaseSvc = inject(SupabaseService);


  //! =============== Funciones ===============
  async login() {
    const carga = await this.utilSvc.loading()
    await carga.present();
    try {
      
      if(this.formulario.invalid){
        this.utilSvc.mostrarToast('Rellene bien los segmentos','info','middle')
        this.formulario.markAllAsTouched();
        await carga.dismiss();
        return;
      }
      
      const {email, contrasenia} = this.formulario.getRawValue();
      
      await this.userSvc.iniciarSesion(email!, contrasenia!);
      
      if(this.userSvc.usrActual()?.estado){
        await this.utilSvc.mostrarToast('Sesión iniciada correctamente','success','middle');
      } else{
        await this.utilSvc.mostrarToast('Debe esperar a ser aprobado por nuestro supervisor.','info','middle');
        return;
      }

      if(this.userSvc.usrActual()?.perfil !== 'cliente'){
        await this.utilSvc.redirigir('/control')
        return;
      } 
      if(this.userSvc.usrActual()?.perfil === 'cliente'){
        await this.utilSvc.redirigir('/cliente')
        return
      } 

      await this.utilSvc.mostrarToast('No se ha podido identificar al usuario, ingreso denegado.', 'error', 'middle',5000)
    } catch(e){
      this.utilSvc.mostrarToast(`No se pudo ingresar.`);
    } finally{
      await carga.dismiss()
    }
  }

  async loginOAuth(){
    const carga = await this.utilSvc.loading()
    await carga.present();
    try{

     await this.userSvc.iniciarSesionOAuth('github');

     if(this.userSvc.usrActual()?.perfil !== 'cliente'){
        await this.utilSvc.redirigir('/control')
        return;
      } 
      if(this.userSvc.usrActual()?.perfil === 'cliente'){
        await this.utilSvc.redirigir('/cliente')
        return
      } 

    } catch(e){
      
    } finally{
      await carga.dismiss();
    }
  }
  autocompletar(email: string, password: string)
  {
    this.cambiarVisibilidadDelAccesoRapido();
    return this.formulario.setValue({
    email: email,
    contrasenia: password
    })
  }

  protected cambiarVisibilidadDelAccesoRapido()
  {
    this.mostrarAccesoRapido.set(!this.mostrarAccesoRapido());
  }

}
