import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { useNavigation, useRoute } from '@react-navigation/native';
import { API_URL } from '../../config';

const { width, height } = Dimensions.get('window');
const isTablet = width >= 768;
const isSmallScreen = width < 375;

const UserProfileDetails = () => {
  const navigation = useNavigation();
  const route = useRoute() as any;
  const { userProfile, userId, userName, userImage } = route.params || {};
  
  const [userDetails, setUserDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userProfile) {
      setUserDetails(userProfile);
      setLoading(false);
    } else if (userId) {
      fetchUserDetails();
    }
  }, [userId, userProfile]);

  const fetchUserDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/user/${userId}`);
      const data = await response.json();
      
      if (data.success) {
        setUserDetails(data.user);
      } else {
        Alert.alert('Error', 'Failed to fetch user details');
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
      Alert.alert('Error', 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading user details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!userDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>User Profile</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={isTablet ? 80 : 60} color="#ccc" />
          <Text style={styles.errorText}>User details not available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={isTablet ? 28 : 24} color={COLORS.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>User Profile</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Card with Gradient Background */}
        <View style={styles.profileCardWrapper}>
          <View style={styles.profileCard}>
            <View style={styles.profileImageContainer}>
              {userDetails.profileImage || userDetails.avatar ? (
                <Image
                  source={{
                    uri: userDetails.profileImage?.startsWith('http') 
                      ? userDetails.profileImage 
                      : userDetails.avatar?.startsWith('http')
                      ? userDetails.avatar
                      : `${API_URL}/uploads/profile_pics/${userDetails.profileImage || userDetails.avatar}`
                  }}
                  style={styles.profileImage}
                  onError={() => console.log('Failed to load profile image')}
                />
              ) : (
                <View style={styles.profileImagePlaceholder}>
                  <Ionicons name="person" size={isTablet ? 60 : 50} color={COLORS.white} />
                </View>
              )}
              <View style={styles.onlineIndicator}>
                <View style={styles.onlineDot} />
              </View>
            </View>
            
            <Text style={styles.userName}>{userDetails.name || 'Unknown User'}</Text>
            
            {userDetails.phone || userDetails.contactNumber ? (
              <View style={styles.phoneContainer}>
                <Ionicons name="call" size={16} color={COLORS.primary} />
                <Text style={styles.userPhone}>
                  {userDetails.phone || userDetails.contactNumber}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* User Details */}
        <View style={styles.detailsCard}>
          <View style={styles.detailsTitleContainer}>
            <Ionicons name="information-circle" size={isTablet ? 22 : 20} color={COLORS.primary} />
            <Text style={styles.detailsTitle}>User Information</Text>
          </View>
          
          <View style={styles.detailsDivider} />
          
          <View style={styles.detailRow}>
            <View style={styles.iconContainer}>
              <Ionicons name="person" size={isTablet ? 22 : 20} color={COLORS.primary} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Name</Text>
              <Text style={styles.detailValue}>{userDetails.name || 'Not provided'}</Text>
            </View>
          </View>
          
          {(userDetails.phone || userDetails.contactNumber) && (
            <>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="call" size={isTablet ? 22 : 20} color={COLORS.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{userDetails.phone || userDetails.contactNumber}</Text>
                </View>
              </View>
            </>
          )}
          
          {userDetails.location && (
            <>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="location" size={isTablet ? 22 : 20} color={COLORS.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Location</Text>
                  <Text style={styles.detailValue}>{userDetails.location}</Text>
                </View>
              </View>
            </>
          )}
          
          {userDetails.city && (
            <>
              <View style={styles.detailDivider} />
              <View style={styles.detailRow}>
                <View style={styles.iconContainer}>
                  <Ionicons name="business" size={isTablet ? 22 : 20} color={COLORS.primary} />
                </View>
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>City</Text>
                  <Text style={styles.detailValue}>{userDetails.city}</Text>
                </View>
              </View>
            </>
          )}
        </View>

        {/* Additional Info */}
        {userDetails.bio && (
          <View style={styles.bioCard}>
            <Text style={styles.bioTitle}>About</Text>
            <Text style={styles.bioText}>{userDetails.bio}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.primary,
    paddingHorizontal: isTablet ? 20 : 16,
    paddingVertical: isTablet ? 16 : 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButton: {
    width: isTablet ? 44 : 40,
    height: isTablet ? 44 : 40,
    borderRadius: isTablet ? 22 : 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  placeholder: {
    width: isTablet ? 44 : 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: isTablet ? 16 : 14,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: isTablet ? 16 : 14,
    color: '#666',
    marginTop: isTablet ? 16 : 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: isTablet ? 20 : 16,
  },
  profileCardWrapper: {
    marginTop: isTablet ? 20 : 16,
    marginBottom: isTablet ? 8 : 4,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 32 : 28,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: isTablet ? 20 : 16,
  },
  profileImage: {
    width: isTablet ? 130 : 110,
    height: isTablet ? 130 : 110,
    borderRadius: isTablet ? 65 : 55,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImagePlaceholder: {
    width: isTablet ? 130 : 110,
    height: isTablet ? 130 : 110,
    borderRadius: isTablet ? 65 : 55,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: isTablet ? 6 : 4,
    right: isTablet ? 6 : 4,
    width: isTablet ? 28 : 24,
    height: isTablet ? 28 : 24,
    borderRadius: isTablet ? 14 : 12,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#f8f9fa',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  onlineDot: {
    width: isTablet ? 14 : 12,
    height: isTablet ? 14 : 12,
    borderRadius: isTablet ? 7 : 6,
    backgroundColor: '#4CAF50',
  },
  userName: {
    fontSize: isTablet ? 26 : 22,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: isTablet ? 12 : 10,
    letterSpacing: 0.3,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f7ff',
    paddingHorizontal: isTablet ? 16 : 14,
    paddingVertical: isTablet ? 10 : 8,
    borderRadius: isTablet ? 25 : 20,
    marginTop: isTablet ? 4 : 2,
  },
  userEmail: {
    fontSize: isTablet ? 16 : 14,
    color: '#666',
    marginBottom: isTablet ? 8 : 6,
  },
  userPhone: {
    fontSize: isTablet ? 16 : 14,
    color: COLORS.primary,
    fontWeight: '600',
    marginLeft: isTablet ? 8 : 6,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: isTablet ? 20 : 16,
    marginBottom: isTablet ? 20 : 16,
  },
  actionButton: {
    backgroundColor: "#E8F0FE",
    paddingVertical: isTablet ? 16 : 12,
    paddingHorizontal: isTablet ? 24 : 20,
    borderRadius: isTablet ? 15 : 12,
    alignItems: 'center',
    minWidth: isTablet ? 100 : 80,
    marginHorizontal: isTablet ? 16 : 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  actionButtonText: {
    color: "#333",
    fontSize: isTablet ? 14 : 12,
    fontWeight: '600',
    marginTop: isTablet ? 4 : 2,
  },
  detailsCard: {
    backgroundColor: COLORS.white,
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 24 : 20,
    marginTop: isTablet ? 24 : 20,
    marginBottom: isTablet ? 20 : 16,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  detailsTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: isTablet ? 16 : 12,
  },
  detailsTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: isTablet ? 10 : 8,
    letterSpacing: 0.3,
  },
  detailsDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: isTablet ? 12 : 10,
    marginLeft: isTablet ? 44 : 40,
  },
  iconContainer: {
    width: isTablet ? 44 : 40,
    height: isTablet ? 44 : 40,
    borderRadius: isTablet ? 22 : 20,
    backgroundColor: '#f0f7ff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: isTablet ? 8 : 6,
  },
  detailContent: {
    marginLeft: isTablet ? 16 : 14,
    flex: 1,
  },
  detailLabel: {
    fontSize: isTablet ? 13 : 11,
    color: '#888',
    marginBottom: isTablet ? 6 : 4,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: isTablet ? 17 : 15,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  bioCard: {
    backgroundColor: COLORS.white,
    borderRadius: isTablet ? 20 : 16,
    padding: isTablet ? 24 : 20,
    marginBottom: isTablet ? 24 : 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  bioTitle: {
    fontSize: isTablet ? 20 : 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: isTablet ? 14 : 12,
    letterSpacing: 0.3,
  },
  bioText: {
    fontSize: isTablet ? 16 : 14,
    color: '#555',
    lineHeight: isTablet ? 26 : 22,
    fontWeight: '400',
  },
});

export default UserProfileDetails;

