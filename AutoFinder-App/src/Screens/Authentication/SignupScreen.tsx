import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Pressable, Alert 
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { Ionicons, AntDesign } from "@expo/vector-icons"; 
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigationTypes";  
import FullScreenLoader from "../../Components/FullScreenLoader";
import {API_URL} from "../../../config"
type NavigationProp = NativeStackNavigationProp<RootStackParamList, "SignupScreen">;

const SignupScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [isButtonDisabled, setIsButtonDisabled] = useState(true);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Clear form fields when screen comes into focus (e.g., from login screen)
  useFocusEffect(
    React.useCallback(() => {
      // Clear all input fields
      setName("");
      setEmail("");
      setPhone("");
      setPassword("");
      setPasswordError("");
      setProfileImage(null);
      setIsButtonDisabled(true);
    }, [])
  );
  
  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setPasswordError(text.length < 8 ? "Password must be at least 8 characters" : "");
    validateForm(text, name, email, phone);
  };

  const validateForm = (pass: string, userName: string, userEmail: string, userPhone: string) => {
    if (userName.trim() !== "" && userEmail.trim() !== "" && userPhone.trim() !== "" && pass.length >= 8) {
      setIsButtonDisabled(false);
    } else {
      setIsButtonDisabled(true);
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permissionResult.granted) {
        Alert.alert('Permission required', 'You need to grant permission to access the gallery');
        return;
    }
    const pickerResult = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 4],
        quality: 1,
    });
    if (!pickerResult.canceled) {
        const imageUri = pickerResult.assets[0].uri;
        console.log('Picked Image URI:', imageUri); 
        setProfileImage(imageUri);
    }
};

const handleSignup = async () => {
  if (!name || !email || !phone || !password) {
    Alert.alert("Error", "Please fill in all fields.");
    return;
  }

  setIsLoading(true); // Show loader

  try {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("email", email);
    formData.append("phone", phone);
    formData.append("password", password);

    if (profileImage) {
      // Upload original profile image without compression
      const filename = (profileImage as string).split('/').pop() || "profile.jpg";
      const fileType = filename.split('.').pop() || "jpeg";

      formData.append("profileImage", {
        uri: profileImage as string,
        type: `image/${fileType}`,
        name: filename,
      } as any);
      console.log("📤 Uploading profile image (original quality)");
    }

    const response = await fetch(`${API_URL}/signup`, {
      method: "POST",
      body: formData,
      // Do NOT set Content-Type for FormData - fetch sets multipart/form-data with boundary automatically
    });

    const text = await response.text();
    setIsLoading(false); // Hide loader

    let data: { success?: boolean; message?: string } = {};
    try {
      if (text && text.trim().startsWith("{")) {
        data = JSON.parse(text);
      }
    } catch (_) {
      // Server returned HTML or non-JSON (e.g. 404/500 page)
      if (response.ok) {
        Alert.alert("Error", "Invalid response from server. Please try again.");
      } else {
        Alert.alert("Error", "Signup failed. Please check your connection and try again.");
      }
      return;
    }

    if (response.ok) {
      Alert.alert("Success", "Account created successfully!");
      navigation.navigate("LoginScreen");
    } else {
      Alert.alert("Error", data.message || "Signup failed.");
    }
  } catch (error) {
    console.error("Signup Error:", error);
    setIsLoading(false); // Hide loader
    Alert.alert("Error", "An error occurred during signup. Please try again.");
  }
};
  

  return (
    <View style={styles.container}>
      {/* Close Button */}
      <TouchableOpacity style={styles.closeButton} onPress={() => navigation.navigate("HomeTabs")}>
        <AntDesign name="close" size={24} color="black" />
      </TouchableOpacity>

      <Text style={styles.title}>Create Account</Text>

      {/* Profile Picture Selection */}
      <Pressable onPress={pickImage} style={styles.imageContainer}>
        {profileImage ? (
          <Image source={{ uri: profileImage }} style={styles.profileImage} />
        ) : (
          <Ionicons name="camera" size={40} color="#888" />
        )}
      </Pressable>
      <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#888" value={name} onChangeText={(text) => { setName(text); validateForm(password, text, email, phone); }} />
      <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#888" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={(text) => { setEmail(text); validateForm(password, name, text, phone); }} />
      <TextInput style={styles.input} placeholder="Phone Number" placeholderTextColor="#888" keyboardType="phone-pad" value={phone} onChangeText={(text) => { setPhone(text); validateForm(password, name, email, text); }} />

      <View style={styles.passwordContainer}>
        <TextInput style={styles.passwordInput} placeholder="Password" placeholderTextColor="#888" secureTextEntry={!passwordVisible} value={password} onChangeText={handlePasswordChange} />
        <Pressable onPress={() => setPasswordVisible(!passwordVisible)} style={styles.eyeIcon}>
          <Ionicons name={passwordVisible ? "eye-off" : "eye"} size={24} color="black" />
        </Pressable>
      </View>
      {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

      <TouchableOpacity 
        style={[styles.button, isButtonDisabled && styles.disabledButton]} 
        disabled={isButtonDisabled}
        onPress={handleSignup}
      >
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <Text style={styles.termsText}>
        By signing up, I agree to the  
        <Text style={styles.link} onPress={() => navigation.navigate("TermsAndConditions")}> Terms & Conditions </Text> 
        and 
        <Text style={styles.link} onPress={() => navigation.navigate("PrivacyPolicy")}> Privacy Policy</Text>.
      </Text>

      <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
      <FullScreenLoader visible={isLoading} />
    </View>
  ); 
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#ffffff", padding: 20 },
  closeButton: { position: "absolute", top: 40, right: 20 },
  imageContainer: { width: 100, height: 100, borderRadius: 50, backgroundColor: "#ddd", justifyContent: "center", alignItems: "center", overflow: "hidden", marginBottom: 20 },
  profileImage: { width: "100%", height: "100%", borderRadius: 50 },
  title: { fontSize: 26, fontWeight: "bold", color: "#CD0100", marginBottom: 20 },
  input: { width: "100%", height: 50, borderWidth: 1, borderColor: "#ccc", borderRadius: 5, paddingHorizontal: 15, marginBottom: 15, color:'black' },
  passwordContainer: { flexDirection: "row", alignItems: "center", width: "100%", borderWidth: 1, borderColor: "#ccc", borderRadius: 5, paddingHorizontal: 15, marginBottom: 5 },
  passwordInput: { flex: 1, height: 50 },
  eyeIcon: { padding: 10 },
  errorText: { color: "red", fontSize: 12, alignSelf: "flex-start", marginLeft: 5 },
  button: { backgroundColor: "#CD0100", paddingVertical: 12, paddingHorizontal: 30, borderRadius: 5, marginTop: 10, width: "100%", alignItems: "center" },
  disabledButton: { backgroundColor: "#ccc" },
  buttonText: { color: "#ffffff", fontSize: 18, fontWeight: "bold" },
  termsText: { fontSize: 14, color: "#555", textAlign: "center", marginTop: 15, paddingHorizontal: 10 },
  link: { color: "#CD0100", fontWeight: "bold" },
  linkText: { color: "#CD0100", marginTop: 15, fontSize: 16 }
});

export default SignupScreen;