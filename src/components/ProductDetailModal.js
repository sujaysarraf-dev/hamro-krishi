import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Image, ScrollView, ActivityIndicator } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { useCart } from '../context/CartContext';
import SweetAlert from './SweetAlert';

const ProductDetailModal = ({ visible, product, onClose }) => {
    const { colors, isDark } = useTheme();
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });

    if (!product) return null;

    const dynamicStyles = getStyles(colors, isDark);

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-NP', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const handleAddToCart = () => {
        addToCart(product, quantity);
        setAlert({
            visible: true,
            type: 'success',
            title: 'Added to Cart',
            message: `${quantity} x ${product.name} added to cart successfully!`,
            onConfirm: () => {
                setAlert({ ...alert, visible: false });
                onClose();
            }
        });
    };

    const increaseQuantity = () => {
        setQuantity(prev => prev + 1);
    };

    const decreaseQuantity = () => {
        if (quantity > 1) {
            setQuantity(prev => prev - 1);
        }
    };

    return (
        <>
            <Modal
                visible={visible}
                transparent={true}
                animationType="slide"
                onRequestClose={onClose}
            >
                <View style={dynamicStyles.modalOverlay}>
                    <View style={[dynamicStyles.modalContent, { backgroundColor: colors.background }]}>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Header */}
                            <View style={dynamicStyles.modalHeader}>
                                <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>Product Details</Text>
                                <TouchableOpacity onPress={onClose}>
                                    <Text style={[dynamicStyles.closeButton, { color: colors.text }]}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            {/* Product Image */}
                            <View style={[dynamicStyles.imageContainer, { backgroundColor: colors.border }]}>
                                {product.image_url ? (
                                    <Image 
                                        source={{ uri: product.image_url }} 
                                        style={dynamicStyles.productImage}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Text style={dynamicStyles.productEmoji}>🌾</Text>
                                )}
                            </View>

                            {/* Product Info */}
                            <View style={dynamicStyles.productInfo}>
                                <Text style={[dynamicStyles.productName, { color: colors.text }]}>{product.name}</Text>
                                <Text style={[dynamicStyles.productPrice, { color: colors.primary }]}>
                                    NPR {formatPrice(product.price)} / {product.stock_unit || 'kilograms'}
                                </Text>
                                {product.user_profiles?.full_name && (
                                    <Text style={[dynamicStyles.farmerName, { color: colors.textSecondary }]}>
                                        Farmer: {product.user_profiles.full_name}
                                    </Text>
                                )}
                                {product.description && (
                                    <Text style={[dynamicStyles.description, { color: colors.text }]}>
                                        {product.description}
                                    </Text>
                                )}
                                <Text style={[dynamicStyles.stockInfo, { color: colors.textSecondary }]}>
                                    Stock: {product.stock_quantity} {product.stock_unit || 'kilograms'}
                                </Text>
                            </View>

                            {/* Quantity Selector */}
                            <View style={dynamicStyles.quantitySection}>
                                <Text style={[dynamicStyles.quantityLabel, { color: colors.text }]}>Quantity:</Text>
                                <View style={dynamicStyles.quantityControls}>
                                    <TouchableOpacity 
                                        style={[dynamicStyles.quantityButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                        onPress={decreaseQuantity}
                                        disabled={quantity <= 1}
                                    >
                                        <Text style={[dynamicStyles.quantityButtonText, { color: colors.text }]}>-</Text>
                                    </TouchableOpacity>
                                    <Text style={[dynamicStyles.quantityValue, { color: colors.text }]}>{quantity}</Text>
                                    <TouchableOpacity 
                                        style={[dynamicStyles.quantityButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                        onPress={increaseQuantity}
                                    >
                                        <Text style={[dynamicStyles.quantityButtonText, { color: colors.text }]}>+</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>

                            {/* Total Price */}
                            <View style={[dynamicStyles.totalSection, { backgroundColor: colors.surface }]}>
                                <Text style={[dynamicStyles.totalLabel, { color: colors.text }]}>Total:</Text>
                                <Text style={[dynamicStyles.totalPrice, { color: colors.primary }]}>
                                    NPR {formatPrice(product.price * quantity)}
                                </Text>
                            </View>

                            {/* Add to Cart Button */}
                            <TouchableOpacity 
                                style={[dynamicStyles.addToCartButton, { backgroundColor: colors.primary }]}
                                onPress={handleAddToCart}
                            >
                                <Text style={dynamicStyles.addToCartText}>Add to Cart</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

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
        </>
    );
};

const getStyles = (colors, isDark) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        paddingBottom: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    closeButton: {
        fontSize: 24,
        fontWeight: '600',
        color: colors.text,
    },
    imageContainer: {
        width: '100%',
        height: 250,
        backgroundColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
    },
    productImage: {
        width: '100%',
        height: '100%',
    },
    productEmoji: {
        fontSize: 100,
    },
    productInfo: {
        padding: 20,
    },
    productName: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    productPrice: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: 8,
    },
    farmerName: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: colors.text,
        marginBottom: 12,
        lineHeight: 24,
    },
    stockInfo: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    quantitySection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderTopWidth: 1,
        borderBottomWidth: 1,
        borderColor: colors.border,
    },
    quantityLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    quantityControls: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    quantityButton: {
        width: 40,
        height: 40,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
    },
    quantityButtonText: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
    },
    quantityValue: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
        marginHorizontal: 20,
        minWidth: 30,
        textAlign: 'center',
    },
    totalSection: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        margin: 20,
        borderRadius: 12,
    },
    totalLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.text,
    },
    totalPrice: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.primary,
    },
    addToCartButton: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: 12,
        marginHorizontal: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addToCartText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
});

export default ProductDetailModal;

