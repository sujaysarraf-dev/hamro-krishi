import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { supabase } from '../../config/supabase';
import SweetAlert from '../../components/SweetAlert';

const UserProfileScreen = () => {
    const router = useRouter();
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
            // First check if we have a session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError) {
                console.error('Session error:', sessionError);
            }

            if (!session) {
                // No session, redirect to login
                console.log('No session found, redirecting to login');
                router.replace('/regular-login');
                return;
            }

            // Get current user
            const { data: { user: currentUser }, error: userError } = await supabase.auth.getUser();
            
            if (userError) {
                console.error('Error getting user:', userError);
                throw userError;
            }

            if (!currentUser) {
                throw new Error('User not found');
            }

            setUser(currentUser);

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
            console.error('Error loading user data:', error);
            // Don't show alert, just log the error and show what we have
        } finally {
            setLoading(false);
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

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#228B22" />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Profile</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                <View style={styles.content}>
                    {/* Profile Header */}
                    <View style={styles.profileHeader}>
                        <View style={styles.avatarContainer}>
                            {profile?.avatar_url ? (
                                <Image source={{ uri: profile.avatar_url }} style={styles.avatarImage} />
                            ) : (
                                <Text style={styles.avatarText}>
                                    {profile?.full_name ? profile.full_name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || 'U'}
                                </Text>
                            )}
                        </View>
                        <Text style={styles.userName}>
                            {profile?.full_name || user?.email || 'User'}
                        </Text>
                        <Text style={styles.userEmail}>{user?.email || ''}</Text>
                    </View>

                    {/* User Info Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Account Information</Text>
                        
                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Full Name</Text>
                            <Text style={styles.infoValue}>
                                {profile?.full_name || 'Not set'}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>
                                {user?.email || 'Not available'}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Phone</Text>
                            <Text style={styles.infoValue}>
                                {profile?.phone || 'Not set'}
                            </Text>
                        </View>

                        <View style={styles.infoRow}>
                            <Text style={styles.infoLabel}>Role</Text>
                            <Text style={styles.infoValue}>
                                {profile?.role ? profile.role.charAt(0).toUpperCase() + profile.role.slice(1) : 'Regular'}
                            </Text>
                        </View>

                        {profile?.interests && (
                            (() => {
                                let interestsArray = [];
                                if (Array.isArray(profile.interests)) {
                                    interestsArray = profile.interests;
                                } else if (typeof profile.interests === 'string') {
                                    try {
                                        interestsArray = JSON.parse(profile.interests);
                                    } catch (e) {
                                        interestsArray = [];
                                    }
                                } else if (typeof profile.interests === 'object') {
                                    interestsArray = Object.values(profile.interests);
                                }
                                
                                return interestsArray.length > 0 ? (
                                    <View style={styles.infoRow}>
                                        <Text style={styles.infoLabel}>Interests</Text>
                                        <Text style={styles.infoValue}>
                                            {interestsArray.join(', ')}
                                        </Text>
                                    </View>
                                ) : null;
                            })()
                        )}
                    </View>

                    {/* Menu Options */}
                    <View style={styles.section}>
                        <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={() => router.push('/edit-profile')}
                        >
                            <Text style={styles.menuIcon}>✏️</Text>
                            <Text style={styles.menuText}>Edit Profile</Text>
                            <Text style={styles.menuArrow}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={() => router.push('/my-orders')}
                        >
                            <Text style={styles.menuIcon}>📦</Text>
                            <Text style={styles.menuText}>My Orders</Text>
                            <Text style={styles.menuArrow}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={() => router.push('/addresses')}
                        >
                            <Text style={styles.menuIcon}>📍</Text>
                            <Text style={styles.menuText}>Addresses</Text>
                            <Text style={styles.menuArrow}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={styles.menuItem}
                            onPress={() => router.push('/settings')}
                        >
                            <Text style={styles.menuIcon}>⚙️</Text>
                            <Text style={styles.menuText}>Settings</Text>
                            <Text style={styles.menuArrow}>›</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Logout Button */}
                    <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
                        <Text style={styles.logoutButtonText}>Logout</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
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
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F1F1F',
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
        borderBottomColor: '#F0F0F0',
    },
    avatarContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#228B22',
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
        color: '#1F1F1F',
        marginBottom: 4,
    },
    userEmail: {
        fontSize: 14,
        color: '#666666',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#1F1F1F',
        marginBottom: 16,
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    infoLabel: {
        fontSize: 14,
        color: '#666666',
        flex: 1,
    },
    infoValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F1F1F',
        flex: 1,
        textAlign: 'right',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#1F1F1F',
    },
    menuArrow: {
        fontSize: 24,
        color: '#666666',
    },
    logoutButton: {
        backgroundColor: '#FF4444',
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

