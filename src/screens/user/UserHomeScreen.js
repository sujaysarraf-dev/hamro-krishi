import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const UserHomeScreen = () => {
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    <Text style={styles.title}>Welcome Back!</Text>
                    <Text style={styles.subtitle}>Discover fresh produce from local farmers</Text>
                    
                    {/* Quick Stats */}
                    <View style={styles.statsContainer}>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>50+</Text>
                            <Text style={styles.statLabel}>Products</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>20+</Text>
                            <Text style={styles.statLabel}>Farmers</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statNumber}>100+</Text>
                            <Text style={styles.statLabel}>Orders</Text>
                        </View>
                    </View>

                    {/* Featured Section */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Featured Products</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {[1, 2, 3].map((item) => (
                                <View key={item} style={styles.productCard}>
                                    <View style={styles.productImagePlaceholder}>
                                        <Text style={styles.placeholderText}>🌾</Text>
                                    </View>
                                    <Text style={styles.productName}>Fresh Rice</Text>
                                    <Text style={styles.productPrice}>Rp 1,300,000</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F1F1F',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 24,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#F0FFF4',
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: '#228B22',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: '#666666',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F1F1F',
        marginBottom: 16,
    },
    horizontalScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    productCard: {
        width: 150,
        marginRight: 16,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 12,
    },
    productImagePlaceholder: {
        width: '100%',
        height: 120,
        backgroundColor: '#E0E0E0',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    placeholderText: {
        fontSize: 40,
    },
    productName: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F1F1F',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#228B22',
    },
});

export default UserHomeScreen;

