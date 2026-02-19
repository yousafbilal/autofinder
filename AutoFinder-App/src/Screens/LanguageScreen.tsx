import React,{ useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../constants/colors"
import { useNavigation } from "@react-navigation/native"

const LanguageScreen = () => {
  const navigation = useNavigation()
  const [selectedLanguage, setSelectedLanguage] = useState("English")

  const languages = [
    { id: "1", name: "English", code: "en" },
    { id: "2", name: "Spanish", code: "es" },
    { id: "3", name: "French", code: "fr" },
    { id: "4", name: "German", code: "de" },
    { id: "5", name: "Italian", code: "it" },
    { id: "6", name: "Portuguese", code: "pt" },
    { id: "7", name: "Russian", code: "ru" },
    { id: "8", name: "Japanese", code: "ja" },
    { id: "9", name: "Chinese (Simplified)", code: "zh" },
    { id: "10", name: "Arabic", code: "ar" },
  ]

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language)
  }

  const handleSave = () => {
    // Here you would typically update the language preference in your app
    navigation.goBack()
  }

  const renderLanguageItem = ({ item }) => (
    <TouchableOpacity
      style={[styles.languageItem, selectedLanguage === item.name && styles.selectedLanguageItem]}
      onPress={() => handleLanguageSelect(item.name)}
    >
      <Text style={[styles.languageName, selectedLanguage === item.name && styles.selectedLanguageName]}>
        {item.name}
      </Text>
      {selectedLanguage === item.name && <Ionicons name="checkmark" size={20} color={COLORS.primary} />}
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Language Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.description}>
          Select your preferred language. This will change the language throughout the app.
        </Text>

        <FlatList
          data={languages}
          renderItem={renderLanguageItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.languageList}
          showsVerticalScrollIndicator={false}
        />

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save</Text>
        </TouchableOpacity>
      </View>
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
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.white,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  description: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 24,
    lineHeight: 20,
  },
  languageList: {
    paddingBottom: 24,
  },
  languageItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectedLanguageItem: {
    backgroundColor: COLORS.lightGray,
  },
  languageName: {
    fontSize: 16,
    color: COLORS.black,
  },
  selectedLanguageName: {
    fontWeight: "600",
    color: COLORS.primary,
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 16,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
})

export default LanguageScreen;
