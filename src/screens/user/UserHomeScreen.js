import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Dimensions, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../config/supabase';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

const UserHomeScreen = () => {
    const { colors, isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(false);

    const productCategories = ['grain', 'vegetable', 'fruit', 'livestock', 'cash crop', 'spice and herb', 'fish'];

    useEffect(() => {
        if (selectedCategory !== 'all') {
            loadProductsByCategory();
        } else {
            setProducts([]);
        }
    }, [selectedCategory]);

    useFocusEffect(
        React.useCallback(() => {
            if (selectedCategory !== 'all') {
                loadProductsByCategory();
            }
        }, [selectedCategory])
    );

    const loadProductsByCategory = async () => {
        try {
            setLoading(true);
            
            // Fetch products with farmer profile information
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('*')
                .eq('category', selectedCategory)
                .eq('status', 'Active')
                .order('created_at', { ascending: false })
                .limit(20);

            if (productsError) {
                console.error('Error loading products:', productsError);
                throw productsError;
            }

            // Fetch farmer profiles for the products
            if (productsData && productsData.length > 0) {
                const farmerIds = [...new Set(productsData.map(p => p.farmer_id))];
                const { data: profilesData, error: profilesError } = await supabase
                    .from('user_profiles')
                    .select('id, full_name, phone')
                    .in('id', farmerIds);

                if (profilesError) {
                    console.error('Error loading profiles:', profilesError);
                }

                // Combine products with profiles
                const productsWithProfiles = productsData.map(product => ({
                    ...product,
                    user_profiles: profilesData?.find(p => p.id === product.farmer_id) || null
                }));

                setProducts(productsWithProfiles);
            } else {
                setProducts([]);
            }

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

    const filteredProducts = products.filter(product => {
        if (!searchQuery) return true;
        return product.name.toLowerCase().includes(searchQuery.toLowerCase());
    });

    const seasonalProducts = [
        {
            id: 1,
            name: 'Strawberry',
            store: 'Farm Fresh Store',
            price: 'NPR 1,300',
            location: 'Kathmandu, Nepal',
            image: '🍓'
        },
        {
            id: 2,
            name: 'Mango',
            store: 'Green Market',
            price: 'NPR 30/kg',
            location: 'Pokhara, Nepal',
            image: '🥭'
        },
        {
            id: 3,
            name: 'Lichi',
            store: 'Fresh Farm',
            price: 'NPR 14',
            location: 'Lalitpur, Nepal',
            image: '🍒'
        },
    ];

    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loadingFeatured, setLoadingFeatured] = useState(false);

    useEffect(() => {
        loadFeaturedProducts();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadFeaturedProducts();
        }, [])
    );

    const loadFeaturedProducts = async () => {
        try {
            setLoadingFeatured(true);
            
            // Fetch 3 random products from database
            const { data: productsData, error: productsError } = await supabase
                .from('products')
                .select('*')
                .eq('status', 'Active')
                .order('created_at', { ascending: false })
                .limit(3);

            if (productsError) {
                console.error('Error loading featured products:', productsError);
                throw productsError;
            }

            // Fetch farmer profiles for the products
            if (productsData && productsData.length > 0) {
                const farmerIds = [...new Set(productsData.map(p => p.farmer_id))];
                const { data: profilesData, error: profilesError } = await supabase
                    .from('user_profiles')
                    .select('id, full_name, phone')
                    .in('id', farmerIds);

                if (profilesError) {
                    console.error('Error loading profiles:', profilesError);
                }

                // Combine products with profiles
                const productsWithProfiles = productsData.map(product => ({
                    ...product,
                    user_profiles: profilesData?.find(p => p.id === product.farmer_id) || null
                }));

                setFeaturedProducts(productsWithProfiles);
            } else {
                setFeaturedProducts([]);
            }

        } catch (error) {
            console.error('Error loading featured products:', error);
        } finally {
            setLoadingFeatured(false);
        }
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

                    {/* All Products Section - Show dummy data when "All" is selected */}
                    {selectedCategory === 'all' && (
                        <>
                            {/* Seasonal Products Section */}
                            <View style={dynamicStyles.section}>
                                <View style={dynamicStyles.sectionHeader}>
                                    <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Seasonal Products</Text>
                                    <TouchableOpacity>
                                        <Text style={[dynamicStyles.moreLink, { color: colors.primary }]}>View More...</Text>
                                    </TouchableOpacity>
                                </View>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.horizontalScroll}>
                                    {seasonalProducts.map((product) => (
                                        <TouchableOpacity key={product.id} style={[dynamicStyles.productCard, { backgroundColor: colors.surface }]}>
                                            <View style={[dynamicStyles.productImageContainer, { backgroundColor: colors.border }]}>
                                                <Text style={dynamicStyles.productEmoji}>{product.image}</Text>
                                            </View>
                                            <Text style={[dynamicStyles.productName, { color: colors.text }]}>{product.name}</Text>
                                            <Text style={[dynamicStyles.productStore, { color: colors.textSecondary }]}>{product.store}</Text>
                                            <Text style={[dynamicStyles.productPrice, { color: colors.primary }]}>{product.price}</Text>
                                            <Text style={[dynamicStyles.productLocation, { color: colors.textSecondary }]}>{product.location}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>

                            {/* Products Section */}
                            <View style={dynamicStyles.section}>
                                <View style={dynamicStyles.sectionHeader}>
                                    <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Products</Text>
                                    <TouchableOpacity>
                                        <Text style={[dynamicStyles.moreLink, { color: colors.primary }]}>View More...</Text>
                                    </TouchableOpacity>
                                </View>
                                {loadingFeatured ? (
                                    <View style={dynamicStyles.loadingContainer}>
                                        <ActivityIndicator size="large" color={colors.primary} />
                                    </View>
                                ) : featuredProducts.length > 0 ? (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.horizontalScroll}>
                                        {featuredProducts.map((product) => (
                                            <TouchableOpacity 
                                                key={product.id} 
                                                style={[dynamicStyles.productCard, { backgroundColor: colors.surface }]}
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
                                    </ScrollView>
                                ) : (
                                    <View style={dynamicStyles.emptyContainer}>
                                        <Text style={dynamicStyles.emptyIcon}>🌾</Text>
                                        <Text style={[dynamicStyles.emptyText, { color: colors.text }]}>
                                            No products available
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </>
                    )}

                    {/* Category Products Section - Show real products from database when category is selected */}
                    {selectedCategory !== 'all' && (
                        <View style={dynamicStyles.section}>
                            <View style={dynamicStyles.sectionHeader}>
                                <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
                                    {selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)}
                                </Text>
                            </View>
                            {loading ? (
                                <View style={dynamicStyles.loadingContainer}>
                                    <ActivityIndicator size="large" color={colors.primary} />
                                </View>
                            ) : filteredProducts.length > 0 ? (
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.horizontalScroll}>
                                    {filteredProducts.map((product) => (
                                        <TouchableOpacity 
                                            key={product.id} 
                                            style={[dynamicStyles.productCard, { backgroundColor: colors.surface }]}
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
                                </ScrollView>
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
    horizontalScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    productCard: {
        width: 180,
        marginRight: 16,
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
});

export default UserHomeScreen;
