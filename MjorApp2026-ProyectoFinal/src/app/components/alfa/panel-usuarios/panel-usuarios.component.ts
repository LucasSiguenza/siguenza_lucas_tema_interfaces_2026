import { Component, computed, inject, input, Input, signal } from '@angular/core';
import { IonButton, IonButtons, IonCard, IonCardTitle, IonCardHeader, IonCardContent,
  ModalController, IonIcon, IonText, AlertController } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';  // 🔹 importante
import { Usuario } from 'src/app/models/usuario';
import { Util } from 'src/app/services/util'
import { addIcons } from 'ionicons';
import { addOutline, apertureOutline, buildOutline, 
  checkmarkCircleOutline, 
  checkmarkOutline, 
  chevronBackOutline, chevronForwardOutline, trashOutline } from 'ionicons/icons';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { environment } from 'src/environments/environment';
import { FormAltaUsuarioModalComponent } from '../../elementos/modals/form-alta-usuario-modal/form-alta-usuario-modal.component';
import { EmailService } from 'src/app/services/email-service';
import { DetalleUsuarioModalComponent } from '../../elementos/modals/detalle-usuario-modal/detalle-usuario-modal.component';

@Component({
  selector: 'app-panel-usuarios',
  templateUrl: './panel-usuarios.component.html',
  styleUrls: ['./panel-usuarios.component.scss'],
  imports: [IonText,  IonIcon, IonCardContent, IonCardHeader, IonCardTitle, IonCard,
     IonButtons, IonButton, CommonModule]
  })
export class PanelUsuariosComponent {

  //! ===================== Variables y Servicios =====================
  private userSvc = inject(UsuarioSb)
  protected alertCtrl = inject(AlertController);
  private utilSvc = inject(Util)
  private modalCtrl = inject(ModalController);
  private emailSvc = inject(EmailService);


  perfil = input.required<'cliente' | 'empleado'>();
  isAprobacion = input.required<boolean>();

  protected fotoPath = `${environment.supabaseStorageUrl}foto-usuario/`;

  //~ ===================== Lista de usuarios
  //* Lista filtrada y ordenada (reactiva)
  listaFiltrada = computed(() => {
    const usuarios = this.userSvc.listaUsuarios() ?? [];
    const perfil = this.perfil();
    const aprobacion = this.isAprobacion();

    return usuarios
      .filter(u => {

        const filtroPerfil =
          perfil === 'empleado'
            ? u.perfil !== 'cliente'
            : u.perfil === 'cliente';

        const filtroEstado =
          aprobacion
            ? !u.estado
            : true;

        return filtroPerfil && filtroEstado;

      })
      .sort((a, b) => a.id! - b.id!);

  });
  //~ ===================== Inicializadores
  
  constructor() {
    addIcons({chevronForwardOutline, chevronBackOutline,
      addOutline, buildOutline, apertureOutline, trashOutline, 
      checkmarkCircleOutline, checkmarkOutline})
   }

  async ngOnInit(){
    await this.userSvc.iniciarTRUsuarios();
    console.log(JSON.stringify(this.listaFiltrada()))
   }

  ngOnDestroy() {
   }

  //! ===================== Paginación =====================
  //* ✅ Señal para la página actual
  page = signal(1);
  pageSize = 1; 
  
  //* ✅ Lista paginada derivada de la lista filtrada
  get paginatedItems(): Usuario[] {
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

  //! ===================== Métodos funcionales =====================
  async eliminarUsuario(usr: Usuario) {
    const confirmacion = await this.utilSvc.mostrarConfirmAlert('¿Desea eliminar a este usuario?',
      'Esta acción es permanente e inmutable.'
    )
    if(confirmacion){
      //? Crear loading dentro del handler
      const carga = await this.utilSvc.loading();
      await carga.present();

      try {
        await this.userSvc.eliminarUsuario(usr);
        this.prevPage();
        await carga.dismiss();
        if(!usr.estado) {
          this.emailSvc.envClienteRechazado(usr);
          this.utilSvc.mostrarToast('Finalizado. Usuario rechazado exitosamente.','success', 'middle', 500);
        } else this.utilSvc.mostrarToast('Finalizado. Usuario eliminado exitosamente.','success', 'middle', 500);

      } catch (error) {
        console.error('Error al eliminar:', (error as Error).name);
        await carga.dismiss();
        this.utilSvc.mostrarToast('Hubo un error: No se pudo eliminar al usuario.','warning', 'middle', 500);
      }
    } else await this.utilSvc.mostrarToast('Acción cancelada', 'warning', 'middle', 500);
  }
  

  async abrirFormularioNuevo(){
    const modal = await this.modalCtrl.create({
      component: FormAltaUsuarioModalComponent,
    });

    await modal.present();

    const {data, role} = await modal.onDidDismiss<Usuario>();

    if(role === 'confirm'){
        this.utilSvc.mostrarToast("¡Usuario agregado exitosamente!", 'success','middle',500);
    }
    
  }

  async abrirFormularioEdicion(usuario: Usuario){
    this.userSvc.usrSeleccionado.set(usuario);
    const modal = await  this.modalCtrl.create({
    component: FormAltaUsuarioModalComponent,
    })
    await modal.present()
    if((await modal.onDidDismiss()).role === 'confirm') this.utilSvc.mostrarToast("¡Usuario editado exitosamente!", 'success','middle',500);
    if((await modal.onDidDismiss()).role === 'cancel') this.utilSvc.mostrarToast('Acción cancelada', 'error','middle',100)
  }

  async verDetalles(usr: Usuario){
    const modal = this.modalCtrl.create({
      component: DetalleUsuarioModalComponent,
    });

    this.userSvc.usrSeleccionado.set(usr);
    (await modal).present();

    const {role} = await (await modal).onDidDismiss();


  }

  async habilitarUsuario(usr: Usuario){
    
    const confirmacion = await this.utilSvc.mostrarConfirmAlert('¿Desea aceptar este usuario?',
      'Se le habilitará el acceso a la app y quedará en el registro.'
    )

    if(confirmacion){
      const carga = this.utilSvc.loading();
      (await carga).present();
  
      usr.estado = true;
  
      try{
        this.userSvc.actualizarUsuario(usr);
        this.emailSvc.envClienteAprobado(usr);
        this.prevPage();
        (await carga).dismiss();
  
      } catch(e){ 
          console.error('Error al aceptar:', e);
          this.utilSvc.mostrarToast('Hubo un error. No se pudo habilitar al usuario.', 'warning','middle',500);   
          (await carga).dismiss();
    
      }
    } else await this.utilSvc.mostrarToast('Acción cancelada', 'warning', 'middle', 500);

  }
}
