import { computed, inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { Usuario } from '../models/usuario';
import { AuthUser } from '../models/authUser';
import { Util } from './util';
import { CamaraService } from './camara-service';
import { Provider, RealtimeChannel } from '@supabase/supabase-js';
import { EmailService } from './email-service';
import { AnonUsuario } from '../models/UsuarioAnonimo';
import { NotificationService } from './notification.service';
import { Capacitor } from '@capacitor/core';
import OneSignal from 'onesignal-cordova-plugin';
import { uid } from 'chart.js/dist/helpers/helpers.core';
import { INotification } from './notification';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UsuarioSb {

  //! =================== Variables y Servicios ===================

  private sbSvc = inject(SupabaseService);
  private camaraSvc = inject(CamaraService);
  private utilSvc = inject(Util);
  private emailSvc = inject(EmailService);
  private notificacionService = inject(NotificationService);

  listaUsuarios = signal<Usuario[]>([])
  usrSeleccionado = signal<Usuario | null>(null);
  usrAuth = signal<AuthUser | null>(null);
  usrActual = signal<Usuario | null>(null);
  
  isCliente = computed<boolean | null>(() => {
    const usr = this.usrActual();

    if(!usr) return null;

    return usr.perfil === 'cliente';
  });

  private canalUsuarios: RealtimeChannel | null = this.sbSvc.sb.channel('usuarios-realtime');
  private isCanalInicializado = false;

  //! =================== Métodos Auth ===================

  async ingresarAnonimo(usr: AnonUsuario){
    const sb = await this.sbSvc.iniciarSesionAnonimo();
    const usuarioAnonSb = sb.user as AuthUser;
    if(usuarioAnonSb === null) throw new Error('No se pudo ingresar.')

    const usuarioAnonLocal={
      nombre : usr.nombre,
      perfil: 'cliente',
      uid: usuarioAnonSb?.id,
      is_anonimo: 'si',
      estado: true,
    }



    const ingresoBD = await this.sbSvc.insertar('users',usuarioAnonLocal);
    const usrActual = (ingresoBD as Usuario[])[0]
    if((ingresoBD as Usuario[])[0] === null) throw new Error('No se pudo agregar el usuario a la tabla.') 
    
    const img = await this.camaraSvc.procesarFoto(usr.foto);
    const path = usrActual.uid

    await this.sbSvc.subirFoto(path!,img,'foto-usuario')
    const data: {usrTabla: Usuario, usrAuth: AuthUser} ={
      usrAuth: sb.user as AuthUser,
      usrTabla: usrActual!,
    }

    await this.utilSvc.guardarArchivoLocal('usuario.sesion', data);
    this.usrAuth.set(usuarioAnonSb);
    this.usrActual.set(ingresoBD[0]);

  }

  async iniciarSesionOAuth(plataforma: Provider){
    const data = await this.sbSvc.iniciarSesionOAuth(plataforma);
    console.log(JSON.stringify(data));
    const dataUser = await this.sbSvc.sb.auth.getUser()

    console.log(JSON.stringify(dataUser))
    console.log(JSON.stringify(this.usrActual()))
    console.log(JSON.stringify(this.usrAuth))

    if(this.usrActual() === null) throw new Error('Usuario no registrado. Debe estar registrado para acceder por github')

  }

  async iniciarSesion(email:string, contrasenia: string){
    const authUser = await this.sbSvc.iniciarSesion(email, contrasenia)
    this.usrAuth.set(authUser.user as AuthUser);

    const usrBd = await this.obtenerUsuario(authUser.user.id);
    this.usrActual.set(usrBd) 

    const data: {usrTabla: Usuario, usrAuth: AuthUser} ={
      usrAuth: authUser.user as AuthUser,
      usrTabla: usrBd!,
    }

    // login y asignación de tag de OneSignal.
    if(Capacitor.getPlatform() !== 'web')
    {
      let iDUsuario = this.usrActual()!.uid!.replace(/-/g, "");
      OneSignal.login(iDUsuario);
      this.agregarTagNotificacionSegunPerfil();
    }
      
    await this.utilSvc.guardarArchivoLocal('usuario.sesion', data);
  }

  private agregarTagNotificacionSegunPerfil()
  {
    switch (this.usrActual()?.perfil)
      {
        case 'dueño':
          this.notificacionService.agregarTagPerfil('dueño');
          break;
        case 'supervisor':
          this.notificacionService.agregarTagPerfil('dueño');
          break
        case 'maitre':
          this.notificacionService.agregarTagPerfil('dueño');
          break;
        case 'mozo':
          this.notificacionService.agregarTagPerfil('mozo');
          break;
        case 'cocinero':
          this.notificacionService.agregarTagPerfil('cocinero');
          break;
        case 'bartender':
          this.notificacionService.agregarTagPerfil('bartender');
          break;
        case 'cliente':
          this.notificacionService.agregarTagPerfil('cliente');
          break;
        case 'delivery':
          this.notificacionService.agregarTagPerfil('mozo');
          break;
      }
  }

  async recuperarSesion(){
    const sb = await this.sbSvc.recuperarSesion(); 

    if(!sb){
      return null;
    }

    let data = await this.utilSvc.recuperarArchivoGuardado<{
      usrTabla: Usuario,
      usrAuth: AuthUser
    }>('usuario.sesion');
    
    if(!data){

      const usuarioTabla = await this.obtenerUsuario(sb.id);

      if(!usuarioTabla){
        await this.cerrarSesion();
        throw new Error('El usuario no se encuentra registrado');
      }

      data = {
        usrAuth: sb as AuthUser,
        usrTabla: usuarioTabla
      };

      await this.utilSvc.guardarArchivoLocal('usuario.sesion', data);
    }

    this.usrAuth.set(data.usrAuth);
    this.usrActual.set(data.usrTabla);

    return sb;
  }

  async cerrarSesion(){
    const sb = await this.sbSvc.recuperarSesion()
    if(sb === null) {
      throw new Error('No hay sesión que cerrar.')
    }

    await this.sbSvc.cerrarSesion();
    await this.utilSvc.eliminarArchivoLocal('usuario.sesion');
    // logout de OneSignal
    if(Capacitor.getPlatform() !== 'web')
    {
      OneSignal.logout();
      this.notificacionService.removerTagPerfil();
    }
    this.usrActual.set(null);
    this.usrAuth.set(null);
  }
  //! =================== Métodos CRUD ===================

  async agregarUsuario(usr: Usuario){
    await this.insertarUsuario(usr);
    await this.refrescarListaUsuarios();
  }

  async actualizarUsuario(usr: Usuario){
    await this.actualizarUsuarioBD(usr);
    await this.refrescarListaUsuarios();
  }

  async eliminarUsuario(usr: Usuario){
    await this.eliminarUsuarioBD(usr.uid as string);
    await this.refrescarListaUsuarios();
  }

  async seleccionarUsuario(uuid: string){
    await this.refrescarListaUsuarios();
    return await this.obtenerUsuario(uuid);
  }

  //! =================== Métodos Tiempo Real ===================

  async iniciarTRUsuarios() {
  if (this.isCanalInicializado) return;
  await this.refrescarListaUsuarios();
  this.isCanalInicializado = true;
  this.canalUsuarios!
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'users'
      },
      (evento) => {
        console.log('Evento realtime recibido:', evento);

        switch (evento.eventType) {
          case 'INSERT':
            setTimeout(()=> {
                this.refrescarListaUsuarios();
            }, 1000);
            break;

          case 'UPDATE':
            setTimeout(()=> {
                this.refrescarListaUsuarios();
            }, 1000);
            break;

          case 'DELETE':
            setTimeout(()=> {
                this.refrescarListaUsuarios();
            }, 1000);
            break;
        }
      }
    )
    .subscribe((status) => {
      console.log("Estado canal realtime USUARIOS :", status);
    });
  }

  destruirCanalUsuarios() {
    if (this.canalUsuarios) {
      this.sbSvc.sb.removeChannel(this.canalUsuarios);
      this.canalUsuarios = null;
    }
  }
  //! =================== Métodos Privados ===================

    private enviarNotificacion(usuario: Usuario){
      var notificacion: INotification = {
        title: 'Nuevo usuario en espera de aprobación.',
        body: `El usuario ${usuario.nombre} ${usuario.apellido} se encuentra en espera de aprobación.`,
        data:{url: '/control'},
        segments: ["dueño"]
      }
    var idCanal: string = environment.oneSignalAvisoChannel
    
    this.notificacionService.enviarNotificacion(notificacion, idCanal)
    
    }


  private async obtenerUsuario(uid: string): Promise<Usuario | null>{
    return await this.sbSvc.adquirirFila<Usuario>('users','uid',uid);
  }

  private async refrescarListaUsuarios(){
    const ls = await this.sbSvc.listarTodos<Usuario>('users');
    const usuarios = await Promise.all(
      ls.map( (u) => {
        u.foto =  this.sbSvc.obtenerUrl('foto-usuario', `${u.uid}.jpeg`);
        return u;
      })
    );
    this.listaUsuarios.set(usuarios);
  }

  private async insertarUsuario(usr: Usuario){
    //? Verificamos que posea path de la foto
    if(usr.foto === null) throw new Error('No se ha tomado foto alguna.');
    //? Verificamos que el dato sea correcto
    if(usr.contrasenia === null) throw new Error('No se han recopilado correctamente los datos')
    //? Verficamos existencia
    const existe = this.listaUsuarios().some(u => u.email === usr.email);
    if(existe) throw new Error('Usuario ya registrado');  

   //? Registramos en la base de datos 
    const dataAuth = await this.sbSvc.registrarUsuario(usr.email, usr.contrasenia!);
    if(dataAuth === null) throw new Error('No se pudo registrar en supabase.');

    //? Insertamos en tabla
    const datos:Usuario = {
      uid: dataAuth.user?.id,
      apellido: usr.apellido,
      cuil: usr.cuil,
      dni: usr.dni,
      email: usr.email,
      nombre: usr.nombre,
      perfil: usr.perfil,
      is_anonimo: 'no',
      estado: usr.perfil !== 'cliente',
    }
    console.log(`Estado del usuario con el rol: ${datos.perfil} es: ${datos.estado}`)
    const dataTabla = await this.sbSvc.insertar('users', datos)
    if(dataTabla === null) throw new Error('Hubo un error con la base de datos');
    this.emailSvc.envClienteEnEspera(datos);
    this.enviarNotificacion(datos);
    //? Agregamos foto una vez que el usuario existe
    const foto = await this.camaraSvc.procesarFoto(usr.foto!);
    const dataFoto = await this.sbSvc.subirFoto(datos.uid!, foto,'foto-usuario');

    if(dataFoto === null) throw new Error('No se pudo subir la foto')

  }

  private async actualizarUsuarioBD(actualizacion: Usuario){
    const usrActualizado: Usuario = {
      is_anonimo: 'no',
      nombre: actualizacion.nombre,
      apellido: actualizacion.apellido,
      dni: actualizacion.dni,
      cuil: actualizacion.cuil,
      email: actualizacion.email,
      perfil: actualizacion.perfil,
      estado: actualizacion.estado,
    };

    const dataBD = await this.sbSvc.actualizar<Usuario>('users','uid',actualizacion.uid!, usrActualizado)
    if(dataBD === null) throw new Error('Hubo un error en la base de datos.')
    
    if( actualizacion.foto?.startsWith('data:') || actualizacion.foto?.startsWith('file:')){
      const foto = await this.camaraSvc.procesarFoto(actualizacion.foto!);
      const nombreFoto = `${actualizacion.uid}`
      const dataFotoBD = await this.sbSvc.subirFoto(nombreFoto,foto,'foto-usuario')
      if(dataFotoBD === null) throw new Error('Hubo un error al subir la foto');
      dataBD.foto = dataFotoBD as string
    }

    return dataBD
  }

  private async eliminarUsuarioBD(uid: string){
    await this.sbSvc.eliminarFoto('foto-usuario', `${uid}.jpeg`);
    await this.sbSvc.eliminar('users','uid',uid);
  }

}
