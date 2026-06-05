import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonDatetime, IonButton, IonButtons } from '@ionic/angular/standalone';
import { HeaderComponent } from "src/app/components/alfa/header/header.component";
import { Util } from 'src/app/services/util';
import { ReservaSb } from 'src/app/services/reserva-sb';
import { DateTime } from 'luxon';
import { Reserva } from 'src/app/models/Reserva';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { NotificationService } from 'src/app/services/notification.service';

@Component({
  selector: 'app-reservar-mesa',
  templateUrl: './reservar-mesa.page.html',
  styleUrls: ['./reservar-mesa.page.scss'],
  standalone: true,
  imports: [IonButtons, IonButton, IonDatetime, IonContent, CommonModule, FormsModule, HeaderComponent]
})
export class ReservarMesaPage implements OnInit, OnDestroy
{
  //services
  private utils = inject(Util);
  private reservasService = inject(ReservaSb);
  private usuario = inject(UsuarioSb);
  private notificacionSvc = inject(NotificationService);
  
  //properties
  protected fechaMinima: string = "";

  async ngOnInit()
  {
    var spinner = await this.utils.loading();
    spinner.present();

    let fechaHoy = DateTime.utc().minus({ hours: 3 });
    let fechaMinima = fechaHoy.set({minute: 0}).plus({ hours: 12});

    this.fechaMinima = fechaMinima.toISO().toString();

    await this.reservasService.iniciarTrReservas('no registradas');
    
    spinner.dismiss();
  }

  ngOnDestroy()
  {
    this.reservasService.destruirCanalReservas();
  }

  protected test(e: any)
  {
    console.log(e);
  }

  protected async seleccionarFecha(e: any)
  {
    var spinner = await this.utils.loading();
    spinner.present();

    var fechaSeleccionada = DateTime.fromISO(e.detail.value);
    fechaSeleccionada = fechaSeleccionada;
    var fechaSeleccionadaString = fechaSeleccionada.toString();

    let isReservada = this.revisarSiReservaDisponible(fechaSeleccionadaString);

    if (isReservada)
    {
      this.utils.mostrarAlert('Reserva No Disponible', 'Por favor seleccione otra hora u otra fecha')
    } else
    {
      let nuevaReserva: Reserva =
      {
        id_mesa: 29,
        usuario: this.usuario.usrActual()!.uid!,
        fecha_reservada: fechaSeleccionadaString,
        estado: 'pendiente'
      }

      let fechaReserva = DateTime.fromISO(nuevaReserva.fecha_reservada);
      let textoFechaReservada = `${fechaReserva.toFormat('dd/MM/yyyy')} a las ${fechaReserva.hour}h`

      await this.reservasService.agregarReserva(nuevaReserva);
      const mensaje = `El cliente ${this.usuario.usrActual()?.nombre} ${this.usuario.usrActual()?.apellido} ha solicitado una reservación para la fecha ${textoFechaReservada}.`
      await this.notificacionSvc.emitirNotificacion('Se solicita una reserva.', mensaje, '/control', 'dueño');

      await this.utils.mostrarAlert('Reserva Exitosa', 'Su reserva debe ser aprobada. Pronto recibirá un correo electrónico');
    }

    spinner.dismiss();
  }

  private revisarSiReservaDisponible(fechaSeleccionada: string)
  {
    var isReservada: boolean = this.reservasService.listaReservas().some
    (
      reserva => reserva.fecha_reservada == fechaSeleccionada
    );
    
    return isReservada;
  }

  protected irACliente()
  {
    this.utils.redirigir('cliente');
  }
}
