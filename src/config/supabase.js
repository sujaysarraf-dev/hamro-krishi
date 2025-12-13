import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fanugvpugeowhpxfdkfn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbnVndnB1Z2Vvd2hweGZka2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTA4MTcsImV4cCI6MjA4MTE2NjgxN30.mT6hWGAPgjPG7DHt_XnKfX57gkr8ukzkl-i7v9PA_JI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

