import React, { useEffect, useMemo, useState, useCallback, useRef, useReducer } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Alert, Image, FlatList, InteractionManager } from "react-native";
import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { startInspection, submitInspection } from "../../api/inspections";
import { uploadInspectionPhoto } from "../../utils/uploadInspectionPhoto";
import { computeOverallScore, DEFAULT_WEIGHTS } from "../../utils/inspectionScoring";
import { API_URL } from "../../../config";

type Item = { id: string; label: string; section: string };
type RatingValue = 0 | 1 | 2 | 3 | 4;

// Fast dropdown data for inspection form
const TYRE_BRANDS = [
  "Michelin", "Bridgestone", "Goodyear", "Dunlop", "Pirelli", "Continental",
  "Yokohama", "Hankook", "Kumho", "Firestone", "Toyo", "Nitto", "BF Goodrich",
  "Cooper", "Falken", "Federal", "General Tire", "Maxxis", "Nexen", "Sumitomo",
  "Uniroyal", "Vredestein", "Apollo", "Ceat", "JK Tyre", "MRF", "Pace",
  "Petlas", "Premier", "Rapido", "Roadstone", "Star", "TVS", "UltraMile"
].sort();

const TYRE_TREAD_LEVELS = [
  "Excellent (8-10mm)", "Good (6-8mm)", "Fair (4-6mm)", "Poor (2-4mm)",
  "Critical (0-2mm)", "Bald (<1mm)"
];

const TYRE_SIZES = [
  "155/65/R13", "165/65/R13", "175/65/R14", "185/65/R14", "195/65/R15",
  "205/65/R15", "215/65/R16", "225/65/R17", "235/65/R17", "245/65/R17",
  "155/70/R13", "165/70/R13", "175/70/R14", "185/70/R14", "195/70/R15",
  "205/70/R15", "215/70/R16", "225/70/R16", "235/70/R17", "245/70/R18",
  "165/80/R13", "175/80/R14", "185/80/R14", "195/80/R15", "205/80/R16",
  "215/80/R16", "225/80/R16", "235/80/R17", "245/80/R18", "265/80/R19",
  "195/55/R15", "205/55/R16", "215/55/R16", "225/55/R16", "235/55/R17",
  "245/55/R17", "255/55/R18", "265/55/R19", "275/55/R20", "285/55/R22",
  "195/60/R15", "205/60/R15", "215/60/R16", "225/60/R16", "235/60/R17",
  "245/60/R17", "255/60/R18", "265/60/R18", "275/60/R20", "285/60/R22",
  "195/65/R15", "205/65/R15", "215/65/R16", "225/65/R16", "235/65/R17",
  "245/65/R17", "255/65/R18", "265/65/R18", "275/65/R20", "285/65/R22",
  "195/70/R15", "205/70/R15", "215/70/R16", "225/70/R16", "235/70/R17",
  "245/70/R17", "255/70/R18", "265/70/R18", "275/70/R20", "285/70/R22"
];

const RIM_TYPES = [
  "Steel", "Alloy", "Chrome", "Carbon Fiber", "Forged", "Cast", "Flow Formed"
];

const STATUS_OPTIONS = [
  { label: "No Damage Found", value: 4, color: "#28a745" },
  { label: "Need Replacement", value: 2, color: "#ff9800" },
  { label: "Present", value: 3, color: "#2196F3" }
];

// Fast Dropdown Component - Optimized for instant selection
const FastDropdown = React.memo(({
  options,
  placeholder,
  value,
  onValueChange,
  disabled = false
}: {
  options: string[] | Array<{label: string, value: any, color?: string}>,
  placeholder: string,
  value: any,
  onValueChange: (value: any) => void,
  disabled?: boolean
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef<View>(null);

  // Filter options based on search - optimized with early return
  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options.slice(0, 100); // Limit initial render
    const search = searchTerm.toLowerCase();
    const filtered = options.filter(option => {
      const text = typeof option === 'string' ? option : option.label;
      return text.toLowerCase().includes(search);
    });
    return filtered.slice(0, 50); // Limit filtered results
  }, [options, searchTerm]);

  const handleSelect = useCallback((option: any) => {
    const selectedValue = typeof option === 'string' ? option : option.value;
    // Immediate callback - no debouncing for dropdowns
    onValueChange(selectedValue);
    setIsOpen(false);
    setSearchTerm("");
  }, [onValueChange]);

  const getDisplayText = useCallback((): string => {
    if (!value) return placeholder;
    if (options.length === 0) return placeholder;
    
    // Check if first option is a string
    const firstOption = options[0];
    if (typeof firstOption === 'string') {
      const found = options.find((opt: any) => opt === value);
      return typeof found === 'string' ? found : placeholder;
    } else if (firstOption && typeof firstOption === 'object' && 'label' in firstOption) {
      const option = options.find((opt: any) => {
        if (!opt || typeof opt !== 'object') return false;
        return 'value' in opt && opt.value === value;
      }) as { label: string; value: any } | undefined;
      return option && 'label' in option ? String(option.label) : placeholder;
    }
    return placeholder;
  }, [value, options, placeholder]);

  return (
    <View ref={dropdownRef} style={{ position: 'relative' }}>
      <TouchableOpacity
        onPress={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          borderWidth: 1,
          borderColor: disabled ? '#CCC' : '#DDD',
          borderRadius: 6,
          padding: 12,
          backgroundColor: disabled ? '#F5F5F5' : '#FFF',
          minHeight: 48,
          justifyContent: 'center'
        }}
      >
        <Text style={{
          color: value ? '#000' : '#999',
          fontSize: 14
        }}>
          {getDisplayText()}
        </Text>
      </TouchableOpacity>

      {isOpen && (
        <View style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          backgroundColor: '#FFF',
          borderWidth: 1,
          borderColor: '#DDD',
          borderRadius: 6,
          maxHeight: 200,
          zIndex: 1000,
          elevation: 5,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 4
        }}>
          {/* Search input */}
          <TextInput
            placeholder="Search..."
            value={searchTerm}
            onChangeText={setSearchTerm}
            style={{
              borderBottomWidth: 1,
              borderBottomColor: '#EEE',
              padding: 12,
              fontSize: 14
            }}
            autoFocus
          />

          {/* Options list - optimized with getItemLayout for better performance */}
          <FlatList
            data={filteredOptions}
            keyExtractor={(item, index) => {
              if (typeof item === 'string') return item;
              return String(item.value || index);
            }}
            renderItem={({ item }) => {
              const text = typeof item === 'string' ? item : (item && typeof item === 'object' && 'label' in item ? String(item.label) : String(item));
              const itemValue = typeof item === 'string' ? item : (item && typeof item === 'object' && 'value' in item ? item.value : item);
              const isSelected = itemValue === value;

              return (
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  activeOpacity={0.7}
                  style={{
                    padding: 12,
                    borderBottomWidth: 1,
                    borderBottomColor: '#F5F5F5',
                    backgroundColor: isSelected ? '#E3F2FD' : 'transparent'
                  }}
                >
                  <Text style={{
                    fontSize: 14,
                    color: isSelected ? '#1976D2' : '#333',
                    fontWeight: isSelected ? '600' : '400'
                  }}>
                    {text}
                  </Text>
                </TouchableOpacity>
              );
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            removeClippedSubviews={true}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
            getItemLayout={(data, index) => ({
              length: 45,
              offset: 45 * index,
              index,
            })}
          />
        </View>
      )}
    </View>
  );
});

// Comprehensive inspection checklist matching the user's form
const INSPECTION_SECTIONS = {
  bodyFrame: {
    title: "🚗 Body Frame Accident Checklist",
    items: [
      { id: 'radiator_support', label: 'Radiator Core Support' },
      { id: 'right_strut_tower', label: 'Right Strut Tower Apron' },
      { id: 'left_strut_tower', label: 'Left Strut Tower Apron' },
      { id: 'right_front_rail', label: 'Right Front Rail' },
      { id: 'left_front_rail', label: 'Left Front Rail' },
      { id: 'cowl_panel', label: 'Cowl Panel Firewall' },
      { id: 'right_a_pillar', label: 'Right A Pillar' },
      { id: 'left_a_pillar', label: 'Left A Pillar' },
      { id: 'right_b_pillar', label: 'Right B Pillar' },
      { id: 'left_b_pillar', label: 'Left B Pillar' },
      { id: 'right_c_pillar', label: 'Right C Pillar' },
      { id: 'left_c_pillar', label: 'Left C Pillar' },
      { id: 'boot_floor', label: 'Boot Floor' },
      { id: 'boot_lock_pillar', label: 'Boot Lock Pillar' },
      { id: 'rear_sub_frame', label: 'Rear Sub Frame' },
      { id: 'front_sub_frame', label: 'Front Sub Frame' },
    ]
  },
  engineTransmission: {
    title: "🔧 Engine / Transmission / Clutch",
    items: [
      { id: 'fluids_check', label: 'Fluids/filters check' },
      { id: 'engine_oil_level', label: 'Engine Oil Level' },
      { id: 'engine_oil_leakage', label: 'Engine Oil Leakage' },
      { id: 'transmission_oil_leakage', label: 'Transmission Oil Leakage' },
      { id: 'coolant_leakage', label: 'Coolant Leakage' },
      { id: 'brake_oil_leakage', label: 'Brake Oil Leakage' },
    ]
  },
  mechanicalCheck: {
    title: "🔧 Mechanical Check",
    items: [
      { id: 'belts_fan', label: 'Belts (Fan)' },
      { id: 'wires_harness', label: 'Wires (Wiring Harness)' },
      { id: 'engine_blow', label: 'Engine Blow (Manual Check)' },
      { id: 'engine_noise', label: 'Engine Noise' },
      { id: 'engine_vibration', label: 'Engine Vibration' },
      { id: 'cold_start', label: 'Cold Start' },
      { id: 'engine_mounts', label: 'Engine Mounts' },
      { id: 'pulleys_adjuster', label: 'Pulleys (Adjuster)' },
      { id: 'hoses', label: 'Hoses' },
      { id: 'exhaust_sound', label: 'Exhaust Sound' },
      { id: 'radiator', label: 'Radiator' },
      { id: 'suction_fan', label: 'Suction Fan' },
      { id: 'starter_operation', label: 'Starter Operation' },
    ]
  },
  brakes: {
    title: "🛑 Brakes",
    items: [
      { id: 'front_right_disc', label: 'Front Right Disc' },
      { id: 'front_left_disc', label: 'Front Left Disc' },
      { id: 'front_right_brake_pad', label: 'Front Right Brake Pad' },
      { id: 'front_left_brake_pad', label: 'Front Left Brake Pad' },
      { id: 'parking_brake', label: 'Parking / Hand Brake' },
    ]
  },
  suspensionSteering: {
    title: "🛞 Suspension/Steering",
    items: [
      { id: 'steering_wheel_play', label: 'Steering Wheel Play' },
      { id: 'right_ball_joint', label: 'Right Ball Joint' },
      { id: 'left_ball_joint', label: 'Left Ball Joint' },
      { id: 'right_z_links', label: 'Right Z Links' },
      { id: 'left_z_links', label: 'Left Z Links' },
      { id: 'right_tie_rod_end', label: 'Right Tie Rod End' },
      { id: 'left_tie_rod_end', label: 'Left Tie Rod End' },
      { id: 'front_right_boots', label: 'Front Right Boots' },
      { id: 'front_left_boots', label: 'Front Left Boots' },
      { id: 'front_right_bushes', label: 'Front Right Bushes' },
      { id: 'front_left_bushes', label: 'Front Left Bushes' },
      { id: 'front_right_shock', label: 'Front Right Shock' },
      { id: 'front_left_shock', label: 'Front Left Shock' },
      { id: 'rear_right_bushes', label: 'Rear Right Bushes' },
      { id: 'rear_left_bushes', label: 'Rear Left Bushes' },
      { id: 'rear_right_shock', label: 'Rear Right Shock' },
      { id: 'rear_left_shock', label: 'Rear Left Shock' },
    ]
  },
  interior: {
    title: "🪑 Interior",
    items: [
      { id: 'seats', label: 'Seats' },
      { id: 'dashboard', label: 'Dashboard' },
      { id: 'carpet', label: 'Carpet' },
      { id: 'headliner', label: 'Headliner' },
      { id: 'electronics', label: 'Electronics' },
      { id: 'climate', label: 'Climate' },
      { id: 'steering_wheel_condition', label: 'Steering Wheel Condition' },
      { id: 'steering_wheel_buttons', label: 'Steering Wheel Buttons' },
      { id: 'horn', label: 'Horn' },
      { id: 'lights_lever_switch', label: 'Lights Lever / Switch' },
      { id: 'wiper_washer_lever', label: 'Wiper / Washer Lever' },
      { id: 'right_side_mirror', label: 'Right Side Mirror' },
      { id: 'left_side_mirror', label: 'Left Side Mirror' },
      { id: 'rear_view_mirror_dimmer', label: 'Rear View Mirror Dimmer' },
      { id: 'right_seat_adjuster_recliner', label: 'Right Seat Adjuster Recliner' },
      { id: 'left_seat_adjuster_recliner', label: 'Left Seat Adjuster Recliner' },
      { id: 'right_seat_adjuster_lear_track', label: 'Right Seat Adjuster Lear Track' },
      { id: 'left_seat_adjuster_lear_track', label: 'Left Seat Adjuster Lear Track' },
      { id: 'right_seat_belt', label: 'Right Seat Belt' },
      { id: 'left_seat_belt', label: 'Left Seat Belt' },
      { id: 'rear_seat_belts', label: 'Rear Seat Belts' },
      { id: 'glove_box', label: 'Glove Box' },
      { id: 'front_right_power_window', label: 'Front Right Power Window' },
      { id: 'front_left_power_window', label: 'Front Left Power Window' },
      { id: 'rear_right_power_window', label: 'Rear Right Power Window' },
      { id: 'rear_left_power_window', label: 'Rear Left Power Window' },
      { id: 'window_safety_lock', label: 'Window Safety Lock' },
      { id: 'interior_lightings', label: 'Interior Lightings' },
      { id: 'dash_controls_ac', label: 'Dash Controls - A/C' },
      { id: 'dash_controls_de_fog', label: 'Dash Controls - De-Fog' },
      { id: 'dash_controls_hazard_lights', label: 'Dash Controls - Hazard Lights' },
      { id: 'dash_controls_others', label: 'Dash Controls - Others' },
      { id: 'audio_video', label: 'Audio/Video' },
      { id: 'rear_view_camera', label: 'Rear View Camera' },
      { id: 'trunk_release_lever', label: 'Trunk Release Lever' },
      { id: 'fuel_cap_release_lever', label: 'Fuel Cap Release Lever' },
      { id: 'bonnet_release_lever', label: 'Bonnet Release Lever' },
      { id: 'sun_roof_control_button', label: 'Sun Roof Control Button' },
      { id: 'roof_polish', label: 'Roof Polish' },
      { id: 'floor_mat', label: 'Floor Mat' },
      { id: 'front_right_seat_polish', label: 'Front Right Seat Polish' },
      { id: 'front_left_seat_polish', label: 'Front Left Seat Polish' },
      { id: 'rear_seat_polish', label: 'Rear Seat Polish' },
      { id: 'dashboard_condition', label: 'Dashboard Condition' },
      { id: 'equipment_spare_tire', label: 'Spare Tire' },
      { id: 'equipment_tools', label: 'Tools' },
      { id: 'equipment_jack', label: 'Jack' },
    ]
  },
  acHeater: {
    title: "❄️ AC / Heater",
    items: [
      { id: 'ac_fitted', label: 'AC Fitted' },
      { id: 'ac_operational', label: 'AC Operational' },
      { id: 'blower', label: 'Blower' },
      { id: 'cooling', label: 'Cooling' },
      { id: 'heating', label: 'Heating' },
    ]
  },
  electricalElectronics: {
    title: "⚡ Electrical & Electronics",
    items: [
      { id: 'computer_checkup', label: 'Computer Checkup / Malfunction Check' },
      { id: 'battery_warning_light', label: 'Battery Warning Light' },
      { id: 'oil_pressure_warning_light', label: 'Oil Pressure Low Warning Light' },
      { id: 'temperature_warning_light', label: 'Temperature Warning Light / Gauge' },
      { id: 'air_bag_warning_light', label: 'Air Bag Warning Light' },
      { id: 'power_steering_warning_light', label: 'Power Steering Warning Light' },
      { id: 'abs_warning_light', label: 'ABS Warning Light' },
      { id: 'key_fob_battery_warning', label: 'Key Fob Battery Low Light' },
      { id: 'battery_voltage_terminals', label: 'Battery Voltage Terminals Condition' },
      { id: 'battery_charging', label: 'Charging' },
      { id: 'alternator_operation', label: 'Alternator Operation' },
      { id: 'gauges', label: 'Gauges' },
    ]
  },
  exteriorBody: {
    title: "🚗 Exterior & Body",
    items: [
      { id: 'trunk_lock', label: 'Trunk Lock' },
      { id: 'front_windshield_condition', label: 'Front Windshield Condition' },
      { id: 'rear_windshield_condition', label: 'Rear Windshield Condition' },
      { id: 'front_right_door_window', label: 'Front Right Door Window' },
      { id: 'front_left_door_window', label: 'Front Left Door Window' },
      { id: 'rear_right_door_window', label: 'Rear Right Door Window' },
      { id: 'rear_left_door_window', label: 'Rear Left Door Window' },
      { id: 'windscreen_wiper', label: 'Windscreen Wiper' },
      { id: 'sun_roof_glass', label: 'Sun Roof Glass' },
      { id: 'right_headlight_working', label: 'Right Headlight (Working)' },
      { id: 'left_headlight_working', label: 'Left Headlight (Working)' },
      { id: 'right_headlight_condition', label: 'Right Headlight (Condition)' },
      { id: 'left_headlight_condition', label: 'Left Headlight (Condition)' },
      { id: 'right_taillight_working', label: 'Right Taillight (Working)' },
      { id: 'left_taillight_working', label: 'Left Taillight (Working)' },
      { id: 'right_taillight_condition', label: 'Right Taillight (Condition)' },
      { id: 'left_taillight_condition', label: 'Left Taillight (Condition)' },
      { id: 'fog_lights_working', label: 'Fog Lights (Working)' },
    ]
  },
  tyres: {
    title: "🛞 Tyres",
    items: [
      { id: 'front_right_tyre_brand', label: 'Front Right Tyre Brand' },
      { id: 'front_right_tyre_tread', label: 'Front Right Tyre Remaining Tread' },
      { id: 'front_left_tyre_brand', label: 'Front Left Tyre Brand' },
      { id: 'front_left_tyre_tread', label: 'Front Left Tyre Remaining Tread' },
      { id: 'rear_right_tyre_brand', label: 'Rear Right Tyre Brand' },
      { id: 'rear_right_tyre_tread', label: 'Rear Right Tyre Remaining Tread' },
      { id: 'rear_left_tyre_brand', label: 'Rear Left Tyre Brand' },
      { id: 'rear_left_tyre_tread', label: 'Rear Left Tyre Remaining Tread' },
      { id: 'tyre_size', label: 'Tyre Size' },
      { id: 'rims', label: 'Rims' },
      { id: 'wheel_caps', label: 'Wheel Caps' },
    ]
  },
  testDrive: {
    title: "🚙 Test Drive",
    items: [
      { id: 'engine_pick', label: 'Engine Pick' },
      { id: 'drive_shaft_noise', label: 'Drive Shaft Noise' },
      { id: 'gear_shifting_automatic', label: 'Gear Shifting (Automatic)' },
      { id: 'brake_pedal_operation', label: 'Brake Pedal Operation' },
      { id: 'front_suspension_driving', label: 'Front Suspension (While Driving)' },
      { id: 'rear_suspension_driving', label: 'Rear Suspension (While Driving)' },
      { id: 'steering_operation_driving', label: 'Steering Operation (While Driving)' },
      { id: 'steering_wheel_alignment_driving', label: 'Steering Wheel Alignment (While Driving)' },
      { id: 'heater_operation_driving', label: 'Heater Operation (While Driving)' },
      { id: 'ac_operation_driving', label: 'AC Operation (While Driving)' },
      { id: 'speedometer_driving', label: 'Speedometer (While Driving)' },
      { id: 'test_drive_done_by', label: 'Test Drive Done By' },
    ]
  }
};

// Debounce utility
const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Form state reducer for batching updates
type FormState = {
  ratings: Record<string, RatingValue>;
  itemNotes: Record<string, string>;
  textInputs: Record<string, string>;
  photosMeta: Array<{ url: string; itemId: string; lat?: number; lon?: number; timestamp?: string }>;
  sectionPhotos: Record<string, Array<{ url: string; lat?: number; lon?: number; timestamp?: string }>>;
};

type FormAction =
  | { type: 'SET_RATING'; itemId: string; rating: RatingValue }
  | { type: 'SET_TEXT'; itemId: string; text: string }
  | { type: 'SET_NOTE'; itemId: string; note: string }
  | { type: 'ADD_PHOTO'; photo: { url: string; itemId: string; lat?: number; lon?: number; timestamp?: string } }
  | { type: 'REMOVE_PHOTO'; itemId: string; url: string }
  | { type: 'ADD_SECTION_PHOTO'; sectionKey: string; photo: { url: string; lat?: number; lon?: number; timestamp?: string } }
  | { type: 'REMOVE_SECTION_PHOTO'; sectionKey: string; url: string };

const formReducer = (state: FormState, action: FormAction): FormState => {
  switch (action.type) {
    case 'SET_RATING':
      if (state.ratings[action.itemId] === action.rating) return state;
      return { ...state, ratings: { ...state.ratings, [action.itemId]: action.rating } };
    case 'SET_TEXT':
      if (state.textInputs[action.itemId] === action.text) return state;
      return { ...state, textInputs: { ...state.textInputs, [action.itemId]: action.text } };
    case 'SET_NOTE':
      if (state.itemNotes[action.itemId] === action.note) return state;
      return { ...state, itemNotes: { ...state.itemNotes, [action.itemId]: action.note } };
    case 'ADD_PHOTO':
      return { ...state, photosMeta: [...state.photosMeta, action.photo] };
    case 'REMOVE_PHOTO':
      return { ...state, photosMeta: state.photosMeta.filter(p => !(p.itemId === action.itemId && p.url === action.url)) };
    case 'ADD_SECTION_PHOTO':
      return {
        ...state,
        sectionPhotos: {
          ...state.sectionPhotos,
          [action.sectionKey]: [...(state.sectionPhotos[action.sectionKey] || []), action.photo]
        }
      };
    case 'REMOVE_SECTION_PHOTO':
      return {
        ...state,
        sectionPhotos: {
          ...state.sectionPhotos,
          [action.sectionKey]: (state.sectionPhotos[action.sectionKey] || []).filter(p => p.url !== action.url)
        }
      };
    default:
      return state;
  }
};

const ChecklistScreen = () => {
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<Record<string, any>, string>>();
  const { inspectionId } = route.params || {};

  // Performance optimizations: Use refs for heavy operations
  const uploadQueueRef = useRef<Array<{ itemId: string; promise: Promise<any> }>>([]);
  const lastSaveRef = useRef<number>(0);
  const photosByItemRef = useRef<Record<string, Array<{ url: string }>>>({});
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Form state with reducer for batching updates
  const [formState, dispatch] = useReducer(formReducer, {
    ratings: {},
    itemNotes: {},
    textInputs: {},
    photosMeta: [],
    sectionPhotos: {}
  });

  // Debounced form state for expensive calculations
  const debouncedRatings = useDebounce(formState.ratings, 300);
  const debouncedTextInputs = useDebounce(formState.textInputs, 300);
  const debouncedItemNotes = useDebounce(formState.itemNotes, 300);
  const debouncedPhotosMeta = useDebounce(formState.photosMeta, 500);

  // Other state
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [notes, setNotes] = useState("");
  const [documentsNotes, setDocumentsNotes] = useState("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['bodyFrame']));
  const [uploadingPhotos, setUploadingPhotos] = useState<Set<string>>(new Set());

  // Rating options optimized for performance
  const RATING_OPTIONS = useMemo(() => [
    { label: 'No Damage Found', value: 4 as RatingValue, color: '#28a745', icon: '✅' },
    { label: 'Need Replacement', value: 2 as RatingValue, color: '#ff9800', icon: '⚠️' },
    { label: 'Present', value: 3 as RatingValue, color: '#2196F3', icon: '✅' },
    { label: 'Select Brand', value: 0 as RatingValue, color: '#666', icon: '📝' },
    { label: 'Select Tread', value: 0 as RatingValue, color: '#666', icon: '📏' },
    { label: 'e.g. 195/55/R16', value: 0 as RatingValue, color: '#666', icon: '📏' },
    { label: 'e.g. Alloy', value: 0 as RatingValue, color: '#666', icon: '🔧' },
  ], []);

  const REQUIRED_SECTIONS = ['bodyFrame', 'engineTransmission', 'brakes', 'exterior'];

  // Cache photos by item ID to avoid repeated filtering
  const photosByItem = useMemo(() => {
    const cache: Record<string, Array<{ url: string }>> = {};
    debouncedPhotosMeta.forEach(photo => {
      if (!cache[photo.itemId]) {
        cache[photo.itemId] = [];
      }
      cache[photo.itemId].push({ url: photo.url });
    });
    photosByItemRef.current = cache;
    return cache;
  }, [debouncedPhotosMeta]);

  // Memoized checklist computation - only recalculate when debounced values change
  const checklist = useMemo(() => {
    const detailed: any = {};
    Object.keys(INSPECTION_SECTIONS).forEach((sectionKey) => {
      const section = INSPECTION_SECTIONS[sectionKey as keyof typeof INSPECTION_SECTIONS];
      if (section) {
        const items = section.items.map((it) => ({
          id: it.id,
          label: it.label,
          rating: debouncedRatings[it.id] || 0,
          notes: debouncedItemNotes[it.id] || "",
          textValue: debouncedTextInputs[it.id] || "",
          photos: (photosByItem[it.id] || []).map(p => p.url)
        }));
        detailed[sectionKey] = { weight: (DEFAULT_WEIGHTS as any)[sectionKey] || 0, items };
      }
    });
    return detailed;
  }, [debouncedRatings, debouncedItemNotes, debouncedTextInputs, photosByItem]);

  // Memoize score calculation separately to avoid recalculating on every render
  const score = useMemo(() => computeOverallScore(checklist), [checklist]);

  // Optimized section completion check with memoization - only check when debounced values change
  const sectionCompletionStatus = useMemo(() => {
    const status: Record<string, boolean> = {};
    Object.keys(INSPECTION_SECTIONS).forEach((sectionKey) => {
      const section = INSPECTION_SECTIONS[sectionKey as keyof typeof INSPECTION_SECTIONS];
      if (!section) return;

      const items = section.items;

      // For most sections, check if critical items are rated
      const criticalItems = items.slice(0, Math.min(5, items.length)); // Check first 5 items as critical
      const criticalRated = criticalItems.some(it => (debouncedRatings[it.id] || 0) > 0);

      // Has photos for section - use cached photosByItem
      const hasItemPhoto = items.some(it => photosByItem[it.id] && photosByItem[it.id].length > 0);
      const hasSectionPhoto = (formState.sectionPhotos[sectionKey] || []).length > 0;
      const hasPhoto = hasItemPhoto || hasSectionPhoto;

      // Notes required for poor ratings
      const poorNeedsNote = items.every(it =>
        (debouncedRatings[it.id] !== 1) || ((debouncedItemNotes[it.id] || '').trim().length > 0)
      );

      status[sectionKey] = criticalRated && hasPhoto && poorNeedsNote;
    });
    return status;
  }, [debouncedRatings, debouncedItemNotes, photosByItem, formState.sectionPhotos]);

  const completedCount = useMemo(() =>
    Object.values(sectionCompletionStatus).filter(Boolean).length,
    [sectionCompletionStatus]
  );

  const totalSections = Object.keys(INSPECTION_SECTIONS).length + 1; // include Documents & History

  // Memoized progress percentage
  const progressPercentage = useMemo(() =>
    Math.round((completedCount / totalSections) * 100),
    [completedCount, totalSections]
  );

  const handleStart = async () => {
    try {
      setStarting(true);
      const res = await startInspection(inspectionId);
      if (!res.success) throw new Error(res.message || "Failed to start");
    } catch (e: any) {
      Alert.alert("Error", e.message || String(e));
    } finally { setStarting(false); }
  };

  // Optimized photo upload with batch processing
  const addPhoto = useCallback(async (itemId: string) => {
    const current = photosByItemRef.current[itemId] || [];
    if (current.length >= 3) {
      Alert.alert('Limit reached', 'Maximum 3 photos allowed for this section.');
      return;
    }

    try {
      setUploadingPhotos(prev => new Set([...prev, itemId]));

      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Camera permission required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7, // Reduced quality for faster upload
        exif: true,
        allowsEditing: false, // Disable editing for speed
      });

      if (result.canceled) return;

      const asset: any = result.assets?.[0];
      const exif: any = asset?.exif || {};
      const lat = exif?.GPSLatitude || exif?.gpsLatitude;
      const lon = exif?.GPSLongitude || exif?.gpsLongitude;
      const ts = exif?.DateTimeOriginal || exif?.dateTimeOriginal;

      // Create upload promise but don't await immediately
      const uploadPromise = uploadInspectionPhoto({
        inspectionId,
        localUri: asset.uri,
        filename: `photo_${Date.now()}.jpg`,
        contentType: "image/jpeg",
        itemId,
        lat,
        lon,
        timestamp: ts ? new Date(ts).toISOString() : undefined,
      });

      // Add to upload queue
      uploadQueueRef.current.push({ itemId, promise: uploadPromise });

      // Process upload asynchronously
      uploadPromise.then(upload => {
        dispatch({
          type: 'ADD_PHOTO',
          photo: {
            url: upload.url,
            itemId,
            lat,
            lon,
            timestamp: ts ? new Date(ts).toISOString() : undefined
          }
        });

        // Remove from uploading state
        setUploadingPhotos(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });

        // Auto-advance logic (optimized) - defer to avoid blocking
        InteractionManager.runAfterInteractions(() => {
          const sectionKey = Object.keys(INSPECTION_SECTIONS).find(key =>
            INSPECTION_SECTIONS[key as keyof typeof INSPECTION_SECTIONS].items.some(it => it.id === itemId)
          );

          if (sectionKey && sectionCompletionStatus[sectionKey]) {
            const keys = Object.keys(INSPECTION_SECTIONS);
            const nextIdx = keys.indexOf(sectionKey) + 1;
            const nextSection = keys.slice(nextIdx).find(k => !sectionCompletionStatus[k]);
            if (nextSection) {
              setExpandedSections(prev => new Set([...prev, nextSection]));
            }
          }
        });
      }).catch(e => {
        setUploadingPhotos(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
        Alert.alert('Upload failed', e.message || String(e));
      });

    } catch (e: any) {
      setUploadingPhotos(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
      Alert.alert('Error', e.message || String(e));
    }
  }, [formState.photosMeta, sectionCompletionStatus, inspectionId]);

  // Optimized section photo upload
  const addSectionPhoto = useCallback(async (sectionKey: string) => {
    const list = formState.sectionPhotos[sectionKey] || [];
    if (list.length >= 3) {
      Alert.alert('Limit reached', 'Maximum 3 photos allowed for this section.');
      return;
    }

    try {
      setUploadingPhotos(prev => new Set([...prev, `${sectionKey}_section`]));

      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') {
        Alert.alert('Camera permission required');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        quality: 0.7,
        exif: true,
        allowsEditing: false,
      });

      if (result.canceled) return;

      const asset: any = result.assets?.[0];
      const exif: any = asset?.exif || {};
      const lat = exif?.GPSLatitude || exif?.gpsLatitude;
      const lon = exif?.GPSLongitude || exif?.gpsLongitude;
      const ts = exif?.DateTimeOriginal || exif?.dateTimeOriginal;

      const upload = await uploadInspectionPhoto({
        inspectionId,
        localUri: asset.uri,
        filename: `section_${sectionKey}_${Date.now()}.jpg`,
        contentType: 'image/jpeg',
        sectionId: sectionKey,
        lat,
        lon,
        timestamp: ts ? new Date(ts).toISOString() : undefined,
      });

      dispatch({
        type: 'ADD_SECTION_PHOTO',
        sectionKey,
        photo: {
          url: upload.url,
          lat,
          lon,
          timestamp: ts ? new Date(ts).toISOString() : undefined
        }
      });

      setUploadingPhotos(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${sectionKey}_section`);
        return newSet;
      });

    } catch (e: any) {
      setUploadingPhotos(prev => {
        const newSet = new Set(prev);
        newSet.delete(`${sectionKey}_section`);
        return newSet;
      });
      Alert.alert('Upload failed', e.message || String(e));
    }
  }, [formState.sectionPhotos, inspectionId, sectionCompletionStatus]);

  // Optimized rating handler - immediate update for UI responsiveness
  const handleRatingChange = useCallback((itemId: string, rating: RatingValue) => {
    // Dispatch immediately for instant UI feedback
    dispatch({ type: 'SET_RATING', itemId, rating });
  }, []);

  // Optimized text input handler - immediate update for UI responsiveness
  const handleTextChange = useCallback((itemId: string, text: string) => {
    // Dispatch immediately for instant UI feedback
    if (itemId.includes('brand') || itemId.includes('tread') || itemId.includes('size') || itemId.includes('rims')) {
      dispatch({ type: 'SET_TEXT', itemId, text });
    } else {
      dispatch({ type: 'SET_NOTE', itemId, note: text });
    }
  }, []);

  // Toggle section expansion
  const toggleSection = useCallback((sectionKey: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionKey)) {
        newSet.delete(sectionKey);
      } else {
        newSet.add(sectionKey);
      }
      return newSet;
    });
  }, []);

  const removePhoto = useCallback((itemId: string, url: string) => {
    dispatch({ type: 'REMOVE_PHOTO', itemId, url });
  }, []);

  const removeSectionPhoto = useCallback((sectionKey: string, url: string) => {
    dispatch({ type: 'REMOVE_SECTION_PHOTO', sectionKey, url });
  }, []);

  const handleSubmit = async () => {
    if (submitting) return; // Prevent double submission
    
    try {
      setSubmitting(true);
      
      // Validate: at least 1 photo per category and notes required for Poor
      // Use debounced values for validation to ensure consistency
      for (const sectionKey of Object.keys(INSPECTION_SECTIONS)) {
        const section = INSPECTION_SECTIONS[sectionKey as keyof typeof INSPECTION_SECTIONS];
        if (!section) continue;

        const catItems = section.items;
        const hasPhoto = catItems.some(it => photosByItemRef.current[it.id] && photosByItemRef.current[it.id].length > 0);
        if (!hasPhoto) {
          Alert.alert('Photos required', `Please add at least 1 photo for ${section.title}.`);
          setSubmitting(false);
          return;
        }
        for (const it of catItems) {
          if (debouncedRatings[it.id] === 1 && !(debouncedItemNotes[it.id] || '').trim()) {
            Alert.alert('Note required', `Add a note for "${it.label}" rated Poor.`);
            setSubmitting(false);
            return;
          }
        }
      }
      
      // Prepare body in background to avoid blocking UI
      await InteractionManager.runAfterInteractions();

      // Prepare body efficiently
      const body = {
        inspectionId,
        checklist,
        photosMeta: debouncedPhotosMeta,
        signatureUrl: null,
        notes,
        documentsNotes,
        overallScore: score.overallScore,
        overallRating: score.verdict,
        verdict: score.verdict,
        summary: `Overall inspection completed with ${score.overallScore}% score. ${score.verdict} condition.`,
        overallResult: score.overallScore >= 50 ? 'Passed' : 'Failed'
      } as any;
      
      // Use the backend API directly with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
      
      const response = await fetch(`${API_URL}/submit_inspection_report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      let res = await response.json();
      // Fallback: if server insists on inspector id, retry with derived value
      if (!res.success && (res.message || '').toLowerCase().includes('inspector')) {
        try {
          const Async = (await import("@react-native-async-storage/async-storage")).default;
          const inspectorRaw = await Async.getItem('inspector');
          const userRaw = await Async.getItem('user');
          const inspector = inspectorRaw ? JSON.parse(inspectorRaw) : null;
          const user = userRaw ? JSON.parse(userRaw) : null;
          const inspectorId = inspector?.inspectorId || inspector?.inspector_id || inspector?._id || user?.inspectorId || user?.inspector_id;
          if (inspectorId) {
            res = await submitInspection(inspectionId, { ...body, inspectorId });
          }
        } catch {}
      }
      if (!res.success) throw new Error(res.message || 'Submit failed');
      Alert.alert('Submitted', 'Inspection report submitted successfully!', [
        { text: 'View Report', onPress: () => navigation.navigate('InspectionReportView', { inspectionId }) },
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (e: any) {
      Alert.alert('Error', e.message || String(e));
    } finally {
      setSubmitting(false);
    }
  };

  // Memoized item component to prevent unnecessary re-renders
  const InspectionItem = React.memo(({ 
    item, 
    currentRating, 
    currentText, 
    itemPhotos, 
    isItemUploading,
    onRatingChange,
    onTextChange,
    onAddPhoto,
    onRemovePhoto
  }: {
    item: { id: string; label: string };
    currentRating: RatingValue;
    currentText: string;
    itemPhotos: Array<{ url: string }>;
    isItemUploading: boolean;
    onRatingChange: (itemId: string, rating: RatingValue) => void;
    onTextChange: (itemId: string, text: string) => void;
    onAddPhoto: (itemId: string) => void;
    onRemovePhoto: (itemId: string, url: string) => void;
  }) => {
    return (
      <View style={{ marginBottom:16, padding: 12, backgroundColor: '#FAFAFA', borderRadius: 8 }}>
        <Text style={{ fontWeight:'600', marginBottom: 8, fontSize: 14 }}>{item.label}</Text>

        {/* Rating buttons - optimized layout */}
        <View style={{ flexDirection:'row', flexWrap: 'wrap', marginBottom: 8 }}>
          {RATING_OPTIONS.slice(0, 3).map((opt) => (
            <TouchableOpacity
              key={opt.label}
              onPress={() => onRatingChange(item.id, opt.value)}
              style={{
                paddingHorizontal:8,
                paddingVertical:6,
                borderWidth:1,
                borderColor: currentRating === opt.value ? opt.color : '#CCC',
                borderRadius:16,
                marginRight:6,
                marginBottom: 4,
                flexDirection:'row',
                alignItems:'center',
                backgroundColor: currentRating === opt.value ? `${opt.color}20` : 'transparent',
                minWidth: 80
              }}
            >
              <Text style={{ marginRight:4, fontSize: 12 }}>{opt.icon}</Text>
              <Text style={{
                color: currentRating === opt.value ? opt.color : '#333',
                fontWeight:'600',
                fontSize: 12
              }}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Fast dropdown for specific fields */}
        {item.id.includes('brand') && (
          <FastDropdown
            options={TYRE_BRANDS}
            placeholder="Select Brand"
            value={currentText}
            onValueChange={(value) => onTextChange(item.id, value)}
          />
        )}

        {item.id.includes('tread') && (
          <FastDropdown
            options={TYRE_TREAD_LEVELS}
            placeholder="Select Tread"
            value={currentText}
            onValueChange={(value) => onTextChange(item.id, value)}
          />
        )}

        {item.id.includes('size') && (
          <FastDropdown
            options={TYRE_SIZES}
            placeholder="e.g. 195/55/R16"
            value={currentText}
            onValueChange={(value) => onTextChange(item.id, value)}
          />
        )}

        {item.id.includes('rims') && (
          <FastDropdown
            options={RIM_TYPES}
            placeholder="e.g. Alloy"
            value={currentText}
            onValueChange={(value) => onTextChange(item.id, value)}
          />
        )}

        {item.id.includes('wheel_caps') && (
          <FastDropdown
            options={STATUS_OPTIONS}
            placeholder="Present"
            value={currentRating}
            onValueChange={(value) => onRatingChange(item.id, value)}
          />
        )}

        {/* Notes input */}
        <TextInput
          placeholder="Notes (optional)"
          value={currentText}
          onChangeText={(text) => onTextChange(item.id, text)}
          multiline
          numberOfLines={2}
          style={{
            borderWidth:1,
            borderColor:'#DDD',
            borderRadius:6,
            padding:10,
            fontSize: 14,
            backgroundColor: '#FFF',
            minHeight: 60
          }}
        />

        {/* Photo upload */}
        <TouchableOpacity
          onPress={() => onAddPhoto(item.id)}
          disabled={isItemUploading}
          style={{
            marginTop:8,
            alignSelf:'flex-start',
            paddingHorizontal:12,
            paddingVertical:8,
            borderWidth:1,
            borderColor: isItemUploading ? '#CCC' : '#28a745',
            borderRadius:6,
            backgroundColor: isItemUploading ? '#F5F5F5' : 'transparent'
          }}
        >
          <Text style={{ color: isItemUploading ? '#999' : '#28a745', fontSize: 12 }}>
            📷 Add Photo ({itemPhotos.length}/3) {isItemUploading ? '...' : ''}
          </Text>
        </TouchableOpacity>

        {/* Photo thumbnails */}
        {itemPhotos.length > 0 && (
          <View style={{ flexDirection:'row', marginTop:8, flexWrap: 'wrap' }}>
            {itemPhotos.slice(0,3).map(p => (
              <TouchableOpacity
                key={p.url}
                onLongPress={() => onRemovePhoto(item.id, p.url)}
                style={{ marginRight: 6, marginBottom: 6 }}
              >
                <Image source={{ uri: p.url }} style={{ width:48, height:48, borderRadius:4 }} />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  }, (prevProps, nextProps) => {
    // Custom comparison to prevent unnecessary re-renders
    return (
      prevProps.item.id === nextProps.item.id &&
      prevProps.currentRating === nextProps.currentRating &&
      prevProps.currentText === nextProps.currentText &&
      prevProps.itemPhotos.length === nextProps.itemPhotos.length &&
      prevProps.isItemUploading === nextProps.isItemUploading
    );
  });

  // Optimized section renderer
  const renderSection = useCallback(({ item: sectionKey }: { item: string }) => {
    const section = INSPECTION_SECTIONS[sectionKey as keyof typeof INSPECTION_SECTIONS];
    if (!section) return null;
    const isExpanded = expandedSections.has(sectionKey);
    const isCompleted = sectionCompletionStatus[sectionKey];
    const isUploading = uploadingPhotos.has(`${sectionKey}_section`);

    return (
      <View style={{ marginTop:16, borderTopWidth:1, borderTopColor:'#EEE', paddingTop:10 }}>
        <TouchableOpacity
          onPress={() => toggleSection(sectionKey)}
          style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}
        >
          <View style={{ flex: 1 }}>
            <Text style={{ fontWeight:'700', marginBottom:4, fontSize: 16 }}>{section.title}</Text>
            <Text style={{ fontSize: 12, color: '#666' }}>{section.items.length} items</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isUploading && <ActivityIndicator size="small" color="#28a745" style={{ marginRight: 8 }} />}
            <Text style={{ color: isCompleted ? '#28a745' : '#999', fontSize: 18 }}>
              {isCompleted ? '✅' : (isExpanded ? '▼' : '▶️')}
            </Text>
          </View>
        </TouchableOpacity>

        {isExpanded && (
          <>
            {/* Section-level photos */}
            <View style={{ marginBottom:12, marginTop: 12 }}>
              <TouchableOpacity
                onPress={() => addSectionPhoto(sectionKey)}
                disabled={isUploading}
                style={{
                  alignSelf:'flex-start',
                  paddingHorizontal:12,
                  paddingVertical:8,
                  borderWidth:1,
                  borderColor: isUploading ? '#CCC' : '#28a745',
                  borderRadius:6,
                  backgroundColor: isUploading ? '#F5F5F5' : 'transparent'
                }}
              >
                <Text style={{ color: isUploading ? '#999' : '#28a745' }}>
                  📷 Add Section Photo ({(formState.sectionPhotos[sectionKey]||[]).length}/3)
                </Text>
              </TouchableOpacity>
              <View style={{ flexDirection:'row', marginTop:8, flexWrap: 'wrap' }}>
                {(formState.sectionPhotos[sectionKey] || []).slice(0,3).map(p => (
                  <TouchableOpacity
                    key={p.url}
                    onLongPress={() => removeSectionPhoto(sectionKey, p.url)}
                    style={{ marginRight: 6, marginBottom: 6 }}
                  >
                    <Image source={{ uri: p.url }} style={{ width:56, height:56, borderRadius:6 }} />
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Items in this section - using memoized component */}
            {section.items.map((item, itemIndex) => {
              // Ensure item.id is converted to string for key
              const getItemKey = () => {
                try {
                  if (item.id) {
                    if (typeof item.id === 'string') return item.id;
                    if (typeof item.id === 'number') return `item-${item.id}`;
                    if (typeof item.id === 'object') {
                      if (item.id.toString) return String(item.id.toString());
                      if (item.id.$oid) return String(item.id.$oid);
                    }
                  }
                  return `item-${itemIndex}`;
                } catch (error) {
                  return `item-${itemIndex}-${Date.now()}`;
                }
              };
              
              const itemKey = getItemKey();
              const isItemUploading = uploadingPhotos.has(itemKey);
              const currentRating = formState.ratings[itemKey] || 0;
              const currentText = formState.textInputs[itemKey] || formState.itemNotes[itemKey] || '';
              const itemPhotos = photosByItemRef.current[itemKey] || [];

              return (
                <InspectionItem
                  key={itemKey}
                  item={item}
                  currentRating={currentRating}
                  currentText={currentText}
                  itemPhotos={itemPhotos}
                  isItemUploading={isItemUploading}
                  onRatingChange={handleRatingChange}
                  onTextChange={handleTextChange}
                  onAddPhoto={addPhoto}
                  onRemovePhoto={removePhoto}
                />
              );
            })}
          </>
        )}
      </View>
    );
  }, [expandedSections, sectionCompletionStatus, uploadingPhotos, formState, photosByItemRef, progressPercentage, handleRatingChange, handleTextChange, addPhoto, addSectionPhoto, toggleSection, removePhoto, removeSectionPhoto]);

  return (
    <View style={{ flex: 1, backgroundColor: '#FFF' }}>
      {/* Header */}
      <View style={{ padding:16, backgroundColor: '#F8F9FA', borderBottomWidth: 1, borderBottomColor: '#E9ECEF' }}>
        <Text style={{ fontSize:18, fontWeight:'700', marginBottom: 8 }}>Car Inspection Report</Text>
        <Text style={{ fontSize:14, color: '#666', marginBottom: 12 }}>AutoFinder • For Help: 042-111-943-357</Text>

        <TouchableOpacity
          onPress={handleStart}
          style={{
            alignSelf:'flex-start',
            paddingVertical:8,
            paddingHorizontal:12,
            borderWidth:1,
            borderColor:'#007bff',
            borderRadius:6,
            backgroundColor: starting ? '#E9ECEF' : 'transparent'
          }}
        >
          {starting ? (
            <ActivityIndicator size="small" color="#007bff" />
          ) : (
            <Text style={{ color:'#007bff', fontWeight: '600' }}>🚀 Start Inspection</Text>
          )}
        </TouchableOpacity>

        <View style={{ marginTop:12 }}>
          <Text style={{ fontWeight:'600', marginBottom: 4 }}>
            Overall: {score.overallScore}% ({score.verdict})
          </Text>
          <Text style={{ color:'#666', marginBottom:8 }}>Progress: {completedCount}/{totalSections} sections</Text>
          <View style={{ height:8, backgroundColor:'#EEE', borderRadius:4 }}>
            <View style={{
              width: `${progressPercentage}%`,
              height:8,
              backgroundColor: progressPercentage > 80 ? '#28a745' : progressPercentage > 50 ? '#ffc107' : '#dc3545',
              borderRadius:4
            }} />
          </View>
        </View>
      </View>

      {/* Main content with FlatList for performance */}
      <FlatList
        data={Object.keys(INSPECTION_SECTIONS)}
        keyExtractor={(item) => item}
        renderItem={renderSection}
        contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        initialNumToRender={3}
        maxToRenderPerBatch={2}
        windowSize={5}
        removeClippedSubviews={true}
        ListFooterComponent={() => (
          <>
            {/* Documents & History */}
            <View style={{ marginTop:16, borderTopWidth:1, borderTopColor:'#EEE', paddingTop:10 }}>
              <TouchableOpacity
                onPress={() => toggleSection('documents')}
                style={{ flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}
              >
                <Text style={{ fontWeight:'700', marginBottom:8 }}>📄 Documents & History</Text>
                <Text style={{ color: documentsNotes.trim().length > 0 ? '#28a745' : '#999' }}>
                  {expandedSections.has('documents') ? '▼' : '▶️'}
                </Text>
              </TouchableOpacity>
              {expandedSections.has('documents') && (
                <View style={{ marginTop: 12 }}>
                  <TextInput
                    placeholder="Notes (registration, service records, invoices)"
                    value={documentsNotes}
                    onChangeText={setDocumentsNotes}
                    multiline
                    style={{
                      borderWidth:1,
                      borderColor:'#DDD',
                      borderRadius:6,
                      padding:12,
                      minHeight:80,
                      fontSize: 14,
                      backgroundColor: '#FFF'
                    }}
                  />
                </View>
              )}
            </View>

            {/* Inspector Notes */}
            <View style={{ marginTop:16 }}>
              <Text style={{ fontWeight:'700', marginBottom:8 }}>📝 Inspector Notes</Text>
              <TextInput
                placeholder="Overall inspection notes"
                value={notes}
                onChangeText={setNotes}
                multiline
                style={{
                  borderWidth:1,
                  borderColor:'#DDD',
                  borderRadius:6,
                  padding:12,
                  minHeight:80,
                  fontSize: 14,
                  backgroundColor: '#FFF'
                }}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              onPress={handleSubmit}
              disabled={submitting}
              style={{
                marginTop:24,
                marginBottom: 40,
                backgroundColor: submitting ? '#6c757d' : '#007bff',
                padding:16,
                borderRadius:8,
                alignItems:'center',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                opacity: submitting ? 0.7 : 1
              }}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={{ color:'#FFF', fontWeight:'700', fontSize: 16 }}>✅ Submit Inspection Report</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      />
    </View>
  );
};

export default ChecklistScreen;


