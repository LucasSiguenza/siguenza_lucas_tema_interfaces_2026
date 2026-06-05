import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { ListEsperaUsuario } from 'src/app/models/UsuarioListaEspera';
import { ListaEsperaSb } from 'src/app/services/lista-espera-sb';
import { MesasSb } from 'src/app/services/mesas-sb';
import { Util } from 'src/app/services/util';
import { PanelMesasComponent } from '../panel-mesas/panel-mesas.component';
import { IonButtons, IonButton, IonIcon, IonCardTitle, IonCard, IonCardHeader, IonCardContent, IonBadge, IonText } from "@ionic/angular/standalone";
import { FormatoFechaPipe } from 'src/app/pipes/formato-fecha-pipe';
import { FormatoTipoMesaPipe } from 'src/app/pipes/formato-tipo-mesa-pipe';
import { addIcons } from 'ionicons';
import { checkmarkCircleOutline, checkmarkOutline, chevronBackOutline, chevronForwardOutline, trash } from 'ionicons/icons';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { INotification } from 'src/app/services/notification';
import { environment } from 'src/environments/environment';
import { NotificationService } from 'src/app/services/notification.service';
import { Usuario } from 'src/app/models/usuario';

@Component({
  selector: 'app-lista-espera',
  templateUrl: './lista-espera.component.html',
  styleUrls: ['./lista-espera.component.scss'],
  imports: [IonText, IonBadge, IonCardContent, IonCardHeader, IonCard,
     IonCardTitle, IonIcon, IonButton, IonButtons, FormatoFechaPipe, FormatoTipoMesaPipe],
})
export class ListaEsperaComponent  implements OnInit {

  //!================ Variables y servicios ================
  private utilSvc = inject(Util);
  private lEspSvc = inject(ListaEsperaSb);
  private mesaSvc = inject(MesasSb);
  private usrSvc = inject(UsuarioSb);
  private notificacionSvc = inject(NotificationService)
  
  //~================ Inicialización del componente
  
  constructor(){
    addIcons({trash, checkmarkCircleOutline, 
      chevronBackOutline, chevronForwardOutline, checkmarkOutline})
  }

  async ngOnInit() {
    await this.lEspSvc.iniciarTRListEsperaUsuarios();
  }
  ngOnDestroy(): void {
  }
  //!================ Elementos visuales ================
  //~================ Paginación
  
  //* ✅ Señal para la página actual
  page = signal(1);
  pageSize = 1; 
  
  //* ✅ Lista filtrada y ordenada (reactiva)
  listaFiltrada = computed(() =>
    (this.lEspSvc.listaEsperaUsuarios() ?? [])
);

//* ✅ Lista paginada derivada de la lista filtrada
get paginatedItems(): ListEsperaUsuario[] {
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
  
  //~================ Color de estado
  getStatusColor(status: boolean): string {
    switch (status) {
      case true: return 'success';
      case false: return 'medium';
    }
  }

  //!================ Métodos Funcionales ================
  protected async asignarMesaUsuario(user: ListEsperaUsuario) {
    const loader = await this.utilSvc.loading();
    this.lEspSvc.usrSeleccionado.set(user);
    this.usrSvc.usrSeleccionado.set(await this.usrSvc.seleccionarUsuario(user.usuario))
    this.mesaSvc.isModal.set(true);
    const modal = await this.utilSvc.crearModal(PanelMesasComponent, 'lg',{},true)
        
    const {data, role } = await modal.onDidDismiss();
    await loader.present()
    
    if(role === 'confirm') {
      this.utilSvc.mostrarToast("Se está asignando el usuario...", 'info','middle',250);
      this.enviarNotificacionCliente(user,true, this.mesaSvc.mesaSeleccionada()?.numero);
      this.mesaSvc.mesaSeleccionada.set(null);
    }else {
      this.utilSvc.mostrarToast("No se ha podido asignar el usuario.", 'error','middle',250)
      this.usrSvc.usrSeleccionado.set(null);
      this.lEspSvc.usrSeleccionado.set(null);
      this.mesaSvc.isModal.set(false);
      await loader.dismiss();
      return;
    };
     
    
    this.lEspSvc.usrSeleccionado.set(null);
    this.usrSvc.usrSeleccionado.set(null);
    await this.lEspSvc.eliminarListEsperaUsuario(user); 
    this.utilSvc.mostrarToast("¡Usuario asignado!", 'success','middle',1000);
    
    if(this.page() !== 1){
      this.prevPage();
    }

    this.lEspSvc.usrSeleccionado.set(null);
    this.mesaSvc.isModal.set(false);
    loader.dismiss();
  }

  protected async rechazarUsuario(user: ListEsperaUsuario){
    try{
      await this.enviarNotificacionCliente(user, false)
      await this.lEspSvc.eliminarListEsperaUsuario(user);
      this.utilSvc.mostrarToast("💥Usuario rechazado",'info','middle',700);
      if(this.page() !== 1) this.prevPage();
    } catch(e){
      await this.utilSvc.mostrarAlert('Error',(e as Error).message);
      await this.utilSvc.mostrarToast("No se pudo rechazar...",'info','middle',700);
    }

  }


  async enviarNotificacionCliente(cliente: ListEsperaUsuario,
    isAprobado: boolean, numeroMesa?: string) {
      const notification: INotification = {
        title: `${isAprobado ? '¡Se te ha asignado una mesa!' : 'No te hemos podido asignar.'}`,
        body: `${isAprobado 
          ? `Su mesa es la número ${numeroMesa} y ya puede escanear el qr correspondiente`
          : `Lamentamos notificarle que no disponemos de mesas con las especificaciones solicitadas. 
          Lo invitamos a volver en otro momento o solicitar otra especificación.`}`,
        data: {url: '/cliente'},
        userIds: [cliente.usuario!.replace(/-/g, "")],
      };
  
      try {
        await this.notificacionSvc.enviarNotificacion(notification,
                            environment.oneSignalAvisoChannel);
      } catch (error) {
        console.error('Error enviando notificación al maitre:', error);
      }
    }

}
