import { inject, Injectable, signal } from '@angular/core';
import { ListEsperaUsuario } from '../models/UsuarioListaEspera';
import { SupabaseService } from './supabase-service';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class ListaEsperaSb {
  
  private sbSvc = inject(SupabaseService);

  listaEsperaUsuarios = signal<ListEsperaUsuario[]>([])
  usrSeleccionado = signal<ListEsperaUsuario | null>(null);
  usrActual = signal<ListEsperaUsuario | null>(null);
  

//! =================== Métodos CRUD ===================

  async agregarListEsperaUsuario(usr: ListEsperaUsuario){
    await this.insertarListEsperaUsuario(usr);
    await this.refrescarListaListEsperaUsuarios();
  }

  async actualizarListEsperaUsuario(usr: ListEsperaUsuario){
    await this.actualizarListEsperaUsuarioBD(usr);
    await this.refrescarListaListEsperaUsuarios();
  }

  async eliminarListEsperaUsuario(usr: ListEsperaUsuario){
    await this.eliminarListEsperaUsuarioBD(usr.usuario as string);
    await this.refrescarListaListEsperaUsuarios();
  }

  //! =================== Métodos Tiempo Real ===================
private canalListEsperaUsuarios: RealtimeChannel | null = null;
private isCanalInicializado = false;
private reintentandoCanal = false;

async iniciarTRListEsperaUsuarios() {

  if (this.isCanalInicializado) return;

  await this.refrescarListaListEsperaUsuarios();

  this.crearCanalListEsperaUsuarios();

  document.addEventListener('visibilitychange', async() => {

    if (
      document.visibilityState === 'visible' &&
      !this.isCanalInicializado &&
      !this.reintentandoCanal
    ) {

      console.warn('App volvió al foreground. Reconectando realtime lista de espera...');

      await this.reconectarCanalListEsperaUsuarios();
    }
  });
}

private crearCanalListEsperaUsuarios() {

  this.canalListEsperaUsuarios = this.sbSvc.sb.channel('lista-espera-clientes-realtime');

  this.canalListEsperaUsuarios
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'usuarios_espera'
      },
      async(evento) => {

        console.log('Evento realtime recibido:', evento);

        switch (evento.eventType) {

          case 'INSERT':
            setTimeout(async() => {
              await this.refrescarListaListEsperaUsuarios();
            }, 1000);
          break;

          case 'UPDATE':
            await this.refrescarListaListEsperaUsuarios();
          break;

          case 'DELETE':
            await this.refrescarListaListEsperaUsuarios();
          break;
        }
      }
    )
    .subscribe(async(status) => {

      console.log('Estado canal realtime Lista de espera:', status);

      switch (status) {

        case 'SUBSCRIBED':
          this.isCanalInicializado = true;
          this.reintentandoCanal = false;
        break;

        case 'TIMED_OUT':
        case 'CHANNEL_ERROR':
        case 'CLOSED':

          if (this.reintentandoCanal) return;

          this.reintentandoCanal = true;

          console.warn('Canal realtime lista de espera caído. Reconectando...');

          this.isCanalInicializado = false;

          await this.reconectarCanalListEsperaUsuarios();

        break;
      }
    });
}

private async reconectarCanalListEsperaUsuarios() {

  try {

    if (this.canalListEsperaUsuarios) {

      await this.destruirCanalListEsperaUsuarios();

      this.canalListEsperaUsuarios = null;
    }

    setTimeout(() => {
      this.crearCanalListEsperaUsuarios();
    }, 2000);

  } catch(error) {

    console.error('Error reconectando canal lista de espera:', error);

    this.reintentandoCanal = false;
  }
}

async destruirCanalListEsperaUsuarios() {

  if (this.canalListEsperaUsuarios) {

    await this.sbSvc.sb.removeChannel(this.canalListEsperaUsuarios);

    this.isCanalInicializado = false;
  }
}
  //! =================== Métodos Privados ===================

  private async obtenerListaEsperaUsuario(usuario: string): Promise<ListEsperaUsuario | null>{
    return await this.sbSvc.adquirirFila<ListEsperaUsuario>('usuarios_espera','usuario',usuario);
  }

  private async refrescarListaListEsperaUsuarios(){
    const ls = await this.sbSvc.listarTodos<ListEsperaUsuario>('usuarios_espera');
    const ListEsperaUsuarios = await Promise.all(
      ls.map( (u) => {
        u.foto =  this.sbSvc.obtenerUrl('foto-usuario', `${u.usuario}.jpeg`);
        return u;
      })
    );
    this.listaEsperaUsuarios.set(ListEsperaUsuarios);
  }

  private async insertarListEsperaUsuario(usr: ListEsperaUsuario){
    //? Verificamos que posea path de la foto
    if(usr.foto === null) throw new Error('No se ha tomado foto alguna.');
    //? Verficamos existencia
    const existe = this.listaEsperaUsuarios().some(u => u.usuario === usr.usuario);
    if(existe) throw new Error('El usuario ya se encuentra en espera');  

   //? Registramos en la base de datos 
    //? Insertamos en tabla
    const datos:ListEsperaUsuario = {
      usuario: usr.usuario,
      nombre_usuario: usr.nombre_usuario,
      is_anonimo: usr.is_anonimo,
      cantidad: usr.cantidad,
      tipo_solicitado: usr.tipo_solicitado,
    }
    const dataTabla = await this.sbSvc.insertar('usuarios_espera', datos)
    if(dataTabla === null) throw new Error('Hubo un error con la base de datos');

  }

  private async actualizarListEsperaUsuarioBD(actualizacion: ListEsperaUsuario){
    const usrActualizado = {
      cantidad: actualizacion.cantidad,
      tipo_solicitado: actualizacion.tipo_solicitado,
    };

    const dataBD = await this.sbSvc.actualizar<ListEsperaUsuario>('usuarios_espera','usuario',
                                                                    actualizacion.usuario!, usrActualizado)
    if(dataBD === null) throw new Error('Hubo un error en la base de datos.')

    return dataBD
  }

  private async eliminarListEsperaUsuarioBD(usuario: string){
    await this.sbSvc.eliminar('usuarios_espera','usuario',usuario);
  }

}
