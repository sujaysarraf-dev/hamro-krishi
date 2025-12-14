import React, { createContext, useState, useEffect, useContext } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LanguageContext = createContext();

export const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within LanguageProvider');
    }
    return context;
};

// Translation keys
const translations = {
    en: {
        // Common
        back: 'Back',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        close: 'Close',
        ok: 'OK',
        yes: 'Yes',
        no: 'No',
        loading: 'Loading...',
        error: 'Error',
        success: 'Success',
        
        // Settings
        settings: 'Settings',
        language: 'Language',
        appearance: 'Appearance',
        theme: 'Theme',
        lightMode: 'Light mode',
        darkMode: 'Dark mode',
        systemDefault: 'System default',
        notifications: 'Notifications',
        pushNotifications: 'Push Notifications',
        receivePushNotifications: 'Receive push notifications',
        emailUpdates: 'Email Updates',
        receiveEmailUpdates: 'Receive email updates',
        about: 'About',
        privacyPolicy: 'Privacy Policy',
        termsOfService: 'Terms of Service',
        english: 'English',
        nepali: 'Nepali',
        
        // Home
        home: 'Home',
        hello: 'Hello',
        search: 'Search',
        weather: 'Weather',
        products: 'Products',
        orders: 'Orders',
        profile: 'Profile',
        logout: 'Logout',
        
        // Weather
        weatherAndCropAdvisory: 'Weather & Crop Advisory',
        currentWeather: 'Current Weather',
        temperature: 'Temperature',
        humidity: 'Humidity',
        windSpeed: 'Wind Speed',
        forecast: 'Forecast',
        aiPoweredAdvisory: 'AI-Powered Advisory',
        getAiAdvice: 'Get AI Advice',
        uploadPhoto: 'Upload Photo',
        cropAdvisory: 'Crop Advisory',
        
        // Products
        myProducts: 'My Products',
        addProduct: 'Add Product',
        productName: 'Product Name',
        price: 'Price',
        quantity: 'Quantity',
        category: 'Category',
        description: 'Description',
        organic: 'Organic',
        
        // Chatbot
        farmingAssistant: 'Farming Assistant',
        askAboutFarming: 'Ask me anything about farming',
        askAboutFarmingPlaceholder: 'Ask about farming...',
        send: 'Send',
        thinking: 'Thinking...',
        
        // Profile
        editProfile: 'Edit Profile',
        fullName: 'Full Name',
        phone: 'Phone',
        role: 'Role',
        farmer: 'Farmer',
        regular: 'Regular',
        
        // Common actions
        continue: 'Continue',
        submit: 'Submit',
        confirm: 'Confirm',
    },
    ne: {
        // Common
        back: 'पछाडि',
        save: 'बचत गर्नुहोस्',
        cancel: 'रद्द गर्नुहोस्',
        delete: 'मेटाउनुहोस्',
        edit: 'सम्पादन गर्नुहोस्',
        close: 'बन्द गर्नुहोस्',
        ok: 'ठीक छ',
        yes: 'हो',
        no: 'होइन',
        loading: 'लोड हुँदै...',
        error: 'त्रुटि',
        success: 'सफल',
        
        // Settings
        settings: 'सेटिङहरू',
        language: 'भाषा',
        appearance: 'देखावट',
        theme: 'थीम',
        lightMode: 'उज्यालो मोड',
        darkMode: 'अँध्यारो मोड',
        systemDefault: 'प्रणाली पूर्वनिर्धारित',
        notifications: 'सूचनाहरू',
        pushNotifications: 'पुश सूचनाहरू',
        receivePushNotifications: 'पुश सूचनाहरू प्राप्त गर्नुहोस्',
        emailUpdates: 'इमेल अपडेटहरू',
        receiveEmailUpdates: 'इमेल अपडेटहरू प्राप्त गर्नुहोस्',
        about: 'बारेमा',
        privacyPolicy: 'गोपनीयता नीति',
        termsOfService: 'सेवा सर्तहरू',
        english: 'अङ्ग्रेजी',
        nepali: 'नेपाली',
        
        // Home
        home: 'घर',
        hello: 'नमस्ते',
        search: 'खोज',
        weather: 'मौसम',
        products: 'उत्पादनहरू',
        orders: 'अर्डरहरू',
        profile: 'प्रोफाइल',
        logout: 'लगआउट',
        
        // Weather
        weatherAndCropAdvisory: 'मौसम र बाली सल्लाह',
        currentWeather: 'हालको मौसम',
        temperature: 'तापक्रम',
        humidity: 'नमी',
        windSpeed: 'हावाको गति',
        forecast: 'पूर्वानुमान',
        aiPoweredAdvisory: 'AI-शक्ति सल्लाह',
        getAiAdvice: 'AI सल्लाह लिनुहोस्',
        uploadPhoto: 'फोटो अपलोड गर्नुहोस्',
        cropAdvisory: 'बाली सल्लाह',
        
        // Products
        myProducts: 'मेरा उत्पादनहरू',
        addProduct: 'उत्पादन थप्नुहोस्',
        productName: 'उत्पादनको नाम',
        price: 'मूल्य',
        quantity: 'मात्रा',
        category: 'श्रेणी',
        description: 'विवरण',
        organic: 'जैविक',
        
        // Chatbot
        farmingAssistant: 'खेती सहायक',
        askAboutFarming: 'खेतीको बारेमा जुनसुकै कुरा सोध्नुहोस्',
        askAboutFarmingPlaceholder: 'खेतीको बारेमा सोध्नुहोस्...',
        send: 'पठाउनुहोस्',
        thinking: 'सोच्दै...',
        
        // Profile
        editProfile: 'प्रोफाइल सम्पादन गर्नुहोस्',
        fullName: 'पूरा नाम',
        phone: 'फोन',
        role: 'भूमिका',
        farmer: 'किसान',
        regular: 'नियमित',
        
        // Common actions
        continue: 'जारी राख्नुहोस्',
        submit: 'पेश गर्नुहोस्',
        confirm: 'पुष्टि गर्नुहोस्',
    },
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('en'); // 'en' or 'ne'

    useEffect(() => {
        loadLanguagePreference();
    }, []);

    const loadLanguagePreference = async () => {
        try {
            const savedLanguage = await AsyncStorage.getItem('language_preference');
            if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ne')) {
                setLanguage(savedLanguage);
            } else {
                // Default to English
                setLanguage('en');
            }
        } catch (error) {
            console.error('Error loading language preference:', error);
            setLanguage('en');
        }
    };

    const setLanguagePreference = async (newLanguage) => {
        try {
            setLanguage(newLanguage);
            await AsyncStorage.setItem('language_preference', newLanguage);
        } catch (error) {
            console.error('Error saving language preference:', error);
        }
    };

    const t = (key) => {
        return translations[language]?.[key] || translations.en[key] || key;
    };

    return (
        <LanguageContext.Provider
            value={{
                language,
                setLanguage: setLanguagePreference,
                t,
            }}
        >
            {children}
        </LanguageContext.Provider>
    );
};

