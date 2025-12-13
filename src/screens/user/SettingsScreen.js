import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import SweetAlert from '../../components/SweetAlert';

const SettingsScreen = () => {
    const router = useRouter();
    const [notifications, setNotifications] = useState(true);
    const [emailUpdates, setEmailUpdates] = useState(false);
    const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });

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

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={styles.placeholder} />
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                <View style={styles.content}>
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Notifications</Text>
                        
                        <View style={styles.settingItem}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingLabel}>Push Notifications</Text>
                                <Text style={styles.settingDescription}>Receive push notifications</Text>
                            </View>
                            <Switch
                                value={notifications}
                                onValueChange={setNotifications}
                                trackColor={{ false: '#E0E0E0', true: '#228B22' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>

                        <View style={styles.settingItem}>
                            <View style={styles.settingInfo}>
                                <Text style={styles.settingLabel}>Email Updates</Text>
                                <Text style={styles.settingDescription}>Receive email updates</Text>
                            </View>
                            <Switch
                                value={emailUpdates}
                                onValueChange={setEmailUpdates}
                                trackColor={{ false: '#E0E0E0', true: '#228B22' }}
                                thumbColor="#FFFFFF"
                            />
                        </View>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>About</Text>
                        
                        <TouchableOpacity style={styles.menuItem} onPress={handleAbout}>
                            <Text style={styles.menuIcon}>ℹ️</Text>
                            <Text style={styles.menuText}>About</Text>
                            <Text style={styles.menuArrow}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={handlePrivacy}>
                            <Text style={styles.menuIcon}>🔒</Text>
                            <Text style={styles.menuText}>Privacy Policy</Text>
                            <Text style={styles.menuArrow}>›</Text>
                        </TouchableOpacity>

                        <TouchableOpacity style={styles.menuItem} onPress={handleTerms}>
                            <Text style={styles.menuIcon}>📄</Text>
                            <Text style={styles.menuText}>Terms of Service</Text>
                            <Text style={styles.menuArrow}>›</Text>
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

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    backButton: {
        padding: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#228B22',
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#1F1F1F',
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
        color: '#1F1F1F',
        marginBottom: 16,
    },
    settingItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    settingInfo: {
        flex: 1,
        marginRight: 16,
    },
    settingLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1F1F1F',
        marginBottom: 4,
    },
    settingDescription: {
        fontSize: 12,
        color: '#666666',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    menuIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: '#1F1F1F',
    },
    menuArrow: {
        fontSize: 24,
        color: '#666666',
    },
});

export default SettingsScreen;

