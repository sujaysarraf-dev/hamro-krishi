import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import UserHomeScreen from './UserHomeScreen';
import UserCartScreen from './UserCartScreen';
import UserHistoryScreen from './UserHistoryScreen';
import UserProfileScreen from './UserProfileScreen';

const UserDashboardScreen = () => {
    const { colors, isDark } = useTheme();
    const [activeTab, setActiveTab] = useState('home');

    const renderScreen = () => {
        switch (activeTab) {
            case 'home':
                return <UserHomeScreen />;
            case 'cart':
                return <UserCartScreen />;
            case 'history':
                return <UserHistoryScreen />;
            case 'profile':
                return <UserProfileScreen />;
            default:
                return <UserHomeScreen />;
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
                <TouchableOpacity style={dynamicStyles.navItem} onPress={() => setActiveTab('cart')}>
                    <View style={dynamicStyles.navIconContainer}>
                        <Text style={[dynamicStyles.navIcon, { opacity: activeTab === 'cart' ? 1 : 0.6 }]}>🛒</Text>
                    </View>
                    <Text style={[dynamicStyles.navLabel, activeTab === 'cart' && { color: colors.primary, fontWeight: '600' }]}>
                        Cart
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity style={dynamicStyles.navItem} onPress={() => setActiveTab('history')}>
                    <View style={dynamicStyles.navIconContainer}>
                        <Text style={[dynamicStyles.navIcon, { opacity: activeTab === 'history' ? 1 : 0.6 }]}>📦</Text>
                    </View>
                    <Text style={[dynamicStyles.navLabel, activeTab === 'history' && { color: colors.primary, fontWeight: '600' }]}>
                        History
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

export default UserDashboardScreen;

