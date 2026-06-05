import { ModalController, IonHeader, IonToolbar, IonButtons, IonTitle, IonContent,
  IonBackButton, IonList, IonItem, IonLabel, IonNote, IonFooter,
  IonButton, IonIcon, IonBadge, IonGrid, IonRow, IonCol, IonCard, IonCardHeader,
  IonCardTitle, IonCardContent } from '@ionic/angular/standalone';
import { Component, inject, Input, OnInit, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, Location } from '@angular/common';
import { Producto } from 'src/app/models/Producto';
import { Util } from 'src/app/services/util';
import { addIcons } from 'ionicons';
import { addOutline, arrowBackCircleOutline, cartOutline, createOutline, removeOutline, timeOutline, trashOutline, close } from 'ionicons/icons';

@Component({
  selector: 'app-carrito-modal',
  templateUrl: './carrito-modal.component.html',
  standalone: true,
  styleUrls: ['./carrito-modal.component.scss'],
  imports: [CommonModule, IonButton, IonIcon, IonHeader, IonToolbar, IonTitle, 
    IonButtons, IonFooter, IonList, IonItem, IonLabel, IonBadge, IonNote, CurrencyPipe],
})
export class CarritoModalComponent {
  //! ==================== Variables y servicios ====================
  //~ ==================== Servicios
  private utilSvc = inject(Util);
  private modalCtrl = inject(ModalController)
  
  
  //~ ==================== Propiedades de modal
  @Input() carrito!: Producto[];
  @Input() esModificaicon!: boolean
  listaCarrito = signal<Producto[]>([])
  
  //~ ==================== Variables
  tiempoEstimado = signal(0);
  precioTotal = signal(0);

  //~ ==================== Inicialización 
  constructor() { 
    addIcons({arrowBackCircleOutline,close,cartOutline,removeOutline,addOutline,trashOutline,timeOutline,createOutline,});
  }
  
  async ionViewDidEnter(){
    const carga = await this.utilSvc.loading()
    await carga.present()
    this.listaCarrito.set([...(this.carrito ?? [])]);

    this.calcularTiempoEstimado();
    this.calcularTotal();
    await carga.dismiss()
  }

  ngOnChanges() {
    this.listaCarrito.set([...(this.carrito ?? [])]);
    alert(JSON.stringify(this.listaCarrito()));

    this.calcularTiempoEstimado();
    this.calcularTotal();
  }
  
  //! ==================== Métodos ====================
  //~ ==================== Interactivos a los elementos
  protected async volver() {
    await this.modalCtrl.dismiss(this.listaCarrito(), 'cancel');
  }
  
  incrementar(item: Producto) {

    this.listaCarrito.update(lista => {

      return lista.map(p => {
        if(p === item){
          return {
            ...p,
            cantidad: (p.cantidad ?? 1) + 1
          }
        }
        return p;
      });

    });

    this.calcularTiempoEstimado();
    this.calcularTotal();
  }

  decrementar(item: Producto) {

    this.listaCarrito.update(lista => {

      return lista.map(p => {

        if(p === item){

          const cantidad = p.cantidad ?? 1;

          if(cantidad <= 1) return p;

          return {
            ...p,
            cantidad: cantidad - 1
          }
        }

        return p;

      });

    });

    this.calcularTiempoEstimado();
    this.calcularTotal();
  }

  eliminar(item: Producto) {

    this.listaCarrito.update(lista => lista.filter(p => p !== item));

    this.calcularTiempoEstimado();
    this.calcularTotal();
  }
  
  //~ ==================== Lógicos
  /**
   * Calcula el tiempo estimado total del pedido
  */
  private calcularTiempoEstimado() {

    const tiempo = this.listaCarrito().reduce((acc, item) => {

      const tiempoItem = item.tiempo ?? 0;
      const cantidad = item.cantidad ?? 1;

      return acc + tiempoItem * cantidad;

    }, 0);

    this.tiempoEstimado.set(tiempo);
  }

  private calcularTotal() {

    const total = this.listaCarrito().reduce((acc, item) => {

      const precio = item.precio ?? 0;
      const cantidad = item.cantidad ?? 1;

      return acc + precio * cantidad;

    }, 0);

    this.precioTotal.set(total);
  }

  async confirmarPedido() {
    await this.modalCtrl.dismiss(this.listaCarrito(), 'confirm')
  }


}