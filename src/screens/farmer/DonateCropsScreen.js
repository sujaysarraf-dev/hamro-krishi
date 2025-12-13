import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../config/supabase';
import SweetAlert from '../../components/SweetAlert';

const DonateCropsScreen = () => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [crops, setCrops] = useState([{
        id: Date.now(),
        productName: '',
        quantity: '',
        unit: 'kilograms',
        description: '',
        expiryDate: ''
    }]);
    const [commonData, setCommonData] = useState({
        contactNumber: '',
        pickupLocation: ''
    });
    const [totalDonations, setTotalDonations] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingDonations, setLoadingDonations] = useState(true);
    const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });
    const [showUnitDropdown, setShowUnitDropdown] = useState(null);
    const [showDonateModal, setShowDonateModal] = useState(false);
    const [donations, setDonations] = useState([]);
    const [donationRequests, setDonationRequests] = useState([
        {
            id: 1,
            organizationName: 'Nepal Red Cross Society',
            productName: 'Rice',
            quantity: 100,
            unit: 'kilograms',
            description: 'Need rice for community kitchen serving 200 people daily',
            location: 'Kathmandu, Nepal',
            contactNumber: '01-4410383',
            urgency: 'high',
            postedDate: '2024-01-15'
        },
        {
            id: 2,
            organizationName: 'Local Food Bank',
            productName: 'Vegetables',
            quantity: 50,
            unit: 'kilograms',
            description: 'Looking for fresh vegetables for weekly distribution',
            location: 'Pokhara, Nepal',
            contactNumber: '061-521234',
            urgency: 'medium',
            postedDate: '2024-01-14'
        },
        {
            id: 3,
            organizationName: 'Orphanage Care Center',
            productName: 'Fruits',
            quantity: 30,
            unit: 'kilograms',
            description: 'Need fruits for children nutrition program',
            location: 'Lalitpur, Nepal',
            contactNumber: '01-5523456',
            urgency: 'high',
            postedDate: '2024-01-13'
        },
        {
            id: 4,
            organizationName: 'Community Health Center',
            productName: 'Grains',
            quantity: 200,
            unit: 'kilograms',
            description: 'Seeking grains for emergency food assistance program',
            location: 'Bhaktapur, Nepal',
            contactNumber: '01-6612345',
            urgency: 'medium',
            postedDate: '2024-01-12'
        }
    ]);

    const units = ['kilograms', 'quintals', 'tons', 'liters', 'pieces'];

    useEffect(() => {
        loadTotalDonations();
        loadDonations();
    }, []);

    useEffect(() => {
        const backAction = () => {
            router.back();
            return true; // Prevent default back behavior
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [router]);

    const loadTotalDonations = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('crop_donations')
                .select('id')
                .eq('farmer_id', user.id);

            if (error) {
                console.error('Error loading donations count:', error);
                return;
            }

            setTotalDonations(data?.length || 0);
        } catch (error) {
            console.error('Error loading donations count:', error);
        }
    };

    const loadDonations = async () => {
        try {
            setLoadingDonations(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('crop_donations')
                .select('*')
                .eq('farmer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading donations:', error);
                return;
            }

            setDonations(data || []);
        } catch (error) {
            console.error('Error loading donations:', error);
        } finally {
            setLoadingDonations(false);
        }
    };

    const addCrop = () => {
        setCrops([...crops, {
            id: Date.now() + Math.random(),
            productName: '',
            quantity: '',
            unit: 'kilograms',
            description: '',
            expiryDate: ''
        }]);
    };

    const removeCrop = (id) => {
        if (crops.length > 1) {
            setCrops(crops.filter(crop => crop.id !== id));
        }
    };

    const updateCrop = (id, field, value) => {
        setCrops(crops.map(crop => 
            crop.id === id ? { ...crop, [field]: value } : crop
        ));
    };

    const handleSubmit = async () => {
        // Validate common fields
        if (!commonData.contactNumber.trim()) {
            setAlert({
                visible: true,
                type: 'warning',
                title: 'Validation Error',
                message: 'Please enter your contact number.',
            });
            return;
        }

        // Validate all crops
        for (let i = 0; i < crops.length; i++) {
            const crop = crops[i];
            if (!crop.productName.trim()) {
                setAlert({
                    visible: true,
                    type: 'warning',
                    title: 'Validation Error',
                    message: `Please enter the product name for crop ${i + 1}.`,
                });
                return;
            }

            if (!crop.quantity || parseFloat(crop.quantity) <= 0) {
                setAlert({
                    visible: true,
                    type: 'warning',
                    title: 'Validation Error',
                    message: `Please enter a valid quantity for crop ${i + 1}.`,
                });
                return;
            }
        }

        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Prepare all donations to insert
            const donationsToInsert = crops.map(crop => ({
                farmer_id: user.id,
                product_name: crop.productName.trim(),
                quantity: parseFloat(crop.quantity),
                unit: crop.unit,
                description: crop.description.trim() || null,
                contact_number: commonData.contactNumber.trim(),
                expiry_date: crop.expiryDate || null,
                pickup_location: commonData.pickupLocation.trim() || null,
                status: 'available'
            }));

            const { error } = await supabase
                .from('crop_donations')
                .insert(donationsToInsert);

            if (error) {
                console.error('Error submitting donations:', error);
                throw error;
            }

            setAlert({
                visible: true,
                type: 'success',
                title: 'Donations Listed!',
                message: `Successfully listed ${crops.length} ${crops.length === 1 ? 'donation' : 'donations'}. Organizations can now contact you for pickup.`,
                onConfirm: () => {
                    setAlert({ ...alert, visible: false });
                    // Reset form
                    setCrops([{
                        id: Date.now(),
                        productName: '',
                        quantity: '',
                        unit: 'kilograms',
                        description: '',
                        expiryDate: ''
                    }]);
                    setCommonData({
                        contactNumber: '',
                        pickupLocation: ''
                    });
                    setShowDonateModal(false);
                    loadTotalDonations();
                    loadDonations();
                }
            });
        } catch (error) {
            console.error('Error submitting donations:', error);
            setAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to submit donations. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('en-NP', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {
            return dateString;
        }
    };

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-NP', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'available':
                return '#4CAF50';
            case 'donated':
                return '#2196F3';
            case 'cancelled':
                return '#9E9E9E';
            default:
                return colors.textSecondary;
        }
    };

    const getUrgencyColor = (urgency) => {
        switch (urgency) {
            case 'high':
                return '#F44336';
            case 'medium':
                return '#FF9800';
            case 'low':
                return '#4CAF50';
            default:
                return colors.textSecondary;
        }
    };

    const handleDonateToRequest = (request) => {
        setAlert({
            visible: true,
            type: 'success',
            title: 'Donation Confirmed!',
            message: `You have committed to donate ${request.quantity} ${request.unit} of ${request.productName} to ${request.organizationName}. Please contact them at ${request.contactNumber} to arrange pickup.`,
        });
    };

    const dynamicStyles = getStyles(colors, isDark);

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
            <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={dynamicStyles.backButton}>
                    <Text style={[dynamicStyles.backButtonText, { color: colors.primary }]}>← Back</Text>
                </TouchableOpacity>
                <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Donate Crops</Text>
                <View style={dynamicStyles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={dynamicStyles.scrollView}>
                <View style={dynamicStyles.content}>
                    {/* Total Donations Card */}
                    <View style={[dynamicStyles.donationsCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                        <Text style={[dynamicStyles.donationsLabel, { color: colors.textSecondary }]}>Total Donations</Text>
                        <Text style={[dynamicStyles.donationsAmount, { color: colors.primary }]}>
                            {totalDonations} {totalDonations === 1 ? 'Donation' : 'Donations'}
                        </Text>
                    </View>

                    {/* Donate Button */}
                    <TouchableOpacity 
                        onPress={() => setShowDonateModal(true)}
                        style={[dynamicStyles.donateButton, { backgroundColor: colors.primary }]}
                    >
                        <Text style={dynamicStyles.donateButtonText}>+ Donate Crops</Text>
                    </TouchableOpacity>

                    {/* Donation Requests Section */}
                    <View style={[dynamicStyles.sectionHeader, { borderBottomColor: colors.border, marginTop: 20, marginBottom: 16 }]}>
                        <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Donation Requests</Text>
                        <Text style={[dynamicStyles.sectionSubtitle, { color: colors.textSecondary }]}>
                            Organizations looking for donations
                        </Text>
                    </View>

                    {donationRequests.length > 0 ? (
                        <View style={dynamicStyles.requestsList}>
                            {donationRequests.map((request) => (
                                <View key={request.id} style={[dynamicStyles.requestCard, { backgroundColor: colors.card }]}>
                                    <View style={dynamicStyles.requestHeader}>
                                        <View style={dynamicStyles.requestHeaderLeft}>
                                            <Text style={[dynamicStyles.requestOrgName, { color: colors.text }]}>
                                                {request.organizationName}
                                            </Text>
                                            <View style={[
                                                dynamicStyles.urgencyBadge,
                                                { backgroundColor: getUrgencyColor(request.urgency) + '20' }
                                            ]}>
                                                <Text style={[
                                                    dynamicStyles.urgencyText,
                                                    { color: getUrgencyColor(request.urgency) }
                                                ]}>
                                                    {request.urgency.toUpperCase()} PRIORITY
                                                </Text>
                                            </View>
                                        </View>
                                    </View>
                                    
                                    <View style={dynamicStyles.requestProductInfo}>
                                        <Text style={[dynamicStyles.requestProductName, { color: colors.text }]}>
                                            {request.productName}
                                        </Text>
                                        <Text style={[dynamicStyles.requestQuantity, { color: colors.textSecondary }]}>
                                            Needed: {request.quantity} {request.unit}
                                        </Text>
                                    </View>

                                    {request.description && (
                                        <Text style={[dynamicStyles.requestDescription, { color: colors.textSecondary }]}>
                                            {request.description}
                                        </Text>
                                    )}

                                    <View style={dynamicStyles.requestDetails}>
                                        <Text style={[dynamicStyles.requestDetail, { color: colors.textSecondary }]}>
                                            📍 {request.location}
                                        </Text>
                                        <Text style={[dynamicStyles.requestDetail, { color: colors.textSecondary }]}>
                                            📞 {request.contactNumber}
                                        </Text>
                                        <Text style={[dynamicStyles.requestDetail, { color: colors.textSecondary }]}>
                                            📅 Posted: {formatDate(request.postedDate)}
                                        </Text>
                                    </View>

                                    <TouchableOpacity
                                        onPress={() => handleDonateToRequest(request)}
                                        style={[dynamicStyles.donateToRequestButton, { backgroundColor: colors.primary }]}
                                    >
                                        <Text style={dynamicStyles.donateToRequestButtonText}>Donate to This Request</Text>
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={dynamicStyles.emptyContainer}>
                            <Text style={dynamicStyles.emptyIcon}>📋</Text>
                            <Text style={[dynamicStyles.emptyText, { color: colors.text }]}>
                                No donation requests available
                            </Text>
                        </View>
                    )}

                    {/* My Donations Section */}
                    <View style={[dynamicStyles.sectionHeader, { borderBottomColor: colors.border, marginTop: 32, marginBottom: 16 }]}>
                        <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>My Donations</Text>
                    </View>

                    {/* Donations List */}
                    {loadingDonations ? (
                        <View style={dynamicStyles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : donations.length > 0 ? (
                        <View style={dynamicStyles.donationsList}>
                            {donations.map((donation) => (
                                <View key={donation.id} style={[dynamicStyles.donationCard, { backgroundColor: colors.card }]}>
                                    <View style={dynamicStyles.donationHeader}>
                                        <Text style={[dynamicStyles.donationProductName, { color: colors.text }]}>
                                            {donation.product_name}
                                        </Text>
                                        <View style={[
                                            dynamicStyles.statusBadge,
                                            { backgroundColor: getStatusColor(donation.status) + '20' }
                                        ]}>
                                            <Text style={[
                                                dynamicStyles.statusText,
                                                { color: getStatusColor(donation.status) }
                                            ]}>
                                                {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[dynamicStyles.donationQuantity, { color: colors.textSecondary }]}>
                                        Quantity: {donation.quantity} {donation.unit}
                                    </Text>
                                    {donation.description && (
                                        <Text style={[dynamicStyles.donationDescription, { color: colors.textSecondary }]}>
                                            {donation.description}
                                        </Text>
                                    )}
                                    {donation.expiry_date && (
                                        <Text style={[dynamicStyles.donationExpiry, { color: colors.textSecondary }]}>
                                            Expires: {formatDate(donation.expiry_date)}
                                        </Text>
                                    )}
                                    {donation.pickup_location && (
                                        <Text style={[dynamicStyles.donationLocation, { color: colors.textSecondary }]}>
                                            📍 {donation.pickup_location}
                                        </Text>
                                    )}
                                    <Text style={[dynamicStyles.donationContact, { color: colors.textSecondary }]}>
                                        📞 {donation.contact_number}
                                    </Text>
                                    <Text style={[dynamicStyles.donationDate, { color: colors.textSecondary }]}>
                                        Listed: {formatDate(donation.created_at)}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    ) : (
                        <View style={dynamicStyles.emptyContainer}>
                            <Text style={dynamicStyles.emptyIcon}>🌾</Text>
                            <Text style={[dynamicStyles.emptyText, { color: colors.text }]}>
                                No donations yet
                            </Text>
                            <Text style={[dynamicStyles.emptySubtext, { color: colors.textSecondary }]}>
                                Help others by donating your crops
                            </Text>
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Donate Modal */}
            <Modal
                visible={showDonateModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => {
                    setShowDonateModal(false);
                    // Reset form when modal closes
                    setCrops([{
                        id: Date.now(),
                        productName: '',
                        quantity: '',
                        unit: 'kilograms',
                        description: '',
                        expiryDate: ''
                    }]);
                    setCommonData({
                        contactNumber: '',
                        pickupLocation: ''
                    });
                }}
            >
                <View style={dynamicStyles.modalOverlay}>
                    <View style={[dynamicStyles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={dynamicStyles.modalHeader}>
                            <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>Donate Crops</Text>
                            <TouchableOpacity 
                                onPress={() => {
                                    setShowDonateModal(false);
                                    // Reset form when modal closes
                                    setCrops([{
                                        id: Date.now(),
                                        productName: '',
                                        quantity: '',
                                        unit: 'kilograms',
                                        description: '',
                                        expiryDate: ''
                                    }]);
                                    setCommonData({
                                        contactNumber: '',
                                        pickupLocation: ''
                                    });
                                }}
                                style={dynamicStyles.closeButton}
                            >
                                <Text style={[dynamicStyles.closeButtonText, { color: colors.text }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            showsVerticalScrollIndicator={true} 
                            style={dynamicStyles.modalScrollView}
                            contentContainerStyle={dynamicStyles.modalScrollContent}
                        >
                            <View style={dynamicStyles.formContainer}>
                                {/* Common Fields */}
                                <View style={[dynamicStyles.sectionHeader, { borderBottomColor: colors.border }]}>
                                    <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Contact Information</Text>
                                </View>

                                {/* Contact Number */}
                                <View style={dynamicStyles.formGroup}>
                                    <Text style={[dynamicStyles.label, { color: colors.text }]}>Contact Number *</Text>
                                    <TextInput
                                        style={[dynamicStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                        value={commonData.contactNumber}
                                        onChangeText={(text) => setCommonData({ ...commonData, contactNumber: text })}
                                        placeholder="e.g., 9841234567"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="phone-pad"
                                    />
                                </View>

                                {/* Pickup Location */}
                                <View style={dynamicStyles.formGroup}>
                                    <Text style={[dynamicStyles.label, { color: colors.text }]}>Pickup Location (Optional)</Text>
                                    <TextInput
                                        style={[dynamicStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                        value={commonData.pickupLocation}
                                        onChangeText={(text) => setCommonData({ ...commonData, pickupLocation: text })}
                                        placeholder="Where can organizations pick up?"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>

                                {/* Crops Section */}
                                <View style={[dynamicStyles.sectionHeader, { borderBottomColor: colors.border, marginTop: 20 }]}>
                                    <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Crops to Donate</Text>
                                </View>

                                {crops.map((crop, index) => (
                                    <View key={crop.id} style={[dynamicStyles.cropCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        <View style={dynamicStyles.cropHeader}>
                                            <Text style={[dynamicStyles.cropNumber, { color: colors.text }]}>Crop {index + 1}</Text>
                                            {crops.length > 1 && (
                                                <TouchableOpacity 
                                                    onPress={() => removeCrop(crop.id)}
                                                    style={[dynamicStyles.removeButton, { backgroundColor: colors.error + '20' }]}
                                                >
                                                    <Text style={[dynamicStyles.removeButtonText, { color: colors.error }]}>Remove</Text>
                                                </TouchableOpacity>
                                            )}
                                        </View>

                                        {/* Product Name */}
                                        <View style={dynamicStyles.formGroup}>
                                            <Text style={[dynamicStyles.label, { color: colors.text }]}>Product Name *</Text>
                                            <TextInput
                                                style={[dynamicStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                                value={crop.productName}
                                                onChangeText={(text) => updateCrop(crop.id, 'productName', text)}
                                                placeholder="e.g., Tomatoes, Potatoes, Rice"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                        </View>

                                        {/* Quantity and Unit */}
                                        <View style={dynamicStyles.formRow}>
                                            <View style={[dynamicStyles.formGroup, { flex: 2, marginRight: 12, marginBottom: 0 }]}>
                                                <Text style={[dynamicStyles.label, { color: colors.text }]}>Quantity *</Text>
                                                <TextInput
                                                    style={[dynamicStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                                    value={crop.quantity}
                                                    onChangeText={(text) => updateCrop(crop.id, 'quantity', text.replace(/[^0-9.]/g, ''))}
                                                    placeholder="e.g., 50"
                                                    placeholderTextColor={colors.textSecondary}
                                                    keyboardType="numeric"
                                                />
                                            </View>
                                            <View style={[dynamicStyles.formGroup, { flex: 1, marginBottom: 0 }]}>
                                                <Text style={[dynamicStyles.label, { color: colors.text }]}>Unit *</Text>
                                                <TouchableOpacity 
                                                    style={[dynamicStyles.dropdown, { backgroundColor: colors.background, borderColor: colors.border }]}
                                                    onPress={() => setShowUnitDropdown(crop.id)}
                                                >
                                                    <Text style={[dynamicStyles.dropdownText, { color: colors.text }]}>{crop.unit}</Text>
                                                    <Text style={[dynamicStyles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
                                                </TouchableOpacity>
                                            </View>
                                        </View>

                                        {/* Description */}
                                        <View style={dynamicStyles.formGroup}>
                                            <Text style={[dynamicStyles.label, { color: colors.text }]}>Description</Text>
                                            <TextInput
                                                style={[dynamicStyles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                                value={crop.description}
                                                onChangeText={(text) => updateCrop(crop.id, 'description', text)}
                                                placeholder="Additional details (optional)"
                                                placeholderTextColor={colors.textSecondary}
                                                multiline
                                                numberOfLines={2}
                                            />
                                        </View>

                                        {/* Expiry Date */}
                                        <View style={dynamicStyles.formGroup}>
                                            <Text style={[dynamicStyles.label, { color: colors.text }]}>Expiry Date (Optional)</Text>
                                            <TextInput
                                                style={[dynamicStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                                value={crop.expiryDate}
                                                onChangeText={(text) => updateCrop(crop.id, 'expiryDate', text)}
                                                placeholder="YYYY-MM-DD (e.g., 2024-12-31)"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                        </View>
                                    </View>
                                ))}

                                {/* Add Another Crop Button */}
                                <TouchableOpacity
                                    onPress={addCrop}
                                    style={[dynamicStyles.addCropButton, { borderColor: colors.primary, borderWidth: 2 }]}
                                >
                                    <Text style={[dynamicStyles.addCropButtonText, { color: colors.primary }]}>+ Add Another Crop</Text>
                                </TouchableOpacity>

                                {/* Submit Button */}
                                <TouchableOpacity
                                    style={[dynamicStyles.submitButton, { backgroundColor: colors.primary }, loading && dynamicStyles.submitButtonDisabled]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={dynamicStyles.submitButtonText}>Submit {crops.length} {crops.length === 1 ? 'Donation' : 'Donations'}</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Unit Dropdown Modal */}
            <Modal
                visible={showUnitDropdown !== null}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowUnitDropdown(null)}
            >
                <TouchableOpacity 
                    style={dynamicStyles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowUnitDropdown(null)}
                >
                    <View style={[dynamicStyles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {units.map((unit) => {
                            const currentCrop = crops.find(c => c.id === showUnitDropdown);
                            const isSelected = currentCrop?.unit === unit;
                            return (
                                <TouchableOpacity
                                    key={unit}
                                    style={[
                                        dynamicStyles.dropdownItem,
                                        { 
                                            backgroundColor: isSelected ? colors.primary + '20' : 'transparent',
                                            borderBottomColor: colors.border,
                                        }
                                    ]}
                                    onPress={() => {
                                        if (showUnitDropdown) {
                                            updateCrop(showUnitDropdown, 'unit', unit);
                                        }
                                        setShowUnitDropdown(null);
                                    }}
                                >
                                    <Text style={[
                                        dynamicStyles.dropdownItemText,
                                        { 
                                            color: isSelected ? colors.primary : colors.text,
                                            fontWeight: isSelected ? '600' : '400',
                                        }
                                    ]}>
                                        {unit}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </TouchableOpacity>
            </Modal>

            <SweetAlert
                visible={alert.visible}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onConfirm={() => {
                    setAlert({ ...alert, visible: false });
                    if (alert.onConfirm) alert.onConfirm();
                }}
            />
        </SafeAreaView>
    );
};

const getStyles = (colors, isDark) => StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    backButton: {
        paddingVertical: 8,
        paddingRight: 12,
    },
    backButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        flex: 1,
        textAlign: 'center',
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
    donationsCard: {
        borderRadius: 12,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        alignItems: 'center',
    },
    donationsLabel: {
        fontSize: 14,
        marginBottom: 8,
    },
    donationsAmount: {
        fontSize: 32,
        fontWeight: '700',
    },
    donateButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
    },
    donateButtonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    donationsList: {
        gap: 16,
    },
    donationCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    donationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    donationProductName: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        marginRight: 12,
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    donationQuantity: {
        fontSize: 14,
        marginBottom: 4,
    },
    donationDescription: {
        fontSize: 14,
        marginTop: 8,
        marginBottom: 4,
    },
    donationExpiry: {
        fontSize: 13,
        marginTop: 4,
        fontStyle: 'italic',
    },
    donationLocation: {
        fontSize: 13,
        marginTop: 4,
    },
    donationContact: {
        fontSize: 13,
        marginTop: 4,
    },
    donationDate: {
        fontSize: 12,
        marginTop: 8,
        fontStyle: 'italic',
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
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: colors.card,
        borderRadius: 24,
        width: '90%',
        maxHeight: '90%',
        flexDirection: 'column',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.surface,
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        fontSize: 20,
        fontWeight: '600',
    },
    modalScrollView: {
        flex: 1,
    },
    modalScrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    formContainer: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    formRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    dropdown: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 16,
        fontWeight: '600',
    },
    dropdownArrow: {
        fontSize: 12,
        marginLeft: 8,
    },
    dropdownMenu: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        minWidth: 150,
        maxHeight: 300,
        alignSelf: 'center',
        marginTop: '50%',
    },
    dropdownItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    dropdownItemText: {
        fontSize: 16,
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    sectionHeader: {
        paddingBottom: 12,
        marginBottom: 16,
        borderBottomWidth: 2,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    cropCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    cropHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cropNumber: {
        fontSize: 16,
        fontWeight: '700',
    },
    removeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    removeButtonText: {
        fontSize: 12,
        fontWeight: '600',
    },
    addCropButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
        marginTop: 8,
    },
    addCropButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    sectionSubtitle: {
        fontSize: 12,
        marginTop: 4,
    },
    requestsList: {
        gap: 16,
        marginBottom: 8,
    },
    requestCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: colors.border,
    },
    requestHeader: {
        marginBottom: 12,
    },
    requestHeaderLeft: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    requestOrgName: {
        fontSize: 18,
        fontWeight: '700',
        flex: 1,
        marginRight: 12,
    },
    urgencyBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    urgencyText: {
        fontSize: 10,
        fontWeight: '700',
    },
    requestProductInfo: {
        marginBottom: 8,
    },
    requestProductName: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    requestQuantity: {
        fontSize: 14,
    },
    requestDescription: {
        fontSize: 14,
        marginTop: 8,
        marginBottom: 12,
        lineHeight: 20,
    },
    requestDetails: {
        marginTop: 8,
        marginBottom: 12,
    },
    requestDetail: {
        fontSize: 13,
        marginBottom: 4,
    },
    donateToRequestButton: {
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 8,
    },
    donateToRequestButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default DonateCropsScreen;

