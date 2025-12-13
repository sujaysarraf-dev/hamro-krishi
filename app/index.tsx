import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { supabase } from '../src/config/supabase';
import WelcomeScreen from '../src/screens/WelcomeScreen';

export default function Index() {
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [redirectTo, setRedirectTo] = useState<string | null>(null);
    const [showWelcome, setShowWelcome] = useState(false);

    useEffect(() => {
        checkAuthAndRedirect();

        // Listen for auth state changes (login/logout)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state changed:', event, session?.user?.id);
            
            if (event === 'SIGNED_OUT' || !session) {
                // User logged out, show welcome screen
                setRedirectTo(null);
                setShowWelcome(true);
                setLoading(false);
            } else if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
                // User signed in or session refreshed, redirect based on role
                await checkAuthAndRedirect();
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const checkAuthAndRedirect = async () => {
        try {
            setLoading(true);
            setShowWelcome(false);
            setRedirectTo(null);
            
            // Small delay to ensure session is fully established after login
            await new Promise(resolve => setTimeout(resolve, 100));
            
            // Check if user has an active session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            console.log('Session check:', { hasSession: !!session, userId: session?.user?.id, error: sessionError });
            
            if (sessionError) {
                console.error('Session error:', sessionError);
                setShowWelcome(true);
                setLoading(false);
                return;
            }

            if (session && session.user) {
                // User is logged in, get their profile to determine role
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('role, interests')
                    .eq('id', session.user.id)
                    .maybeSingle();

                console.log('Profile check:', { role: profile?.role, error: profileError });

                // Set redirect target based on role
                let targetRoute;
                if (profile?.role === 'farmer') {
                    // Check if farmer has interests set
                    const hasInterests = profile?.interests && 
                        (Array.isArray(profile.interests) ? profile.interests.length > 0 : 
                         typeof profile.interests === 'string' ? profile.interests !== '[]' : 
                         Object.keys(profile.interests || {}).length > 0);
                    targetRoute = hasInterests ? '/farmer-dashboard' : '/farmer-interests';
                } else {
                    targetRoute = '/user-dashboard';
                }
                console.log('Redirecting to:', targetRoute);
                
                // Set redirect state and navigate
                setRedirectTo(targetRoute);
                
                // Use router.replace for immediate navigation
                setTimeout(() => {
                    router.replace(targetRoute as any);
                }, 50);
                
                // Keep loading true while redirecting
                return;
            } else {
                // No session, show welcome screen
                console.log('No session, showing welcome screen');
                setShowWelcome(true);
                setLoading(false);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            setShowWelcome(true);
            setLoading(false);
        }
    };

    // Show loading while checking auth or redirecting
    if (loading || redirectTo) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
                <ActivityIndicator size="large" color="#228B22" />
            </View>
        );
    }

    // Show welcome screen if not logged in
    if (showWelcome) {
        return <WelcomeScreen />;
    }

    // Default: show loading (shouldn't reach here)
    return (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFFFFF' }}>
            <ActivityIndicator size="large" color="#228B22" />
        </View>
    );
}
