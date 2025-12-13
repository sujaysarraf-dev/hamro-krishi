import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, ActivityIndicator, Alert, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../config/supabase';
import * as Location from 'expo-location';

const { width } = Dimensions.get('window');
const WEATHERBIT_API_KEY = 'b6d691f2b36741c0b7d036f5c88b7d30';

const FarmerHomeScreen = () => {
    const { colors, isDark } = useTheme();
    const dynamicStyles = getStyles(colors, isDark);
    const [searchQuery, setSearchQuery] = useState('');
    const [userName, setUserName] = useState('');
    const [loading, setLoading] = useState(true);
    const [weatherLoading, setWeatherLoading] = useState(true);
    const [location, setLocation] = useState(null);
    const [locationName, setLocationName] = useState('Loading location...');
    const [weatherData, setWeatherData] = useState(null);
    const [detailedWeatherData, setDetailedWeatherData] = useState(null);
    const [showWeatherModal, setShowWeatherModal] = useState(false);
    
    // Get current date formatted
    const getFormattedDate = () => {
        const today = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const day = days[today.getDay()];
        const date = today.getDate();
        const month = months[today.getMonth()];
        const year = today.getFullYear();
        return `${day}, ${date.toString().padStart(2, '0')} ${month} ${year}`;
    };

    const [currentDate] = useState(getFormattedDate());

    useEffect(() => {
        loadUserData();
        requestLocationPermission();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadUserData();
        }, [])
    );

    const loadUserData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (user) {
                const { data: profile } = await supabase
                    .from('user_profiles')
                    .select('full_name')
                    .eq('id', user.id)
                    .maybeSingle();

                if (profile?.full_name) {
                    setUserName(profile.full_name);
                } else if (user.email) {
                    // Use email username part if no full name
                    const emailName = user.email.split('@')[0];
                    setUserName(emailName.charAt(0).toUpperCase() + emailName.slice(1));
                } else {
                    setUserName('Farmer');
                }
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            setUserName('Farmer');
        } finally {
            setLoading(false);
        }
    };

    const requestLocationPermission = async () => {
        try {
            setWeatherLoading(true);
            // Request location permissions
            const { status } = await Location.requestForegroundPermissionsAsync();
            
            if (status !== 'granted') {
                Alert.alert(
                    'Permission Denied',
                    'Location permission is required to show weather data. Please enable it in settings.',
                    [{ text: 'OK' }]
                );
                setLocationName('Location not available');
                setWeatherLoading(false);
                return;
            }

            // Get current location
            const currentLocation = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.Balanced,
            });

            setLocation(currentLocation.coords);

            // Reverse geocode to get location name in English
            const reverseGeocode = await Location.reverseGeocodeAsync({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                language: 'en', // Request English language
            });

            if (reverseGeocode && reverseGeocode.length > 0) {
                const address = reverseGeocode[0];
                const locationParts = [];
                
                // Add street/suburb/neighborhood first (most specific)
                if (address.street) {
                    locationParts.push(address.street);
                } else if (address.district) {
                    locationParts.push(address.district);
                } else if (address.subregion) {
                    locationParts.push(address.subregion);
                } else if (address.name) {
                    locationParts.push(address.name);
                }
                
                // Add city
                if (address.city) {
                    locationParts.push(address.city);
                }
                
                // Add region/state if different from city
                if (address.region && address.region !== address.city) {
                    locationParts.push(address.region);
                }
                
                // Add country only if we don't have enough info
                if (locationParts.length === 0 && address.country) {
                    locationParts.push(address.country);
                }
                
                const preciseLocation = locationParts.length > 0 ? locationParts.join(', ') : 'Current Location';
                setLocationName(preciseLocation);
                
                // Update detailed weather data with precise location
                setDetailedWeatherData(prev => prev ? {
                    ...prev,
                    cityName: preciseLocation,
                } : null);
            } else {
                setLocationName('Current Location');
            }

            // Fetch weather data
            await fetchWeatherData(currentLocation.coords.latitude, currentLocation.coords.longitude);
        } catch (error) {
            console.error('Error getting location:', error);
            setLocationName('Location not available');
            setWeatherLoading(false);
        }
    };

    const fetchWeatherData = async (lat, lon) => {
        try {
            // Fetch current weather
            const currentResponse = await fetch(
                `https://api.weatherbit.io/v2.0/current?lat=${lat}&lon=${lon}&key=${WEATHERBIT_API_KEY}&units=M`
            );
            
            if (!currentResponse.ok) {
                throw new Error('Failed to fetch weather data');
            }

            const currentData = await currentResponse.json();
            
            // Fetch daily forecast for sunrise/sunset
            let sunrise = '6:00 am';
            let sunset = '6:00 pm';
            try {
                const forecastResponse = await fetch(
                    `https://api.weatherbit.io/v2.0/forecast/daily?lat=${lat}&lon=${lon}&key=${WEATHERBIT_API_KEY}&days=1`
                );
                if (forecastResponse.ok) {
                    const forecastData = await forecastResponse.json();
                    if (forecastData.data && forecastData.data.length > 0) {
                        sunrise = forecastData.data[0].sunrise || sunrise;
                        sunset = forecastData.data[0].sunset || sunset;
                    }
                }
            } catch (forecastError) {
                console.log('Could not fetch sunrise/sunset:', forecastError);
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
                    soilTemp: Math.round(weather.temp + 6), // Approximate soil temp (usually 5-7°C warmer)
                    sunrise: sunrise,
                    sunset: sunset,
                };
                setWeatherData(basicData);
                
                // Store detailed weather data for modal (locationName will be updated after reverse geocoding)
                setDetailedWeatherData({
                    ...basicData,
                    feelsLike: Math.round(weather.app_temp || weather.temp),
                    pressure: weather.pres || 0,
                    visibility: weather.vis || 0,
                    uvIndex: weather.uv || 0,
                    dewPoint: Math.round(weather.dewpt || 0),
                    windDirection: weather.wind_cdir || 'N',
                    windDirectionFull: weather.wind_cdir_full || 'North',
                    cloudCoverage: weather.clouds || 0,
                    aqi: weather.aqi || null,
                    cityName: locationName || weather.city_name || 'Current Location',
                    countryCode: weather.country_code || '',
                    timezone: weather.timezone || '',
                    observationTime: weather.ob_time || new Date().toISOString(),
                });
            }
        } catch (error) {
            console.error('Error fetching weather data:', error);
            // Set default values on error
            setWeatherData({
                temperature: 16,
                description: 'Clear sky',
                humidity: 59,
                windSpeed: 6,
                precipitation: 0,
                soilTemp: 22,
                sunrise: '5:25 am',
                sunset: '8:04 pm',
            });
        } finally {
            setWeatherLoading(false);
        }
    };

    const getWeatherIcon = (iconCode) => {
        // Map Weatherbit icon codes to emojis
        // Weatherbit uses codes like 'c01d' for clear sky day, 'c02d' for few clouds, etc.
        if (!iconCode) return '☀️';
        
        const code = iconCode.toLowerCase();
        if (code.includes('c01')) return '☀️'; // Clear sky
        if (code.includes('c02') || code.includes('c03')) return '⛅'; // Few/Scattered clouds
        if (code.includes('c04')) return '☁️'; // Broken clouds
        if (code.includes('a01') || code.includes('a02') || code.includes('a03')) return '🌧️'; // Rain
        if (code.includes('t01') || code.includes('t02') || code.includes('t03')) return '⛈️'; // Thunderstorm
        if (code.includes('s01') || code.includes('s02') || code.includes('s03') || code.includes('s04') || code.includes('s05') || code.includes('s06')) return '❄️'; // Snow
        if (code.includes('f01')) return '🌫️'; // Fog
        return '☁️'; // Default
    };

    const formatTime = (timeString) => {
        if (!timeString) return '6:00 am';
        // Weatherbit returns time in format "HH:MM" (24-hour)
        try {
            const [hours, minutes] = timeString.split(':');
            const hour = parseInt(hours);
            const ampm = hour >= 12 ? 'pm' : 'am';
            const displayHour = hour % 12 || 12;
            return `${displayHour}:${minutes} ${ampm}`;
        } catch (e) {
            return timeString;
        }
    };

    const handleRefresh = async () => {
        if (location) {
            setWeatherLoading(true);
            await fetchWeatherData(location.latitude, location.longitude);
        } else {
            // If no location, request permission again
            await requestLocationPermission();
        }
    };

    const commodities = [
        { id: 1, name: 'Rice', icon: '🌾' },
        { id: 2, name: 'Corn', icon: '🌽' },
        { id: 3, name: 'Grapes', icon: '🍇' },
        { id: 4, name: 'Potato', icon: '🥔' },
        { id: 5, name: 'Olive', icon: '🫒' },
    ];

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]} edges={['top']}>
            {/* Top Header */}
            <View style={[dynamicStyles.header, { backgroundColor: colors.primary }]}>
                <View style={dynamicStyles.headerContent}>
                    <View>
                        {loading ? (
                            <ActivityIndicator color="#FFFFFF" size="small" />
                        ) : (
                            <Text style={dynamicStyles.headerTitle}>Hello, {userName || 'Farmer'}</Text>
                        )}
                        <View style={dynamicStyles.dateContainer}>
                            <Text style={dynamicStyles.dateText}>{currentDate}</Text>
                        </View>
                    </View>
                    <TouchableOpacity 
                        style={dynamicStyles.refreshButton}
                        onPress={handleRefresh}
                        disabled={weatherLoading}
                    >
                        <Text style={dynamicStyles.refreshIcon}>🔄</Text>
                    </TouchableOpacity>
                </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false} style={dynamicStyles.scrollView}>
                    <View style={dynamicStyles.content}>
                        {/* Search Bar */}
                    <View style={[dynamicStyles.searchContainer, { backgroundColor: isDark ? colors.surface : '#E8F5E9' }]}>
                        <Text style={dynamicStyles.searchIcon}>🔍</Text>
                        <TextInput
                            style={[dynamicStyles.searchInput, { color: colors.text }]}
                            placeholder="Search here..."
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        <TouchableOpacity>
                            <Text style={dynamicStyles.micIcon}>🎤</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Weather Card */}
                    <TouchableOpacity 
                        style={[dynamicStyles.weatherCard, { backgroundColor: colors.card }]}
                        onPress={() => setShowWeatherModal(true)}
                        activeOpacity={0.8}
                    >
                        {weatherLoading ? (
                            <View style={dynamicStyles.weatherLoadingContainer}>
                                <ActivityIndicator size="large" color={colors.primary} />
                                <Text style={[dynamicStyles.loadingText, { color: colors.textSecondary }]}>Loading weather...</Text>
                            </View>
                        ) : (
                            <>
                                <View style={dynamicStyles.weatherHeader}>
                                    <View style={dynamicStyles.locationContainer}>
                                        <Text style={dynamicStyles.locationIcon}>📍</Text>
                                        <Text style={[dynamicStyles.locationText, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
                                            {locationName}
                                        </Text>
                                    </View>
                                    <View style={dynamicStyles.temperatureContainer}>
                                        <Text style={[dynamicStyles.temperature, { color: colors.text }]} numberOfLines={1}>
                                            {weatherData ? `${weatherData.temperature > 0 ? '+' : ''}${weatherData.temperature}°C` : '+16°C'}
                                        </Text>
                                        <Text style={dynamicStyles.weatherIcon}>
                                            {weatherData ? getWeatherIcon(weatherData.icon) : '☁️'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Weather Metrics */}
                                <View style={dynamicStyles.weatherMetrics}>
                                    <View style={dynamicStyles.metricItem}>
                                        <Text style={dynamicStyles.metricIcon}>🌡️</Text>
                                        <Text style={[dynamicStyles.metricLabel, { color: colors.textSecondary }]}>Soil Temp</Text>
                                        <Text style={[dynamicStyles.metricValue, { color: colors.text }]}>
                                            {weatherData ? `+${weatherData.soilTemp} C` : '+22 C'}
                                        </Text>
                                    </View>
                                    <View style={dynamicStyles.metricItem}>
                                        <Text style={dynamicStyles.metricIcon}>💧</Text>
                                        <Text style={[dynamicStyles.metricLabel, { color: colors.textSecondary }]}>Humidity</Text>
                                        <Text style={[dynamicStyles.metricValue, { color: colors.text }]}>
                                            {weatherData ? `${weatherData.humidity}%` : '59%'}
                                        </Text>
                                    </View>
                                    <View style={dynamicStyles.metricItem}>
                                        <Text style={dynamicStyles.metricIcon}>💨</Text>
                                        <Text style={[dynamicStyles.metricLabel, { color: colors.textSecondary }]}>Wind</Text>
                                        <Text style={[dynamicStyles.metricValue, { color: colors.text }]}>
                                            {weatherData ? `${weatherData.windSpeed.toFixed(1)} m/s` : '6 m/s'}
                                        </Text>
                                    </View>
                                    <View style={dynamicStyles.metricItem}>
                                        <Text style={dynamicStyles.metricIcon}>🌧️</Text>
                                        <Text style={[dynamicStyles.metricLabel, { color: colors.textSecondary }]}>Precipitation</Text>
                                        <Text style={[dynamicStyles.metricValue, { color: colors.text }]}>
                                            {weatherData ? `${weatherData.precipitation.toFixed(1)} mm` : '0 mm'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Sunrise/Sunset */}
                                <View style={dynamicStyles.sunriseSunsetContainer}>
                                    <View style={dynamicStyles.sunTimeContainer}>
                                        <Text style={[dynamicStyles.sunTimeLabel, { color: colors.textSecondary }]}>Sunrise</Text>
                                        <Text style={[dynamicStyles.sunTime, { color: colors.text }]}>
                                            {weatherData ? formatTime(weatherData.sunrise) : '5:25 am'}
                                        </Text>
                                    </View>
                                    <View style={dynamicStyles.sunArcContainer}>
                                        <View style={[dynamicStyles.sunArc, { borderColor: colors.border }]}>
                                            <Text style={dynamicStyles.sunIcon}>☀️</Text>
                                        </View>
                                    </View>
                                    <View style={dynamicStyles.sunTimeContainer}>
                                        <Text style={[dynamicStyles.sunTimeLabel, { color: colors.textSecondary }]}>Sunset</Text>
                                        <Text style={[dynamicStyles.sunTime, { color: colors.text }]}>
                                            {weatherData ? formatTime(weatherData.sunset) : '8:04 pm'}
                                        </Text>
                                    </View>
                                </View>
                            </>
                        )}
                    </TouchableOpacity>

                    {/* Commodities and Food Section */}
                    <View style={dynamicStyles.section}>
                        <Text style={[dynamicStyles.sectionTitle, { color: colors.text }]}>Commodities and Food</Text>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            style={dynamicStyles.commoditiesScroll}
                            contentContainerStyle={dynamicStyles.commoditiesContent}
                        >
                            {commodities.map((commodity) => (
                                <TouchableOpacity 
                                    key={commodity.id} 
                                    style={[dynamicStyles.commodityCard, { backgroundColor: colors.card }]}
                                >
                                    <Text style={dynamicStyles.commodityIcon}>{commodity.icon}</Text>
                                    <Text style={[dynamicStyles.commodityName, { color: colors.text }]}>{commodity.name}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>
                </View>
            </ScrollView>

            {/* Weather Details Modal */}
            <Modal
                visible={showWeatherModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowWeatherModal(false)}
            >
                <View style={dynamicStyles.modalOverlay}>
                    <View style={[dynamicStyles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={dynamicStyles.modalHeader}>
                            <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>Weather Details</Text>
                            <TouchableOpacity 
                                onPress={() => setShowWeatherModal(false)}
                                style={dynamicStyles.closeButton}
                            >
                                <Text style={[dynamicStyles.closeButtonText, { color: colors.text }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {detailedWeatherData ? (
                                <View style={dynamicStyles.modalBody}>
                                    {/* Location */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>📍</Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Location</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {locationName || detailedWeatherData?.cityName || 'Current Location'}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Temperature */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>🌡️</Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Temperature</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {detailedWeatherData.temperature > 0 ? '+' : ''}{detailedWeatherData.temperature}°C
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Feels Like */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>🤲</Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Feels Like</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {detailedWeatherData.feelsLike > 0 ? '+' : ''}{detailedWeatherData.feelsLike}°C
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Weather Description */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>
                                            {getWeatherIcon(detailedWeatherData.icon)}
                                        </Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Condition</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {detailedWeatherData.description}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Humidity */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>💧</Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Humidity</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {detailedWeatherData.humidity}%
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Wind */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>💨</Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Wind Speed</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {detailedWeatherData.windSpeed.toFixed(1)} m/s {detailedWeatherData.windDirection}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Wind Direction */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>🧭</Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Wind Direction</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {detailedWeatherData.windDirectionFull}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Pressure */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>📊</Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Pressure</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {detailedWeatherData.pressure.toFixed(1)} mb
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Visibility */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>👁️</Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Visibility</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {detailedWeatherData.visibility.toFixed(1)} km
                                            </Text>
                                        </View>
                                    </View>

                                    {/* UV Index */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>☀️</Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>UV Index</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {detailedWeatherData.uvIndex}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Dew Point */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>💎</Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Dew Point</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {detailedWeatherData.dewPoint > 0 ? '+' : ''}{detailedWeatherData.dewPoint}°C
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Cloud Coverage */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>☁️</Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Cloud Coverage</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {detailedWeatherData.cloudCoverage}%
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Precipitation */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>🌧️</Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Precipitation</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {detailedWeatherData.precipitation.toFixed(1)} mm
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Soil Temperature */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>🌱</Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Soil Temperature</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                +{detailedWeatherData.soilTemp}°C
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Sunrise */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>🌅</Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Sunrise</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {formatTime(detailedWeatherData.sunrise)}
                                            </Text>
                                        </View>
                                    </View>

                                    {/* Sunset */}
                                    <View style={[dynamicStyles.detailSection, { borderBottomColor: colors.border }]}>
                                        <Text style={dynamicStyles.detailIcon}>🌇</Text>
                                        <View style={dynamicStyles.detailContent}>
                                            <Text style={[dynamicStyles.detailLabel, { color: colors.textSecondary }]}>Sunset</Text>
                                            <Text style={[dynamicStyles.detailValue, { color: colors.text }]}>
                                                {formatTime(detailedWeatherData.sunset)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            ) : (
                                <View style={dynamicStyles.modalBody}>
                                    <Text style={[dynamicStyles.noDataText, { color: colors.textSecondary }]}>
                                        Weather data not available
                                    </Text>
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
        backgroundColor: colors.background,
    },
    header: {
        paddingTop: 20,
        paddingBottom: 20,
        paddingHorizontal: 20,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 8,
    },
    dateContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dateText: {
        fontSize: 14,
        color: '#FFFFFF',
    },
    refreshButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    refreshIcon: {
        fontSize: 20,
        color: '#FFFFFF',
    },
    scrollView: {
        flex: 1,
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
        marginBottom: 20,
        backgroundColor: '#E8F5E9',
    },
    searchIcon: {
        fontSize: 20,
        marginRight: 12,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    micIcon: {
        fontSize: 20,
        marginLeft: 12,
    },
    weatherCard: {
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        backgroundColor: colors.card,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    weatherHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 20,
    },
    locationContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        marginRight: 12,
        minWidth: 0,
    },
    locationIcon: {
        fontSize: 16,
        marginRight: 6,
    },
    locationText: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
        marginLeft: 6,
    },
    weatherLoadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
        color: colors.textSecondary,
    },
    temperatureContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        flexShrink: 0,
    },
    temperature: {
        fontSize: 32,
        fontWeight: '700',
        color: colors.text,
        marginRight: 8,
        flexShrink: 0,
    },
    weatherIcon: {
        fontSize: 32,
    },
    weatherMetrics: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    metricItem: {
        alignItems: 'center',
        flex: 1,
    },
    metricIcon: {
        fontSize: 24,
        marginBottom: 6,
    },
    metricLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    metricValue: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    sunriseSunsetContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
    sunTimeContainer: {
        alignItems: 'center',
    },
    sunTimeLabel: {
        fontSize: 11,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    sunTime: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    sunArcContainer: {
        flex: 1,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    sunArc: {
        width: 80,
        height: 40,
        borderTopWidth: 2,
        borderLeftWidth: 2,
        borderRightWidth: 2,
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        borderColor: colors.border,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 8,
    },
    sunIcon: {
        fontSize: 20,
    },
    section: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
    },
    commoditiesScroll: {
        marginHorizontal: -20,
        paddingHorizontal: 20,
    },
    commoditiesContent: {
        paddingRight: 20,
    },
    commodityCard: {
        width: 100,
        height: 100,
        borderRadius: 12,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    commodityIcon: {
        fontSize: 40,
        marginBottom: 8,
    },
    commodityName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.card,
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
        color: colors.text,
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
        color: colors.text,
    },
    modalBody: {
        padding: 20,
    },
    detailSection: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    detailIcon: {
        fontSize: 24,
        marginRight: 16,
        width: 32,
    },
    detailContent: {
        flex: 1,
    },
    detailLabel: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 4,
    },
    detailValue: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    noDataText: {
        fontSize: 16,
        textAlign: 'center',
        padding: 40,
        color: colors.textSecondary,
    },
});

export default FarmerHomeScreen;
