export interface Mesa {
  id?: number;
  created_at?: string;
  cantidad_comensales: number;
  numero: string;
  tipo: string;
  foto?: string | null;
  usuario_asignado?: 'disponible' |string;
  usuario_id?: 'disponible' |string | null; // ID del usuario (uid o idTemporal) asignado a esta mesa
  usuario_es_anonimo?: 'disponible' | string ; // Indica si el usuario asignado es anónimo
}
