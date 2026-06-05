export interface AnonUsuario{
    id?: number,
    uid?: string,
    perfil?: string | 'cliente',
    is_anonimo?: 'si' | 'no',
    nombre: string,
    foto: string,
}