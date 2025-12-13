import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Modal, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import { supabase } from '../../config/supabase';

const FarmerCropCalendarScreen = ({ onNavigateBack }) => {
    const router = useRouter();

    useEffect(() => {
        const backAction = () => {
            if (onNavigateBack) {
                onNavigateBack();
            } else {
                router.back();
            }
            return true; // Prevent default back behavior
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [onNavigateBack]);
    const { colors, isDark } = useTheme();
    const dynamicStyles = getStyles(colors, isDark);
    const [loading, setLoading] = useState(true);
    const [cropCalendar, setCropCalendar] = useState([]);
    const [rotationSuggestions, setRotationSuggestions] = useState([]);
    const [selectedCrop, setSelectedCrop] = useState(null);
    const [selectedRotation, setSelectedRotation] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [showRotationModal, setShowRotationModal] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonth = new Date().getMonth() + 1;

    useEffect(() => {
        loadCropCalendar();
        loadRotationSuggestions();
    }, []);

    const loadCropCalendar = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('crop_calendar')
                .select('*')
                .order('crop_name');

            if (error) throw error;
            setCropCalendar(data || []);
        } catch (error) {
            console.error('Error loading crop calendar:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadRotationSuggestions = async () => {
        try {
            const { data, error } = await supabase
                .from('crop_rotation_suggestions')
                .select('*')
                .order('crop_name');

            if (error) throw error;
            setRotationSuggestions(data || []);
        } catch (error) {
            console.error('Error loading rotation suggestions:', error);
        }
    };

    const isInSeason = (startMonth, endMonth) => {
        if (startMonth <= endMonth) {
            return currentMonth >= startMonth && currentMonth <= endMonth;
        } else {
            // Season spans across year (e.g., Nov to Feb)
            return currentMonth >= startMonth || currentMonth <= endMonth;
        }
    };

    const getMonthRange = (start, end) => {
        if (start <= end) {
            return months.slice(start - 1, end).join(', ');
        } else {
            return months.slice(start - 1).concat(months.slice(0, end)).join(', ');
        }
    };

    const filteredCrops = cropCalendar.filter(crop =>
        crop.crop_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        crop.category.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const handleCropPress = (crop) => {
        setSelectedCrop(crop);
        setShowCropModal(true);
    };

    const handleRotationPress = (rotation) => {
        setSelectedRotation(rotation);
        setShowRotationModal(true);
    };

    if (loading) {
        return (
            <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
                <View style={dynamicStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[dynamicStyles.loadingText, { color: colors.textSecondary }]}>
                        Loading crop calendar...
                    </Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
            <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
                <TouchableOpacity 
                    onPress={() => {
                        if (onNavigateBack) {
                            onNavigateBack();
                        } else {
                            router.back();
                        }
                    }}
                    style={dynamicStyles.backButton}
                >
                    <Text style={[dynamicStyles.backButtonText, { color: colors.primary }]}>← Back</Text>
                </TouchableOpacity>
                <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Crop Calendar</Text>
                <View style={dynamicStyles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={dynamicStyles.content}>
                    {/* Search Bar */}
                    <View style={[dynamicStyles.searchContainer, { backgroundColor: colors.surface }]}>
                        <Text style={dynamicStyles.searchIcon}>🔍</Text>
                        <Text
                            style={[dynamicStyles.searchInput, { color: colors.text }]}
                            onPress={() => {/* Implement search */}}
                        >
                            {searchQuery || 'Search crops...'}
                        </Text>
                    </View>

                    {/* Current Season Crops */}
                    <View style={dynamicStyles.section}>
                        <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
                            🌱 Currently in Season
                        </Text>
                        {filteredCrops
                            .filter(crop => isInSeason(crop.planting_season_start, crop.planting_season_end))
                            .map((crop) => (
                                <TouchableOpacity
                                    key={crop.id}
                                    style={[dynamicStyles.cropCard, { backgroundColor: colors.card }]}
                                    onPress={() => handleCropPress(crop)}
                                >
                                    <View style={dynamicStyles.cropHeader}>
                                        <Text style={[dynamicStyles.cropName, { color: colors.text }]}>
                                            {crop.crop_name}
                                        </Text>
                                        <View style={[dynamicStyles.seasonBadge, { backgroundColor: '#4CAF50' + '20' }]}>
                                            <Text style={[dynamicStyles.seasonBadgeText, { color: '#4CAF50' }]}>
                                                In Season
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={[dynamicStyles.cropCategory, { color: colors.textSecondary }]}>
                                        {crop.category}
                                    </Text>
                                    <View style={dynamicStyles.cropInfo}>
                                        <View style={dynamicStyles.infoItem}>
                                            <Text style={dynamicStyles.infoIcon}>🌱</Text>
                                            <Text style={[dynamicStyles.infoText, { color: colors.textSecondary }]}>
                                                Planting: {getMonthRange(crop.planting_season_start, crop.planting_season_end)}
                                            </Text>
                                        </View>
                                        <View style={dynamicStyles.infoItem}>
                                            <Text style={dynamicStyles.infoIcon}>🌾</Text>
                                            <Text style={[dynamicStyles.infoText, { color: colors.textSecondary }]}>
                                                Harvest: {getMonthRange(crop.harvesting_season_start, crop.harvesting_season_end)}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            ))}
                    </View>

                    {/* All Crops */}
                    <View style={dynamicStyles.section}>
                        <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
                            📅 All Crops
                        </Text>
                        {filteredCrops.map((crop) => {
                            const inPlantingSeason = isInSeason(crop.planting_season_start, crop.planting_season_end);
                            const inHarvestSeason = isInSeason(crop.harvesting_season_start, crop.harvesting_season_end);
                            
                            return (
                                <TouchableOpacity
                                    key={crop.id}
                                    style={[dynamicStyles.cropCard, { backgroundColor: colors.card }]}
                                    onPress={() => handleCropPress(crop)}
                                >
                                    <View style={dynamicStyles.cropHeader}>
                                        <Text style={[dynamicStyles.cropName, { color: colors.text }]}>
                                            {crop.crop_name}
                                        </Text>
                                        {inPlantingSeason && (
                                            <View style={[dynamicStyles.seasonBadge, { backgroundColor: '#2196F3' + '20' }]}>
                                                <Text style={[dynamicStyles.seasonBadgeText, { color: '#2196F3' }]}>
                                                    Plant Now
                                                </Text>
                                            </View>
                                        )}
                                        {inHarvestSeason && !inPlantingSeason && (
                                            <View style={[dynamicStyles.seasonBadge, { backgroundColor: '#FF9800' + '20' }]}>
                                                <Text style={[dynamicStyles.seasonBadgeText, { color: '#FF9800' }]}>
                                                    Harvest Now
                                                </Text>
                                            </View>
                                        )}
                                    </View>
                                    <Text style={[dynamicStyles.cropCategory, { color: colors.textSecondary }]}>
                                        {crop.category}
                                    </Text>
                                    <View style={dynamicStyles.cropInfo}>
                                        <View style={dynamicStyles.infoItem}>
                                            <Text style={dynamicStyles.infoIcon}>🌱</Text>
                                            <Text style={[dynamicStyles.infoText, { color: colors.textSecondary }]}>
                                                Planting: {getMonthRange(crop.planting_season_start, crop.planting_season_end)}
                                            </Text>
                                        </View>
                                        <View style={dynamicStyles.infoItem}>
                                            <Text style={dynamicStyles.infoIcon}>🌾</Text>
                                            <Text style={[dynamicStyles.infoText, { color: colors.textSecondary }]}>
                                                Harvest: {getMonthRange(crop.harvesting_season_start, crop.harvesting_season_end)}
                                            </Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}
                    </View>

                    {/* Crop Rotation Suggestions */}
                    <View style={dynamicStyles.section}>
                        <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>
                            🔄 Crop Rotation Suggestions
                        </Text>
                        {rotationSuggestions.map((rotation) => (
                            <TouchableOpacity
                                key={rotation.id}
                                style={[dynamicStyles.rotationCard, { backgroundColor: colors.card }]}
                                onPress={() => handleRotationPress(rotation)}
                            >
                                <Text style={[dynamicStyles.rotationCropName, { color: colors.text }]}>
                                    {rotation.crop_name}
                                </Text>
                                <Text style={[dynamicStyles.rotationText, { color: colors.textSecondary }]}>
                                    Recommended next: {rotation.recommended_next_crops?.join(', ') || 'N/A'}
                                </Text>
                                {rotation.rotation_benefits && (
                                    <Text style={[dynamicStyles.rotationBenefits, { color: colors.textSecondary }]}>
                                        {rotation.rotation_benefits}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Crop Detail Modal */}
            <Modal
                visible={showCropModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCropModal(false)}
            >
                <View style={dynamicStyles.modalOverlay}>
                    <View style={[dynamicStyles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={dynamicStyles.modalHeader}>
                            <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>
                                {selectedCrop?.crop_name}
                            </Text>
                            <TouchableOpacity onPress={() => setShowCropModal(false)}>
                                <Text style={[dynamicStyles.closeButton, { color: colors.text }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {selectedCrop && (
                                <View style={dynamicStyles.modalBody}>
                                    <View style={[dynamicStyles.detailRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Category</Text>
                                        <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                            {selectedCrop.category}
                                        </Text>
                                    </View>
                                    <View style={[dynamicStyles.detailRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Planting Season</Text>
                                        <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                            {getMonthRange(selectedCrop.planting_season_start, selectedCrop.planting_season_end)}
                                        </Text>
                                    </View>
                                    <View style={[dynamicStyles.detailRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Harvesting Season</Text>
                                        <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                            {getMonthRange(selectedCrop.harvesting_season_start, selectedCrop.harvesting_season_end)}
                                        </Text>
                                    </View>
                                    {selectedCrop.growing_period_days && (
                                        <View style={[dynamicStyles.detailRow, { borderBottomColor: colors.border }]}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Growing Period</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {selectedCrop.growing_period_days} days
                                            </Text>
                                        </View>
                                    )}
                                    {selectedCrop.best_climate && (
                                        <View style={[dynamicStyles.detailRow, { borderBottomColor: colors.border }]}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Best Climate</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {selectedCrop.best_climate}
                                            </Text>
                                        </View>
                                    )}
                                    {selectedCrop.soil_type && (
                                        <View style={[dynamicStyles.detailRow, { borderBottomColor: colors.border }]}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Soil Type</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {selectedCrop.soil_type}
                                            </Text>
                                        </View>
                                    )}
                                    {selectedCrop.water_requirements && (
                                        <View style={[dynamicStyles.detailRow, { borderBottomColor: colors.border }]}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Water Requirements</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {selectedCrop.water_requirements}
                                            </Text>
                                        </View>
                                    )}
                                    {selectedCrop.description && (
                                        <View style={dynamicStyles.detailRow}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Description</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {selectedCrop.description}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Rotation Detail Modal */}
            <Modal
                visible={showRotationModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowRotationModal(false)}
            >
                <View style={dynamicStyles.modalOverlay}>
                    <View style={[dynamicStyles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={dynamicStyles.modalHeader}>
                            <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>
                                Crop Rotation: {selectedRotation?.crop_name}
                            </Text>
                            <TouchableOpacity onPress={() => setShowRotationModal(false)}>
                                <Text style={[dynamicStyles.closeButton, { color: colors.text }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView>
                            {selectedRotation && (
                                <View style={dynamicStyles.modalBody}>
                                    <View style={[dynamicStyles.detailRow, { borderBottomColor: colors.border }]}>
                                        <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Recommended Next Crops</Text>
                                        <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                            {selectedRotation.recommended_next_crops?.join(', ') || 'N/A'}
                                        </Text>
                                    </View>
                                    {selectedRotation.avoid_next_crops && selectedRotation.avoid_next_crops.length > 0 && (
                                        <View style={[dynamicStyles.detailRow, { borderBottomColor: colors.border }]}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Avoid Next Crops</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {selectedRotation.avoid_next_crops.join(', ')}
                                            </Text>
                                        </View>
                                    )}
                                    {selectedRotation.rotation_benefits && (
                                        <View style={dynamicStyles.detailRow}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Benefits</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {selectedRotation.rotation_benefits}
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    content: {
        padding: 20,
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        marginBottom: 24,
    },
    searchIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    cropCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    cropHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    cropName: {
        fontSize: 18,
        fontWeight: '600',
        flex: 1,
    },
    seasonBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    seasonBadgeText: {
        fontSize: 12,
        fontWeight: '600',
    },
    cropCategory: {
        fontSize: 14,
        marginBottom: 12,
        textTransform: 'capitalize',
    },
    cropInfo: {
        gap: 8,
    },
    infoItem: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    infoIcon: {
        fontSize: 16,
        marginRight: 8,
    },
    infoText: {
        fontSize: 14,
    },
    rotationCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    rotationCropName: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
    },
    rotationText: {
        fontSize: 14,
        marginBottom: 4,
    },
    rotationBenefits: {
        fontSize: 13,
        fontStyle: 'italic',
        marginTop: 8,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '90%',
        paddingBottom: 20,
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
        fontSize: 24,
        fontWeight: '600',
    },
    modalBody: {
        padding: 20,
    },
    detailRow: {
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    detailLabel: {
        fontSize: 14,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FarmerCropCalendarScreen;

