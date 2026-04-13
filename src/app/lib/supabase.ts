import { createClient } from '@supabase/supabase-js';

// Aquí le decimos a la app que busque las llaves que guardaste en el archivo .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Creamos y exportamos la conexión para poder usarla en cualquier parte de Appulso
export const supabase = createClient(supabaseUrl, supabaseAnonKey);