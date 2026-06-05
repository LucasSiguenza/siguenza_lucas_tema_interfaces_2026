import { Component, inject, OnInit, signal, CUSTOM_ELEMENTS_SCHEMA, ViewChildren, QueryList, ElementRef  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonHeader,
  IonCard,
  IonButton,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonIcon,
  IonCardContent,
  IonCardTitle,
  IonCardHeader,
  IonCardSubtitle,
  IonFab,
  IonFabButton,
  ModalController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { addCircleOutline, addOutline, cartOutline, removeOutline } from 'ionicons/icons';
import { Producto } from 'src/app/models/Producto';
import { HeaderComponent } from "src/app/components/alfa/header/header.component";
import { NombreProductoPipe } from "../../../pipes/nombre-producto-pipe";
import { Swiper } from 'swiper/types';
import { register } from 'swiper/element/bundle';
import { Util } from 'src/app/services/util';
import { Router } from '@angular/router';
import { UsuarioSb } from 'src/app/services/usuario-sb';
import { environment } from 'src/environments/environment';
import { ProductosService } from 'src/app/services/productos-service';
import { PedidoSb } from 'src/app/services/pedido-sb';
import { CarritoModalComponent } from 'src/app/components/elementos/carrito-modal/carrito-modal.component';
import { DetallePedido, Pedido } from 'src/app/models/Pedido';
import { MesasSb } from 'src/app/services/mesas-sb';
import { GiroscopioService } from 'src/app/services/giroscopio-service';
import { Subscription } from 'rxjs';
import { Mesa } from 'src/app/models/Mesa';
import { INotification } from 'src/app/services/notification';
import { NotificationService } from 'src/app/services/notification.service';


register();

@Component({
  selector: 'app-carta',
  templateUrl: './carta.page.html',
  styleUrls: ['./carta.page.scss'],
  standalone: true,
  imports: 
  [ IonFabButton, IonFab, IonCardSubtitle, IonCardHeader, IonCardTitle, IonCardContent, IonIcon, 
    IonLabel, IonSegmentButton, IonSegment, IonButton, IonCard, IonContent, IonHeader, CommonModule, 
    FormsModule, HeaderComponent, NombreProductoPipe
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class CartaPage implements OnInit
{
  //! ==================== Variables y servicios ====================
  //~ ==================== Servicios
  private usuarioSupaBase = inject(UsuarioSb);
  private productosService = inject(ProductosService);
  private utils = inject(Util);
  private router = inject(Router);
  private productoSvc = inject(ProductosService)
  private pedidoSvc = inject(PedidoSb); 
  private mesaSvc = inject(MesasSb)
  private giroscopioSvc = inject(GiroscopioService);
  private notificacionSvc = inject(NotificationService)
  
  //~ ==================== Propiedades
  protected platos: any[] = [];
  protected bebidas: any[] = [];
  protected postres: any[] = [];
  protected productos: Producto[] = [];
  protected cantidadProducto = 1;
  protected showAvisoAprobacion : boolean = false;
  protected showAvisoPendiente : boolean = false;
  protected carrito = signal<Producto[]>([]);
  
  //? Propiedades de edición y delivery
  private detallePedido: DetallePedido[] = []
  protected pedidoDelUsuario = this.pedidoSvc.usuarioPedidoActual();

  private delivery = this.pedidoSvc.pedidoDelivery();

  //? Propiedades del control giroscópico
  @ViewChildren('mainSwiper') private mainSwipers!: QueryList<ElementRef>;

  @ViewChildren('imageSwiper') private imageSwipers!: QueryList<ElementRef>;

  private motionSub: Subscription | null = null;

  private ultimoEvento = 0;
  private readonly delayMs = 1200;

  private contadorSacudidas = 0;

  get PrecioTotal(){
    const sumaTotal = this.carrito().reduce((total, p) => total + (p.precio! * p.cantidad!) , 0);
    return sumaTotal;
  }
  
  segmentoActivo = signal('platos');
  
  private bucketProductos = 'productos';
  
  //~ ==================== Inicialización 
  constructor()
  {
    addIcons({ addCircleOutline, cartOutline, removeOutline, addOutline });
  }

  async ngOnInit()
  {
    const estado = await this.revisarEstadoComprobacionDelMozo();
    if(estado ==='rechazado'){
      this.detallePedido = this.pedidoSvc.listaDetallePedidos();
      Promise.all(
        this.detallePedido.map(async(dp) => {
          const pd = await this.productoSvc.obtenerProducto(dp.id_producto)
          pd!.cantidad = dp.cantidad
          this.carrito().push(pd!);
        })  
      )
    }
    await this.pedidoSvc.iniciarCanalPedidos();
  }

  async ionViewWillEnter()
  {
    await this.cargarDatos();
    console.log(this.mesaSvc.mesaDelUsuario())
    await this.activarDetector();
  }
  async ionViewWillLeave(): Promise<void>
  {
    if (this.motionSub)
    {
      this.motionSub.unsubscribe();
    }

    await this.giroscopioSvc.stopMotionListener();
  }

  segmentChanged(event: any)
  {
    this.reiniciarCantidad();
    this.segmentoActivo.set(event.detail.value);
  }

  onSlideChange()
  {
    this.reiniciarCantidad();
  }
  //! ==================== Métodos ====================


  //~ ==================== Redirección
  
  protected goToCliente()
  {
    this.showAvisoAprobacion = false;
    this.showAvisoPendiente = false;
    this.router.navigateByUrl("/cliente");
  }
  
  protected volver(){
    this.utils.goBack();
  }

  //~ ==================== Lógicos.
  private async revisarEstadoComprobacionDelMozo(): Promise<string|null>
  {
    const estado = this.pedidoSvc.usuarioPedidoActual()?.estado ?? null

    if(!estado) return null;
    if(estado === 'rechazado') return estado;
    if(estado === 'espera de aprobación') {
      this.showAvisoPendiente = true; 
      return estado
    }
    if(estado !== 'pagado') this.showAvisoAprobacion = true; 
    return null;
   }

  async cargarDatos()
  {
    const loading = await this.utils.loading();
    await loading.present();
    try {
      if (this.platos.length <= 0)
        {
          await this.productosService.revisarListaDeProductos();
          const productosData = this.productosService.listaProductos();
          
        if (Array.isArray(productosData))
        {
          this.productos = productosData.map((producto) =>
            {
              producto.imagenes =
            [
              `${environment.supabaseStorageUrl}${this.bucketProductos}/${producto.nombre}-0.jpeg`,
              `${environment.supabaseStorageUrl}${this.bucketProductos}/${producto.nombre}-1.jpeg`,
              `${environment.supabaseStorageUrl}${this.bucketProductos}/${producto.nombre}-2.jpeg`,
            ];
            
            return producto;
          });
          
          for (let index = 0; index < this.productos.length; index++)
            {
              switch (this.productos[index].categoria)
              {
                case 'plato':
                this.platos.push(this.productos[index]);
                break;
                
                case 'bebida':
                  this.bebidas.push(this.productos[index]);
                  break;
                  
                  case 'postre':
                    this.postres.push(this.productos[index]);
                break;
            }
          }
          
          this.productos = [];
        } else {
          this.productos = [];
          this.utils.mostrarToast('Error al cargar los productos', 'error');
        }
      }
    } catch (error)
    {
      alert(`carta-page/cargarDatos: ${JSON.stringify(error)}`);
      console.error('Error detallado:', error);
    } finally
    {
      await loading.dismiss();
    }
  }
  
  async abrirCarrito(){
    const carga = await this.utils.loading(); 
    const modal = await this.utils.crearModal(CarritoModalComponent, 'md',
      {carrito: this.carrito(), esModificacion: false}, true);
    
    const {data, role} = await modal.onDidDismiss();
    await carga.present();

    if(role === 'confirm'){
      const detallePedido = (data as Producto[]).map((p) => {
        const detalle: DetallePedido = {
          cantidad: p.cantidad!,
          estado_producto: 'asignación',
          id_producto: p.id!,
          tipo: p.categoria!
        }
        if(this.detallePedido.length > 0){
          this.detallePedido.map((d) => {
            if(d.id_producto === detalle.id_producto){
              detalle.id = d.id;
              detalle.uid_pedido = d.uid_pedido
            }
          })
        }

        return detalle;
      })
    
      let pedido: Pedido = {
        ...this.pedidoDelUsuario,
        descuento: 1,
        direccion_cliente: 'local',
        es_delivery: false,
        estado: 'espera de aprobación',
        estado_descuento: this.usuarioSupaBase.usrActual()?.is_anonimo === 'no',
        latitud: 'local',
        longitud: 'local',
        mesa_id: String(this.mesaSvc.mesaDelUsuario()?.id),
        uid_cliente: this.usuarioSupaBase.usrActual()!.uid!,
        detalles: detallePedido,
      }

      if(this.pedidoSvc.esPedidoDelivery()){
        pedido ={...pedido,
          direccion_cliente: this.delivery?.direccion_cliente!,
          es_delivery: true,
          mesa_id: null,
          latitud: this.delivery?.latitud!,
          longitud:  this.delivery?.longitud!,
        }
      }
      try{
        
        if(this.pedidoDelUsuario?.estado === 'rechazado') {
          await this.pedidoSvc.actualizarPedido(pedido)
        }
        else await this.pedidoSvc.agregarPedido(pedido);
        console.log("Acá la envía")
        await this.enviarNotificacionMozo(this.mesaSvc.mesaDelUsuario())
        console.log("Ya la envió")
        await this.utils.mostrarToast('¡Pedido solicitado!', 'success','middle',2000)
        await this.utils.redirigir('cliente');
      } catch(e){
        await this.utils.mostrarToast('Algo salió mal.', 'error', 'middle',500);
      }
    }
    if(role === 'cancel'){
      const nuevoCarrito  = (data as Producto[]); 
      this.carrito.set(nuevoCarrito);
      await this.utils.mostrarToast('Acción cancelada.', 'info', 'middle', 500);
    }

    await carga.dismiss();

    
  }

  async agregarAlCarrito(producto: Producto){
    const nuevoProducto = {
      id: producto.id,
      nombre: producto.nombre,
      cantidad: this.cantidadProducto,
      precio: producto.precio,
      descripcion: producto.descripcion,
      categoria: producto.categoria,
      tiempo: producto.tiempo
    } as Producto;
    
    const carritoActual = this.carrito();
    const productoPrevio = carritoActual.find((p) => p.id === nuevoProducto.id);
    
    if(productoPrevio){
      const carritoActualizado = carritoActual.map((p) =>
        p.id === nuevoProducto.id
          ? { ...p, cantidad: p.cantidad! + nuevoProducto.cantidad! }
          : p
      );

      this.carrito.set(carritoActualizado);

    } else {
      this.carrito.set([...carritoActual, nuevoProducto]);
    }

    this.utils.mostrarToast(
      `${this.utils.formatearNombre(producto.nombre!)} añadido al carrito.`,
      'success',
      'middle',
      1000
    );
  }
  
  //~ ==================== Giroscópicos
  private async activarDetector()
  {
    this.motionSub = this.giroscopioSvc
    .getAccelerationObservable()
    .subscribe(acc =>
    {
      const ahora = Date.now();

      if (ahora - this.ultimoEvento < this.delayMs) return;

      this.ultimoEvento = ahora;

      this.evaluarOrientacion(acc.x, acc.y, acc.z);
    });
  }
  private evaluarOrientacion(x: number, y: number, z: number)
  {
    console.log('X:', x, 'Y:', y, 'Z:', z);

    // =========================
    // FOTOS
    // =========================

    if (x > 3)
    {
      this.fotoAnterior();
      this.detectarSacudida();
    }

    if (x < -3)
    {
      this.fotoSiguiente();
      this.detectarSacudida();
    }

    // =========================
    // PRODUCTOS
    // =========================

    if (y > 3)
    {
      this.productoAnterior();
    }

    if (y < -3)
    {
      this.productoSiguiente();
    }
  }

  private obtenerMainSwiper(): any
  {
    return this.mainSwipers.first?.nativeElement.swiper;
  }

  private obtenerImageSwiper(): any
  {
    return this.imageSwipers.first?.nativeElement.swiper;
  }

  private fotoSiguiente()
  {
    const swiper = this.obtenerImageSwiper();

    if (swiper)
    {
      swiper.slideNext();
    }
  }

  private fotoAnterior()
  {
    const swiper = this.obtenerImageSwiper();

    if (swiper)
    {
      swiper.slidePrev();
    }
  }

  private productoSiguiente()
  {
    const swiper = this.obtenerMainSwiper();

    if (swiper)
    {
      swiper.slideNext();
    }
  }

  private productoAnterior()
  {
    const swiper = this.obtenerMainSwiper();

    if (swiper)
    {
      swiper.slidePrev();
    }
  }

  private detectarSacudida()
  {
    this.contadorSacudidas++;

    if (this.contadorSacudidas >= 4)
    {
      this.volverAlInicio();

      this.contadorSacudidas = 0;
    }

    setTimeout(() =>
    {
      this.contadorSacudidas = 0;
    }, 3000);
  }

  private volverAlInicio()
  {
    const swiper = this.obtenerMainSwiper();

    if (swiper)
    {
      swiper.slideTo(0);
    }
  }

  //~ ==================== Notificación
    async enviarNotificacionMozo(mesa: Mesa | null) {
        const notification: INotification = {
          title: `${mesa 
          ? `Solicitud de la mesa ${mesa!.numero}`
          : `Solicitud de ${this.usuarioSupaBase.usrActual()?.nombre} ${this.usuarioSupaBase.usrActual()?.apellido}`}`,
          body: `${this.pedidoDelUsuario ? 'Se ha reformulado el pedido' : 'Ha solicitado un pedido.'}`,
          data: {url: '/control'},
          segments: [mesa !== null 
            ? 
            'mozo'
            : 
            'dueño'],
        };
        
        console.log(JSON.stringify(notification));
        try {
          await this.notificacionSvc.enviarNotificacion(notification,
                              environment.oneSignalAvisoChannel);
        } catch (error) {
          console.error('Error enviando notificación al maitre:', error);
        }
      }

  //~ ==================== Interacción de cantidades
  protected sumarUnoCantidad()
  {
    this.cantidadProducto += 1;
  }
  
  protected restarUnoCantidad()
  {
    if (this.cantidadProducto > 0)
      {
        this.cantidadProducto -= 1;      
      }
    }
    
  protected reiniciarCantidad(){
      this.cantidadProducto = 1;
    }
    

  }
  