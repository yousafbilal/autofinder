import React, { useState, useEffect } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator 
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_URL } from "../../config";

const SecurityScreen = () => {
  const navigation = useNavigation();
  const [userData, setUserData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Fetch user data on mount
  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const storedUserData = await AsyncStorage.getItem("user");
      if (storedUserData) {
        const parsedData = JSON.parse(storedUserData);
        setUserData(parsedData);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Handle Password Change
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert("Error", "Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "New passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long.");
      return;
    }

    setIsChangingPassword(true);
    try {
      // FIXED: Implement real password change API
      const storedUserData = await AsyncStorage.getItem('user');
      if (!storedUserData) {
        Alert.alert("Error", "User session not found. Please login again.");
        return;
      }

      const userData = JSON.parse(storedUserData);
      const token = userData.token;

      if (!token) {
        Alert.alert("Error", "Authentication token not found. Please login again.");
        return;
      }

      const response = await fetch(`${API_URL}/change-password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          currentPassword: currentPassword,
          newPassword: newPassword
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert("Success", "Password changed successfully!");
        setIsEditing(false);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        Alert.alert("Error", data.message || "Failed to change password. Please check your current password.");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      Alert.alert("Error", "Failed to change password. Please check your internet connection and try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Handle Account Deletion - Professional Implementation
  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone and will remove all your data including:\n\n• Your profile and account information\n• All your posted ads\n• Your messages and conversations\n• Your favorites and saved items\n• All other associated data",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete Account",
          style: "destructive",
          onPress: () => {
            // Prompt for password before deletion
            Alert.prompt(
              "Confirm Password",
              "Please enter your password to confirm account deletion:",
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                {
                  text: "Delete",
                  style: "destructive",
                  onPress: (password) => {
                    if (!password || password.trim() === '') {
                      Alert.alert("Error", "Password is required to delete your account");
                      return;
                    }
                    confirmDeleteAccount(password);
                  }
                }
              ],
              "secure-text"
            );
          }
        }
      ],
      { cancelable: true }
    );
  };

  const confirmDeleteAccount = async (password: string) => {
    try {
      setIsDeleting(true);

      // Get authentication token
      const storedUserData = await AsyncStorage.getItem("user");
      if (!storedUserData) {
        Alert.alert("Error", "User session not found. Please login again.");
        navigation.reset({
          index: 0,
          routes: [{ name: 'LoginScreen' }],
        });
        return;
      }

      const user = JSON.parse(storedUserData);
      const token = user.token || await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Error", "Authentication token not found. Please login again.");
        navigation.reset({
          index: 0,
          routes: [{ name: 'LoginScreen' }],
        });
        return;
      }

      console.log("🗑️ Deleting account for user:", user.userId || user._id);

      // Call backend API to delete account with password
      const response = await fetch(`${API_URL}/delete-account`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          password: password
        })
      });

      // Some server / proxy errors can return HTML instead of JSON (starts with "<")
      // To avoid crashing with JSON parse error, safely parse the response
      const rawText = await response.text();
      let result: any = null;

      try {
        result = rawText ? JSON.parse(rawText) : null;
      } catch (parseError) {
        console.error("❌ Delete account: Failed to parse JSON. Raw response:", rawText);
        // If the server didn't return valid JSON, treat it as an error with a generic message
        throw new Error(
          "Unexpected server response while deleting account. Please try again in a moment or contact support."
        );
      }

      console.log("🗑️ Delete account response:", result);

      // Handle authentication errors (invalid / expired token)
      if (
        response.status === 401 ||
        result?.message?.toLowerCase().includes("invalid token") ||
        result?.error?.toLowerCase().includes("invalid token") ||
        result?.message?.toLowerCase().includes("expired") ||
        result?.error?.toLowerCase().includes("expired")
      ) {
        console.error("❌ Delete account: Authentication failed, token invalid or expired");
        Alert.alert(
          "Session Expired",
          "Your login session has expired. Please login again to delete your account.",
          [
            {
              text: "OK",
              onPress: async () => {
                await AsyncStorage.multiRemove(["user", "token", "userToken"]);
                (navigation as any).reset({
                  index: 0,
                  routes: [{ name: "LoginScreen" }],
                });
              },
            },
          ]
        );
        return;
      }

      if (response.ok && result?.success) {
        // Clear all user data from AsyncStorage
        await AsyncStorage.multiRemove(["user", "token", "userToken"]);
        
        Alert.alert(
          "Account Deleted",
          "Your account has been permanently deleted. All your data has been removed from our system.",
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate to login screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'LoginScreen' }],
                });
              }
            }
          ]
        );
      } else {
        throw new Error(result.message || "Failed to delete account");
      }
    } catch (error: any) {
      console.error("❌ Error deleting account:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to delete account. Please check your internet connection and try again."
      );
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={true}
    >
      <Text style={styles.header}>Security Settings</Text>

      {/* Password Change Section */}
      <View style={styles.card}>
        {/* User Email */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>
          <TextInput 
            style={styles.input} 
            value={userData?.email || "Loading..."} 
            editable={false} 
          />
        </View>

        {/* Password (Hidden) */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput style={styles.input} value="●●●●●●●●●" editable={false} />
        </View>

        {!isEditing ? (
          <>
            <TouchableOpacity 
              style={styles.changeButton} 
              onPress={() => setIsEditing(true)}
            >
              <Text style={styles.changeText}>Change Password</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.forgotPasswordLink} 
              onPress={() => {
                navigation.navigate("ForgotPasswordScreen" as never);
              }}
            >
              <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {/* Current Password */}
            <Text style={styles.header1}>Change Password</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Current Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  secureTextEntry={!showCurrent}
                  placeholder="Enter Current Password"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                  <Feather name={showCurrent ? "eye" : "eye-off"} size={20} color="gray" />
                </TouchableOpacity>
              </View>
            </View>

            {/* New Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>New Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNew}
                  placeholder="Enter New Password"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                  <Feather name={showNew ? "eye" : "eye-off"} size={20} color="gray" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Confirm Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  placeholder="Confirm New Password"
                  placeholderTextColor="#999"
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Feather name={showConfirm ? "eye" : "eye-off"} size={20} color="gray" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={[styles.saveButton, isChangingPassword && styles.buttonDisabled]} 
                onPress={handleChangePassword}
                disabled={isChangingPassword}
              >
                {isChangingPassword ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.saveText}>Save</Text>
                )}
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => {
                  setIsEditing(false);
                  setCurrentPassword("");
                  setNewPassword("");
                  setConfirmPassword("");
                }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {/* Delete Account Section - Professional Implementation */}
      <View style={styles.deleteSection}>
        <View style={styles.deleteCard}>
          <View style={styles.deleteHeader}>
            <Feather name="alert-triangle" size={24} color="#d32f2f" />
            <Text style={styles.deleteTitle}>Delete Account</Text>
          </View>
          
          <Text style={styles.deleteDescription}>
            Permanently delete your account and all associated data. This action cannot be undone.
          </Text>

          <Text style={styles.deleteWarning}>
            Once deleted, you will lose access to:
          </Text>
          <View style={styles.deleteList}>
            <Text style={styles.deleteListItem}>• Your profile and account information</Text>
            <Text style={styles.deleteListItem}>• All your posted ads</Text>
            <Text style={styles.deleteListItem}>• Your messages and conversations</Text>
            <Text style={styles.deleteListItem}>• Your favorites and saved items</Text>
            <Text style={styles.deleteListItem}>• All other associated data</Text>
          </View>

          <TouchableOpacity
            style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
            onPress={handleDeleteAccount}
            disabled={isDeleting}
            activeOpacity={0.8}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="trash-2" size={18} color="#fff" />
                <Text style={styles.deleteButtonText}>Delete My Account</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f8f8",
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#CD0100",
    marginBottom: 24,
    marginTop: 10,
  },
  header1: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    alignSelf: "center",
    marginBottom: 20,
  },
  card: {
    width: "100%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    color: "#333",
    marginBottom: 8,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    backgroundColor: "#f9f9f9",
    color: "#333",
  },
  passwordContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: "#f9f9f9",
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#333",
  },
  changeButton: {
    marginTop: 8,
    padding: 14,
    backgroundColor: "#CD0100",
    borderRadius: 8,
    alignItems: "center",
  },
  changeText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
  },
  saveButton: {
    backgroundColor: "#CD0100",
    padding: 14,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    marginRight: 10,
  },
  saveText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  cancelButton: {
    backgroundColor: "#666",
    padding: 14,
    borderRadius: 8,
    flex: 1,
    alignItems: "center",
    marginLeft: 10,
  },
  cancelText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  forgotPasswordLink: {
    marginTop: 16,
    alignItems: "center",
  },
  forgotPasswordText: {
    color: "#CD0100",
    fontSize: 14,
    textDecorationLine: "underline",
  },
  // Delete Account Styles - Professional
  deleteSection: {
    marginTop: 8,
    marginBottom: 20,
  },
  deleteCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: "#ffebee",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  deleteHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  deleteTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#d32f2f",
    marginLeft: 10,
  },
  deleteDescription: {
    fontSize: 15,
    color: "#666",
    lineHeight: 22,
    marginBottom: 16,
  },
  deleteWarning: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  deleteList: {
    marginBottom: 20,
    paddingLeft: 8,
  },
  deleteListItem: {
    fontSize: 14,
    color: "#666",
    lineHeight: 22,
    marginBottom: 6,
  },
  deleteButton: {
    backgroundColor: "#d32f2f",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  deleteButtonDisabled: {
    opacity: 0.6,
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default SecurityScreen;
