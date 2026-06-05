import { inject, Injectable, NgZone, signal } from '@angular/core';
import { Router } from '@angular/router';
import { LoadingController, 
  ToastController, AlertController, ModalController
 } from '@ionic/angular/standalone';
import { Location } from '@angular/common';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class Util {
  //! ================== Variables ==================
  private enrutador = inject(Router);
  private cargaCtrl = inject(LoadingController);
  private toastCtrl = inject(ToastController);
  private alertCtrl = inject(AlertController);
  private location = inject(Location);
  private modalCtrl = inject(ModalController)


  isWeb = signal<boolean>(Capacitor.getPlatform() === 'web');

  
  //! ================== Redirección ==================
  async redirigir(ruta: string, sinLoading: boolean = false): Promise<void> {
    this.reproducirSonidoPorDuracion('assets/sonidos/nav.m4a', 1000)
    if (!sinLoading) {
      const carga = await this.loading();
      await carga.present();
      await this.enrutador.navigateByUrl(ruta);
      await carga.dismiss();
      return;
    }

    await this.enrutador.navigateByUrl(ruta);
  }

  public goBack() : void
  {
    this.location.back();
  }


  //! ================== Sonidos ==================
  reproducirSonidoPorDuracion(path: string, duracionMs: number,
    volumen: number = 1
  ): void {
    const audio = new Audio(path);
    audio.volume = volumen;
    audio.currentTime = 0;

    audio.play().catch(() => {});

    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
    }, duracionMs);
  }

  //! ================== Loading ==================
  async loading(): Promise<HTMLIonLoadingElement>{
    const loading = await this.cargaCtrl.create({
      spinner: null,
      translucent: false,
      message: "Cargando...",
      cssClass: 'custom-loading'})
    
    return loading;
  }
  
  //! ================= Alertas ====================
  async mostrarAlert(encabezado: string, mensaje: string | null){  
    const alert = await this.alertCtrl.create({
      header: encabezado,
      message: mensaje ?? '',
      cssClass: 'alert-mjor',
      buttons: [
        {
          text: 'Entendido',
          role: 'confirm'
        }
      ]
    });

    await alert.present();
  }


  /**
   * @param {string} encabezado: Título del alert
   * @param {(string | null)} mensaje: Pregunta o instrucción para el confirm
   * @return {*}  {Promise<boolean>} 
   */
  async mostrarConfirmAlert(encabezado: string, mensaje: string | null): Promise<boolean>
  {
    const alert = await this.alertCtrl.create({
      header: encabezado,
      message: mensaje ?? '',
      cssClass: 'alert-mjor',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Confirmar',
          role: 'confirm'
        }
      ]
    });

    await alert.present();

    const resultado = await alert.onDidDismiss();

    return resultado.role === 'confirm';
  }

  //! ================== Toast ==================
  async mostrarToast(mensaje: string,
    tipo: ('success' | 'error' | 'info' | 'warning' | 'dark') = 'dark',
    posicion: 'top' | 'middle' | 'bottom' = 'top',
    duracion: number = 1500
  ){
    const mapaColor = {
      success: 'success',
      error: 'danger',
      info: 'primary',
      warning: 'warning',
      dark: 'medium'
    } as const;

    const tipoAsig = mapaColor[tipo];
    
    const toast = await this.toastCtrl.create({
      color: tipoAsig,
      duration: duracion,
      message: mensaje,
      position: posicion,
      cssClass: 'ion-text-center'
    }
    )
    return toast.present();
  }

  //! ================== Modals ==================
  async crearModal(component: any, size: 'sm' | 'md' | 'lg'|'full', 
    data?: Record<string, any>, dismissBackdrop: boolean = true, cssClassExtra?: string) {
    const clases: string[] = ['gm-modal', `gm-modal-${size}`];

    if (cssClassExtra) {
      clases.push(cssClassExtra);
    }

    const modal = await this.modalCtrl.create({
      component: component,
      componentProps: data ?? {},
      backdropDismiss: dismissBackdrop,
      cssClass: clases
    });
    await modal.present();
    
    return modal;
  }
  
}
