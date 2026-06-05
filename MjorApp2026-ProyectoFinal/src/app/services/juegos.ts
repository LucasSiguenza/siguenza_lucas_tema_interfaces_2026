import { inject, Injectable, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment';
import { PedidoSb } from './pedido-sb';
import { SupabaseService } from './supabase-service';
import { Pedido } from '../models/Pedido';

@Injectable({
  providedIn: 'root'
})
export class Juegos
{
  //services
  private pedidosService = inject(PedidoSb);
  private supaBase = inject(SupabaseService);

  //properties
  public isJuegoIntentado = signal<boolean>(true);


  public async revisarSiJuegoIntentado(uidPedido: string)
  {
    var estadoDescuento = await this.supaBase.adquirirCelda<Boolean>
    ('pedidos', 'estado_descuento', 'uid', uidPedido);

    if (estadoDescuento != null)
    {
      switch (estadoDescuento)
      {
        case true:
          this.isJuegoIntentado.set(true);
          break;
      
        case false:
          this.isJuegoIntentado.set(false);
          break;
      }
    }
  }

  public async obtenerUIDPedido() : Promise<string>
  {
    return await this.pedidosService.setUIDPedido();
  }

  public async cambiarEstadoDescuento(estado: boolean, descuento: 1 | 0.90 | 0.85 | 0.8)
  :  Promise<void>
  {
    await this.pedidosService.setUIDPedido();
    await this.pedidosService.actualizarDescuentoDelPedidoActual(estado, descuento);
  }

}
