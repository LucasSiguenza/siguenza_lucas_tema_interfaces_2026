import { DatePipe } from '@angular/common';
import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { IonIcon, IonButton, IonButtons, IonCard, IonCardHeader, IonCardTitle,
  IonCardContent, IonText, AlertController } from "@ionic/angular/standalone";
import { addIcons } from 'ionicons';
import { addOutline, apertureOutline, buildOutline, checkmarkCircleOutline,
  checkmarkOutline, chevronBackOutline, chevronForwardOutline, trashOutline
} from 'ionicons/icons';
import { Reserva } from 'src/app/models/Reserva';
import { EmailService } from 'src/app/services/email-service';
import { ReservaSb } from 'src/app/services/reserva-sb';
import { Util } from 'src/app/services/util';
import { environment } from 'src/environments/environment';
import { DateTime, Interval } from 'luxon';

@Component({
  selector: 'app-lista-reservas-pendientes',
  templateUrl: './lista-reservas-pendientes.component.html',
  styleUrls: ['./lista-reservas-pendientes.component.scss'],
  imports:
  [
    IonText,
    IonCardContent,
    IonCardTitle,
    IonCardHeader,
    IonCard,
    IonButtons,
    IonButton,
    IonIcon,
    DatePipe
  ],
})
export class ListaReservasPendientesComponent  implements OnInit, OnDestroy
{
  //services
  private utils = inject(Util);
  private reservasService = inject(ReservaSb);
  private emailSvc = inject(EmailService);
  protected alertCtrl = inject(AlertController);

  //properties
  protected page = signal(1);
  protected pageSize = 1;
  protected URLFotos = `${environment.supabaseStorageUrl}foto-usuario/`

  constructor()
  {
    addIcons
    (
      {
        chevronForwardOutline, chevronBackOutline, addOutline, buildOutline,
        apertureOutline, trashOutline, checkmarkCircleOutline, checkmarkOutline
      }
    )
  }

  async ngOnInit()
  {
    await this.reservasService.iniciarTrReservas("pendientes");    
  }

  ngOnDestroy()
  {
    this.reservasService.destruirCanalReservas();  
  }

  get paginatedItems(): Reserva[] {
    const start = (this.page() - 1) * this.pageSize;
    return this.reservasService.listaReservas().slice(start, start + this.pageSize);
  }

  totalPages(): number {
    return Math.ceil(this.reservasService.listaReservas().length / this.pageSize);
  }

  nextPage() {
    if (this.page() < this.totalPages()) this.page.set(this.page() + 1);
  }

  prevPage() {
    if (this.page() > 1) this.page.set(this.page() - 1);
  }

  async cambiarEstadoReserva(reserva: Reserva, nuevoEstado: "aprobada" | "rechazada")
  {
    var mensaje: string  = "";
    switch (nuevoEstado)
    {
      case "aprobada":
        mensaje = `¿Estás seguro de que querés aprobar esta reserva?`
        break;
    
     case "rechazada":
        mensaje = `¿Estás seguro de que querés rechazar esta reserva?`
        break;
    }

    const confirmacion = await this.alertCtrl.create
    (
      {
        header: 'Confirmar',
        message: mensaje,
        buttons: 
        [
          {
            text: 'Cancelar',
            role: 'cancel',
            handler: () => 
            {
              this.utils.mostrarToast('Acción cancelada', 'warning', 'middle', 500);
            }
          },
          {
            text: 'Aceptar',
            handler: async () =>
            {
              const carga = await this.utils.loading();
              carga.present();

              try
              {

                let fechaReserva = DateTime.fromISO(reserva.fecha_reservada);
                fechaReserva = fechaReserva.plus({hour: 3})
                let textoFechaReservada = `${fechaReserva.toFormat('dd/MM/yyyy')} a las ${fechaReserva.hour}hs`

                let nuevaReserva: Reserva =
                {
                  uid: reserva.uid,
                  mesas: reserva.mesas,
                  estado: nuevoEstado,
                  usuario: reserva.usuario,
                  fecha_reservada: reserva.fecha_reservada
                }

                this.reservasService.actualizarReserva(nuevaReserva);

                switch (nuevoEstado)
                {
                  case "aprobada":
                    this.emailSvc.envClienteReservaAprobada(reserva.users!, textoFechaReservada);
                    break;
                
                  case "rechazada":
                    this.emailSvc.envClienteReservaRechazada(reserva.users!, textoFechaReservada);
                    break;
                }

                this.prevPage();
                carga.dismiss();
              } 
              catch(e)
              {
                console.error('Error al aceptar:', e);
                this.utils.mostrarToast('Hubo un error. No se pudo aprobar la reserva.', 'warning','middle',500);   
                carga.dismiss();
              }
            }
          }
        ]
      }
    );
    await confirmacion.present();
  }

}
