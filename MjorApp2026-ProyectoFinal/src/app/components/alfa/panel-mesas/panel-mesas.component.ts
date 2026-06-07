import { OnDestroy, OnInit } from '@angular/core';
import { Component, computed, inject, signal } from '@angular/core';
import { IonButton, IonButtons, IonCard, IonCardTitle, IonCardHeader, IonCardContent,
  ModalController, IonIcon, IonText, IonFooter, AlertController , IonToolbar } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common'; // 🔹 importante
import { FormatoFechaPipe } from 'src/app/pipes/formato-fecha-pipe';
import { FormatoTipoMesaPipe } from 'src/app/pipes/formato-tipo-mesa-pipe';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { Util } from 'src/app/services/util';
import { MesasSb } from 'src/app/services/mesas-sb';
import { environment } from 'src/environments/environment';
import { Mesa } from 'src/app/models/Mesa';
import { FormularioAltaMesasModalComponent } from '../../elementos/modals/formulario-alta-mesas-modal/formulario-alta-mesas-modal.component';
import { addIcons } from 'ionicons';
import { personAddOutline } from 'ionicons/icons';
import { ListaEsperaSb } from 'src/app/services/lista-espera-sb';
import { ReservaSb } from 'src/app/services/reserva-sb';

@Component({
  selector: 'app-panel-mesas',
  templateUrl: './panel-mesas.component.html',
  styleUrls: ['./panel-mesas.component.scss'],
imports: [ IonToolbar, IonFooter, IonText, IonIcon, IonCardContent, IonCardHeader, IonCardTitle,
    IonCard, IonButtons, IonButton, CommonModule, FormatoFechaPipe, FormatoTipoMesaPipe ],
})
export class PanelMesasComponent  implements OnInit, OnDestroy {
  
  //! ====================== Variables y servicios ======================
  protected usrSvc = inject(UsuarioSb);
  private lEspSvc = inject(ListaEsperaSb);
  private modalCtrl = inject(ModalController);
  private utilSvc = inject(Util);
  protected mesaSvc = inject(MesasSb);
  protected alertCtrl = inject(AlertController);
  protected rsvSvc = inject(ReservaSb);
  
  protected isMesaAsignada = false;
  protected isModal = this.mesaSvc.isModal();
  
  protected fotoPath = `${environment.supabaseStorageUrl}mesas/`;
  
  //! ====================== Métodos visuales ======================
  //* ✅ Señal para la página actual
  page = signal(1);
  pageSize = 1;
  
  //* ✅ Lista filtrada y ordenada (reactiva)
  lista = computed(() =>
    (this.mesaSvc.listaMesas() ?? []).sort(
      (a, b) => parseInt(a.numero)! - parseInt(b.numero)!
    )
  );
  
  //* ✅ Lista paginada derivada de la lista filtrada
  get paginatedItems(): Mesa[] {
    const start = (this.page() - 1) * this.pageSize;
    return this.lista().slice(start, start + this.pageSize);
  }
  //~ =================== Inicialización y destrucción de TR
  async ngOnInit() {
    await this.mesaSvc.iniciarTRMesas();
    await this.rsvSvc.iniciarTrReservas("aprobadas");
    await this.mesaSvc.revisarEstadoActualReserva(this.rsvSvc.listaReservas());
  }

  async ngOnDestroy()
  {
    this.mesaSvc.cargarListaMesas();
  }
  //~ =================== Paginación
  
  totalPages(): number {
    return Math.ceil(this.lista().length / this.pageSize);
  }
  
  nextPage() {
    if (this.page() < this.totalPages()) this.page.set(this.page() + 1);
  }
  
  prevPage() {
    if (this.page() > 1) this.page.set(this.page() - 1);
  }
  constructor() {
    addIcons({personAddOutline})
   }
  
  //! ====================== Métodos visuales ======================
  //~ =================== CRUD
  async eliminarMesa(mesa: Mesa) {
    const confirmacion = await this.alertCtrl.create({
      header: 'Confirmar',
      message: `¿Estás seguro de que querés eliminar la mesa ${mesa.numero}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          handler: () => {
            this.utilSvc.mostrarToast(
              'Acción cancelada',
              'info',
              'middle',
              500
            );
          },
        },
        {
          text: 'Aceptar',
          handler: async () => {
            //? Crear loading dentro del handler
            const carga = await this.utilSvc.loading();
            await carga.present();

            try {
              await this.mesaSvc.eliminarMesa(mesa);
              this.prevPage();
              await carga.dismiss();
              this.utilSvc.mostrarToast(
                '¡Mesa eliminado exitosamente!',
                'success',
                'middle',
                500
              );
            } catch (error) {
              console.error('Error al eliminar:', error);
              await carga.dismiss();
              this.utilSvc.mostrarToast(
                'Hubo un error: No se pudo eliminar la mesa',
                'info',
                'middle',
                500
              );
            }
          },
        },
      ],
    });

    await confirmacion.present();
  }

  async abrirFormularioNuevo() {
    // await this.mesaSvc.revisarEstadoActualReserva(this.rsvSvc.listaReservas());
    const modal = await this.utilSvc.crearModal(FormularioAltaMesasModalComponent,'md',{},true);
    await modal.present()
  }
  async abrirFormularioEdicion(mesa: Mesa) {
    this.mesaSvc.mesaSeleccionada.set(mesa);
    await this.utilSvc.crearModal(FormularioAltaMesasModalComponent,'md',{},true);
  }


  async asignarUsuario(mesa: Mesa) {
    const usuarioAsignado = this.usrSvc.usrSeleccionado();
    const usrListEsp = this.lEspSvc.usrSeleccionado();

    const mesaAsignada: Mesa ={
      ... mesa,
      usuario_id: usuarioAsignado?.uid,
      usuario_asignado: `${usuarioAsignado?.nombre} ${usuarioAsignado?.apellido}`,
      usuario_es_anonimo: usuarioAsignado?.is_anonimo    
    }

    if(parseInt(usrListEsp!.cantidad) > mesa.cantidad_comensales 
      || usrListEsp?.tipo_solicitado != mesa.tipo) {
        this.utilSvc.mostrarToast('La mesa no cumple con el tipo o cantidad solicitada',
          'error', 'middle',500
        );
        return;
    }
    this.mesaSvc.mesaSeleccionada.set(mesaAsignada);
    //! Lógica de verificación de reserva.
    await this.mesaSvc.editarMesa(mesaAsignada);
    this.confirm();
  }
  
  async liberarMesa(mesa: Mesa) {

    const mesaAsignada: Mesa ={
      ... mesa,
      usuario_id: 'disponible',
      usuario_asignado: 'disponible',
      usuario_es_anonimo: 'disponible',    
    }

    await this.mesaSvc.editarMesa(mesaAsignada);
    await this.utilSvc.mostrarAlert('Mesa desocupada', 'éxito')
  }
  
  //~ =================== Modal
  confirm() {
    return this.modalCtrl.dismiss(true, 'confirm');
  }
  cancel() {
    return this.modalCtrl.dismiss(false, 'cancel');
  }
  

}
