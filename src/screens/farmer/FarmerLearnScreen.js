import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, BackHandler, Modal, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FarmerLearnScreen = ({ onNavigateBack }) => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [selectedCrop, setSelectedCrop] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);

    useEffect(() => {
        const backAction = () => {
            if (onNavigateBack) {
                onNavigateBack();
            } else {
                router.back();
            }
            return true;
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, [onNavigateBack, router]);

    useEffect(() => {
        // Reset video state when modal opens
        if (showCropModal && selectedCrop?.hasVideo) {
            setVideoError(false);
            setVideoLoading(true);
        }
        
        // Cleanup video when modal closes
        return () => {
            if (!showCropModal && videoRef.current) {
                videoRef.current.unloadAsync().catch(() => {});
            }
        };
    }, [showCropModal, selectedCrop]);

    const videoRef = useRef(null);
    const [videoStatus, setVideoStatus] = useState({});
    const [videoError, setVideoError] = useState(false);
    const [videoLoading, setVideoLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    const crops = [
        {
            id: 1,
            name: 'Rice',
            icon: '🌾',
            description: 'Learn comprehensive rice farming techniques',
            hasVideo: true,
            videoPath: require('../../../assets/videos/Rice_Harvesting_and_Planting_Video.mp4'),
            facts: [
                'Rice is the staple food for more than half of the world\'s population',
                'Nepal produces over 5 million tons of rice annually',
                'Rice cultivation dates back over 10,000 years',
                'There are more than 40,000 varieties of rice worldwide',
                'Rice fields can store carbon and help reduce greenhouse gases',
                'Rice provides 20% of the world\'s dietary energy supply'
            ],
            images: [
                { uri: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?w=800', title: 'Rice Field' },
                { uri: 'https://images.unsplash.com/photo-1593113598332-cd288d649433?w=800', title: 'Rice Planting' },
                { uri: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?w=800', title: 'Rice Harvesting' }
            ],
            topics: [
                {
                    title: 'Soil Preparation',
                    content: 'Rice requires well-leveled fields with good water retention. Prepare the soil by plowing and leveling. Maintain a pH between 6.0-7.0. Add organic matter and ensure proper drainage.',
                    steps: [
                        'Plow the field 2-3 times to break up soil clods',
                        'Level the field using a leveler to ensure uniform water depth',
                        'Apply 10-15 tons of well-decomposed farmyard manure per hectare',
                        'Test soil pH and adjust if necessary (lime for acidic, sulfur for alkaline)',
                        'Create bunds (small dikes) around the field to hold water',
                        'Allow the field to settle for 2-3 days before transplanting'
                    ]
                },
                {
                    title: 'Seed Selection & Sowing',
                    content: 'Choose high-yielding, disease-resistant varieties suitable for your region. Soak seeds for 24 hours before sowing. Use 20-25 kg seeds per hectare. Transplant seedlings when they are 20-25 days old.',
                    steps: [
                        'Select certified seeds from reliable sources',
                        'Choose varieties based on your region\'s climate and soil type',
                        'Soak seeds in water for 24 hours to break dormancy',
                        'Prepare nursery bed: 1/10th of main field area',
                        'Sow seeds at 1-2 cm depth in rows 10 cm apart',
                        'Cover with thin layer of soil and keep moist',
                        'Transplant when seedlings are 20-25 days old with 4-5 leaves',
                        'Transplant 2-3 seedlings per hill at 20x20 cm spacing'
                    ]
                },
                {
                    title: 'Water Management',
                    content: 'Maintain 5-7 cm water depth during vegetative stage. Reduce water during flowering. Drain fields 2 weeks before harvest. Use alternate wetting and drying to save water.',
                    steps: [
                        'Maintain 5-7 cm water depth during vegetative growth stage',
                        'Reduce water to 2-3 cm during flowering stage',
                        'Use alternate wetting and drying (AWD) method to save 15-30% water',
                        'Drain field completely 2 weeks before harvest',
                        'Monitor water level daily and adjust as needed',
                        'Avoid water stress during critical stages: tillering, panicle initiation, flowering'
                    ]
                },
                {
                    title: 'Fertilizer Application',
                    content: 'Apply NPK (120:60:60 kg/ha) in split doses. Use organic fertilizers like compost and farmyard manure. Apply nitrogen in 3 splits: basal, tillering, and panicle initiation stages.',
                    steps: [
                        'Apply basal dose: 50% N + 100% P + 100% K at transplanting',
                        'First top dressing: 25% N at 20-25 days after transplanting (tillering stage)',
                        'Second top dressing: 25% N at 45-50 days (panicle initiation stage)',
                        'Use organic fertilizers: compost, farmyard manure, green manure',
                        'Apply micronutrients (Zn, Fe) if deficiency symptoms appear',
                        'Test soil every 2-3 years to adjust fertilizer recommendations'
                    ]
                },
                {
                    title: 'Pest & Disease Control',
                    content: 'Common pests: stem borers, leaf folders, brown planthoppers. Use integrated pest management. Common diseases: blast, bacterial blight, sheath blight. Use resistant varieties and proper spacing.',
                    steps: [
                        'Use resistant varieties to reduce pest and disease incidence',
                        'Practice crop rotation to break pest cycles',
                        'Maintain proper spacing (20x20 cm) for good air circulation',
                        'Monitor fields regularly for early detection',
                        'Use biological control: natural enemies, biopesticides',
                        'Apply chemical pesticides only when threshold levels are reached',
                        'Common pests: stem borers, leaf folders, brown planthoppers, rice bugs',
                        'Common diseases: blast, bacterial blight, sheath blight, brown spot'
                    ]
                },
                {
                    title: 'Harvesting',
                    content: 'Harvest when 80% of grains turn golden yellow. Cut at 15-20 cm above ground. Dry to 14% moisture content. Store in clean, dry, rodent-proof containers.',
                    steps: [
                        'Harvest when 80% of grains turn golden yellow (30-35 days after flowering)',
                        'Cut at 15-20 cm above ground level using sickle or combine harvester',
                        'Bundle and stack in field for 2-3 days to dry',
                        'Thresh using thresher or traditional methods',
                        'Dry grains to 14% moisture content (sun dry for 3-4 days)',
                        'Clean and remove impurities using winnowing or machines',
                        'Store in clean, dry, well-ventilated, rodent-proof containers',
                        'Use proper storage bags or bins to prevent moisture and pests'
                    ]
                }
            ]
        },
        {
            id: 2,
            name: 'Wheat',
            icon: '🌾',
            description: 'Master wheat cultivation methods',
            topics: [
                {
                    title: 'Soil & Climate',
                    content: 'Wheat grows best in well-drained loamy soil with pH 6.0-7.5. Requires cool, dry climate during growth and warm, dry weather during ripening. Temperature: 15-20°C during growth.'
                },
                {
                    title: 'Land Preparation',
                    content: 'Plow the field 2-3 times and level it. Prepare fine seedbed. Apply 10-15 tons of farmyard manure per hectare. Ensure proper drainage.'
                },
                {
                    title: 'Sowing',
                    content: 'Sow during October-November. Use 100-125 kg seeds per hectare. Row spacing: 20-25 cm. Seed depth: 5-6 cm. Use seed treatment with fungicides.'
                },
                {
                    title: 'Fertilizer Management',
                    content: 'Apply NPK (120:60:40 kg/ha). Apply half nitrogen and full P&K as basal dose. Remaining nitrogen in two splits: at tillering and jointing stages.'
                },
                {
                    title: 'Irrigation',
                    content: 'Critical irrigation stages: crown root initiation (20-25 DAS), tillering (40-45 DAS), jointing (60-70 DAS), flowering (80-90 DAS), and milking (100-110 DAS). Total 4-5 irrigations needed.'
                },
                {
                    title: 'Harvesting & Storage',
                    content: 'Harvest when grains are hard and moisture is 20-25%. Thresh immediately. Dry to 12% moisture. Store in clean, dry, well-ventilated godowns.'
                }
            ]
        },
        {
            id: 3,
            name: 'Corn/Maize',
            icon: '🌽',
            description: 'Learn modern maize farming practices',
            topics: [
                {
                    title: 'Soil Requirements',
                    content: 'Maize grows well in well-drained, fertile soils with pH 6.0-7.0. Sandy loam to clay loam soils are ideal. Avoid waterlogged areas.'
                },
                {
                    title: 'Seed & Sowing',
                    content: 'Use hybrid seeds with 80-85% germination. Sowing time: June-July (Kharif) or January-February (Rabi). Seed rate: 20-25 kg/ha. Spacing: 60x25 cm or 75x20 cm.'
                },
                {
                    title: 'Fertilizer Application',
                    content: 'Apply NPK (150:75:60 kg/ha). Apply 50% N and full P&K as basal. Remaining N in two splits: at knee-high stage and tasseling stage.'
                },
                {
                    title: 'Water Management',
                    content: 'Critical stages: knee-high, tasseling, silking, and grain filling. Provide irrigation at 7-10 day intervals. Avoid water stress during flowering.'
                },
                {
                    title: 'Weed Control',
                    content: 'Use pre-emergence herbicides like Atrazine. Manual weeding at 20-25 DAS and 40-45 DAS. Inter-cultivation helps in weed control and aeration.'
                },
                {
                    title: 'Harvesting',
                    content: 'Harvest when husk turns brown and grains are hard. Moisture content should be 20-25%. Dry to 12-14% moisture before storage.'
                }
            ]
        },
        {
            id: 4,
            name: 'Potato',
            icon: '🥔',
            description: 'Expert potato cultivation guide',
            topics: [
                {
                    title: 'Soil & Climate',
                    content: 'Potato requires well-drained, loose, friable soil with pH 5.5-6.5. Cool climate with temperature 15-20°C is ideal. Avoid waterlogging.'
                },
                {
                    title: 'Seed Preparation',
                    content: 'Use certified disease-free seed tubers. Cut tubers into pieces (40-50g) with 2-3 eyes each. Treat with fungicides. Allow cut surfaces to heal before planting.'
                },
                {
                    title: 'Planting',
                    content: 'Plant during October-November. Spacing: 60x20 cm. Seed rate: 20-25 quintals/ha. Plant at 5-7 cm depth. Use ridges and furrows method.'
                },
                {
                    title: 'Fertilizer & Manure',
                    content: 'Apply 20-25 tons FYM per hectare. NPK (150:100:100 kg/ha). Apply full P&K and 50% N as basal. Remaining N at earthing up stage.'
                },
                {
                    title: 'Irrigation',
                    content: 'First irrigation 7-10 days after planting. Then at 7-10 day intervals. Critical stages: tuber initiation and tuber development. Stop irrigation 2 weeks before harvest.'
                },
                {
                    title: 'Harvesting & Storage',
                    content: 'Harvest when vines dry up. Dig carefully to avoid damage. Cure for 10-15 days. Store in cool, dark, well-ventilated place at 2-4°C.'
                }
            ]
        },
        {
            id: 5,
            name: 'Tomato',
            icon: '🍅',
            description: 'Complete tomato farming guide',
            topics: [
                {
                    title: 'Soil & Climate',
                    content: 'Tomato grows in various soils but prefers well-drained, fertile loamy soil with pH 6.0-7.0. Temperature: 20-25°C. Avoid frost and extreme heat.'
                },
                {
                    title: 'Nursery & Transplanting',
                    content: 'Raise seedlings in nursery beds. Seed rate: 400-500g/ha. Transplant 25-30 day old seedlings. Spacing: 60x45 cm or 75x60 cm. Plant in evening.'
                },
                {
                    title: 'Fertilizer Management',
                    content: 'Apply 20-25 tons FYM per hectare. NPK (120:80:80 kg/ha). Apply 50% N and full P&K as basal. Remaining N in 2-3 splits during growth.'
                },
                {
                    title: 'Irrigation',
                    content: 'Irrigate immediately after transplanting. Then at 3-4 day intervals. Drip irrigation is ideal. Avoid water stress during flowering and fruiting.'
                },
                {
                    title: 'Staking & Pruning',
                    content: 'Provide stakes for indeterminate varieties. Remove side shoots. Prune lower leaves. Maintain 2-3 main stems per plant.'
                },
                {
                    title: 'Harvesting',
                    content: 'Harvest at mature green or pink stage. Pick regularly every 3-4 days. Handle carefully to avoid bruising. Yield: 25-40 tons/ha.'
                }
            ]
        },
        {
            id: 6,
            name: 'Onion',
            icon: '🧅',
            description: 'Learn onion cultivation techniques',
            topics: [
                {
                    title: 'Soil & Climate',
                    content: 'Onion requires well-drained, fertile loamy soil with pH 6.0-7.5. Cool weather during early growth and warm, dry weather during bulb development.'
                },
                {
                    title: 'Nursery & Transplanting',
                    content: 'Raise seedlings in nursery. Seed rate: 8-10 kg/ha. Transplant 45-60 day old seedlings. Spacing: 15x10 cm. Plant shallow, just covering roots.'
                },
                {
                    title: 'Fertilizer Application',
                    content: 'Apply 20-25 tons FYM per hectare. NPK (100:50:50 kg/ha). Apply 50% N and full P&K as basal. Remaining N in two splits at 30 and 60 DAS.'
                },
                {
                    title: 'Irrigation',
                    content: 'Irrigate immediately after transplanting. Then at 7-10 day intervals. Critical stage: bulb formation. Stop irrigation 2-3 weeks before harvest.'
                },
                {
                    title: 'Weed Control',
                    content: 'Use pre-emergence herbicides. Manual weeding at 20-25 DAS and 40-45 DAS. Mulching helps in weed control and moisture conservation.'
                },
                {
                    title: 'Harvesting & Curing',
                    content: 'Harvest when tops fall over. Pull carefully. Cure in field for 2-3 days, then in shade for 2-3 weeks. Store in well-ventilated, cool place.'
                }
            ]
        }
    ];

    const handleCropPress = (crop) => {
        setSelectedCrop(crop);
        setShowCropModal(true);
        setVideoError(false);
        setVideoLoading(true);
    };

    const handleVideoLoad = () => {
        setVideoLoading(false);
        setVideoError(false);
    };

    const handleVideoError = (error) => {
        console.error('Video error:', error);
        setVideoError(true);
        setVideoLoading(false);
    };

    const handlePlayButtonPress = async () => {
        try {
            if (videoRef.current) {
                // Enter fullscreen and start playing
                await videoRef.current.presentFullscreenPlayer();
                setIsFullscreen(true);
                await videoRef.current.playAsync();
                setIsPlaying(true);
            }
        } catch (error) {
            console.error('Error starting video:', error);
        }
    };

    const togglePlayPause = async () => {
        try {
            if (videoRef.current) {
                const status = await videoRef.current.getStatusAsync();
                if (status.isPlaying) {
                    await videoRef.current.pauseAsync();
                    setIsPlaying(false);
                } else {
                    await videoRef.current.playAsync();
                    setIsPlaying(true);
                }
            }
        } catch (error) {
            console.error('Error toggling play/pause:', error);
        }
    };

    const toggleFullscreen = async () => {
        try {
            if (videoRef.current) {
                if (isFullscreen) {
                    await videoRef.current.dismissFullscreenPlayer();
                    setIsFullscreen(false);
                } else {
                    await videoRef.current.presentFullscreenPlayer();
                    setIsFullscreen(true);
                }
            }
        } catch (error) {
            console.error('Error toggling fullscreen:', error);
        }
    };

    const formatTime = (milliseconds) => {
        if (!milliseconds) return '0:00';
        const totalSeconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const seekVideo = async (position) => {
        try {
            if (videoRef.current) {
                await videoRef.current.setPositionAsync(position);
            }
        } catch (error) {
            console.error('Error seeking video:', error);
        }
    };

    const dynamicStyles = getStyles(colors, isDark);

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
                <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Learn Farming</Text>
                <View style={dynamicStyles.placeholder} />
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
                <View style={dynamicStyles.content}>
                    <Text style={[dynamicStyles.subtitle, { color: colors.textSecondary }]}>
                        Select a crop to learn farming techniques
                    </Text>

                    <View style={dynamicStyles.cropsGrid}>
                        {crops.map((crop) => (
                            <TouchableOpacity
                                key={crop.id}
                                style={[dynamicStyles.cropCard, { backgroundColor: colors.card }]}
                                onPress={() => handleCropPress(crop)}
                            >
                                <Text style={dynamicStyles.cropIcon}>{crop.icon}</Text>
                                <Text style={[dynamicStyles.cropName, { color: colors.text }]}>{crop.name}</Text>
                                <Text style={[dynamicStyles.cropDescription, { color: colors.textSecondary }]}>
                                    {crop.description}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Crop Details Modal */}
            <Modal
                visible={showCropModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowCropModal(false)}
            >
                <View style={dynamicStyles.modalOverlay}>
                    <View style={[dynamicStyles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={dynamicStyles.modalHeader}>
                            <View style={dynamicStyles.modalHeaderLeft}>
                                <Text style={dynamicStyles.modalCropIcon}>{selectedCrop?.icon}</Text>
                                <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>
                                    {selectedCrop?.name} Farming
                                </Text>
                            </View>
                            <TouchableOpacity 
                                onPress={() => setShowCropModal(false)}
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
                            {/* Video Section - Only for Rice */}
                            {selectedCrop?.hasVideo && selectedCrop?.videoPath && (
                                <View style={[dynamicStyles.videoSection, { backgroundColor: colors.surface }]}>
                                    <View style={dynamicStyles.videoHeader}>
                                        <Text style={[dynamicStyles.sectionLabel, { color: colors.text }]}>📹 Video Guide</Text>
                                        <TouchableOpacity
                                            onPress={toggleFullscreen}
                                            style={[dynamicStyles.fullscreenButton, { backgroundColor: colors.primary + '20' }]}
                                        >
                                            <Text style={[dynamicStyles.fullscreenButtonText, { color: colors.primary }]}>
                                                ⛶
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    <View style={dynamicStyles.videoContainer}>
                                        {videoLoading && (
                                            <View style={dynamicStyles.videoLoadingContainer}>
                                                <ActivityIndicator size="large" color={colors.primary} />
                                                <Text style={[dynamicStyles.videoLoadingText, { color: colors.textSecondary }]}>
                                                    Loading video...
                                                </Text>
                                            </View>
                                        )}
                                        {videoError ? (
                                            <View style={dynamicStyles.videoErrorContainer}>
                                                <Text style={dynamicStyles.videoErrorIcon}>⚠️</Text>
                                                <Text style={[dynamicStyles.videoErrorText, { color: colors.textSecondary }]}>
                                                    Unable to load video
                                                </Text>
                                                <TouchableOpacity
                                                    onPress={() => {
                                                        setVideoError(false);
                                                        setVideoLoading(true);
                                                        if (videoRef.current) {
                                                            videoRef.current.reloadAsync();
                                                        }
                                                    }}
                                                    style={[dynamicStyles.retryButton, { backgroundColor: colors.primary }]}
                                                >
                                                    <Text style={dynamicStyles.retryButtonText}>Retry</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : (
                                            <View style={dynamicStyles.videoWrapper}>
                                                <Video
                                                    ref={videoRef}
                                                    style={dynamicStyles.video}
                                                    source={selectedCrop.videoPath}
                                                    useNativeControls={isFullscreen}
                                                    resizeMode={ResizeMode.CONTAIN}
                                                    isLooping={false}
                                                    shouldPlay={false}
                                                    isMuted={false}
                                                    volume={1.0}
                                                    allowsFullscreen={true}
                                                    shouldRasterizeIOS={false}
                                                    onLoad={handleVideoLoad}
                                                    onError={handleVideoError}
                                                    onPlaybackStatusUpdate={(status) => {
                                                        setVideoStatus(status);
                                                        setIsPlaying(status.isPlaying || false);
                                                        if (status.didJustFinish) {
                                                            setVideoLoading(false);
                                                            setIsPlaying(false);
                                                            // Exit fullscreen when video ends
                                                            if (isFullscreen && videoRef.current) {
                                                                videoRef.current.dismissFullscreenPlayer().catch(() => {});
                                                                setIsFullscreen(false);
                                                            }
                                                        }
                                                    }}
                                                    onLoadStart={() => setVideoLoading(true)}
                                                    onReadyForDisplay={() => setVideoLoading(false)}
                                                    onFullscreenUpdate={(event) => {
                                                        if (event.fullscreenUpdate === 1) {
                                                            setIsFullscreen(true);
                                                        } else if (event.fullscreenUpdate === 3) {
                                                            setIsFullscreen(false);
                                                        }
                                                    }}
                                                />
                                                {!isFullscreen && !videoLoading && !videoError && (
                                                    <TouchableOpacity
                                                        style={dynamicStyles.playButtonOverlay}
                                                        onPress={handlePlayButtonPress}
                                                        activeOpacity={0.8}
                                                    >
                                                        <View style={dynamicStyles.playButton}>
                                                            <Text style={dynamicStyles.playButtonIcon}>▶</Text>
                                                        </View>
                                                    </TouchableOpacity>
                                                )}
                                            </View>
                                        )}
                                    </View>
                                </View>
                            )}

                            {/* Facts Section - Only for Rice */}
                            {selectedCrop?.facts && selectedCrop.facts.length > 0 && (
                                <View style={[dynamicStyles.factsSection, { backgroundColor: colors.surface }]}>
                                    <Text style={[dynamicStyles.sectionLabel, { color: colors.text }]}>💡 Interesting Facts</Text>
                                    {selectedCrop.facts.map((fact, index) => (
                                        <View key={index} style={[dynamicStyles.factItem, { borderLeftColor: colors.primary }]}>
                                            <Text style={[dynamicStyles.factText, { color: colors.textSecondary }]}>
                                                • {fact}
                                            </Text>
                                        </View>
                                    ))}
                                </View>
                            )}

                            {/* Images Section - Only for Rice */}
                            {selectedCrop?.images && selectedCrop.images.length > 0 && (
                                <View style={[dynamicStyles.imagesSection, { backgroundColor: colors.surface }]}>
                                    <Text style={[dynamicStyles.sectionLabel, { color: colors.text }]}>📷 Visual Guide</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.imagesScroll}>
                                        {selectedCrop.images.map((image, index) => (
                                            <View key={index} style={dynamicStyles.imageCard}>
                                                <Image 
                                                    source={{ uri: image.uri }} 
                                                    style={dynamicStyles.cropImage}
                                                    resizeMode="cover"
                                                />
                                                <Text style={[dynamicStyles.imageTitle, { color: colors.text }]}>{image.title}</Text>
                                            </View>
                                        ))}
                                    </ScrollView>
                                </View>
                            )}

                            {/* Topics/Guides Section */}
                            <View style={dynamicStyles.guidesSection}>
                                <Text style={[dynamicStyles.sectionLabel, { color: colors.text }]}>📖 Farming Guide</Text>
                                {selectedCrop?.topics.map((topic, index) => (
                                    <View key={index} style={[dynamicStyles.topicCard, { backgroundColor: colors.surface }]}>
                                        <Text style={[dynamicStyles.topicTitle, { color: colors.text }]}>
                                            {index + 1}. {topic.title}
                                        </Text>
                                        <Text style={[dynamicStyles.topicContent, { color: colors.textSecondary }]}>
                                            {topic.content}
                                        </Text>
                                        {/* Steps - Only for Rice */}
                                        {topic.steps && topic.steps.length > 0 && (
                                            <View style={dynamicStyles.stepsContainer}>
                                                {topic.steps.map((step, stepIndex) => (
                                                    <View key={stepIndex} style={[dynamicStyles.stepItem, { borderLeftColor: colors.primary }]}>
                                                        <Text style={[dynamicStyles.stepNumber, { color: colors.primary }]}>
                                                            {stepIndex + 1}
                                                        </Text>
                                                        <Text style={[dynamicStyles.stepText, { color: colors.textSecondary }]}>
                                                            {step}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        )}
                                    </View>
                                ))}
                            </View>
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
    content: {
        padding: 20,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
    },
    cropsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 16,
    },
    cropCard: {
        width: '48%',
        maxWidth: 180,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        marginBottom: 16,
    },
    cropIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    cropName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    cropDescription: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
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
    modalHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    modalCropIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        flex: 1,
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
        padding: 20,
    },
    topicCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    topicTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 12,
    },
    topicContent: {
        fontSize: 14,
        lineHeight: 22,
    },
    videoSection: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    videoHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionLabel: {
        fontSize: 18,
        fontWeight: '700',
    },
    fullscreenButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullscreenButtonText: {
        fontSize: 18,
        fontWeight: '600',
    },
    videoContainer: {
        borderRadius: 12,
        backgroundColor: '#000',
        width: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: 200,
    },
    videoWrapper: {
        width: '100%',
        position: 'relative',
        backgroundColor: '#000',
        borderRadius: 12,
    },
    video: {
        width: '100%',
        aspectRatio: 16 / 9,
        backgroundColor: '#000',
    },
    playButtonOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: 12,
        zIndex: 10,
    },
    playButton: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 8,
        elevation: 8,
    },
    playButtonIcon: {
        fontSize: 36,
        color: '#000',
        marginLeft: 6,
        fontWeight: 'bold',
    },
    customControlsOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderBottomLeftRadius: 12,
        borderBottomRightRadius: 12,
    },
    controlButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    controlIcon: {
        fontSize: 24,
        color: '#FFFFFF',
    },
    progressContainer: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 8,
    },
    progressBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        marginHorizontal: 8,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 2,
    },
    timeText: {
        fontSize: 12,
        fontWeight: '600',
        minWidth: 40,
        textAlign: 'center',
    },
    videoLoadingContainer: {
        position: 'absolute',
        width: '100%',
        aspectRatio: 16 / 9,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        zIndex: 1,
    },
    videoLoadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    videoErrorContainer: {
        width: '100%',
        aspectRatio: 16 / 9,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000',
        padding: 20,
    },
    videoErrorIcon: {
        fontSize: 48,
        marginBottom: 12,
    },
    videoErrorText: {
        fontSize: 14,
        marginBottom: 16,
        textAlign: 'center',
    },
    retryButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    retryButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    factsSection: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    factItem: {
        paddingLeft: 12,
        marginBottom: 8,
        borderLeftWidth: 3,
    },
    factText: {
        fontSize: 14,
        lineHeight: 20,
    },
    imagesSection: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    imagesScroll: {
        marginHorizontal: -16,
        paddingHorizontal: 16,
    },
    imageCard: {
        marginRight: 12,
        width: 200,
    },
    cropImage: {
        width: 200,
        height: 150,
        borderRadius: 12,
        marginBottom: 8,
    },
    imageTitle: {
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    guidesSection: {
        marginTop: 8,
    },
    stepsContainer: {
        marginTop: 12,
    },
    stepItem: {
        flexDirection: 'row',
        paddingLeft: 12,
        marginBottom: 10,
        borderLeftWidth: 3,
    },
    stepNumber: {
        fontSize: 16,
        fontWeight: '700',
        marginRight: 12,
        minWidth: 24,
    },
    stepText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
});

export default FarmerLearnScreen;

