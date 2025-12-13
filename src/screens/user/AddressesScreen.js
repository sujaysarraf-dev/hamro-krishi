import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import SweetAlert from '../../components/SweetAlert';

const AddressesScreen = () => {
    const router = useRouter();
    const [addresses, setAddresses] = useState([
        {
            id: 1,
            name: 'Home',
            address: '123 Main Street, City, State 12345',
            phone: '+1234567890',
            isDefault: true,
        },
        {
            id: 2,
            name: 'Office',
            address: '456 Business Ave, City, State 12345',
            phone: '+1234567891',
            isDefault: false,
        },
    ]);
    const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });

    const handleSetDefault = (id) => {
        setAddresses(addresses.map(addr => ({
            ...addr,
            isDefault: addr.id === id
        })));
        setAlert({
            visible: true,
            type: 'success',
            title: 'Success',
            message: 'Default address updated!'
        });
    };

    const handleDelete = (id) => {
        if (addresses.length === 1) {
            setAlert({
                visible: true,
                type: 'warning',
                title: 'Cannot Delete',
                message: 'You must have at least one address'
            });
            return;
        }
        setAddresses(addresses.filter(addr => addr.id !== id));
        setAlert({
            visible: true,
            type: 'success',
            title: 'Success',
            message: 'Address deleted!'
        });
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Addresses</Text>
                <TouchableOpacity style={styles.addButton}>
                    <Text style={styles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                <View style={styles.content}>
                    {addresses.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Text style={styles.emptyIcon}>📍</Text>
                            <Text style={styles.emptyText}>No addresses yet</Text>
                            <Text style={styles.emptySubtext}>Add an address to get started</Text>
                        </View>
                    ) : (
                        addresses.map((address) => (
                            <View key={address.id} style={styles.addressCard}>
                                <View style={styles.addressHeader}>
                                    <Text style={styles.addressName}>{address.name}</Text>
                                    {address.isDefault && (
                                        <View style={styles.defaultBadge}>
                                            <Text style={styles.defaultBadgeText}>Default</Text>
                                        </View>
                                    )}
                                </View>
                                <Text style={styles.addressText}>{address.address}</Text>
                                <Text style={styles.addressPhone}>{address.phone}</Text>
                                <View style={styles.addressActions}>
                                    {!address.isDefault && (
                                        <TouchableOpacity
                                            style={styles.actionButton}
                                            onPress={() => handleSetDefault(address.id)}
                                        >
                                            <Text style={styles.actionButtonText}>Set as Default</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.editButton]}
                                        onPress={() => {
                                            setAlert({
                                                visible: true,
                                                type: 'info',
                                                title: 'Edit Address',
                                                message: 'Edit functionality coming soon!'
                                            });
                                        }}
                                    >
                                        <Text style={[styles.actionButtonText, styles.editButtonText]}>Edit</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={[styles.actionButton, styles.deleteButton]}
                                        onPress={() => handleDelete(address.id)}
                                    >
                                        <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}
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
    addButton: {
        padding: 8,
    },
    addButtonText: {
        fontSize: 16,
        color: '#228B22',
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
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
        color: '#1F1F1F',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666666',
    },
    addressCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    addressHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    addressName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1F1F1F',
    },
    defaultBadge: {
        backgroundColor: '#228B22',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
    },
    defaultBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    addressText: {
        fontSize: 14,
        color: '#1F1F1F',
        marginBottom: 4,
        lineHeight: 20,
    },
    addressPhone: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 12,
    },
    addressActions: {
        flexDirection: 'row',
        gap: 8,
    },
    actionButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    actionButtonText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1F1F1F',
    },
    editButton: {
        borderColor: '#228B22',
    },
    editButtonText: {
        color: '#228B22',
    },
    deleteButton: {
        borderColor: '#FF4444',
    },
    deleteButtonText: {
        color: '#FF4444',
    },
});

export default AddressesScreen;

