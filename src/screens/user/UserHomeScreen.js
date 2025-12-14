import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../config/supabase';
import { useFocusEffect } from 'expo-router';
import ProductDetailModal from '../../components/ProductDetailModal';
import { cache } from '../../utils/cache';

const { width } = Dimensions.get('window');

const UserHomeScreen = () => {
    const { colors, isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [products, setProducts] = useState([]);
    const [searchResults, setSearchResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchLoading, setSearchLoading] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [modalVisible, setModalVisible] = useState(false);

    const productCategories = ['grain', 'vegetable', 'fruit', 'livestock', 'cash crop', 'spice and herb', 'fish'];

    useEffect(() => {
        loadProductsByCategory();
    }, [selectedCategory]);

    useEffect(() => {
        if (searchQuery.trim().length > 0) {
            searchProducts();
        } else {
            setSearchResults([]);
        }
    }, [searchQuery]);

    useFocusEffect(
        React.useCallback(() => {
            loadProductsByCategory();
        }, [selectedCategory])
    );

    const loadProductsByCategory = async () => {
        try {
            setLoading(true);
            
            // Check cache first
            const cacheKey = `products_${selectedCategory}`;
            const cachedData = await cache.get(cacheKey);
            if (cachedData) {
                setProducts(cachedData);
                setLoading(false);
                return;
            }
            
            // Build query based on category
            let query = supabase
                .from('products')
                .select(`
                    id,
                    name,
                    description,
                    price,
                    stock_quantity,
                    stock_unit,
                    category,
                    image_url,
                    is_organic,
                    created_at,
                    farmer_id,
                    user_profiles:farmer_id (
                        id,
                        full_name,
                        phone
                    )
                `)
                .eq('status', 'Active')
                .order('created_at', { ascending: false });
            
            // If "all" is selected, fetch 4 products. Otherwise, filter by category and fetch 20
            if (selectedCategory === 'all') {
                query = query.limit(4);
            } else {
                query = query.eq('category', selectedCategory).limit(20);
            }
            
            const { data: productsData, error: productsError } = await query;

            if (productsError) {
                console.error('Error loading products:', productsError);
                throw productsError;
            }

            const finalData = productsData || [];
            setProducts(finalData);
            
            // Cache the results
            await cache.set(cacheKey, finalData);

        } catch (error) {
            console.error('Error loading products:', error);
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

    const searchProducts = async () => {
        try {
            setSearchLoading(true);
            
            // Optimized search query with join
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select(`
                    id,
                    name,
                    description,
                    price,
                    stock_quantity,
                    stock_unit,
                    category,
                    image_url,
                    is_organic,
                    created_at,
                    farmer_id,
                    user_profiles:farmer_id (
                        id,
                        full_name,
                        phone
                    )
                `)
                .eq('status', 'Active')
                .ilike('name', `%${searchQuery}%`)
                .order('created_at', { ascending: false })
                .limit(50);

            if (productsError) {
                console.error('Error searching products:', productsError);
                throw productsError;
            }

            setSearchResults(productsData || []);

        } catch (error) {
            console.error('Error searching products:', error);
            setSearchResults([]);
        } finally {
            setSearchLoading(false);
        }
    };

    // Determine which products to display
    const displayProducts = searchQuery.trim().length > 0 ? searchResults : products;
    const isLoading = searchQuery.trim().length > 0 ? searchLoading : loading;

    const handleProductPress = (product) => {
        setSelectedProduct(product);
        setModalVisible(true);
    };

    const handleCloseModal = () => {
        setModalVisible(false);
        setSelectedProduct(null);
    };


    const dynamicStyles = getStyles(colors, isDark);

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={dynamicStyles.content}>
                    {/* Header */}
                    <View style={dynamicStyles.header}>
                        <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Home</Text>
                        <View style={[dynamicStyles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={dynamicStyles.searchIcon}>🔍</Text>
                            <TextInput
                                style={[dynamicStyles.searchInput, { color: colors.text }]}
                                placeholder="Search products..."
                                placeholderTextColor={colors.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <TouchableOpacity>
                                <Text style={dynamicStyles.filterIcon}>⚙️</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Category Filter */}
                    <View style={dynamicStyles.categoryFilterContainer}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={dynamicStyles.categoryFilterContent}
                        >
                            <TouchableOpacity
                                style={[
                                    dynamicStyles.categoryFilterChip,
                                    { 
                                        backgroundColor: selectedCategory === 'all' ? colors.primary : colors.surface,
                                        borderColor: colors.border,
                                    }
                                ]}
                                onPress={() => setSelectedCategory('all')}
                            >
                                <Text style={[
                                    dynamicStyles.categoryFilterText,
                                    { color: selectedCategory === 'all' ? '#FFFFFF' : colors.text }
                                ]}>
                                    All
                                </Text>
                            </TouchableOpacity>
                            {productCategories.map((category) => (
                                <TouchableOpacity
                                    key={category}
                                    style={[
                                        dynamicStyles.categoryFilterChip,
                                        { 
                                            backgroundColor: selectedCategory === category ? colors.primary : colors.surface,
                                            borderColor: colors.border,
                                        }
                                    ]}
                                    onPress={() => setSelectedCategory(category)}
                                >
                                    <Text style={[
                                        dynamicStyles.categoryFilterText,
                                        { color: selectedCategory === category ? '#FFFFFF' : colors.text }
                                    ]}>
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Search Results Section - Show when search query is active */}
                    {searchQuery.trim().length > 0 && (
                        <View style={dynamicStyles.section}>
                            <View style={dynamicStyles.sectionHeader}>
                                <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
                                    Search Results
                                </Text>
                                <Text style={[dynamicStyles.searchResultCount, { color: colors.textSecondary }]}>
                                    {displayProducts.length} found
                                </Text>
                            </View>
                            {isLoading ? (
                                <View style={dynamicStyles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                </View>
                            ) : displayProducts.length > 0 ? (
                                <View style={dynamicStyles.productsGrid}>
                                    {displayProducts.map((product) => (
                                        <TouchableOpacity 
                                            key={product.id} 
                                            style={[dynamicStyles.productCard, { backgroundColor: colors.surface }]}
                                            onPress={() => handleProductPress(product)}
                                        >
                                            <View style={[dynamicStyles.productImageContainer, { backgroundColor: colors.border }]}>
                                                {product.image_url ? (
                                                    <Image 
                                                        source={{ uri: product.image_url }} 
                                                        style={dynamicStyles.productImage}
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <Text style={dynamicStyles.productEmoji}>🌾</Text>
                                                )}
                                                {product.is_organic && (
                                                    <View style={dynamicStyles.organicBadge}>
                                                        <Text style={dynamicStyles.organicBadgeText}>🌿 Organic</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={[dynamicStyles.productName, { color: colors.text }]} numberOfLines={1}>
                                                {product.name}
                                            </Text>
                                            <Text style={[dynamicStyles.productStore, { color: colors.textSecondary }]} numberOfLines={1}>
                                                {product.user_profiles?.full_name || 'Farmer'}
                                            </Text>
                                            <Text style={[dynamicStyles.productPrice, { color: colors.primary }]}>
                                                NPR {formatPrice(product.price)} / {product.stock_unit || 'kilograms'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <View style={dynamicStyles.emptyContainer}>
                                    <Text style={dynamicStyles.emptyIcon}>🔍</Text>
                                    <Text style={[dynamicStyles.emptyText, { color: colors.text }]}>
                                        No products found
                                    </Text>
                                    <Text style={[dynamicStyles.emptySubtext, { color: colors.textSecondary }]}>
                                        Try a different search term
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* All Products Section - Show products from DB when "All" is selected and no search */}
                    {selectedCategory === 'all' && searchQuery.trim().length === 0 && (
                        <View style={dynamicStyles.section}>
                            <View style={dynamicStyles.sectionHeader}>
                                <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Products</Text>
                            </View>
                            {isLoading ? (
                                <View style={dynamicStyles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                </View>
                            ) : displayProducts.length > 0 ? (
                                <View style={dynamicStyles.productsGrid}>
                                    {displayProducts.map((product) => (
                                        <TouchableOpacity 
                                            key={product.id} 
                                            style={[dynamicStyles.productCard, { backgroundColor: colors.surface }]}
                                            onPress={() => handleProductPress(product)}
                                        >
                                            <View style={[dynamicStyles.productImageContainer, { backgroundColor: colors.border }]}>
                                                {product.image_url ? (
                                                    <Image 
                                                        source={{ uri: product.image_url }} 
                                                        style={dynamicStyles.productImage}
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <Text style={dynamicStyles.productEmoji}>🌾</Text>
                                                )}
                                                {product.is_organic && (
                                                    <View style={dynamicStyles.organicBadge}>
                                                        <Text style={dynamicStyles.organicBadgeText}>🌿 Organic</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={[dynamicStyles.productName, { color: colors.text }]} numberOfLines={1}>
                                                {product.name}
                                            </Text>
                                            <Text style={[dynamicStyles.productStore, { color: colors.textSecondary }]} numberOfLines={1}>
                                                {product.user_profiles?.full_name || 'Farmer'}
                                            </Text>
                                            <Text style={[dynamicStyles.productPrice, { color: colors.primary }]}>
                                                NPR {formatPrice(product.price)} / {product.stock_unit || 'kilograms'}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <View style={dynamicStyles.emptyContainer}>
                                    <Text style={dynamicStyles.emptyIcon}>🌾</Text>
                                    <Text style={[dynamicStyles.emptyText, { color: colors.text }]}>
                                        No products available
                                    </Text>
                                </View>
                            )}
                        </View>
                    )}

                    {/* Category Products Section - Show real products from database when category is selected and no search */}
                    {selectedCategory !== 'all' && searchQuery.trim().length === 0 && (
                        <View style={dynamicStyles.section}>
                            <View style={dynamicStyles.sectionHeader}>
                                <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
                                    {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                                </Text>
                            </View>
                            {isLoading ? (
                                <View style={dynamicStyles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                </View>
                            ) : displayProducts.length > 0 ? (
                                <View style={dynamicStyles.productsGrid}>
                                    {displayProducts.map((product) => (
                                        <TouchableOpacity 
                                            key={product.id} 
                                            style={[dynamicStyles.productCard, { backgroundColor: colors.surface }]}
                                            onPress={() => handleProductPress(product)}
                                        >
                                            <View style={[dynamicStyles.productImageContainer, { backgroundColor: colors.border }]}>
                                                {product.image_url ? (
                                                    <Image 
                                                        source={{ uri: product.image_url }} 
                                                        style={dynamicStyles.productImage}
                                                        resizeMode="cover"
                                                    />
                                                ) : (
                                                    <Text style={dynamicStyles.productEmoji}>🌾</Text>
                                                )}
                                                {product.is_organic && (
                                                    <View style={dynamicStyles.organicBadge}>
                                                        <Text style={dynamicStyles.organicBadgeText}>🌿 Organic</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <Text style={[dynamicStyles.productName, { color: colors.text }]} numberOfLines={1}>
                                                {product.name}
                                            </Text>
                                            <Text style={[dynamicStyles.productStore, { color: colors.textSecondary }]} numberOfLines={1}>
                                                {product.user_profiles?.full_name || 'Farmer'}
                                            </Text>
                                            <Text style={[dynamicStyles.productPrice, { color: colors.primary }]}>
                                                NPR {formatPrice(product.price)} / {product.stock_unit || 'kilograms'}
                                            </Text>
                                            {product.user_profiles?.location && (
                                                <Text style={[dynamicStyles.productLocation, { color: colors.textSecondary }]} numberOfLines={1}>
                                                    {product.user_profiles.location}
                                                </Text>
                                            )}
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            ) : (
                                <View style={dynamicStyles.emptyContainer}>
                                    <Text style={dynamicStyles.emptyIcon}>🌾</Text>
                                    <Text style={[dynamicStyles.emptyText, { color: colors.text }]}>
                                        No products found in this category
                                    </Text>
                                    {searchQuery && (
                                        <Text style={[dynamicStyles.emptySubtext, { color: colors.textSecondary }]}>
                                            Try a different search term
                                        </Text>
                                    )}
                                </View>
                            )}
                        </View>
                    )}
                </View>
            </ScrollView>
            <ProductDetailModal
                visible={modalVisible}
                product={selectedProduct}
                onClose={handleCloseModal}
            />
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
    header: {
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    searchIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
    },
    filterIcon: {
        fontSize: 20,
    },
    categoryFilterContainer: {
        marginBottom: 20,
    },
    categoryFilterContent: {
        paddingRight: 20,
    },
    categoryFilterChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    categoryFilterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    section: {
        marginBottom: 32,
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
        color: colors.text,
    },
    moreLink: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
    },
    commoditiesGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    commodityCard: {
        width: (width - 60) / 4,
        aspectRatio: 1,
        backgroundColor: colors.surface,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    commodityIcon: {
        fontSize: 32,
        marginBottom: 8,
    },
    commodityLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.text,
        textAlign: 'center',
    },
    productsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginHorizontal: -8,
    },
    productCard: {
        width: '48%',
        marginBottom: 16,
        marginHorizontal: '1%',
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
    },
    productImageContainer: {
        width: '100%',
        height: 140,
        backgroundColor: colors.border,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
        position: 'relative',
        overflow: 'hidden',
    },
    organicBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: '#4CAF50',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFFFFF',
    },
    organicBadgeText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: '700',
    },
    productEmoji: {
        fontSize: 60,
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    productStore: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.primary,
        marginBottom: 4,
    },
    productLocation: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    productImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyIcon: {
        fontSize: 60,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
    },
    searchResultCount: {
        fontSize: 14,
        fontWeight: '500',
    },
});

export default UserHomeScreen;
