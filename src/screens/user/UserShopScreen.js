import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';

const { width } = Dimensions.get('window');

const UserShopScreen = () => {
    const { colors, isDark } = useTheme();
    const [searchQuery, setSearchQuery] = useState('');

    const commodities = [
        { id: 1, name: 'Padi', icon: '🌾', label: 'Padi' },
        { id: 2, name: 'Cabai', icon: '🌶️', label: 'Cabai' },
        { id: 3, name: 'Bawang', icon: '🧅', label: 'Bawang' },
        { id: 4, name: 'Tomat', icon: '🍅', label: 'Tomat' },
        { id: 5, name: 'Lele', icon: '🐟', label: 'Lele' },
        { id: 6, name: 'Jagung', icon: '🌽', label: 'Jagung' },
        { id: 7, name: 'Buncis', icon: '🫘', label: 'Buncis' },
        { id: 8, name: 'Wortel', icon: '🥕', label: 'Wortel' },
    ];

    const seasonalProducts = [
        {
            id: 1,
            name: 'Padi',
            store: 'Toko Abadi Sentosa',
            price: 'Rp 1,300,000',
            location: 'Sidoarjo, Jawa Tengah',
            image: '🌾'
        },
        {
            id: 2,
            name: 'Cabai',
            store: 'Toko Kelontong',
            price: 'Rp 30.000/kg',
            location: 'Bandung, Jawa Barat',
            image: '🌶️'
        },
        {
            id: 3,
            name: 'Bawang',
            store: 'Toko Sant',
            price: 'Rp 14.000',
            location: 'Bogor, Jawa Barat',
            image: '🧅'
        },
    ];

    const onionProducts = [
        {
            id: 1,
            name: 'Bawang merah',
            store: 'Toko Abadi Sentosa',
            image: '🧅'
        },
        {
            id: 2,
            name: 'Bawang bombay',
            store: 'Toko Cahaya lindungi',
            image: '🧅'
        },
        {
            id: 3,
            name: 'Bawang putih',
            store: 'Toko Sejahtera',
            image: '🧄'
        },
    ];

    const dynamicStyles = getStyles(colors, isDark);

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={dynamicStyles.content}>
                    {/* Header */}
                    <View style={dynamicStyles.header}>
                        <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>SHOP</Text>
                        <View style={[dynamicStyles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                            <Text style={dynamicStyles.searchIcon}>🔍</Text>
                            <TextInput
                                style={[dynamicStyles.searchInput, { color: colors.text }]}
                                placeholder="Bahan pokok"
                                placeholderTextColor={colors.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <TouchableOpacity>
                                <Text style={dynamicStyles.filterIcon}>⚙️</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Pilih Komoditas Section */}
                    <View style={dynamicStyles.section}>
                        <View style={dynamicStyles.sectionHeader}>
                            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Pilih Komoditas</Text>
                            <TouchableOpacity>
                                <Text style={[dynamicStyles.moreLink, { color: colors.primary }]}>Lainnya...</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={dynamicStyles.commoditiesGrid}>
                            {commodities.map((item) => (
                                <TouchableOpacity key={item.id} style={[dynamicStyles.commodityCard, { backgroundColor: colors.surface }]}>
                                    <Text style={dynamicStyles.commodityIcon}>{item.icon}</Text>
                                    <Text style={[dynamicStyles.commodityLabel, { color: colors.text }]}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Panen musim ini Section */}
                    <View style={dynamicStyles.section}>
                        <View style={dynamicStyles.sectionHeader}>
                            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Panen musim ini!</Text>
                            <TouchableOpacity>
                                <Text style={[dynamicStyles.moreLink, { color: colors.primary }]}>Muat lebih banyak...</Text>
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

                    {/* Bawang Section */}
                    <View style={dynamicStyles.section}>
                        <View style={dynamicStyles.sectionHeader}>
                            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Bawang</Text>
                            <TouchableOpacity>
                                <Text style={[dynamicStyles.moreLink, { color: colors.primary }]}>Muat lebih banyak...</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.horizontalScroll}>
                            {onionProducts.map((product) => (
                                <TouchableOpacity key={product.id} style={[dynamicStyles.productCard, { backgroundColor: colors.surface }]}>
                                    <View style={[dynamicStyles.productImageContainer, { backgroundColor: colors.border }]}>
                                        <Text style={dynamicStyles.productEmoji}>{product.image}</Text>
                                    </View>
                                    <Text style={[dynamicStyles.productStore, { color: colors.textSecondary }]}>{product.store}</Text>
                                    <Text style={[dynamicStyles.productName, { color: colors.text }]}>{product.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
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
});

export default UserShopScreen;

