import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://izfvdpincssepgnibdzz.supabase.co'
const supabaseAnonKey = 'sb_publishable_nnts8ZpjzoO84FqrcNWOdA_Z1CyulZv'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
