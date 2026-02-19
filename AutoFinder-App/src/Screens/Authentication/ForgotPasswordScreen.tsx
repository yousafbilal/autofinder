import React, { useState } from "react";
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, 
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigationTypes";
import { API_URL } from "../../../config";
import { COLORS } from "../../constants/colors";

type NavigationProp = NativeStackNavigationProp<RootStackParamList, "ForgotPasswordScreen">;

const ForgotPasswordScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const [step, setStep] = useState<"email" | "otp" | "newPassword">("email");
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleSendOTP = async () => {
    const value = emailOrPhone.trim();

    if (!value) {
      Alert.alert("Error", "Please enter your email");
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // Backend already decides email vs phone by presence of "@"
        body: JSON.stringify({ emailOrPhone: value }),
      });

      const data = await response.json();
      setIsLoading(false);

      // Check response status and data
      if (response.ok && data.success) {
        setOtpSent(true);
        setStep("otp");
        
        // If test OTP is provided (development mode), show it in alert
        if (data.testOtp || data.isDevelopment) {
          const testOtp = data.testOtp || 'N/A';
          Alert.alert(
            "🔧 Development Mode - Test OTP",
            `Email service is not configured.\n\n📱 YOUR TEST OTP: ${testOtp}\n\n✅ Use this OTP to test the forgot password feature.\n\nNote: This is for testing only. To enable real email sending, configure BREVO_API_KEY in node.env file.`,
            [{ text: "OK, Got It!" }]
          );
          console.log(`📱 Test OTP received: ${testOtp}`);
        } else {
          Alert.alert("OTP Sent Successfully", data.message || `OTP has been sent to your email. Please check your inbox or spam folder.`, [
            { text: "OK" },
          ]);
        }
      } else {
        // Show error with helpful message
        let errorMessage = data.message || "Failed to send OTP. Please try again or contact support.";
        
        // If email service not configured, show helpful message
        if (errorMessage.includes("Email service not configured") || errorMessage.includes("BREVO_API_KEY") || errorMessage.includes("SMTP")) {
          // Check if test OTP is provided (for development)
          if (data.testOtp) {
            Alert.alert(
              "Email Service Not Configured",
              `Email service not configured.\n\nPlease add BREVO_API_KEY or SMTP credentials in node.env file.\n\nTESTING OTP: ${data.testOtp}\n\n(Use this OTP to test the feature)`,
              [{ text: "OK" }]
            );
            // Still allow user to proceed with test OTP
            setOtpSent(true);
            setStep("otp");
            return;
          } else {
            errorMessage = "Email service not configured. Please contact administrator to set up email service.";
          }
        }
        
        Alert.alert(
          "Error", 
          errorMessage,
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Send OTP error:", error);
      Alert.alert("Error", "An error occurred. Please try again.");
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim() || otp.length !== 6) {
      Alert.alert("Error", "Please enter a valid 6-digit OTP");
      return;
    }

    setIsLoading(true);
    try {
      // Verify OTP without resetting password
      const response = await fetch(`${API_URL}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          otp: otp.trim(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // OTP verified successfully, move to new password step
        setStep("newPassword");
        setIsLoading(false);
      } else {
        // OTP invalid or expired
        setIsLoading(false);
        Alert.alert("Error", data.message || "Invalid or expired OTP. Please request a new one.");
        if (data.message && data.message.includes("expired")) {
          setOtpSent(false);
          setOtp("");
        }
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Verify OTP error:", error);
      Alert.alert("Error", "An error occurred. Please try again.");
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || !confirmPassword.trim()) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert("Error", "Passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          emailOrPhone: emailOrPhone.trim(),
          otp: otp.trim(),
          newPassword: newPassword.trim(),
        }),
      });

      const data = await response.json();
      setIsLoading(false);

      if (data.success) {
        Alert.alert("Success", data.message || "Password reset successfully!", [
          {
            text: "OK",
            onPress: () => navigation.navigate("LoginScreen"),
          },
        ]);
      } else {
        Alert.alert("Error", data.message || "Failed to reset password");
      }
    } catch (error) {
      setIsLoading(false);
      console.error("Reset password error:", error);
      Alert.alert("Error", "An error occurred. Please try again.");
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.title}>Forgot Password</Text>
        </View>

        {/* Step 1: Enter Email */}
        {step === "email" && (
          <View style={styles.formContainer}>
            <Text style={styles.subtitle}>
              Enter your email to receive a password reset OTP
            </Text>
            
            <View style={styles.inputContainer}>
              <Ionicons
                name="mail-outline"
                size={20}
                color={COLORS.darkGray}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Email (e.g., user@example.com)"
                placeholderTextColor="#888"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleSendOTP}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 2: Enter OTP */}
        {step === "otp" && (
          <View style={styles.formContainer}>
            <Text style={styles.subtitle}>
              Enter the 6-digit OTP sent to {emailOrPhone}
            </Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.darkGray} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter 6-digit OTP"
                placeholderTextColor="#888"
                value={otp}
                onChangeText={(text) => setOtp(text.replace(/[^0-9]/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity 
              style={styles.resendButton}
              onPress={handleSendOTP}
              disabled={isLoading}
            >
              <Text style={styles.resendText}>Resend OTP</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleVerifyOTP}
              disabled={isLoading || otp.length !== 6}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Verify OTP</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Step 3: Enter New Password */}
        {step === "newPassword" && (
          <View style={styles.formContainer}>
            <Text style={styles.subtitle}>Enter your new password</Text>
            
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.darkGray} style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder="New Password"
                placeholderTextColor="#888"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                editable={!isLoading}
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={COLORS.darkGray} 
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color={COLORS.darkGray} style={styles.inputIcon} />
              <TextInput
                style={styles.passwordInput}
                placeholder="Confirm New Password"
                placeholderTextColor="#888"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                editable={!isLoading}
              />
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                style={styles.eyeIcon}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off-outline" : "eye-outline"} 
                  size={20} 
                  color={COLORS.darkGray} 
                />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={[styles.button, isLoading && styles.buttonDisabled]} 
              onPress={handleResetPassword}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <Text style={styles.buttonText}>Reset Password</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  formContainer: {
    flex: 1,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.darkGray,
    marginBottom: 30,
    textAlign: "center",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: 8,
    marginBottom: 20,
    paddingHorizontal: 15,
    backgroundColor: COLORS.white,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: COLORS.black,
  },
  passwordInput: {
    flex: 1,
    paddingVertical: 15,
    fontSize: 16,
    color: COLORS.black,
  },
  eyeIcon: {
    padding: 5,
  },
  button: {
    backgroundColor: COLORS.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  resendButton: {
    alignItems: "center",
    marginBottom: 20,
  },
  resendText: {
    color: COLORS.primary,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  methodRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  methodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 8,
    marginHorizontal: 4,
    opacity: 0.6,
  },
  methodButtonActive: {
    opacity: 1,
  },
  methodButtonText: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: "600",
  },
  methodIcon: {
    marginRight: 6,
  },
});

export default ForgotPasswordScreen;

