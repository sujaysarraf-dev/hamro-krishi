import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../config/supabase';
import SweetAlert from '../components/SweetAlert';

const FarmerSignupScreen = () => {
    const router = useRouter();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });

    const handleSignup = async () => {
        if (!fullName || !fullName.trim()) {
            setAlert({ visible: true, type: 'error', title: 'Error', message: 'Please enter your full name' });
            return;
        }

        if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
            setAlert({ visible: true, type: 'error', title: 'Error', message: 'Please fill in all fields' });
            return;
        }

        if (password !== confirmPassword) {
            setAlert({ visible: true, type: 'error', title: 'Error', message: 'Passwords do not match' });
            return;
        }

        if (password.length < 6) {
            setAlert({ visible: true, type: 'error', title: 'Error', message: 'Password must be at least 6 characters' });
            return;
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            setAlert({ visible: true, type: 'error', title: 'Error', message: 'Please enter a valid email address' });
            return;
        }

        setLoading(true);
        try {
            // Sign up with Supabase
            const { data, error } = await supabase.auth.signUp({
                email: email.trim(),
                password: password,
                options: {
                    data: {
                        full_name: fullName.trim(),
                        role: 'farmer'
                    },
                    emailRedirectTo: undefined, // Disable email confirmation redirect
                    captchaToken: undefined // Disable captcha if not needed
                }
            });

            if (error) {
                console.error('Signup error:', error);
                throw error;
            }

            if (!data || !data.user) {
                throw new Error('Failed to create user account. Please try again.');
            }

            // Wait a moment to ensure user is fully created and trigger has run
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Try to sign in the user (may fail if email confirmation is required)
            // But we'll continue anyway since the trigger should have created the profile
            let sessionEstablished = false;
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email: email.trim(),
                password: password,
            });

            if (signInError) {
                // If sign-in fails due to email confirmation, that's okay
                // The trigger function should have created the profile with SECURITY DEFINER
                console.log('Sign in skipped (email confirmation may be required):', signInError.message);
                // Check if we have a session from signup
                const { data: { session } } = await supabase.auth.getSession();
                if (session) {
                    sessionEstablished = true;
                }
            } else {
                sessionEstablished = true;
            }

            // Wait a bit more for session to be established if sign-in succeeded
            if (sessionEstablished) {
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            if (data.user) {
                // Try to update profile if we have a session, otherwise trigger should have handled it
                if (sessionEstablished) {
                    const updateData = {
                        email: email.trim(),
                        full_name: fullName.trim(),
                        role: 'farmer',
                        updated_at: new Date().toISOString(),
                    };

                    console.log('Updating profile with data:', updateData);

                    const { data: updateResult, error: profileError } = await supabase
                        .from('user_profiles')
                        .update(updateData)
                        .eq('id', data.user.id)
                        .select();

                    if (profileError) {
                        console.error('Error updating profile:', profileError);
                        // That's okay, trigger should have created it with metadata
                    } else {
                        console.log('Profile updated successfully:', updateResult);
                    }
                } else {
                    // If no session, the trigger function should have created the profile
                    // with the metadata from signup (full_name and role)
                    console.log('Profile should be created by trigger with metadata');
                }

                setAlert({
                    visible: true,
                    type: 'success',
                    title: 'Success',
                    message: 'Account created successfully!',
                    onConfirm: () => router.replace('/farmer-interests')
                });
            } else {
                throw new Error('User account was not created');
            }
        } catch (error) {
            setAlert({ visible: true, type: 'error', title: 'Signup Failed', message: error.message || 'An error occurred during signup' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    <View style={styles.content}>
                        {/* Back Button */}
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => router.back()}
                        >
                            <Text style={styles.backButtonText}>Back</Text>
                        </TouchableOpacity>

                        {/* Title Section */}
                        <View style={styles.titleSection}>
                            <Text style={styles.title}>
                                Create <Text style={styles.highlight}>Farmer</Text> Account
                            </Text>
                            <Text style={styles.subtitle}>
                                Join our farming community today
                            </Text>
                        </View>

                        {/* Signup Form */}
                        <View style={styles.formContainer}>
                            {/* Full Name Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Full Name</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your full name"
                                    placeholderTextColor="#999999"
                                    value={fullName}
                                    onChangeText={setFullName}
                                    autoCapitalize="words"
                                />
                            </View>

                            {/* Email Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email"
                                    placeholderTextColor="#999999"
                                    value={email}
                                    onChangeText={setEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                />
                            </View>

                            {/* Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Password</Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Enter your password"
                                        placeholderTextColor="#999999"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        onPress={() => setShowPassword(!showPassword)}
                                    >
                                        <Text style={styles.eyeButtonText}>
                                            {showPassword ? '👁️' : '👁️‍🗨️'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Confirm Password Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Confirm Password</Text>
                                <View style={styles.passwordContainer}>
                                    <TextInput
                                        style={styles.passwordInput}
                                        placeholder="Confirm your password"
                                        placeholderTextColor="#999999"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                    />
                                    <TouchableOpacity
                                        style={styles.eyeButton}
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        <Text style={styles.eyeButtonText}>
                                            {showConfirmPassword ? '👁️' : '👁️‍🗨️'}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Signup Button */}
                            <TouchableOpacity
                                style={[styles.signupButton, loading && styles.signupButtonDisabled]}
                                onPress={handleSignup}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.signupButtonText}>Sign Up</Text>
                                )}
                            </TouchableOpacity>

                            {/* Login Link */}
                            <View style={styles.loginContainer}>
                                <Text style={styles.loginText}>Already have an account? </Text>
                                <TouchableOpacity onPress={() => router.push('/farmer-login')}>
                                    <Text style={styles.loginLink}>Login</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
            <SweetAlert
                visible={alert.visible}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onConfirm={() => {
                    setAlert({ ...alert, visible: false });
                    if (alert.onConfirm) {
                        alert.onConfirm();
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
    keyboardView: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
    },
    content: {
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: 20,
    },
    backButton: {
        marginBottom: 30,
        alignSelf: 'flex-start',
    },
    backButtonText: {
        fontSize: 16,
        color: '#228B22',
        fontWeight: '600',
    },
    titleSection: {
        marginBottom: 40,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1F1F1F',
        marginBottom: 10,
        lineHeight: 44,
    },
    highlight: {
        color: '#228B22',
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        lineHeight: 24,
    },
    formContainer: {
        width: '100%',
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 8,
    },
    input: {
        width: '100%',
        height: 56,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1F1F1F',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    passwordContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    passwordInput: {
        flex: 1,
        height: 56,
        paddingHorizontal: 16,
        fontSize: 16,
        color: '#1F1F1F',
    },
    eyeButton: {
        paddingHorizontal: 16,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    eyeButtonText: {
        fontSize: 20,
    },
    signupButton: {
        backgroundColor: '#228B22',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 24,
    },
    signupButtonDisabled: {
        opacity: 0.6,
    },
    signupButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        fontSize: 16,
        color: '#666666',
    },
    loginLink: {
        fontSize: 16,
        color: '#228B22',
        fontWeight: '600',
    },
});

export default FarmerSignupScreen;

