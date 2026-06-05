export interface ChatEntry
{
    id?: number,
    created_at: string,
    chat_id: string,
    content: string,
    author: string,
    users:
    {
        uid: string,
        nombre: string,
        apellido?: string,
        perfil?: string
    }
}
