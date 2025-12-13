import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useCart } from '../../context/CartContext';
import { supabase } from '../../config/supabase';
import { useRouter } from 'expo-router';
import SweetAlert from '../../components/SweetAlert';

const { width } = Dimensions.get('window');

const UserCartScreen = () => {
    const { colors, isDark } = useTheme();
    const router = useRouter();
    const { cartItems, updateQuantity, removeFromCart, clearCart, getCartTotal } = useCart();
    const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });
    const [processing, setProcessing] = useState(false);

    const dynamicStyles = getStyles(colors, isDark);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-NP', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const handleCheckout = async () => {
        if (cartItems.length === 0) {
            setAlert({
                visible: true,
                type: 'warning',
                title: 'Empty Cart',
                message: 'Your cart is empty. Add some items to checkout.'
            });
            return;
        }

        setProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/regular-login');
                return;
            }

            // Calculate total
            const totalAmount = getCartTotal();

            // Create order
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .insert({
                    user_id: user.id,
                    total_amount: totalAmount,
                    status: 'pending',
                    payment_status: 'pending'
                })
                .select()
                .single();

            if (orderError) {
                throw orderError;
            }

            // Create order items
            const orderItemsData = cartItems.map(item => ({
                order_id: order.id,
                product_id: item.product_id,
                quantity: item.quantity,
                unit_price: item.price,
                total_price: item.price * item.quantity
            }));

            const { error: itemsError } = await supabase
                .from('order_items')
                .insert(orderItemsData);

            if (itemsError) {
                throw itemsError;
            }

            // Clear cart
            clearCart();

            setAlert({
                visible: true,
                type: 'success',
                title: 'Order Placed!',
                message: `Your order of ${cartItems.length} item(s) totaling NPR ${formatPrice(totalAmount)} has been placed successfully!`,
                onConfirm: () => {
                    setAlert({ ...alert, visible: false });
                    router.push('/user-dashboard');
                }
            });
        } catch (error) {
            console.error('Checkout error:', error);
            setAlert({
                visible: true,
                type: 'error',
                title: 'Checkout Failed',
                message: 'Failed to place order. Please try again.'
            });
        } finally {
            setProcessing(false);
        }
    };

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
            <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
                <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Cart</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={dynamicStyles.scrollView}>
                <View style={dynamicStyles.content}>
                    {cartItems.length === 0 ? (
                        <View style={dynamicStyles.emptyContainer}>
                            <Text style={dynamicStyles.emptyIcon}>🛒</Text>
                            <Text style={[dynamicStyles.emptyText, { color: colors.text }]}>Your cart is empty</Text>
                            <Text style={[dynamicStyles.emptySubtext, { color: colors.textSecondary }]}>Start shopping to add items</Text>
                        </View>
                    ) : (
                        <>
                            {cartItems.map((item) => (
                                <View key={item.product_id} style={[dynamicStyles.cartItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <View style={[dynamicStyles.itemImageContainer, { backgroundColor: colors.border }]}>
                                        {item.image_url ? (
                                            <Image 
                                                source={{ uri: item.image_url }} 
                                                style={dynamicStyles.itemImage}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Text style={dynamicStyles.itemEmoji}>🌾</Text>
                                        )}
                                    </View>
                                    <View style={dynamicStyles.itemDetails}>
                                        <Text style={[dynamicStyles.itemName, { color: colors.text }]}>{item.name}</Text>
                                        <Text style={[dynamicStyles.itemStore, { color: colors.textSecondary }]}>{item.farmer_name}</Text>
                                        <Text style={[dynamicStyles.itemPrice, { color: colors.primary }]}>
                                            NPR {formatPrice(item.price)} / {item.stock_unit}
                                        </Text>
                                        <View style={dynamicStyles.quantityContainer}>
                                            <TouchableOpacity 
                                                style={[dynamicStyles.quantityButton, { backgroundColor: colors.border }]}
                                                onPress={() => updateQuantity(item.product_id, item.quantity - 1)}
                                            >
                                                <Text style={[dynamicStyles.quantityButtonText, { color: colors.text }]}>-</Text>
                                            </TouchableOpacity>
                                            <Text style={[dynamicStyles.quantityText, { color: colors.text }]}>{item.quantity}</Text>
                                            <TouchableOpacity 
                                                style={[dynamicStyles.quantityButton, { backgroundColor: colors.border }]}
                                                onPress={() => updateQuantity(item.product_id, item.quantity + 1)}
                                            >
                                                <Text style={[dynamicStyles.quantityButtonText, { color: colors.text }]}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <TouchableOpacity 
                                        style={dynamicStyles.deleteButton}
                                        onPress={() => removeFromCart(item.product_id)}
                                    >
                                        <Text style={dynamicStyles.deleteIcon}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <View style={[dynamicStyles.totalContainer, { borderTopColor: colors.border }]}>
                                <Text style={[dynamicStyles.totalLabel, { color: colors.text }]}>Total:</Text>
                                <Text style={[dynamicStyles.totalAmount, { color: colors.primary }]}>NPR {formatPrice(getCartTotal())}</Text>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
            {cartItems.length > 0 && (
                <View style={[dynamicStyles.checkoutContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity 
                        style={[dynamicStyles.checkoutButton, { backgroundColor: colors.primary }, processing && dynamicStyles.checkoutButtonDisabled]}
                        onPress={handleCheckout}
                        disabled={processing}
                    >
                        {processing ? (
                            <Text style={dynamicStyles.checkoutButtonText}>Processing...</Text>
                        ) : (
                            <Text style={dynamicStyles.checkoutButtonText}>Checkout</Text>
                        )}
                    </TouchableOpacity>
                </View>
            )}
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
        backgroundColor: colors.header,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
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
        color: colors.text,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    cartItem: {
        flexDirection: 'row',
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    itemImageContainer: {
        width: 80,
        height: 80,
        backgroundColor: colors.border,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    itemImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    itemEmoji: {
        fontSize: 40,
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    itemStore: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: 8,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 32,
        height: 32,
        backgroundColor: colors.border,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
    },
    quantityButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginHorizontal: 16,
        minWidth: 30,
        textAlign: 'center',
    },
    deleteButton: {
        padding: 8,
    },
    deleteIcon: {
        fontSize: 20,
    },
    totalContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.primary,
    },
    checkoutContainer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.card,
    },
    checkoutButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkoutButtonDisabled: {
        opacity: 0.6,
    },
    checkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default UserCartScreen;
