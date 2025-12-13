import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const UserHomeScreen = () => {
    const { colors, isDark } = useTheme();
    const dynamicStyles = getStyles(colors, isDark);

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={dynamicStyles.content}>
                    <Text style={[dynamicStyles.title, { color: colors.text }]}>Welcome Back!</Text>
                    <Text style={[dynamicStyles.subtitle, { color: colors.textSecondary }]}>Discover fresh produce from local farmers</Text>
                    
                    {/* Quick Stats */}
                    <View style={dynamicStyles.statsContainer}>
                        <View style={[dynamicStyles.statCard, { backgroundColor: isDark ? colors.surface : '#F0FFF4' }]}>
                            <Text style={[dynamicStyles.statNumber, { color: colors.primary }]}>50+</Text>
                            <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>Products</Text>
                        </View>
                        <View style={[dynamicStyles.statCard, { backgroundColor: isDark ? colors.surface : '#F0FFF4' }]}>
                            <Text style={[dynamicStyles.statNumber, { color: colors.primary }]}>20+</Text>
                            <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>Farmers</Text>
                        </View>
                        <View style={[dynamicStyles.statCard, { backgroundColor: isDark ? colors.surface : '#F0FFF4' }]}>
                            <Text style={[dynamicStyles.statNumber, { color: colors.primary }]}>100+</Text>
                            <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>Orders</Text>
                        </View>
                    </View>

                    {/* Featured Section */}
                    <View style={dynamicStyles.section}>
                        <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Featured Products</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.horizontalScroll}>
                            {[1, 2, 3].map((item) => (
                                <View key={item} style={[dynamicStyles.productCard, { backgroundColor: colors.surface }]}>
                                    <View style={[dynamicStyles.productImagePlaceholder, { backgroundColor: colors.border }]}>
                                        <Text style={dynamicStyles.placeholderText}>🌾</Text>
                                    </View>
                                    <Text style={[dynamicStyles.productName, { color: colors.text }]}>Fresh Rice</Text>
                                    <Text style={[dynamicStyles.productPrice, { color: colors.primary }]}>Rp 1,300,000</Text>
                                </View>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const getStyles = (colors, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textSecondary,
        marginBottom: 24,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
    },
    horizontalScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    productCard: {
        width: 150,
        marginRight: 16,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
    },
    productImagePlaceholder: {
        width: '100%',
        height: 120,
        backgroundColor: colors.border,
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
        color: colors.text,
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
    },
});

export default UserHomeScreen;

