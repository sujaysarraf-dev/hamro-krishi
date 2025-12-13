import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import UserHomeScreen from './UserHomeScreen';
import UserShopScreen from './UserShopScreen';
import UserCartScreen from './UserCartScreen';
import UserProfileScreen from './UserProfileScreen';

const UserDashboardScreen = () => {
    const [activeTab, setActiveTab] = useState('home');

    const renderScreen = () => {
        switch (activeTab) {
            case 'home':
                return <UserHomeScreen />;
            case 'shop':
                return <UserShopScreen />;
            case 'cart':
                return <UserCartScreen />;
            case 'profile':
                return <UserProfileScreen />;
            default:
                return <UserHomeScreen />;
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <View style={styles.content}>
                {renderScreen()}
            </View>
            <View style={styles.bottomNav}>
                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('home')}>
                    <View style={styles.navIconContainer}>
                        <Text style={styles.navIcon}>
                            {activeTab === 'home' ? '🏠' : '🏡'}
                        </Text>
                    </View>
                    <Text style={[styles.navLabel, activeTab === 'home' && styles.navLabelActive]}>
                        Home
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('shop')}>
                    <View style={styles.navIconContainer}>
                        <Text style={styles.navIcon}>🛍️</Text>
                    </View>
                    <Text style={[styles.navLabel, activeTab === 'shop' && styles.navLabelActive]}>
                        Shop
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('cart')}>
                    <View style={styles.navIconContainer}>
                        <Text style={styles.navIcon}>🛒</Text>
                    </View>
                    <Text style={[styles.navLabel, activeTab === 'cart' && styles.navLabelActive]}>
                        Cart
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab('profile')}>
                    <View style={styles.navIconContainer}>
                        <Text style={styles.navIcon}>👤</Text>
                    </View>
                    <Text style={[styles.navLabel, activeTab === 'profile' && styles.navLabelActive]}>
                        Profile
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    content: {
        flex: 1,
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E0E0E0',
        paddingTop: 8,
        paddingBottom: 8,
        paddingHorizontal: 8,
        justifyContent: 'space-around',
        alignItems: 'center',
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 8,
    },
    navIconContainer: {
        marginBottom: 4,
    },
    navIcon: {
        fontSize: 24,
    },
    navIconActive: {
        opacity: 1,
    },
    navLabel: {
        fontSize: 12,
        color: '#666666',
        fontWeight: '500',
    },
    navLabelActive: {
        color: '#228B22',
        fontWeight: '600',
    },
});

export default UserDashboardScreen;

