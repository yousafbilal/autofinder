import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons, MaterialIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeIonicons, SafeFontAwesome5, SafeMaterialIcons } from '../utils/iconHelper';
import { LinearGradient as ExpoLinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

interface TabItem {
  id: string;
  label: string;
  icon: string;
  iconType: 'Ionicons' | 'MaterialIcons' | 'FontAwesome5';
  activeIcon?: string;
  badge?: number;
  gradient?: string[];
}

interface ModernBottomBarProps {
  activeTab: string;
  onTabPress: (tabId: string) => void;
}

const ModernBottomBar: React.FC<ModernBottomBarProps> = ({ activeTab, onTabPress }) => {
  const [selectedTab, setSelectedTab] = useState(activeTab);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const tabs: TabItem[] = [
    {
      id: 'home',
      label: 'Home',
      icon: 'home-outline',
      activeIcon: 'home',
      iconType: 'Ionicons',
      gradient: ['#FF6B6B', '#FF8E8E'],
    },
    {
      id: 'sell',
      label: 'Sell',
      icon: 'add-circle-outline',
      activeIcon: 'add-circle',
      iconType: 'Ionicons',
      gradient: ['#4ECDC4', '#6ED5CD'],
    },
    {
      id: 'favorites',
      label: 'Favorites',
      icon: 'heart-outline',
      activeIcon: 'heart',
      iconType: 'Ionicons',
      badge: 3,
      gradient: ['#45B7D1', '#6BC5D8'],
    },
    {
      id: 'more',
      label: 'More',
      icon: 'menu-outline',
      activeIcon: 'menu',
      iconType: 'Ionicons',
      gradient: ['#96CEB4', '#A8D5C0'],
    },
  ];

  useEffect(() => {
    setSelectedTab(activeTab);
  }, [activeTab]);

  const handleTabPress = (tabId: string) => {
    // Animation
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setSelectedTab(tabId);
    onTabPress(tabId);
  };

  const renderIcon = (icon: string, iconType: string, color: string, size: number = 24) => {
    switch (iconType) {
      case 'Ionicons':
        return <SafeIonicons name={icon as any} size={size} color={color} />;
      case 'MaterialIcons':
        return <SafeMaterialIcons name={icon as any} size={size} color={color} />;
      case 'FontAwesome5':
        return <SafeFontAwesome5 name={icon as any} size={size} color={color} />;
      default:
        return <SafeIonicons name="home" size={size} color={color} />;
    }
  };

  return (
    <View style={styles.container}>
      {/* Background with gradient */}
      <ExpoLinearGradient
        colors={['rgba(255,255,255,0.95)', 'rgba(248,249,250,0.95)']}
        style={styles.gradientBackground}
      />
      
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {tabs.map((tab, index) => {
          const isActive = selectedTab === tab.id;
          const tabWidth = width / tabs.length;
          
          return (
            <TouchableOpacity
              key={(() => {
                try {
                  if (tab.id) {
                    if (typeof tab.id === 'string') return tab.id;
                    if (typeof tab.id === 'number') return `tab-${tab.id}`;
                    if (typeof tab.id === 'object' && tab.id.toString) return String(tab.id.toString());
                  }
                  return `tab-${index}`;
                } catch (error) {
                  return `tab-${index}-${Date.now()}`;
                }
              })()}
              style={[styles.tab, { width: tabWidth }]}
              onPress={() => handleTabPress(tab.id)}
              activeOpacity={0.7}
            >
              <Animated.View
                style={[
                  styles.tabContent,
                  {
                    transform: [{ scale: isActive ? scaleAnim : 1 }],
                  },
                ]}
              >
                {/* Active indicator */}
                {isActive && (
                  <ExpoLinearGradient
                    colors={tab.gradient || [COLORS.primary, COLORS.primary]}
                    style={styles.activeIndicator}
                  />
                )}
                
                {/* Icon container */}
                <View style={[styles.iconContainer, isActive && styles.activeIconContainer]}>
                  {renderIcon(
                    isActive ? (tab.activeIcon || tab.icon) : tab.icon,
                    tab.iconType,
                    isActive ? '#fff' : COLORS.darkGray,
                    24
                  )}
                  
                  {/* Badge */}
                  {tab.badge && tab.badge > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {tab.badge > 99 ? '99+' : tab.badge}
                      </Text>
                    </View>
                  )}
                </View>
                
                {/* Label */}
                <Text style={[styles.tabLabel, isActive && styles.activeTabLabel]}>
                  {tab.label}
                </Text>
              </Animated.View>
            </TouchableOpacity>
          );
        })}
      </View>
      
      {/* Bottom safe area */}
      <View style={styles.safeArea} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  activeIndicator: {
    position: 'absolute',
    top: -8,
    left: -20,
    right: -20,
    height: 4,
    borderRadius: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  activeIconContainer: {
    backgroundColor: 'rgba(205, 1, 0, 0.1)',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FF4444',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  tabLabel: {
    fontSize: 12,
    color: COLORS.darkGray,
    fontWeight: '500',
    textAlign: 'center',
  },
  activeTabLabel: {
    color: COLORS.primary,
    fontWeight: 'bold',
  },
  safeArea: {
    height: 34, // iPhone safe area height
    backgroundColor: 'transparent',
  },
});

export default ModernBottomBar;
