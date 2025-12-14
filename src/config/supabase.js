import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://fanugvpugeowhpxfdkfn.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZhbnVndnB1Z2Vvd2hweGZka2ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU1OTA4MTcsImV4cCI6MjA4MTE2NjgxN30.mT6hWGAPgjPG7DHt_XnKfX57gkr8ukzkl-i7v9PA_JI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        // Refresh token automatically
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        // Handle auth errors globally
        flowType: 'pkce',
    },
});

// Set up global error handler for auth errors
supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'TOKEN_REFRESHED') {
        console.log('Token refreshed successfully');
    } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
    }
});

// Helper function to get user with automatic token refresh
export const getUserWithRefresh = async () => {
    try {
        // First, try to refresh the session if needed
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
            console.error('Session error:', sessionError);
            // Try to refresh the session
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError || !refreshedSession) {
                console.error('Failed to refresh session:', refreshError);
                return { user: null, error: refreshError || sessionError };
            }
            
            // Retry getting user with refreshed session
            const { data: { user }, error: userError } = await supabase.auth.getUser();
            return { user, error: userError };
        }
        
        // Check if session is about to expire (within 5 minutes)
        if (session && session.expires_at) {
            const expiresAt = session.expires_at * 1000; // Convert to milliseconds
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;
            
            if (expiresAt - now < fiveMinutes) {
                // Refresh session proactively
                const { error: refreshError } = await supabase.auth.refreshSession();
                if (refreshError) {
                    console.warn('Failed to proactively refresh session:', refreshError);
                }
            }
        }
        
        // Get user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        // If we get a 403, try refreshing the session once more
        if (userError && (userError.status === 403 || userError.message?.includes('JWT'))) {
            console.log('Got 403 error, attempting to refresh session...');
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (!refreshError && refreshedSession) {
                // Retry getting user
                const { data: { user: retryUser }, error: retryError } = await supabase.auth.getUser();
                return { user: retryUser, error: retryError };
            }
            
            return { user: null, error: refreshError || userError };
        }
        
        return { user, error: userError };
    } catch (error) {
        console.error('Error in getUserWithRefresh:', error);
        return { user: null, error };
    }
};

