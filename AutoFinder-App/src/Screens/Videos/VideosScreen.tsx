"use client"

import React ,{ useEffect, useState } from "react"
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image, ActivityIndicator } from "react-native"
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { useNavigation } from "@react-navigation/native"
import { API_URL } from "../../../config"
import { RootStackParamList } from "../../../navigationTypes";
import { NavigationProp } from "@react-navigation/native";

type Video = {
  _id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: number;
  category: string;
  isDeleted: boolean;
  status: string
};
const VideosScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [activeCategory, setActiveCategory] = useState("All");
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const categories = ["All", "Motorcycles", "Car Reviews", "DIY & Maintenance", "Buying Guide", "Gear Reviews", "Tutorials"];

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await fetch(`${API_URL}/videos`);
        const data = await res.json();

        // Only include videos that are not deleted and are published
        const filteredData = data.filter(
          (video: Video) => video.isDeleted === false && video.status === "published"
        );

        setVideos(filteredData);
      } catch (error) {
        console.error("Error fetching videos:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);

  const filteredVideos = activeCategory === "All"
    ? videos
    : videos.filter((video) => (video.category || '') === activeCategory);

  const renderVideoItem = ({ item }) => (
    <TouchableOpacity style={styles.videoCard} onPress={() => navigation.navigate("VideoDetailsPage", { blog: item })}>
      <View style={styles.thumbnailContainer}>
        <Image source={{ uri: `${API_URL}/uploads/${item.image1}` }} style={styles.thumbnail} />
        <View style={styles.playButton}>
          <Ionicons name="play-circle" size={24} color={COLORS.white} />
        </View>
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{item.duration}</Text>
        </View>
      </View>
      <View style={styles.videoContent}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <View style={styles.videoMeta}>
          <Text style={styles.viewsText}>{item.views || 0} views</Text>
        </View>
      </View>
    </TouchableOpacity>
  )

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Videos</Text>
        <TouchableOpacity style={styles.searchButton}>
          <Ionicons name="search" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          data={categories}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.categoryButton, activeCategory === item && styles.activeCategoryButton]}
              onPress={() => setActiveCategory(item)}
            >
              <Text style={[styles.categoryButtonText, activeCategory === item && styles.activeCategoryButtonText]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      <FlatList
        data={filteredVideos}
        renderItem={renderVideoItem}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.videosList}
        showsVerticalScrollIndicator={false}
      />
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
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesContainer: {
    backgroundColor: COLORS.white,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.lightGray,
    marginRight: 8,
  },
  activeCategoryButton: {
    backgroundColor: COLORS.primary,
  },
  categoryButtonText: {
    fontSize: 14,
    color: COLORS.darkGray,
  },
  activeCategoryButtonText: {
    color: COLORS.white,
    fontWeight: "500",
  },
  videosList: {
    padding: 16,
  },
  videoCard: {
    backgroundColor: COLORS.white,
    borderRadius: 8,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: COLORS.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  thumbnailContainer: {
    position: "relative",
    height: 180,
  },
  thumbnail: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    transform: [{ translateX: -25 }, { translateY: -25 }],
  },
  durationBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  durationText: {
    color: COLORS.white,
    fontSize: 12,
    fontWeight: "500",
  },
  videoContent: {
    padding: 16,
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 8,
  },
  videoMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewsText: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
})

export default VideosScreen
