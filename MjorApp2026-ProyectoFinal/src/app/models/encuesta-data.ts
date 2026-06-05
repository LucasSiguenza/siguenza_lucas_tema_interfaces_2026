export interface EncuestaData {
  id?: number;
  created_at?: string;
  comida: number;
  bebida: number;
  postre: boolean;
  precioCalidad: number;
  atencion: number;
  probabilidadRecomendar: 'si' | 'no' | 'tal_vez';
  comentario?: string;
  pedido_uid?: string;
}

export interface EstadisticasEncuesta {
  totalEncuestas: number;
  promedioComida: number;
  promedioBebida: number;
  porcentajePostres: number;
  promedioPrecioCalidad: number;
  promedioAtencion: number;
  distribucionRecomendacion: {
    si: number;
    no: number;
    tal_vez: number;
  };
  promedioGeneral: number;
}
