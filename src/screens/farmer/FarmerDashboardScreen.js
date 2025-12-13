import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import FarmerHomeScreen from './FarmerHomeScreen';
import FarmerProductsScreen from './FarmerProductsScreen';
import FarmerDiscussionScreen from './FarmerDiscussionScreen';
import FarmerHistoryScreen from './FarmerHistoryScreen';
import FarmerProfileScreen from './FarmerProfileScreen';

const FarmerDashboardScreen = () => {
    const { colors, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('home');

    const renderScreen = () => {
        switch (activeTab) {
            case 'home':
                return <FarmerHomeScreen />;
            case 'products':
                return <FarmerProductsScreen />;
            case 'discussion':
                return <FarmerDiscussionScreen />;
            case 'orders':
                return <FarmerHistoryScreen />;
            case 'profile':
                return <FarmerProfileScreen />;
            default:
                return <FarmerHomeScreen />;
        }
    };

    const dynamicStyles = getStyles(colors, isDark);

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]} edges={['top']}>
            <View style={dynamicStyles.content}>
                {renderScreen()}
            </View>
            <View style={[dynamicStyles.bottomNav, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
                <TouchableOpacity style={dynamicStyles.navItem} onPress={() => setActiveTab('home')}>
                    <View style={dynamicStyles.navIconContainer}>
                        <Text style={[dynamicStyles.navIcon, { opacity: activeTab === 'home' ? 1 : 0.6 }]}>
                            {activeTab === 'home' ? '🏠' : '🏡'}
                        </Text>
                    </View>
                    <Text style={[dynamicStyles.navLabel, activeTab === 'home' && { color: colors.primary, fontWeight: '600' }]}>
                        Home
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={dynamicStyles.navItem} onPress={() => setActiveTab('products')}>
                    <View style={dynamicStyles.navIconContainer}>
                        <Text style={[dynamicStyles.navIcon, { opacity: activeTab === 'products' ? 1 : 0.6 }]}>🌾</Text>
                    </View>
                    <Text style={[dynamicStyles.navLabel, activeTab === 'products' && { color: colors.primary, fontWeight: '600' }]}>
                        Products
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={dynamicStyles.navItem} onPress={() => setActiveTab('discussion')}>
                    <View style={dynamicStyles.navIconContainer}>
                        <Text style={[dynamicStyles.navIcon, { opacity: activeTab === 'discussion' ? 1 : 0.6 }]}>💬</Text>
                    </View>
                    <Text style={[dynamicStyles.navLabel, activeTab === 'discussion' && { color: colors.primary, fontWeight: '600' }]}>
                        Discussion
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={dynamicStyles.navItem} onPress={() => setActiveTab('orders')}>
                    <View style={dynamicStyles.navIconContainer}>
                        <Text style={[dynamicStyles.navIcon, { opacity: activeTab === 'orders' ? 1 : 0.6 }]}>📦</Text>
                    </View>
                    <Text style={[dynamicStyles.navLabel, activeTab === 'orders' && { color: colors.primary, fontWeight: '600' }]}>
                        Orders
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={dynamicStyles.navItem} onPress={() => setActiveTab('profile')}>
                    <View style={dynamicStyles.navIconContainer}>
                        <Text style={[dynamicStyles.navIcon, { opacity: activeTab === 'profile' ? 1 : 0.6 }]}>👤</Text>
                    </View>
                    <Text style={[dynamicStyles.navLabel, activeTab === 'profile' && { color: colors.primary, fontWeight: '600' }]}>
                        Profile
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

const getStyles = (colors, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    content: {
        flex: 1,
    },
    bottomNav: {
        flexDirection: 'row',
        backgroundColor: colors.card,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 8,
        paddingBottom: 8,
        paddingHorizontal: 8,
        justifyContent: 'space-around',
        alignItems: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: isDark ? 0.3 : 0.1,
        shadowRadius: 4,
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
    navLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500',
    },
});

export default FarmerDashboardScreen;

