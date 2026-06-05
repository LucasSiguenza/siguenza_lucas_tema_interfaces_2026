export interface Usuario {
    id?: number;
    uid?: string;
    created_at?: string;
    is_anonimo?: 'si' | 'no';
    email: string;
    nombre: string;
    apellido: string;
    dni: string;
    cuil: string;
    perfil: "dueño"| "maitre"| "supervisor"| "mozo" | "cliente" | "bartender" | "cocinero" | "delivery" | undefined;
    estado?: boolean;
    foto?: string | null;
    contrasenia?: string | null;
}

