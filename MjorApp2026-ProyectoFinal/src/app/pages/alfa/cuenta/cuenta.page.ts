import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule, TitleCasePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonCardContent, IonCardSubtitle, IonCardTitle,IonButton,
   IonCard, IonCardHeader, IonHeader, IonToolbar, IonTitle, IonIcon } from '@ionic/angular/standalone';
import { NombreProductoPipe } from 'src/app/pipes/nombre-producto-pipe';
import { addIcons } from 'ionicons';
import { Util } from 'src/app/services/util';
import { PedidoSb } from 'src/app/services/pedido-sb';
import { MesasSb } from 'src/app/services/mesas-sb';
import { environment } from 'src/environments/environment';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { ControladorPedidoComponent } from "src/app/components/alfa/controlador-pedido/controlador-pedido.component";
import { cashOutline, qrCodeOutline } from 'ionicons/icons';
import { ActivatedRoute } from '@angular/router';
import { Pedido } from 'src/app/models/Pedido';
import { EmailService } from 'src/app/services/email-service';
import { Mesa } from 'src/app/models/Mesa';
import { TicketPedidoComponent } from 'src/app/components/alfa/ticket-pedido/ticket-pedido.component';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-cuenta',
  templateUrl: './cuenta.page.html',
  styleUrls: ['./cuenta.page.scss'],
  standalone: true,
  imports: [IonIcon, IonButton, IonCard, IonContent, ControladorPedidoComponent]
})
export class CuentaPage implements OnInit {

  //! ======================= Variables y servicios =======================
  //~ ======================= Servicios 


  private emailSvc = inject(EmailService); //NO BORRAR
  private utilSvc = inject(Util);
  protected pedidoSvc = inject(PedidoSb);
  private mesaSvc = inject(MesasSb);
  private usuariosSvc = inject(UsuarioSb);
  protected route = inject(ActivatedRoute);
  private notificacionSvc = inject(NotificationService);


  //~ ======================= Propiedades
  protected showConfirmacion= signal<boolean>(false);
  protected showExito = signal<boolean>(false);
  protected gradoSatisfaccion: string = '';
  protected propina: string = '99';
  protected valorPropina: number = 0;
  protected descuento: number = 0;
  protected isAnon: boolean = false;
  protected storageURL = environment.supabaseStorageUrl;

  protected pedido = this.pedidoSvc.usuarioPedidoActual!;

  //~ ======================= Inicializadores
  
    constructor() {
      addIcons({cashOutline});
     }
  
    async ngOnInit() {
      if(this.pedido()?.estado === 'espera confirmación de pago'){return this.showExito.set(true)}

      
      this.propina = this.route.snapshot.paramMap.get('propina')!;

      if(this.usuariosSvc.usrActual() === null){
        await this.usuariosSvc.recuperarSesion();
        await this.pedidoSvc.iniciarCanalPedidos();
        await this.mesaSvc.iniciarTRMesas();
      }

      if(this.pedido()?.estado === 'listo para pagar'){
        this.isAnon = this.usuariosSvc.usrActual()?.is_anonimo === 'si' 
        switch (this.propina){
          case '0':
            return this.gradoSatisfaccion = 'Malo';
        
          case '5':
            this.gradoSatisfaccion = 'Regular';
            return this.valorPropina = 0.05;

          case '10':
            this.gradoSatisfaccion = 'Bueno';
            return this.valorPropina = 0.10;

          case '15':
            this.gradoSatisfaccion = 'Muy Bueno';
            return this.valorPropina = 0.15;

          case '20':
            this.gradoSatisfaccion = 'Excelente';
            return this.valorPropina = 0.20;
          default:
          return this.gradoSatisfaccion = 'Malo'
        }
      } else{
        return;
      }
    }

    async ngOnChanges(){
      if(this.pedidoSvc.usuarioPedidoActual() === null){
        await this.utilSvc.mostrarAlert('¡Hasta pronto!','Su pago ya ha sido confirmado.')
        await this.utilSvc.redirigir('cliente')
      }
    }
  //! ======================= Métodos =======================
  
  protected async pagarCuenta(){
    const carga = await this.utilSvc.loading();

    await carga.present()
    const pedidoActualizacion: Pedido = {
      ...this.pedido()!,
      propina: this.valorPropina,
      estado : 'espera confirmación de pago'
    }

    const mesaActualizacion: Mesa ={
      ...this.mesaSvc.mesaDelUsuario()!,
      usuario_asignado: 'disponible',
      usuario_es_anonimo: 'disponible',
      usuario_id: 'disponible'
    }

    try{
      const mensaje = `El cliente ${pedidoActualizacion.nombreCliente} espera su confirmación.`
      this.notificacionSvc.emitirNotificacion(`La mesa ${mesaActualizacion.numero} espera confirmación de pago.`, mensaje,
        '/control', ['mozo', 'dueño']);
      await this.pedidoSvc.actualizarPedido(pedidoActualizacion);
      if(!pedidoActualizacion.es_delivery) await this.mesaSvc.editarMesa(mesaActualizacion);
      this.showExito.set(false); 
      this.showConfirmacion .set(true);
      const usuario = this.usuariosSvc.usrActual()
      await this.emailSvc.enviarFactura(usuario,pedidoActualizacion, this.valorPropina);
      await this.utilSvc.redirigir('cliente')
    } catch (e) {
      await this.utilSvc.mostrarToast('¡Algo salió mal durante la operación!', 'error', 'middle', 1500);
      console.log(JSON.stringify(e));
      await carga.dismiss();
    } finally{
      await carga.dismiss();
    }
  }

  //~ ======================= Lógicos
  protected async goToCliente(){
    await this.utilSvc.redirigir('cliente');
  }

}
