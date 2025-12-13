import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Dimensions, Modal, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { supabase } from '../../config/supabase';
import { useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import SweetAlert from '../../components/SweetAlert';

const { width, height } = Dimensions.get('window');

const FarmerProductsScreen = () => {
    const { colors, isDark } = useTheme();
    const dynamicStyles = getStyles(colors, isDark);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [showUnitDropdown, setShowUnitDropdown] = useState(false);
    const [alert, setAlert] = useState({ visible: false, type: 'info', title: '', message: '' });
    const [deleteAlert, setDeleteAlert] = useState({ visible: false, productId: null, productName: '' });

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        priceUnit: 'NPR',
        stockQuantity: '',
        stockUnit: 'kilograms',
        status: 'Active',
        category: 'grain',
        imageUrl: null,
        isOrganic: false,
        organicCertificationNumber: '',
        organicCertificationAuthority: '',
        organicCertificationDate: '',
    });
    const [localImage, setLocalImage] = useState(null);

    const productCategories = ['grain', 'vegetable', 'fruit', 'livestock', 'cash crop', 'spice and herb', 'fish'];

    useEffect(() => {
        loadProducts();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadProducts();
        }, [])
    );

    const loadProducts = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                setLoading(false);
                return;
            }

            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('farmer_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error loading products:', error);
                throw error;
            }

            setProducts(data || []);
        } catch (error) {
            console.error('Error loading products:', error);
            setAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to load products. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    const handleAddProduct = () => {
        setEditingProduct(null);
        setFormData({
            name: '',
            description: '',
            price: '',
            priceUnit: 'NPR',
            stockQuantity: '',
            stockUnit: 'kilograms',
            status: 'Active',
            category: 'grain',
            imageUrl: null,
            isOrganic: false,
            organicCertificationNumber: '',
            organicCertificationAuthority: '',
            organicCertificationDate: '',
        });
        setLocalImage(null);
        setShowAddModal(true);
    };

    const handleEditProduct = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name || '',
            description: product.description || '',
            price: product.price?.toString() || '',
            priceUnit: 'NPR',
            stockQuantity: product.stock_quantity?.toString() || '',
            stockUnit: product.stock_unit || 'kilograms',
            status: product.status || 'Active',
            category: product.category || 'grain',
            imageUrl: product.image_url || null,
            isOrganic: product.is_organic || false,
            organicCertificationNumber: product.organic_certification_number || '',
            organicCertificationAuthority: product.organic_certification_authority || '',
            organicCertificationDate: product.organic_certification_date || '',
        });
        setLocalImage(product.image_url || null);
        setShowAddModal(true);
    };

    const pickImage = async () => {
        try {
            const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== 'granted') {
                setAlert({
                    visible: true,
                    type: 'warning',
                    title: 'Permission Denied',
                    message: 'Camera roll permission is required to upload images.',
                });
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                console.log('Image picked:', result.assets[0].uri);
                console.log('Image type:', result.assets[0].type);
                console.log('Image width:', result.assets[0].width);
                console.log('Image height:', result.assets[0].height);
                setLocalImage(result.assets[0].uri);
            }
        } catch (error) {
            console.error('Error picking image:', error);
            setAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to pick image',
            });
        }
    };

    const uploadImage = async (imageUri, productId) => {
        try {
            setUploading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            console.log('Starting image upload for product:', productId);
            console.log('Image URI:', imageUri);

            // Determine file extension from URI or default to jpg
            let fileExt = 'jpg';
            if (imageUri.includes('.')) {
                const uriParts = imageUri.split('.');
                fileExt = uriParts[uriParts.length - 1].toLowerCase().split('?')[0];
            }
            // Handle common image extensions
            if (!['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(fileExt)) {
                fileExt = 'jpg';
            }

            const fileName = `product-${productId || Date.now()}-${Date.now()}.${fileExt}`;
            const filePath = `products/${fileName}`;

            console.log('Reading file from URI:', imageUri);
            
            // Check if URI is a URL (not a local file) - this shouldn't happen but just in case
            if (imageUri.startsWith('http://') || imageUri.startsWith('https://')) {
                throw new Error('Cannot upload image from URL. Please select a local image file.');
            }
            
            // For React Native, read file as base64 and convert to ArrayBuffer
            // This is more reliable than fetch for local files
            let base64;
            try {
                base64 = await FileSystem.readAsStringAsync(imageUri, {
                    encoding: FileSystem.EncodingType.Base64,
                });
                console.log('File read successfully, base64 length:', base64.length);
            } catch (readError) {
                console.error('Error reading file:', readError);
                console.error('URI that failed:', imageUri);
                throw new Error(`Failed to read image file. Error: ${readError.message}. Please try selecting the image again.`);
            }
            
            // Convert base64 to ArrayBuffer (Uint8Array)
            let byteArray;
            try {
                const byteCharacters = atob(base64);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                byteArray = new Uint8Array(byteNumbers);
                console.log('Converted to Uint8Array, size:', byteArray.length, 'bytes');
            } catch (convertError) {
                console.error('Error converting base64:', convertError);
                throw new Error('Failed to process image data. Please try selecting the image again.');
            }

            console.log('File read, size:', byteArray.length, 'bytes');
            console.log('Uploading to path:', filePath);

            // Upload to Supabase storage
            const { data, error: uploadError } = await supabase.storage
                .from('product_images')
                .upload(filePath, byteArray, {
                    contentType: `image/${fileExt}`,
                    upsert: true,
                    cacheControl: '3600',
                });

            if (uploadError) {
                console.error('Upload error:', uploadError);
                throw uploadError;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('product_images')
                .getPublicUrl(filePath);

            console.log('Upload successful, URL:', publicUrl);
            return publicUrl;
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProduct = async () => {
        if (!formData.name.trim() || !formData.price.trim() || !formData.stockQuantity.trim()) {
            setAlert({
                visible: true,
                type: 'warning',
                title: 'Validation Error',
                message: 'Please fill in all required fields (Name, Price, Stock Quantity).',
            });
            return;
        }

        try {
            setSaving(true);
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            const productData = {
                farmer_id: user.id,
                name: formData.name.trim(),
                description: formData.description.trim() || null,
                price: parseFloat(formData.price),
                stock_quantity: parseFloat(formData.stockQuantity),
                stock_unit: formData.stockUnit,
                status: formData.status,
                category: formData.category,
                is_organic: formData.isOrganic,
                organic_certification_number: formData.isOrganic ? formData.organicCertificationNumber.trim() || null : null,
                organic_certification_authority: formData.isOrganic ? formData.organicCertificationAuthority.trim() || null : null,
                organic_certification_date: formData.isOrganic && formData.organicCertificationDate ? formData.organicCertificationDate : null,
            };

            if (editingProduct) {
                // Upload image if a new one was selected (check if it's a local file, not a URL)
                if (localImage && localImage !== formData.imageUrl && (localImage.startsWith('file://') || localImage.startsWith('data:image') || localImage.startsWith('content://'))) {
                    const imageUrl = await uploadImage(localImage, editingProduct.id);
                    productData.image_url = imageUrl;
                } else {
                    productData.image_url = formData.imageUrl;
                }

                // Update existing product
                const { error } = await supabase
                    .from('products')
                    .update(productData)
                    .eq('id', editingProduct.id)
                    .eq('farmer_id', user.id);

                if (error) throw error;

                setAlert({
                    visible: true,
                    type: 'success',
                    title: 'Success',
                    message: 'Product updated successfully!',
                    onConfirm: () => {
                        setShowAddModal(false);
                        loadProducts();
                    },
                });
            } else {
                // Insert new product first to get the ID
                const { data: newProduct, error: insertError } = await supabase
                    .from('products')
                    .insert(productData)
                    .select()
                    .single();

                if (insertError) throw insertError;

                // If image was uploaded, update the product with the image URL
                // Only upload if it's a local file (not a URL)
                if (localImage && (localImage.startsWith('file://') || localImage.startsWith('data:image') || localImage.startsWith('content://'))) {
                    const uploadedImageUrl = await uploadImage(localImage, newProduct.id);
                    const { error: updateError } = await supabase
                        .from('products')
                        .update({ image_url: uploadedImageUrl })
                        .eq('id', newProduct.id);

                    if (updateError) {
                        console.error('Error updating product image:', updateError);
                    }
                }

                setAlert({
                    visible: true,
                    type: 'success',
                    title: 'Success',
                    message: 'Product added successfully!',
                    onConfirm: () => {
                        setShowAddModal(false);
                        loadProducts();
                    },
                });
            }
        } catch (error) {
            console.error('Error saving product:', error);
            setAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: error.message || 'Failed to save product. Please try again.',
            });
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteProduct = async (productId) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            
            if (!user) {
                throw new Error('User not authenticated');
            }

            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId)
                .eq('farmer_id', user.id);

            if (error) throw error;

            setAlert({
                visible: true,
                type: 'success',
                title: 'Success',
                message: 'Product deleted successfully!',
                onConfirm: () => {
                    loadProducts();
                },
            });
        } catch (error) {
            console.error('Error deleting product:', error);
            setAlert({
                visible: true,
                type: 'error',
                title: 'Error',
                message: 'Failed to delete product. Please try again.',
            });
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'Active':
                return '#4CAF50';
            case 'Inactive':
                return '#9E9E9E';
            default:
                return colors.textSecondary;
        }
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (product.category && product.category.toLowerCase().includes(searchQuery.toLowerCase()));
        const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const formatPrice = (price) => {
        return new Intl.NumberFormat('en-NP', {
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    return (
        <SafeAreaView style={[dynamicStyles.container, { backgroundColor: colors.background }]}>
            <View style={[dynamicStyles.header, { borderBottomColor: colors.border }]}>
                <Text style={[dynamicStyles.headerTitle, { color: colors.text }]}>My Products</Text>
                <TouchableOpacity 
                    style={[dynamicStyles.addButton, { backgroundColor: colors.primary }]}
                    onPress={handleAddProduct}
                >
                    <Text style={dynamicStyles.addButtonText}>+ Add</Text>
                </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={dynamicStyles.scrollView}>
                <View style={dynamicStyles.content}>
                    {/* Search Bar */}
                    <View style={[dynamicStyles.searchContainer, { backgroundColor: colors.surface }]}>
                        <Text style={[dynamicStyles.searchIcon, { color: colors.textSecondary }]}>🔍</Text>
                        <TextInput
                            style={[dynamicStyles.searchInput, { color: colors.text }]}
                            placeholder="Search products..."
                            placeholderTextColor={colors.textSecondary}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                    </View>

                    {/* Category Filter */}
                    <View style={dynamicStyles.categoryFilterContainer}>
                        <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false} 
                            contentContainerStyle={dynamicStyles.categoryFilterContent}
                        >
                            <TouchableOpacity
                                style={[
                                    dynamicStyles.categoryFilterChip,
                                    { 
                                        backgroundColor: selectedCategory === 'all' ? colors.primary : colors.surface,
                                        borderColor: colors.border,
                                    }
                                ]}
                                onPress={() => setSelectedCategory('all')}
                            >
                                <Text style={[
                                    dynamicStyles.categoryFilterText,
                                    { color: selectedCategory === 'all' ? '#FFFFFF' : colors.text }
                                ]}>
                                    All
                                </Text>
                            </TouchableOpacity>
                            {productCategories.map((category) => (
                                <TouchableOpacity
                                    key={category}
                                    style={[
                                        dynamicStyles.categoryFilterChip,
                                        { 
                                            backgroundColor: selectedCategory === category ? colors.primary : colors.surface,
                                            borderColor: colors.border,
                                        }
                                    ]}
                                    onPress={() => setSelectedCategory(category)}
                                >
                                    <Text style={[
                                        dynamicStyles.categoryFilterText,
                                        { color: selectedCategory === category ? '#FFFFFF' : colors.text }
                                    ]}>
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    </View>

                    {loading ? (
                        <View style={dynamicStyles.loadingContainer}>
                            <ActivityIndicator size="large" color={colors.primary} />
                        </View>
                    ) : (
                        <>
                            {/* Products List */}
                            {filteredProducts.length > 0 ? (
                                <View style={dynamicStyles.productsList}>
                                    {filteredProducts.map((product) => (
                                        <View key={product.id} style={[dynamicStyles.productCard, { backgroundColor: colors.card }]}>
                                            <View style={[dynamicStyles.productImageContainer, { backgroundColor: colors.surface }]}>
                                                {product.image_url ? (
                                                    <Image source={{ uri: product.image_url }} style={dynamicStyles.productImage} />
                                                ) : (
                                                    <Text style={dynamicStyles.productEmoji}>🌾</Text>
                                                )}
                                            </View>
                                            <View style={dynamicStyles.productDetails}>
                                                <Text style={[dynamicStyles.productName, { color: colors.text }]}>{product.name}</Text>
                                                <Text style={[dynamicStyles.productPrice, { color: colors.primary }]}>
                                                    NPR {formatPrice(product.price)} / {product.stock_unit || 'kilograms'}
                                                </Text>
                                                <Text style={[dynamicStyles.productStock, { color: colors.textSecondary }]}>
                                                    Stock: {product.stock_quantity} {product.stock_unit}
                                                </Text>
                                                <View style={dynamicStyles.productActions}>
                                                    <View style={[
                                                        dynamicStyles.statusBadge,
                                                        { backgroundColor: getStatusColor(product.status) + '20' }
                                                    ]}>
                                                        <Text style={[
                                                            dynamicStyles.statusText,
                                                            { color: getStatusColor(product.status) }
                                                        ]}>
                                                            {product.status}
                                                        </Text>
                                                    </View>
                                                    <View style={dynamicStyles.actionButtons}>
                                                        <TouchableOpacity 
                                                            style={dynamicStyles.editButton}
                                                            onPress={() => handleEditProduct(product)}
                                                        >
                                                            <Text style={[dynamicStyles.editButtonText, { color: colors.primary }]}>Edit</Text>
                                                        </TouchableOpacity>
                                                        <TouchableOpacity 
                                                            style={dynamicStyles.deleteButton}
                                                            onPress={() => {
                                                                setDeleteAlert({
                                                                    visible: true,
                                                                    productId: product.id,
                                                                    productName: product.name,
                                                                });
                                                            }}
                                                        >
                                                            <Text style={[dynamicStyles.deleteButtonText, { color: colors.error }]}>Delete</Text>
                                                        </TouchableOpacity>
                                                    </View>
                                                </View>
                                            </View>
                                        </View>
                                    ))}
                                </View>
                            ) : (
                                <View style={dynamicStyles.emptyContainer}>
                                    <Text style={dynamicStyles.emptyIcon}>🌾</Text>
                                    <Text style={[dynamicStyles.emptyText, { color: colors.text }]}>
                                        {searchQuery ? 'No products found' : 'No products yet'}
                                    </Text>
                                    <Text style={[dynamicStyles.emptySubtext, { color: colors.textSecondary }]}>
                                        {searchQuery ? 'Try a different search term' : 'Add your first product to get started'}
                                    </Text>
                                </View>
                            )}
                        </>
                    )}
                </View>
            </ScrollView>

            {/* Add/Edit Product Modal */}
            <Modal
                visible={showAddModal}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setShowAddModal(false)}
            >
                <View style={dynamicStyles.modalOverlay}>
                    <View style={[dynamicStyles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={dynamicStyles.modalHeader}>
                            <Text style={[dynamicStyles.modalTitle, { color: colors.text }]}>
                                {editingProduct ? 'Edit Product' : 'Add Product'}
                            </Text>
                            <TouchableOpacity 
                                onPress={() => setShowAddModal(false)}
                                style={dynamicStyles.closeButton}
                            >
                                <Text style={[dynamicStyles.closeButtonText, { color: colors.text }]}>✕</Text>
                            </TouchableOpacity>
                        </View>

                        <ScrollView 
                            showsVerticalScrollIndicator={true} 
                            style={dynamicStyles.modalScrollView}
                            contentContainerStyle={dynamicStyles.modalScrollContent}
                        >
                            <View style={dynamicStyles.formContainer}>
                                {/* Product Image */}
                                <View style={dynamicStyles.formGroup}>
                                    <Text style={[dynamicStyles.label, { color: colors.text }]}>Product Image</Text>
                                    <View style={dynamicStyles.imageSection}>
                                        <View style={[dynamicStyles.imageContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                            {localImage ? (
                                                <Image source={{ uri: localImage }} style={dynamicStyles.productFormImage} />
                                            ) : (
                                                <Text style={dynamicStyles.imagePlaceholder}>📷</Text>
                                            )}
                                        </View>
                                        <TouchableOpacity 
                                            style={[dynamicStyles.uploadButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
                                            onPress={pickImage}
                                            disabled={uploading}
                                        >
                                            {uploading ? (
                                                <ActivityIndicator color={colors.primary} size="small" />
                                            ) : (
                                                <Text style={[dynamicStyles.uploadButtonText, { color: colors.primary }]}>Upload Image</Text>
                                            )}
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Name */}
                                <View style={dynamicStyles.formGroup}>
                                    <Text style={[dynamicStyles.label, { color: colors.text }]}>Product Name *</Text>
                                    <TextInput
                                        style={[dynamicStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                        value={formData.name}
                                        onChangeText={(text) => setFormData({ ...formData, name: text })}
                                        placeholder="e.g., Rice, Wheat, Tomato"
                                        placeholderTextColor={colors.textSecondary}
                                    />
                                </View>

                                {/* Description */}
                                <View style={dynamicStyles.formGroup}>
                                    <Text style={[dynamicStyles.label, { color: colors.text }]}>Description</Text>
                                    <TextInput
                                        style={[dynamicStyles.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                        value={formData.description}
                                        onChangeText={(text) => setFormData({ ...formData, description: text })}
                                        placeholder="Product description (optional)"
                                        placeholderTextColor={colors.textSecondary}
                                        multiline
                                        numberOfLines={3}
                                    />
                                </View>

                                {/* Price */}
                                <View style={dynamicStyles.formGroup}>
                                    <Text style={[dynamicStyles.label, { color: colors.text }]}>Price (NPR) *</Text>
                                    <TextInput
                                        style={[dynamicStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                        value={formData.price}
                                        onChangeText={(text) => setFormData({ ...formData, price: text.replace(/[^0-9.]/g, '') })}
                                        placeholder="e.g., 1300"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                    />
                                </View>

                                {/* Stock Quantity and Unit */}
                                <View style={dynamicStyles.formRow}>
                                    <View style={[dynamicStyles.formGroup, { flex: 2, marginRight: 12, marginBottom: 0 }]}>
                                        <Text style={[dynamicStyles.label, { color: colors.text }]}>Stock Quantity *</Text>
                                        <TextInput
                                            style={[dynamicStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text }]}
                                            value={formData.stockQuantity}
                                            onChangeText={(text) => setFormData({ ...formData, stockQuantity: text.replace(/[^0-9.]/g, '') })}
                                            placeholder="e.g., 50"
                                            placeholderTextColor={colors.textSecondary}
                                            keyboardType="numeric"
                                        />
                                    </View>
                                    <View style={[dynamicStyles.formGroup, { flex: 1, marginBottom: 0 }]}>
                                        <Text style={[dynamicStyles.label, { color: colors.text }]}>Unit *</Text>
                                        <TouchableOpacity 
                                            style={[dynamicStyles.dropdown, { backgroundColor: colors.background, borderColor: colors.border }]}
                                            onPress={() => setShowUnitDropdown(true)}
                                        >
                                            <Text style={[dynamicStyles.dropdownText, { color: colors.text }]}>{formData.stockUnit}</Text>
                                            <Text style={[dynamicStyles.dropdownArrow, { color: colors.textSecondary }]}>▼</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>

                                {/* Category */}
                                <View style={dynamicStyles.formGroup}>
                                    <Text style={[dynamicStyles.label, { color: colors.text }]}>Category *</Text>
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.categoryScrollView}>
                                        {productCategories.map((category) => (
                                            <TouchableOpacity
                                                key={category}
                                                style={[
                                                    dynamicStyles.categoryOption,
                                                    { 
                                                        backgroundColor: formData.category === category ? colors.primary : colors.surface,
                                                        borderColor: colors.border,
                                                    }
                                                ]}
                                                onPress={() => setFormData({ ...formData, category })}
                                            >
                                                <Text style={[
                                                    dynamicStyles.categoryOptionText,
                                                    { color: formData.category === category ? '#FFFFFF' : colors.text }
                                                ]}>
                                                    {category.charAt(0).toUpperCase() + category.slice(1)}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </ScrollView>
                                </View>

                                {/* Status */}
                                <View style={dynamicStyles.formGroup}>
                                    <Text style={[dynamicStyles.label, { color: colors.text }]}>Status</Text>
                                    <View style={dynamicStyles.statusOptions}>
                                        {['Active', 'Inactive'].map((status) => (
                                            <TouchableOpacity
                                                key={status}
                                                style={[
                                                    dynamicStyles.statusOption,
                                                    {
                                                        backgroundColor: formData.status === status ? colors.primary : colors.surface,
                                                        borderColor: colors.border,
                                                    }
                                                ]}
                                                onPress={() => setFormData({ ...formData, status })}
                                            >
                                                <Text style={[
                                                    dynamicStyles.statusOptionText,
                                                    { color: formData.status === status ? '#FFFFFF' : colors.text }
                                                ]}>
                                                    {status}
                                                </Text>
                                            </TouchableOpacity>
                                        ))}
                                    </View>
                                </View>

                                {/* Organic Certification */}
                                <View style={dynamicStyles.formGroup}>
                                    <View style={dynamicStyles.organicHeader}>
                                        <Text style={[dynamicStyles.label, { color: colors.text }]}>Organic Certification</Text>
                                        <TouchableOpacity
                                            style={[dynamicStyles.switchContainer, { backgroundColor: formData.isOrganic ? colors.primary : colors.surface }]}
                                            onPress={() => setFormData({ ...formData, isOrganic: !formData.isOrganic })}
                                        >
                                            <Text style={[dynamicStyles.switchText, { color: formData.isOrganic ? '#FFFFFF' : colors.text }]}>
                                                {formData.isOrganic ? 'Yes' : 'No'}
                                            </Text>
                                        </TouchableOpacity>
                                    </View>
                                    {formData.isOrganic && (
                                        <>
                                            <TextInput
                                                style={[dynamicStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, marginTop: 8 }]}
                                                value={formData.organicCertificationNumber}
                                                onChangeText={(text) => setFormData({ ...formData, organicCertificationNumber: text })}
                                                placeholder="Certification Number"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                            <TextInput
                                                style={[dynamicStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, marginTop: 8 }]}
                                                value={formData.organicCertificationAuthority}
                                                onChangeText={(text) => setFormData({ ...formData, organicCertificationAuthority: text })}
                                                placeholder="Certifying Authority (e.g., USDA, EU Organic)"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                            <TextInput
                                                style={[dynamicStyles.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.text, marginTop: 8 }]}
                                                value={formData.organicCertificationDate}
                                                onChangeText={(text) => setFormData({ ...formData, organicCertificationDate: text })}
                                                placeholder="Certification Date (YYYY-MM-DD)"
                                                placeholderTextColor={colors.textSecondary}
                                            />
                                        </>
                                    )}
                                </View>

                                {/* Save Button */}
                                <TouchableOpacity
                                    style={[dynamicStyles.saveButton, { backgroundColor: colors.primary }, saving && dynamicStyles.saveButtonDisabled]}
                                    onPress={handleSaveProduct}
                                    disabled={saving}
                                >
                                    {saving ? (
                                        <ActivityIndicator color="#FFFFFF" />
                                    ) : (
                                        <Text style={dynamicStyles.saveButtonText}>
                                            {editingProduct ? 'Update Product' : 'Add Product'}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Unit Dropdown Modal */}
            <Modal
                visible={showUnitDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowUnitDropdown(false)}
            >
                <TouchableOpacity 
                    style={dynamicStyles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowUnitDropdown(false)}
                >
                    <View style={[dynamicStyles.dropdownMenu, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        {['grams', 'kilograms', 'Quintal', 'dozens'].map((unit) => (
                            <TouchableOpacity
                                key={unit}
                                style={[
                                    dynamicStyles.dropdownItem,
                                    { 
                                        backgroundColor: formData.stockUnit === unit ? colors.primary + '20' : 'transparent',
                                        borderBottomColor: colors.border,
                                    }
                                ]}
                                onPress={() => {
                                    setFormData({ ...formData, stockUnit: unit });
                                    setShowUnitDropdown(false);
                                }}
                            >
                                <Text style={[
                                    dynamicStyles.dropdownItemText,
                                    { 
                                        color: formData.stockUnit === unit ? colors.primary : colors.text,
                                        fontWeight: formData.stockUnit === unit ? '600' : '400',
                                    }
                                ]}>
                                    {unit}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </TouchableOpacity>
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

            {/* Delete Confirmation SweetAlert */}
            <SweetAlert
                visible={deleteAlert.visible}
                type="warning"
                title="Delete Product"
                message={`Are you sure you want to delete "${deleteAlert.productName}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                showCancel={true}
                onConfirm={() => {
                    setDeleteAlert({ ...deleteAlert, visible: false });
                    if (deleteAlert.productId) {
                        handleDeleteProduct(deleteAlert.productId);
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
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
    },
    addButton: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
    },
    addButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
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
    },
    searchIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    searchInput: {
        flex: 1,
        fontSize: 16,
    },
    categoryFilterContainer: {
        marginBottom: 20,
    },
    categoryFilterContent: {
        paddingRight: 20,
    },
    categoryFilterChip: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
    },
    categoryFilterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    loadingContainer: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    productsList: {
        marginTop: 8,
    },
    productCard: {
        flexDirection: 'row',
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    productImageContainer: {
        width: 80,
        height: 80,
        borderRadius: 8,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    productEmoji: {
        fontSize: 40,
    },
    productImage: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    productDetails: {
        flex: 1,
    },
    productNameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
        marginBottom: 4,
    },
    productName: {
        fontSize: 16,
        fontWeight: '700',
        marginRight: 8,
    },
    organicBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 8,
    },
    organicBadgeText: {
        fontSize: 11,
        fontWeight: '600',
    },
    productPrice: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 4,
    },
    productStock: {
        fontSize: 12,
        marginBottom: 8,
    },
    productActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    statusBadge: {
        paddingVertical: 4,
        paddingHorizontal: 8,
        borderRadius: 4,
    },
    statusText: {
        fontSize: 12,
        fontWeight: '600',
    },
    actionButtons: {
        flexDirection: 'row',
        gap: 8,
    },
    editButton: {
        paddingVertical: 4,
        paddingHorizontal: 12,
    },
    editButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    deleteButton: {
        paddingVertical: 4,
        paddingHorizontal: 12,
    },
    deleteButtonText: {
        fontSize: 14,
        fontWeight: '600',
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
        marginBottom: 8,
    },
    emptySubtext: {
        fontSize: 14,
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
        height: height * 0.8,
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
    modalTitle: {
        fontSize: 24,
        fontWeight: '700',
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
    },
    modalScrollView: {
        flex: 1,
    },
    modalScrollContent: {
        flexGrow: 1,
        paddingBottom: 20,
    },
    formContainer: {
        padding: 20,
    },
    formGroup: {
        marginBottom: 20,
    },
    formRow: {
        flexDirection: 'row',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 8,
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    textArea: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    imageSection: {
        alignItems: 'center',
        marginTop: 8,
    },
    imageContainer: {
        width: 120,
        height: 120,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 1,
        overflow: 'hidden',
    },
    productFormImage: {
        width: '100%',
        height: '100%',
    },
    imagePlaceholder: {
        fontSize: 48,
    },
    uploadButton: {
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        borderWidth: 1,
    },
    uploadButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    dropdown: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    dropdownText: {
        fontSize: 16,
        fontWeight: '600',
    },
    dropdownArrow: {
        fontSize: 12,
        marginLeft: 8,
    },
    dropdownMenu: {
        borderRadius: 12,
        borderWidth: 1,
        overflow: 'hidden',
        minWidth: 150,
        maxHeight: 300,
        alignSelf: 'center',
        marginTop: '50%',
    },
    dropdownItem: {
        paddingVertical: 16,
        paddingHorizontal: 20,
        borderBottomWidth: 1,
    },
    dropdownItemText: {
        fontSize: 16,
    },
    categoryScrollView: {
        marginTop: 8,
    },
    categoryOption: {
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 8,
        marginRight: 8,
        borderWidth: 1,
    },
    categoryOptionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    statusOptions: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginTop: 8,
    },
    statusOption: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 8,
        borderWidth: 1,
    },
    statusOptionText: {
        fontSize: 14,
        fontWeight: '600',
    },
    saveButton: {
        paddingVertical: 16,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonDisabled: {
        opacity: 0.6,
    },
    saveButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default FarmerProductsScreen;
