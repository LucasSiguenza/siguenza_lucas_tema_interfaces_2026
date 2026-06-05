import { Component, computed, effect, inject, input, Input, isSignal, OnInit, signal, Signal } from '@angular/core';
import { addIcons } from 'ionicons';
import { ModalController, IonTitle, IonCard, IonCardContent, IonText, IonButton, IonIcon } from '@ionic/angular/standalone';
import { DetallePedido, Pedido } from 'src/app/models/Pedido';
import { PedidoSb } from 'src/app/services/pedido-sb';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { Util } from 'src/app/services/util';
import { ListaDetallePedidoComponent } from "../lista-detalle-pedido/lista-detalle-pedido.component";
import { CurrencyPipe, DecimalPipe, TitleCasePipe } from '@angular/common';
import { close, cloudUploadOutline } from 'ionicons/icons';
import { FormatoFechaPipe } from 'src/app/pipes/formato-fecha-pipe';

@Component({
  selector: 'app-controlador-pedido',
  templateUrl: './controlador-pedido.component.html',
  styleUrls: ['./controlador-pedido.component.scss'],
  imports: [IonTitle, IonCard, IonCardContent, ListaDetallePedidoComponent,CurrencyPipe, TitleCasePipe,
     IonText, IonIcon, FormatoFechaPipe, DecimalPipe],
})
export class ControladorPedidoComponent {
  //! ======================= Variables y servicios =======================
  private usrSvc = inject(UsuarioSb);
  private modalCtrl = inject(ModalController)

  //~ ======================= Propiedades
  pedido = input.required<Pedido>();
  propina = input<number>()
  descuento = input<number>()

  protected descuentoFormateado = computed(()=>{
    return Math.round((1 - (this.descuento())!) * 100)

  })

  perfilUsuario = computed(() => this.usrSvc.usrActual()?.perfil);
  
  protected total = computed(() => {
    const totalBruto = this.pedido().detalles!
      .reduce((acc, detalle) => acc + detalle.precio!, 0);

    const TotalConPropina = totalBruto * this.propina()!;
    const totalConDescuento = totalBruto * this.descuento()!;

    return totalConDescuento + TotalConPropina;

  });
  //~ ======================= Inicializadores
  constructor(){
    addIcons({ close });
  }

  //! ======================= Métodos =======================
  async cerrarModal(){
    await this.modalCtrl.dismiss(null, 'cancel');
  }
}
