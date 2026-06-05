import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, IonCard, IonCardHeader, IonCardTitle, IonCardContent, IonIcon } from '@ionic/angular/standalone';
import { HeaderComponent } from "src/app/components/alfa/header/header.component";
import { PedidoSb } from 'src/app/services/pedido-sb';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { Util } from 'src/app/services/util';
import { ControladorPedidoComponent } from 'src/app/components/alfa/controlador-pedido/controlador-pedido.component';
import { DetallePedido } from 'src/app/models/Pedido';
import { EncuestaService } from 'src/app/services/encuesta.service';
import { MesasSb } from 'src/app/services/mesas-sb';
import { LectorQrService } from 'src/app/services/lector-qr-service';
import { addIcons } from 'ionicons';
import { qrCodeOutline } from 'ionicons/icons';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-panel-mesa-asignada',
  templateUrl: './panel-mesa-asignada.page.html',
  styleUrls: ['./panel-mesa-asignada.page.scss'],
  standalone: true,
  imports: [IonIcon, IonCardContent, IonCardTitle, IonCardHeader, IonCard,
     IonButton, IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class PanelMesaAsignadaPage implements OnInit {
  //! ================= Variables y servicios =================
  protected pedidoSvc = inject(PedidoSb);
  private mesaSvc = inject(MesasSb);
  protected encuestaSvc = inject(EncuestaService);
  protected usrSvc = inject(UsuarioSb);
  private utilSvc = inject(Util);
  private lectorQR = inject(LectorQrService);
  private notificacionSvc = inject(NotificationService);
  
  
  protected estadoPedido = computed( () =>{
    let estado = this.pedidoSvc.usuarioPedidoActual()?.estado!
    return estado;
  })

  private pedidoActual = this.pedidoSvc.usuarioPedidoActual();
  private mesaActual = this.mesaSvc.mesaDelUsuario(); 

  constructor() { 
    addIcons({qrCodeOutline});
  }


  async ngOnInit() {
    const carga = await this.utilSvc.loading()
    await carga.present()
    await this.usrSvc.recuperarSesion();
    await this.mesaSvc.iniciarTRMesas();
    await this.pedidoSvc.iniciarCanalPedidos();
    await this.encuestaSvc.setSiEncuestaCompletada(await this.pedidoSvc.setUIDPedido());
    await carga.dismiss()
  }

  async ionViewWillEnter()
  {
    await this.encuestaSvc.setSiEncuestaCompletada(await this.pedidoSvc.setUIDPedido());
  }


  //! ================= Métodos =================

  async comprobarEstadoPedido(){
    const modal = await this.utilSvc.crearModal(ControladorPedidoComponent, 'lg', 
      {pedido: this.pedidoSvc.usuarioPedidoActual!}, false)
  }

  async modificarPedido(){
    const pedido = this.pedidoSvc.usuarioPedidoActual();

    switch(this.estadoPedido()){
      case 'en camino':
        // if(pedido?.es_delivery) pedido.estado = 'listo para pagar';
        pedido!.estado = 'en mesa';
        break;
      case 'en mesa':
        //! Lógica de notificaciones o lqs
        const mensaje = `El cliente ${this.pedidoActual?.nombreCliente} se encuentra listo para pagar`
        this.notificacionSvc.emitirNotificacion(`¡Acuda a la mesa ${this.mesaActual?.numero}!`,
          mensaje, '/control', 'mozo' );
        console.log(JSON.stringify(this.mesaActual))
        pedido!.estado = 'listo para pagar';
        break;
      
    }

    const carga = await this.utilSvc.loading();
    await carga.present();
    try{
      await this.pedidoSvc.actualizarPedido(pedido!);
      this.utilSvc.mostrarToast('¡Pedido actualizado con éxito!', 'success', 'middle', 500)
    } catch(e){
      this.utilSvc.mostrarToast('Algo ha salido mal...', 'error', 'middle', 100)
      console.error(e)
    }finally{
      await carga.dismiss();
    }
  }

  protected irA(ruta: string)
  {
    this.utilSvc.redirigir(ruta);
  }

  protected async escanearQr(){

    if(this.utilSvc.isWeb()){
      return await this.utilSvc.redirigir('cliente/cuenta/10');
    }

    const barcodes = await this.lectorQR.scan();
    new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 1000)
    )

    try {
      if (barcodes![0].rawValue != null) {
        const qrValue = barcodes![0].rawValue;
  
      let regEx2 = qrValue.search(/^\/cliente\/cuenta/i);
  
      if ( regEx2 != -1)
        {        
          this.utilSvc.redirigir(qrValue);
          return;
        } else{
          await this.utilSvc.mostrarToast('No seleccionó un qr de pago.','error','middle',100);
        }

      
      }
    } catch (e) {
      await this.utilSvc.mostrarToast('Acción no realizada', 'info','middle',300)
    }

  }
}
