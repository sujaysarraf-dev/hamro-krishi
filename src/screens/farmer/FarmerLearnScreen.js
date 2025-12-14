import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, BackHandler, Modal, Image, Dimensions, Platform, TextInput, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import * as Animatable from 'react-native-animatable';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Conditionally import expo-video - it may not work on web
let VideoView = null;
// Always provide a fallback function to avoid conditional hook calls
let useVideoPlayer = () => null;

// Only try to import expo-video on native platforms to avoid web build errors
if (Platform.OS !== 'web') {
    try {
        const expoVideo = require('expo-video');
        if (expoVideo && expoVideo.VideoView && expoVideo.useVideoPlayer) {
            VideoView = expoVideo.VideoView;
            useVideoPlayer = expoVideo.useVideoPlayer;
        }
    } catch (error) {
        console.warn('expo-video not available:', error);
        // useVideoPlayer already has a fallback function
    }
}

// Web Video Component using HTML5 video for React Native Web
const WebVideoPlayer = ({ source, style, onLoad, onError }) => {
    const containerRef = React.useRef(null);
    const videoId = React.useRef(`video-${Math.random().toString(36).substr(2, 9)}`).current;

    // Convert require() source to URL for web
    const getVideoSource = () => {
        if (!source) return '';
        // On web, require() for video assets returns a URL string
        // On native, it returns a number (asset ID)
        if (typeof source === 'number') {
            // For web, try to resolve the asset ID to a URL
            // In React Native Web, the bundler should handle this
            // If it's still a number, we might need to use Asset.fromModule
            // For now, try to use it directly - the bundler should convert it
            return source;
        }
        if (typeof source === 'string') {
            // Direct URL string
            return source;
        }
        if (source && typeof source === 'object') {
            // Object with uri property
            return source.uri || '';
        }
        return '';
    };

    const videoSource = getVideoSource();

    React.useEffect(() => {
        if (Platform.OS !== 'web' || !containerRef.current || !videoSource) return;

        // Resolve video source URL
        let resolvedSource = videoSource;
        
        // If source is a number (asset ID), try to resolve it
        // On React Native Web, require() should return a URL string, but handle both cases
        if (typeof videoSource === 'number') {
            // Try to get the asset URL from the asset registry
            // In React Native Web, this might be in __webpack_require__ or similar
            // For now, log and try to use it as-is (bundler should handle it)
            console.warn('Video source is a number on web, may need asset resolution:', videoSource);
        }

        // Create video element
        const video = document.createElement('video');
        video.id = videoId;
        video.src = resolvedSource;
        video.controls = true;
        video.playsInline = true;
        video.preload = 'metadata';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'contain';
        video.style.backgroundColor = '#000';
        video.style.borderRadius = '12px';

        const handleLoadedData = () => {
            if (onLoad) onLoad();
        };

        const handleError = (e) => {
            console.error('Video error:', e, 'Source:', resolvedSource);
            if (onError) onError(e);
        };

        video.addEventListener('loadeddata', handleLoadedData);
        video.addEventListener('error', handleError);

        // Clear container and append video
        containerRef.current.innerHTML = '';
        containerRef.current.appendChild(video);

        return () => {
            video.removeEventListener('loadeddata', handleLoadedData);
            video.removeEventListener('error', handleError);
            if (containerRef.current && video.parentNode === containerRef.current) {
                containerRef.current.removeChild(video);
            }
        };
    }, [videoId, videoSource, onLoad, onError]);

    if (Platform.OS === 'web') {
        return (
            <View style={[{ position: 'relative', width: '100%', aspectRatio: 16 / 9, backgroundColor: '#000', borderRadius: 12, overflow: 'hidden' }, style]}>
                <View
                    ref={containerRef}
                    style={{ width: '100%', height: '100%' }}
                />
            </View>
        );
    }

    return null;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const FarmerLearnScreen = ({ onNavigateBack }) => {
    const router = useRouter();
    const { colors, isDark } = useTheme();
    const [selectedCrop, setSelectedCrop] = useState(null);
    const [showCropModal, setShowCropModal] = useState(false);
    const [videoSource, setVideoSource] = useState(null);
    const [expandedTopics, setExpandedTopics] = useState({});
    const [completedSteps, setCompletedSteps] = useState({});
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [showProgressModal, setShowProgressModal] = useState(false);
    const [savedProgress, setSavedProgress] = useState(0);
    const modalScale = useRef(new Animated.Value(0)).current;

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

    // Update video source when crop changes
    useEffect(() => {
        if (selectedCrop?.hasVideo && selectedCrop?.videoPath) {
            // require() returns a number (asset ID) for local files
            // expo-video can handle this directly
            setVideoSource(selectedCrop.videoPath);
            setVideoLoading(true);
            setVideoError(false);
        } else {
            setVideoSource(null);
            setVideoLoading(false);
        }
    }, [selectedCrop]);

    // Create video player instance - always call hook to follow React rules
    // useVideoPlayer is always defined (fallback function on web)
    const videoPlayer = useVideoPlayer(videoSource, (player) => {
        if (player && videoSource) {
            player.loop = false;
            player.muted = false;
            player.volume = 1.0;
        }
    });

    const [videoError, setVideoError] = useState(false);
    const [videoLoading, setVideoLoading] = useState(true);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        // Initialize modal scale
        if (showCropModal) {
            modalScale.setValue(0);
            Animated.spring(modalScale, {
                toValue: 1,
                useNativeDriver: true,
                tension: 50,
                friction: 7,
            }).start();
            
            // Reset video state when modal opens
            if (selectedCrop?.hasVideo && videoSource) {
                setVideoError(false);
                setVideoLoading(true);
                setIsPlaying(false);
            }
        } else {
            modalScale.setValue(0);
            // Reset video when modal closes
            if (videoPlayer) {
                try {
                    videoPlayer.pause();
                    videoPlayer.seekTo(0);
                } catch (e) {
                    console.warn('Error resetting video:', e);
                }
            }
        }
    }, [showCropModal, selectedCrop, videoSource]);

    // Listen to player status changes
    useEffect(() => {
        if (!videoPlayer || !videoSource) {
            setVideoLoading(false);
            return;
        }

        // Set up status listener
        const statusListener = videoPlayer.addListener('statusChange', (status) => {
            console.log('Video status changed:', status);
            if (status.isPlaying !== undefined) {
                setIsPlaying(status.isPlaying);
            }
            if (status.status === 'readyToPlay' || status.status === 'playing') {
                setVideoLoading(false);
                setVideoError(false);
            } else if (status.status === 'error') {
                console.error('Video error status:', status);
                setVideoError(true);
                setVideoLoading(false);
            }
        });

        // Also listen for load events
        const loadListener = videoPlayer.addListener('load', () => {
            console.log('Video loaded');
            setVideoLoading(false);
            setVideoError(false);
        });

        // Set initial loading state
        setVideoLoading(true);
        setVideoError(false);

        return () => {
            if (statusListener) statusListener.remove();
            if (loadListener) loadListener.remove();
        };
    }, [videoPlayer, videoSource]);

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

    const handleCropPress = async (crop) => {
        setSelectedCrop(crop);
        setShowCropModal(true);
        setVideoError(false);
        setVideoLoading(true);
        // Reset expanded topics for new crop
        setExpandedTopics({});
        
        // Load saved progress for this crop
        try {
            const savedData = await AsyncStorage.getItem(`learning_progress_${crop.id}`);
            if (savedData) {
                const progress = JSON.parse(savedData);
                setCompletedSteps(progress.completedSteps || {});
            } else {
                setCompletedSteps({});
            }
        } catch (error) {
            console.error('Error loading progress:', error);
            setCompletedSteps({});
        }
    };

    const handleCloseModal = () => {
        Animated.spring(modalScale, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 7,
        }).start(() => {
            setShowCropModal(false);
        });
    };

    const toggleTopic = (topicIndex) => {
        setExpandedTopics(prev => ({
            ...prev,
            [topicIndex]: !prev[topicIndex]
        }));
    };

    const toggleStep = (topicIndex, stepIndex) => {
        const key = `${topicIndex}-${stepIndex}`;
        setCompletedSteps(prev => ({
            ...prev,
            [key]: !prev[key]
        }));
    };

    const getTopicProgress = (topicIndex, steps) => {
        if (!steps || steps.length === 0) return 0;
        const completed = steps.filter((_, stepIndex) => completedSteps[`${topicIndex}-${stepIndex}`]).length;
        return Math.round((completed / steps.length) * 100);
    };

    const getOverallProgress = () => {
        if (!selectedCrop?.topics) return 0;
        let totalSteps = 0;
        let completed = 0;
        selectedCrop.topics.forEach((topic, topicIndex) => {
            if (topic.steps) {
                totalSteps += topic.steps.length;
                topic.steps.forEach((_, stepIndex) => {
                    if (completedSteps[`${topicIndex}-${stepIndex}`]) {
                        completed++;
                    }
                });
            }
        });
        return totalSteps > 0 ? Math.round((completed / totalSteps) * 100) : 0;
    };

    const handleSaveAndContinue = async () => {
        if (!selectedCrop) return;
        
        const progress = getOverallProgress();
        setSavedProgress(progress);
        
        try {
            // Save progress to AsyncStorage
            await AsyncStorage.setItem(`learning_progress_${selectedCrop.id}`, JSON.stringify({
                completedSteps,
                progress,
                lastUpdated: new Date().toISOString(),
            }));
            
            // Show progress modal
            setShowProgressModal(true);
            
            // Auto-hide after 3 seconds
            setTimeout(() => {
                setShowProgressModal(false);
            }, 3000);
        } catch (error) {
            console.error('Error saving progress:', error);
        }
    };

    // Filter crops based on search and category
    const filteredCrops = crops.filter(crop => {
        const matchesSearch = crop.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            crop.description.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesSearch;
    });

    const handleVideoLoad = () => {
        console.log('Video load event');
        setVideoLoading(false);
        setVideoError(false);
        if (videoPlayer) {
            // Video is ready, but don't auto-play
            setIsPlaying(false);
        }
    };

    const handleVideoError = (error) => {
        console.error('Video error event:', error);
        setVideoError(true);
        setVideoLoading(false);
    };

    const handlePlayButtonPress = () => {
        try {
            if (videoPlayer) {
                videoPlayer.play();
                setIsPlaying(true);
                setIsFullscreen(true);
            }
        } catch (error) {
            console.error('Error starting video:', error);
        }
    };

    const togglePlayPause = () => {
        try {
            if (videoPlayer) {
                if (videoPlayer.playing) {
                    videoPlayer.pause();
                    setIsPlaying(false);
                } else {
                    videoPlayer.play();
                    setIsPlaying(true);
                }
            }
        } catch (error) {
            console.error('Error toggling play/pause:', error);
        }
    };

    const toggleFullscreen = () => {
        setIsFullscreen(!isFullscreen);
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
                    {/* Search Bar */}
                    <Animatable.View animation="fadeInDown" duration={500} style={dynamicStyles.searchContainer}>
                        <View style={[dynamicStyles.searchBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
                            <Text style={[dynamicStyles.searchIcon, { color: colors.textSecondary }]}>🔍</Text>
                            <TextInput
                                style={[dynamicStyles.searchInput, { color: colors.text }]}
                                placeholder="Search crops..."
                                placeholderTextColor={colors.textSecondary}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <Text style={[dynamicStyles.clearIcon, { color: colors.textSecondary }]}>✕</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </Animatable.View>

                    <Text style={[dynamicStyles.subtitle, { color: colors.textSecondary }]}>
                        {filteredCrops.length > 0 
                            ? `Select a crop to learn farming techniques (${filteredCrops.length} available)`
                            : 'No crops found. Try a different search.'}
                    </Text>

                    <View style={dynamicStyles.cropsGrid}>
                        {filteredCrops.map((crop, index) => (
                            <Animatable.View
                                key={crop.id}
                                animation="fadeInUp"
                                duration={400}
                                delay={index * 100}
                                style={dynamicStyles.cropCardWrapper}
                            >
                                <TouchableOpacity
                                    style={[dynamicStyles.cropCard, { backgroundColor: colors.card }]}
                                    onPress={() => handleCropPress(crop)}
                                    activeOpacity={0.8}
                                >
                                    <View style={[dynamicStyles.cropIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                        <Text style={dynamicStyles.cropIcon}>{crop.icon}</Text>
                                    </View>
                                    <Text style={[dynamicStyles.cropName, { color: colors.text }]}>{crop.name}</Text>
                                    <Text 
                                        style={[dynamicStyles.cropDescription, { color: colors.textSecondary }]}
                                        numberOfLines={2}
                                    >
                                        {crop.description}
                                    </Text>
                                    <View style={dynamicStyles.cropBadge}>
                                        <Text style={[dynamicStyles.cropBadgeText, { color: colors.primary }]}>
                                            {crop.topics?.length || 0} Topics
                                        </Text>
                                    </View>
                                </TouchableOpacity>
                            </Animatable.View>
                        ))}
                    </View>
                </View>
            </ScrollView>

            {/* Crop Details Modal */}
            <Modal
                visible={showCropModal}
                animationType="fade"
                transparent={true}
                onRequestClose={handleCloseModal}
            >
                <View style={dynamicStyles.modalOverlay}>
                    <Animated.View 
                        style={[
                            dynamicStyles.modalContent, 
                            { 
                                backgroundColor: colors.card,
                                transform: [{ scale: modalScale }]
                            }
                        ]}
                    >
                        <View style={dynamicStyles.modalHeader}>
                            <View style={dynamicStyles.modalHeaderLeft}>
                                <View style={[dynamicStyles.modalIconContainer, { backgroundColor: colors.primary + '15' }]}>
                                    <Text style={dynamicStyles.modalCropIcon}>{selectedCrop?.icon}</Text>
                                </View>
                                <View style={dynamicStyles.modalTitleContainer}>
                                    <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>
                                        {selectedCrop?.name} Farming
                                    </Text>
                                    {getOverallProgress() > 0 && (
                                        <View style={dynamicStyles.progressBarContainer}>
                                            <View style={[dynamicStyles.progressBarBg, { backgroundColor: colors.surface }]}>
                                                <View 
                                                    style={[
                                                        dynamicStyles.progressBarFill, 
                                                        { 
                                                            width: `${getOverallProgress()}%`,
                                                            backgroundColor: colors.primary 
                                                        }
                                                    ]} 
                                                />
                                            </View>
                                            <Text style={[dynamicStyles.progressText, { color: colors.textSecondary }]}>
                                                {getOverallProgress()}% Complete
                                            </Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                            <TouchableOpacity 
                                onPress={handleCloseModal}
                                style={[dynamicStyles.closeButton, { backgroundColor: colors.surface }]}
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
                                                        if (videoPlayer) {
                                                            videoPlayer.replay();
                                                        }
                                                    }}
                                                    style={[dynamicStyles.retryButton, { backgroundColor: colors.primary }]}
                                                >
                                                    <Text style={dynamicStyles.retryButtonText}>Retry</Text>
                                                </TouchableOpacity>
                                            </View>
                                        ) : Platform.OS === 'web' && videoSource ? (
                                            <View style={dynamicStyles.videoWrapper}>
                                                <WebVideoPlayer
                                                    source={videoSource}
                                                    style={dynamicStyles.video}
                                                    onLoad={() => {
                                                        setVideoLoading(false);
                                                        setVideoError(false);
                                                    }}
                                                    onError={() => {
                                                        setVideoLoading(false);
                                                        setVideoError(true);
                                                    }}
                                                    onPlay={() => setIsPlaying(true)}
                                                    onPause={() => setIsPlaying(false)}
                                                />
                                                {videoLoading && (
                                                    <View style={dynamicStyles.videoLoadingOverlay}>
                                                        <ActivityIndicator size="large" color="#FFFFFF" />
                                                        <Text style={dynamicStyles.videoLoadingTextOverlay}>
                                                            Loading video...
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        ) : videoPlayer && videoSource && VideoView ? (
                                            <View style={dynamicStyles.videoWrapper}>
                                                <VideoView
                                                    player={videoPlayer}
                                                    style={dynamicStyles.video}
                                                    nativeControls={true}
                                                    contentFit="contain"
                                                    allowsFullscreen={true}
                                                    allowsPictureInPicture={false}
                                                />
                                                {videoLoading && (
                                                    <View style={dynamicStyles.videoLoadingOverlay}>
                                                        <ActivityIndicator size="large" color="#FFFFFF" />
                                                        <Text style={dynamicStyles.videoLoadingTextOverlay}>
                                                            Loading video...
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        ) : (
                                            <View style={dynamicStyles.videoErrorContainer}>
                                                <Text style={dynamicStyles.videoErrorIcon}>⚠️</Text>
                                                <Text style={[dynamicStyles.videoErrorText, { color: colors.textSecondary }]}>
                                                    Video player not available. Please ensure expo-video is installed.
                                                </Text>
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
                                <View style={dynamicStyles.sectionHeader}>
                                    <Text style={[dynamicStyles.sectionLabel, { color: colors.text }]}>📖 Farming Guide</Text>
                                    {getOverallProgress() > 0 && (
                                        <View style={[dynamicStyles.overallProgressBadge, { backgroundColor: colors.primary + '20' }]}>
                                            <Text style={[dynamicStyles.overallProgressText, { color: colors.primary }]}>
                                                {getOverallProgress()}% Complete
                                            </Text>
                                        </View>
                                    )}
                                </View>
                                {selectedCrop?.topics.map((topic, index) => {
                                    const isExpanded = expandedTopics[index];
                                    const progress = topic.steps ? getTopicProgress(index, topic.steps) : 0;
                                    const hasSteps = topic.steps && topic.steps.length > 0;
                                    
                                    return (
                                        <Animatable.View
                                            key={index}
                                            animation={isExpanded ? "fadeInDown" : "fadeInUp"}
                                            duration={300}
                                        >
                                            <TouchableOpacity
                                                style={[
                                                    dynamicStyles.topicCard, 
                                                    { 
                                                        backgroundColor: colors.surface,
                                                        borderLeftWidth: 4,
                                                        borderLeftColor: progress === 100 ? '#4CAF50' : colors.primary
                                                    }
                                                ]}
                                                onPress={() => hasSteps && toggleTopic(index)}
                                                activeOpacity={hasSteps ? 0.7 : 1}
                                            >
                                                <View style={dynamicStyles.topicHeader}>
                                                    <View style={dynamicStyles.topicHeaderLeft}>
                                                        <View style={[dynamicStyles.topicNumberBadge, { backgroundColor: colors.primary + '20' }]}>
                                                            <Text style={[dynamicStyles.topicNumber, { color: colors.primary }]}>
                                                                {index + 1}
                                                            </Text>
                                                        </View>
                                                        <View style={dynamicStyles.topicTitleContainer}>
                                                            <Text style={[dynamicStyles.topicTitle, { color: colors.text }]}>
                                                                {topic.title}
                                                            </Text>
                                                            {hasSteps && progress > 0 && (
                                                                <View style={dynamicStyles.topicProgressContainer}>
                                                                    <View style={[dynamicStyles.topicProgressBar, { backgroundColor: colors.surface }]}>
                                                                        <View 
                                                                            style={[
                                                                                dynamicStyles.topicProgressFill, 
                                                                                { 
                                                                                    width: `${progress}%`,
                                                                                    backgroundColor: progress === 100 ? '#4CAF50' : colors.primary 
                                                                                }
                                                                            ]} 
                                                                        />
                                                                    </View>
                                                                    <Text style={[dynamicStyles.topicProgressText, { color: colors.textSecondary }]}>
                                                                        {progress}%
                                                                    </Text>
                                                                </View>
                                                            )}
                                                        </View>
                                                    </View>
                                                    {hasSteps && (
                                                        <TouchableOpacity onPress={() => toggleTopic(index)}>
                                                            <Text style={[dynamicStyles.expandIcon, { color: colors.primary }]}>
                                                                {isExpanded ? '▼' : '▶'}
                                                            </Text>
                                                        </TouchableOpacity>
                                                    )}
                                                </View>
                                                <Text style={[dynamicStyles.topicContent, { color: colors.textSecondary }]}>
                                                    {topic.content}
                                                </Text>
                                                {/* Expandable Steps */}
                                                {hasSteps && isExpanded && (
                                                    <Animatable.View 
                                                        animation="fadeInDown" 
                                                        duration={300}
                                                        style={dynamicStyles.stepsContainer}
                                                    >
                                                        <Text style={[dynamicStyles.stepsHeader, { color: colors.text }]}>
                                                            Step-by-Step Guide:
                                                        </Text>
                                                        {topic.steps.map((step, stepIndex) => {
                                                            const stepKey = `${index}-${stepIndex}`;
                                                            const isCompleted = completedSteps[stepKey];
                                                            
                                                            return (
                                                                <TouchableOpacity
                                                                    key={stepIndex}
                                                                    style={[
                                                                        dynamicStyles.stepItem, 
                                                                        { 
                                                                            borderLeftColor: isCompleted ? '#4CAF50' : colors.primary,
                                                                            backgroundColor: isCompleted ? colors.primary + '05' : 'transparent'
                                                                        }
                                                                    ]}
                                                                    onPress={() => toggleStep(index, stepIndex)}
                                                                    activeOpacity={0.7}
                                                                >
                                                                    <View style={[
                                                                        dynamicStyles.stepCheckbox,
                                                                        { 
                                                                            backgroundColor: isCompleted ? '#4CAF50' : 'transparent',
                                                                            borderColor: isCompleted ? '#4CAF50' : colors.primary
                                                                        }
                                                                    ]}>
                                                                        {isCompleted && (
                                                                            <Text style={dynamicStyles.checkmark}>✓</Text>
                                                                        )}
                                                                    </View>
                                                                    <View style={dynamicStyles.stepContent}>
                                                                        <Text style={[dynamicStyles.stepNumber, { color: colors.primary }]}>
                                                                            Step {stepIndex + 1}
                                                                        </Text>
                                                                        <Text style={[
                                                                            dynamicStyles.stepText, 
                                                                            { 
                                                                                color: isCompleted ? colors.textSecondary : colors.text,
                                                                                textDecorationLine: isCompleted ? 'line-through' : 'none'
                                                                            }
                                                                        ]}>
                                                                            {step}
                                                                        </Text>
                                                                    </View>
                                                                </TouchableOpacity>
                                                            );
                                                        })}
                                                    </Animatable.View>
                                                )}
                                            </TouchableOpacity>
                                        </Animatable.View>
                                    );
                                })}
                            </View>

                            {/* Save and Continue Button */}
                            <View style={dynamicStyles.saveButtonContainer}>
                                <TouchableOpacity
                                    style={[dynamicStyles.saveButton, { backgroundColor: colors.primary }]}
                                    onPress={handleSaveAndContinue}
                                    activeOpacity={0.8}
                                >
                                    <Text style={dynamicStyles.saveButtonText}>💾 Save and Continue</Text>
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </Animated.View>
                </View>
            </Modal>

            {/* Progress Modal */}
            <Modal
                visible={showProgressModal}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowProgressModal(false)}
            >
                <View style={dynamicStyles.progressModalOverlay}>
                    <Animatable.View
                        animation="bounceIn"
                        style={[dynamicStyles.progressModalContent, { backgroundColor: colors.card }]}
                    >
                        <View style={[dynamicStyles.progressModalIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Text style={dynamicStyles.progressModalIconText}>✓</Text>
                        </View>
                        <Text style={[dynamicStyles.progressModalTitle, { color: colors.text }]}>
                            Progress Saved!
                        </Text>
                        <Text style={[dynamicStyles.progressModalSubtitle, { color: colors.textSecondary }]}>
                            You have completed
                        </Text>
                        <View style={[dynamicStyles.progressModalProgressContainer, { backgroundColor: colors.surface, borderColor: colors.primary }]}>
                            <Text style={[dynamicStyles.progressModalProgressText, { color: colors.primary }]}>
                                {savedProgress}%
                            </Text>
                        </View>
                        <Text style={[dynamicStyles.progressModalMessage, { color: colors.textSecondary }]}>
                            of {selectedCrop?.name} farming guide
                        </Text>
                        <TouchableOpacity
                            style={[dynamicStyles.progressModalButton, { backgroundColor: colors.primary }]}
                            onPress={() => setShowProgressModal(false)}
                        >
                            <Text style={dynamicStyles.progressModalButtonText}>Continue Learning</Text>
                        </TouchableOpacity>
                    </Animatable.View>
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
        paddingBottom: 40,
    },
    subtitle: {
        fontSize: 14,
        marginBottom: 20,
        marginTop: 8,
        textAlign: 'center',
    },
    searchContainer: {
        marginBottom: 20,
    },
    searchBar: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderWidth: 1,
    },
    searchIcon: {
        fontSize: 20,
        marginRight: 10,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    clearIcon: {
        fontSize: 18,
        padding: 4,
    },
    cropsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    cropCardWrapper: {
        width: '48%',
        marginBottom: 16,
    },
    cropCard: {
        width: '100%',
        borderRadius: 20,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'space-between',
        minHeight: 200,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    cropIconContainer: {
        width: 70,
        height: 70,
        borderRadius: 35,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    cropIcon: {
        fontSize: 40,
    },
    cropName: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
        textAlign: 'center',
    },
    cropDescription: {
        fontSize: 12,
        textAlign: 'center',
        lineHeight: 16,
        marginBottom: 8,
        flex: 1,
        minHeight: 32,
    },
    cropBadge: {
        marginTop: 'auto',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        backgroundColor: 'rgba(0, 0, 0, 0.05)',
    },
    cropBadgeText: {
        fontSize: 11,
        fontWeight: '600',
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
    modalIconContainer: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    modalCropIcon: {
        fontSize: 28,
    },
    modalTitleContainer: {
        flex: 1,
    },
    progressBarContainer: {
        marginTop: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    progressBarBg: {
        flex: 1,
        height: 6,
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 3,
    },
    progressText: {
        fontSize: 11,
        fontWeight: '600',
        minWidth: 60,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
        flex: 1,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
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
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    overallProgressBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    overallProgressText: {
        fontSize: 12,
        fontWeight: '700',
    },
    topicCard: {
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    topicHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    topicHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        flex: 1,
    },
    topicNumberBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    topicNumber: {
        fontSize: 14,
        fontWeight: '700',
    },
    topicTitleContainer: {
        flex: 1,
    },
    topicTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 6,
    },
    topicProgressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginTop: 4,
    },
    topicProgressBar: {
        flex: 1,
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    topicProgressFill: {
        height: '100%',
        borderRadius: 2,
    },
    topicProgressText: {
        fontSize: 10,
        fontWeight: '600',
        minWidth: 35,
    },
    expandIcon: {
        fontSize: 16,
        fontWeight: '700',
        padding: 4,
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
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    stepsHeader: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 12,
    },
    stepItem: {
        flexDirection: 'row',
        padding: 12,
        marginBottom: 10,
        borderLeftWidth: 3,
        borderRadius: 8,
    },
    stepCheckbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    checkmark: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
    stepContent: {
        flex: 1,
    },
    stepNumber: {
        fontSize: 12,
        fontWeight: '700',
        marginBottom: 4,
    },
    stepText: {
        fontSize: 14,
        lineHeight: 20,
    },
    saveButtonContainer: {
        marginTop: 20,
        marginBottom: 10,
        paddingHorizontal: 20,
    },
    saveButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    progressModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    progressModalContent: {
        borderRadius: 24,
        padding: 30,
        width: '85%',
        maxWidth: 350,
        alignItems: 'center',
    },
    progressModalIcon: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    progressModalIconText: {
        fontSize: 48,
        color: '#4CAF50',
        fontWeight: 'bold',
    },
    progressModalTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginBottom: 8,
        textAlign: 'center',
    },
    progressModalSubtitle: {
        fontSize: 16,
        marginBottom: 16,
        textAlign: 'center',
    },
    progressModalProgressContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 4,
    },
    progressModalProgressText: {
        fontSize: 36,
        fontWeight: '700',
    },
    progressModalMessage: {
        fontSize: 14,
        marginBottom: 24,
        textAlign: 'center',
    },
    progressModalButton: {
        paddingVertical: 12,
        paddingHorizontal: 32,
        borderRadius: 12,
        width: '100%',
        alignItems: 'center',
    },
    progressModalButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FarmerLearnScreen;

