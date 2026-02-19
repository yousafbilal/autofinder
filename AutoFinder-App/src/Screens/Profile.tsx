import React, { useState, useEffect } from "react";
import { View, Text, TextInput, Image, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import { API_URL } from "../../config";
import { compressImage } from "../utils/imageCompression";
import { COLORS } from "../constants/colors";
import { getAuthHeaders } from "../utils/authUtils";

const Profile = () => {
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    image: "",
    dateAdded: "",
  });

  const [isEditing, setIsEditing] = useState(false); // Track edit mode
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [originalProfile, setOriginalProfile] = useState<any>(null);

  // Fetch user details from AsyncStorage
  const fetchUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem("user");
      if (storedUserData) {
        const userData = JSON.parse(storedUserData);
        console.log("📥 Fetched User Data from AsyncStorage:", userData); // Debugging
        const userIdValue = userData._id || userData.userId;
        setUserId(userIdValue);
        
        // Construct image URL properly
        let imageUrl = null;
        if (userData.profileImage) {
          // Check if it's already a full URL
          if (userData.profileImage.startsWith('http')) {
            imageUrl = userData.profileImage;
          } 
          // Check if it already starts with /uploads/ (full path from backend)
          else if (userData.profileImage.startsWith('/uploads/')) {
            imageUrl = `${API_URL}${userData.profileImage}`;
          } 
          // Just filename - construct full path
          else {
            imageUrl = `${API_URL}/uploads/profile_pics/${userData.profileImage}`;
          }
        }
        
        const profileData = {
          name: userData.name || "",
          email: userData.email || "",
          phone: userData.phone || "",
          image: imageUrl,
          dateAdded: userData.dateAdded || "",
        };
        
        console.log("🖼️ Profile Image URL:", imageUrl);
        console.log("📋 Profile Data:", profileData);
        
        setProfile(profileData);
        setOriginalProfile(userData); // Store original for comparison
      } else {
        console.log("No user data found in AsyncStorage.");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      console.log("🔄 Screen focused, refreshing profile data...");
      fetchUserData();
    }, [])
  );

  // Function to update profile fields
  const handleChange = (field: keyof typeof profile, value: string) => {
    setProfile((prev) => ({ ...prev, [field]: value }));
  };

  // Function to pick image from gallery or camera
  const pickImage = async () => {
    try {
      // Show action sheet for image source
      Alert.alert(
        "Select Image Source",
        "Choose how you want to upload your profile picture",
        [
          {
            text: "Camera",
            onPress: async () => {
              try {
                const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
                if (cameraStatus !== 'granted') {
                  Alert.alert("Permission Required", "Please grant camera permissions to take photos.");
                  return;
                }

                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.8,
                });

                if (!result.canceled && result.assets && result.assets[0]) {
                  const imageUri = result.assets[0].uri;
                  setSelectedImage(imageUri);
                  setProfile(prev => ({ ...prev, image: imageUri }));
                  // Enable edit mode if not already enabled
                  if (!isEditing) {
                    setIsEditing(true);
                  }
                }
              } catch (error) {
                console.error("Error taking photo:", error);
                Alert.alert("Error", "Failed to take photo. Please try again.");
              }
            }
          },
          {
            text: "Gallery",
            onPress: async () => {
              try {
                const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                if (status !== 'granted') {
                  Alert.alert("Permission Required", "Please grant gallery permissions to select images.");
                  return;
                }

                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [1, 1],
                  quality: 0.8,
                });

                if (!result.canceled && result.assets && result.assets[0]) {
                  const imageUri = result.assets[0].uri;
                  setSelectedImage(imageUri);
                  setProfile(prev => ({ ...prev, image: imageUri }));
                  // Enable edit mode if not already enabled
                  if (!isEditing) {
                    setIsEditing(true);
                  }
                }
              } catch (error) {
                console.error("Error picking image:", error);
                Alert.alert("Error", "Failed to pick image. Please try again.");
              }
            }
          },
          {
            text: "Cancel",
            style: "cancel"
          }
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error("Error showing image picker:", error);
      Alert.alert("Error", "Failed to open image picker");
    }
  };

  // Function to upload profile image
  const uploadProfileImage = async (imageUri: string) => {
    if (!userId) {
      Alert.alert("Error", "User ID not found");
      return null;
    }

    try {
      setUploadingImage(true);
      
      // FIXED: Compress image before upload to avoid 413 error (Nginx file size limit)
      console.log("🔄 Compressing profile image...");
      const compressedUri = await compressImage(imageUri, 800, 800, 0.7); // Smaller size for profile pics
      console.log("✅ Image compressed successfully");
      
      const formData = new FormData();
      
      // Get filename from URI
      const filename = compressedUri.split('/').pop() || `profile_${Date.now()}.jpg`;
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('profilePic', {
        uri: Platform.OS === 'android' ? compressedUri : compressedUri.replace('file://', ''),
        name: filename,
        type,
      } as any);
      console.log("📤 Uploading compressed profile image");

      console.log("📤 Uploading profile image to:", `${API_URL}/edit-profile-pic/${userId}`);
      
      const authHeaders = await getAuthHeaders();
      // Remove Content-Type from authHeaders for FormData - browser will set it with boundary
      const { 'Content-Type': _, ...headersWithoutContentType } = authHeaders;
      
      const response = await fetch(`${API_URL}/edit-profile-pic/${userId}`, {
        method: 'PUT',
        headers: headersWithoutContentType,
        body: formData,
        // Don't set Content-Type header - let fetch set it automatically with boundary
      });

      console.log("📡 Response status:", response.status);
      console.log("📡 Response statusText:", response.statusText);
      console.log("📡 Response headers:", JSON.stringify(Object.fromEntries(response.headers.entries())));
      
      const text = await response.text();
      console.log("📄 Raw response text (first 500 chars):", text.substring(0, 500));
      
      let result: any = {};
      if (text && !text.trim().startsWith('<')) {
        try { 
          result = JSON.parse(text); 
        } catch (e) { 
          console.error("❌ JSON parse error:", e);
          result = { success: false, message: "Invalid server response." }; 
        }
      } else {
        console.error("❌ Response is HTML, not JSON. First 200 chars:", text.substring(0, 200));
        result = { success: false, message: "Server returned invalid response. Please try again." };
      }
      console.log("📥 Profile image upload response:", result);
      console.log("🖼️ Uploaded profileImage from backend:", result.user?.profileImage);

      if (response.ok && result.user) {
        const imageFilename = result.user.profileImage;
        console.log("✅ Image upload successful, filename:", imageFilename);
        
        // Immediately update AsyncStorage with new profile image
        if (imageFilename) {
          try {
            const currentUserData = await AsyncStorage.getItem('user');
            if (currentUserData) {
              const userData = JSON.parse(currentUserData);
              const updatedUserData = {
                ...userData,
                profileImage: imageFilename,
              };
              await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
              console.log("💾 Profile image saved to AsyncStorage:", imageFilename);
            }
          } catch (error) {
            console.error("⚠️ Error updating AsyncStorage after image upload:", error);
          }
        }
        
        return imageFilename; // Return the filename
      } else {
        throw new Error(result.message || "Failed to upload image");
      }
    } catch (error) {
      console.error("❌ Error uploading profile image:", error);
      Alert.alert("Error", "Failed to upload profile image. Please try again.");
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // Function to save profile changes
  const handleSave = async () => {
    if (!userId) {
      Alert.alert("Error", "User ID not found");
      return;
    }

    try {
      setSaving(true);

      // Upload image first if changed
      let newProfileImage = originalProfile?.profileImage || null;
      console.log("🔍 Starting save - newProfileImage (before upload):", newProfileImage);
      console.log("🔍 selectedImage:", selectedImage);
      console.log("🔍 profile.image:", profile.image);
      console.log("🔍 originalProfile?.profileImage:", originalProfile?.profileImage);
      
      if (selectedImage) {
        // Check if this is a new image (local URI vs server URL)
        const isLocalImage = selectedImage.startsWith('file://') || selectedImage.startsWith('content://') || !selectedImage.startsWith('http');
        const isDifferentFromCurrent = !profile.image || selectedImage !== profile.image;
        
        console.log("📷 Image check - isLocalImage:", isLocalImage, "isDifferentFromCurrent:", isDifferentFromCurrent);
        
        if (isLocalImage || isDifferentFromCurrent) {
          console.log("📷 New image selected, uploading...");
          const uploadedImageName = await uploadProfileImage(selectedImage);
          console.log("📷 Upload result:", uploadedImageName);
          
          if (uploadedImageName) {
            newProfileImage = uploadedImageName;
            console.log("✅ Image uploaded successfully, newProfileImage set to:", newProfileImage);
          } else {
            console.error("❌ Image upload failed, aborting save");
            // If image upload fails, don't proceed with profile update
            setSaving(false);
            return;
          }
        } else {
          console.log("ℹ️ Using existing profile image");
        }
      } else {
        console.log("ℹ️ No selected image, keeping current profileImage:", newProfileImage);
      }
      
      console.log("🔍 Final newProfileImage before saving:", newProfileImage);

      // Update profile details
      const updateData = {
        name: profile.name,
        phone: profile.phone,
        // Note: Backend expects 'dob' but we're using dateAdded - adjust if needed
        // Email might not be editable based on backend endpoint
      };

      console.log("📤 Updating profile details:", updateData);
      
      // Prepare date for backend - use original dateAdded or current date
      const dateToSend = originalProfile?.dateAdded || new Date().toISOString();
      
      const authHeaders = await getAuthHeaders();
      const response = await fetch(`${API_URL}/edit-profile-details/${userId}`, {
        method: 'PUT',
        headers: authHeaders,
        body: JSON.stringify({
          name: updateData.name,
          phone: updateData.phone,
          dob: dateToSend, // Backend expects 'dob' field
        }),
      });

      const text = await response.text();
      let result: any = {};
      if (text && !text.trim().startsWith('<')) {
        try { result = JSON.parse(text); } catch { result = { success: false, message: "Invalid server response." }; }
      } else {
        result = { success: false, message: "Server returned invalid response. Please try again." };
      }
      console.log("📥 Profile update response:", result);

      if (response.ok && result.user) {
        // Priority: newProfileImage (just uploaded) > originalProfile?.profileImage > result.user.profileImage
        // Note: edit-profile-details endpoint doesn't return profileImage, so we use the one we already have
        const finalProfileImage = newProfileImage || originalProfile?.profileImage || result.user.profileImage;
        
        console.log("🖼️ Determining final profileImage:");
        console.log("  - newProfileImage (uploaded):", newProfileImage);
        console.log("  - originalProfile?.profileImage:", originalProfile?.profileImage);
        console.log("  - result.user.profileImage:", result.user.profileImage);
        console.log("  - Final choice:", finalProfileImage);
        
        if (!finalProfileImage) {
          console.warn("⚠️ WARNING: finalProfileImage is null/undefined! This might cause issues.");
        }
        
        // Update AsyncStorage with new user data - ensure all fields are preserved
        const updatedUserData = {
          ...originalProfile,
          _id: result.user._id || originalProfile?._id || userId,
          userId: result.user._id || originalProfile?.userId || userId,
          name: result.user.name || profile.name,
          phone: result.user.phone || profile.phone,
          email: result.user.email || originalProfile?.email || profile.email,
          profileImage: finalProfileImage || null, // Explicitly set, even if null
          dateAdded: result.user.dateAdded || originalProfile?.dateAdded || profile.dateAdded,
        };
        
        console.log("💾 Updated user data (before saving):", {
          name: updatedUserData.name,
          phone: updatedUserData.phone,
          profileImage: updatedUserData.profileImage,
        });

        console.log("💾 Saving to AsyncStorage...");
        await AsyncStorage.setItem('user', JSON.stringify(updatedUserData));
        console.log("✅ AsyncStorage save completed");
        
        // Verify it was saved correctly
        const verify = await AsyncStorage.getItem('user');
        const verifiedData = verify ? JSON.parse(verify) : null;
        console.log("🔍 Verification - Full AsyncStorage data:", verifiedData);
        console.log("🖼️ Verification - profileImage in AsyncStorage:", verifiedData?.profileImage);
        
        if (!verifiedData?.profileImage && finalProfileImage) {
          console.error("❌ ERROR: profileImage was NOT saved to AsyncStorage even though we had a value!");
        }
        
        // Construct image URL properly
        let imageUrl = null;
        if (finalProfileImage) {
          if (finalProfileImage.startsWith('http')) {
            imageUrl = finalProfileImage;
          } else if (finalProfileImage.startsWith('/uploads/')) {
            imageUrl = `${API_URL}${finalProfileImage}`;
          } else {
            imageUrl = `${API_URL}/uploads/profile_pics/${finalProfileImage}`;
          }
        }
        
        // Update profile state with new image URL
        setProfile(prev => ({
          ...prev,
          name: updatedUserData.name,
          phone: updatedUserData.phone,
          image: imageUrl,
        }));
        
        setOriginalProfile(updatedUserData);
        setSelectedImage(null);
        setIsEditing(false);

        Alert.alert("Success", "Profile updated successfully!");
      } else {
        throw new Error(result.message || "Failed to update profile");
      }
    } catch (error: any) {
      console.error("❌ Error saving profile:", error);
      Alert.alert("Error", error.message || "Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  // Function to cancel editing
  const handleCancel = () => {
    // Reset to original values
    if (originalProfile) {
      // Construct image URL properly
      let imageUrl = null;
      if (originalProfile.profileImage) {
        if (originalProfile.profileImage.startsWith('http')) {
          imageUrl = originalProfile.profileImage;
        } else if (originalProfile.profileImage.startsWith('/uploads/')) {
          imageUrl = `${API_URL}${originalProfile.profileImage}`;
        } else {
          imageUrl = `${API_URL}/uploads/profile_pics/${originalProfile.profileImage}`;
        }
      }
      
      setProfile({
        name: originalProfile.name || "",
        email: originalProfile.email || "",
        phone: originalProfile.phone || "",
        image: imageUrl,
        dateAdded: originalProfile.dateAdded || "",
      });
    }
    setSelectedImage(null);
    setIsEditing(false);
  };  

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Profile Settings</Text>

      {/* Profile Picture */}
      <View style={styles.profileSection}>
        {profile.image ? (
          <Image source={{ uri: profile.image }} 
          style={styles.profileImage} />
        ) : (
          <View style={styles.profileImagePlaceholder}>
            <Feather name="user" size={40} color="#fff" />
          </View>
        )}
        {uploadingImage && (
          <View style={styles.imageUploadingOverlay}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
        <TouchableOpacity 
          style={styles.editImageButton}
          onPress={pickImage}
          disabled={uploadingImage}
          activeOpacity={0.7}
        >
          <Feather name="camera" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Profile Details */}
      <View style={styles.profileDetails}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput 
            style={styles.input} 
            value={profile.name} 
            onChangeText={(text) => handleChange("name", text)} 
            editable={isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={[styles.input, !isEditing && styles.inputDisabled]} 
            value={profile.email} 
            editable={false}
            placeholder="Email cannot be changed"
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput 
            style={styles.input} 
            value={profile.phone} 
            onChangeText={(text) => handleChange("phone", text)} 
            editable={isEditing}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Joining</Text>
          <TextInput 
            style={[styles.input, styles.dateInput, !isEditing && styles.inputDisabled]} 
            value={profile.dateAdded ? new Date(profile.dateAdded).toLocaleDateString() : ""} 
            editable={false}
            placeholder="Date of joining"
          />
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        {isEditing ? (
          <>
            <TouchableOpacity 
              style={[styles.saveButton, saving && styles.buttonDisabled]} 
              onPress={handleSave}
              disabled={saving || uploadingImage}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.cancelButton, saving && styles.buttonDisabled]} 
              onPress={handleCancel}
              disabled={saving || uploadingImage}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity style={styles.editButton} onPress={() => setIsEditing(true)}>
            <Feather name="edit-3" size={20} color="white" />
            <Text style={styles.editButtonText}>Edit Profile</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
    padding: 15,
    marginTop: 40,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#CD0100",
    alignSelf: "center",
    marginBottom: 20,
  },
  profileSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  profileImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  profileImagePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#CD0100",
    justifyContent: "center",
    alignItems: "center",
  },
  editImageButton: {
    position: "absolute",
    bottom: 5,
    right: 10,
    backgroundColor: "#CD0100",
    borderRadius: 20,
    padding: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
    minWidth: 36,
    minHeight: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageUploadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 60,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 5,
  },
  profileDetails: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    elevation: 2,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#555",
    marginBottom: 5,
  },
  input: {
    backgroundColor: "#F2F2F2",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
    color: "#333",
    borderWidth: 1,
    borderColor: "transparent",
  },
  inputDisabled: {
    backgroundColor: "#E5E5E5",
    color: "#666",
  },
  dateInput: {
    textAlign: "left",
  },
  bioInput: {
    height: 80,
    textAlignVertical: "top",
  },
  buttonContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#555",
    padding: 12,
    borderRadius: 8,
    width: "80%",
    justifyContent: "center",
  },
  editButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
  saveButton: {
    backgroundColor: "#CD0100",
    padding: 12,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
    marginBottom: 12,
    minHeight: 48,
    justifyContent: "center",
  },
  saveButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "bold",
  },
  cancelButton: {
    backgroundColor: "#999",
    padding: 12,
    borderRadius: 8,
    width: "80%",
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default Profile;
