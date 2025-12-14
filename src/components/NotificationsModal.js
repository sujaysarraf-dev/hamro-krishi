import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { useTheme } from '../context/ThemeContext';

const NotificationsModal = ({ visible, onClose }) => {
    const { colors, isDark } = useTheme();
    const [notifications, setNotifications] = useState([]);

    useEffect(() => {
        if (visible) {
            loadNotifications();
        }
    }, [visible]);

    const loadNotifications = () => {
        // Generate random notifications based on current date
        const today = new Date();
        const notificationsList = [];

        // Generate random dates for notifications (past 7 days and next 7 days)
        for (let i = -7; i <= 7; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() + i);
            
            // Random chance to show notification (30% chance per day)
            if (Math.random() < 0.3) {
                const notificationTypes = [
                    {
                        type: 'flood',
                        title: '🌊 Flood Alert',
                        message: `Heavy rainfall expected in your region. Take necessary precautions to protect your crops.`,
                        date: date,
                        priority: 'high'
                    },
                    {
                        type: 'rain',
                        title: '🌧️ Heavy Rain Prediction',
                        message: `Heavy rain predicted for tomorrow. Consider covering sensitive crops and checking drainage systems.`,
                        date: date,
                        priority: 'medium'
                    },
                    {
                        type: 'drought',
                        title: '☀️ Drought Warning',
                        message: `Low rainfall expected in the coming days. Ensure proper irrigation for your crops.`,
                        date: date,
                        priority: 'high'
                    },
                    {
                        type: 'storm',
                        title: '⛈️ Storm Alert',
                        message: `Strong winds and thunderstorms expected. Secure your farm equipment and structures.`,
                        date: date,
                        priority: 'high'
                    },
                    {
                        type: 'frost',
                        title: '❄️ Frost Warning',
                        message: `Low temperatures expected tonight. Protect sensitive crops from frost damage.`,
                        date: date,
                        priority: 'medium'
                    },
                    {
                        type: 'heat',
                        title: '🔥 Heat Wave Alert',
                        message: `Extreme heat expected. Increase irrigation frequency and provide shade for vulnerable crops.`,
                        date: date,
                        priority: 'medium'
                    },
                    {
                        type: 'pest',
                        title: '🐛 Pest Alert',
                        message: `Increased pest activity reported in your area. Monitor your crops closely and take preventive measures.`,
                        date: date,
                        priority: 'medium'
                    },
                    {
                        type: 'harvest',
                        title: '🌾 Harvest Time',
                        message: `Optimal harvest conditions expected in the next few days. Prepare for harvesting activities.`,
                        date: date,
                        priority: 'low'
                    }
                ];

                const randomNotification = notificationTypes[Math.floor(Math.random() * notificationTypes.length)];
                randomNotification.date = date;
                notificationsList.push(randomNotification);
            }
        }

        // Sort by date (most recent first)
        notificationsList.sort((a, b) => b.date - a.date);
        setNotifications(notificationsList);
    };

    const formatDate = (date) => {
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return 'Tomorrow';
        } else {
            const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
            const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return '#FF4444';
            case 'medium':
                return '#FFA500';
            case 'low':
                return '#4CAF50';
            default:
                return colors.primary;
        }
    };

    const renderNotification = ({ item }) => {
        const dynamicStyles = getStyles(colors, isDark);
        const priorityColor = getPriorityColor(item.priority);

        return (
            <View style={[dynamicStyles.notificationCard, { backgroundColor: colors.card, borderLeftColor: priorityColor }]}>
                <View style={dynamicStyles.notificationHeader}>
                    <Text style={[dynamicStyles.notificationTitle, { color: colors.text }]}>
                        {item.title}
                    </Text>
                    <View style={[dynamicStyles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
                        <Text style={[dynamicStyles.priorityText, { color: priorityColor }]}>
                            {item.priority.toUpperCase()}
                        </Text>
                    </View>
                </View>
                <Text style={[dynamicStyles.notificationMessage, { color: colors.textSecondary }]}>
                    {item.message}
                </Text>
                <Text style={[dynamicStyles.notificationDate, { color: colors.textSecondary }]}>
                    {formatDate(item.date)}
                </Text>
            </View>
        );
    };

    const dynamicStyles = getStyles(colors, isDark);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={onClose}
        >
            <View style={dynamicStyles.modalOverlay}>
                <View style={[dynamicStyles.modalContent, { backgroundColor: colors.background }]}>
                    <View style={[dynamicStyles.modalHeader, { borderBottomColor: colors.border }]}>
                        <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>
                            🔔 Notifications
                        </Text>
                        <TouchableOpacity onPress={onClose} style={dynamicStyles.closeButton}>
                            <Text style={[dynamicStyles.closeButtonText, { color: colors.text }]}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {notifications.length === 0 ? (
                        <View style={dynamicStyles.emptyContainer}>
                            <Text style={dynamicStyles.emptyIcon}>🔔</Text>
                            <Text style={[dynamicStyles.emptyText, { color: colors.textSecondary }]}>
                                No notifications at the moment
                            </Text>
                        </View>
                    ) : (
                        <FlatList
                            data={notifications}
                            renderItem={renderNotification}
                            keyExtractor={(item, index) => `${item.type}-${item.date.getTime()}-${index}`}
                            contentContainerStyle={dynamicStyles.listContent}
                            showsVerticalScrollIndicator={false}
                        />
                    )}
                </View>
            </View>
        </Modal>
    );
};

const getStyles = (colors, isDark) => StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        height: '80%',
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingBottom: 15,
        borderBottomWidth: 1,
        marginBottom: 10,
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
    listContent: {
        padding: 20,
    },
    notificationCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderLeftWidth: 4,
        backgroundColor: colors.card,
    },
    notificationHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    notificationTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        flex: 1,
    },
    priorityBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginLeft: 8,
    },
    priorityText: {
        fontSize: 10,
        fontWeight: '700',
    },
    notificationMessage: {
        fontSize: 14,
        lineHeight: 20,
        color: colors.textSecondary,
        marginBottom: 8,
    },
    notificationDate: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textSecondary,
        textAlign: 'center',
    },
});

export default NotificationsModal;

