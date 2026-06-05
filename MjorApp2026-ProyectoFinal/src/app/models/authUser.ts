export interface AuthUser {
  id: string;                  // UUID del usuario en Supabase
  aud: string;                 // "authenticated" o "anon"
  role: string;                // Rol asignado en JWT (ej: "authenticated")
  email?: string;              // Correo del usuario (puede ser null)
  phone?: string;              // Teléfono (si se usa auth por SMS)
  app_metadata: {
    provider?: string;         // Proveedor de login: "email", "github", "google", etc.
    [key: string]: any;        // Posibles campos extra
  };
  user_metadata: {
    name?: string;             // Nombre personalizado
    avatar_url?: string;       // URL del avatar (si lo devuelve el provider)
    [key: string]: any;        // Otros metadatos de tu app
  };
  created_at: string;          // Fecha ISO de creación
  updated_at?: string;         // Fecha ISO de última actualización
  last_sign_in_at?: string;    // Último inicio de sesión
  email_confirmed_at?: string; // Fecha de verificación de email
  phone_confirmed_at?: string; // Fecha de verificación de teléfono
  is_anonymous?: boolean;
}