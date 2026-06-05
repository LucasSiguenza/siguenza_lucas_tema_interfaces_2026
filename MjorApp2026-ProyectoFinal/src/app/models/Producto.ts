export interface Producto
{
    id?: number,
    'created_at'? : string,
    nombre? : string,
    descripcion? : string,
    precio? : number,
    tiempo? : number,
    categoria? : 'plato' | 'bebida' | 'postre',
    imagenes?: string[],
    cantidad?: number
}