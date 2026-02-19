import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { compressImages, compressImage } from '../utils/imageCompression';

const { width } = Dimensions.get('window');
const MAX_IMAGES = 20;

interface EnhancedImagePickerProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  maxImages?: number;
  title?: string;
  required?: boolean;
}

const EnhancedImagePicker: React.FC<EnhancedImagePickerProps> = ({
  images,
  onImagesChange,
  maxImages = MAX_IMAGES,
  title = "Images",
  required = false,
}) => {
  const [loading, setLoading] = useState(false);

  const requestPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera roll permissions to select images.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    if (images.length >= maxImages) {
      Alert.alert(
        'Maximum Images Reached',
        `You can only select up to ${maxImages} images.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    setLoading(true);

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: (ImagePicker as any).MediaType?.Images || ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 1, // Keep original quality for preview - compression happens during upload
        allowsEditing: false,
        selectionLimit: maxImages - images.length,
      });

      if (!result.canceled) {
        // Store original images for preview - compression will happen only during upload
        const selectedUris = result.assets.map(asset => asset.uri);
        console.log("📸 Storing original images for preview (compression will happen during upload)");
        const newImages = [...images, ...selectedUris];
        onImagesChange(newImages.slice(0, maxImages));
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const takePhoto = async () => {
    if (images.length >= maxImages) {
      Alert.alert(
        'Maximum Images Reached',
        `You can only select up to ${maxImages} images.`,
        [{ text: 'OK' }]
      );
      return;
    }

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant camera permissions to take photos.',
        [{ text: 'OK' }]
      );
      return;
    }

    setLoading(true);

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: (ImagePicker as any).MediaType?.Images || ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1, // Keep original quality for preview - compression happens during upload
      });

      if (!result.canceled) {
        // Store original image for preview - compression will happen only during upload
        const selectedUri = result.assets[0].uri;
        console.log("📸 Storing original image for preview (compression will happen during upload)");
        const newImages = [...images, selectedUri];
        onImagesChange(newImages.slice(0, maxImages));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Images',
      'Choose how you want to add images',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImages },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  };

  const renderImage = (uri: string, index: number) => (
    <View style={styles.imageContainer}>
      <Image source={{ uri }} style={styles.image} />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeImage(index)}
      >
        <Ionicons name="close-circle" size={24} color={COLORS.primary} />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {title} {required && <Text style={styles.required}>*</Text>}
        </Text>
        <Text style={styles.subtitle}>
          {images.length}/{maxImages} images selected
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.imageScrollView}
        contentContainerStyle={styles.imageScrollContent}
      >
        {images.map((uri, index) => (
          <React.Fragment key={`image-${index}-${uri}`}>
            {renderImage(uri, index)}
          </React.Fragment>
        ))}
        
        {images.length < maxImages && (
          <TouchableOpacity
            style={styles.addButton}
            onPress={showImageOptions}
            disabled={loading}
          >
            <Ionicons
              name={loading ? "hourglass-outline" : "images-outline"}
              size={32}
              color={COLORS.primary}
            />
            <Text style={styles.addButtonText}>
              {loading ? 'Loading...' : 'Add Images'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {images.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="images-outline" size={48} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>No images selected</Text>
          <Text style={styles.emptySubtext}>
            Tap the add button to select up to {maxImages} images
          </Text>
        </View>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  required: {
    color: COLORS.primary,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  imageScrollView: {
    maxHeight: 120,
  },
  imageScrollContent: {
    paddingRight: 10,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  removeButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: COLORS.white,
    borderRadius: 12,
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.lightGray,
  },
  addButtonText: {
    fontSize: 10,
    color: COLORS.primary,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    marginVertical: 10,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    textAlign: 'center',
  },
});

export default EnhancedImagePicker;
