import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const FarmerHomeScreen = () => {
    const { colors, isDark } = useTheme();
    const dynamicStyles = getStyles(colors, isDark);

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={dynamicStyles.content}>
                    <Text style={[dynamicStyles.title, { color: colors.text }]}>Welcome Back, Farmer! 👨‍🌾</Text>
                    <Text style={[dynamicStyles.subtitle, { color: colors.textSecondary }]}>Manage your farm and products</Text>
                    
                    {/* Quick Stats */}
                    <View style={dynamicStyles.statsContainer}>
                        <View style={[dynamicStyles.statCard, { backgroundColor: isDark ? colors.surface : '#F0FFF4' }]}>
                            <Text style={[dynamicStyles.statNumber, { color: colors.primary }]}>12</Text>
                            <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>Products</Text>
                        </View>
                        <View style={[dynamicStyles.statCard, { backgroundColor: isDark ? colors.surface : '#F0FFF4' }]}>
                            <Text style={[dynamicStyles.statNumber, { color: colors.primary }]}>8</Text>
                            <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>Orders</Text>
                        </View>
                        <View style={[dynamicStyles.statCard, { backgroundColor: isDark ? colors.surface : '#F0FFF4' }]}>
                            <Text style={[dynamicStyles.statNumber, { color: colors.primary }]}>Rp 2.5M</Text>
                            <Text style={[dynamicStyles.statLabel, { color: colors.textSecondary }]}>Revenue</Text>
                        </View>
                    </View>

                    {/* Quick Actions */}
                    <View style={dynamicStyles.section}>
                        <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
                        <View style={dynamicStyles.actionsGrid}>
                            <TouchableOpacity style={[dynamicStyles.actionCard, { backgroundColor: colors.card }]}>
                                <Text style={dynamicStyles.actionIcon}>➕</Text>
                                <Text style={[dynamicStyles.actionLabel, { color: colors.text }]}>Add Product</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[dynamicStyles.actionCard, { backgroundColor: colors.card }]}>
                                <Text style={dynamicStyles.actionIcon}>📊</Text>
                                <Text style={[dynamicStyles.actionLabel, { color: colors.text }]}>View Analytics</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[dynamicStyles.actionCard, { backgroundColor: colors.card }]}>
                                <Text style={dynamicStyles.actionIcon}>📝</Text>
                                <Text style={[dynamicStyles.actionLabel, { color: colors.text }]}>Update Inventory</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={[dynamicStyles.actionCard, { backgroundColor: colors.card }]}>
                                <Text style={dynamicStyles.actionIcon}>🔔</Text>
                                <Text style={[dynamicStyles.actionLabel, { color: colors.text }]}>Notifications</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Recent Orders */}
                    <View style={dynamicStyles.section}>
                        <View style={dynamicStyles.sectionHeader}>
                            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Recent Orders</Text>
                            <TouchableOpacity>
                                <Text style={[dynamicStyles.moreLink, { color: colors.primary }]}>View All</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={[dynamicStyles.orderCard, { backgroundColor: colors.card }]}>
                            <View style={dynamicStyles.orderHeader}>
                                <Text style={[dynamicStyles.orderId, { color: colors.text }]}>Order #1234</Text>
                                <Text style={[dynamicStyles.orderStatus, { color: colors.primary }]}>Pending</Text>
                            </View>
                            <Text style={[dynamicStyles.orderItem, { color: colors.textSecondary }]}>Rice - 50kg</Text>
                            <Text style={[dynamicStyles.orderDate, { color: colors.textSecondary }]}>2 hours ago</Text>
                        </View>
                        <View style={[dynamicStyles.orderCard, { backgroundColor: colors.card }]}>
                            <View style={dynamicStyles.orderHeader}>
                                <Text style={[dynamicStyles.orderId, { color: colors.text }]}>Order #1233</Text>
                                <Text style={[dynamicStyles.orderStatus, { color: '#FFA500' }]}>Processing</Text>
                            </View>
                            <Text style={[dynamicStyles.orderItem, { color: colors.textSecondary }]}>Wheat - 30kg</Text>
                            <Text style={[dynamicStyles.orderDate, { color: colors.textSecondary }]}>5 hours ago</Text>
                        </View>
                    </View>

                    {/* Top Products */}
                    <View style={dynamicStyles.section}>
                        <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Top Products</Text>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.horizontalScroll}>
                            {[
                                { name: 'Rice', price: 'Rp 1,300,000', stock: '50kg', icon: '🌾' },
                                { name: 'Wheat', price: 'Rp 800,000', stock: '30kg', icon: '🌾' },
                                { name: 'Corn', price: 'Rp 600,000', stock: '25kg', icon: '🌽' },
                            ].map((product, index) => (
                                <View key={index} style={[dynamicStyles.productCard, { backgroundColor: colors.card }]}>
                                    <View style={[dynamicStyles.productImagePlaceholder, { backgroundColor: colors.surface }]}>
                                        <Text style={dynamicStyles.placeholderText}>{product.icon}</Text>
                                    </View>
                                    <Text style={[dynamicStyles.productName, { color: colors.text }]}>{product.name}</Text>
                                    <Text style={[dynamicStyles.productPrice, { color: colors.primary }]}>{product.price}</Text>
                                    <Text style={[dynamicStyles.productStock, { color: colors.textSecondary }]}>Stock: {product.stock}</Text>
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
    },
    content: {
        padding: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        marginBottom: 24,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
    },
    statCard: {
        flex: 1,
        borderRadius: 12,
        padding: 16,
        marginHorizontal: 4,
        alignItems: 'center',
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    moreLink: {
        fontSize: 14,
        fontWeight: '600',
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    actionCard: {
        width: (width - 60) / 2,
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        marginBottom: 12,
    },
    actionIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    actionLabel: {
        fontSize: 14,
        fontWeight: '600',
        textAlign: 'center',
    },
    orderCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '700',
    },
    orderStatus: {
        fontSize: 14,
        fontWeight: '600',
    },
    orderItem: {
        fontSize: 14,
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 12,
    },
    horizontalScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    productCard: {
        width: 150,
        marginRight: 16,
        borderRadius: 12,
        padding: 12,
    },
    productImagePlaceholder: {
        width: '100%',
        height: 120,
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
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    productStock: {
        fontSize: 12,
    },
});

export default FarmerHomeScreen;

