import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants/colors';
import { bikeFeatures } from './EnhancedDropdownData';

interface EnhancedFeaturesPickerProps {
  selectedFeatures: string[];
  onFeaturesChange: (features: string[]) => void;
  required?: boolean;
  title?: string;
  maxFeatures?: number;
}

const EnhancedFeaturesPicker: React.FC<EnhancedFeaturesPickerProps> = ({
  selectedFeatures,
  onFeaturesChange,
  required = false,
  title = "Features",
  maxFeatures = 100,
}) => {
  
  const [customFeatures, setCustomFeatures] = useState<string[]>([]);
  const [newFeature, setNewFeature] = useState('');
  const newFeatureInputRef = useRef<TextInput | null>(null);

  // Group features by category
  const featureSource = React.useMemo(() => {
    return [...bikeFeatures, ...customFeatures];
  }, [customFeatures]);

  const featureCategories = {
    'All Features': featureSource
  };

  const filteredFeatures = Object.entries(featureCategories).map(([category, features]) => ({
    category,
    features,
  }));

  const toggleFeature = (feature: string) => {
    if (selectedFeatures.includes(feature)) {
      onFeaturesChange(selectedFeatures.filter(f => f !== feature));
    } else if (selectedFeatures.length < maxFeatures) {
      onFeaturesChange([...selectedFeatures, feature]);
    }
  };

  const removeFeature = (feature: string) => {
    onFeaturesChange(selectedFeatures.filter(f => f !== feature));
  };

  const renderFeatureItem = ({ item }: { item: string }) => {
    const isSelected = selectedFeatures.includes(item);
    const isDisabled = !isSelected && selectedFeatures.length >= maxFeatures;

    return (
      <TouchableOpacity
        style={[
          styles.featureItem,
          isSelected && styles.selectedFeatureItem,
          isDisabled && styles.disabledFeatureItem,
        ]}
        onPress={() => toggleFeature(item)}
        disabled={isDisabled}
      >
        <Text
          style={[
            styles.featureText,
            isSelected && styles.selectedFeatureText,
            isDisabled && styles.disabledFeatureText,
          ]}
        >
          {item}
        </Text>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={20} color={COLORS.primary} />
        )}
      </TouchableOpacity>
    );
  };

  const renderCategory = ({ item }: { item: { category: string; features: string[] } }) => (
    <View style={styles.categoryContainer}>
      <Text style={styles.categoryTitle}>{item.category || 'N/A'}</Text>
      <View style={styles.featuresGrid}>
        {item.features.map((feature, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.featureChip,
              selectedFeatures.includes(feature) && styles.selectedFeatureChip,
              !selectedFeatures.includes(feature) && selectedFeatures.length >= maxFeatures && styles.disabledFeatureChip,
            ]}
            onPress={() => toggleFeature(feature)}
            disabled={!selectedFeatures.includes(feature) && selectedFeatures.length >= maxFeatures}
          >
            <Text
              style={[
                styles.featureChipText,
                selectedFeatures.includes(feature) && styles.selectedFeatureChipText,
                !selectedFeatures.includes(feature) && selectedFeatures.length >= maxFeatures && styles.disabledFeatureChipText,
              ]}
            >
              {feature}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {title} {required && <Text style={styles.required}>*</Text>}
        </Text>
      </View>

      {selectedFeatures.length > 0 && (
        <View style={styles.selectedFeaturesContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.selectedFeaturesScroll}
          >
            {selectedFeatures.map((feature, index) => (
              <View key={index} style={styles.selectedFeatureTag}>
                <Text style={styles.selectedFeatureTagText}>{feature}</Text>
                <TouchableOpacity
                  style={styles.removeFeatureButton}
                  onPress={() => removeFeature(feature)}
                >
                  <Ionicons name="close" size={16} color={COLORS.white} />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {selectedFeatures.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="options-outline" size={32} color={COLORS.lightGray} />
          <Text style={styles.emptyText}>No features selected</Text>
          <Text style={styles.emptySubtext}>
            Tap "Add Features" to select up to {maxFeatures} features
          </Text>
        </View>
      )}

      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <View style={styles.placeholder} />
          <Text style={styles.modalTitle}>Select Features</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.addCustomRow}>
          <TextInput
            style={styles.addCustomInput}
            placeholder="Type feature and press Enter or comma"
            value={newFeature}
            onChangeText={(text) => {
              const tokens = text.split(/[\n,;]+/);
              if (tokens.length > 1) {
                const parts = tokens.map(t => t.trim()).filter(Boolean);
                const last = text.match(/[\n,;]$/) ? '' : parts.pop() || '';
                parts.forEach(f => {
                  const exists = featureSource.some(x => x.toLowerCase() === f.toLowerCase());
                  if (!exists) {
                    setCustomFeatures(prev => [...prev, f]);
                  }
                  if (!selectedFeatures.some(x => x.toLowerCase() === f.toLowerCase())) {
                    onFeaturesChange([...selectedFeatures, f]);
                  }
                });
                setNewFeature(last);
              } else {
                setNewFeature(text);
              }
            }}
            placeholderTextColor={COLORS.gray}
            ref={newFeatureInputRef}
            returnKeyType="done"
            blurOnSubmit={false}
            autoCorrect={false}
            autoCapitalize="none"
            autoComplete="off"
            onBlur={() => setTimeout(() => newFeatureInputRef.current?.focus(), 0)}
            onSubmitEditing={() => {
              const f = newFeature.trim();
              if (!f) return;
              const exists = featureSource.some(x => x.toLowerCase() === f.toLowerCase());
              if (!exists) {
                setCustomFeatures(prev => [...prev, f]);
              }
              if (!selectedFeatures.some(x => x.toLowerCase() === f.toLowerCase())) {
                onFeaturesChange([...selectedFeatures, f]);
              }
              setNewFeature('');
              setTimeout(() => newFeatureInputRef.current?.focus(), 0);
            }}
          />
        </View>

        <View style={styles.selectedCountContainer}>
          <Text style={styles.selectedCountText}>
            {selectedFeatures.length}/{maxFeatures} features selected
          </Text>
        </View>

        <View style={styles.list}>
          {filteredFeatures.map((cat, index) => {
            // Safely convert category to string key
            let categoryKey: string;
            try {
              if (cat.category) {
                if (typeof cat.category === 'string') {
                  categoryKey = cat.category;
                } else if (typeof cat.category === 'object' && cat.category.toString) {
                  const str = String(cat.category.toString());
                  categoryKey = str !== '[object Object]' ? str : `category-${index}`;
                } else {
                  categoryKey = `category-${index}`;
                }
              } else {
                categoryKey = `category-${index}`;
              }
            } catch (e) {
              categoryKey = `category-${index}`;
            }
            return (
              <React.Fragment key={categoryKey}>
                {renderCategory({ item: cat })}
              </React.Fragment>
            );
          })}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
  },
  required: {
    color: COLORS.primary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 6,
    backgroundColor: COLORS.white,
  },
  addButtonText: {
    color: COLORS.primary,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  selectedFeaturesContainer: {
    marginTop: 8,
  },
  selectedFeaturesScroll: {
    maxHeight: 100,
  },
  selectedFeatureTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
  },
  selectedFeatureTagText: {
    color: COLORS.white,
    fontSize: 12,
    marginRight: 4,
  },
  removeFeatureButton: {
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: COLORS.lightGray,
    borderRadius: 8,
    marginTop: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.darkGray,
    marginTop: 8,
  },
  emptySubtext: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 4,
    textAlign: 'center',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: 4,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.black,
  },
  placeholder: {
    width: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    backgroundColor: COLORS.lightGray,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.black,
    marginLeft: 8,
  },
  selectedCountContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.lightGray,
  },
  selectedCountText: {
    fontSize: 14,
    color: COLORS.darkGray,
    textAlign: 'center',
  },
  list: {
    flex: 1,
  },
  addCustomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  addCustomInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
    marginRight: 8,
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: COLORS.white,
  },
  addCustomButtonText: {
    color: COLORS.primary,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
  },
  categoryContainer: {
    paddingVertical: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.black,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
  },
  featureChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 16,
    backgroundColor: COLORS.white,
  },
  selectedFeatureChip: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  disabledFeatureChip: {
    backgroundColor: COLORS.lightGray,
    borderColor: COLORS.lightGray,
  },
  featureChipText: {
    fontSize: 12,
    color: COLORS.black,
  },
  selectedFeatureChipText: {
    color: COLORS.white,
  },
  disabledFeatureChipText: {
    color: COLORS.gray,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  selectedFeatureItem: {
    backgroundColor: COLORS.lightGray,
  },
  disabledFeatureItem: {
    opacity: 0.5,
  },
  featureText: {
    fontSize: 16,
    color: COLORS.black,
  },
  selectedFeatureText: {
    color: COLORS.primary,
    fontWeight: '500',
  },
  disabledFeatureText: {
    color: COLORS.gray,
  },
});

export default React.memo(EnhancedFeaturesPicker);
