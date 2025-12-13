import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const UserShopScreen = () => {
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

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Text style={styles.headerTitle}>SHOP</Text>
                        <View style={styles.searchContainer}>
                            <Text style={styles.searchIcon}>🔍</Text>
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Bahan pokok"
                                placeholderTextColor="#999999"
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            <TouchableOpacity>
                                <Text style={styles.filterIcon}>⚙️</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Pilih Komoditas Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Pilih Komoditas</Text>
                            <TouchableOpacity>
                                <Text style={styles.moreLink}>Lainnya...</Text>
                            </TouchableOpacity>
                        </View>
                        <View style={styles.commoditiesGrid}>
                            {commodities.map((item) => (
                                <TouchableOpacity key={item.id} style={styles.commodityCard}>
                                    <Text style={styles.commodityIcon}>{item.icon}</Text>
                                    <Text style={styles.commodityLabel}>{item.label}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>

                    {/* Panen musim ini Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Panen musim ini!</Text>
                            <TouchableOpacity>
                                <Text style={styles.moreLink}>Muat lebih banyak...</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {seasonalProducts.map((product) => (
                                <TouchableOpacity key={product.id} style={styles.productCard}>
                                    <View style={styles.productImageContainer}>
                                        <Text style={styles.productEmoji}>{product.image}</Text>
                                    </View>
                                    <Text style={styles.productName}>{product.name}</Text>
                                    <Text style={styles.productStore}>{product.store}</Text>
                                    <Text style={styles.productPrice}>{product.price}</Text>
                                    <Text style={styles.productLocation}>{product.location}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {/* Bawang Section */}
                    <View style={styles.section}>
                        <View style={styles.sectionHeader}>
                            <Text style={styles.sectionTitle}>Bawang</Text>
                            <TouchableOpacity>
                                <Text style={styles.moreLink}>Muat lebih banyak...</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
                            {onionProducts.map((product) => (
                                <TouchableOpacity key={product.id} style={styles.productCard}>
                                    <View style={styles.productImageContainer}>
                                        <Text style={styles.productEmoji}>{product.image}</Text>
                                    </View>
                                    <Text style={styles.productStore}>{product.store}</Text>
                                    <Text style={styles.productName}>{product.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
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
    content: {
        padding: 20,
    },
    header: {
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '700',
        color: '#1F1F1F',
        marginBottom: 16,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    searchIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
        color: '#1F1F1F',
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
        color: '#1F1F1F',
    },
    moreLink: {
        fontSize: 14,
        color: '#228B22',
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
        backgroundColor: '#F0FFF4',
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
        color: '#1F1F1F',
        textAlign: 'center',
    },
    horizontalScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    productCard: {
        width: 180,
        marginRight: 16,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 12,
    },
    productImageContainer: {
        width: '100%',
        height: 140,
        backgroundColor: '#E0E0E0',
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
        color: '#1F1F1F',
        marginBottom: 4,
    },
    productStore: {
        fontSize: 12,
        color: '#666666',
        marginBottom: 4,
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '700',
        color: '#228B22',
        marginBottom: 4,
    },
    productLocation: {
        fontSize: 12,
        color: '#666666',
    },
});

export default UserShopScreen;

