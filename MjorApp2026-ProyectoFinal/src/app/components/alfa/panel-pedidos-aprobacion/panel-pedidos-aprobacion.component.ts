import { Component, computed, inject, Input, OnDestroy, OnInit, Signal, signal, ViewChild } from '@angular/core';
import { IonCard, IonButton, IonButtons, IonCardHeader, IonIcon, IonCardTitle, IonCardContent, IonBadge, IonText, IonTitle } from "@ionic/angular/standalone";
import { NombreProductoPipe } from 'src/app/pipes/nombre-producto-pipe';
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { Util } from 'src/app/services/util';
import { PedidoSb } from 'src/app/services/pedido-sb';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { Usuario } from 'src/app/models/usuario';
import { DetallePedido, Pedido } from 'src/app/models/Pedido';
import { addIcons } from 'ionicons';
import { FormatoFechaPipe } from 'src/app/pipes/formato-fecha-pipe';
import { checkmarkCircleOutline, checkmarkOutline, chevronBackOutline, chevronForwardOutline, trash } from 'ionicons/icons';
import { ControladorPedidoComponent } from "../controlador-pedido/controlador-pedido.component";
import { ListaDetallePedidoComponent } from "../lista-detalle-pedido/lista-detalle-pedido.component";
import { MapaComponent } from "../../gama/mapa/mapa.component";
import { DuracionMinutosPipe } from 'src/app/pipes/duracion-minutos-pipe';
import { NotificationService } from 'src/app/services/notification.service';
import { ChatService } from 'src/app/services/chat-service';



@Component({
  selector: 'app-panel-pedidos-aprobacion',
  templateUrl: './panel-pedidos-aprobacion.component.html',
  styleUrls: ['./panel-pedidos-aprobacion.component.scss'],
  imports: [IonTitle, IonText, IonBadge, IonCardContent, IonCardTitle, IonIcon,
    IonButton, IonCard, IonCardHeader, IonButtons, TitleCasePipe, FormatoFechaPipe, 
    ListaDetallePedidoComponent, MapaComponent, DuracionMinutosPipe],
  standalone: true,
})
export class PanelPedidosAprobacionComponent{
  //! ======================= Variables y servicios =======================
  //~ ======================= Servicios 
  private utilSvc = inject(Util);
  private pedidoSvc = inject(PedidoSb);
  protected usrSvc = inject(UsuarioSb);
  private notificacionSvc = inject(NotificationService);
  private chatSvc = inject(ChatService);

  //~ ======================= Propiedades
  
  @Input() isDelivery = false;  
  protected perfil = computed(()=>{
    return this.usrSvc.usrActual()?.perfil
  })

  protected listaFiltrada = computed(() => {
    const perfil = this.perfil();
    const listado = this.pedidoSvc.listaPedidos()
      .filter(p => p.estado !== 'pagado' && p.estado !== 'en mesa' && p.estado !==  'rechazado')
      .sort((a, b) => new Date(a.created_at!).getTime() - new Date(b.created_at!).getTime());

    
    if(perfil !== 'dueño' && perfil !== 'delivery' && perfil !== 'supervisor') return listado.filter((p) => !p.es_delivery)
    
    if(perfil === 'dueño' || perfil === 'supervisor') return listado.filter((p) =>
       p.es_delivery && p.estado === 'espera de aprobación')
    
    if (perfil === 'delivery') {
      return listado.filter((p) =>
        p.es_delivery &&
        (
          p.estado === 'en proceso' ||
          p.estado === 'listo para servir' ||
          p.estado === 'listo para pagar' ||
          p.estado === 'espera confirmación de pago'
        )
      );
    }
    return listado;
  });
 

  //~ ======================= Inicializadores
  constructor() {
    addIcons({chevronBackOutline,chevronForwardOutline,checkmarkCircleOutline,trash,checkmarkOutline});
  }
  
  async ngOnInit() {

    console.log(this.perfil());
    const carga = await this.utilSvc.loading();

    await carga.present();
    await this.pedidoSvc.iniciarCanalPedidos();

    console.log(JSON.stringify(this.listaFiltrada()))

    await carga.dismiss();
  }

  async ngAfterViewChecked(){
  }

  
  //! ======================= Métodos =======================
  //~ ======================= Paginación
  page = signal(1);
  pageSize = 1; 
  
  get paginatedItems(){
    const start = (this.page() - 1) * this.pageSize;
    return this.listaFiltrada().slice(start, start + this.pageSize);
  }
  totalPages(): number {
    return Math.ceil(this.listaFiltrada().length / this.pageSize);
  }
  
  nextPage() {
    if (this.page() < this.totalPages()) this.page.set(this.page() + 1);
  }
  
  prevPage() {
    if (this.page() > 1) this.page.set(this.page() - 1);
  }
  
  //~ ======================= Métodos lógicos


  async confirmarPedido(pdp: Pedido){
    const pedidoConfirmado: Pedido = {
      ...pdp,
    } 

    switch(pedidoConfirmado.estado){
      case 'rechazado':
        pedidoConfirmado.estado = 'en proceso'
        break;
      case 'espera de aprobación':
        const detalles =  pedidoConfirmado.detalles?.map( (dp) => {
          const isCocina = dp.tipo !== 'bebida';
          const mensaje = `Se le encarga preparar ${dp.cantidad} ${dp.nombreProducto}`
          this.notificacionSvc.emitirNotificacion('¡Nuevo encargo!', mensaje, '/control'
              ,`${isCocina ? 'cocinero': 'bartender'}`);
          dp.estado_producto = 'en proceso';
         return dp;
        }
        )
        pedidoConfirmado.detalles = detalles;
        pedidoConfirmado.estado = 'en proceso'
        break;
      case 'listo para servir':
        pedidoConfirmado.estado = 'en camino'
        this.chatSvc.chatID.set(pedidoConfirmado.uid_cliente)
        await this.chatSvc.sendMessage(this.usrSvc.usrActual()?.uid!, `¡Su pedido ya se encuentra en camino! Estará dentro de  ${Math.ceil(parseFloat(pedidoConfirmado.tiempoEstimado!))} minutos en su domicilio.`);
        break;
      case 'espera confirmación de pago':
        const mensaje = `El pedido N°${pedidoConfirmado.id} correspondiente a ${pedidoConfirmado.nombreCliente} se encuentra pagado.`
        await this.notificacionSvc.emitirNotificacion(`Pedido N°${pedidoConfirmado.id} pagado.`,
          mensaje, `/descargar/${pedidoConfirmado.id}/${pedidoConfirmado.propina}`,'dueño');
        pedidoConfirmado.estado = 'pagado'
        break;
    }

    const carga = await this.utilSvc.loading();
    await carga.present();
    try {
      await this.pedidoSvc.actualizarPedido(pedidoConfirmado);
      await this.utilSvc.mostrarToast('¡Pedido actualizado con éxito!', 'success','middle',100);
    } catch (e) {
      await this.utilSvc.mostrarToast('Algo salió mal.', 'error','middle',100);
    } finally{
      await carga.dismiss()
    }
  }

  async rechazarPedido(pdp: Pedido){
    const pedidoRechazado: Pedido = {
      ...pdp,
      estado: 'rechazado'
    } 
    const carga = await this.utilSvc.loading();
    await carga.present();
    try {
      if(pedidoRechazado.es_delivery){
        await this.pedidoSvc.eliminarPedido(pedidoRechazado);
        await this.utilSvc.mostrarToast('Pedido rechazado con éxito.', 'warning','middle',100);
        return;
      }

      await this.pedidoSvc.actualizarPedido(pedidoRechazado);
      await this.utilSvc.mostrarToast('Pedido rechazado con éxito.', 'warning','middle',100);
    } catch (e) {
      await this.utilSvc.mostrarToast('Algo salió mal.', 'error','middle',100);
    } finally{
      await carga.dismiss()
    }
  }

  getStatusColor(estado: Pedido['estado']): 'warning' | 'tertiary' | 'success' | '' {
  switch (estado) {
    case 'listo para servir':
      return 'success'
    case 'espera de aprobación':
      return 'warning';
    case 'listo para pagar':
      return 'tertiary'
    default:
      return '';
  }
}

}
