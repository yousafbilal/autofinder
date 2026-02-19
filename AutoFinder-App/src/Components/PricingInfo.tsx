import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { API_URL } from '../../config';

interface PricingInfo {
  userId: string;
  freeAdsRemaining: number;
  canPostFree: boolean;
  nextAdCost: number;
  paidAdsCount: number;
  totalPaidAmount: number;
  premiumAdjustmentAvailable: number;
  pricingInfo: {
    freeAds: number;
    paidAdCost: number;
    description: string;
  };
}

interface PricingInfoProps {
  userId: string;
  onUpgrade?: () => void;
}

const PricingInfo: React.FC<PricingInfoProps> = ({ userId, onUpgrade }) => {
  const [pricing, setPricing] = useState<PricingInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPricingInfo();
  }, [userId]);

  const fetchPricingInfo = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/user-pricing/${userId}`);
      
      if (response.ok) {
        const data = await response.json();
        setPricing(data);
      } else {
        console.error('Failed to fetch pricing info');
      }
    } catch (error) {
      console.error('Error fetching pricing info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading pricing information...</Text>
      </View>
    );
  }

  if (!pricing) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Failed to load pricing information</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="pricetag" size={24} color={COLORS.primary} />
        <Text style={styles.title}>Ad Pricing</Text>
      </View>

      <View style={styles.pricingCard}>
        <View style={styles.freeAdsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="gift" size={20} color={COLORS.success} />
            <Text style={styles.sectionTitle}>Free Ads</Text>
          </View>
          <Text style={styles.freeAdsCount}>
            {pricing.freeAdsRemaining} of {pricing.pricingInfo.freeAds} remaining
          </Text>
          <Text style={styles.freeAdsDescription}>
            Your first 2 ads are completely free!
          </Text>
        </View>

        <View style={styles.paidAdsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="card" size={20} color={COLORS.warning} />
            <Text style={styles.sectionTitle}>Paid Ads</Text>
          </View>
          <Text style={styles.paidAdsCost}>
            PKR {pricing.pricingInfo.paidAdCost} per ad
          </Text>
          <Text style={styles.paidAdsDescription}>
            After your free ads, each additional ad costs PKR 525
          </Text>
        </View>

        {pricing.paidAdsCount > 0 && (
          <View style={styles.creditSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="star" size={20} color={COLORS.primary} />
              <Text style={styles.sectionTitle}>Premium Credits</Text>
            </View>
            <Text style={styles.creditAmount}>
              PKR {pricing.premiumAdjustmentAvailable} available
            </Text>
            <Text style={styles.creditDescription}>
              This amount will be adjusted from any premium service you purchase
            </Text>
          </View>
        )}

        <View style={styles.nextAdSection}>
          <Text style={styles.nextAdTitle}>Next Ad Cost:</Text>
          <Text style={[
            styles.nextAdCost,
            { color: pricing.nextAdCost === 0 ? COLORS.success : COLORS.warning }
          ]}>
            {pricing.nextAdCost === 0 ? 'FREE' : `PKR ${pricing.nextAdCost}`}
          </Text>
        </View>

        {pricing.nextAdCost > 0 && onUpgrade && (
          <TouchableOpacity style={styles.upgradeButton} onPress={onUpgrade}>
            <Ionicons name="arrow-up" size={20} color={COLORS.white} />
            <Text style={styles.upgradeButtonText}>Upgrade to Premium</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoText}>
          💡 {pricing.pricingInfo.description}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: COLORS.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
    color: COLORS.dark,
  },
  pricingCard: {
    backgroundColor: COLORS.lightGray,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  freeAdsSection: {
    marginBottom: 16,
  },
  paidAdsSection: {
    marginBottom: 16,
  },
  creditSection: {
    marginBottom: 16,
    backgroundColor: COLORS.primary + '10',
    padding: 12,
    borderRadius: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    color: COLORS.dark,
  },
  freeAdsCount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.success,
    marginBottom: 4,
  },
  freeAdsDescription: {
    fontSize: 14,
    color: COLORS.gray,
  },
  paidAdsCost: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.warning,
    marginBottom: 4,
  },
  paidAdsDescription: {
    fontSize: 14,
    color: COLORS.gray,
  },
  creditAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 4,
  },
  creditDescription: {
    fontSize: 14,
    color: COLORS.gray,
  },
  nextAdSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  nextAdTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.dark,
  },
  nextAdCost: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginTop: 16,
  },
  upgradeButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoSection: {
    backgroundColor: COLORS.lightBlue + '20',
    padding: 12,
    borderRadius: 8,
  },
  infoText: {
    fontSize: 14,
    color: COLORS.dark,
    lineHeight: 20,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.gray,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: 'center',
  },
});

export default PricingInfo;
