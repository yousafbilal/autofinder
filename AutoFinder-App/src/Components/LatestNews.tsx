import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import { StackNavigationProp } from "@react-navigation/stack";
import { RootStackParamList } from "../../navigationTypes"; // Update if needed
import { API_URL } from "../../config"; // Assuming API_URL is exported here
import BlogSkeleton from "./Commons/BlogSkeleton";
import { Ionicons } from "@expo/vector-icons";
import { COLORS } from "../constants/colors";
import { fastFetch, CACHE_KEYS, getFromCache } from "../services/cacheService";

type NavigationProps = StackNavigationProp<RootStackParamList, "BlogScreen">;

const LatestNews = () => {
  const navigation = useNavigation<NavigationProps>();
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(false); // Start with false

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        // Check cache first - if exists, show immediately without loading
        const cachedData = await getFromCache<any[]>(CACHE_KEYS.LATEST_NEWS);
        if (cachedData && Array.isArray(cachedData)) {
          const publishedBlogs = cachedData
            .filter((item: any) => item.status === "published")
            .slice(0, 3);
          setBlogs(publishedBlogs);
          setLoading(false);
        } else {
          // No cache - show loading only if no cache exists
          setLoading(true);
        }
        
        // Use fast fetch with cache - instant display from cache, then refresh
        const data = await fastFetch<any[]>(
          `${API_URL}/blogs`,
          CACHE_KEYS.LATEST_NEWS
        );
        
        if (!Array.isArray(data)) {
          setBlogs([]);
          return;
        }
        
        const publishedBlogs = data
          .filter((item: any) => item.status === "published")
          .slice(0, 3); // show only top 3 on home
        setBlogs(publishedBlogs);
      } catch (error: any) {
        // Suppress network errors - they're expected when offline
        if (!error?.message?.includes('Network request failed') && !error?.message?.includes('Failed to fetch')) {
        console.error("Error fetching blogs:", error?.message || error);
        }
        setBlogs([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogs();
  }, []);

  // Only show loading if no data and no cache (first time load)
  if (loading && blogs.length === 0) {
    return <BlogSkeleton />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.heading}>Latest Blogs</Text>
        <TouchableOpacity onPress={() => navigation.navigate("BlogScreen")}
          accessibilityRole="button"
          accessibilityLabel="View all blogs"
        >
          <Text style={styles.viewAllLink}>View All</Text>
        </TouchableOpacity>
      </View>

      {blogs.map((news: any, index: number) => (
        <TouchableOpacity
          key={index}
          style={styles.listItem}
          onPress={() => navigation.navigate("BlogDetailsPage", { blog: news })}
          activeOpacity={0.85}
        >
          <Image
            source={{ uri: `${API_URL}/uploads/${news.image1}` }}
            style={styles.thumb}
          />
          <View style={styles.itemRight}>
            <Text style={styles.title} numberOfLines={2}>{news.title}</Text>
            <Text style={styles.date}>{new Date(news.dateAdded).toLocaleString()}</Text>
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default LatestNews;

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginVertical: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "baseline",
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  heading: {
    fontWeight: "700",
    color: '#1f2937',
    fontSize: 20,
  },
  viewAllLink: {
    color: '#CD0100',
    fontSize: 14,
    fontWeight: '600',
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  thumb: {
    width: 96,
    height: 72,
    borderRadius: 8,
    marginRight: 14,
  },
  itemRight: {
    flex: 1,
  },
  title: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '700',
  },
  date: {
    color: '#6b7280',
    fontSize: 13,
    marginTop: 6,
  },
});
