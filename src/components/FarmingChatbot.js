import React, { useState, useRef, useEffect } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    Modal, 
    TouchableOpacity, 
    TextInput, 
    ScrollView, 
    ActivityIndicator,
    Platform,
    Animated,
    Dimensions
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { getAIChatResponse } from '../services/geminiService';
import * as Animatable from 'react-native-animatable';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Voice support - using expo-speech if available
let Speech = null;
try {
    if (Platform.OS !== 'web') {
        const expoSpeech = require('expo-speech');
        Speech = expoSpeech.default || expoSpeech;
    }
} catch (e) {
    console.warn('expo-speech not available:', e);
}

const FarmingChatbot = ({ visible, onClose }) => {
    const { colors, isDark } = useTheme();
    const [messages, setMessages] = useState([
        {
            id: 1,
            text: "Namaste! I'm your farming assistant. Ask me anything about farming, crops, techniques, or agricultural practices in Nepal! 🌾",
            isBot: true,
            timestamp: new Date()
        }
    ]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const scrollViewRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
        } else {
            fadeAnim.setValue(0);
        }
    }, [visible]);

    useEffect(() => {
        // Auto-scroll to bottom when new message is added
        if (scrollViewRef.current) {
            setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);
        }
    }, [messages]);

    const handleSend = async () => {
        if (!inputText.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            text: inputText.trim(),
            isBot: false,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        setIsLoading(true);

        try {
            const response = await getAIChatResponse(userMessage.text, 'Nepali farming context');
            const botMessage = {
                id: Date.now() + 1,
                text: response,
                isBot: true,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, botMessage]);
            
            // Speak the response if voice is enabled
            if (Speech && !isSpeaking) {
                speakText(response);
            }
        } catch (error) {
            console.error('Error getting AI response:', error);
            const errorMessage = {
                id: Date.now() + 1,
                text: 'Sorry, I encountered an error. Please try again.',
                isBot: true,
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const speakText = (text) => {
        if (!Speech) return;
        
        try {
            setIsSpeaking(true);
            Speech.speak(text, {
                language: 'en',
                pitch: 1.0,
                rate: 0.9,
                onDone: () => {
                    setIsSpeaking(false);
                },
                onStopped: () => {
                    setIsSpeaking(false);
                },
                onError: (error) => {
                    console.error('Speech error:', error);
                    setIsSpeaking(false);
                }
            });
        } catch (error) {
            console.error('Error speaking text:', error);
            setIsSpeaking(false);
        }
    };

    const stopSpeaking = () => {
        if (Speech && isSpeaking) {
            Speech.stop();
            setIsSpeaking(false);
        }
    };

    const handleVoiceInput = () => {
        // Placeholder for voice input - would need expo-speech or similar
        alert('Voice input feature coming soon! For now, please type your question.');
    };

    const formatTime = (date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    const renderFormattedText = (text) => {
        if (!text) return null;
        
        const lines = text.split('\n');
        const elements = [];
        
        lines.forEach((line, lineIndex) => {
            const trimmedLine = line.trim();
            
            // Empty line
            if (trimmedLine === '') {
                elements.push(<Text key={lineIndex} style={{ height: 8 }} />);
                return;
            }
            
            // Numbered list (1. item)
            const numberedMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);
            if (numberedMatch) {
                elements.push(
                    <Text key={lineIndex} style={[dynamicStyles.messageText, { marginBottom: 4 }]}>
                        <Text style={dynamicStyles.boldText}>{numberedMatch[1]}. </Text>
                        {formatInlineText(numberedMatch[2])}
                    </Text>
                );
                return;
            }
            
            // Bullet point (- item or * item)
            if (trimmedLine.match(/^[-*•]\s+/)) {
                const content = trimmedLine.replace(/^[-*•]\s+/, '');
                elements.push(
                    <Text key={lineIndex} style={[dynamicStyles.messageText, { marginBottom: 4 }]}>
                        <Text>• </Text>
                        {formatInlineText(content)}
                    </Text>
                );
                return;
            }
            
            // Regular text with inline formatting
            elements.push(
                <Text key={lineIndex} style={[dynamicStyles.messageText, { marginBottom: 4 }]}>
                    {formatInlineText(trimmedLine)}
                </Text>
            );
        });
        
        return <View>{elements}</View>;
    };

    const formatInlineText = (text) => {
        if (!text) return text;
        
        // Clean markdown syntax - remove all markdown formatting
        let cleaned = text
            // Remove bold (**text** or __text__)
            .replace(/\*\*(.*?)\*\*/g, '$1')
            .replace(/__(.*?)__/g, '$1')
            // Remove italic (*text* or _text_)
            .replace(/\*(.*?)\*/g, '$1')
            .replace(/_(.*?)_/g, '$1')
            // Remove code blocks
            .replace(/`(.*?)`/g, '$1')
            // Remove links [text](url)
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
            // Clean up any remaining asterisks
            .replace(/\*+/g, '')
            // Clean up underscores used for formatting
            .replace(/_+/g, '');
        
        return cleaned;
    };

    const dynamicStyles = getStyles(colors, isDark);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <Animated.View 
                style={[
                    dynamicStyles.modalOverlay,
                    { opacity: fadeAnim }
                ]}
            >
                <View style={[dynamicStyles.modalContainer, { backgroundColor: colors.card }]}>
                    {/* Header */}
                    <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
                        <View style={dynamicStyles.headerLeft}>
                            <View style={[dynamicStyles.botAvatar, { backgroundColor: colors.primary + '20' }]}>
                                <Text style={dynamicStyles.botIcon}>🤖</Text>
                            </View>
                            <View>
                                <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>
                                    Farming Assistant
                                </Text>
                                <Text style={[dynamicStyles.headerSubtitle, { color: colors.textSecondary }]}>
                                    Ask me anything about farming
                                </Text>
                            </View>
                        </View>
                        <TouchableOpacity onPress={onClose} style={dynamicStyles.closeButton}>
                            <Text style={[dynamicStyles.closeButtonText, { color: colors.text }]}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Messages */}
                    <ScrollView
                        ref={scrollViewRef}
                        style={dynamicStyles.messagesContainer}
                        contentContainerStyle={dynamicStyles.messagesContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {messages.map((message) => (
                            <Animatable.View
                                key={message.id}
                                animation="fadeInUp"
                                duration={300}
                                style={[
                                    dynamicStyles.messageWrapper,
                                    message.isBot ? dynamicStyles.botMessageWrapper : dynamicStyles.userMessageWrapper
                                ]}
                            >
                                <View
                                    style={[
                                        dynamicStyles.messageBubble,
                                        message.isBot 
                                            ? [dynamicStyles.botMessage, { backgroundColor: colors.surface }]
                                            : [dynamicStyles.userMessage, { backgroundColor: colors.primary }]
                                    ]}
                                >
                                    <View>
                                        {message.isBot ? (
                                            renderFormattedText(message.text)
                                        ) : (
                                            <Text
                                                style={[
                                                    dynamicStyles.messageText,
                                                    { color: '#FFFFFF' }
                                                ]}
                                            >
                                                {message.text}
                                            </Text>
                                        )}
                                    </View>
                                    <Text
                                        style={[
                                            dynamicStyles.messageTime,
                                            message.isBot 
                                                ? { color: colors.textSecondary }
                                                : { color: 'rgba(255, 255, 255, 0.7)' }
                                        ]}
                                    >
                                        {formatTime(message.timestamp)}
                                    </Text>
                                </View>
                            </Animatable.View>
                        ))}
                        {isLoading && (
                            <View style={dynamicStyles.loadingWrapper}>
                                <View style={[dynamicStyles.messageBubble, dynamicStyles.botMessage, { backgroundColor: colors.surface }]}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <Text style={[dynamicStyles.messageText, { color: colors.textSecondary, marginLeft: 8 }]}>
                                        Thinking...
                                    </Text>
                                </View>
                            </View>
                        )}
                    </ScrollView>

                    {/* Input Area */}
                    <View style={[dynamicStyles.inputContainer, { borderTopColor: colors.border }]}>
                        <View style={[dynamicStyles.inputWrapper, { backgroundColor: colors.surface }]}>
                            <TextInput
                                style={[dynamicStyles.input, { color: colors.text }]}
                                placeholder="Ask about farming..."
                                placeholderTextColor={colors.textSecondary}
                                value={inputText}
                                onChangeText={setInputText}
                                multiline
                                maxLength={500}
                                onSubmitEditing={handleSend}
                                returnKeyType="send"
                            />
                            {Speech && (
                                <TouchableOpacity
                                    onPress={isSpeaking ? stopSpeaking : handleVoiceInput}
                                    style={[dynamicStyles.voiceButton, { backgroundColor: colors.primary + '20' }]}
                                >
                                    <Text style={[dynamicStyles.voiceButtonText, { color: colors.primary }]}>
                                        {isSpeaking ? '🔇' : '🎤'}
                                    </Text>
                                </TouchableOpacity>
                            )}
                            {Speech && messages.length > 1 && messages[messages.length - 1]?.isBot && (
                                <TouchableOpacity
                                    onPress={() => speakText(messages[messages.length - 1].text)}
                                    style={[dynamicStyles.voiceButton, { backgroundColor: colors.primary + '20' }]}
                                >
                                    <Text style={[dynamicStyles.voiceButtonText, { color: colors.primary }]}>
                                        🔊
                                    </Text>
                                </TouchableOpacity>
                            )}
                            <TouchableOpacity
                                onPress={handleSend}
                                disabled={!inputText.trim() || isLoading}
                                style={[
                                    dynamicStyles.sendButton,
                                    { backgroundColor: colors.primary },
                                    (!inputText.trim() || isLoading) && { opacity: 0.5 }
                                ]}
                            >
                                {isLoading ? (
                                    <ActivityIndicator size="small" color="#FFFFFF" />
                                ) : (
                                    <Text style={dynamicStyles.sendButtonText}>Send</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Animated.View>
        </Modal>
    );
};

const getStyles = (colors, isDark) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContainer: {
        flex: 1,
        marginTop: 50,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        borderBottomWidth: 1,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    botAvatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    botIcon: {
        fontSize: 28,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    headerSubtitle: {
        fontSize: 12,
        marginTop: 2,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.surface,
    },
    closeButtonText: {
        fontSize: 20,
        fontWeight: '600',
    },
    messagesContainer: {
        flex: 1,
    },
    messagesContent: {
        padding: 16,
        paddingBottom: 8,
    },
    messageWrapper: {
        marginBottom: 12,
    },
    botMessageWrapper: {
        alignItems: 'flex-start',
    },
    userMessageWrapper: {
        alignItems: 'flex-end',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 12,
        borderRadius: 16,
    },
    botMessage: {
        borderBottomLeftRadius: 4,
    },
    userMessage: {
        borderBottomRightRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    boldText: {
        fontWeight: '700',
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
    },
    loadingWrapper: {
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    inputContainer: {
        borderTopWidth: 1,
        padding: 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        borderRadius: 24,
        paddingHorizontal: 12,
        paddingVertical: 8,
    },
    input: {
        flex: 1,
        fontSize: 15,
        maxHeight: 100,
        paddingVertical: 8,
    },
    voiceButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        marginHorizontal: 4,
    },
    voiceButtonText: {
        fontSize: 18,
    },
    sendButton: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        marginLeft: 4,
    },
    sendButtonText: {
        color: '#FFFFFF',
        fontSize: 15,
        fontWeight: '600',
    },
});

export default FarmingChatbot;

