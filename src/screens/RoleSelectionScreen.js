
import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

// Removed Ionicons import if not used or install it if needed.
// To use Ionicons with Expo, we usually: import Ionicons from '@expo/vector-icons/Ionicons';
// But user said "random images", so I'll stick to images.

const { width } = Dimensions.get('window');

const RoleSelectionScreen = () => {
    const router = useRouter();
    const [selectedRole, setSelectedRole] = useState('Farmer');

    return (
        <SafeAreaView style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Text style={styles.skipText}>Skip</Text>
                </TouchableOpacity>
            </View>

            <View style={styles.content}>
                <Text style={styles.title}>
                    <Text style={styles.highlight}>Choose</Text> you who{'\n'}want to be
                </Text>

                <View style={styles.cardsContainer}>
                    {/* Farmer Card */}
                    <TouchableOpacity
                        style={[styles.card, selectedRole === 'Farmer' && styles.selectedCard]}
                        onPress={() => setSelectedRole('Farmer')}
                    >
                        <Text style={[styles.cardTitle, selectedRole === 'Farmer' && styles.selectedCardTitle]}>Farmer</Text>
                        <Image
                            source={{ uri: 'https://picsum.photos/150/150?random=2' }}
                            style={styles.cardImage}
                        />
                    </TouchableOpacity>

                    {/* Regular Card */}
                    <TouchableOpacity
                        style={[styles.card, selectedRole === 'Regular' && styles.selectedCard]}
                        onPress={() => setSelectedRole('Regular')}
                    >
                        <Text style={[styles.cardTitle, selectedRole === 'Regular' && styles.selectedCardTitle]}>Regular</Text>
                        <Image
                            source={{ uri: 'https://picsum.photos/150/150?random=3' }}
                            style={styles.cardImage}
                        />
                    </TouchableOpacity>
                </View>

                <Text style={styles.description}>
                    Choose the <Text style={styles.highlight}>character</Text> if you want to be farmer or regular user
                </Text>

                <TouchableOpacity
                    style={styles.continueButton}
                    onPress={() => console.log('Continue clicked')}
                >
                    <Text style={styles.continueButtonText}>Continue</Text>
                </TouchableOpacity>

                {/* Pagination Indicator */}
                <View style={styles.paginationContainer}>
                    <View style={[styles.paginationDot, styles.activeDot]} />
                    <View style={styles.paginationDot} />
                    <View style={styles.paginationDot} />
                    <View style={styles.paginationDot} />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
    },
    header: {
        height: 50,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    skipText: {
        fontSize: 16,
        color: '#228B22',
        fontWeight: '600',
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F1F1F',
        textAlign: 'center',
        marginBottom: 40,
        lineHeight: 36,
    },
    highlight: {
        color: '#228B22',
    },
    cardsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        width: '100%',
        marginBottom: 40,
    },
    card: {
        width: '47%',
        backgroundColor: '#F5F5F5',
        borderRadius: 20,
        padding: 20,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    selectedCard: {
        borderColor: '#228B22',
        backgroundColor: '#F0FFF4', // Slight tint
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#333333', // Default black/grey
        marginBottom: 15,
    },
    selectedCardTitle: {
        color: '#228B22',
    },
    cardImage: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E0E0E0',
    },
    description: {
        textAlign: 'center',
        fontSize: 16,
        color: '#333333',
        paddingHorizontal: 10,
        lineHeight: 24,
        marginBottom: 40,
    },
    continueButton: {
        backgroundColor: '#228B22',
        width: '100%',
        paddingVertical: 18,
        borderRadius: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 40,
    },
    continueButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    paginationContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        width: '100%',
    },
    paginationDot: {
        height: 4,
        width: 40,
        backgroundColor: '#E0E0E0',
        marginHorizontal: 4,
        borderRadius: 2,
    },
    activeDot: {
        backgroundColor: '#228B22',
    },
});

export default RoleSelectionScreen;
