import { supabase } from "../lib/supabase";
import AxiosPost from "./AxiosServices.module";

export interface PerfilUsuario {
    id: number;                 // bigint, primary key
    created_at: string;         // timestamp with time zone
    nombre?: string;            // text, nullable
    apellido?: string;          // text, nullable
    correo?: string;            // text, nullable
    telefono?: string;          // text, nullable
    estado?: boolean;           // boolean, nullable
    actualizado?: string;       // timestamp with time zone, nullable
    auth_id?: string;           // uuid, nullable
    user_id?: string;           // uuid, nullable
    role?: string;              // text, nullable (valor por defecto 'client')
    taller_id?: string;         // uuid, nullable
    rol_id?: number;           // number, nullable
}
export interface SingUpType {
    nombre?: string;            // text, nullable
    apellido?: string;          // text, nullable
    correo?: string;            // text, nullable
    telefono?: string;          // text, nullable
    estado?: boolean;           // boolean, nullable
    actualizado?: string;       // timestamp with time zone, nullable
    auth_id?: string;           // uuid, nullable
    taller_id?: string;         // uuid, nullable
    user_id?: string;           // uuid, nullable
    role?: string;              // text, nullable (valor por defecto 'client')
    rol_id?: number;
    password: string;           // number, nullable
}

const SIGNUP_SERVICES = {
    guardarPerfil: async (perfil: Omit<PerfilUsuario, 'id' | 'created_at' | 'actualizado' | 'auth_id' | 'user_id'>): Promise<PerfilUsuario> => {
        const user = await AxiosPost({ path: '/perfil_usuario', payload: perfil });
        return user[0];
    },
    SignUp: async (perfil: Omit<SingUpType, 'id' | 'created_at' | 'actualizado' | 'auth_id' | 'user_id'>): Promise<{ success: boolean; data: PerfilUsuario | null; error: string | null }> => {
        try {
            // Set default password for clients
            const password = perfil.password || '123456';
            // Verificar si el usuario ya existe en auth
            const { data: existingUser, error: existingUserError } = await supabase.auth.admin.listUsers({
                email: perfil.correo || ''
            });
            if (existingUser && existingUser.users && existingUser.users.length > 0) {
                return { success: false, data: null, error: 'El usuario ya existe. Por favor inicia sesión o recupera tu contraseña.' };
            }
            const { data, error: ErrorSignUp } = await supabase.auth.signUp({
                email: perfil.correo || '',
                password,
                options: {
                    data: { role: perfil.role } // metadata opcional
                },
            })
            if (ErrorSignUp) {
                if (ErrorSignUp.message && ErrorSignUp.message.includes('User already registered')) {
                    return { success: false, data: null, error: 'El usuario ya existe. Por favor inicia sesión o recupera tu contraseña.' };
                }
                throw new Error(ErrorSignUp.message);
            }
            if (!data.user) throw new Error('No se pudo crear el usuario en auth.');
            // Remove password before sending to perfil_usuario
            const perfilToSave = { ...perfil };
            delete perfilToSave.password;
            const user = await AxiosPost({ path: '/perfil_usuario', payload: { ...perfilToSave, auth_id: data.user.id } });

            // Crear registro en clients si el rol es cliente/client
            const role = (perfil.role || '').toLowerCase();
            if (role === 'cliente' || role === 'client') {
                const clientPayload = {
                    user_id: data.user.id,
                    name: `${perfil.nombre || ''} ${perfil.apellido || ''}`.trim() || perfil.correo || 'Cliente',
                    email: perfil.correo || '',
                    phone: perfil.telefono || '',
                    company: '',
                    client_type: 'Individual',
                    taller_id: perfil.taller_id || null
                };
                const { error: clientError } = await supabase.from('clients').insert([clientPayload]);
                if (clientError) {
                    console.error('Error creando cliente en tabla clients:', clientError.message, clientError.details);
                    throw new Error('No se pudo crear el registro en clients: ' + clientError.message);
                }
            }

            return { success: true, data: user[0], error: null };
        } catch (error: any) {
            let errorMsg = error?.message || String(error);
            if (errorMsg.includes('Invalid login credentials')) {
                errorMsg = 'Credenciales inválidas. Verifica tu correo y contraseña.';
            }
            return { success: false, data: null, error: errorMsg };
        }
    },
}

export default SIGNUP_SERVICES;