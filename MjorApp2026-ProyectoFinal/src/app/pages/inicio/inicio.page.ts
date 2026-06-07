import { Component, inject, OnInit } from '@angular/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonButton } from '@ionic/angular/standalone';
import { Util } from 'src/app/services/util';
import { defineCustomElements } from '@ionic/core/loader';
import { RouterLink } from '@angular/router';
import { PedidoSb } from 'src/app/services/pedido-sb';
import { UbicacionService } from 'src/app/services/ubicacion-service';


@Component({
  selector: 'app-inicio',
  templateUrl: './inicio.page.html',
  styleUrls: ['./inicio.page.scss'],
  standalone: true,
  imports: [IonButton, IonCardContent, IonCardTitle,
     IonCardHeader, IonCard, IonContent, CommonModule, FormsModule]
})
export class InicioPage implements OnInit {
  protected pedidoSvc = inject(PedidoSb);
  protected ubicacionSvc = inject(UbicacionService);

  private utilSvc = inject(Util);
  protected isTesting: boolean = false;
  
  constructor()
  {
    defineCustomElements(window);
    setTimeout(
      () => 
      {
        const segments = document.querySelectorAll('ion-segment');
        segments.forEach(seg => seg.value = seg.value); 
      }, 50);
  }

  async ngOnInit()
  {
    await this.pedidoSvc.iniciarCanalPedidos()
    await this.ubicacionSvc.obtenerUbicacionActual();
    const status = await PushNotifications.checkPermissions();
    if (status.receive != 'granted')
    {
      PushNotifications.requestPermissions();
    }
  }

  async irUsuario() {
    
    this.utilSvc.redirigir('/login-usuario');
    
  }
  async test() {
    this.utilSvc.redirigir('test');
  }

  async irAnonimo(){
    this.utilSvc.redirigir('/login-anonimo');
  }

  irRegistro(){
    this.utilSvc.redirigir('/registro')
  }


}
