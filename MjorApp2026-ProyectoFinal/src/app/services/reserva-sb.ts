import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { RealtimeChannel } from '@supabase/supabase-js';
import { Reserva } from '../models/Reserva';
import { Subscription, timer } from 'rxjs';
import { environment } from 'src/environments/environment';
import { DateTime, Interval } from 'luxon';

@Injectable({
  providedIn: 'root',
})
export class ReservaSb {
 //! =================== Variables y Servicios ===================
 private sbSvc = inject(SupabaseService);


 listaReservas = signal<Reserva[]>([]);
 private subRefresh?: Subscription | null;
 
 //! =================== Canal en tiempo real  ===================
  private canalReservas: RealtimeChannel | null = this.sbSvc.sb.channel('reservas-realtime');
  private isCanalInicializado = false;
  

  async iniciarTrReservas(filtro: "todo" | "pendientes" | "aprobadas" | "no registradas" = "todo")
  {
    if (this.isCanalInicializado) return;
    this.iniciarRefreshReservas(filtro);
    this.isCanalInicializado = true;
    this.canalReservas!
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'reservas'
        },
        (evento) => {
          console.log('Evento realtime reservas recibido:', evento);

          switch (evento.eventType) {
            case 'INSERT':
              setTimeout(()=> {
                  this.refrescarListaReservas(filtro);
              }, 1000);
              break;

            case 'UPDATE':
              setTimeout(()=> {
                  this.refrescarListaReservas(filtro);
              }, 1000);
              break;

            case 'DELETE':
              setTimeout(()=> {
                  this.refrescarListaReservas(filtro);
              }, 1000);
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log("Estado canal realtime Reservas :", status);
      });
  }

  destruirCanalReservas() {
    if (this.canalReservas) {
      this.sbSvc.sb.removeChannel(this.canalReservas);
      this.detenerRefreshReservas();
      this.subRefresh = null;
      this.canalReservas = null;
    }
  }
  
  //! =================== Métodos públicos ===================
 
  async obtenerReserva(uid: string): Promise<Reserva | null>{
    return await this.sbSvc.adquirirFila<Reserva>('reservas','uid',uid);
  }
   async agregarReserva(rsv: Reserva){
      await this.insertarBD(rsv);
      await this.refrescarListaReservas();
    }
  
    async actualizarReserva(rsv: Reserva){
      await this.modificarBD(rsv);
      await this.refrescarListaReservas();
    }
  
    async eliminarReserva(rsv: Reserva){
      await this.eliminarBD(rsv);
      await this.refrescarListaReservas();
    }
  
  //! =================== Métodos privados ===================
  //~ =================== CRUD Supabase
  private async insertarBD(rsv: Reserva){
    const identificador = crypto.randomUUID();
    const nuevaReserva: Reserva = {
      ...rsv,
      uid: identificador
    }

    const reservaBD = ((await this.sbSvc.insertar('reservas', nuevaReserva)) as Reserva[])[0]
    return reservaBD;
  }

  private async modificarBD(rsv: Reserva){
    const reservaBD = await this.sbSvc.actualizar('reservas', 'uid', rsv.uid!, rsv);
    return reservaBD;
  }
  
  private async eliminarBD(rsv: Reserva){
    await this.sbSvc.eliminar('reservas', 'uid', rsv.uid!);
  }


  //~ =================== Actualización de listados
  public async refrescarListaReservas(filtro:"todo" | "pendientes" | "aprobadas" | "no registradas" = "todo")
  {
    var ls : Reserva[] = []

    switch (filtro)
    {
      case "todo":
        ls = await this.sbSvc.listarTodos<Reserva>('reservas');
        break;
    
      case "pendientes":
        ls = await this.sbSvc.adquirirDatosPorColumna<Reserva>
        ('reservas',
          `
          *,
          users (*)
          `,
          'estado',
          'pendiente'
        );

        ls = ls.map((reserva) =>
        {
          reserva.users!.foto = 
            `${environment.supabaseStorageUrl}foto-usuario/${reserva.users!.uid}.jpeg`;

          let fechaInicial = DateTime.fromISO(reserva.fecha_reservada);
          reserva.intervaloReserva = Interval
          .after(fechaInicial, { minutes: 45});
          
          return reserva;
        });

        break;

      case "aprobadas":
        ls = await this.sbSvc.adquirirDatosPorColumna<Reserva>
        ('reservas',
          `
          *,
          users (*),
          mesas(*)
          `,
          'estado',
          'aprobada'
        );

        ls = this.mapearReservas(ls);

        break;

      case "no registradas":
        ls = await this.sbSvc.adquirirDatosPorColumnaNotEqual<Reserva>
        ('reservas',
          `
          *,
          users (*)
          `,
          'estado',
          'registrada'
        );

        ls = this.mapearReservas(ls);
          break
    }    
    
    this.listaReservas.set(ls);
  }

  private mapearReservas(reservas: Reserva[])
  {
    let listaMapeada = reservas.map((reserva) =>
      {
        let fechaInicial = DateTime.fromISO(reserva.fecha_reservada);
        reserva.intervaloReserva = Interval
        .after(fechaInicial, { minutes: 45});
        
        return reserva;
      });

      return listaMapeada;
  }

  private iniciarRefreshReservas(filtro: "todo" | "pendientes" | "aprobadas" | "no registradas" = "todo")
  {
    if(this.subRefresh) return

    this.subRefresh = timer(0, 60000).subscribe(async () => {
      await this.refrescarListaReservas(filtro)
    })
  }
  private detenerRefreshReservas() {
    this.subRefresh?.unsubscribe()
  }

  public revisarSiMesaEstaReservada(fechaActual: DateTime)
  {
    var reservaEncontrada = this.listaReservas().find
    (
      (reserva) =>
      {
        return reserva.intervaloReserva?.contains(fechaActual);
      }
    );

    if (reservaEncontrada != undefined)
    {
      return reservaEncontrada;
    }

    return null;
  }
}
