import { computed, inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { Pedido, DetallePedido } from '../models/Pedido';
import { RealtimeChannel } from '@supabase/supabase-js';
import { UsuarioSb } from './usuario-sb';
import { UbicacionService } from './ubicacion-service';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root',
})
export class PedidoSb {
  private sbSvc = inject(SupabaseService);
  private usrSvc = inject(UsuarioSb);
  private ubicacionSvc = inject(UbicacionService);
  private notifacionSvc = inject(NotificationService);

  //~ =================== Signals
  esPedidoDelivery = signal<boolean>(false);
  pedidoDelivery = signal<Pedido | null>(null);
  listaPedidos = signal<Pedido[]>([]);
  listaDetallePedidos = signal<DetallePedido[]>([]);

  private funcionesTR: (() => void | Promise<void>)[] = [];
  public uidPedidoActual = signal<string>('');

  usuarioPedidoActual = computed(()=>{
    const pedidoActual = this.listaPedidos().find(
      (m) => m.uid_cliente === this.usrSvc.usrActual()?.uid 
      && m.estado !== 'pagado'
    )
    return pedidoActual ?? null
  })


  //! =================== Métodos CRUD ===================
  async obtenerListadoDetallePedidos(uuid: string){
    let lista = await this.sbSvc.listarTodosFiltrados<DetallePedido>('detalle_pedido','uid_pedido',uuid);
    lista = await Promise.all(
      lista.map(async (dps) => ({
        ...dps,
        nombreProducto: await this.sbSvc.adquirirCelda(
          'productos',
          'nombre',
          'id',
          String(dps.id_producto)
        ),
      }))
    );
    return lista
  } 
  
  async agregarPedido(pdd: Pedido)
   {
    const identificador = crypto.randomUUID();
    pdd.uid = identificador;

    const detallePedido = (pdd.detalles ?? []).map(dp => ({
      ...dp,
      uid_pedido: pdd.uid,
    }));
    pdd.detalles = undefined;
    await this.sbSvc.insertar('pedidos', pdd)

    await Promise.all(
      detallePedido.map(dp => {
        const isCocina = dp.tipo !== 'bebida';
        const mensaje = `Se le encarga preparar ${dp.cantidad} ${dp.nombreProducto}`

        dp.nombreProducto = undefined;

        this.notifacionSvc.emitirNotificacion('¡Nuevo encargo!', mensaje, '/control'
          ,`${isCocina ? 'cocinero': 'bartender'}`);
          
        return this.sbSvc.insertar('detalle_pedido', dp);
      })
    );

  }
  
  async actualizarPedido(pdd: Pedido){
    const detallePedido = pdd.detalles!
    
    const actualizacion: Pedido = {
      ...pdd,
      tiempoEstimado: undefined,
      nombreCliente: undefined,
      numeroMesa: undefined,
      detalles: undefined,
    }
    const rta = await this.sbSvc.actualizar('pedidos', 'uid', pdd.uid!, actualizacion);
    if(!rta) return
    if( detallePedido.length !== 0){
      const listaDetalles = this.listaDetallePedidos();
      const detallesEliminados = listaDetalles.filter(ld => 
        !detallePedido.some(dp => dp.id === ld.id)
      );
      
      if(detallesEliminados.length !== 0){
        await Promise.all(
          detallesEliminados.map((dp) => this.eliminarDetalle(dp.id!))
        )
      }
      await Promise.all(
        detallePedido.map(dp => {
          dp.nombreProducto = undefined;
          dp.precio = undefined;
          console.log(JSON.stringify(dp))
          this.sbSvc.actualizar('detalle_pedido','id',String(dp.id!),dp)})
      );
    }
  }

   async eliminarPedido(pdd: Pedido){
    await this.sbSvc.eliminar('pedidos','uid',pdd.uid!);
  }
  
  async actualizarDetalle(dp: DetallePedido){
    dp.nombreProducto = undefined;
    dp.precio = undefined;
    await this.sbSvc.actualizar('detalle_pedido', 'id', String(dp.id!),dp);
  }

  eliminarCallbackRealtime(callback: () => void | Promise<void>) {
    this.funcionesTR = this.funcionesTR.filter(cb => cb !== callback);
  }
  
  //! =================== Elementos de Tiempo Real ===================
  private canalPedidos: RealtimeChannel | null = null;
  private isCanalInicializado = false;
  private reintentandoCanal = false;

  async iniciarCanalPedidos() {

    if (this.isCanalInicializado) return;

    await this.recargarListados();

    this.crearCanalPedidos();

    document.addEventListener('visibilitychange', async() => {

      if (
        document.visibilityState === 'visible' &&
        !this.isCanalInicializado &&
        !this.reintentandoCanal
      ) {

        console.warn('App volvió al foreground. Reconectando realtime...');

        await this.reconectarCanalPedidos();
      }
    });
  }

  private crearCanalPedidos() {

    this.canalPedidos = this.sbSvc.sb
      .channel('canal-pedidos');

    this.canalPedidos
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pedidos'
        },
        async(evento) => {

          console.log('Evento realtime PEDIDOS:', evento);

          switch (evento.eventType) {

            case 'INSERT':
              setTimeout(async() => {
                await this.recargarListados();
              }, 0);
            break;

            case 'UPDATE':
              await this.recargarListados();
            break;

            case 'DELETE':
              await this.recargarListados();
            break;
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'detalle_pedido'
        },
        async(evento) => {

          console.log('Evento realtime DETALLE:', evento);

          switch (evento.eventType) {

            case 'INSERT':
              setTimeout(async() => {
                await this.recargarListados();
              }, 1000);
            break;

            case 'UPDATE':
              await this.recargarListados();
            break;

            case 'DELETE':
              await this.recargarListados();
            break;
          }
        }
      )
      .subscribe(async(status) => {

        console.log('Estado canal realtime PEDIDOS:', status);

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

            console.warn('Canal realtime caído. Reconectando...');

            this.isCanalInicializado = false;

            await this.reconectarCanalPedidos();

          break;
        }
      });
  }

  private async reconectarCanalPedidos() {

    try {

      if (this.canalPedidos) {

        await this.destruirCanalPedidos();

        this.canalPedidos = null;
      }

      setTimeout(() => {
        this.crearCanalPedidos();
      }, 2000);

    } catch(error) {

      console.error('Error reconectando canal:', error);

      this.reintentandoCanal = false;
    }
  }

  async destruirCanalPedidos() {

    if (this.canalPedidos) {

      await this.sbSvc.sb.removeChannel(this.canalPedidos);

      this.isCanalInicializado = false;
    }
  }
  //! =================== Métodos privados ===================
  private async recargarListados(){
    const listaRelaciones = [
      'detalles:detalle_pedido(*, nombreProducto: productos(nombre,precio))',
      'nombreCliente:users(nombre,apellido)',

      'numeroMesa:mesas(numero)'
    ]
    const listaPedidos = await this.sbSvc.listarTodosConRelaciones<Pedido>('pedidos',listaRelaciones);

    for (const pd of listaPedidos) {

      pd.nombreCliente = `${(pd as any).nombreCliente?.nombre ?? ''} ${(pd as any).nombreCliente?.apellido ?? ''}`;
      pd.numeroMesa = (pd as any).numeroMesa?.numero ?? 'A domicilio';

      pd.detalles = pd.detalles!.map((dp:any)=> ({
        ...dp,
        nombreProducto: dp.nombreProducto?.nombre ?? '',
        precio: dp.nombreProducto?.precio ?? 0,
      }));

      if(pd.estado === 'en proceso' && pd.detalles.every((dp: DetallePedido)=> dp.estado_producto === 'preparado')){
        this.notifacionSvc.emitirNotificacion(`¡Revise el pedido de ${pd.nombreCliente}!`, 
          'El pedido ya se encuentra listo para servir.', '/control', 'mozo');
        await this.actualizarPedido({...pd, estado:'listo para servir'});
      }

      if(pd.es_delivery) {
        const distancia = this.ubicacionSvc.calcularDistanciaMetros(
          [-34.66225499015634,  -58.36449533700943],[parseFloat(pd.latitud), parseFloat(pd.longitud)]
        );
        const tiempoEstimado = (distancia/1000) * 3

        pd.tiempoEstimado = `${tiempoEstimado}`

      }
    }

    this.listaPedidos.set(listaPedidos);

    const pedidoActual = this.usuarioPedidoActual();

    if(pedidoActual){
      this.listaDetallePedidos.set(pedidoActual.detalles ?? []);
    }
  }

  private async eliminarDetalle(id: number){
    await this.sbSvc.eliminar('detalle_pedido', 'id', String(id));
  }


  //! =================== Métodos públicos ===================

  public async setUIDPedido() : Promise<string>
  {
    if (this.uidPedidoActual() == '')
    {
      let uidPedido = await this.sbSvc.adquirirPrimeraOUltimaCelda<string>
      ('pedidos', 'uid', 'uid_cliente',
        this.usrSvc.usrActual()!.uid!, 'created_at', false);

      if (uidPedido)
      {
        this.uidPedidoActual.set(uidPedido);  
      }      
    }
    
    return this.uidPedidoActual()
  }

  public async actualizarDescuentoDelPedidoActual(estado: boolean, descuento: 1 | 0.90 | 0.85 | 0.8) : Promise<void>
  {
    let cambios = 
    {
      descuento: descuento,
      estado_descuento: estado
    }

    await this.sbSvc.actualizar
    ('pedidos', 'uid', this.uidPedidoActual(), cambios)
  }
} 
