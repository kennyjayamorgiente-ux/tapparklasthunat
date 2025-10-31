import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Dimensions,
  TextInput,
  Image,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import SharedHeader from '../../components/SharedHeader';
import ApiService from '../../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive calculations
// Enhanced responsive calculations
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414 && screenWidth < 768;
const isTablet = screenWidth >= 768 && screenWidth < 1024;
const isLargeTablet = screenWidth >= 1024;

const getResponsiveFontSize = (baseSize: number) => {
  if (isSmallScreen) return baseSize * 0.85;
  if (isMediumScreen) return baseSize * 0.95;
  if (isLargeScreen) return baseSize;
  if (isTablet) return baseSize * 1.1;
  if (isLargeTablet) return baseSize * 1.2;
  return baseSize;
};

const getResponsiveSize = (baseSize: number) => {
  if (isSmallScreen) return baseSize * 0.8;
  if (isMediumScreen) return baseSize * 0.9;
  if (isLargeScreen) return baseSize;
  if (isTablet) return baseSize * 1.05;
  if (isLargeTablet) return baseSize * 1.1;
  return baseSize;
};

const getResponsivePadding = (basePadding: number) => {
  if (isSmallScreen) return basePadding * 0.8;
  if (isMediumScreen) return basePadding * 0.9;
  if (isLargeScreen) return basePadding;
  if (isTablet) return basePadding * 1.1;
  if (isLargeTablet) return basePadding * 1.2;
  return basePadding;
};

const getResponsiveMargin = (baseMargin: number) => {
  if (isSmallScreen) return baseMargin * 0.8;
  if (isMediumScreen) return baseMargin * 0.9;
  if (isLargeScreen) return baseMargin;
  if (isTablet) return baseMargin * 1.1;
  if (isLargeTablet) return baseMargin * 1.2;
  return baseMargin;
};

// Circle Glow SVG - Using the same as SignupScreen
const circleGlowSvg = `<svg width="280" height="288" viewBox="0 0 280 288" fill="none" xmlns="http://www.w3.org/2000/svg">
<ellipse cx="139.916" cy="143.704" rx="141.161" ry="137.3" transform="rotate(88.9284 139.916 143.704)" fill="url(#paint0_radial_1317_2440)"/>
<ellipse cx="139.487" cy="143.712" rx="105.12" ry="102.546" transform="rotate(88.9284 139.487 143.712)" fill="url(#paint1_radial_1317_2440)"/>
<ellipse cx="139.916" cy="143.704" rx="70.7952" ry="68.6498" transform="rotate(88.9284 139.916 143.704)" fill="url(#paint2_radial_1317_2440)"/>
<defs>
<radialGradient id="paint0_radial_1317_2440" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(139.916 143.704) rotate(90) scale(154.407 158.75)">
<stop offset="0.412604" stop-color="#800000"/>
<stop offset="1" stop-color="#EFEEF6" stop-opacity="0"/>
</radialGradient>
<radialGradient id="paint1_radial_1317_2440" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(139.487 143.712) rotate(90) scale(115.323 118.218)">
<stop stop-color="#800000"/>
<stop offset="1" stop-color="white"/>
</radialGradient>
<radialGradient id="paint2_radial_1317_2440" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(139.916 143.704) rotate(90) scale(77.2037 79.6163)">
<stop stop-color="#800000"/>
<stop offset="1" stop-color="white"/>
</radialGradient>
</defs>
</svg>`;

// Vehicle types based on backend validation
const VEHICLE_TYPES = [
  { value: 'car', label: 'Car' },
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'bicycle', label: 'Bike' },
  { value: 'ebike', label: 'E-bike' },
];

export default function AddVehicleScreen() {
  const [vehicleType, setVehicleType] = useState('');
  const [vehicleColor, setVehicleColor] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [vehicleBrand, setVehicleBrand] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pulseAnim = new Animated.Value(1);

  React.useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const handleGoBack = () => {
    router.back();
  };

  const handleAddVehicle = async () => {
    // Validate required fields
    if (!vehicleType) {
      Alert.alert('Error', 'Please select a vehicle type');
      return;
    }
    
    if (!plateNumber.trim()) {
      Alert.alert('Error', 'Please enter a plate number');
      return;
    }

    try {
      setIsLoading(true);
      
      const vehicleData = {
        plateNumber: plateNumber.trim(),
        vehicleType: vehicleType,
        brand: vehicleBrand.trim() || undefined,
        model: vehicleModel.trim() || undefined,
        color: vehicleColor.trim() || undefined,
      };

      const response = await ApiService.addVehicle(vehicleData);
      
      if (response.success) {
        Alert.alert(
          'Success', 
          'Vehicle added successfully!',
          [
            {
              text: 'OK',
              onPress: () => router.push('/screens/HomeScreen')
            }
          ]
        );
      } else {
        Alert.alert('Error', response.message || 'Failed to add vehicle');
      }
    } catch (error) {
      console.error('Add vehicle error:', error);
      Alert.alert('Error', 'Failed to add vehicle. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVehicleTypeSelect = (type: string) => {
    setVehicleType(type);
    setIsDropdownVisible(false);
  };

  const toggleDropdown = () => {
    setIsDropdownVisible(!isDropdownVisible);
  };


  return (
    <View style={styles.container}>
      <SharedHeader title="Add Vehicle" />

      <View style={styles.content}>
          {/* Top Section - Car with Glowing Circles */}
          <View style={styles.topSection}>
            <Animated.View 
              style={[
                styles.circleContainer,
                {
                  transform: [{ scale: pulseAnim }]
                }
              ]}
            >
              <SvgXml xml={circleGlowSvg} width={250} height={250} />
            </Animated.View>
            
            <View style={styles.carContainer}>
              <Image 
                source={require('../assets/img/car.png')} 
                style={styles.carImage}
                resizeMode="contain"
              />
            </View>
          </View>

          {/* Middle Section - Text */}
          <View style={styles.middleSection}>
            <Text style={styles.welcomeText}>
              ADD YOUR VEHICLE
            </Text>
          </View>

          {/* Input Fields */}
          <View style={styles.inputSection}>
            {/* Vehicle Type Dropdown - FAQ Style */}
            <TouchableOpacity 
              style={styles.dropdownContainer}
              onPress={toggleDropdown}
              activeOpacity={0.7}
            >
              <View style={styles.dropdownHeader}>
                <Text style={[styles.dropdownText, !vehicleType && styles.placeholderText]}>
                  {vehicleType ? VEHICLE_TYPES.find(type => type.value === vehicleType)?.label : "Vehicle Type"}
                </Text>
                <Ionicons 
                  name="chevron-down" 
                  size={20} 
                  color="#800000"
                  style={[
                    styles.chevronIcon,
                    { transform: [{ rotate: isDropdownVisible ? '180deg' : '0deg' }] }
                  ]}
                />
              </View>
              
              {isDropdownVisible && (
                <View style={styles.dropdownContent}>
                  {VEHICLE_TYPES.map((type) => (
                    <TouchableOpacity
                      key={type.value}
                      style={[
                        styles.dropdownItem,
                        vehicleType === type.value && styles.selectedDropdownItem
                      ]}
                      onPress={() => handleVehicleTypeSelect(type.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.dropdownItemText,
                        vehicleType === type.value && styles.selectedDropdownItemText
                      ]}>
                        {type.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </TouchableOpacity>

            <TextInput
              style={styles.inputField}
              placeholder="Vehicle Color:"
              placeholderTextColor="#9CA3AF"
              value={vehicleColor}
              onChangeText={setVehicleColor}
            />

            <TextInput
              style={styles.inputField}
              placeholder="Plate Number:"
              placeholderTextColor="#9CA3AF"
              value={plateNumber}
              onChangeText={setPlateNumber}
            />

            <TextInput
              style={styles.inputField}
              placeholder="Vehicle Brand:"
              placeholderTextColor="#9CA3AF"
              value={vehicleBrand}
              onChangeText={setVehicleBrand}
            />

            <TextInput
              style={styles.inputField}
              placeholder="Vehicle Model:"
              placeholderTextColor="#9CA3AF"
              value={vehicleModel}
              onChangeText={setVehicleModel}
            />
          </View>

          {/* Bottom Section - Buttons */}
          <View style={styles.bottomSection}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={handleGoBack}
                style={styles.goBackButton}
              >
                <Text style={styles.goBackButtonText}>Go Back</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleAddVehicle}
                style={[styles.addButton, isLoading && styles.disabledButton]}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#800000" size="small" />
                ) : (
                  <Text style={styles.addButtonText}>+ Add</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F8F8',
  },
  header: {
    backgroundColor: '#8A0000',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(20),
    paddingVertical: getResponsivePadding(16),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuButton: {
    padding: 4,
    width: isSmallScreen ? 28 : 32,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: isSmallScreen ? 28 : 32,
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: getResponsivePadding(24),
  },
  topSection: {
    flex: 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: screenHeight * 0.1,
  },
  circleContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  carContainer: {
    zIndex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carImage: {
    width: getResponsiveSize(200),
    height: getResponsiveSize(120),
  },
  middleSection: {
    flex: 0.1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: getResponsivePadding(20),
    marginTop: getResponsiveSize(20),
    paddingHorizontal: getResponsivePadding(20),
  },
  welcomeText: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: '700',
    color: '#1F2937',
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(30),
    paddingHorizontal: getResponsivePadding(10),
    flexWrap: 'wrap',
  },
  inputSection: {
    flex: 0.4,
    justifyContent: 'flex-start',
    paddingHorizontal: getResponsivePadding(20),
    paddingTop: getResponsivePadding(20),
    marginTop: getResponsiveSize(10),
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#800000',
    borderRadius: 8,
    marginBottom: getResponsiveSize(12),
    overflow: 'hidden',
  },
  dropdownHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(12),
    minHeight: isSmallScreen ? 40 : 48,
  },
  dropdownText: {
    fontSize: getResponsiveFontSize(16),
    color: '#1F2937',
    flex: 1,
  },
  placeholderText: {
    color: '#9CA3AF',
  },
  chevronIcon: {
    marginLeft: getResponsivePadding(8),
  },
  dropdownContent: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  inputField: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#800000',
    borderRadius: 8,
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(12),
    fontSize: getResponsiveFontSize(16),
    marginBottom: getResponsiveSize(12),
    color: '#1F2937',
    minHeight: isSmallScreen ? 40 : 48,
  },
  bottomSection: {
    flex: 0.15,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: getResponsivePadding(5),
    paddingTop: getResponsivePadding(20),
    marginTop: getResponsiveSize(10),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: getResponsiveSize(16),
  },
  goBackButton: {
    flex: 1,
    backgroundColor: '#E5E7EB',
    borderRadius: getResponsiveSize(8),
    paddingVertical: getResponsivePadding(16),
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: getResponsiveSize(48),
  },
  goBackButtonText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: '600',
    color: '#374151',
  },
  addButton: {
    flex: 1,
    backgroundColor: '#800000',
    borderRadius: getResponsiveSize(8),
    paddingVertical: getResponsivePadding(16),
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: getResponsiveSize(48),
  },
  addButtonText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.6,
  },
  dropdownItem: {
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(12),
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FAFAFA',
  },
  selectedDropdownItem: {
    backgroundColor: '#FEF2F2',
  },
  dropdownItemText: {
    fontSize: getResponsiveFontSize(16),
    color: '#1F2937',
    fontWeight: '500',
  },
  selectedDropdownItemText: {
    color: '#800000',
    fontWeight: '600',
  },
});
