
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../config/supabase';
import SweetAlert from '../components/SweetAlert';

const FarmerLoginScreen = () => {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });

    // Helper function to check if input is email or phone
    const isEmail = (input) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input);
    };

    const handleLogin = async () => {
        if (!email.trim() || !password.trim()) {
            setAlert({ visible: true, type: 'error', title: 'Error', message: 'Please fill in all fields' });
            return;
        }

        setLoading(true);
        try {
            let loginResponse;

            if (isEmail(email)) {
                // Login with email
                loginResponse = await supabase.auth.signInWithPassword({
                    email: email.trim(),
                    password: password,
                });
            } else {
                // For phone number, we'll use email field but you might need to adjust based on your Supabase setup
                // Alternatively, you can use phone authentication if configured
                setLoading(false);
                setAlert({ visible: true, type: 'warning', title: 'Error', message: 'Please use email for login. Phone authentication coming soon.' });
                return;
            }

            if (loginResponse.error) {
                throw loginResponse.error;
            }

            // Get user data
            const { data: { user } } = loginResponse;

            if (user) {
                // Update or insert user profile with role
                const { error: profileError } = await supabase
                    .from('user_profiles')
                    .upsert({
                        id: user.id,
                        email: user.email,
                        role: 'farmer',
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'id'
                    });

                if (profileError) {
                    console.error('Error saving profile:', profileError);
                }

                setAlert({
                    visible: true,
                    type: 'success',
                    title: 'Success',
                    message: 'Login successful!',
                    onConfirm: () => {
                        // Navigate to interest selection screen
                        router.replace('/farmer-interests');
                    }
                });
            }
        } catch (error) {
            setAlert({ visible: true, type: 'error', title: 'Login Failed', message: error.message || 'An error occurred during login' });
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
                                Welcome <Text style={styles.highlight}>Farmer</Text>
                            </Text>
                            <Text style={styles.subtitle}>
                                Sign in to access your farming dashboard
                            </Text>
                        </View>

                        {/* Login Form */}
                        <View style={styles.formContainer}>
                            {/* Email/Phone Input */}
                            <View style={styles.inputContainer}>
                                <Text style={styles.label}>Email or Phone</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Enter your email or phone"
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

                            {/* Forgot Password */}
                            <TouchableOpacity style={styles.forgotPasswordContainer}>
                                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                            </TouchableOpacity>

                            {/* Login Button */}
                            <TouchableOpacity
                                style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={styles.loginButtonText}>Login</Text>
                                )}
                            </TouchableOpacity>

                            {/* Sign Up Link */}
                            <View style={styles.signUpContainer}>
                                <Text style={styles.signUpText}>Don't have an account? </Text>
                                <TouchableOpacity onPress={() => router.push('/farmer-signup')}>
                                    <Text style={styles.signUpLink}>Sign Up</Text>
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
    forgotPasswordContainer: {
        alignSelf: 'flex-end',
        marginBottom: 32,
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#228B22',
        fontWeight: '600',
    },
    loginButton: {
        backgroundColor: '#228B22',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    loginButtonDisabled: {
        opacity: 0.6,
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    signUpContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    signUpText: {
        fontSize: 16,
        color: '#666666',
    },
    signUpLink: {
        fontSize: 16,
        color: '#228B22',
        fontWeight: '600',
    },
});

export default FarmerLoginScreen;

