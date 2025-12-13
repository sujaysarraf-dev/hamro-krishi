import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const FarmerOrdersScreen = () => {
    const { colors, isDark } = useTheme();
    const dynamicStyles = getStyles(colors, isDark);
    const [activeFilter, setActiveFilter] = useState('all');

    // Dummy orders data
    const orders = [
        { id: 1, orderId: '#1234', customer: 'John Doe', items: 'Rice - 50kg', total: 'Rp 1,300,000', status: 'Pending', date: '2 hours ago' },
        { id: 2, orderId: '#1233', customer: 'Jane Smith', items: 'Wheat - 30kg', total: 'Rp 800,000', status: 'Processing', date: '5 hours ago' },
        { id: 3, orderId: '#1232', customer: 'Bob Johnson', items: 'Corn - 25kg', total: 'Rp 600,000', status: 'Completed', date: '1 day ago' },
        { id: 4, orderId: '#1231', customer: 'Alice Brown', items: 'Tomato - 10kg', total: 'Rp 150,000', status: 'Pending', date: '2 days ago' },
    ];

    const filters = ['all', 'pending', 'processing', 'completed'];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Pending':
                return colors.primary;
            case 'Processing':
                return '#FFA500';
            case 'Completed':
                return '#4CAF50';
            default:
                return colors.textSecondary;
        }
    };

    const filteredOrders = activeFilter === 'all' 
        ? orders 
        : orders.filter(order => order.status.toLowerCase() === activeFilter);

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
            <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
                <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Orders</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={dynamicStyles.scrollView}>
                <View style={dynamicStyles.content}>
                    {/* Filter Tabs */}
                    <ScrollView 
                        horizontal 
                        showsHorizontalScrollIndicator={false} 
                        style={dynamicStyles.filterContainer}
                        contentContainerStyle={dynamicStyles.filterContent}
                    >
                        {filters.map((filter) => (
                            <TouchableOpacity
                                key={filter}
                                style={[
                                    dynamicStyles.filterTab,
                                    { 
                                        backgroundColor: activeFilter === filter ? colors.primary : colors.surface,
                                        borderColor: colors.border,
                                    }
                                ]}
                                onPress={() => setActiveFilter(filter)}
                            >
                                <Text style={[
                                    dynamicStyles.filterText,
                                    { 
                                        color: activeFilter === filter ? '#FFFFFF' : colors.text,
                                        fontWeight: activeFilter === filter ? '600' : '500',
                                    }
                                ]}>
                                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </ScrollView>

                    {/* Orders List */}
                    <View style={dynamicStyles.ordersList}>
                        {filteredOrders.map((order) => (
                            <View key={order.id} style={[dynamicStyles.orderCard, { backgroundColor: colors.card }]}>
                                <View style={dynamicStyles.orderHeader}>
                                    <View>
                                        <Text style={[dynamicStyles.orderId, { color: colors.text }]}>{order.orderId}</Text>
                                        <Text style={[dynamicStyles.orderCustomer, { color: colors.textSecondary }]}>{order.customer}</Text>
                                    </View>
                                    <View style={[
                                        dynamicStyles.statusBadge,
                                        { backgroundColor: getStatusColor(order.status) + '20' }
                                    ]}>
                                        <Text style={[
                                            dynamicStyles.statusText,
                                            { color: getStatusColor(order.status) }
                                        ]}>
                                            {order.status}
                                        </Text>
                                    </View>
                                </View>
                                <View style={[dynamicStyles.orderDivider, { backgroundColor: colors.border }]} />
                                <Text style={[dynamicStyles.orderItems, { color: colors.text }]}>{order.items}</Text>
                                <View style={dynamicStyles.orderFooter}>
                                    <Text style={[dynamicStyles.orderTotal, { color: colors.primary }]}>{order.total}</Text>
                                    <Text style={[dynamicStyles.orderDate, { color: colors.textSecondary }]}>{order.date}</Text>
                                </View>
                                <View style={dynamicStyles.orderActions}>
                                    <TouchableOpacity style={[dynamicStyles.actionButton, { borderColor: colors.border }]}>
                                        <Text style={[dynamicStyles.actionButtonText, { color: colors.text }]}>View Details</Text>
                                    </TouchableOpacity>
                                    {order.status === 'Pending' && (
                                        <TouchableOpacity style={[dynamicStyles.actionButton, dynamicStyles.acceptButton, { backgroundColor: colors.primary }]}>
                                            <Text style={dynamicStyles.acceptButtonText}>Accept</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Empty State */}
                    {filteredOrders.length === 0 && (
                        <View style={dynamicStyles.emptyContainer}>
                            <Text style={dynamicStyles.emptyIcon}>📦</Text>
                            <Text style={[dynamicStyles.emptyText, { color: colors.text }]}>No orders found</Text>
                            <Text style={[dynamicStyles.emptySubtext, { color: colors.textSecondary }]}>
                                {activeFilter === 'all' ? 'You have no orders yet' : `No ${activeFilter} orders`}
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const getStyles = (colors, isDark) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    filterContainer: {
        marginBottom: 20,
    },
    filterContent: {
        paddingRight: 20,
    },
    filterTab: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    filterText: {
        fontSize: 14,
    },
    ordersList: {
        marginTop: 8,
    },
    orderCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    orderId: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    orderCustomer: {
        fontSize: 14,
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    orderDivider: {
        height: 1,
        marginVertical: 12,
    },
    orderItems: {
        fontSize: 14,
        marginBottom: 12,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    orderTotal: {
        fontSize: 18,
        fontWeight: '700',
    },
    orderDate: {
        fontSize: 12,
    },
    orderActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 8,
        borderWidth: 1,
        alignItems: 'center',
    },
    acceptButton: {
        borderWidth: 0,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    acceptButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyIcon: {
        fontSize: 80,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
    },
});

export default FarmerOrdersScreen;

