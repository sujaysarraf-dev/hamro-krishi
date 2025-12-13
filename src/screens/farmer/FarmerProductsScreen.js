import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const FarmerProductsScreen = () => {
    const { colors, isDark } = useTheme();
    const dynamicStyles = getStyles(colors, isDark);
    const [searchQuery, setSearchQuery] = useState('');

    // Dummy products data
    const products = [
        { id: 1, name: 'Rice', price: 'Rp 1,300,000', stock: '50kg', status: 'Active', icon: '🌾' },
        { id: 2, name: 'Wheat', price: 'Rp 800,000', stock: '30kg', status: 'Active', icon: '🌾' },
        { id: 3, name: 'Corn', price: 'Rp 600,000', stock: '25kg', status: 'Active', icon: '🌽' },
        { id: 4, name: 'Tomato', price: 'Rp 15,000/kg', stock: '20kg', status: 'Low Stock', icon: '🍅' },
        { id: 5, name: 'Potato', price: 'Rp 12,000/kg', stock: '40kg', status: 'Active', icon: '🥔' },
    ];

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
            <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
                <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>My Products</Text>
                <TouchableOpacity style={[dynamicStyles.addButton, { backgroundColor: colors.primary }]}>
                    <Text style={dynamicStyles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={dynamicStyles.scrollView}>
                <View style={dynamicStyles.content}>
                    {/* Search Bar */}
                    <View style={[dynamicStyles.searchContainer, { backgroundColor: colors.surface }]}>
                        <Text style={[dynamicStyles.searchIcon, { color: colors.textSecondary }]}>🔍</Text>
                        <TextInput
                            style={[dynamicStyles.searchInput, { color: colors.text }]}
                            placeholder="Search products..."
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Products List */}
                    <View style={dynamicStyles.productsList}>
                        {products.map((product) => (
                            <View key={product.id} style={[dynamicStyles.productCard, { backgroundColor: colors.card }]}>
                                <View style={[dynamicStyles.productImageContainer, { backgroundColor: colors.surface }]}>
                                    <Text style={dynamicStyles.productEmoji}>{product.icon}</Text>
                                </View>
                                <View style={dynamicStyles.productDetails}>
                                    <Text style={[dynamicStyles.productName, { color: colors.text }]}>{product.name}</Text>
                                    <Text style={[dynamicStyles.productPrice, { color: colors.primary }]}>{product.price}</Text>
                                    <Text style={[dynamicStyles.productStock, { color: colors.textSecondary }]}>Stock: {product.stock}</Text>
                                    <View style={dynamicStyles.productActions}>
                                        <View style={[
                                            dynamicStyles.statusBadge,
                                            { backgroundColor: product.status === 'Active' ? '#E8F5E9' : '#FFF3E0' }
                                        ]}>
                                            <Text style={[
                                                dynamicStyles.statusText,
                                                { color: product.status === 'Active' ? '#4CAF50' : '#FF9800' }
                                            ]}>
                                                {product.status}
                                            </Text>
                                        </View>
                                        <TouchableOpacity style={dynamicStyles.editButton}>
                                            <Text style={[dynamicStyles.editButtonText, { color: colors.primary }]}>Edit</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        ))}
                    </View>

                    {/* Empty State (if no products) */}
                    {products.length === 0 && (
                        <View style={dynamicStyles.emptyContainer}>
                            <Text style={dynamicStyles.emptyIcon}>🌾</Text>
                            <Text style={[dynamicStyles.emptyText, { color: colors.text }]}>No products yet</Text>
                            <Text style={[dynamicStyles.emptySubtext, { color: colors.textSecondary }]}>Add your first product to get started</Text>
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
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
    },
    addButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 20,
    },
    searchIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    productsList: {
        marginTop: 8,
    },
    productCard: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    productImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    productEmoji: {
        fontSize: 40,
    },
    productDetails: {
        flex: 1,
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    productStock: {
        fontSize: 12,
        marginBottom: 8,
    },
    productActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    editButton: {
        paddingVertical: 4,
        paddingHorizontal: 12,
    },
    editButtonText: {
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

export default FarmerProductsScreen;

