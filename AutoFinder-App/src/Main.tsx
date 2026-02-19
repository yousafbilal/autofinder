import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createStackNavigator } from "@react-navigation/stack";
import { FontAwesome5, Ionicons, Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { NavigationContainer, NavigationProp, useNavigation } from "@react-navigation/native";
import { View, Text, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Home from "./Screens/Home";
import SellNow from "./Screens/SellNow";
import More from "./Screens/More";
import SplashScreen from "./Screens/SplashScreen";
import SignupScreen from "./Screens/Authentication/SignupScreen";
import TermsAndConditions from "./Screens/Ploicies/TermsAndConditions";
import PrivacyPolicy from "./Screens/Ploicies/PrivacyPolicy";
import LoginScreen from "./Screens/Authentication/LoginScreen";
import ForgotPasswordScreen from "./Screens/Authentication/ForgotPasswordScreen";
import CarDetailsScreen from "./Screens/DetailScreen.tsx/CarDetailsScreen";
import CarListScreen from "./Screens/DetailScreen.tsx/CarListScreen";
import Profile from "./Screens/Profile";
import SecurityScreen from "./Screens/SecurityScreen";
import CityScreen from "./Screens/CitiesScreen";
import LanguageScreen from "./Screens/LanguageScreen";
import BlogPage from "./Screens/Blogs/BlogsScreen";
import BlogDetailsPage from "./Screens/Blogs/BlogDetailsPage";
import AdvertisingScreen from "./Screens/Advertising/AdvertisingScreen";
import SupportPage from "./Screens/SupportPage";
import CallUsPage from "./Screens/CallUsPage";
import PostCarAd from "./Screens/PostingAds/PostCarAd";
import PostBikeAd from "./Screens/PostingAds/PostBikeAd";
import PostBikeAdFeatured from "./Screens/PostingAds/PostBikeAdFeatured";
import BikePackageSelection from "./Screens/PostingAds/BikePackageSelection";
import RentServiceAd from "./Screens/PostingAds/RentServiceAd";
import PostAutoPartsAd from "./Screens/PostingAds/PostAutoPartsAd";
import ListItforyou from "./Screens/PostingAds/ListItforyou";
import BuyCarForMeScreen from "./Screens/Services/BuyCarForMeScreen";
import CarInspectionScreen from "./Screens/Services/CarInspectionScreen";
import CarRentalServiceScreen from "./Screens/Services/CarRentalServiceScreen";
import BuyCarforMe from "./Screens/PostingAds/BuyCarforMe";
import BuyCarforMeYearScreen from "./Screens/PostingAds/BuyCarforMeYearScreen";
import BuyCarforMeBrandFlowScreen from "./Screens/PostingAds/BuyCarforMeBrandFlowScreen";
import BuyCarforMeCityScreen from "./Screens/PostingAds/BuyCarforMeCityScreen";
import BuyCarforMeLocationScreen from "./Screens/PostingAds/BuyCarforMeLocationScreen";
import CarInspection from "./Screens/PostingAds/CarInspection";
import LocationSelectionScreen from "./Screens/PostingAds/LocationSelectionScreen";
import RegistrationCitySelectionScreen from "./Screens/PostingAds/RegistrationCitySelectionScreen";
import PostCarAdFeatured from "./Screens/PostingAds/PostCarAdFeatured";
import FeaturesSelectorScreen from "./Screens/PostingAds/FeaturesSelectorScreen";
import AreaSelectorScreen from "./Screens/PostingAds/AreaSelectorScreen";
import MyAds from "./Screens/MyAds";
import VideoPage from "./Screens/Videos/VideosScreen";
import VideoDetailsPage from "./Screens/Videos/VideoDetailsPage";
import NewCarListScreen from "./Screens/DetailScreen.tsx/NewCarListScreen";
import FeaturedCarListScreen from "./Screens/DetailScreen.tsx/FeaturedCarListScreen";
import ForYouCarListScreen from "./Screens/DetailScreen.tsx/ForYouCarListScreen";
import ChatDetailScreen from "./Screens/Chat/ChatDetailScreen";
import UserProfileDetails from "./Screens/UserProfileDetails";
import MyFavoritesScreen from "./Screens/MyFavoritesScreen";
import PostFreeAdScreen from "./Screens/Services/PostFreeAdScreen";
import PostFeaturedAdScreen from "./Screens/Services/PostFeaturedAdScreen";
import ListItForYouScreen from "./Screens/Services/ListItForYouScreen";
import DetailsScreen from "./Screens/DetailScreen.tsx/DetailsScreen";
import { RootStackParamList } from "../navigationTypes";
import AutoPartsListScreen from "./Screens/DetailScreen.tsx/AutoPartsListScreen";
import BikeListScreen from "./Screens/DetailScreen.tsx/BikeListScreen";
import BikeDetailsScreen from "./Screens/DetailScreen.tsx/BikeDetailsScreen";
import NewCarDetailsScreen from "./Screens/DetailScreen.tsx/NewCarDetailsScreen";
import AllOffersScreen from "./Screens/Services/AllOffersScreen";
import SellBikeScreen from "./Screens/Services/SellBikeScreen";
import SellAutoScreen from "./Screens/Services/SellAutoScreen";
import FloatingTabIcon from "./Components/FloatingTabIcon";
import RentalCarListScreen from "./Screens/DetailScreen.tsx/RentalCarListScreen";
import RentalCarDetailsScreen from "./Screens/DetailScreen.tsx/RentalCarDetailsScreen";
import PackagesScreen from "./Screens/Packages/PackagesScreen";
import PackageDetailScreen from "./Screens/Packages/PackageDetailScreen";
import PackageUsageScreen from "./Screens/Packages/PackageUsageScreen";
import PaymentMethodScreen from "./Screens/Packages/PaymentMethodScreen";
import PaymentSuccessScreen from "./Screens/Packages/PaymentSuccessScreen";
import CarComparisonScreen from "./Screens/Comparison/CarComparisonScreen";
import ComparisonResultsScreen from "./Screens/Comparison/ComparisonResultsScreen";
import NewBikeListScreen from "./Screens/DetailScreen.tsx/NewBikeListScreen";
import NewBikeDetailsScreen from "./Screens/DetailScreen.tsx/NewBikeDetailsScreen";
import AutoPartsDetailsScreen from "./Screens/DetailScreen.tsx/AutoPartsDetailsScreen";
import Pakages from "./Screens/Packages/Pakages";
import ChatTabIcon from "./Components/ChatTabIcon";
import Chat from "./Screens/Chat";
import NotificationsScreen from "./Screens/NotificationsScreen";
import CarDetailScreen from "./Screens/DetailScreen.tsx/CarDetailScreen";
import EditAdScreen from "./Screens/EditAdScreen";
import PaymentScreen from "./Screens/Payment/PaymentScreen";
import PaymentReceiptScreen from "./Screens/Payment/PaymentReceiptScreen";
import PremiumPackagesScreen from "./Screens/PremiumPackagesScreen";
import ExpiredAdsScreen from "./Screens/ExpiredAdsScreen";
import InspectionReportViewScreen from "./Screens/Inspector/InspectionReportViewScreen";
import UpgradeFreeAdToPremium from "./Screens/UpgradeFreeAdToPremium";

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const CustomTabLabel = ({ title, focused }: { title: string; focused: boolean }) => (
  <Text
    style={{
      fontSize: Platform.OS === 'ios' ? 11 : 12,
      fontWeight: focused ? "bold" : "500",
      color: focused ? "#CD0100" : "#7A7A7A",
      marginTop: Platform.OS === 'ios' ? 4 : 2,
    }}
  >
    {title}
  </Text>
);

const HomeTabs = () => {
  const navigation = useNavigation<NavigationProp<RootStackParamList>>();
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const insets = useSafeAreaInsets();
  
  // Responsive bottom tab bar height and padding
  const tabBarHeight = Platform.OS === 'ios' 
    ? Math.max(65, (insets?.bottom || 0) + 50) 
    : Math.max(60, (insets?.bottom || 0) + 50);
  
  const tabBarPaddingBottom = Platform.OS === 'ios' 
    ? Math.max(insets?.bottom || 0, 20) 
    : Math.max(insets?.bottom || 0, 8);
  
  const tabBarPaddingTop = Platform.OS === 'ios' ? 8 : 6;
  
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        setIsLoggedIn(!!userData);
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  const handleMyAdsPress = () => {
    if (!isLoggedIn) {
      navigation.navigate("LoginScreen"); 
    } else {
      navigation.navigate("MyAds");
    }
  };
  const handleMyChatsPress = () => {
    if (!isLoggedIn) {
      navigation.navigate("LoginScreen");
    } else {
      navigation.navigate("PackagesScreen");
    }
  };
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#CD0100",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          height: tabBarHeight,
          paddingBottom: tabBarPaddingBottom,
          paddingTop: tabBarPaddingTop,
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
          elevation: Platform.OS === 'android' ? 5 : 0,
          shadowColor: Platform.OS === 'ios' ? "#000" : undefined,
          shadowOffset: Platform.OS === 'ios' ? { width: 0, height: -2 } : undefined,
          shadowOpacity: Platform.OS === 'ios' ? 0.1 : undefined,
          shadowRadius: Platform.OS === 'ios' ? 4 : undefined,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarLabel: ({ focused }) => <CustomTabLabel title="Home" focused={focused} />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "home" : "home-outline"} 
              size={Platform.OS === 'ios' ? 24 : 22} 
              color={color}
              style={{ opacity: 1 }}
            />
          ),
        }}
      />
      <Tab.Screen
        name="MyAds"
        component={MyAds}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            handleMyAdsPress();
          },
        }}
        options={{
          tabBarLabel: ({ focused }) => <CustomTabLabel title="My Ads" focused={focused} />,
          tabBarIcon: ({ color }) => (
            <FontAwesome5
              name="clipboard-list" 
              size={Platform.OS === 'ios' ? 20 : 18} 
              color={color}
              style={{ opacity: 1 }}
            />
          ),
        }}
      />

      <Tab.Screen
  name="Sell"
  component={SellNow}
  options={{
    tabBarLabel: () => null,
    tabBarIcon: () => <FloatingTabIcon />,
  }}
/>


      <Tab.Screen
        name="Chat"
        component={Chat}
        options={{
          tabBarLabel: ({ focused }) => <CustomTabLabel title="Chats" focused={focused} />,
          tabBarIcon: ({ color, focused }) => (
            <ChatTabIcon color={color} focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="Menu"
        component={More}
        options={{
          tabBarLabel: ({ focused }) => <CustomTabLabel title="Menu" focused={focused} />,
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? "menu" : "menu-outline"} 
              size={Platform.OS === 'ios' ? 24 : 22} 
              color={color}
              style={{ opacity: 1 }}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default function Main() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        const userData = await AsyncStorage.getItem("user");
        setIsLoggedIn(!!userData);
      } catch (error) {
        console.error('Error checking login status:', error);
        setIsLoggedIn(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoggedIn === null) {
    return <SplashScreen />; 
  }
  return (
    <Stack.Navigator 
      initialRouteName="SplashScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="SplashScreen" component={SplashScreen} />
      <Stack.Screen name="HomeTabs" component={HomeTabs} />
      <Stack.Screen name="SignupScreen" component={SignupScreen} />
      <Stack.Screen name="TermsAndConditions" component={TermsAndConditions} />
      <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicy} />
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen name="ForgotPasswordScreen" component={ForgotPasswordScreen} />
      <Stack.Screen name="CarDetails" component={CarDetailsScreen} />
      <Stack.Screen name="BikeDetails" component={BikeDetailsScreen} />
      <Stack.Screen name="CarListScreen" component={CarListScreen} />
      <Stack.Screen name="Profile" component={Profile} />
      <Stack.Screen name="SecurityScreen" component={SecurityScreen} />
      <Stack.Screen name="City" component={CityScreen} />
      <Stack.Screen name="LanguageScreen" component={LanguageScreen} />
      <Stack.Screen name="BlogScreen" component={BlogPage} />
      <Stack.Screen name="BlogDetailsPage" component={BlogDetailsPage} />
      <Stack.Screen name="VideoScreen" component={VideoPage} />
      <Stack.Screen name="VideoDetailsPage" component={VideoDetailsPage} />
      <Stack.Screen name="AdvertisingScreen" component={AdvertisingScreen} />
      <Stack.Screen name="SupportPage" component={SupportPage} />
      <Stack.Screen name="CallUsScreen" component={CallUsPage} />
      <Stack.Screen name="PostCarAd" component={PostCarAd} />
      <Stack.Screen name="PostBikeAd" component={PostBikeAd} />
      <Stack.Screen name="PostBikeAdFeatured" component={PostBikeAdFeatured} />
      <Stack.Screen name="BikePackageSelection" component={BikePackageSelection} />
      <Stack.Screen name="RentServiceAd" component={RentServiceAd} />
      <Stack.Screen name="PostAutoPartsAd" component={PostAutoPartsAd} />
      <Stack.Screen name="ListItforyou" component={ListItforyou} />
      <Stack.Screen name="BuyCarforMe" component={BuyCarforMe} />
      <Stack.Screen name="BuyCarforMeYearScreen" component={BuyCarforMeYearScreen} />
      <Stack.Screen name="BuyCarforMeBrandFlowScreen" component={BuyCarforMeBrandFlowScreen} />
      <Stack.Screen name="BuyCarforMeCityScreen" component={BuyCarforMeCityScreen} />
      <Stack.Screen name="BuyCarforMeLocationScreen" component={BuyCarforMeLocationScreen} />
      <Stack.Screen name="CarInspection" component={CarInspection} />
      <Stack.Screen name="LocationSelectionScreen" component={LocationSelectionScreen} />
      <Stack.Screen name="RegistrationCitySelectionScreen" component={RegistrationCitySelectionScreen} />
      <Stack.Screen name="BuyCarForMeScreen" component={BuyCarForMeScreen} />
      <Stack.Screen name="CarInspectionScreen" component={CarInspectionScreen} />
      <Stack.Screen name="CarRentalServiceScreen" component={CarRentalServiceScreen} />
      <Stack.Screen name="PostCarAdFeatured" component={PostCarAdFeatured} />
      <Stack.Screen name="FeaturesSelectorScreen" component={FeaturesSelectorScreen} />
      <Stack.Screen name="AreaSelectorScreen" component={AreaSelectorScreen} />
      <Stack.Screen name="MyAds" component={MyAds} />
      <Stack.Screen name="NewCarListScreen" component={NewCarListScreen} />
      <Stack.Screen name="FeaturedCarListScreen" component={FeaturedCarListScreen} />
      <Stack.Screen name="ForYouCarListScreen" component={ForYouCarListScreen} />
      <Stack.Screen name="ChatDetailScreen" component={ChatDetailScreen} />
      <Stack.Screen name="UserProfileDetails" component={UserProfileDetails} />
      <Stack.Screen name="MyFavorite" component={MyFavoritesScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="PostFreeAd" component={PostFreeAdScreen} />
      <Stack.Screen name="PostFeaturedAd" component={PostFeaturedAdScreen} />
      <Stack.Screen name="ListItForYouScreen" component={ListItForYouScreen} />
      <Stack.Screen name="DetailsScreen" component={DetailsScreen} />
      <Stack.Screen name="AutoPartsListScreen" component={AutoPartsListScreen} />
      <Stack.Screen name="BikeListScreen" component={BikeListScreen} />
      <Stack.Screen name="NewCarDetails" component={NewCarDetailsScreen} />
      <Stack.Screen name="AllOffersScreen" component={AllOffersScreen} />
      <Stack.Screen name="SellBikeScreen" component={SellBikeScreen} />
      <Stack.Screen name="SellAutoScreen" component={SellAutoScreen} />
      <Stack.Screen name="RentalCarListScreen" component={RentalCarListScreen} />
      <Stack.Screen name="RentalCarDetailsScreen" component={RentalCarDetailsScreen} />
      <Stack.Screen name="PackagesScreen" component={PackagesScreen} />
      <Stack.Screen name="PackageDetail" component={PackageDetailScreen} />
      <Stack.Screen name="PackageUsage" component={PackageUsageScreen} />
      <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="CarComparison" component={CarComparisonScreen} />
      <Stack.Screen name="ComparisonResults" component={ComparisonResultsScreen} />
      <Stack.Screen name="NewBikeListScreen" component={NewBikeListScreen} />
      <Stack.Screen name="NewBikeDetailsScreen" component={NewBikeDetailsScreen} />
      <Stack.Screen name="AutoPartsDetailsScreen" component={AutoPartsDetailsScreen} />
      <Stack.Screen name="PakagesScreen" component={Pakages} />
      <Stack.Screen name="CarDetail" component={CarDetailScreen} />
      <Stack.Screen name="EditAd" component={EditAdScreen} />
      <Stack.Screen name="PaymentScreen" component={PaymentScreen} />
      <Stack.Screen name="PaymentReceipt" component={PaymentReceiptScreen} />
      <Stack.Screen name="PremiumPackagesScreen" component={PremiumPackagesScreen} />
      <Stack.Screen name="ExpiredAds" component={ExpiredAdsScreen} />
      <Stack.Screen name="InspectionReportView" component={InspectionReportViewScreen} />
      <Stack.Screen name="UpgradeFreeAdToPremium" component={UpgradeFreeAdToPremium} />




    </Stack.Navigator>
  );
}
