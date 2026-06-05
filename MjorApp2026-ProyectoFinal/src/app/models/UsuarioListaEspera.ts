export interface ListEsperaUsuario{
    id?: number,
    hora?: string,
    foto?: string,
    usuario: string,
    cantidad: string,
    tipo_solicitado: 'standar' | 'vip' | 'handicap',
    is_anonimo: boolean,
    nombre_usuario: string,
}