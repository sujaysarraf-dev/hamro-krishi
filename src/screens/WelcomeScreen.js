
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width } = Dimensions.get('window');

const WelcomeScreen = () => {
    const router = useRouter();

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
