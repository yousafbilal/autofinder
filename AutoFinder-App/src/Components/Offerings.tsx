import { View, FlatList, StyleSheet, TouchableOpacity } from "react-native";
import React, { useRef, useState } from "react";
import OfferCard from "./OfferCard";
import { useNavigation } from "@react-navigation/native";
import { NavigationProp } from "@react-navigation/native";
import { RootStackParamList } from "../../navigationTypes"; // Ensure this file contains your navigation types
import { Ionicons } from "@expo/vector-icons";

const offers = [
  { image: require("../../assets/workshop.png"), title: "POST FREE AD", screen: "PostFreeAd" },
  { image: require("../../assets/featured.png"), title: "POST PREMIUM AD", screen: "PostFeaturedAd" },
  // LIST IT FOR YOU - use dedicated image from assets/list it for  you/listitforyou.jpg
  // Moderate zoom for better presence without heavy blur
  { image: require("../../assets/list it for  you/listitforyou.jpg"), title: "LIST IT FOR YOU", screen: "ListItForYouScreen", imageScale: 1.15 },
  // BUY CAR FOR ME - use dedicated image from assets/BuCarForMe/Buycarforme.jpg
  // Slightly larger circle so it visually matches other cards
  { image: require("../../assets/BuCarForMe/Buycarforme.jpg"), title: "BUY CAR FOR ME", screen: "BuyCarForMeScreen", containerScale: 1.08 },
  // CAR INSPECTION - increase zoom more to fully hide square background inside circle
  { image: require("../../assets/carinspection.jpeg"), title: "CAR INSPECTION", screen: "CarInspectionScreen", imageScale: 1.4 },
  // Use same Car on Rent image as category cards/search bar
  { image: require("../../assets/Car on  rent/caronrent.png"), title: "CAR ON RENT", screen: "CarRentalServiceScreen" },
];

const Offerings = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const flatListRef = useRef<FlatList>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const [layoutWidth, setLayoutWidth] = useState(0);

  const scrollToNext = () => {
    flatListRef.current?.scrollToOffset({
      offset: scrollPosition + 200,
      animated: true,
    });
  };

  const handleScroll = (event: any) => {
    const currentOffset = event.nativeEvent.contentOffset.x;
    setScrollPosition(currentOffset);
  };

  const handleContentSizeChange = (contentWidth: number) => {
    setContentWidth(contentWidth);
  };

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setLayoutWidth(width);
  };

  // Calculate if we can scroll right
  const canScrollRight = scrollPosition < contentWidth - layoutWidth - 10; // 10px buffer

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={offers}
        keyExtractor={(item) => item.title}
        renderItem={({ item }) => (
          <OfferCard
            image={item.image}
            title={item.title}
            imageScale={item.imageScale}
            containerScale={item.containerScale}
            onPress={() => navigation.navigate(item.screen as keyof RootStackParamList)}
          />
        )}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.slider}
        onScroll={handleScroll}
        onContentSizeChange={handleContentSizeChange}
        onLayout={handleLayout}
        scrollEventThrottle={16}
      />
      
      {/* Right Arrow Only */}
      <View style={styles.arrowContainer}>
        {/* Right Arrow - Only show when not at end */}
        {canScrollRight && (
          <TouchableOpacity style={styles.arrowButton} onPress={scrollToNext}>
            <Ionicons name="chevron-forward" size={24} color="#CD0100" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

export default Offerings;

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  slider: {
    paddingHorizontal: 12,
    gap: 12,
  },
  arrowContainer: {
    position: 'absolute',
    right: 10,
    top: '50%',
    transform: [{ translateY: -20 }],
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  arrowButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 20,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
});
