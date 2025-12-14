import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, BackHandler, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { supabase } from '../../config/supabase';
import { getAICropAdvisory } from '../../services/geminiService';
import { reverseGeocode } from '../../utils/geocoding';

const WEATHERBIT_API_KEY = 'b6d691f2b36741c0b7d036f5c88b7d30';

const FarmerWeatherScreen = ({ onNavigateBack }) => {
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
    const [refreshing, setRefreshing] = useState(false);
    const [location, setLocation] = useState(null);
    const [locationName, setLocationName] = useState('Loading location...');
    const [weatherData, setWeatherData] = useState(null);
    const [forecastData, setForecastData] = useState([]);
    const [cropAdvisory, setCropAdvisory] = useState([]);
    const [aiAdvisory, setAiAdvisory] = useState(null);
    const [loadingAI, setLoadingAI] = useState(false);
    const [userProducts, setUserProducts] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        await requestLocationPermission();
        await loadUserProducts();
    };

    const loadUserProducts = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: products } = await supabase
                .from('products')
                .select('name, category')
                .eq('farmer_id', user.id)
                .eq('status', 'Active');

            // Filter out products with invalid names (e.g., just numbers or empty)
            const validProducts = (products || []).filter(product => {
                const name = product.name?.trim();
                // Check if name exists, is not empty, and is not just a number
                return name && 
                       name.length > 0 && 
                       !/^\d+$/.test(name) && // Not just digits
                       name.length > 2; // At least 3 characters
            });

            setUserProducts(validProducts);
        } catch (error) {
            console.error('Error loading products:', error);
        }
    };

    const requestLocationPermission = async () => {
        try {
            setLoading(true);
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                setLocationName('Location not available');
                setLoading(false);
                return;
            }

            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            setLocation(currentLocation.coords);

            // Use OpenStreetMap Nominatim for reverse geocoding
            const locationName = await reverseGeocode(
                currentLocation.coords.latitude,
                currentLocation.coords.longitude
            );
            setLocationName(locationName);

            await fetchWeatherData(currentLocation.coords.latitude, currentLocation.coords.longitude);
        } catch (error) {
            console.error('Error getting location:', error);
            setLocationName('Location not available');
            setLoading(false);
        }
    };

    const fetchWeatherData = async (lat, lon) => {
        try {
            // Fetch current weather
            const currentResponse = await fetch(
                `https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lon}&key=${WEATHERBIT_API_KEY}&units=M`
            );
            
            if (!currentResponse.ok) throw new Error('Failed to fetch weather data');

            const currentData = await currentResponse.json();
            
            // Static sunrise and sunset times
            const sunrise = '06:46';
            const sunset = '17:09';
            
            // Fetch 7-day forecast
            const forecastResponse = await fetch(
                `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${WEATHERBIT_API_KEY}&days=7`
            );

            let forecast = [];
            if (forecastResponse.ok) {
                const forecastData = await forecastResponse.json();
                forecast = forecastData.data || [];
            }

            if (currentData.data && currentData.data.length > 0) {
                const weather = currentData.data[0];
                const basicData = {
                    temperature: Math.round(weather.temp),
                    description: weather.weather.description,
                    icon: weather.weather.icon,
                    humidity: weather.rh,
                    windSpeed: weather.wind_spd,
                    precipitation: weather.precip || 0,
                    soilTemp: Math.round(weather.temp + 6),
                    sunrise: sunrise,
                    sunset: sunset,
                    feelsLike: Math.round(weather.app_temp || weather.temp),
                    pressure: weather.pres || 0,
                    uvIndex: weather.uv || 0,
                    dewPoint: Math.round(weather.dewpt || 0),
                };
                setWeatherData(basicData);
                setForecastData(forecast);
                generateCropAdvisory(basicData, forecast);
            }
        } catch (error) {
            console.error('Error fetching weather data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const generateCropAdvisory = (current, forecast) => {
        const advisories = [];
        const currentMonth = new Date().getMonth() + 1;

        // Temperature-based advisories
        if (current.temperature < 10) {
            advisories.push({
                type: 'warning',
                icon: '❄️',
                title: 'Cold Weather Alert',
                message: 'Temperatures are low. Protect sensitive crops with covers or move them indoors if possible.',
            });
        } else if (current.temperature > 35) {
            advisories.push({
                type: 'warning',
                icon: '🌡️',
                title: 'Heat Stress Warning',
                message: 'High temperatures detected. Increase irrigation frequency and provide shade for sensitive crops.',
            });
        }

        // Humidity-based advisories
        if (current.humidity < 40) {
            advisories.push({
                type: 'info',
                icon: '💧',
                title: 'Low Humidity',
                message: 'Humidity is low. Consider increasing irrigation and mulching to retain soil moisture.',
            });
        } else if (current.humidity > 80) {
            advisories.push({
                type: 'warning',
                icon: '🌧️',
                title: 'High Humidity',
                message: 'High humidity can promote fungal diseases. Ensure good air circulation and avoid overhead watering.',
            });
        }

        // Precipitation advisories
        if (forecast.length > 0) {
            const upcomingRain = forecast.slice(0, 3).some(day => day.precip > 5);
            if (upcomingRain) {
                advisories.push({
                    type: 'info',
                    icon: '🌧️',
                    title: 'Rain Expected',
                    message: 'Rain is forecasted in the next few days. Reduce irrigation and prepare for waterlogging.',
                });
            }
        }

        // Seasonal planting reminders based on user products
        userProducts.forEach(product => {
            const cropName = product.name.toLowerCase();
            // Add seasonal reminders based on crop type
            if (cropName.includes('rice') && (currentMonth >= 6 && currentMonth <= 7)) {
                advisories.push({
                    type: 'success',
                    icon: '🌾',
                    title: 'Rice Planting Season',
                    message: 'This is the ideal time to plant rice. Ensure fields are properly prepared and waterlogged.',
                });
            }
            if (cropName.includes('wheat') && (currentMonth >= 10 || currentMonth <= 11)) {
                advisories.push({
                    type: 'success',
                    icon: '🌾',
                    title: 'Wheat Planting Season',
                    message: 'Optimal time for wheat planting. Prepare seedbeds and ensure proper soil moisture.',
                });
            }
        });

        // UV Index advisory
        if (current.uvIndex > 7) {
            advisories.push({
                type: 'warning',
                icon: '☀️',
                title: 'High UV Index',
                message: 'UV levels are very high. Provide shade for sensitive crops and avoid working in direct sun during peak hours.',
            });
        }

        setCropAdvisory(advisories);
    };

    const fetchAIAdvisory = async () => {
        if (!weatherData || !locationName) {
            return;
        }
        
        if (!userProducts || userProducts.length === 0) {
            Alert.alert(
                'No Crops Added',
                'Please add crops in the Products section first to get personalized AI advice.',
                [{ text: 'OK' }]
            );
            return;
        }
        
        setLoadingAI(true);
        setAiAdvisory(null);
        try {
            const advisory = await getAICropAdvisory(
                weatherData,
                userProducts,
                locationName
            );
            if (advisory) {
                setAiAdvisory(advisory);
            }
        } catch (error) {
            console.error('Error fetching AI advisory:', error);
        } finally {
            setLoadingAI(false);
        }
    };

    const getWeatherIcon = (iconCode) => {
        if (!iconCode) return '☀️';
        const code = iconCode.toLowerCase();
        if (code.includes('c01')) return '☀️';
        if (code.includes('c02') || code.includes('c03')) return '⛅';
        if (code.includes('c04')) return '☁️';
        if (code.includes('a01') || code.includes('a02') || code.includes('a03')) return '🌧️';
        if (code.includes('t01') || code.includes('t02') || code.includes('t03')) return '⛈️';
        if (code.includes('s01') || code.includes('s02')) return '❄️';
        return '☁️';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
    };

    const onRefresh = async () => {
        setRefreshing(true);
        if (location) {
            await fetchWeatherData(location.latitude, location.longitude);
        } else {
            await requestLocationPermission();
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
                <View style={dynamicStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                    <Text style={[dynamicStyles.loadingText, { color: colors.textSecondary }]}>
                        Loading weather data...
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
                <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Weather & Crop Advisory</Text>
                <View style={dynamicStyles.placeholder} />
            </View>

            <ScrollView
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
                }
            >
                <View style={dynamicStyles.content}>
                    {/* Current Weather Card */}
                    {weatherData && (
                        <View style={[dynamicStyles.weatherCard, { backgroundColor: colors.card }]}>
                            <View style={dynamicStyles.weatherHeader}>
                                <View style={dynamicStyles.weatherHeaderLeft}>
                                    <Text 
                                        style={[dynamicStyles.locationText, { color: colors.textSecondary }]}
                                        numberOfLines={2}
                                        ellipsizeMode="tail"
                                    >
                                        📍 {locationName}
                                    </Text>
                                    <Text style={[dynamicStyles.temperature, { color: colors.text }]}>
                                        {weatherData.temperature > 0 ? '+' : ''}{weatherData.temperature}°C
                                    </Text>
                                    <Text style={[dynamicStyles.description, { color: colors.textSecondary }]}>
                                        {weatherData.description}
                                    </Text>
                                </View>
                                <Text style={dynamicStyles.weatherIcon}>
                                    {getWeatherIcon(weatherData.icon)}
                                </Text>
                            </View>

                            <View style={[dynamicStyles.metricsRow, { borderTopColor: colors.border }]}>
                                <View style={dynamicStyles.metric}>
                                    <Text style={dynamicStyles.metricIcon}>🌡️</Text>
                                    <Text style={[dynamicStyles.metricLabel, { color: colors.textSecondary }]}>Feels Like</Text>
                                    <Text style={[dynamicStyles.metricValue, { color: colors.text }]}>
                                        {weatherData.feelsLike}°C
                                    </Text>
                                </View>
                                <View style={dynamicStyles.metric}>
                                    <Text style={dynamicStyles.metricIcon}>💧</Text>
                                    <Text style={[dynamicStyles.metricLabel, { color: colors.textSecondary }]}>Humidity</Text>
                                    <Text style={[dynamicStyles.metricValue, { color: colors.text }]}>
                                        {weatherData.humidity}%
                                    </Text>
                                </View>
                                <View style={dynamicStyles.metric}>
                                    <Text style={dynamicStyles.metricIcon}>🌱</Text>
                                    <Text style={[dynamicStyles.metricLabel, { color: colors.textSecondary }]}>Soil Temp</Text>
                                    <Text style={[dynamicStyles.metricValue, { color: colors.text }]}>
                                        {weatherData.soilTemp}°C
                                    </Text>
                                </View>
                            </View>
                        </View>
                    )}

                    {/* Crop Advisory Section */}
                    {cropAdvisory.length > 0 && (
                        <View style={dynamicStyles.section}>
                            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Crop Advisory</Text>
                            {cropAdvisory.map((advisory, index) => (
                                <View
                                    key={index}
                                    style={[
                                        dynamicStyles.advisoryCard,
                                        { backgroundColor: colors.card },
                                        advisory.type === 'warning' && { borderLeftColor: '#FF9800', borderLeftWidth: 4 },
                                        advisory.type === 'success' && { borderLeftColor: '#4CAF50', borderLeftWidth: 4 },
                                        advisory.type === 'info' && { borderLeftColor: '#2196F3', borderLeftWidth: 4 },
                                    ]}
                                >
                                    <Text style={dynamicStyles.advisoryIcon}>{advisory.icon}</Text>
                                    <View style={dynamicStyles.advisoryContent}>
                                        <Text style={[dynamicStyles.advisoryTitle, { color: colors.text }]}>
                                            {advisory.title}
                                        </Text>
                                        <Text style={[dynamicStyles.advisoryMessage, { color: colors.textSecondary }]}>
                                            {advisory.message}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* AI-Powered Advisory Section */}
                    <View style={dynamicStyles.section}>
                        <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>🤖 AI-Powered Advisory</Text>
                        
                        {/* Upload Photo and Get AI Advice Buttons */}
                        <View style={dynamicStyles.aiButtonsRow}>
                            <TouchableOpacity
                                onPress={() => {
                                    Alert.alert(
                                        'Upload Photo',
                                        'Photo upload feature coming soon! You will be able to upload crop photos for AI analysis.',
                                        [{ text: 'OK' }]
                                    );
                                }}
                                style={[
                                    dynamicStyles.uploadPhotoButton,
                                    { backgroundColor: colors.surface, borderColor: colors.primary }
                                ]}
                            >
                                <Text style={[dynamicStyles.uploadPhotoButtonText, { color: colors.primary }]}>📷 Upload Photo</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={fetchAIAdvisory}
                                disabled={loadingAI || !weatherData}
                                style={[
                                    dynamicStyles.aiButton,
                                    { backgroundColor: colors.primary },
                                    (loadingAI || !weatherData) && { opacity: 0.5 }
                                ]}
                            >
                                {loadingAI ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={dynamicStyles.aiButtonText}>Get AI Advice</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                        
                        {/* Show user's products */}
                        {userProducts && userProducts.length > 0 && (
                            <View style={[dynamicStyles.productsInfoCard, { backgroundColor: colors.surface }]}>
                                <Text style={[dynamicStyles.productsInfoLabel, { color: colors.textSecondary }]}>
                                    Your Crops:
                                </Text>
                                <View style={dynamicStyles.productsList}>
                                    {userProducts.map((product, index) => {
                                        // Ensure product name is valid and not just a number
                                        const productName = product.name?.trim() || 'Unknown Crop';
                                        const isValidName = productName && !/^\d+$/.test(productName) && productName.length > 2;
                                        
                                        if (!isValidName) return null; // Skip invalid products
                                        
                                        return (
                                            <View key={`${product.name}-${index}`} style={[dynamicStyles.productTag, { backgroundColor: colors.primary + '20' }]}>
                                                <Text style={[dynamicStyles.productTagText, { color: colors.primary }]}>
                                                    {productName}
                                                    {product.category && ` (${product.category})`}
                                                </Text>
                                            </View>
                                        );
                                    })}
                                </View>
                            </View>
                        )}
                        
                        {userProducts && userProducts.length === 0 && (
                            <View style={[dynamicStyles.productsInfoCard, { backgroundColor: colors.surface }]}>
                                <Text style={[dynamicStyles.productsInfoLabel, { color: colors.textSecondary }]}>
                                    ⚠️ No crops added yet. Add crops in the Products section to get personalized advice.
                                </Text>
                            </View>
                        )}
                        
                        {aiAdvisory && (
                            <View style={[dynamicStyles.aiAdvisoryCard, { backgroundColor: colors.card }]}>
                                <Text style={[dynamicStyles.aiAdvisoryText, { color: colors.text }]}>
                                    {aiAdvisory}
                                </Text>
                            </View>
                        )}
                        {!aiAdvisory && !loadingAI && (
                            <View style={[dynamicStyles.aiAdvisoryCard, { backgroundColor: colors.card }]}>
                                <Text style={[dynamicStyles.aiAdvisoryPlaceholder, { color: colors.textSecondary }]}>
                                    {userProducts && userProducts.length > 0 
                                        ? `Tap "Get AI Advice" to receive personalized farming recommendations for your crops: ${userProducts.map(p => p.name).join(', ')}`
                                        : 'Add crops in the Products section, then tap "Get AI Advice" for personalized recommendations.'}
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* 7-Day Forecast */}
                    {forecastData.length > 0 && (
                        <View style={dynamicStyles.section}>
                            <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>7-Day Forecast</Text>
                            {forecastData.map((day, index) => (
                                <View
                                    key={index}
                                    style={[dynamicStyles.forecastCard, { backgroundColor: colors.card }]}
                                >
                                    <View style={dynamicStyles.forecastRow}>
                                        <View style={dynamicStyles.forecastDate}>
                                            <Text style={[dynamicStyles.forecastDay, { color: colors.text }]}>
                                                {index === 0 ? 'Today' : formatDate(day.valid_date)}
                                            </Text>
                                            <Text style={[dynamicStyles.forecastDescription, { color: colors.textSecondary }]}>
                                                {day.weather?.description || 'Clear'}
                                            </Text>
                                        </View>
                                        <View style={dynamicStyles.forecastTemp}>
                                            <Text style={[dynamicStyles.forecastHigh, { color: colors.text }]}>
                                                {Math.round(day.high_temp)}°
                                            </Text>
                                            <Text style={[dynamicStyles.forecastLow, { color: colors.textSecondary }]}>
                                                {Math.round(day.low_temp)}°
                                            </Text>
                                        </View>
                                        <View style={dynamicStyles.forecastDetails}>
                                            <Text style={[dynamicStyles.forecastDetail, { color: colors.textSecondary }]}>
                                                💧 {day.rh}%
                                            </Text>
                                            <Text style={[dynamicStyles.forecastDetail, { color: colors.textSecondary }]}>
                                                🌧️ {day.precip?.toFixed(1) || 0}mm
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            </ScrollView>
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
    weatherCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
    },
    weatherHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    weatherHeaderLeft: {
        flex: 1,
        marginRight: 12,
    },
    locationText: {
        fontSize: 14,
        marginBottom: 8,
        flexWrap: 'wrap',
    },
    temperature: {
        fontSize: 48,
        fontWeight: '700',
        marginBottom: 4,
    },
    description: {
        fontSize: 16,
        textTransform: 'capitalize',
    },
    weatherIcon: {
        fontSize: 64,
    },
    metricsRow: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        paddingTop: 20,
        borderTopWidth: 1,
    },
    metric: {
        alignItems: 'center',
    },
    metricIcon: {
        fontSize: 24,
        marginBottom: 8,
    },
    metricLabel: {
        fontSize: 12,
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 16,
        fontWeight: '600',
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
    },
    advisoryCard: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderLeftWidth: 4,
    },
    advisoryIcon: {
        fontSize: 32,
        marginRight: 12,
    },
    advisoryContent: {
        flex: 1,
    },
    advisoryTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    advisoryMessage: {
        fontSize: 14,
        lineHeight: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    aiButtonsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 16,
        flexWrap: 'wrap',
    },
    uploadPhotoButton: {
        flex: 1,
        minWidth: 140,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
    },
    uploadPhotoButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    aiButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    aiButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    aiAdvisoryCard: {
        borderRadius: 12,
        padding: 16,
        marginTop: 8,
    },
    aiAdvisoryText: {
        fontSize: 14,
        lineHeight: 22,
    },
    aiAdvisoryPlaceholder: {
        fontSize: 14,
        lineHeight: 20,
        fontStyle: 'italic',
    },
    productsInfoCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    productsInfoLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    productsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    productTag: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginRight: 8,
        marginBottom: 4,
    },
    productTagText: {
        fontSize: 13,
        fontWeight: '600',
    },
    forecastCard: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
    },
    forecastRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    forecastDate: {
        flex: 1,
    },
    forecastDay: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 4,
    },
    forecastDescription: {
        fontSize: 12,
        textTransform: 'capitalize',
    },
    forecastTemp: {
        flexDirection: 'row',
        alignItems: 'center',
        marginHorizontal: 16,
    },
    forecastHigh: {
        fontSize: 18,
        fontWeight: '600',
        marginRight: 8,
    },
    forecastLow: {
        fontSize: 16,
    },
    forecastDetails: {
        alignItems: 'flex-end',
    },
    forecastDetail: {
        fontSize: 12,
        marginTop: 2,
    },
});

export default FarmerWeatherScreen;

