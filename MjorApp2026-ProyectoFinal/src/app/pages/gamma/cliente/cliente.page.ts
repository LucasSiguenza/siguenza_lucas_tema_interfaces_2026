import { Component, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonButton, ModalController, IonIcon, IonFab, IonFabButton, IonText } from '@ionic/angular/standalone';
import { HeaderComponent } from "src/app/components/alfa/header/header.component";
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { LectorQrService } from 'src/app/services/lector-qr-service';
import { ListaEsperaSb } from 'src/app/services/lista-espera-sb';
import { Util } from 'src/app/services/util';
import { MesasSb } from 'src/app/services/mesas-sb';
import { environment } from 'src/environments/environment';
import { FormularioIngresoListEsperaModalComponent } from 'src/app/components/elementos/modals/formulario-ingreso-list-espera-modal/formulario-ingreso-list-espera-modal.component';
import { ListEsperaUsuario } from 'src/app/models/UsuarioListaEspera';
import { addIcons } from 'ionicons';
import { calendarOutline, chatbubbleEllipsesOutline, fastFood } from 'ionicons/icons';
import { PedidoSb } from 'src/app/services/pedido-sb';
import { ReservaSb } from 'src/app/services/reserva-sb';
import { DateTime } from 'luxon';
import { FormularioDeliveryModalComponent } from 'src/app/components/elementos/modals/formulario-delivery-modal/formulario-delivery-modal.component';
import { INotification } from 'src/app/services/notification';
import { NotificationService } from 'src/app/services/notification.service';
import { SeleccionSolicitudReservasModalComponent } from 'src/app/components/elementos/modals/seleccion-solicitud-reservas-modal/seleccion-solicitud-reservas-modal.component';

@Component({
  selector: 'app-cliente',
  templateUrl: './cliente.page.html',
  styleUrls: ['./cliente.page.scss'],
  standalone: true,
  imports: [IonFabButton, IonFab, IonButton, CommonModule,
    FormsModule, HeaderComponent, IonContent, IonIcon]
})
export class ClientePage implements OnInit {
  private modalCtrl = inject(ModalController);
  protected usrSvc = inject(UsuarioSb)
  protected lectorQR = inject(LectorQrService);
  private lespSvc = inject(ListaEsperaSb);
  protected utilSvc = inject(Util);
  protected mesaSvc = inject(MesasSb);
  private pedidoSvc = inject(PedidoSb);
  private reservaService = inject(ReservaSb);
  private notifSvc = inject(NotificationService)
  
  protected esPedidoDelivery = computed(()=> this.pedidoSvc.usuarioPedidoActual()?.es_delivery ? true : false);
  protected mostrarDelivery = computed(()=> { 
    const estado = this.pedidoSvc.usuarioPedidoActual()?.es_delivery
    if(this.mesaSvc.mesaDelUsuario() !== null) return false;
    if(estado === false) return false;
    if(estado === undefined) return true;
    return estado;
  }) 
  mesaUsuario = this.mesaSvc.mesaDelUsuario();

  async ngOnInit() {

    const carga = await this.utilSvc.loading();
    await carga.present()
    await this.usrSvc.recuperarSesion();
    await this.pedidoSvc.iniciarCanalPedidos();
    await this.mesaSvc.iniciarTRMesas();
    console.log(this.usrSvc.usrAuth()?.is_anonymous);
    console.log(this.mostrarDelivery());
    await carga.dismiss()
  }

  constructor(){
    addIcons({chatbubbleEllipsesOutline, calendarOutline});
  }

  async cosasWeb(){
    if(this.mesaSvc.mesaDelUsuario() === null && !this.mostrarDelivery()){

        const { cantidad, tipo } = await this.abrirReserva();
        const usrLE: ListEsperaUsuario = {
        cantidad: cantidad,
        tipo_solicitado: tipo,
        usuario: this.usrSvc.usrActual()?.uid as string,
        is_anonimo: false,
        nombre_usuario: `${this.usrSvc.usrActual()?.nombre} ${
          this.usrSvc.usrActual()?.apellido
        }`,
        foto: this.usrSvc.usrActual()?.foto as string,
      };
      await this.lespSvc.agregarListEsperaUsuario(usrLE);
      this.utilSvc.mostrarToast('Agregado con éxito', 'success');
    } 
    else{
      switch(this.pedidoSvc.usuarioPedidoActual()?.estado){
        case 'listo para servir':
        case 'en mesa':
        case 'listo para pagar':
        case 'en camino':
        case 'en proceso':
          return await this.utilSvc.redirigir(`cliente/mesa/${this.mesaSvc.mesaDelUsuario()?.id}`);
          case 'espera confirmación de pago':
            return await this.utilSvc.redirigir('/cliente/cuenta')
        case 'espera de aprobación':            
        case 'rechazado':
          return await this.utilSvc.redirigir('/carta')
        case undefined:
          break;
        }
    }
  }
  protected async navegar() {
    if(this.utilSvc.isWeb()){
      await this.cosasWeb()
    }
    if(this.mostrarDelivery()) await this.cosasWeb();
    const barcodes = await this.lectorQR.scan();
    new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 1000)
    )
    
    if (barcodes![0].rawValue != null) {
      const qrValue = barcodes![0].rawValue;

      //? Obtener ID del usuario (registrado o anónimo)
      const usuario = this.usrSvc.usrActual();
      let mesaUsuario = this.mesaSvc.mesaDelUsuario();


      //* Acá hago la confirmación de asignación de mesa, reemplaza el bloque próximo,
      //* igual por si las dudas dejen el otro código como está.
      //* -Dzisko
      let regEx = qrValue.search(/^\/cliente\/mesa/i);
      if ( regEx != -1)
      {
        var idMesa = qrValue.match(/\d+$/)![0];
        var isMesaDelCliente: boolean = mesaUsuario !== null;
        
        if (usuario == null) await this.usrSvc.recuperarSesion();

        if (mesaUsuario === null)
        {
          this.reservaService.refrescarListaReservas("aprobadas");
          var reservaDelCliente = this.reservaService.revisarSiMesaEstaReservada(DateTime.utc());
          if (reservaDelCliente == null)
          {
            this.utilSvc.mostrarToast( 'Aún no tiene una mesa asignada. Espere a que el maître le asigne una.', 
            'info', 'middle', 2000);
          }
          else
          {
            const mesaReservada = reservaDelCliente.mesas!;

            if(mesaReservada.id != parseInt(idMesa))
            {
              this.utilSvc.mostrarToast(`Su mesa asignada es la ${mesaReservada.numero}.`,
                'info', 'middle',2000);
              return;
            }

            isMesaDelCliente = true;            
            //* asignar mesa en DB
            mesaReservada.usuario_asignado = `${usuario?.nombre} ${usuario?.apellido}`
            mesaReservada.usuario_es_anonimo = "no";
            mesaReservada.usuario_id = usuario?.uid;
            await this.mesaSvc.editarMesa(mesaReservada);

            mesaUsuario = mesaReservada;

            //* actualizar reserva a 'registrada'
            reservaDelCliente.estado = "registrada";
            await this.reservaService.actualizarReserva(reservaDelCliente);
          }



        } else if(mesaUsuario?.id != parseInt(idMesa))
        {
          this.utilSvc.mostrarToast(`Ya tiene la mesa ${mesaUsuario!.numero} asignada. No puede acceder a otra mesa.`,
            'info', 'middle',2000);
          return;
        }

        if (isMesaDelCliente)
        {
          switch(this.pedidoSvc.usuarioPedidoActual()?.estado){
          case 'listo para servir':
          case 'en mesa':
          case 'listo para pagar':
          case 'en camino':
          case 'en proceso':
            return await this.utilSvc.redirigir(`cliente/mesa/${mesaUsuario?.id}`);
          case 'espera de aprobación':            
          case 'rechazado':
          case undefined:
            return await this.utilSvc.redirigir('/carta')
          case 'espera confirmación de pago':
            let regEx2 = qrValue.search(/^\/cliente\/cuenta/i);
            if ( regEx2 != -1)
            {        
              this.utilSvc.redirigir(qrValue);
              return;
            }
          }
        }
      }

      let regEx2 = qrValue.search(/^\/cliente\/cuenta/i);
      if ( regEx2 != -1)
      {        
        this.utilSvc.redirigir(qrValue);
        return;
      }

      // Manejo de otros QRs (menú, lista de espera)
      switch (qrValue) {
        case 'listadeespera':

          const modal = await this.utilSvc.crearModal(SeleccionSolicitudReservasModalComponent
          ,'sm',{}, true)
          
          const {role} = await modal.onDidDismiss();

          if(role === 'solicitar'){

            if (mesaUsuario === null) {
              const { cantidad, tipo } = await this.abrirReserva();
              const usrLE: ListEsperaUsuario = {
                cantidad: cantidad,
                tipo_solicitado: tipo,
                usuario: this.usrSvc.usrActual()?.uid as string,
                is_anonimo: false,
                nombre_usuario: `${this.usrSvc.usrActual()?.nombre} ${
                  this.usrSvc.usrActual()?.apellido
                }`,
                foto: this.usrSvc.usrActual()?.foto as string,
              };
              await this.lespSvc.agregarListEsperaUsuario(usrLE);
              this.utilSvc.mostrarToast('¡Ya se encuentra en la lista de espera!', 'success');
              this.enviarNotificacionMaitre(usrLE.nombre_usuario);
              return;
            }else{
              this.utilSvc.mostrarToast('¡Usted ya tiene una mesa asignada!', 'error');
            }
          } else if(role === 'cancel'){
            this.utilSvc.mostrarToast('Acción cancelada', 'info');
          }
          break;

        default:
          this.utilSvc.mostrarToast('Código QR no reconocido', 'info');
          break;
      }
    }
  }
  async irAlChat(){
    await this.utilSvc.redirigir('chat')
  }

  async irReservarMesa(){
    await this.utilSvc.redirigir('reservar-mesa')
  }

  async abrirReserva() {
    const modal = await this.modalCtrl.create({
      component: FormularioIngresoListEsperaModalComponent,
      cssClass: 'mi-modal-clase', // opcional para overrides globales
      backdropDismiss: false,
    });
    await modal.present();
    const { data, role } = await modal.onDidDismiss();
    if (role === 'confirm' && data) {
      console.log('Reserva ok', data);
      return data;
    }
    return null;
  }



  async abrirFormularioDelivery(){
    const modal = await this.utilSvc.crearModal(FormularioDeliveryModalComponent, 'sm',{},true);
    const {data, role} = await modal.onDidDismiss()
    if(role === 'cancel') await this.utilSvc.mostrarToast('Acción cancelada', 'error','middle',100)
  }

  async enviarNotificacionMaitre(nombreCliente: string) {
    const notification: INotification = {
      title: 'Nuevo cliente en espera',
      body: `${nombreCliente} se ha unido a la lista de espera.`,
      data: {url: '/control'},
      segments: ['dueño'],
    };

    try {
      await this.notifSvc.enviarNotificacion(notification,
                          environment.oneSignalAvisoChannel);
    } catch (error) {
      console.error('Error enviando notificación al maitre:', error);
    }
  }
}

