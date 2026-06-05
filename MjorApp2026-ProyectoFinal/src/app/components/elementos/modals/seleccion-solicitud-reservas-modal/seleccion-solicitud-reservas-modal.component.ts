import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton, ModalController } from "@ionic/angular/standalone";
import { Util } from 'src/app/services/util';

@Component({
  selector: 'app-seleccion-solicitud-reservas-modal',
  templateUrl: './seleccion-solicitud-reservas-modal.component.html',
  styleUrls: ['./seleccion-solicitud-reservas-modal.component.scss'],
  imports: [IonButton, IonCardContent, IonCardTitle, IonCardHeader, IonCard, RouterLink],
})
export class SeleccionSolicitudReservasModalComponent  implements OnInit {

  private utilSvc = inject(Util);
  private modalCtrl = inject(ModalController);

  constructor() { }
  
  ngOnInit() {}
  
  abrirListaEspera(){
    this.modalCtrl.dismiss(null, 'solicitar')
  }

  cancelar(){
    this.modalCtrl.dismiss(null, 'cancel');
  }

  ngOnDestroy(): void {
    this.modalCtrl.dismiss();
  }
}
