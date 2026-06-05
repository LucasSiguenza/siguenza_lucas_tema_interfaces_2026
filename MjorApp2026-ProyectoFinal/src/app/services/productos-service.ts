import { inject, Injectable, signal } from '@angular/core';
import { Producto } from '../models/Producto'
import { SupabaseService } from './supabase-service';

@Injectable({
  providedIn: 'root',
})
export class ProductosService
{
  //Services
  private supabase = inject(SupabaseService);

  //properties
  public listaProductos = signal<Producto[]>([]);

  private async cargarListaDeProductos()
  {
    try
    {
      this.listaProductos.set(await this.supabase.listarTodos('productos'));
    } catch (error)
    {
      alert(`producto-service/cargarListaDeProductos: ${error}`);  
    }
  }

  /**
   * Obtener un único producto por id.
   */
  public async obtenerProducto(id: string | number): Promise<Producto | null>{
    return await this.supabase.adquirirFila<Producto>('productos', 'id', String(id))!
  }
  /**
   * Carga listaProductos si está vacía.
   */
  public async revisarListaDeProductos()
  {
    if (this.listaProductos().length == 0)
    {
      await this.cargarListaDeProductos();  
    }
  }

}
