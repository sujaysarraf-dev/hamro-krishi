import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Dimensions } from 'react-native';
import * as Animatable from 'react-native-animatable';

const { width } = Dimensions.get('window');

const SweetAlert = ({ visible, type, title, message, confirmText = 'OK', onConfirm, onCancel, showCancel = false, cancelText = 'Cancel' }) => {
    const animationRef = useRef(null);

    useEffect(() => {
        if (visible && animationRef.current) {
            animationRef.current.bounceIn(800);
        }
    }, [visible]);

    const handleConfirm = () => {
        if (animationRef.current) {
            animationRef.current.bounceOut(300).then(() => {
                onConfirm && onConfirm();
            });
        } else {
            onConfirm && onConfirm();
        }
    };

    const handleCancel = () => {
        if (animationRef.current) {
            animationRef.current.bounceOut(300).then(() => {
                onCancel && onCancel();
            });
        } else {
            onCancel && onCancel();
        }
    };

    const getIcon = () => {
        switch (type) {
            case 'success':
                return '✓';
            case 'error':
                return '✕';
            case 'warning':
                return '⚠';
            case 'info':
                return 'ℹ';
            default:
                return 'ℹ';
        }
    };

    const getIconColor = () => {
        switch (type) {
            case 'success':
                return '#228B22';
            case 'error':
                return '#FF4444';
            case 'warning':
                return '#FFA500';
            case 'info':
                return '#228B22';
            default:
                return '#228B22';
        }
    };

    const getIconBgColor = () => {
        switch (type) {
            case 'success':
                return '#E8F5E9';
            case 'error':
                return '#FFEBEE';
            case 'warning':
                return '#FFF3E0';
            case 'info':
                return '#E3F2FD';
            default:
                return '#E3F2FD';
        }
    };

    if (!visible) return null;

    return (
        <Modal
            transparent
            visible={visible}
            animationType="fade"
            onRequestClose={handleCancel}
        >
            <View style={styles.overlay}>
                <Animatable.View
                    ref={animationRef}
                    style={styles.container}
                >
                    {/* Icon Circle */}
                    <Animatable.View
                        animation="pulse"
                        iterationCount="infinite"
                        duration={2000}
                        style={[styles.iconContainer, { backgroundColor: getIconBgColor() }]}
                    >
                        <Text style={[styles.icon, { color: getIconColor() }]}>
                            {getIcon()}
                        </Text>
                    </Animatable.View>

                    {/* Title */}
                    <Text style={styles.title}>{title}</Text>

                    {/* Message */}
                    <Text style={styles.message}>{message}</Text>

                    {/* Buttons */}
                    <View style={styles.buttonContainer}>
                        {showCancel && (
                            <TouchableOpacity
                                style={[styles.button, styles.cancelButton, { marginRight: 6 }]}
                                onPress={handleCancel}
                            >
                                <Text style={styles.cancelButtonText}>{cancelText}</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            style={[styles.button, styles.confirmButton, { backgroundColor: getIconColor(), marginLeft: showCancel ? 6 : 0 }]}
                            onPress={handleConfirm}
                        >
                            <Text style={styles.confirmButtonText}>{confirmText}</Text>
                        </TouchableOpacity>
                    </View>
                </Animatable.View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    container: {
        backgroundColor: '#FFFFFF',
        borderRadius: 20,
        padding: 30,
        width: width * 0.85,
        maxWidth: 400,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 10,
        },
        shadowOpacity: 0.25,
        shadowRadius: 20,
        elevation: 10,
    },
    iconContainer: {
        width: 80,
        height: 80,
        borderRadius: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    icon: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#1F1F1F',
        marginBottom: 12,
        textAlign: 'center',
    },
    message: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 30,
    },
    buttonContainer: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between',
    },
    button: {
        flex: 1,
        paddingVertical: 14,
        paddingHorizontal: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButton: {
        backgroundColor: '#228B22',
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    confirmButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    cancelButtonText: {
        color: '#666666',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default SweetAlert;

