import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../config/supabase';
import { useFocusEffect } from 'expo-router';
import SweetAlert from '../../components/SweetAlert';

const FarmerDiscussionScreen = () => {
    const { colors, isDark } = useTheme();
    const [discussions, setDiscussions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showReplyModal, setShowReplyModal] = useState(false);
    const [selectedDiscussion, setSelectedDiscussion] = useState(null);
    const [replies, setReplies] = useState([]);
    const [loadingReplies, setLoadingReplies] = useState(false);
    const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });

    // Form state
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        category: 'general'
    });
    const [replyContent, setReplyContent] = useState('');
    const [creating, setCreating] = useState(false);
    const [replying, setReplying] = useState(false);
    const [editingDiscussion, setEditingDiscussion] = useState(null);
    const [editingReply, setEditingReply] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [currentUser, setCurrentUser] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState({ visible: false, type: 'discussion', id: null, onConfirm: null });

    const categories = [
        { value: 'general', label: 'General' },
        { value: 'crops', label: 'Crops' },
        { value: 'livestock', label: 'Livestock' },
        { value: 'equipment', label: 'Equipment' },
        { value: 'tips', label: 'Tips' },
        { value: 'questions', label: 'Questions' }
    ];

    useEffect(() => {
        loadCurrentUser();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadDiscussions();
        }, [])
    );

    const loadCurrentUser = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user);
        } catch (error) {
            console.error('Error loading current user:', error);
        }
    };

    const loadDiscussions = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('discussions')
                .select(`
                    *,
                    user_profiles:farmer_id (
                        full_name,
                        avatar_url
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                console.error('Error loading discussions:', error);
                throw error;
            }

            setDiscussions(data || []);
        } catch (error) {
            console.error('Error loading discussions:', error);
            setAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to load discussions. Please try again.'
            });
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadReplies = async (discussionId) => {
        try {
            setLoadingReplies(true);
            const { data, error } = await supabase
                .from('discussion_replies')
                .select(`
                    *,
                    user_profiles:farmer_id (
                        full_name,
                        avatar_url
                    )
                `)
                .eq('discussion_id', discussionId)
                .order('created_at', { ascending: true });

            if (error) {
                console.error('Error loading replies:', error);
                throw error;
            }

            setReplies(data || []);
        } catch (error) {
            console.error('Error loading replies:', error);
        } finally {
            setLoadingReplies(false);
        }
    };

    const handleCreateDiscussion = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            setAlert({
                visible: true,
                type: 'warning',
                title: 'Validation Error',
                message: 'Please fill in both title and content.'
            });
            return;
        }

        try {
            setCreating(true);
            
            if (editingDiscussion) {
                await handleUpdateDiscussion();
                return;
            }

            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            const { error } = await supabase
                .from('discussions')
                .insert({
                    farmer_id: user.id,
                    title: formData.title.trim(),
                    content: formData.content.trim(),
                    category: formData.category
                });

            if (error) {
                throw error;
            }

            setAlert({
                visible: true,
                type: 'success',
                title: 'Success',
                message: 'Discussion created successfully!',
                onConfirm: () => {
                    setAlert({ ...alert, visible: false });
                    setShowCreateModal(false);
                    setFormData({ title: '', content: '', category: 'general' });
                    loadDiscussions();
                }
            });
        } catch (error) {
            console.error('Error creating discussion:', error);
            setAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to create discussion. Please try again.'
            });
        } finally {
            setCreating(false);
        }
    };

    const handleReply = async () => {
        if (!replyContent.trim()) {
            setAlert({
                visible: true,
                type: 'warning',
                title: 'Validation Error',
                message: 'Please enter a reply.'
            });
            return;
        }

        try {
            setReplying(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user || !selectedDiscussion) {
                throw new Error('User not authenticated or discussion not selected');
            }

            const { error } = await supabase
                .from('discussion_replies')
                .insert({
                    discussion_id: selectedDiscussion.id,
                    farmer_id: user.id,
                    content: replyContent.trim()
                });

            if (error) {
                throw error;
            }

            // Close modal first
            setShowReplyModal(false);
            const discussionId = selectedDiscussion.id;
            setSelectedDiscussion(null);
            setReplies([]);
            setReplyContent('');
            
            // Reload discussions to update reply counts
            loadDiscussions();
            
            // Show success alert
            setAlert({
                visible: true,
                type: 'success',
                title: 'Reply Posted',
                message: 'Your reply has been posted successfully!',
                onConfirm: () => {
                    setAlert({ ...alert, visible: false });
                }
            });
        } catch (error) {
            console.error('Error posting reply:', error);
            setAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to post reply. Please try again.'
            });
        } finally {
            setReplying(false);
        }
    };

    const handleViewDiscussion = (discussion) => {
        setSelectedDiscussion(discussion);
        setShowReplyModal(true);
        loadReplies(discussion.id);
    };

    const handleEditDiscussion = (discussion) => {
        setEditingDiscussion(discussion);
        setFormData({
            title: discussion.title,
            content: discussion.content,
            category: discussion.category
        });
        setShowCreateModal(true);
    };

    const handleUpdateDiscussion = async () => {
        if (!formData.title.trim() || !formData.content.trim()) {
            setAlert({
                visible: true,
                type: 'warning',
                title: 'Validation Error',
                message: 'Please fill in both title and content.'
            });
            return;
        }

        try {
            setCreating(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await supabase
                .from('discussions')
                .update({
                    title: formData.title.trim(),
                    content: formData.content.trim(),
                    category: formData.category
                })
                .eq('id', editingDiscussion.id)
                .eq('farmer_id', user.id)
                .select();

            if (error) {
                console.error('Update error:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('Discussion not found or you do not have permission to update it');
            }

            setAlert({
                visible: true,
                type: 'success',
                title: 'Success',
                message: 'Discussion updated successfully!',
                onConfirm: () => {
                    setAlert({ ...alert, visible: false });
                    setShowCreateModal(false);
                    setEditingDiscussion(null);
                    setFormData({ title: '', content: '', category: 'general' });
                    loadDiscussions();
                }
            });
        } catch (error) {
            console.error('Error updating discussion:', error);
            setAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to update discussion. Please try again.'
            });
        } finally {
            setCreating(false);
        }
    };

    const handleDeleteDiscussion = (discussion) => {
        setDeleteAlert({
            visible: true,
            type: 'discussion',
            id: discussion.id,
            onConfirm: async () => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    
                    if (!user) {
                        throw new Error('User not authenticated');
                    }

                    const { data, error } = await supabase
                        .from('discussions')
                        .delete()
                        .eq('id', discussion.id)
                        .eq('farmer_id', user.id)
                        .select();

                    if (error) {
                        console.error('Delete error:', error);
                        throw error;
                    }

                    if (!data || data.length === 0) {
                        throw new Error('Discussion not found or you do not have permission to delete it');
                    }

                    setAlert({
                        visible: true,
                        type: 'success',
                        title: 'Deleted',
                        message: 'Discussion deleted successfully!',
                        onConfirm: () => {
                            setAlert({ ...alert, visible: false });
                            loadDiscussions();
                        }
                    });
                } catch (error) {
                    console.error('Error deleting discussion:', error);
                    setAlert({
                        visible: true,
                        type: 'error',
                        title: 'Error',
                        message: error.message || 'Failed to delete discussion. Please try again.'
                    });
                } finally {
                    setDeleteAlert({ ...deleteAlert, visible: false });
                }
            }
        });
    };

    const handleEditReply = (reply) => {
        setEditingReply(reply);
        setEditContent(reply.content);
    };

    const handleUpdateReply = async () => {
        if (!editContent.trim()) {
            setAlert({
                visible: true,
                type: 'warning',
                title: 'Validation Error',
                message: 'Please enter a reply.'
            });
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            const { data, error } = await supabase
                .from('discussion_replies')
                .update({ content: editContent.trim() })
                .eq('id', editingReply.id)
                .eq('farmer_id', user.id)
                .select();

            if (error) {
                console.error('Update reply error:', error);
                throw error;
            }

            if (!data || data.length === 0) {
                throw new Error('Reply not found or you do not have permission to update it');
            }

            setAlert({
                visible: true,
                type: 'success',
                title: 'Updated',
                message: 'Reply updated successfully!',
                onConfirm: () => {
                    setAlert({ ...alert, visible: false });
                    setEditingReply(null);
                    setEditContent('');
                    if (selectedDiscussion) {
                        loadReplies(selectedDiscussion.id);
                    }
                }
            });
        } catch (error) {
            console.error('Error updating reply:', error);
            setAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to update reply. Please try again.'
            });
        }
    };

    const handleDeleteReply = (reply) => {
        setDeleteAlert({
            visible: true,
            type: 'reply',
            id: reply.id,
            onConfirm: async () => {
                try {
                    const { data: { user } } = await supabase.auth.getUser();
                    
                    if (!user) {
                        throw new Error('User not authenticated');
                    }

                    const { data, error } = await supabase
                        .from('discussion_replies')
                        .delete()
                        .eq('id', reply.id)
                        .eq('farmer_id', user.id)
                        .select();

                    if (error) {
                        console.error('Delete reply error:', error);
                        throw error;
                    }

                    if (!data || data.length === 0) {
                        throw new Error('Reply not found or you do not have permission to delete it');
                    }

                    setAlert({
                        visible: true,
                        type: 'success',
                        title: 'Deleted',
                        message: 'Reply deleted successfully!',
                        onConfirm: () => {
                            setAlert({ ...alert, visible: false });
                            if (selectedDiscussion) {
                                loadReplies(selectedDiscussion.id);
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error deleting reply:', error);
                    setAlert({
                        visible: true,
                        type: 'error',
                        title: 'Error',
                        message: error.message || 'Failed to delete reply. Please try again.'
                    });
                } finally {
                    setDeleteAlert({ ...deleteAlert, visible: false });
                }
            }
        });
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    };

    const getCategoryLabel = (category) => {
        return categories.find(c => c.value === category)?.label || category;
    };

    const dynamicStyles = getStyles(colors, isDark);

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
            <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
                <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>Discussions</Text>
                <TouchableOpacity
                    style={[dynamicStyles.createButton, { backgroundColor: colors.primary }]}
                    onPress={() => setShowCreateModal(true)}
                >
                    <Text style={dynamicStyles.createButtonText}>+ New Post</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <View style={dynamicStyles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            ) : discussions.length === 0 ? (
                <View style={dynamicStyles.emptyContainer}>
                    <Text style={dynamicStyles.emptyIcon}>💬</Text>
                    <Text style={[dynamicStyles.emptyText, { color: colors.text }]}>No discussions yet</Text>
                    <Text style={[dynamicStyles.emptySubtext, { color: colors.textSecondary }]}>Be the first to start a discussion!</Text>
                </View>
            ) : (
                <ScrollView
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={() => {
                            setRefreshing(true);
                            loadDiscussions();
                        }} />
                    }
                >
                    <View style={dynamicStyles.content}>
                        {discussions.map((discussion) => (
                            <TouchableOpacity
                                key={discussion.id}
                                style={[dynamicStyles.discussionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                onPress={() => handleViewDiscussion(discussion)}
                            >
                                <View style={dynamicStyles.discussionHeader}>
                                    <View style={dynamicStyles.authorInfo}>
                                        <View style={[dynamicStyles.avatar, { backgroundColor: colors.primary }]}>
                                            <Text style={dynamicStyles.avatarText}>
                                                {discussion.user_profiles?.full_name?.charAt(0)?.toUpperCase() || 'F'}
                                            </Text>
                                        </View>
                                        <View>
                                            <Text style={[dynamicStyles.authorName, { color: colors.text }]}>
                                                {discussion.user_profiles?.full_name || 'Farmer'}
                                            </Text>
                                            <Text style={[dynamicStyles.postDate, { color: colors.textSecondary }]}>
                                                {formatDate(discussion.created_at)}
                                            </Text>
                                        </View>
                                    </View>
                                    <View style={[dynamicStyles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
                                        <Text style={[dynamicStyles.categoryText, { color: colors.primary }]}>
                                            {getCategoryLabel(discussion.category)}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[dynamicStyles.discussionTitle, { color: colors.text }]}>
                                    {discussion.title}
                                </Text>
                                <Text style={[dynamicStyles.discussionContent, { color: colors.textSecondary }]} numberOfLines={3}>
                                    {discussion.content}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </ScrollView>
            )}

            {/* Create Discussion Modal */}
            <Modal
                visible={showCreateModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <View style={dynamicStyles.modalOverlay}>
                    <View style={[dynamicStyles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={dynamicStyles.modalHeader}>
                            <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>
                                {editingDiscussion ? 'Edit Discussion' : 'Create Discussion'}
                            </Text>
                            <TouchableOpacity onPress={() => {
                                setShowCreateModal(false);
                                setEditingDiscussion(null);
                                setFormData({ title: '', content: '', category: 'general' });
                            }}>
                                <Text style={[dynamicStyles.closeButton, { color: colors.text }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={dynamicStyles.formGroup}>
                                <Text style={[dynamicStyles.label, { color: colors.text }]}>Category</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.categoryScroll}>
                                    {categories.map((cat) => (
                                        <TouchableOpacity
                                            key={cat.value}
                                            style={[
                                                dynamicStyles.categoryChip,
                                                {
                                                    backgroundColor: formData.category === cat.value ? colors.primary : colors.surface,
                                                    borderColor: colors.border
                                                }
                                            ]}
                                            onPress={() => setFormData({ ...formData, category: cat.value })}
                                        >
                                            <Text style={[
                                                dynamicStyles.categoryChipText,
                                                { color: formData.category === cat.value ? '#FFFFFF' : colors.text }
                                            ]}>
                                                {cat.label}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </ScrollView>
                            </View>
                            <View style={dynamicStyles.formGroup}>
                                <Text style={[dynamicStyles.label, { color: colors.text }]}>Title *</Text>
                                <TextInput
                                    style={[dynamicStyles.input, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    placeholder="Enter discussion title"
                                    placeholderTextColor={colors.textSecondary}
                                    value={formData.title}
                                    onChangeText={(text) => setFormData({ ...formData, title: text })}
                                />
                            </View>
                            <View style={dynamicStyles.formGroup}>
                                <Text style={[dynamicStyles.label, { color: colors.text }]}>Content *</Text>
                                <TextInput
                                    style={[dynamicStyles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                    placeholder="Write your discussion..."
                                    placeholderTextColor={colors.textSecondary}
                                    value={formData.content}
                                    onChangeText={(text) => setFormData({ ...formData, content: text })}
                                    multiline
                                    numberOfLines={6}
                                    textAlignVertical="top"
                                />
                            </View>
                            <TouchableOpacity
                                style={[dynamicStyles.submitButton, { backgroundColor: colors.primary }, creating && dynamicStyles.submitButtonDisabled]}
                                onPress={handleCreateDiscussion}
                                disabled={creating}
                            >
                                        {creating ? (
                                    <ActivityIndicator color="#FFFFFF" />
                                ) : (
                                    <Text style={dynamicStyles.submitButtonText}>
                                        {editingDiscussion ? 'Update Discussion' : 'Post Discussion'}
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Reply Modal */}
            <Modal
                visible={showReplyModal}
                transparent={true}
                animationType="slide"
                onRequestClose={() => {
                    setShowReplyModal(false);
                    setSelectedDiscussion(null);
                    setReplies([]);
                    setReplyContent('');
                }}
            >
                <View style={dynamicStyles.modalOverlay}>
                    <View style={[dynamicStyles.modalContent, { backgroundColor: colors.background, maxHeight: '90%' }]}>
                        <View style={dynamicStyles.modalHeader}>
                            <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>Discussion</Text>
                            <TouchableOpacity onPress={() => {
                                setShowReplyModal(false);
                                setSelectedDiscussion(null);
                                setReplies([]);
                                setReplyContent('');
                            }}>
                                <Text style={[dynamicStyles.closeButton, { color: colors.text }]}>✕</Text>
                            </TouchableOpacity>
                        </View>
                        <ScrollView showsVerticalScrollIndicator={false}>
                            {selectedDiscussion && (
                                <>
                                    <View style={[dynamicStyles.discussionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                        <View style={dynamicStyles.discussionHeader}>
                                            <View style={dynamicStyles.authorInfo}>
                                                <View style={[dynamicStyles.avatar, { backgroundColor: colors.primary }]}>
                                                    <Text style={dynamicStyles.avatarText}>
                                                        {selectedDiscussion.user_profiles?.full_name?.charAt(0)?.toUpperCase() || 'F'}
                                                    </Text>
                                                </View>
                                                <View>
                                                    <Text style={[dynamicStyles.authorName, { color: colors.text }]}>
                                                        {selectedDiscussion.user_profiles?.full_name || 'Farmer'}
                                                    </Text>
                                                    <Text style={[dynamicStyles.postDate, { color: colors.textSecondary }]}>
                                                        {formatDate(selectedDiscussion.created_at)}
                                                    </Text>
                                                </View>
                                            </View>
                                            <View style={[dynamicStyles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
                                                <Text style={[dynamicStyles.categoryText, { color: colors.primary }]}>
                                                    {getCategoryLabel(selectedDiscussion.category)}
                                                </Text>
                                            </View>
                                        </View>
                                        <Text style={[dynamicStyles.discussionTitle, { color: colors.text }]}>
                                            {selectedDiscussion.title}
                                        </Text>
                                        <Text style={[dynamicStyles.discussionContent, { color: colors.text }]}>
                                            {selectedDiscussion.content}
                                        </Text>
                                    </View>

                                    <View style={dynamicStyles.repliesSection}>
                                        <Text style={[dynamicStyles.repliesTitle, { color: colors.text }]}>
                                            Replies ({replies.length})
                                        </Text>
                                        {loadingReplies ? (
                                            <ActivityIndicator color={colors.primary} />
                                        ) : replies.length === 0 ? (
                                            <Text style={[dynamicStyles.noReplies, { color: colors.textSecondary }]}>
                                                No replies yet. Be the first to reply!
                                            </Text>
                                        ) : (
                                            replies.map((reply) => (
                                                <View key={reply.id} style={dynamicStyles.replyContainer}>
                                                    {editingReply && editingReply.id === reply.id ? (
                                                        <View style={[dynamicStyles.editReplyContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                                            <TextInput
                                                                style={[dynamicStyles.editReplyInput, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                                                value={editContent}
                                                                onChangeText={setEditContent}
                                                                multiline
                                                                numberOfLines={3}
                                                                textAlignVertical="top"
                                                            />
                                                            <View style={dynamicStyles.editReplyActions}>
                                                                <TouchableOpacity
                                                                    style={[dynamicStyles.editReplyButton, { backgroundColor: colors.primary }]}
                                                                    onPress={handleUpdateReply}
                                                                >
                                                                    <Text style={dynamicStyles.editReplyButtonText}>Save</Text>
                                                                </TouchableOpacity>
                                                                <TouchableOpacity
                                                                    style={[dynamicStyles.editReplyButton, { backgroundColor: colors.border }]}
                                                                    onPress={() => {
                                                                        setEditingReply(null);
                                                                        setEditContent('');
                                                                    }}
                                                                >
                                                                    <Text style={[dynamicStyles.editReplyButtonText, { color: colors.text }]}>Cancel</Text>
                                                                </TouchableOpacity>
                                                            </View>
                                                        </View>
                                                    ) : (
                                                        <View style={[dynamicStyles.replyCard, { backgroundColor: colors.surface }]}>
                                                            <View style={dynamicStyles.replyHeader}>
                                                                <View style={dynamicStyles.replyAuthorInfo}>
                                                                    <View style={[dynamicStyles.avatarSmall, { backgroundColor: colors.primary }]}>
                                                                        <Text style={dynamicStyles.avatarTextSmall}>
                                                                            {reply.user_profiles?.full_name?.charAt(0)?.toUpperCase() || 'F'}
                                                                        </Text>
                                                                    </View>
                                                                    <View style={dynamicStyles.replyAuthorDetails}>
                                                                        <Text style={[dynamicStyles.replyAuthorName, { color: colors.text }]}>
                                                                            {reply.user_profiles?.full_name || 'Farmer'}
                                                                        </Text>
                                                                        <Text style={[dynamicStyles.replyDate, { color: colors.textSecondary }]}>
                                                                            {formatDate(reply.created_at)}
                                                                        </Text>
                                                                    </View>
                                                                </View>
                                                                {currentUser && reply.farmer_id === currentUser.id && (
                                                                    <View style={dynamicStyles.replyActions}>
                                                                        <TouchableOpacity
                                                                            style={dynamicStyles.replyActionButton}
                                                                            onPress={() => handleEditReply(reply)}
                                                                        >
                                                                            <Text style={[dynamicStyles.replyActionIcon, { color: colors.textSecondary }]}>✏️</Text>
                                                                        </TouchableOpacity>
                                                                        <TouchableOpacity
                                                                            style={dynamicStyles.replyActionButton}
                                                                            onPress={() => handleDeleteReply(reply)}
                                                                        >
                                                                            <Text style={[dynamicStyles.replyActionIcon, { color: '#EF4444' }]}>🗑️</Text>
                                                                        </TouchableOpacity>
                                                                    </View>
                                                                )}
                                                            </View>
                                                            <Text style={[dynamicStyles.replyContent, { color: colors.text }]}>
                                                                {reply.content}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            ))
                                        )}
                                    </View>

                                    <View style={dynamicStyles.replyForm}>
                                        <Text style={[dynamicStyles.label, { color: colors.text }]}>Your Reply</Text>
                                        <TextInput
                                            style={[dynamicStyles.textArea, { backgroundColor: colors.surface, color: colors.text, borderColor: colors.border }]}
                                            placeholder="Write a reply..."
                                            placeholderTextColor={colors.textSecondary}
                                            value={replyContent}
                                            onChangeText={setReplyContent}
                                            multiline
                                            numberOfLines={4}
                                            textAlignVertical="top"
                                        />
                                        <TouchableOpacity
                                            style={[dynamicStyles.submitButton, { backgroundColor: colors.primary }, replying && dynamicStyles.submitButtonDisabled]}
                                            onPress={handleReply}
                                            disabled={replying}
                                        >
                                            {replying ? (
                                                <ActivityIndicator color="#FFFFFF" />
                                            ) : (
                                                <Text style={dynamicStyles.submitButtonText}>Post Reply</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </>
                            )}
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            <SweetAlert
                visible={alert.visible}
                type={alert.type}
                title={alert.title}
                message={alert.message}
                onConfirm={() => {
                    setAlert({ ...alert, visible: false });
                    if (alert.onConfirm) alert.onConfirm();
                }}
            />

            {/* Delete Confirmation Alert */}
            <SweetAlert
                visible={deleteAlert.visible}
                type="warning"
                title="Delete Confirmation"
                message={`Are you sure you want to delete this ${deleteAlert.type}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                showCancel={true}
                onConfirm={() => {
                    if (deleteAlert.onConfirm) {
                        deleteAlert.onConfirm();
                    }
                }}
                onCancel={() => {
                    setDeleteAlert({ ...deleteAlert, visible: false });
                }}
            />
        </SafeAreaView>
    );
};

const getStyles = (colors, isDark) => StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: colors.text,
    },
    createButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    createButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 100,
    },
    emptyIcon: {
        fontSize: 80,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 20,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
        color: colors.textSecondary,
    },
    content: {
        padding: 20,
    },
    discussionCard: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    discussionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    authorDetails: {
        flex: 1,
    },
    headerRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    actionButtons: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 8,
    },
    actionButton: {
        padding: 4,
        marginLeft: 4,
    },
    actionIcon: {
        fontSize: 16,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarSmall: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    avatarTextSmall: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    authorName: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    postDate: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    categoryBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
    },
    categoryText: {
        fontSize: 11,
        fontWeight: '600',
    },
    discussionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    discussionContent: {
        fontSize: 14,
        color: colors.textSecondary,
        lineHeight: 20,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: colors.background,
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    closeButton: {
        fontSize: 24,
        fontWeight: '600',
        color: colors.text,
    },
    formGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
    },
    categoryScroll: {
        marginBottom: 8,
    },
    categoryChip: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    categoryChipText: {
        fontSize: 12,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: colors.text,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: colors.text,
        minHeight: 120,
    },
    submitButton: {
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 10,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    repliesSection: {
        marginTop: 20,
        marginBottom: 20,
    },
    repliesTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
    },
    noReplies: {
        fontSize: 14,
        color: colors.textSecondary,
        fontStyle: 'italic',
        textAlign: 'center',
        padding: 20,
    },
    replyContainer: {
        marginBottom: 20,
        paddingLeft: 0,
    },
    replyCard: {
        backgroundColor: 'transparent',
        borderRadius: 0,
        padding: 0,
        marginLeft: 0,
    },
    replyHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: 8,
    },
    replyAuthorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    replyAuthorDetails: {
        marginLeft: 10,
        flex: 1,
    },
    replyAuthorName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    replyDate: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    replyActions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    replyActionButton: {
        padding: 4,
    },
    replyActionIcon: {
        fontSize: 16,
    },
    replyContent: {
        fontSize: 15,
        color: colors.text,
        lineHeight: 22,
        marginLeft: 42,
        marginTop: 4,
    },
    editReplyContainer: {
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    editReplyInput: {
        borderWidth: 1,
        borderRadius: 8,
        padding: 12,
        fontSize: 15,
        color: colors.text,
        minHeight: 80,
        marginBottom: 12,
    },
    editReplyActions: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: 8,
    },
    editReplyButton: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
    },
    editReplyButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    replyForm: {
        marginTop: 20,
        paddingTop: 20,
        borderTopWidth: 1,
        borderTopColor: colors.border,
    },
});

export default FarmerDiscussionScreen;

