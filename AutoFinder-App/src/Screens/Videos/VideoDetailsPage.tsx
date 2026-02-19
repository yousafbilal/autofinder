import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, Linking, TouchableOpacity  } from 'react-native';
import { API_URL } from '../../../config';
import { redbutton } from '../../constants/images';

const VideoDetailsPage = ({ route }) => {
  const { blog } = route.params;
  const handlePlayPress = () => {
    if (blog.videoUrl) {
      Linking.openURL(blog.videoUrl);
    } else {
      alert("No video URL available.");
    }
  };
  

  return (
    <ScrollView style={styles.container}>
      {/* Blog Image */}
      <View style={styles.videoThumbnailContainer}>
       <Image
         src={`${API_URL}/uploads/${blog.image1}`}
         style={styles.blogImage}
       />
      <TouchableOpacity style={styles.playButtonContainer} onPress={handlePlayPress}>
        <Image source={redbutton.playicon} style={styles.playButtonImage} />
      </TouchableOpacity>
     
     </View>

      {/* Blog Title */}
      <Text style={styles.blogTitle}>{blog.title}</Text>

      {/* Meta Info */}
      <Text style={styles.metaInfo}>
        Posted on: {blog?.dateAdded ? new Date(blog.dateAdded).toLocaleDateString("en-US", {
          year: "numeric", month: "long", day: "numeric"
        }) : 'No date available'}
      </Text>
      <Text style={styles.metaInfo}>Author: {blog.author || "Unknown"}</Text>
      <Text style={styles.metaInfo1}>{blog.category || "General"}</Text>

      {/* Excerpt */}
      <Text style={styles.sectionTitle}> </Text>
      <Text style={styles.paragraph}>{blog.description}</Text>

      {/* Content */}
      <Text style={styles.sectionTitle}></Text>
      

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <View style={styles.gap}>
          <Text style={styles.sectionTitle}>Tags</Text>
          <View style={styles.tagContainer}>
            {blog.tags.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    padding: 16,
    marginTop: 40,
  },
  blogImage: {
    width: "100%",
    height: 250,
    borderRadius: 10,
    marginBottom: 20,
  },
  blogTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#CD0100",
    marginBottom: 8,
  },
  metaInfo: {
    fontSize: 14,
    color: "#666",
    marginBottom: 4,
  },
  metaInfo1: {
    fontSize: 14,
    color: "#fff",
    backgroundColor: "#CD0100",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
    textAlign: "center",
    marginBottom: 4,
    alignSelf: "flex-start", // Let the tag size to its content
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 16,
    color: "#444",
    lineHeight: 24,
    fontStyle: "italic",
  },
  htmlContent: {
    fontSize: 16,
    lineHeight: 24,
    color: "#333",
  },
  tagContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 10,
  },
  tag: {
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    color: "#CD0100",
  },
  gap:{
    marginBottom:40
  },
  playButtonContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -35 }, { translateY: -35 }],
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  playButtonImage: {
    width: 70,
    height: 70,
    opacity: 0.8,
  },
  videoThumbnailContainer: {
    position: "relative",
    width: "100%",
    height: 200,
    marginBottom: 10,
    borderRadius: 10,
    overflow: "hidden",
  },
});

export default VideoDetailsPage;
