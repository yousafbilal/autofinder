
import React, { useState, useEffect } from "react"
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert, ActivityIndicator, Platform, Image, Linking } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons, FontAwesome } from "@expo/vector-icons"
import { COLORS } from "../constants/colors"
import { useNavigation } from "@react-navigation/native"
import * as ImagePicker from "expo-image-picker"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { API_URL } from "../../config"

const SupportPage = () => {
  const navigation = useNavigation()
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [category, setCategory] = useState("")
  const [attachments, setAttachments] = useState([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [userData, setUserData] = useState(null)

  const categories = ["Account Issues", "Payment Problems", "Listing Issues", "App Bugs", "Feature Request", "Other"]

  useEffect(() => {
    fetchUserData()
  }, [])

  const fetchUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem('user')
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData)
        console.log("📥 SupportPage - Fetched user data:", parsedData)
        setUserData(parsedData)
      } else {
        console.log("⚠️ SupportPage - No user data found in AsyncStorage")
      }
    } catch (error) {
      console.error("Error fetching user data:", error)
    }
  }

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert("Error", "Please enter a subject")
      return
    }

    if (!message.trim()) {
      Alert.alert("Error", "Please enter your message")
      return
    }

    if (!category) {
      Alert.alert("Error", "Please select a category")
      return
    }

    // Check for userId or _id (both are possible depending on how user data is stored)
    const userId = userData?.userId || userData?._id
    if (!userData || !userId) {
      console.log("❌ SupportPage - User data check failed:", { userData, userId })
      Alert.alert("Error", "Please login to submit a support request")
      return
    }

    console.log("✅ SupportPage - User data valid, submitting request with userId:", userId)

    setIsSubmitting(true)

    try {
      const formData = new FormData()
      formData.append('userId', userId)
      formData.append('userName', userData.name || 'Unknown User')
      formData.append('userEmail', userData.email || '')
      formData.append('category', category)
      formData.append('subject', subject)
      formData.append('message', message)

      // Add attachments
      attachments.forEach((attachment, index) => {
        const filename = attachment.uri.split('/').pop() || `attachment_${index + 1}.jpg`
        const match = /\.(\w+)$/.exec(filename)
        const type = match ? `image/${match[1]}` : 'image/jpeg'

        formData.append('attachments', {
          uri: Platform.OS === 'android' ? attachment.uri : attachment.uri.replace('file://', ''),
          name: filename,
          type,
        } as any)
      })

      const response = await fetch(`${API_URL}/support-request`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      const result = await response.json()

      if (response.ok) {
        Alert.alert("Success", "Your support request has been submitted. We'll get back to you soon.", [
          {
            text: "OK",
            onPress: () => {
              setSubject("")
              setMessage("")
              setCategory("")
              setAttachments([])
              navigation.goBack()
            },
          },
        ])
      } else {
        Alert.alert("Error", result.message || "Failed to submit support request. Please try again.")
      }
    } catch (error) {
      console.error("Error submitting support request:", error)
      Alert.alert("Error", "Failed to submit support request. Please check your connection and try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleAddAttachment = async () => {
    if (attachments.length >= 3) {
      Alert.alert("Limit Reached", "You can only attach up to 3 files")
      return
    }

    try {
      // Request permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
      if (status !== 'granted') {
        Alert.alert("Permission Required", "Please grant permission to access your photos")
        return
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      })

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0]
        const filename = asset.uri.split('/').pop() || `attachment_${Date.now()}.jpg`
        const fileSize = asset.fileSize || 0
        const sizeInMB = (fileSize / (1024 * 1024)).toFixed(2)

        const newAttachment = {
          id: Date.now().toString(),
          uri: asset.uri,
          name: filename,
          size: `${sizeInMB} MB`,
          fileSize: fileSize,
        }

        setAttachments([...attachments, newAttachment])
      }
    } catch (error) {
      console.error("Error picking image:", error)
      Alert.alert("Error", "Failed to pick image. Please try again.")
    }
  }

  const handleRemoveAttachment = (id) => {
    setAttachments(attachments.filter((item) => item.id !== id))
  }

  const selectCategory = (value) => {
    setCategory(value)
    setShowCategoryDropdown(false)
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contact Support</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} style={styles.infoIcon} />
          <Text style={styles.infoText}>
            Our support team is available Monday to Friday, 9 AM to 6 PM. We'll respond to your inquiry within 24 hours.
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.formGroup}>
            <Text style={styles.label}>Category *</Text>
            <TouchableOpacity
              style={styles.dropdownButton}
              onPress={() => setShowCategoryDropdown(!showCategoryDropdown)}
            >
              <Text style={category ? styles.dropdownText : styles.dropdownPlaceholder}>
                {category || "Select a category"}
              </Text>
              <Ionicons name={showCategoryDropdown ? "chevron-up" : "chevron-down"} size={20} color={COLORS.darkGray} />
            </TouchableOpacity>

            {showCategoryDropdown && (
              <View style={styles.dropdownMenu}>
                {categories.map((item, index) => {
                  const itemKey = typeof item === 'string' ? item : (typeof item === 'object' && item?.toString ? String(item.toString()) : `category-${index}`);
                  return (
                    <TouchableOpacity key={itemKey} style={styles.dropdownItem} onPress={() => selectCategory(item)}>
                      <Text style={[styles.dropdownItemText, category === item && styles.dropdownItemTextSelected]}>
                        {item}
                      </Text>
                      {category === item && <Ionicons name="checkmark" size={18} color={COLORS.primary} />}
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Subject *</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter subject"
              value={subject}
              onChangeText={setSubject}
              placeholderTextColor={COLORS.darkGray}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Message *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Describe your issue in detail"
              value={message}
              onChangeText={setMessage}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              placeholderTextColor={COLORS.darkGray}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Attachments (Optional)</Text>
            <Text style={styles.attachmentInfo}>Add screenshots or relevant files (max 3)</Text>

            <View style={styles.attachmentsContainer}>
              {attachments.map((attachment) => (
                <View key={attachment.id} style={styles.attachmentItem}>
                  <View style={styles.attachmentDetails}>
                    {attachment.uri ? (
                      <Image source={{ uri: attachment.uri }} style={styles.attachmentThumbnail} />
                    ) : (
                      <Ionicons name="image-outline" size={20} color={COLORS.darkGray} />
                    )}
                    <View style={styles.attachmentTextContainer}>
                      <Text style={styles.attachmentName} numberOfLines={1}>
                        {attachment.name}
                      </Text>
                      <Text style={styles.attachmentSize}>{attachment.size}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => handleRemoveAttachment(attachment.id)}>
                    <Ionicons name="close-circle" size={20} color={COLORS.darkGray} />
                  </TouchableOpacity>
                </View>
              ))}

              {attachments.length < 3 && (
                <TouchableOpacity style={styles.addAttachmentButton} onPress={handleAddAttachment}>
                  <Ionicons name="add" size={24} color={COLORS.primary} />
                  <Text style={styles.addAttachmentText}>Add Attachment</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <TouchableOpacity
            style={[styles.submitButton, (!subject || !message || !category) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!subject || !message || !category || isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color={COLORS.white} size="small" />
            ) : (
              <>
                <Ionicons name="paper-plane" size={20} color={COLORS.white} />
                <Text style={styles.submitButtonText}>Submit Request</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.alternativeContactSection}>
          <Text style={styles.alternativeContactTitle}>Other ways to contact us</Text>

          <TouchableOpacity 
            style={styles.alternativeContactItem} 
            onPress={() => {
              const whatsappUrl = `https://wa.me/923348400943`
              Linking.openURL(whatsappUrl).catch(() => {
                Alert.alert("Error", "Could not open WhatsApp")
              })
            }}
          >
            <View style={[styles.alternativeContactIcon, { backgroundColor: "#25D366" }]}>
              <FontAwesome name="whatsapp" size={20} color={COLORS.white} />
            </View>
            <View style={styles.alternativeContactInfo}>
              <Text style={styles.alternativeContactLabel}>WhatsApp</Text>
              <Text style={styles.alternativeContactValue}>+923348400943</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.alternativeContactItem}
            onPress={() => {
              Linking.openURL(`mailto:autofinder786@gmail.com`).catch(() => {
                Alert.alert("Error", "Could not open email app")
              })
            }}
          >
            <View style={[styles.alternativeContactIcon, { backgroundColor: "#2196F3" }]}>
              <Ionicons name="mail" size={20} color={COLORS.white} />
            </View>
            <View style={styles.alternativeContactInfo}>
              <Text style={styles.alternativeContactLabel}>Email</Text>
              <Text style={styles.alternativeContactValue}>autofinder786@gmail.com</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.alternativeContactItem}
            onPress={() => {
              Linking.openURL("https://www.facebook.com/share/1DM7ifH5ST/").catch(() => {
                Alert.alert("Error", "Could not open Facebook")
              })
            }}
          >
            <View style={[styles.alternativeContactIcon, { backgroundColor: "#1877F2" }]}>
              <Ionicons name="logo-facebook" size={20} color={COLORS.white} />
            </View>
            <View style={styles.alternativeContactInfo}>
              <Text style={styles.alternativeContactLabel}>Facebook</Text>
              <Text style={styles.alternativeContactValue}>autofinder.pk</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={COLORS.darkGray} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.lightGray,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
  },
  content: {
    flex: 1,
  },
  infoBox: {
    backgroundColor: "#F0F8FF",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    margin: 16,
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
  },
  formContainer: {
    padding: 16,
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.black,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.black,
  },
  textArea: {
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.black,
    height: 120,
  },
  dropdownButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  dropdownText: {
    fontSize: 16,
    color: COLORS.black,
  },
  dropdownPlaceholder: {
    fontSize: 16,
    color: COLORS.darkGray,
  },
  dropdownMenu: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    backgroundColor: COLORS.white,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    zIndex: 1000,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  dropdownItemText: {
    fontSize: 16,
    color: COLORS.black,
  },
  dropdownItemTextSelected: {
    color: COLORS.primary,
    fontWeight: "500",
  },
  attachmentInfo: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 12,
  },
  attachmentsContainer: {
    marginTop: 8,
  },
  attachmentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  attachmentDetails: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  attachmentThumbnail: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 12,
  },
  attachmentTextContainer: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    color: COLORS.black,
    marginBottom: 2,
  },
  attachmentSize: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  addAttachmentButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    marginTop: 8,
  },
  addAttachmentText: {
    fontSize: 16,
    color: COLORS.primary,
    marginLeft: 8,
  },
  submitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 16,
    marginTop: 24,
  },
  submitButtonDisabled: {
    backgroundColor: COLORS.lightGray,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.white,
    marginLeft: 8,
  },
  alternativeContactSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    marginTop: 16,
  },
  alternativeContactTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.black,
    marginBottom: 16,
  },
  alternativeContactItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  alternativeContactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  alternativeContactInfo: {
    flex: 1,
  },
  alternativeContactLabel: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  alternativeContactValue: {
    fontSize: 16,
    color: COLORS.black,
    fontWeight: "500",
  },
})

export default SupportPage;
