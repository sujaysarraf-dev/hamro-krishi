import { useEffect, useState } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
                // User logged out, clear stored state and show welcome screen
                await AsyncStorage.removeItem('isLoggedIn');
                await AsyncStorage.removeItem('lastRoute');
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
            
            // First check AsyncStorage for login state (faster check)
            const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
            const savedRoute = await AsyncStorage.getItem('lastRoute');
            
            console.log('AsyncStorage check:', { isLoggedIn, savedRoute });
            
            // If logged in state exists, try to verify with Supabase session
            if (isLoggedIn === 'true' && savedRoute) {
                // Small delay to ensure session is fully established
                await new Promise(resolve => setTimeout(resolve, 100));
                
                // Verify session with Supabase
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();
                
                if (session && session.user && !sessionError) {
                    // Session is valid, redirect to saved route
                    console.log('Valid session found, redirecting to:', savedRoute);
                    setRedirectTo(savedRoute);
                    setTimeout(() => {
                        router.replace(savedRoute as any);
                    }, 50);
                    setLoading(false);
                    return;
                } else {
                    // Session invalid, clear stored state
                    console.log('Session invalid, clearing stored state');
                    await AsyncStorage.removeItem('isLoggedIn');
                    await AsyncStorage.removeItem('lastRoute');
                }
            }
            
            // Check Supabase session directly
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            console.log('Session check:', { hasSession: !!session, userId: session?.user?.id, error: sessionError });
            
            if (sessionError) {
                console.error('Session error:', sessionError);
                await AsyncStorage.removeItem('isLoggedIn');
                await AsyncStorage.removeItem('lastRoute');
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
                
                // Save login state and route to AsyncStorage
                await AsyncStorage.setItem('isLoggedIn', 'true');
                await AsyncStorage.setItem('lastRoute', targetRoute);
                
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
                // No session, clear stored state and show welcome screen
                console.log('No session, showing welcome screen');
                await AsyncStorage.removeItem('isLoggedIn');
                await AsyncStorage.removeItem('lastRoute');
                setShowWelcome(true);
                setLoading(false);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            await AsyncStorage.removeItem('isLoggedIn');
            await AsyncStorage.removeItem('lastRoute');
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
