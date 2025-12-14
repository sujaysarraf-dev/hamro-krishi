import { supabase } from '../config/supabase';

/**
 * Get user with automatic token refresh on 403 errors
 * This handles expired JWT tokens gracefully
 */
export const getUserWithRefresh = async () => {
    try {
        // First, check if we have a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // If no session exists, return early with a clear error
        if (!session || sessionError) {
            // Check if it's a "session missing" error - this is expected when not logged in
            if (sessionError?.message?.includes('session missing') || sessionError?.message?.includes('Auth session missing')) {
                return { user: null, error: { message: 'No active session. Please log in.', status: 401 } };
            }
            return { user: null, error: sessionError || { message: 'No active session' } };
        }
        
        // If session exists but is expired, try to refresh it
        if (session.expires_at) {
            const expiresAt = session.expires_at * 1000; // Convert to milliseconds
            const now = Date.now();
            const fiveMinutes = 5 * 60 * 1000;
            
            // If session expires within 5 minutes, refresh it proactively
            if (expiresAt - now < fiveMinutes) {
                console.log('Session expiring soon, refreshing proactively...');
                const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
                
                if (!refreshError && refreshedSession) {
                    // Session refreshed successfully
                    const { data: { user }, error: userError } = await supabase.auth.getUser();
                    return { user, error: userError };
                } else if (refreshError) {
                    console.warn('Failed to proactively refresh session:', refreshError);
                    // Continue with existing session if refresh fails
                }
            }
        }
        
        // Try to get the user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        // If no error, return user
        if (!userError && user) {
            return { user, error: null };
        }
        
        // If we get a 403 or JWT-related error, try refreshing the session
        if (userError && (userError.status === 403 || userError.message?.includes('JWT') || userError.message?.includes('token'))) {
            console.log('Auth error detected, attempting to refresh session...');
            
            // Try to refresh the session
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
                console.error('Failed to refresh session:', refreshError);
                // If refresh fails, the session is likely invalid - clear it
                await supabase.auth.signOut();
                return { user: null, error: refreshError };
            }
            
            if (refreshedSession) {
                // Retry getting user with refreshed session
                const { data: { user: retryUser }, error: retryError } = await supabase.auth.getUser();
                return { user: retryUser, error: retryError };
            }
        }
        
        // Handle "session missing" errors gracefully
        if (userError?.message?.includes('session missing') || userError?.message?.includes('Auth session missing')) {
            return { user: null, error: { message: 'No active session. Please log in.', status: 401 } };
        }
        
        // Return the original error if it's not a 403/JWT error
        return { user: null, error: userError };
    } catch (error) {
        console.error('Error in getUserWithRefresh:', error);
        // Handle "session missing" errors in catch block too
        if (error?.message?.includes('session missing') || error?.message?.includes('Auth session missing')) {
            return { user: null, error: { message: 'No active session. Please log in.', status: 401 } };
        }
        return { user: null, error };
    }
};

/**
 * Get session with automatic refresh
 */
export const getSessionWithRefresh = async () => {
    try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        // If we get a 403 or JWT error, try refreshing
        if (sessionError && (sessionError.status === 403 || sessionError.message?.includes('JWT'))) {
            console.log('Session error detected, attempting to refresh...');
            const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession();
            
            if (refreshError) {
                console.error('Failed to refresh session:', refreshError);
                return { session: null, error: refreshError };
            }
            
            return { session: refreshedSession, error: null };
        }
        
        return { session, error: sessionError };
    } catch (error) {
        console.error('Error in getSessionWithRefresh:', error);
        return { session: null, error };
    }
};

