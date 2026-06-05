import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { addIcons } from 'ionicons';
import { DetallePedido, Pedido } from 'src/app/models/Pedido';
import { PedidoSb } from 'src/app/services/pedido-sb';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { Util } from 'src/app/services/util';
import { IonText, IonButton, IonContent, IonCard, IonCardContent, IonIcon } from "@ionic/angular/standalone";
import { ControladorPedidoComponent } from "../controlador-pedido/controlador-pedido.component";
import { checkmarkOutline } from 'ionicons/icons';

@Component({
  selector: 'app-panel-pedidos-preparacion',
  templateUrl: './panel-pedidos-preparacion.component.html',
  styleUrls: ['./panel-pedidos-preparacion.component.scss'],
  imports: [IonIcon, IonCardContent, IonCard, IonContent, IonButton, ControladorPedidoComponent, IonText],
})
export class PanelPedidosPreparacionComponent  implements OnInit {
  //! ======================= Variables y servicios =======================
  //~ ======================= Servicios 
  private usrSvc = inject(UsuarioSb);
  private pedidoSvc = inject(PedidoSb);
  private utilSvc = inject(Util);

  //~ ======================= Propiedades
  protected perfil = computed(()=>{
    return this.usrSvc.usrActual()?.perfil
  })
  protected listaFiltrada = computed(()=> {
    const pedidos = this.pedidoSvc.listaPedidos().filter(p => p.estado === 'en proceso');

    return pedidos.filter(p => {
      const detalles = p.detalles!;

      if (this.perfil() === 'bartender') {
        return detalles.some(d =>
          d.tipo === 'bebida' &&
          d.estado_producto === 'en proceso'
        );
      }

      if (this.perfil() === 'cocinero') {
        return detalles.some(d =>
          (d.tipo === 'plato' || d.tipo === 'postre') &&
          d.estado_producto === 'en proceso'
        );
      }

      return false;
    })
    
  });
  //~ ======================= Inicializadores
  constructor() { 
    addIcons({checkmarkOutline});
  }

  async ngOnInit() {
    const carga = await this.utilSvc.loading();

    await carga.present();
    await this.pedidoSvc.iniciarCanalPedidos();

    await carga.dismiss();
  }
  

  //! ======================= Métodos =======================

  //~ ======================= Paginación
  page = signal(1);
  pageSize = 1; 
  
  get paginatedItems(){
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
  //~ ======================= Lógicos
 

}
