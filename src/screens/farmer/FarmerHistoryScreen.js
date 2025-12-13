import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../config/supabase';
import { useFocusEffect } from 'expo-router';
import SweetAlert from '../../components/SweetAlert';

const FarmerHistoryScreen = () => {
    const { colors, isDark } = useTheme();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });
    const [processingOrder, setProcessingOrder] = useState(null);

    useFocusEffect(
        React.useCallback(() => {
            loadOrders();
        }, [])
    );

    const loadOrders = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                setLoading(false);
                return;
            }

            // Optimized: Get only product IDs (minimal data)
            const { data: productsData } = await supabase
                .from('products')
                .select('id')
                .eq('farmer_id', user.id)
                .limit(1000); // Add limit for safety

            if (!productsData || productsData.length === 0) {
                setOrders([]);
                setLoading(false);
                return;
            }

            const productIds = productsData.map(p => p.id);

            // Optimized query - select only needed fields
            const { data, error } = await supabase
                .from('order_items')
                .select(`
                    id,
                    order_id,
                    product_id,
                    quantity,
                    unit_price,
                    total_price,
                    created_at,
                    orders (
                        id,
                        user_id,
                        total_amount,
                        status,
                        payment_status,
                        created_at,
                        user_profiles:user_id (
                            full_name,
                            phone
                        )
                    ),
                    products (
                        name,
                        image_url,
                        stock_unit
                    )
                `)
                .in('product_id', productIds)
                .order('created_at', { ascending: false })
                .limit(100); // Add pagination limit

            if (error) {
                console.error('Error loading orders:', error);
                throw error;
            }

            // Group order items by order_id
            const ordersMap = new Map();
            data.forEach(item => {
                if (!ordersMap.has(item.orders.id)) {
                    ordersMap.set(item.orders.id, {
                        ...item.orders,
                        items: []
                    });
                }
                ordersMap.get(item.orders.id).items.push(item);
            });

            setOrders(Array.from(ordersMap.values()));
        } catch (error) {
            console.error('Error loading orders:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-NP', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered':
                return '#10B981';
            case 'shipped':
                return '#3B82F6';
            case 'processing':
                return '#F59E0B';
            case 'confirmed':
                return '#8B5CF6';
            case 'cancelled':
                return '#EF4444';
            case 'pending':
                return '#F59E0B';
            default:
                return colors.textSecondary;
        }
    };

    const handleAcceptOrder = async (order) => {
        try {
            setProcessingOrder(order.id);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Check if order contains products from this farmer
            const { data: orderItems } = await supabase
                .from('order_items')
                .select('product_id, products!inner(farmer_id)')
                .eq('order_id', order.id);

            const hasFarmerProducts = orderItems?.some(item => item.products?.farmer_id === user.id);

            if (!hasFarmerProducts) {
                throw new Error('You do not have permission to update this order');
            }

            const { data, error } = await supabase
                .from('orders')
                .update({ status: 'confirmed' })
                .eq('id', order.id)
                .select();

            if (error) {
                console.error('Accept order error:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('Failed to update order');
            }

            setAlert({
                visible: true,
                type: 'success',
                title: 'Order Accepted',
                message: 'Order has been accepted successfully!',
                onConfirm: () => {
                    setAlert({ ...alert, visible: false });
                    loadOrders();
                }
            });
        } catch (error) {
            console.error('Error accepting order:', error);
            setAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to accept order. Please try again.'
            });
        } finally {
            setProcessingOrder(null);
        }
    };

    const handleRejectOrder = async (order) => {
        try {
            setProcessingOrder(order.id);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Check if order contains products from this farmer
            const { data: orderItems } = await supabase
                .from('order_items')
                .select('product_id, products!inner(farmer_id)')
                .eq('order_id', order.id);

            const hasFarmerProducts = orderItems?.some(item => item.products?.farmer_id === user.id);

            if (!hasFarmerProducts) {
                throw new Error('You do not have permission to update this order');
            }

            const { data, error } = await supabase
                .from('orders')
                .update({ status: 'cancelled' })
                .eq('id', order.id)
                .select();

            if (error) {
                console.error('Reject order error:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('Failed to update order');
            }

            setAlert({
                visible: true,
                type: 'success',
                title: 'Order Rejected',
                message: 'Order has been rejected successfully!',
                onConfirm: () => {
                    setAlert({ ...alert, visible: false });
                    loadOrders();
                }
            });
        } catch (error) {
            console.error('Error rejecting order:', error);
            setAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to reject order. Please try again.'
            });
        } finally {
            setProcessingOrder(null);
        }
    };

    const dynamicStyles = getStyles(colors, isDark);

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
            <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
                <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Order History</Text>
            </View>
            {loading ? (
                <View style={dynamicStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : orders.length === 0 ? (
                <View style={dynamicStyles.emptyContainer}>
                    <Text style={dynamicStyles.emptyIcon}>📦</Text>
                    <Text style={[dynamicStyles.emptyText, { color: colors.text }]}>No orders yet</Text>
                    <Text style={[dynamicStyles.emptySubtext, { color: colors.textSecondary }]}>Orders for your products will appear here</Text>
                </View>
            ) : (
                <ScrollView showsVerticalScrollIndicator={false} style={dynamicStyles.scrollView}>
                    <View style={dynamicStyles.content}>
                        {orders.map((order) => (
                            <View key={order.id} style={[dynamicStyles.orderCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                <View style={dynamicStyles.orderHeader}>
                                    <View>
                                        <Text style={[dynamicStyles.orderId, { color: colors.text }]}>
                                            Order #{order.id.slice(0, 8)}
                                        </Text>
                                        <Text style={[dynamicStyles.orderDate, { color: colors.textSecondary }]}>
                                            {formatDate(order.created_at)}
                                        </Text>
                                        {order.user_profiles && (
                                            <Text style={[dynamicStyles.customerName, { color: colors.textSecondary }]}>
                                                Customer: {order.user_profiles.full_name || 'N/A'}
                                            </Text>
                                        )}
                                    </View>
                                    <View style={[dynamicStyles.statusBadge, { backgroundColor: getStatusColor(order.status) + '20' }]}>
                                        <Text style={[dynamicStyles.statusText, { color: getStatusColor(order.status) }]}>
                                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                                        </Text>
                                    </View>
                                </View>
                                
                                {order.items && order.items.length > 0 && (
                                    <View style={dynamicStyles.itemsContainer}>
                                        {order.items.map((item) => (
                                            <View key={item.id} style={dynamicStyles.orderItem}>
                                                <Text style={[dynamicStyles.itemName, { color: colors.text }]}>
                                                    {item.products?.name || 'Product'}
                                                </Text>
                                                <Text style={[dynamicStyles.itemDetails, { color: colors.textSecondary }]}>
                                                    {item.quantity} x NPR {formatPrice(item.unit_price)} / {item.products?.stock_unit || 'kg'}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                )}

                                <View style={[dynamicStyles.orderFooter, { borderTopColor: colors.border }]}>
                                    <Text style={[dynamicStyles.totalLabel, { color: colors.text }]}>Total:</Text>
                                    <Text style={[dynamicStyles.totalAmount, { color: colors.primary }]}>
                                        NPR {formatPrice(order.total_amount)}
                                    </Text>
                                </View>

                                {/* Accept/Reject Buttons for Pending Orders */}
                                {order.status === 'pending' && (
                                    <View style={dynamicStyles.actionButtonsContainer}>
                                        <TouchableOpacity
                                            style={[dynamicStyles.rejectButton, { backgroundColor: '#EF4444' }, processingOrder === order.id && dynamicStyles.buttonDisabled]}
                                            onPress={() => handleRejectOrder(order)}
                                            disabled={processingOrder === order.id}
                                        >
                                            {processingOrder === order.id ? (
                                                <ActivityIndicator color="#FFFFFF" size="small" />
                                            ) : (
                                                <Text style={dynamicStyles.actionButtonText}>Reject</Text>
                                            )}
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[dynamicStyles.acceptButton, { backgroundColor: '#10B981' }, processingOrder === order.id && dynamicStyles.buttonDisabled]}
                                            onPress={() => handleAcceptOrder(order)}
                                            disabled={processingOrder === order.id}
                                        >
                                            {processingOrder === order.id ? (
                                                <ActivityIndicator color="#FFFFFF" size="small" />
                                            ) : (
                                                <Text style={dynamicStyles.actionButtonText}>Accept</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                )}
                            </View>
                        ))}
                    </View>
                </ScrollView>
            )}

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
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
        color: colors.text,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    orderCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
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
        color: colors.text,
        marginBottom: 4,
    },
    orderDate: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    customerName: {
        fontSize: 12,
        color: colors.textSecondary,
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
    itemsContainer: {
        marginBottom: 12,
    },
    orderItem: {
        marginBottom: 8,
    },
    itemName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    itemDetails: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    orderFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.primary,
    },
    actionButtonsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 16,
        gap: 12,
    },
    acceptButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#10B981',
    },
    rejectButton: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#EF4444',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    actionButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FarmerHistoryScreen;

