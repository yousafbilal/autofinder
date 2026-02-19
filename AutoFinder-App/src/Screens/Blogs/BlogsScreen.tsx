import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context"
import { Ionicons } from "@expo/vector-icons"
import { COLORS } from "../../constants/colors"
import { useNavigation } from "@react-navigation/native"
import { API_URL } from "../../../config"
import { NavigationProp } from "@react-navigation/native";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Image } from "react-native"
import { RootStackParamList } from "../../../navigationTypes";

type Blogs = {
  _id: string;
  title: string;
  thumbnail: string;
  duration: string;
  views: number;
  category: string;
  isDeleted: boolean;
  status: string
};
const BlogsScreen = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [activeCategory, setActiveCategory] = useState("All")
  const [videos, setVideos] = useState<Blogs[]>([]);
  const [loading, setLoading] = useState(true);
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };
  
  useEffect(() => {
      const fetchVideos = async () => {
        try {
          const res = await fetch(`${API_URL}/blogs`);
          const data = await res.json();
          const filteredData = data.filter(
            (video: Blogs) => video.isDeleted === false && video.status === "published"
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
    : videos.filter((video) => video.category === activeCategory);

  const categories = ["All", "Motorcycles", "Maintenance", "Reviews", "Industry News", "Buying Guide", "Technology"]

  const renderBlogItem = ({ item }) => (
<TouchableOpacity
  style={styles.blogCard}
  onPress={() => navigation.navigate("BlogDetailsPage", { blog: item })}
>
      <Image source={{ uri: `${API_URL}/uploads/${item.image1}` }} style={styles.blogImage} />
      <View style={styles.blogContent}>
        <Text style={styles.blogTitle}>{item.title}</Text>
        <Text style={styles.blogExcerpt} numberOfLines={2}>
          {item.excerpt}
        </Text>
        <View style={styles.blogMeta}>
          <Text style={styles.blogDate}>{formatDate(item.dateAdded)}</Text>
          <Text style={styles.blogAuthor}>By {item.author}</Text>
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
        <Text style={styles.headerTitle}>Blogs</Text>
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
        renderItem={renderBlogItem}
        keyExtractor={(item) => item._id.toString()}
        contentContainerStyle={styles.blogsList}
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
  blogsList: {
    padding: 16,
  },
  blogCard: {
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
  blogImage: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  blogContent: {
    padding: 16,
  },
  blogTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 8,
  },
  blogExcerpt: {
    fontSize: 14,
    color: COLORS.darkGray,
    lineHeight: 20,
    marginBottom: 12,
  },
  blogMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  blogDate: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  blogAuthor: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "500",
  },
})

export default BlogsScreen
