import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Platform,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

const cities = ["All Cities", "Lahore", "Karachi", "Multan", "Islamabad", "Rawalpindi"];

const usedCarIcon = require('../../assets/usedcaricon/usedcaricon.png');
const usedBikeIcon = require('../../assets/usedbikes/usedbikes.png');
const carOnRentIcon = require('../../assets/Car on  rent/caronrent.png');
const autoStoreIcon = require('../../assets/Autostore/autostore.png');

const searchCategories = [
  { id: 'autofinder', label: 'Search Autofinder', icon: 'search-outline', image: null },
  { id: 'used-cars', label: 'Search Used Cars', icon: 'car-outline', image: usedCarIcon },
  { id: 'used-bikes', label: 'Search Used Bikes', icon: 'bicycle', image: usedBikeIcon },
  { id: 'car-rent', label: 'Search Car on Rent', icon: 'car-outline', image: carOnRentIcon },
  { id: 'autostore', label: 'Search AutoStore', icon: 'cart-outline', image: autoStoreIcon },
];

const Search = React.memo(() => {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedCity, setSelectedCity] = useState("All Cities");
  const [searchQuery, setSearchQuery] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [isFocused, setIsFocused] = useState(false);
  const [currentPlaceholderIndex, setCurrentPlaceholderIndex] = useState(0);
  const [lockedPlaceholderIndex, setLockedPlaceholderIndex] = useState<number | null>(null);

  const navigation = useNavigation<any>();
  const searchBarRef = useRef<View>(null);
  const textInputRef = useRef<TextInput>(null);
  const isTypingRef = useRef(false);

  // Current category (for placeholder + icon/image)
  const displayCategory = useMemo(() => {
    const index = lockedPlaceholderIndex !== null ? lockedPlaceholderIndex : currentPlaceholderIndex;
    return searchCategories[index] || searchCategories[0];
  }, [lockedPlaceholderIndex, currentPlaceholderIndex]);

  // Stable placeholder - doesn't change during typing
  const displayPlaceholder = useMemo(() => {
    return displayCategory?.label || 'Search Autofinder';
  }, [displayCategory]);

  // Stable icon - used when no image or while typing
  const displayIcon = useMemo(() => {
    if (isFocused || searchQuery.length > 0) {
      return 'search-outline';
    }
    return displayCategory?.icon || 'search-outline';
  }, [isFocused, searchQuery, displayCategory]);

  // Current image for rotating category
  const displayImage = useMemo(() => {
    if (isFocused || searchQuery.length > 0) {
      // Jab user type kar raha ho, sirf search icon dikhayen
      return null;
    }
    return displayCategory?.image || null;
  }, [displayCategory, isFocused, searchQuery]);

  // Stable onChangeText handler - prevents re-renders
  const handleChangeText = useCallback((text: string) => {
    isTypingRef.current = true;
    setSearchQuery(text);
    // Lock placeholder on first character
    if (lockedPlaceholderIndex === null && text.length > 0) {
      setLockedPlaceholderIndex(currentPlaceholderIndex);
    }
  }, [lockedPlaceholderIndex, currentPlaceholderIndex]);

  // Stable onFocus handler
  const handleFocus = useCallback(() => {
    isTypingRef.current = true;
    setIsFocused(true);
    // Lock placeholder when user focuses
    if (lockedPlaceholderIndex === null) {
      setLockedPlaceholderIndex(currentPlaceholderIndex);
    }
  }, [lockedPlaceholderIndex, currentPlaceholderIndex]);

  // Stable onBlur handler - delayed to prevent immediate unlock
  const handleBlur = useCallback(() => {
    isTypingRef.current = false;
    setIsFocused(false);
    // Unlock placeholder after delay if search query is empty
    if (searchQuery.length === 0) {
      setTimeout(() => {
        if (!isTypingRef.current) {
          setLockedPlaceholderIndex(null);
        }
      }, 1000);
    }
  }, [searchQuery]);

  // Stable search handler
  const handleSearch = useCallback(() => {
    if (searchQuery.trim()) {
      navigation.navigate("CarListScreen", {
        searchQuery: searchQuery.trim(),
        selectedCity,
      });
    }
  }, [searchQuery, selectedCity, navigation]);

  // Stable city select handler
  const handleCitySelect = useCallback((city: string) => {
    setSelectedCity(city);
    setShowDropdown(false);
  }, []);

  // Stable notification handler
  const handleNotificationPress = useCallback(() => {
    navigation.navigate("Notifications");
  }, [navigation]);

  // Clear search query when screen comes into focus (only if not typing)
  useFocusEffect(
    useCallback(() => {
      if (!isFocused && searchQuery.length === 0 && !isTypingRef.current) {
        setSearchQuery("");
        setLockedPlaceholderIndex(null);
      }
    }, [isFocused, searchQuery])
  );

  // Cycle through placeholder text - COMPLETELY STOP when user is interacting
  useEffect(() => {
    if (isFocused || searchQuery.length > 0 || lockedPlaceholderIndex !== null || isTypingRef.current) {
      return;
    }
    
    const interval = setInterval(() => {
      if (!isFocused && searchQuery.length === 0 && lockedPlaceholderIndex === null && !isTypingRef.current) {
        setCurrentPlaceholderIndex((prevIndex) => 
          (prevIndex + 1) % searchCategories.length
        );
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isFocused, searchQuery, lockedPlaceholderIndex]);

  const openDropdown = useCallback(() => {
    if (searchBarRef.current) {
      searchBarRef.current.measure((fx, fy, width, height, px, py) => {
        setDropdownPosition({ top: py + height - 25, left: px, width });
        setShowDropdown(true);
      });
    }
  }, []);

  // Stable border style
  const searchBarStyle = useMemo(() => [
    styles.searchBar,
    isFocused && { borderColor: "#CD0100", borderWidth: 1 },
  ], [isFocused]);

  return (
    <View style={styles.container} collapsable={false} pointerEvents="box-none">
      <View style={styles.searchRow} collapsable={false}>
        <View
          ref={searchBarRef}
          style={searchBarStyle}
          collapsable={false}
        >
          <View style={styles.iconContainer} collapsable={false}>
            {displayImage ? (
              <Image
                source={displayImage}
                style={styles.searchIconImage}
                resizeMode="contain"
              />
            ) : (
              <Ionicons
                name={displayIcon}
                size={16}
                color="#CD0100"
                style={{ opacity: 1 }}
              />
            )}
          </View>
          
          <TextInput
            ref={textInputRef}
            style={styles.input}
            placeholder={displayPlaceholder}
            placeholderTextColor={Platform.OS === 'ios' ? "#999" : "#666"}
            value={searchQuery}
            onChangeText={handleChangeText}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
            autoCapitalize="none"
            editable={true}
            multiline={false}
            numberOfLines={1}
            blurOnSubmit={false}
            keyboardType="default"
            textContentType="none"
            importantForAutofill="no"
            autoComplete="off"
          />
        </View>

        <TouchableOpacity 
          style={styles.notificationIconContainer}
          onPress={handleNotificationPress}
          activeOpacity={0.7}
        >
          <Ionicons
            name="notifications-outline" 
            size={24} 
            color="#CD0100"
            style={{ opacity: 1 }}
          />
        </TouchableOpacity>
      </View>

      {showDropdown && (
        <Modal transparent visible animationType="none">
          <Pressable style={styles.modalOverlay} onPress={() => setShowDropdown(false)}>
            <View
              style={[
                styles.dropdown,
                {
                  position: "absolute",
                  top: dropdownPosition.top,
                  left: dropdownPosition.left,
                  width: dropdownPosition.width,
                },
              ]}
            >
              <FlatList
                data={cities}
                keyExtractor={(item) => item}
                renderItem={({ item }) => (
                  <TouchableOpacity style={styles.dropdownItem} onPress={() => handleCitySelect(item)}>
                    <Text style={styles.dropdownText}>{item}</Text>
                  </TouchableOpacity>
                )}
                keyboardShouldPersistTaps="handled"
              />
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
});

Search.displayName = 'Search';

export default Search;

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingTop: 12,
    paddingBottom: Platform.OS === "android" ? 16 : 8,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingLeft: Platform.OS === 'ios' ? 8 : 6,
    paddingRight: Platform.OS === 'ios' ? 8 : 6,
    paddingVertical: Platform.OS === 'ios' ? 8 : 5,
    borderRadius: 10,
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: Platform.OS === 'ios' ? 38 : 40,
    minWidth: 0,
    justifyContent: 'center',
  },
  iconContainer: {
    marginRight: Platform.OS === 'ios' ? 10 : 8,
    padding: 0,
    justifyContent: 'center',
    alignItems: 'center',
    width: Platform.OS === 'ios' ? 34 : 32,
    height: Platform.OS === 'ios' ? 34 : 32,
    flexShrink: 0,
  },
  searchIconImage: {
    width: Platform.OS === 'ios' ? 30 : 28,
    height: Platform.OS === 'ios' ? 30 : 28,
    borderRadius: 8,
  },
  input: {
    flex: 1,
    height: Platform.OS === 'ios' ? 38 : 30,
    paddingLeft: 0,
    paddingRight: 0,
    paddingTop: 0,
    paddingBottom: 0,
    margin: 0,
    color: "black",
    fontSize: Platform.OS === 'ios' ? 13 : 12,
    textAlignVertical: Platform.OS === 'android' ? 'center' : 'center',
    includeFontPadding: false,
    minWidth: 0,
    lineHeight: Platform.OS === 'ios' ? 18 : undefined,
  },
  notificationIconContainer: {
    padding: 3,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 30,
    minHeight: 36,
    marginLeft: 0,
    marginRight: 1,
  },
  dropdown: {
    backgroundColor: "white",
    elevation: 5,
    borderRadius: 8,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    maxHeight: 250,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.2)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 162,
    paddingRight: 22,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  dropdownText: {
    fontSize: 14,
    color: "#333",
  },
});
