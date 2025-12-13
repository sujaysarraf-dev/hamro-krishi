import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const MyOrdersScreen = () => {
    const router = useRouter();
    
    // Dummy orders data
    const orders = [
        {
            id: 1,
            orderNumber: 'ORD-001',
            date: '2024-01-15',
            status: 'Delivered',
            total: 'Rp 1,360,000',
            items: ['Padi', 'Cabai']
        },
        {
            id: 2,
            orderNumber: 'ORD-002',
            date: '2024-01-10',
            status: 'Processing',
            total: 'Rp 850,000',
            items: ['Bawang', 'Tomat']
        },
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'Delivered':
                return '#228B22';
            case 'Processing':
                return '#FFA500';
            case 'Cancelled':
                return '#FF4444';
            default:
                return '#666666';
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>My Orders</Text>
                <View style={styles.placeholder} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                <View style={styles.content}>
                    {orders.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📦</Text>
                            <Text style={styles.emptyText}>No orders yet</Text>
                            <Text style={styles.emptySubtext}>Your orders will appear here</Text>
                        </View>
                    ) : (
                        orders.map((order) => (
                            <View key={order.id} style={styles.orderCard}>
                                <View style={styles.orderHeader}>
                                    <View>
                                        <Text style={styles.orderNumber}>{order.orderNumber}</Text>
                                        <Text style={styles.orderDate}>{order.date}</Text>
                                    </View>
                                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                                        <Text style={[styles.statusText, { color: getStatusColor(order.status) }]}>
                                            {order.status}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.orderItems}>
                                    <Text style={styles.itemsLabel}>Items:</Text>
                                    <Text style={styles.itemsText}>{order.items.join(', ')}</Text>
                                </View>
                                <View style={styles.orderFooter}>
                                    <Text style={styles.totalLabel}>Total:</Text>
                                    <Text style={styles.totalAmount}>{order.total}</Text>
                                </View>
                            </View>
                        ))
                    )}
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#228B22',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F1F1F',
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
        color: '#1F1F1F',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666666',
    },
    orderCard: {
        backgroundColor: '#F5F5F5',
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
    orderNumber: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F1F1F',
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 12,
        color: '#666666',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    orderItems: {
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    itemsLabel: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 4,
    },
    itemsText: {
        fontSize: 14,
        color: '#1F1F1F',
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    totalLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1F1F1F',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: '#228B22',
    },
});

export default MyOrdersScreen;

