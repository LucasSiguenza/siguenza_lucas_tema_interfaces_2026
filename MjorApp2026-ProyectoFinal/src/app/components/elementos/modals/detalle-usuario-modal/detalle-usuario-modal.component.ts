import { TitleCasePipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel,
  ModalController
 } from "@ionic/angular/standalone";
 import { FormatoFechaPipe } from 'src/app/pipes/formato-fecha-pipe';
import { UsuarioSb } from 'src/app/services/usuario-sb';


@Component({
  selector: 'app-detalle-usuario-modal',
  templateUrl: './detalle-usuario-modal.component.html',
  styleUrls: ['./detalle-usuario-modal.component.scss'],
    imports: [IonLabel, IonItem, IonList, IonContent, IonButton, IonButtons, IonTitle, IonToolbar, IonHeader,
  FormatoFechaPipe, TitleCasePipe],
})
export class DetalleUsuarioModalComponent  implements OnInit {
  private userSvc = inject(UsuarioSb);
  private modalCtrl = inject(ModalController)
  protected usuario = this.userSvc.usrSeleccionado();
  
  
  cerrarModal(){
    this.userSvc.usrSeleccionado.set(null);
    this.modalCtrl.dismiss('cancel');
  }
  constructor() { }

  ngOnInit() {}

}
