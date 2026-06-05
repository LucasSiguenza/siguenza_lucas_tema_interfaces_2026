import { Component, computed, inject, input, Input, isSignal, OnInit, Signal, signal } from '@angular/core';
import { addIcons } from 'ionicons';
import { DetallePedido, Pedido } from 'src/app/models/Pedido';
import { Usuario } from 'src/app/models/usuario';
import { PedidoSb } from 'src/app/services/pedido-sb';
import { Util } from 'src/app/services/util';
import { IonButton, IonIcon } from "@ionic/angular/standalone";
import { CurrencyPipe, TitleCasePipe } from '@angular/common';
import { checkmarkOutline, list } from 'ionicons/icons';

@Component({
  selector: 'app-lista-detalle-pedido',
  templateUrl: './lista-detalle-pedido.component.html',
  styleUrls: ['./lista-detalle-pedido.component.scss'],
  imports: [IonIcon, IonButton, TitleCasePipe, CurrencyPipe],
})
export class ListaDetallePedidoComponent  implements OnInit {
  //! ======================= Variables y servicios =======================
  //~ ======================= Servicios 
  private pedidoSvc = inject(PedidoSb);
  private utilSvc = inject(Util);
  
  //~ ======================= Propiedades
  pedido = input.required<Pedido>();
  perfil = input.required<Usuario['perfil']>();

  protected listaFiltrada = computed(()=> {
    const todosDetalles = this.pedido().detalles!

    if (!todosDetalles) return [];

    if (this.perfil() === 'bartender') {
      return todosDetalles.filter(dp => dp.tipo === 'bebida' && dp.estado_producto === 'en proceso');
    }

    if (this.perfil() === 'cocinero') {
      return todosDetalles.filter(dp => (dp.tipo === 'plato' || dp.tipo === 'postre') && dp.estado_producto === 'en proceso');
    }

    return todosDetalles;
  })

  //~ ======================= Inicializadores
  constructor() { 
    addIcons({checkmarkOutline})
  }

  async ngOnInit() {
  }


  //! ======================= Métodos =======================
  //~ ======================= Paginación
  page = signal(1);
  pageSize = 10; 
  
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
  async completarDetalle(detalle: DetallePedido){
    const carga = await this.utilSvc.loading();
    await carga.present();
    const act: DetallePedido = {
      ...detalle,
      estado_producto: 'preparado'
    }
    await this.pedidoSvc.actualizarDetalle(act);
    await carga.dismiss();
  }

}
