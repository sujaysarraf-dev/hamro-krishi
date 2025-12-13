import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import SweetAlert from '../../components/SweetAlert';

const { width } = Dimensions.get('window');

const UserCartScreen = () => {
    const { colors, isDark } = useTheme();
    const [cartItems, setCartItems] = useState([
        {
            id: 1,
            name: 'Padi',
            store: 'Toko Abadi Sentosa',
            price: 1300000,
            priceDisplay: 'Rp 1,300,000',
            quantity: 1,
            image: '🌾'
        },
        {
            id: 2,
            name: 'Cabai',
            store: 'Toko Kelontong',
            price: 30000,
            priceDisplay: 'Rp 30.000/kg',
            quantity: 2,
            image: '🌶️'
        },
    ]);

    const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });

    // Calculate total
    const total = useMemo(() => {
        return cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }, [cartItems]);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const increaseQuantity = (itemId) => {
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        );
    };

    const decreaseQuantity = (itemId) => {
        setCartItems(prevItems =>
            prevItems.map(item =>
                item.id === itemId && item.quantity > 1
                    ? { ...item, quantity: item.quantity - 1 }
                    : item
            )
        );
    };

    const deleteItem = (itemId) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== itemId));
    };

    const handleCheckout = () => {
        if (cartItems.length === 0) {
            setAlert({
                visible: true,
                type: 'warning',
                title: 'Empty Cart',
                message: 'Your cart is empty. Add some items to checkout.'
            });
            return;
        }

        setAlert({
            visible: true,
            type: 'success',
            title: 'Order Placed!',
            message: `Your order of ${cartItems.length} item(s) totaling ${formatPrice(total)} has been placed successfully!`,
            onConfirm: () => {
                // Clear cart after successful checkout
                setCartItems([]);
            }
        });
    };

    const dynamicStyles = getStyles(colors, isDark);

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
                                <View key={item.id} style={[dynamicStyles.cartItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <View style={[dynamicStyles.itemImageContainer, { backgroundColor: colors.border }]}>
                                        <Text style={dynamicStyles.itemEmoji}>{item.image}</Text>
                                    </View>
                                    <View style={dynamicStyles.itemDetails}>
                                        <Text style={[dynamicStyles.itemName, { color: colors.text }]}>{item.name}</Text>
                                        <Text style={[dynamicStyles.itemStore, { color: colors.textSecondary }]}>{item.store}</Text>
                                        <Text style={[dynamicStyles.itemPrice, { color: colors.primary }]}>{item.priceDisplay}</Text>
                                        <View style={dynamicStyles.quantityContainer}>
                                            <TouchableOpacity 
                                                style={[dynamicStyles.quantityButton, { backgroundColor: colors.border }]}
                                                onPress={() => decreaseQuantity(item.id)}
                                            >
                                                <Text style={[dynamicStyles.quantityButtonText, { color: colors.text }]}>-</Text>
                                            </TouchableOpacity>
                                            <Text style={[dynamicStyles.quantityText, { color: colors.text }]}>{item.quantity}</Text>
                                            <TouchableOpacity 
                                                style={[dynamicStyles.quantityButton, { backgroundColor: colors.border }]}
                                                onPress={() => increaseQuantity(item.id)}
                                            >
                                                <Text style={[dynamicStyles.quantityButtonText, { color: colors.text }]}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <TouchableOpacity 
                                        style={dynamicStyles.deleteButton}
                                        onPress={() => deleteItem(item.id)}
                                    >
                                        <Text style={dynamicStyles.deleteIcon}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <View style={[dynamicStyles.totalContainer, { borderTopColor: colors.border }]}>
                                <Text style={[dynamicStyles.totalLabel, { color: colors.text }]}>Total:</Text>
                                <Text style={[dynamicStyles.totalAmount, { color: colors.primary }]}>{formatPrice(total)}</Text>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
            {cartItems.length > 0 && (
                <View style={[dynamicStyles.checkoutContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                    <TouchableOpacity 
                        style={[dynamicStyles.checkoutButton, { backgroundColor: colors.primary }]}
                        onPress={handleCheckout}
                    >
                        <Text style={dynamicStyles.checkoutButtonText}>Checkout</Text>
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
    checkoutButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default UserCartScreen;

