import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image,
  Animated,
  Dimensions,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons, MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { COLORS } from "../../constants/colors";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../../navigationTypes";
import { LinearGradient as ExpoLinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const PremiumAdServiceScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const scrollY = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);
  const [selectedService, setSelectedService] = useState<string | null>(null);

  useEffect(() => {
    let scrollToValue = 1200;
    Animated.timing(scrollY, {
      toValue: scrollToValue,
      duration: 1500,
      useNativeDriver: false,
    }).start();

    scrollY.addListener(({ value }) => {
      scrollViewRef.current?.scrollTo({ y: value, animated: false });
    });

    return () => scrollY.removeAllListeners();
  }, []);

  const premiumServices = [
    {
      id: "featured-placement",
      title: "Featured Placement",
      description: "Your ad appears at the top of search results",
      price: "PKR 1,500 - 3,150",
      duration: "7-30 days",
      icon: "star",
      iconType: "Ionicons",
      color: "#FFD700",
      features: [
        "Top placement in search results",
        "Featured badge on your ad",
        "5x more visibility than regular ads",
        "Priority customer support"
      ],
      popular: true
    },
    {
      id: "professional-photography",
      title: "Professional Photography",
      description: "High-quality photos taken by our professional photographers",
      price: "PKR 2,000",
      duration: "Same day",
      icon: "camera",
      iconType: "Ionicons",
      color: "#4ECDC4",
      features: [
        "Professional photo shoot",
        "Up to 20 high-quality images",
        "Photo editing and enhancement",
        "Multiple angles and details"
      ],
      popular: false
    },
    {
      id: "video-tour",
      title: "Video Tour",
      description: "Create an engaging video tour of your vehicle",
      price: "PKR 3,500",
      duration: "2-3 days",
      icon: "videocam",
      iconType: "Ionicons",
      color: "#FF6B6B",
      features: [
        "Professional video production",
        "360° interior and exterior views",
        "Engine sound and driving footage",
        "Social media ready format"
      ],
      popular: false
    },
    {
      id: "social-media-promotion",
      title: "Social Media Promotion",
      description: "Promote your ad across our social media channels",
      price: "PKR 1,000",
      duration: "7 days",
      icon: "share-social",
      iconType: "Ionicons",
      color: "#96CEB4",
      features: [
        "Facebook and Instagram promotion",
        "Targeted audience reach",
        "Professional post design",
        "Performance analytics"
      ],
      popular: false
    },
    {
      id: "priority-support",
      title: "Priority Support",
      description: "Dedicated support team for your listing",
      price: "PKR 500",
      duration: "30 days",
      icon: "headset",
      iconType: "Ionicons",
      color: "#45B7D1",
      features: [
        "24/7 dedicated support",
        "WhatsApp priority line",
        "Quick response time",
        "Personal listing manager"
      ],
      popular: false
    },
    {
      id: "analytics-dashboard",
      title: "Analytics Dashboard",
      description: "Detailed insights about your ad performance",
      price: "PKR 300",
      duration: "30 days",
      icon: "analytics",
      iconType: "Ionicons",
      color: "#FFB74D",
      features: [
        "View count tracking",
        "Inquiry analytics",
        "Performance metrics",
        "Optimization suggestions"
      ],
      popular: false
    }
  ];

  const handleServiceSelect = (serviceId: string) => {
    setSelectedService(serviceId);
  };

  const handleContinue = () => {
    if (selectedService) {
      const service = premiumServices.find(s => s.id === selectedService);
      if (service) {
        Alert.alert(
          "Service Selected",
          `You have selected ${service.title}. You will be redirected to the payment page.`,
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Continue",
              onPress: () => {
                // Navigate to payment or ad creation screen
                navigation.navigate("PostCarAdFeatured", { 
                  selectedPackage: service,
                  serviceName: service.title,
                  price: service.price
                });
              }
            }
          ]
        );
      }
    }
  };

  const renderIcon = (icon: string, iconType: string, color: string, size: number = 24) => {
    switch (iconType) {
      case "Ionicons":
        return <Ionicons name={icon as any} size={size} color={color} />;
      case "MaterialIcons":
        return <MaterialIcons name={icon as any} size={size} color={color} />;
      case "FontAwesome5":
        return <FontAwesome5 name={icon as any} size={size} color={color} />;
      default:
        return <Ionicons name="star" size={size} color={color} />;
    }
  };

  return (
    <ScrollView ref={scrollViewRef} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={COLORS.black} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Premium Ad Services</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Hero Section */}
        <ExpoLinearGradient
          colors={[COLORS.primary, '#E53E3E']}
          style={styles.heroSection}
        >
          <View style={styles.heroContent}>
            <Ionicons name="diamond" size={48} color="#fff" />
            <Text style={styles.heroTitle}>Premium Ad Services</Text>
            <Text style={styles.heroSubtitle}>
              Maximize your vehicle's visibility and sell faster with our premium advertising services
            </Text>
          </View>
        </ExpoLinearGradient>

        {/* Stats Section */}
        <View style={styles.statsSection}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>5x</Text>
            <Text style={styles.statLabel}>More Views</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>3x</Text>
            <Text style={styles.statLabel}>Faster Sale</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>95%</Text>
            <Text style={styles.statLabel}>Success Rate</Text>
          </View>
        </View>

        {/* Services Grid */}
        <View style={styles.servicesContainer}>
          <Text style={styles.sectionTitle}>Choose Your Premium Services</Text>
          <Text style={styles.sectionSubtitle}>
            Select one or more services to enhance your ad's performance
          </Text>

          <View style={styles.servicesGrid}>
            {premiumServices.map((service, index) => (
              <TouchableOpacity
                key={service.id}
                style={[
                  styles.serviceCard,
                  selectedService === service.id && styles.selectedServiceCard,
                  service.popular && styles.popularServiceCard
                ]}
                onPress={() => handleServiceSelect(service.id)}
              >
                {service.popular && (
                  <View style={styles.popularBadge}>
                    <Text style={styles.popularText}>MOST POPULAR</Text>
                  </View>
                )}

                <View style={styles.serviceHeader}>
                  <View style={[styles.serviceIcon, { backgroundColor: service.color + '20' }]}>
                    {renderIcon(service.icon, service.iconType, service.color, 28)}
                  </View>
                  <View style={styles.serviceInfo}>
                    <Text style={styles.serviceTitle}>{service.title}</Text>
                    <Text style={styles.serviceDescription}>{service.description}</Text>
                  </View>
                </View>

                <View style={styles.servicePricing}>
                  <Text style={styles.servicePrice}>{service.price}</Text>
                  <Text style={styles.serviceDuration}>{service.duration}</Text>
                </View>

                <View style={styles.serviceFeatures}>
                  {service.features.map((feature, featureIndex) => (
                    <View key={featureIndex} style={styles.featureItem}>
                      <Ionicons name="checkmark-circle" size={16} color={COLORS.primary} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                {selectedService === service.id && (
                  <View style={styles.selectedIndicator}>
                    <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.benefitsSection}>
          <Text style={styles.benefitsTitle}>Why Choose Premium Services?</Text>
          <View style={styles.benefitsList}>
            {[
              "Professional quality presentation",
              "Increased visibility and reach",
              "Faster sale completion",
              "Higher selling prices",
              "Dedicated support team",
              "Money-back guarantee"
            ].map((benefit, index) => (
              <View key={index} style={styles.benefitItem}>
                <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
                <Text style={styles.benefitText}>{benefit}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              { opacity: selectedService ? 1 : 0.5 }
            ]}
            disabled={!selectedService}
            onPress={handleContinue}
          >
            <ExpoLinearGradient
              colors={selectedService ? [COLORS.primary, '#E53E3E'] : ['#ccc', '#999']}
              style={styles.buttonGradient}
            >
              <Text style={styles.continueButtonText}>
                {selectedService ? 'Continue with Selected Service' : 'Select a Service to Continue'}
              </Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </ExpoLinearGradient>
          </TouchableOpacity>

          <Text style={styles.guaranteeText}>
            💯 30-day money-back guarantee on all premium services
          </Text>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
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
    color: COLORS.black,
  },
  heroSection: {
    padding: 24,
    alignItems: "center",
  },
  heroContent: {
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginTop: 16,
    marginBottom: 8,
  },
  heroSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.9)",
    textAlign: "center",
    lineHeight: 24,
  },
  statsSection: {
    flexDirection: "row",
    backgroundColor: COLORS.white,
    paddingVertical: 20,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    textAlign: "center",
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.lightGray,
    marginHorizontal: 16,
  },
  servicesContainer: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginBottom: 20,
  },
  servicesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  serviceCard: {
    width: (width - 48) / 2,
    backgroundColor: COLORS.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.lightGray,
    position: "relative",
  },
  selectedServiceCard: {
    borderColor: COLORS.primary,
    backgroundColor: "#F9ECEC",
  },
  popularServiceCard: {
    borderColor: "#FFD700",
  },
  popularBadge: {
    position: "absolute",
    top: -8,
    left: 16,
    right: 16,
    backgroundColor: "#FFD700",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 4,
    alignItems: "center",
  },
  popularText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#000",
  },
  serviceHeader: {
    flexDirection: "row",
    marginBottom: 12,
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  serviceInfo: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 4,
  },
  serviceDescription: {
    fontSize: 12,
    color: COLORS.darkGray,
    lineHeight: 16,
  },
  servicePricing: {
    marginBottom: 12,
  },
  servicePrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  serviceDuration: {
    fontSize: 12,
    color: COLORS.darkGray,
  },
  serviceFeatures: {
    marginBottom: 8,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  featureText: {
    fontSize: 11,
    color: COLORS.darkGray,
    marginLeft: 6,
    flex: 1,
  },
  selectedIndicator: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  benefitsSection: {
    backgroundColor: COLORS.white,
    padding: 20,
    marginHorizontal: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  benefitsTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: COLORS.black,
    marginBottom: 16,
    textAlign: "center",
  },
  benefitsList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  benefitItem: {
    flexDirection: "row",
    alignItems: "center",
    width: "50%",
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginLeft: 8,
    flex: 1,
  },
  ctaSection: {
    padding: 16,
    paddingBottom: 32,
  },
  continueButton: {
    marginBottom: 16,
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
  },
  continueButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  guaranteeText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: "center",
    fontStyle: "italic",
  },
});

export default PremiumAdServiceScreen;
