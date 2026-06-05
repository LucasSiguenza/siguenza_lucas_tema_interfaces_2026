export interface Pedido{
    //* ============ Parámetros ajenos a la bd ============
    nombreCliente?: string | {nombre: string, apellido: string},
    numeroMesa?: string,
    created_at?: string,
    tiempoEstimado?: string 
    detalles?: DetallePedido[];
    //* ============ Parámetros del esquema ============
    //^ ============ Opcionales 
    id?: number,
    uid?: string,
    propina?: number,
    //^ ============ Obligatorios 
    uid_cliente: string,
    mesa_id: string | null,
    descuento: 1 | number,
    estado_descuento: boolean,
    estado: 
    'espera de aprobación' | 
    'rechazado' | 
    'en proceso' |
    'listo para servir'| 
    'en camino' | 
    'en mesa' | 
    'listo para pagar' | 
    'espera confirmación de pago' |
    'pagado',
    es_delivery: boolean,
    direccion_cliente: string | 'local',
    latitud: string | '0',
    longitud: string | '0',
}
export interface DetallePedido{
    id?: number,
    created_at?: string,
    nombreProducto?: string,
    uid_pedido?: string,
    precio?: number;
    tipo: 'plato' | 'postre' | 'bebida'
    id_producto: number,
    cantidad: number,
    estado_producto: 'completado'| 'en proceso' | 'preparado'|string,

}