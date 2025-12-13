import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SweetAlert from '../../components/SweetAlert';

const { width } = Dimensions.get('window');

const UserCartScreen = () => {
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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Cart</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                <View style={styles.content}>
                    {cartItems.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>🛒</Text>
                            <Text style={styles.emptyText}>Your cart is empty</Text>
                            <Text style={styles.emptySubtext}>Start shopping to add items</Text>
                        </View>
                    ) : (
                        <>
                            {cartItems.map((item) => (
                                <View key={item.id} style={styles.cartItem}>
                                    <View style={styles.itemImageContainer}>
                                        <Text style={styles.itemEmoji}>{item.image}</Text>
                                    </View>
                                    <View style={styles.itemDetails}>
                                        <Text style={styles.itemName}>{item.name}</Text>
                                        <Text style={styles.itemStore}>{item.store}</Text>
                                        <Text style={styles.itemPrice}>{item.priceDisplay}</Text>
                                        <View style={styles.quantityContainer}>
                                            <TouchableOpacity 
                                                style={styles.quantityButton}
                                                onPress={() => decreaseQuantity(item.id)}
                                            >
                                                <Text style={styles.quantityButtonText}>-</Text>
                                            </TouchableOpacity>
                                            <Text style={styles.quantityText}>{item.quantity}</Text>
                                            <TouchableOpacity 
                                                style={styles.quantityButton}
                                                onPress={() => increaseQuantity(item.id)}
                                            >
                                                <Text style={styles.quantityButtonText}>+</Text>
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                    <TouchableOpacity 
                                        style={styles.deleteButton}
                                        onPress={() => deleteItem(item.id)}
                                    >
                                        <Text style={styles.deleteIcon}>🗑️</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                            <View style={styles.totalContainer}>
                                <Text style={styles.totalLabel}>Total:</Text>
                                <Text style={styles.totalAmount}>{formatPrice(total)}</Text>
                            </View>
                        </>
                    )}
                </View>
            </ScrollView>
            {cartItems.length > 0 && (
                <View style={styles.checkoutContainer}>
                    <TouchableOpacity 
                        style={styles.checkoutButton}
                        onPress={handleCheckout}
                    >
                        <Text style={styles.checkoutButtonText}>Checkout</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#1F1F1F',
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
    cartItem: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    itemImageContainer: {
        width: 80,
        height: 80,
        backgroundColor: '#E0E0E0',
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
        color: '#1F1F1F',
        marginBottom: 4,
    },
    itemStore: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 4,
    },
    itemPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#228B22',
        marginBottom: 8,
    },
    quantityContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 32,
        height: 32,
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    quantityButtonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#228B22',
    },
    quantityText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F1F1F',
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
        borderTopColor: '#E0E0E0',
        marginTop: 8,
    },
    totalLabel: {
        fontSize: 20,
        fontWeight: '600',
        color: '#1F1F1F',
    },
    totalAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: '#228B22',
    },
    checkoutContainer: {
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        backgroundColor: '#FFFFFF',
    },
    checkoutButton: {
        backgroundColor: '#228B22',
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

