import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://kmxluayioaoqzmnfvwmx.supabase.co/rest/v1/";
const SUPABASE_PUBLIC_KEY = "sb_publishable_pXQVrJzoWzNRq2UY3Etv_Q_cVlznhz2";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLIC_KEY);
