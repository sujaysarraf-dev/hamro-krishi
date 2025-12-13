import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../config/supabase';
import SweetAlert from '../../components/SweetAlert';

const SellRawMaterialsScreen = () => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [formData, setFormData] = useState({
        productName: '',
        quantity: '',
        unit: 'kilograms',
        description: '',
        contactNumber: ''
    });
    const [estimatedPrice, setEstimatedPrice] = useState(null);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [loadingRevenue, setLoadingRevenue] = useState(true);
    const [loadingSales, setLoadingSales] = useState(true);
    const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });
    const [showUnitDropdown, setShowUnitDropdown] = useState(false);
    const [showSellModal, setShowSellModal] = useState(false);
    const [sales, setSales] = useState([]);

    const units = ['kilograms', 'quintals', 'tons', 'liters', 'pieces'];

    useEffect(() => {
        loadTotalRevenue();
        loadSales();
        if (showSellModal) {
            calculateEstimatedPrice();
        }
    }, [formData.quantity, formData.unit, formData.productName, showSellModal]);

    const loadTotalRevenue = async () => {
        try {
            setLoadingRevenue(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('raw_material_sales')
                .select('estimated_price')
                .eq('user_id', user.id)
                .eq('status', 'sold');

            if (error) {
                console.error('Error loading revenue:', error);
                return;
            }

            const revenue = data?.reduce((sum, sale) => sum + (parseFloat(sale.estimated_price) || 0), 0) || 0;
            setTotalRevenue(revenue);
        } catch (error) {
            console.error('Error loading revenue:', error);
        } finally {
            setLoadingRevenue(false);
        }
    };

    const loadSales = async () => {
        try {
            setLoadingSales(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('raw_material_sales')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading sales:', error);
                return;
            }

            setSales(data || []);
        } catch (error) {
            console.error('Error loading sales:', error);
        } finally {
            setLoadingSales(false);
        }
    };

    const calculateEstimatedPrice = () => {
        if (!formData.quantity || !formData.productName) {
            setEstimatedPrice(null);
            return;
        }

        const quantity = parseFloat(formData.quantity);
        if (isNaN(quantity) || quantity <= 0) {
            setEstimatedPrice(null);
            return;
        }

        // Generate a random price estimate based on quantity and unit
        // Base price per unit (in NPR)
        const basePrices = {
            'kilograms': 50,
            'quintals': 5000,
            'tons': 50000,
            'liters': 40,
            'pieces': 20
        };

        const basePrice = basePrices[formData.unit] || 50;
        // Random multiplier between 0.8 and 1.5 for variation
        const multiplier = 0.8 + Math.random() * 0.7;
        const estimated = Math.round(quantity * basePrice * multiplier);

        setEstimatedPrice(estimated);
    };

    const handleSubmit = async () => {
        if (!formData.productName.trim()) {
            setAlert({
                visible: true,
                type: 'warning',
                title: 'Validation Error',
                message: 'Please enter product name.'
            });
            return;
        }

        if (!formData.quantity || parseFloat(formData.quantity) <= 0) {
            setAlert({
                visible: true,
                type: 'warning',
                title: 'Validation Error',
                message: 'Please enter a valid quantity.'
            });
            return;
        }

        if (!formData.contactNumber.trim()) {
            setAlert({
                visible: true,
                type: 'warning',
                title: 'Validation Error',
                message: 'Please enter your contact number.'
            });
            return;
        }

        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            const { error } = await supabase
                .from('raw_material_sales')
                .insert({
                    user_id: user.id,
                    product_name: formData.productName.trim(),
                    quantity: parseFloat(formData.quantity),
                    unit: formData.unit,
                    description: formData.description.trim() || null,
                    contact_number: formData.contactNumber.trim(),
                    estimated_price: estimatedPrice,
                    status: 'sold'
                });

            if (error) {
                console.error('Error submitting sale:', error);
                throw error;
            }

            setAlert({
                visible: true,
                type: 'success',
                title: 'Submitted Successfully!',
                message: `Your raw material listing has been submitted. Estimated price: NPR ${estimatedPrice?.toLocaleString('en-NP') || 'N/A'}`,
                onConfirm: () => {
                    setAlert({ ...alert, visible: false });
                    // Reset form
                    setFormData({
                        productName: '',
                        quantity: '',
                        unit: 'kilograms',
                        description: '',
                        contactNumber: ''
                    });
                    setEstimatedPrice(null);
                    setShowSellModal(false);
                    loadTotalRevenue();
                    loadSales();
                }
            });
        } catch (error) {
            console.error('Error submitting sale:', error);
            setAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to submit. Please try again.'
            });
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

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'sold':
                return '#10B981';
            case 'pending':
                return '#F59E0B';
            case 'cancelled':
                return '#EF4444';
            default:
                return colors.textSecondary;
        }
    };

    const dynamicStyles = getStyles(colors, isDark);

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
            <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={() => router.back()} style={dynamicStyles.backButton}>
                    <Text style={[dynamicStyles.backButtonText, { color: colors.primary }]}>← Back</Text>
                </TouchableOpacity>
                <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Sell Raw Materials</Text>
                <View style={dynamicStyles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={dynamicStyles.scrollView}>
                <View style={dynamicStyles.content}>
                    {/* Total Revenue Card */}
                    <View style={[dynamicStyles.revenueCard, { backgroundColor: colors.primary + '15', borderColor: colors.primary + '30' }]}>
                        <Text style={[dynamicStyles.revenueLabel, { color: colors.textSecondary }]}>Total Revenue</Text>
                        {loadingRevenue ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <Text style={[dynamicStyles.revenueAmount, { color: colors.primary }]}>
                                NPR {formatPrice(totalRevenue)}
                            </Text>
                        )}
                    </View>

                    {/* Sell Button */}
                    <TouchableOpacity 
                        onPress={() => setShowSellModal(true)}
                        style={[dynamicStyles.sellButton, { backgroundColor: colors.primary }]}
                    >
                        <Text style={dynamicStyles.sellButtonText}>+ Sell Raw Materials</Text>
                    </TouchableOpacity>

                    {/* Sales List */}
                    {loadingSales ? (
                        <View style={dynamicStyles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : sales.length === 0 ? (
                        <View style={dynamicStyles.emptyContainer}>
                            <Text style={dynamicStyles.emptyIcon}>📦</Text>
                            <Text style={[dynamicStyles.emptyText, { color: colors.text }]}>No sales yet</Text>
                            <Text style={[dynamicStyles.emptySubtext, { color: colors.textSecondary }]}>Tap "+ Sell" to add your first listing</Text>
                        </View>
                    ) : (
                        <View style={dynamicStyles.salesList}>
                            {sales.map((sale) => (
                                <View key={sale.id} style={[dynamicStyles.saleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                    <View style={dynamicStyles.saleHeader}>
                                        <View style={dynamicStyles.saleHeaderLeft}>
                                            <Text style={[dynamicStyles.saleProductName, { color: colors.text }]}>
                                                {sale.product_name}
                                            </Text>
                                            <Text style={[dynamicStyles.saleDate, { color: colors.textSecondary }]}>
                                                {formatDate(sale.created_at)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={dynamicStyles.saleDetails}>
                                        <Text style={[dynamicStyles.saleDetailText, { color: colors.textSecondary }]}>
                                            Quantity: {sale.quantity} {sale.unit}
                                        </Text>
                                        {sale.description && (
                                            <Text style={[dynamicStyles.saleDescription, { color: colors.textSecondary }]}>
                                                {sale.description}
                                            </Text>
                                        )}
                                        <Text style={[dynamicStyles.saleContact, { color: colors.textSecondary }]}>
                                            Contact: {sale.contact_number}
                                        </Text>
                                    </View>
                                    <View style={[dynamicStyles.saleFooter, { borderTopColor: colors.border }]}>
                                        <Text style={[dynamicStyles.salePriceLabel, { color: colors.text }]}>Estimated Price:</Text>
                                        <Text style={[dynamicStyles.salePrice, { color: colors.primary }]}>
                                            NPR {formatPrice(sale.estimated_price)}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>

            {/* Sell Modal */}
            <Modal
                visible={showSellModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowSellModal(false)}
            >
                <SafeAreaView style={dynamicStyles.modalContainer}>
                    <View style={[dynamicStyles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={[dynamicStyles.modalHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>Add New Sale</Text>
                            <TouchableOpacity onPress={() => {
                                setShowSellModal(false);
                                setFormData({
                                    productName: '',
                                    quantity: '',
                                    unit: 'kilograms',
                                    description: '',
                                    contactNumber: ''
                                });
                                setEstimatedPrice(null);
                            }}>
                                <Text style={[dynamicStyles.modalClose, { color: colors.textSecondary }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView 
                            style={dynamicStyles.modalScrollView}
                            contentContainerStyle={dynamicStyles.modalScrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            {/* Form */}
                            <View style={dynamicStyles.formSection}>
                        <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Product Details</Text>

                        <View style={dynamicStyles.inputGroup}>
                            <Text style={[dynamicStyles.label, { color: colors.text }]}>Product Name *</Text>
                            <TextInput
                                style={[dynamicStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                placeholder="e.g., Rice Husk, Wheat Straw"
                                placeholderTextColor={colors.textSecondary}
                                value={formData.productName}
                                onChangeText={(text) => setFormData({ ...formData, productName: text })}
                            />
                        </View>

                        <View style={dynamicStyles.row}>
                            <View style={[dynamicStyles.inputGroup, { flex: 1, marginRight: 8 }]}>
                                <Text style={[dynamicStyles.label, { color: colors.text }]}>Quantity *</Text>
                                <TextInput
                                    style={[dynamicStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                    placeholder="0"
                                    placeholderTextColor={colors.textSecondary}
                                    value={formData.quantity}
                                    onChangeText={(text) => setFormData({ ...formData, quantity: text })}
                                    keyboardType="numeric"
                                />
                            </View>

                            <View style={[dynamicStyles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                                <Text style={[dynamicStyles.label, { color: colors.text }]}>Unit *</Text>
                                <TouchableOpacity
                                    style={[dynamicStyles.dropdownButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                    onPress={() => setShowUnitDropdown(true)}
                                >
                                    <Text style={[dynamicStyles.dropdownButtonText, { color: colors.text }]}>
                                        {formData.unit.charAt(0).toUpperCase() + formData.unit.slice(1)}
                                    </Text>
                                    <Text style={[dynamicStyles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <View style={dynamicStyles.inputGroup}>
                            <Text style={[dynamicStyles.label, { color: colors.text }]}>Description</Text>
                            <TextInput
                                style={[dynamicStyles.textArea, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                placeholder="Additional details about the raw material..."
                                placeholderTextColor={colors.textSecondary}
                                value={formData.description}
                                onChangeText={(text) => setFormData({ ...formData, description: text })}
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </View>

                        <View style={dynamicStyles.inputGroup}>
                            <Text style={[dynamicStyles.label, { color: colors.text }]}>Contact Number *</Text>
                            <TextInput
                                style={[dynamicStyles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                                placeholder="98XXXXXXXX"
                                placeholderTextColor={colors.textSecondary}
                                value={formData.contactNumber}
                                onChangeText={(text) => setFormData({ ...formData, contactNumber: text })}
                                keyboardType="phone-pad"
                            />
                        </View>

                        {/* Estimated Price Display */}
                        {estimatedPrice && (
                            <View style={[dynamicStyles.priceCard, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '30' }]}>
                                <Text style={[dynamicStyles.priceLabel, { color: colors.textSecondary }]}>
                                    Your product would be sold at approximately:
                                </Text>
                                <Text style={[dynamicStyles.priceAmount, { color: colors.primary }]}>
                                    NPR {formatPrice(estimatedPrice)}
                                </Text>
                            </View>
                        )}

                        <TouchableOpacity
                            style={[dynamicStyles.submitButton, { backgroundColor: colors.primary }, loading && dynamicStyles.submitButtonDisabled]}
                            onPress={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? (
                                <ActivityIndicator color="#FFFFFF" />
                            ) : (
                                <Text style={dynamicStyles.submitButtonText}>Submit for Sale</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                        </ScrollView>
                    </View>
                </SafeAreaView>
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

            {/* Unit Dropdown Modal */}
            <Modal
                visible={showUnitDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowUnitDropdown(false)}
            >
                <TouchableOpacity
                    style={dynamicStyles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowUnitDropdown(false)}
                >
                    <View style={[dynamicStyles.dropdownModal, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <View style={[dynamicStyles.dropdownHeader, { borderBottomColor: colors.border }]}>
                            <Text style={[dynamicStyles.dropdownTitle, { color: colors.text }]}>Select Unit</Text>
                            <TouchableOpacity onPress={() => setShowUnitDropdown(false)}>
                                <Text style={[dynamicStyles.dropdownClose, { color: colors.textSecondary }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView style={dynamicStyles.dropdownList}>
                            {units.map((unit) => (
                                <TouchableOpacity
                                    key={unit}
                                    style={[
                                        dynamicStyles.dropdownItem,
                                        {
                                            backgroundColor: formData.unit === unit ? colors.primary + '20' : 'transparent',
                                            borderBottomColor: colors.border
                                        }
                                    ]}
                                    onPress={() => {
                                        setFormData({ ...formData, unit });
                                        setShowUnitDropdown(false);
                                    }}
                                >
                                    <Text style={[
                                        dynamicStyles.dropdownItemText,
                                        {
                                            color: formData.unit === unit ? colors.primary : colors.text,
                                            fontWeight: formData.unit === unit ? '700' : '400'
                                        }
                                    ]}>
                                        {unit.charAt(0).toUpperCase() + unit.slice(1)}
                                    </Text>
                                    {formData.unit === unit && (
                                        <Text style={[dynamicStyles.dropdownCheckmark, { color: colors.primary }]}>✓</Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </TouchableOpacity>
            </Modal>
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
    sellButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    sellButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    loadingContainer: {
        paddingVertical: 40,
        alignItems: 'center',
    },
    emptyContainer: {
        paddingVertical: 60,
        alignItems: 'center',
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
    },
    salesList: {
        marginTop: 8,
    },
    saleCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
    },
    saleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    saleHeaderLeft: {
        flex: 1,
    },
    saleProductName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    saleDate: {
        fontSize: 12,
    },
    saleStatusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    saleStatusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    saleDetails: {
        marginBottom: 12,
    },
    saleDetailText: {
        fontSize: 14,
        marginBottom: 4,
    },
    saleDescription: {
        fontSize: 14,
        marginTop: 8,
        fontStyle: 'italic',
    },
    saleContact: {
        fontSize: 14,
        marginTop: 4,
    },
    saleFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
    },
    salePriceLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    salePrice: {
        fontSize: 18,
        fontWeight: '700',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        maxHeight: '90%',
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    modalClose: {
        fontSize: 24,
    },
    modalScrollView: {
        flex: 1,
    },
    modalScrollContent: {
        padding: 20,
        paddingBottom: 40,
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    revenueCard: {
        padding: 20,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 24,
        alignItems: 'center',
    },
    revenueLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    revenueAmount: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.primary,
    },
    formSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.text,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontSize: 16,
        color: colors.text,
        minHeight: 100,
    },
    row: {
        flexDirection: 'row',
    },
    dropdownButton: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 8,
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    dropdownButtonText: {
        fontSize: 16,
        color: colors.text,
    },
    dropdownArrow: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    dropdownModal: {
        width: '80%',
        maxHeight: '60%',
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
    },
    dropdownHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    dropdownTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    dropdownClose: {
        fontSize: 24,
        color: colors.textSecondary,
    },
    dropdownList: {
        maxHeight: 300,
    },
    dropdownItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    dropdownItemText: {
        fontSize: 16,
        color: colors.text,
    },
    dropdownCheckmark: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    priceCard: {
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        marginBottom: 20,
        alignItems: 'center',
    },
    priceLabel: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: 8,
        textAlign: 'center',
    },
    priceAmount: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.primary,
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
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
});

export default SellRawMaterialsScreen;

