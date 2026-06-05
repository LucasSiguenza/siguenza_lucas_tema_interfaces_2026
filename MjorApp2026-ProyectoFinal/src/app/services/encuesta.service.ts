import { Injectable, inject, signal } from '@angular/core';
import { createClient } from '@supabase/supabase-js';
import { environment } from 'src/environments/environment.prod';
import { EncuestaData, EstadisticasEncuesta } from '../models/encuesta-data';
import { SupabaseService } from './supabase-service';

@Injectable({
  providedIn: 'root',
})
export class EncuestaService
{
  private supabase = inject(SupabaseService);

  public isEncuestaEnviada = signal<boolean>(false);

  /**
   * Obtiene todas las encuestas de la base de datos
   */
  async obtenerEncuestas(): Promise<EncuestaData[]>
  {
    const listaEncuestas = await this.supabase.listarTodos<EncuestaData>
    ('encuestas');

    return listaEncuestas;
  }

  /**
   * Calcula las estadísticas generales de todas las encuestas
   */
  async calcularEstadisticas(): Promise<EstadisticasEncuesta | null> {
    try {
      const encuestas = await this.obtenerEncuestas();

      if (encuestas.length === 0) {
        return null;
      }

      const total = encuestas.length;

      // Promedios de calificaciones (1-5)
      const promedioComida = this.calcularPromedio(
        encuestas.map((e) => e.comida)
      );
      const promedioBebida = this.calcularPromedio(
        encuestas.map((e) => e.bebida)
      );
      const promedioPrecioCalidad = this.calcularPromedio(
        encuestas.map((e) => e.precioCalidad)
      );
      const promedioAtencion = this.calcularPromedio(
        encuestas.map((e) => e.atencion)
      );

      // Porcentaje de personas que probaron postre
      const conPostre = encuestas.filter((e) => e.postre).length;
      const porcentajePostres = (conPostre / total) * 100;

      // Distribución de recomendación
      const si = encuestas.filter(
        (e) => e.probabilidadRecomendar === 'si'
      ).length;
      const no = encuestas.filter(
        (e) => e.probabilidadRecomendar === 'no'
      ).length;
      const tal_vez = encuestas.filter(
        (e) => e.probabilidadRecomendar === 'tal_vez'
      ).length;

      // Promedio general (todas las calificaciones numéricas)
      const promedioGeneral =
        (promedioComida +
          promedioBebida +
          promedioPrecioCalidad +
          promedioAtencion) /
        4;

      return {
        totalEncuestas: total,
        promedioComida,
        promedioBebida,
        porcentajePostres,
        promedioPrecioCalidad,
        promedioAtencion,
        distribucionRecomendacion: { si, no, tal_vez },
        promedioGeneral,
      };
    } catch (error) {
      console.error('Error calculando estadísticas:', error);
      return null;
    }
  }

  /**
   * Calcula el promedio de un array de números
   */
  private calcularPromedio(valores: number[]): number {
    if (valores.length === 0) return 0;
    const suma = valores.reduce((acc, val) => acc + val, 0);
    return parseFloat((suma / valores.length).toFixed(2));
  }

  /**
   * Obtiene las últimas N encuestas
   */
  async obtenerUltimasEncuestas(limite: number = 10): Promise<EncuestaData[]>
  {
    var listaEncuestas = await this.supabase.adquirirUltimasOPrimeraFilas<EncuestaData>
    ('encuestas', 'created_at', false, limite);
    return listaEncuestas;
  }

  public async subirEncuesta(datosEncuesta: EncuestaData)
  {
    await this.supabase.insertar('encuestas', datosEncuesta);
  }

  public async obtenerEncuestaPorIdPedido(uidPedido: string)
  {
    var encuesta = await this.supabase.adquirirCelda<EncuestaData>
    ('encuestas', '*', 'pedido_uid', uidPedido);
    return encuesta;
  }

  public async setSiEncuestaCompletada(uidePedido: string)
  {
    var encuesta = await this.obtenerEncuestaPorIdPedido(uidePedido);

    if (encuesta == null)
    {
      this.isEncuestaEnviada.set(false);
      return false;
    }

    this.isEncuestaEnviada.set(true);
    return true;
  }

}
