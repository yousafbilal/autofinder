import { FlatList, Image, StyleSheet, Text, View,TouchableOpacity } from "react-native";
import React, { useEffect, useState } from "react";
import { AntDesign } from "@expo/vector-icons";
import { API_URL } from "../../config";
import { RootStackParamList } from "../../navigationTypes";
import { NavigationProp, useNavigation } from "@react-navigation/native";
import VideoSkeleton from "./Commons/VideoSkeleton";
import { fastFetch, CACHE_KEYS, getFromCache } from "../services/cacheService";

interface VideoDTO {
  _id: string;
  title: string;
  videoUrl: string;
  image1: string;
  category: string;
  dateAdded: string;
}

const LatestVideos = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [videos, setVideos] = useState<VideoDTO[]>([]);
  const [loading, setLoading] = useState(false); // Start with false
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        // Check cache first - if exists, show immediately without loading
        const cachedData = await getFromCache<VideoDTO[]>(CACHE_KEYS.LATEST_VIDEOS);
        if (cachedData && Array.isArray(cachedData)) {
          const publishedVideos = cachedData.filter((video) => video.status === "published");
          setVideos(publishedVideos);
          setLoading(false);
        } else {
          // No cache - show loading only if no cache exists
          setLoading(true);
        }
        
        // Use fast fetch with cache - instant display from cache, then refresh
        const data = await fastFetch<VideoDTO[]>(
          `${API_URL}/videos`,
          CACHE_KEYS.LATEST_VIDEOS
        );
        
        if (!Array.isArray(data)) {
          setVideos([]);
          return;
        }
        
        const publishedVideos = data.filter((video) => video.status === "published");
        setVideos(publishedVideos);
      } catch (error: any) {
        console.error("Error fetching videos:", error?.message || error);
        setVideos([]);
      } finally {
        setLoading(false);
      }
    };

    fetchVideos();
  }, []);
  
  const listItem = ({ item }: { item: VideoDTO }) => {
    return (
      <TouchableOpacity
        style={styles.listItem}
        onPress={() => navigation.navigate("VideoDetailsPage", { blog: item })}
      >
        {/* Image Section */}
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: `${API_URL}/uploads/${item.image1}` }}
            style={{ width: "100%", height: 80, borderRadius: 4 }}
          />
          <AntDesign name="right" size={32} color="red" style={styles.play} />
        </View>
  
        {/* Text Section */}
        <View style={{ width: "55%" }}>
          <Text style={styles.titleText1} numberOfLines={2}>
            {item.title}
          </Text>
          <Text style={styles.dateText}>
            {new Date(item.dateAdded).toLocaleDateString()}
          </Text>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{item.category || 'N/A'}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };
  

  // Only show loading if no data and no cache (first time load)
  return (loading && videos.length === 0) ? (
    <VideoSkeleton />
  ) : (
    <View style={{ marginHorizontal: 12 }}>
      {videos.length > 0 && (
        <>
          <TouchableOpacity
            style={styles.imageThumb}
            onPress={() => navigation.navigate("VideoDetailsPage", { blog: videos[0] })}
          >
            <Image
              source={{ uri: `${API_URL}/uploads/${videos[0].image1}` }}
              style={styles.thumbnail}
            />
            <AntDesign name="right" size={44} color="red" style={styles.play} />
            <View style={styles.overlay}>
              <Text style={styles.overlayTitle} numberOfLines={1}>
                {videos[0].title}
              </Text>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{videos[0].category || 'N/A'}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </>
      )}
      <FlatList
        keyExtractor={(_, index) => index.toString()}
        data={videos.slice(1)}
        renderItem={listItem}
        showsVerticalScrollIndicator={false}
        style={{ marginVertical: 12 }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
      />
    </View>
  );
  
};

export default LatestVideos;

const styles = StyleSheet.create({
  imageThumb: {
    position: "relative",
    justifyContent: "center",
    marginBottom: 12,
    alignItems: "center",
  },
  thumbnail: {
    width: "100%",
    height: 200,
    objectFit: "cover",
    borderRadius: 12,
  },
  play: {
    position: "absolute",
  },
  listItem: { display: "flex", flexDirection: "row", gap: 6 },
  sep: {
    paddingVertical: 6,
  },
  titleText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginTop: 4,
  },
  imageContainer: {
    width: "40%",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  titleText1: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  dateText: {
    color: "#a1a1a1",
    marginTop: 4,
    fontSize: 12,
  },
  categoryBadge: {
    backgroundColor: "#CD0100",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginTop: 6,
    alignSelf: "flex-start",
  },
  categoryText: {
    color: "white",
    fontSize: 12,
  },
  overlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    height:"25%",
    width: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderBottomLeftRadius: 12,
    borderTopRightRadius: 8,
  },
  overlayTitle: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  overlayCategory: {
    color: "#ccc",
    fontSize: 12,
  },
  
  
  
});
