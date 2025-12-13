import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { supabase } from '../config/supabase';
import SweetAlert from '../components/SweetAlert';

const { width, height } = Dimensions.get('window');

const FarmerInterestScreen = () => {
    const router = useRouter();
    const [selectedInterests, setSelectedInterests] = useState([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });

    const interests = [
        { id: 'Firming', label: 'Firming', icon: '🎃', emoji: '🎃' },
        { id: 'Indoor Plant', label: 'Indoor Plant', icon: '🪴', emoji: '🪴' },
        { id: 'Agriculture News', label: 'Agriculture News', icon: '🌱', emoji: '🌱' },
        { id: 'Tips', label: 'Tips', icon: '🤲', emoji: '🤲' },
        { id: 'Outdoor Plant', label: 'Outdoor Plant', icon: '🌳', emoji: '🌳' },
    ];

    const toggleInterest = (interestId) => {
        setSelectedInterests(prev => 
            prev.includes(interestId)
                ? prev.filter(id => id !== interestId)
                : [...prev, interestId]
        );
    };

    const selectAll = () => {
        if (selectedInterests.length === interests.length) {
            setSelectedInterests([]);
        } else {
            setSelectedInterests(interests.map(i => i.id));
        }
    };

    // Load existing interests on mount
    useEffect(() => {
        loadUserInterests();
    }, []);

    const loadUserInterests = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Get existing interests from user_profiles interests JSON column
            const { data: profileData, error } = await supabase
                .from('user_profiles')
                .select('interests')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error loading interests:', error);
                return;
            }

            if (profileData && profileData.interests && Array.isArray(profileData.interests)) {
                setSelectedInterests(profileData.interests);
            }
        } catch (error) {
            console.error('Error loading interests:', error);
        }
    };

    const handleSave = async () => {
        if (selectedInterests.length === 0) {
            setAlert({
                visible: true,
                type: 'warning',
                title: 'No Selection',
                message: 'Please select at least one interest to continue.'
            });
            return;
        }

        setSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Update user_profiles interests JSON column with selected interests
            const { error: updateError } = await supabase
                .from('user_profiles')
                .update({ interests: selectedInterests })
                .eq('id', user.id);

            if (updateError) {
                throw updateError;
            }

            setAlert({
                visible: true,
                type: 'success',
                title: 'Success',
                message: 'Your interests have been saved successfully!',
                onConfirm: () => {
                    router.replace('/');
                }
            });
        } catch (error) {
            setAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to save interests. Please try again.'
            });
        } finally {
            setSaving(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.backIcon}>←</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.selectAllButton}
                        onPress={selectAll}
                    >
                        <Text style={styles.selectAllText}>
                            {selectedInterests.length === interests.length ? 'Deselect All' : 'Select All'}
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Title */}
                <Text style={styles.title}>Set your interest</Text>

                {/* Interest Selection Area */}
                <View style={styles.interestsContainer}>
                    {/* Decorative dots */}
                    <View style={styles.decorativeDots}>
                        <View style={[styles.dot, styles.dot1]} />
                        <View style={[styles.dot, styles.dot2]} />
                        <View style={[styles.dot, styles.dot3]} />
                        <View style={[styles.dot, styles.dot4]} />
                        <View style={[styles.dot, styles.dot5]} />
                        <View style={[styles.dot, styles.dot6]} />
                    </View>

                    {/* Interest Buttons */}
                    <View style={styles.interestsGrid}>
                        {interests.map((interest, index) => {
                            const isSelected = selectedInterests.includes(interest.id);
                            return (
                                <TouchableOpacity
                                    key={interest.id}
                                    style={[
                                        styles.interestButton,
                                        isSelected && styles.interestButtonSelected,
                                        index === 0 && styles.interestButton1,
                                        index === 1 && styles.interestButton2,
                                        index === 2 && styles.interestButton3,
                                        index === 3 && styles.interestButton4,
                                        index === 4 && styles.interestButton5,
                                    ]}
                                    onPress={() => toggleInterest(interest.id)}
                                >
                                    <Text style={styles.interestIcon}>{interest.emoji}</Text>
                                    <Text 
                                        style={[
                                            styles.interestLabel,
                                            isSelected && styles.interestLabelSelected
                                        ]}
                                        numberOfLines={2}
                                        ellipsizeMode="tail"
                                    >
                                        {interest.label}
                                    </Text>
                                    {isSelected && (
                                        <View style={styles.checkmark}>
                                            <Text style={styles.checkmarkText}>✓</Text>
                                        </View>
                                    )}
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
                <TouchableOpacity
                    style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                >
                    {saving ? (
                        <ActivityIndicator color="#FFFFFF" />
                    ) : (
                        <Text style={styles.saveButtonText}>Save & Continue</Text>
                    )}
                </TouchableOpacity>
            </View>
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
        backgroundColor: '#F0FFF4',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 100,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: '#1F1F1F',
    },
    selectAllButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
    },
    selectAllText: {
        fontSize: 16,
        color: '#228B22',
        fontWeight: '600',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1F1F1F',
        paddingHorizontal: 24,
        marginBottom: 40,
    },
    interestsContainer: {
        flex: 1,
        paddingHorizontal: 24,
        position: 'relative',
        minHeight: height * 0.6,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        marginTop: 20,
        paddingTop: 40,
    },
    decorativeDots: {
        position: 'absolute',
        width: '100%',
        height: '100%',
    },
    dot: {
        position: 'absolute',
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    dot1: {
        top: '10%',
        left: '15%',
        backgroundColor: '#90EE90',
    },
    dot2: {
        top: '25%',
        right: '20%',
        backgroundColor: '#FFA500',
    },
    dot3: {
        top: '45%',
        left: '10%',
        backgroundColor: '#228B22',
    },
    dot4: {
        top: '60%',
        right: '15%',
        backgroundColor: '#90EE90',
    },
    dot5: {
        top: '75%',
        left: '20%',
        backgroundColor: '#FFA500',
    },
    dot6: {
        top: '35%',
        right: '10%',
        backgroundColor: '#228B22',
    },
    interestsGrid: {
        position: 'relative',
        width: '100%',
        minHeight: 550,
        paddingVertical: 20,
    },
    interestButton: {
        position: 'absolute',
        width: 130,
        height: 130,
        borderRadius: 65,
        backgroundColor: '#FFFFFF',
        borderWidth: 2,
        borderColor: '#E0E0E0',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 8,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    interestButtonSelected: {
        borderColor: '#228B22',
        backgroundColor: '#F0FFF4',
    },
    interestButton1: {
        top: 20,
        left: '50%',
        transform: [{ translateX: -65 }],
    },
    interestButton2: {
        top: 160,
        left: 10,
    },
    interestButton3: {
        top: 160,
        right: 10,
    },
    interestButton4: {
        top: 300,
        left: 30,
    },
    interestButton5: {
        top: 300,
        right: 30,
    },
    interestIcon: {
        fontSize: 36,
        marginBottom: 6,
    },
    interestLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#666666',
        textAlign: 'center',
        paddingHorizontal: 4,
    },
    interestLabelSelected: {
        color: '#228B22',
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#228B22',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmarkText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
    footer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
        paddingTop: 20,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    saveButton: {
        backgroundColor: '#0A5C5A',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default FarmerInterestScreen;

