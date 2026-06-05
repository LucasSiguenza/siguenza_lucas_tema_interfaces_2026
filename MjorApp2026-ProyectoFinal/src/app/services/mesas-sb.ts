import { computed, inject, Injectable, signal } from '@angular/core';
import { Mesa } from '../models/Mesa';
import { SupabaseService } from './supabase-service';
import { RealtimeChannel } from '@supabase/supabase-js';
import { CamaraService } from './camara-service';
import { UsuarioSb } from './usuario-sb';
import { Reserva } from '../models/Reserva';
import { DateTime } from 'luxon';

@Injectable({
  providedIn: 'root',
})
export class MesasSb {
  //! ==================== Variables y servicios ====================
  private sbSvc = inject(SupabaseService);
  private camaraSvc = inject(CamaraService);
  private usrSvc = inject(UsuarioSb);

  private canalMesas: RealtimeChannel | null = this.sbSvc.sb.channel('mesas-realtime');
  private isCanalInicializado = false;

  isModal = signal<boolean>(false)
  listaMesas = signal<Mesa[]>([])
  mesaSeleccionada = signal<Mesa | null>(null)

  mesaDelUsuario = computed(()=>{
    const mesa = this.listaMesas().find(
      (m) => m.usuario_id === this.usrSvc.usrActual()?.uid
    )

    return mesa ?? null 
  })
  
  
  //! ==================== Métodos públicos ====================
  //~ ==================== Tiempo real.
  async iniciarTRMesas() {
    if (this.isCanalInicializado) return;
    await this.cargarListaMesas();
    this.isCanalInicializado = true;
    this.canalMesas!
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mesas'
        },
        (evento) => {
          console.log('Evento realtime recibido:', evento);

          switch (evento.eventType) {
            case 'INSERT':
              setTimeout(()=> {
                  this.cargarListaMesas();
              }, 1000);
              break;

            case 'UPDATE':
              this.cargarListaMesas();
              break;

            case 'DELETE':
              this.cargarListaMesas();
              break;
          }
        }
      )
      .subscribe((status) => {
        console.log("Estado canal realtime MESAS:", status);
      });
    }

  destruirCanalMesas() {
    if (this.canalMesas) {
      this.sbSvc.sb.removeChannel(this.canalMesas);
      this.canalMesas = null;
    }
  }


  //~ ==================== CRUD
   async agregarMesa(mesa: Mesa) {
    var mesaDB = await this.crearMesaBD(mesa);
    await this.cargarListaMesas();
    return mesaDB;
  }

  async eliminarMesa(mesa: Mesa) {
    await this.eliminarMesaBD(mesa);
    await this.cargarListaMesas();
  }

  async editarMesa(mesa: Mesa) {
    const mesaBD = await this.actualizarMesaBD(mesa);
    await this.cargarListaMesas();
    return mesaBD;
  }

    async subirQr(titulo: string, img: Blob){
      this.sbSvc.subirFoto(titulo, img, 'qrmesas');
    }

  //~ ==================== Reservas

  public async revisarEstadoActualReserva(listaReservas: Reserva[])
  {
    var fechaAhora = DateTime.now();

    console.log(fechaAhora);
    
    console.log(JSON.stringify(listaReservas[0].mesas?.numero))
    
    
    for (let index = 0; index < listaReservas.length; index++)
    {
      if (listaReservas[index].intervaloReserva?.contains(fechaAhora))
      {
        let indexMesa = this.listaMesas().findIndex
        (
          (mesa) =>
          {
            return mesa.numero == listaReservas[index].mesas?.numero;
          }
        );

        console.log(indexMesa);
        
        if (indexMesa >= 0)
        {          
          let nombreUsuario = 
          `${listaReservas[index].users?.nombre} ${listaReservas[index].users?.apellido}`;
          this.listaMesas()[indexMesa].usuario_asignado = nombreUsuario;
          this.listaMesas()[indexMesa].usuario_id = listaReservas[index].users?.uid;
          this.listaMesas()[indexMesa].usuario_es_anonimo = listaReservas[index].users?.is_anonimo;
        }

        
      }      
    }
  }
  //! ==================== Métodos privados ====================

  public async cargarListaMesas(): Promise<Mesa[]> {
    const listaBD = await this.sbSvc.listarTodos<Mesa>('mesas');

    const lista = listaBD.map((m:Mesa) => (
      {
        ...m,
        foto: this.sbSvc.obtenerUrl('mesas', `${m.id}.jpeg`)
      }
    ))

    this.listaMesas.set(lista ?? []);
    return this.listaMesas();
  }

  private async crearMesaBD(mesa: Mesa){
    let ms:Mesa = {
      cantidad_comensales: mesa.cantidad_comensales,
      numero: mesa.numero,
      tipo: mesa.tipo,
    }

    const mesaNueva = await this.sbSvc.insertar<Mesa>('mesas', ms);
    if(mesaNueva === null || mesaNueva === undefined) throw new Error('Error en la base de datos, no se pudo agregar mesa');

    const img = await this.camaraSvc.procesarFoto(mesa.foto!);
    await this.sbSvc.subirFoto(String((mesaNueva as Mesa[])[0].id), img, 'mesas');

    return (mesaNueva as Mesa[])[0];
  }


  private async eliminarMesaBD(mesa: Mesa){
    await this.sbSvc.eliminar('mesas', 'id', String(mesa.id));
    await this.sbSvc.eliminarFoto('mesas', `${mesa.id}`);
    await this.sbSvc.eliminarFoto('qrmesas', `${mesa.id}`);
  }

  private async actualizarMesaBD(mesa: Mesa){
    const ms:Mesa = {
      cantidad_comensales: mesa.cantidad_comensales,
      numero: mesa.numero,
      tipo: mesa.tipo,
      created_at: mesa.created_at,
      id: mesa.id,
      usuario_asignado: mesa.usuario_asignado,
      usuario_es_anonimo: mesa.usuario_es_anonimo,
      usuario_id: mesa.usuario_id,
    }
    const mesaActualizada = await this.sbSvc.actualizar('mesas', 'id', String(mesa.id), ms);

    if(mesa.foto?.startsWith('data:') ||mesa.foto?.startsWith('file:')){
      const path = String(mesa.id)
      const img = await this.camaraSvc.procesarFoto(mesa.foto);
      this.sbSvc.subirFoto(path,img,'mesas')
    }

    return mesaActualizada as Mesa;
  }



}
