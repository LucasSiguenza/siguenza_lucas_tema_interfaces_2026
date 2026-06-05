import { App } from '@capacitor/app';
import { Component, inject, OnInit } from '@angular/core';
import { Util } from 'src/app/services/util';
import { IonHeader, IonToolbar, IonLabel, IonButtons,IonButton, IonTitle,
   ModalController, IonRouterOutlet, IonIcon } from "@ionic/angular/standalone";
import { Router, RouterLink } from '@angular/router';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { addIcons } from 'ionicons';
import { arrowBackCircleOutline, closeCircleOutline, logOutOutline } from 'ionicons/icons';
import { MesasSb } from 'src/app/services/mesas-sb';
import { PedidoSb } from 'src/app/services/pedido-sb';
import { ListaEsperaSb } from 'src/app/services/lista-espera-sb';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [IonIcon, IonButtons, IonLabel, IonToolbar, IonHeader, IonButton],
})
export class HeaderComponent  implements OnInit {

 private noise: any;

  //!================== Servicios y variables==================
  private utilSvc = inject(Util)
  protected userSvc = inject(UsuarioSb);
  private mesaSvc = inject(MesasSb);
  private pedidoSvc = inject(PedidoSb);
  private listaEsperaSvc = inject(ListaEsperaSb);
  private router = inject(Router)
  protected estoyEnControlOCliente = this.router.url === '/control' || this.router.url === '/cliente'


  constructor(){
    addIcons({logOutOutline, arrowBackCircleOutline, closeCircleOutline})
  }
//!================== Métodos ==================

  //? Botón de cerrar sesión
  async cerrarSesion(){
    this.destruirCanales();
    await this.userSvc.cerrarSesion();
    this.utilSvc.redirigir('inicio');
  }

  protected async salirDeLaApp()
  {
    this.destruirCanales();
    await App.exitApp();
    this.noise.play();
  }

  ngOnInit(): void
  {
    this.noise = new Audio();
    this.noise.src = '../../../assets/sounds/8-bit_failure.ogg';
    this.noise.load();
  }

  protected volver()
  {
    if(this.estoyEnControlOCliente) return
    this.utilSvc.goBack();
  }

  //~ ================= Privados/auxiliares

  destruirCanales(){
    this.mesaSvc.destruirCanalMesas();
    this.userSvc.destruirCanalUsuarios();
    this.pedidoSvc.destruirCanalPedidos();
    this.listaEsperaSvc.destruirCanalListEsperaUsuarios();
  }
}
