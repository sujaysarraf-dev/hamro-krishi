import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../config/supabase';
import SweetAlert from '../../components/SweetAlert';

const UserProfileScreen = () => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [logoutAlert, setLogoutAlert] = useState({ visible: false, type: 'warning', title: '', message: '' });

    useEffect(() => {
        loadUserData();
    }, []);

    // Reload data when screen comes into focus (e.g., when returning from edit profile)
    useFocusEffect(
        React.useCallback(() => {
            loadUserData();
        }, [])
    );

    const loadUserData = async () => {
        try {
            // Get current user first (more reliable than getSession)
            const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
                console.error('Error getting user:', userError);
                // Only redirect if it's an auth error, not a network error
                if (userError.message?.includes('JWT') || userError.message?.includes('session') || userError.message?.includes('token')) {
                    console.log('Auth error, redirecting to login');
                    router.replace('/regular-login');
                    return;
                }
                // For other errors, just log and continue
                console.log('Non-auth error, continuing...');
            }

            if (!currentUser) {
                // Double check with session before redirecting
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                    console.log('No user and no session, redirecting to login');
                    router.replace('/regular-login');
                    return;
                }
                // If session exists but no user, wait a bit and retry (might be refreshing)
                await new Promise(resolve => setTimeout(resolve, 500));
                const { data: { user: retryUser } } = await supabase.auth.getUser();
                if (!retryUser) {
                    console.log('Still no user after retry, redirecting to login');
                    router.replace('/regular-login');
                    return;
                }
                setUser(retryUser);
                // Continue with retryUser
                await loadProfileData(retryUser);
                return;
            }

            setUser(currentUser);
            
            // Continue with profile loading
            await loadProfileData(currentUser);
        } catch (error) {
            console.error('Error loading user data:', error);
            // Don't redirect on error, just log and show what we have
        } finally {
            setLoading(false);
        }
    };

    const loadProfileData = async (currentUser) => {
        try {
            // Get user profile - use maybeSingle instead of single to handle missing profiles
            const { data: profileData, error: profileError } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('id', currentUser.id)
                .maybeSingle();

            if (profileError) {
                console.error('Error loading profile:', profileError);
                // If profile doesn't exist, create a basic one
                if (profileError.code === 'PGRST116') {
                    // No rows returned - profile doesn't exist
                    console.log('Profile does not exist, creating one...');
                    const { data: newProfile, error: createError } = await supabase
                        .from('user_profiles')
                        .insert({
                            id: currentUser.id,
                            email: currentUser.email,
                            role: 'regular',
                            full_name: currentUser.user_metadata?.full_name || null,
                        })
                        .select()
                        .single();
                    
                    if (createError) {
                        console.error('Error creating profile:', createError);
                    } else {
                        setProfile(newProfile);
                    }
                }
            } else if (profileData) {
                setProfile(profileData);
            } else {
                // Profile is null, create one
                console.log('Profile is null, creating one...');
                const { data: newProfile, error: createError } = await supabase
                    .from('user_profiles')
                    .insert({
                        id: currentUser.id,
                        email: currentUser.email,
                        role: 'regular',
                        full_name: currentUser.user_metadata?.full_name || null,
                    })
                    .select()
                    .single();
                
                if (createError) {
                    console.error('Error creating profile:', createError);
                } else {
                    setProfile(newProfile);
                }
            }
        } catch (error) {
            console.error('Error loading profile data:', error);
            // Don't show alert, just log the error
        }
    };

    const handleLogout = () => {
        // Show confirmation dialog
        setLogoutAlert({
            visible: true,
            type: 'warning',
            title: 'Confirm Logout',
            message: 'Are you sure you want to logout?',
            showCancel: true,
            confirmText: 'Logout',
            cancelText: 'Cancel',
            onConfirm: performLogout,
            onCancel: () => setLogoutAlert({ ...logoutAlert, visible: false })
        });
    };

    const performLogout = async () => {
        try {
            setLogoutAlert({ ...logoutAlert, visible: false });
            const { error } = await supabase.auth.signOut();
            if (error) {
                throw error;
            }
            // Navigate to root which will show welcome screen
            router.replace('/');
        } catch (error) {
            console.error('Logout error:', error);
            setLogoutAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to logout. Please try again.',
                onConfirm: () => setLogoutAlert({ ...logoutAlert, visible: false })
            });
        }
    };

    const dynamicStyles = getStyles(colors, isDark);

    if (loading) {
        return (
            <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
                <View style={dynamicStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
            <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
                <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Profile</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={dynamicStyles.scrollView}>
                <View style={dynamicStyles.content}>
                    {/* Profile Header */}
                    <View style={[dynamicStyles.profileHeader, { borderBottomColor: colors.border }]}>
                        <View style={[dynamicStyles.avatarContainer, { backgroundColor: colors.primary }]}>
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={dynamicStyles.avatarImage} />
                            ) : (
                                <Text style={dynamicStyles.avatarText}>
                                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                            )}
                        </View>
                        <Text style={[dynamicStyles.userName, { color: colors.text }]}>
                            {profile?.full_name || user?.email || 'User'}
                        </Text>
                        <Text style={[dynamicStyles.userEmail, { color: colors.textSecondary }]}>{user?.email || ''}</Text>
                    </View>

                    {/* User Info Section */}
                    <View style={dynamicStyles.section}>
                        <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Account Information</Text>
                        
                        <View style={[dynamicStyles.infoRow, { borderBottomColor: colors.border }]}>
                            <Text style={[dynamicStyles.infoLabel, { color: colors.textSecondary }]}>Full Name</Text>
                            <Text style={[dynamicStyles.infoValue, { color: colors.text }]}>
                                {profile?.full_name || 'Not set'}
                            </Text>
                        </View>

                        <View style={[dynamicStyles.infoRow, { borderBottomColor: colors.border }]}>
                            <Text style={[dynamicStyles.infoLabel, { color: colors.textSecondary }]}>Email</Text>
                            <Text style={[dynamicStyles.infoValue, { color: colors.text }]}>
                                {user?.email || 'Not available'}
                            </Text>
                        </View>

                        <View style={[dynamicStyles.infoRow, { borderBottomColor: colors.border }]}>
                            <Text style={[dynamicStyles.infoLabel, { color: colors.textSecondary }]}>Phone</Text>
                            <Text style={[dynamicStyles.infoValue, { color: colors.text }]}>
                                {profile?.phone || 'Not set'}
                            </Text>
                        </View>

                        <View style={[dynamicStyles.infoRow, { borderBottomColor: colors.border }]}>
                            <Text style={[dynamicStyles.infoLabel, { color: colors.textSecondary }]}>Role</Text>
                            <Text style={[dynamicStyles.infoValue, { color: colors.text }]}>
                                {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Regular'}
                            </Text>
                        </View>
                    </View>

                    {/* Menu Options */}
                    <View style={dynamicStyles.section}>
                        <TouchableOpacity 
                            style={[dynamicStyles.menuItem, { borderBottomColor: colors.border }]}
                            onPress={() => router.push('/edit-profile')}
                        >
                            <Text style={dynamicStyles.menuIcon}>✏️</Text>
                            <Text style={[dynamicStyles.menuText, { color: colors.text }]}>Edit Profile</Text>
                            <Text style={[dynamicStyles.menuArrow, { color: colors.textSecondary }]}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[dynamicStyles.menuItem, { borderBottomColor: colors.border }]}
                            onPress={() => router.push('/my-orders')}
                        >
                            <Text style={dynamicStyles.menuIcon}>📦</Text>
                            <Text style={[dynamicStyles.menuText, { color: colors.text }]}>My Orders</Text>
                            <Text style={[dynamicStyles.menuArrow, { color: colors.textSecondary }]}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[dynamicStyles.menuItem, { borderBottomColor: colors.border }]}
                            onPress={() => router.push('/addresses')}
                        >
                            <Text style={dynamicStyles.menuIcon}>📍</Text>
                            <Text style={[dynamicStyles.menuText, { color: colors.text }]}>Addresses</Text>
                            <Text style={[dynamicStyles.menuArrow, { color: colors.textSecondary }]}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[dynamicStyles.menuItem, { borderBottomColor: colors.border }]}
                            onPress={() => router.push('/settings')}
                        >
                            <Text style={dynamicStyles.menuIcon}>⚙️</Text>
                            <Text style={[dynamicStyles.menuText, { color: colors.text }]}>Settings</Text>
                            <Text style={[dynamicStyles.menuArrow, { color: colors.textSecondary }]}>›</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity style={[dynamicStyles.logoutButton, { backgroundColor: colors.error }]} onPress={handleLogout}>
                        <Text style={dynamicStyles.logoutButtonText}>Logout</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <SweetAlert
                visible={logoutAlert.visible}
                type={logoutAlert.type}
                title={logoutAlert.title}
                message={logoutAlert.message}
                confirmText={logoutAlert.confirmText || 'OK'}
                cancelText={logoutAlert.cancelText}
                showCancel={logoutAlert.showCancel || false}
                onConfirm={() => {
                    if (logoutAlert.onConfirm) {
                        logoutAlert.onConfirm();
                    } else {
                        setLogoutAlert({ ...logoutAlert, visible: false });
                    }
                }}
                onCancel={() => {
                    if (logoutAlert.onCancel) {
                        logoutAlert.onCancel();
                    } else {
                        setLogoutAlert({ ...logoutAlert, visible: false });
                    }
                }}
            />
        </SafeAreaView>
    );
};

const getStyles = (colors, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.header,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
        paddingBottom: 24,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    avatarText: {
        fontSize: 40,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    userName: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    infoLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
        textAlign: 'right',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    menuIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    menuArrow: {
        fontSize: 24,
        color: colors.textSecondary,
    },
    logoutButton: {
        backgroundColor: colors.error,
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    logoutButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default UserProfileScreen;

