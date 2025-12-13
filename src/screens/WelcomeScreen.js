
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, BackHandler, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
    const router = useRouter();

    useEffect(() => {
        const backAction = () => {
            // Show quit confirmation on welcome screen
            Alert.alert(
                'Exit App',
                'Do you want to quit?',
                [
                    {
                        text: 'Cancel',
                        onPress: () => null,
                        style: 'cancel',
                    },
                    {
                        text: 'Quit',
                        onPress: () => {
                            if (Platform.OS === 'android') {
                                BackHandler.exitApp();
                            } else {
                                // For iOS, we can't exit programmatically
                                Alert.alert('Info', 'Please use the home button to exit the app.');
                            }
                        },
                    },
                ],
                { cancelable: false }
            );
            return true; // Prevent default back behavior
        };

        const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
        return () => backHandler.remove();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header / Top Section usually empty or logo */}
            <View style={styles.header}>
                <View style={styles.statusBar} />
            </View>

            <View style={styles.content}>
                <Text style={styles.appName}>Hamro Krishi</Text>
                <Text style={styles.title}>
                    Smart Farming{'\n'}and <Text style={styles.highlight}>Agriculture</Text>{'\n'}App for <Text style={styles.highlight}>Farmers</Text>
                </Text>

                <TouchableOpacity
                    style={styles.button}
                    onPress={() => router.push('/role-selection')}
                >
                    <Text style={styles.buttonText}>Join Now</Text>
                </TouchableOpacity>

                {/* Main Illustration */}
                <View style={styles.imageContainer}>
                    <Image
                        source={require('../../assets/home/home.png')}
                        style={styles.image}
                        resizeMode="contain"
                    />
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 24,
    },
    header: {
        height: 50,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
    },
    statusBar: {
        // Placeholder if needed
    },
    content: {
        flex: 1,
        paddingTop: 40,
    },
    appName: {
        fontSize: 36,
        fontWeight: '800',
        color: '#10893E',
        marginBottom: 16,
        fontFamily: 'System',
        textAlign: 'left',
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#333333',
        lineHeight: 44,
        marginBottom: 30,
        fontFamily: 'System',
    },
    highlight: {
        color: '#10893E',
    },
    button: {
        backgroundColor: '#0A5C5A',
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 30,
        alignSelf: 'flex-start',
        marginBottom: 40,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    buttonText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 16,
    },
    imageContainer: {
        flex: 1,
        justifyContent: 'flex-end',
        alignItems: 'center',
    },
    image: {
        width: width - 48,
        height: width,
        marginBottom: 20,
        borderRadius: 20,
    },
});

export default WelcomeScreen;
