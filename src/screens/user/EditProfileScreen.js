import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../config/supabase';
import SweetAlert from '../../components/SweetAlert';

const EditProfileScreen = () => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [localImage, setLocalImage] = useState(null);
    const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setEmail(user.email || '');
                
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('full_name, phone, avatar_url')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setFullName(profile.full_name || '');
                    setPhone(profile.phone || '');
                    setAvatarUrl(profile.avatar_url);
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        try {
            // Request permission
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                setAlert({ visible: true, type: 'error', title: 'Permission Denied', message: 'We need camera roll permissions to upload photos!' });
                return;
            }

            // Launch image picker
            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ['images'],
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets[0]) {
                setLocalImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            setAlert({ visible: true, type: 'error', title: 'Error', message: 'Failed to pick image' });
        }
    };

    const uploadImage = async (imageUri, userId) => {
        try {
            setUploading(true);
            
            console.log('Starting image upload for user:', userId);
            console.log('Image URI:', imageUri);
            
            // Get file extension from URI
            const fileExt = imageUri.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `${userId}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            console.log('Reading file from URI:', imageUri);
            
            // For React Native, read file as base64 and convert to ArrayBuffer
            // This is more reliable than fetch for local files
            const base64 = await FileSystem.readAsStringAsync(imageUri, {
                encoding: FileSystem.EncodingType.Base64,
            });
            
            // Convert base64 to ArrayBuffer (Uint8Array)
            const byteCharacters = atob(base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            
            console.log('File read, size:', byteArray.length, 'bytes');
            console.log('Uploading to path:', filePath);

            // Upload to Supabase storage using ArrayBuffer/Uint8Array
            // Supabase accepts ArrayBuffer, Uint8Array, or Blob
            const { data, error: uploadError } = await supabase.storage
                .from('user_images')
                .upload(filePath, byteArray, {
                    contentType: `image/${fileExt}`,
                    upsert: true,
                    cacheControl: '3600',
                });

            if (uploadError) {
                // Log as warning, not error, since we handle it gracefully
                console.warn('Upload error details:', {
                    message: uploadError.message,
                    statusCode: uploadError.statusCode,
                    error: uploadError.error,
                    name: uploadError.name,
                });
                
                // Provide more helpful error messages based on actual error
                const errorMsg = uploadError.message || '';
                if (errorMsg.includes('Bucket not found') || errorMsg.includes('does not exist') || errorMsg.includes('not found')) {
                    throw new Error('Storage bucket "user_images" does not exist. Please create it in Supabase Dashboard.');
                } else if (errorMsg.includes('row-level security') || errorMsg.includes('RLS') || errorMsg.includes('permission')) {
                    throw new Error('Permission denied. Please run the storage policies SQL script in Supabase Dashboard.');
                } else if (uploadError.statusCode === 400 || uploadError.statusCode === 404) {
                    throw new Error('Storage bucket or path error. Please check bucket configuration.');
                } else {
                    throw new Error(`Upload failed: ${errorMsg || 'Unknown error'}. Please check storage policies.`);
                }
            }

            console.log('Upload successful, data:', data);

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('user_images')
                .getPublicUrl(filePath);

            console.log('Public URL:', urlData.publicUrl);
            return urlData.publicUrl;
        } catch (error) {
            // Log as warning since we handle it gracefully in the calling function
            console.warn('Image upload failed (handled gracefully):', error?.message || error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!fullName.trim()) {
            setAlert({ visible: true, type: 'error', title: 'Error', message: 'Full name is required' });
            return;
        }

        setSaving(true);
        try {
            // Ensure we have a session
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();
            
            if (sessionError || !session) {
                throw new Error('No active session. Please login again.');
            }

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                throw new Error('User not found');
            }

            let imageUrl = avatarUrl;

            // Upload image if a new one was selected
            if (localImage) {
                try {
                    imageUrl = await uploadImage(localImage, user.id);
                    console.log('Image uploaded successfully:', imageUrl);
                } catch (uploadError) {
                    // Handle upload error gracefully - don't log as error since we handle it
                    const errorMessage = uploadError?.message || 'Unknown error';
                    
                    // Show warning but allow profile to save
                    if (errorMessage.includes('bucket') || errorMessage.includes('Bucket') || errorMessage.includes('does not exist')) {
                        // Don't show alert here, will show after profile save
                        console.log('Image upload skipped - bucket not set up');
                    } else {
                        console.log('Image upload failed:', errorMessage);
                    }
                    // Continue with save using existing avatar_url (don't update image)
                    imageUrl = avatarUrl;
                }
            }

            console.log('Updating profile for user:', user.id);
            console.log('Update data:', { 
                full_name: fullName.trim(), 
                phone: phone.trim() || null,
                avatar_url: imageUrl 
            });

            // Update with select to verify the update worked
            const { data: updatedData, error } = await supabase
                .from('user_profiles')
                .update({
                    full_name: fullName.trim(),
                    phone: phone.trim() || null,
                    avatar_url: imageUrl,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', user.id)
                .select();

            if (error) {
                console.error('Update error:', error);
                throw error;
            }

            console.log('Profile updated successfully:', updatedData);

            if (!updatedData || updatedData.length === 0) {
                // Profile might not exist, try to create it
                console.log('Profile not found, creating new profile...');
                const { data: newProfile, error: insertError } = await supabase
                    .from('user_profiles')
                    .insert({
                        id: user.id,
                        email: user.email,
                        full_name: fullName.trim(),
                        phone: phone.trim() || null,
                        role: 'regular',
                    })
                    .select()
                    .single();

                if (insertError) {
                    console.error('Insert error:', insertError);
                    throw insertError;
                }
                console.log('Profile created successfully:', newProfile);
            }

            // Show success message, and warning if image upload was skipped
            if (localImage && imageUrl === avatarUrl) {
                // Image upload was attempted but failed
                setAlert({
                    visible: true,
                    type: 'warning',
                    title: 'Profile Saved',
                    message: 'Profile updated successfully! However, image upload was skipped because the storage bucket is not set up. Please create "user_images" bucket in Supabase Dashboard to enable image uploads.',
                    onConfirm: () => router.back()
                });
            } else {
                setAlert({
                    visible: true,
                    type: 'success',
                    title: 'Success',
                    message: 'Profile updated successfully!',
                    onConfirm: () => router.back()
                });
            }
        } catch (error) {
            console.error('Save error:', error);
            setAlert({ 
                visible: true, 
                type: 'error', 
                title: 'Error', 
                message: error.message || 'Failed to update profile. Please try again.' 
            });
        } finally {
            setSaving(false);
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
                <TouchableOpacity onPress={() => router.back()} style={dynamicStyles.backButton}>
                    <Text style={[dynamicStyles.backButtonText, { color: colors.primary }]}>← Back</Text>
                </TouchableOpacity>
                <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Edit Profile</Text>
                <View style={dynamicStyles.placeholder} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={dynamicStyles.scrollView}>
                <View style={dynamicStyles.content}>
                    {/* Profile Photo Section */}
                    <View style={dynamicStyles.formGroup}>
                        <Text style={[dynamicStyles.label, { color: colors.text }]}>Profile Photo</Text>
                        <View style={dynamicStyles.avatarSection}>
                            <View style={[dynamicStyles.avatarContainer, { backgroundColor: colors.primary }]}>
                                {localImage ? (
                                    <Image source={{ uri: localImage }} style={dynamicStyles.avatarImage} />
                                ) : avatarUrl ? (
                                    <Image source={{ uri: avatarUrl }} style={dynamicStyles.avatarImage} />
                                ) : (
                                    <Text style={dynamicStyles.avatarPlaceholder}>
                                        {fullName ? fullName.charAt(0).toUpperCase() : 'U'}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity 
                                style={[dynamicStyles.uploadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                onPress={pickImage}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <ActivityIndicator color={colors.primary} size="small" />
                                ) : (
                                    <Text style={[dynamicStyles.uploadButtonText, { color: colors.primary }]}>Upload Photo</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>

                    <View style={dynamicStyles.formGroup}>
                        <Text style={[dynamicStyles.label, { color: colors.text }]}>Full Name</Text>
                        <TextInput
                            style={[dynamicStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            value={fullName}
                            onChangeText={setFullName}
                            placeholder="Enter your full name"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    <View style={dynamicStyles.formGroup}>
                        <Text style={[dynamicStyles.label, { color: colors.text }]}>Email</Text>
                        <TextInput
                            style={[dynamicStyles.input, dynamicStyles.inputDisabled, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.textSecondary }]}
                            value={email}
                            editable={false}
                            placeholderTextColor={colors.textSecondary}
                        />
                        <Text style={[dynamicStyles.helperText, { color: colors.textSecondary }]}>Email cannot be changed</Text>
                    </View>

                    <View style={dynamicStyles.formGroup}>
                        <Text style={[dynamicStyles.label, { color: colors.text }]}>Phone</Text>
                        <TextInput
                            style={[dynamicStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                            value={phone}
                            onChangeText={setPhone}
                            placeholder="Enter your phone number"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <TouchableOpacity
                        style={[dynamicStyles.saveButton, { backgroundColor: colors.primary }, saving && dynamicStyles.saveButtonDisabled]}
                        onPress={handleSave}
                        disabled={saving}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FFFFFF" />
                        ) : (
                            <Text style={dynamicStyles.saveButtonText}>Save Changes</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </ScrollView>
            <SweetAlert
                visible={alert.visible}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onConfirm={() => {
                    setAlert({ ...alert, visible: false });
                    if (alert.onConfirm) alert.onConfirm();
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.header,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    placeholder: {
        width: 60,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: colors.text,
        backgroundColor: colors.background,
    },
    inputDisabled: {
        backgroundColor: colors.surface,
        color: colors.textSecondary,
    },
    helperText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4,
    },
    saveButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 8,
    },
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        fontSize: 48,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    uploadButton: {
        backgroundColor: colors.surface,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    uploadButtonText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '600',
    },
});

export default EditProfileScreen;

