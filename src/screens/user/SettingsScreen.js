import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import SweetAlert from '../../components/SweetAlert';

const SettingsScreen = () => {
    const router = useRouter();
    const { theme, isDark, colors, setTheme } = useTheme();
    const [notifications, setNotifications] = useState(true);
    const [emailUpdates, setEmailUpdates] = useState(false);
    const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });

    const handleThemeChange = (newTheme) => {
        setTheme(newTheme);
    };

    const handleAbout = () => {
        setAlert({
            visible: true,
            type: 'info',
            title: 'About',
            message: 'Smart Farm App v1.0.0\n\nYour trusted platform for smart farming and agriculture.'
        });
    };

    const handlePrivacy = () => {
        setAlert({
            visible: true,
            type: 'info',
            title: 'Privacy Policy',
            message: 'Privacy policy details will be available soon.'
        });
    };

    const handleTerms = () => {
        setAlert({
            visible: true,
            type: 'info',
            title: 'Terms of Service',
            message: 'Terms of service details will be available soon.'
        });
    };

    const dynamicStyles = getStyles(colors, isDark);

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
            <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={dynamicStyles.backButton}>
                    <Text style={[dynamicStyles.backButtonText, { color: colors.primary }]}>← Back</Text>
                </TouchableOpacity>
                <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Settings</Text>
                <View style={dynamicStyles.placeholder} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={dynamicStyles.scrollView}>
                <View style={dynamicStyles.content}>
                    <View style={dynamicStyles.section}>
                        <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Appearance</Text>
                        
                        <View style={[dynamicStyles.settingItem, { borderBottomColor: colors.border }]}>
                            <View style={dynamicStyles.settingInfo}>
                                <Text style={[dynamicStyles.settingLabel, { color: colors.text }]}>Theme</Text>
                                <Text style={[dynamicStyles.settingDescription, { color: colors.textSecondary }]}>
                                    {theme === 'system' ? 'System default' : theme === 'dark' ? 'Dark mode' : 'Light mode'}
                                </Text>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[dynamicStyles.themeOption, { borderBottomColor: colors.border }]}
                            onPress={() => handleThemeChange('light')}
                        >
                            <View style={dynamicStyles.themeOptionContent}>
                                <Text style={[dynamicStyles.themeOptionText, { color: colors.text }]}>☀️ Light</Text>
                                {theme === 'light' && <Text style={[dynamicStyles.checkmark, { color: colors.primary }]}>✓</Text>}
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[dynamicStyles.themeOption, { borderBottomColor: colors.border }]}
                            onPress={() => handleThemeChange('dark')}
                        >
                            <View style={dynamicStyles.themeOptionContent}>
                                <Text style={[dynamicStyles.themeOptionText, { color: colors.text }]}>🌙 Dark</Text>
                                {theme === 'dark' && <Text style={[dynamicStyles.checkmark, { color: colors.primary }]}>✓</Text>}
                            </View>
                        </TouchableOpacity>

                        <TouchableOpacity 
                            style={[dynamicStyles.themeOption, { borderBottomColor: colors.border }]}
                            onPress={() => handleThemeChange('system')}
                        >
                            <View style={dynamicStyles.themeOptionContent}>
                                <Text style={[dynamicStyles.themeOptionText, { color: colors.text }]}>⚙️ System</Text>
                                {theme === 'system' && <Text style={[dynamicStyles.checkmark, { color: colors.primary }]}>✓</Text>}
                            </View>
                        </TouchableOpacity>
                    </View>

                    <View style={dynamicStyles.section}>
                        <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Notifications</Text>
                        
                        <View style={[dynamicStyles.settingItem, { borderBottomColor: colors.border }]}>
                            <View style={dynamicStyles.settingInfo}>
                                <Text style={[dynamicStyles.settingLabel, { color: colors.text }]}>Push Notifications</Text>
                                <Text style={[dynamicStyles.settingDescription, { color: colors.textSecondary }]}>Receive push notifications</Text>
                            </View>
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        <View style={[dynamicStyles.settingItem, { borderBottomColor: colors.border }]}>
                            <View style={dynamicStyles.settingInfo}>
                                <Text style={[dynamicStyles.settingLabel, { color: colors.text }]}>Email Updates</Text>
                                <Text style={[dynamicStyles.settingDescription, { color: colors.textSecondary }]}>Receive email updates</Text>
                            </View>
                            <Switch
                                value={emailUpdates}
                                onValueChange={setEmailUpdates}
                                trackColor={{ false: colors.border, true: colors.primary }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>

                    <View style={dynamicStyles.section}>
                        <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>About</Text>
                        
                        <TouchableOpacity style={[dynamicStyles.menuItem, { borderBottomColor: colors.border }]} onPress={handleAbout}>
                            <Text style={dynamicStyles.menuIcon}>ℹ️</Text>
                            <Text style={[dynamicStyles.menuText, { color: colors.text }]}>About</Text>
                            <Text style={[dynamicStyles.menuArrow, { color: colors.textSecondary }]}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[dynamicStyles.menuItem, { borderBottomColor: colors.border }]} onPress={handlePrivacy}>
                            <Text style={dynamicStyles.menuIcon}>🔒</Text>
                            <Text style={[dynamicStyles.menuText, { color: colors.text }]}>Privacy Policy</Text>
                            <Text style={[dynamicStyles.menuArrow, { color: colors.textSecondary }]}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={[dynamicStyles.menuItem, { borderBottomColor: colors.border }]} onPress={handleTerms}>
                            <Text style={dynamicStyles.menuIcon}>📄</Text>
                            <Text style={[dynamicStyles.menuText, { color: colors.text }]}>Terms of Service</Text>
                            <Text style={[dynamicStyles.menuArrow, { color: colors.textSecondary }]}>›</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
            <SweetAlert
                visible={alert.visible}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onConfirm={() => setAlert({ ...alert, visible: false })}
            />
        </SafeAreaView>
    );
};

const getStyles = (colors, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.header,
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: colors.primary,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    placeholder: {
        width: 60,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    themeOption: {
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    themeOptionContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    themeOptionText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    checkmark: {
        fontSize: 20,
        fontWeight: 'bold',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    menuIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    menuArrow: {
        fontSize: 24,
        color: colors.textSecondary,
    },
});

export default SettingsScreen;

