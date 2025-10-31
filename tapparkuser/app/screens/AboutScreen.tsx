import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { writeMaroonIconSvg } from '../assets/icons/index2';
import SharedHeader from '../../components/SharedHeader';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function AboutScreen() {
  const handleAddVehicle = () => {
    // Navigate to add vehicle screen
    router.push('/screens/AddVehicleScreen');
  };

  const handleSkipForNow = () => {
    // Allow users to skip and go to HomeScreen
    router.push('/screens/HomeScreen');
  };

  return (
    <View style={styles.container}>
      <SharedHeader title="About" />

      {/* Main Content */}
      <View style={styles.mainContent}>
        {/* Title Section */}
        <View style={styles.titleSection}>
          <Text style={styles.mainTitle}>PARKING</Text>
          <Text style={styles.subTitle}>made easy!</Text>
        </View>

        {/* About App Card */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>About App</Text>
          <Text style={styles.aboutText}>
            TapPark is an innovative parking reservation system designed specifically for Foundation University. 
            Our app revolutionizes the way students, faculty, and visitors find and reserve parking spaces on campus.
          </Text>
          <Text style={styles.aboutText}>
            With real-time QR code scanning and IoT sensors to show available parking spots instantly, 
            users can reserve parking in advance, reducing congestion and delays. This creates a more 
            organized and efficient parking experience for everyone on campus.
          </Text>
        </View>
      </View>

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.addVehicleButton} onPress={handleAddVehicle}>
          <SvgXml xml={writeMaroonIconSvg} width={20} height={19} style={styles.buttonIcon} />
          <Text style={styles.buttonText}>Add Vehicle</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.skipButton} onPress={handleSkipForNow}>
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
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
  mainContent: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(20),
    paddingTop: getResponsivePadding(30),
  },
  titleSection: {
    marginBottom: getResponsiveMargin(30),
  },
  mainTitle: {
    fontSize: getResponsiveFontSize(36),
    fontWeight: 'bold',
    color: '#8A0000',
    lineHeight: getResponsiveFontSize(42),
  },
  subTitle: {
    fontSize: getResponsiveFontSize(28),
    fontWeight: 'bold',
    color: '#000000',
    lineHeight: getResponsiveFontSize(34),
  },
  aboutCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: getResponsivePadding(32),
    elevation: 8,
    shadowColor: '#8A0000',
    shadowOffset: {
      width: 4,
      height: 6,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    marginBottom: getResponsiveMargin(20),
    maxWidth: screenWidth - getResponsivePadding(40), // Ensure card doesn't exceed screen width
    minHeight: isSmallScreen ? 300 : 350, // Add minimum height for better container size
  },
  aboutTitle: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(20),
  },
  aboutText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#374151',
    lineHeight: getResponsiveFontSize(28),
    marginBottom: getResponsiveMargin(20),
    flexWrap: 'wrap',
  },
  buttonContainer: {
    paddingHorizontal: getResponsivePadding(20),
    paddingBottom: getResponsivePadding(30),
  },
  addVehicleButton: {
    backgroundColor: '#8A0000',
    borderRadius: 12,
    paddingVertical: getResponsivePadding(16),
    paddingHorizontal: getResponsivePadding(24),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#8A0000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    minHeight: isSmallScreen ? 48 : 56, // Ensure button is always tappable
  },
  buttonIcon: {
    marginRight: getResponsiveMargin(12),
    fontSize: isSmallScreen ? 20 : 24,
  },
  buttonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
  },
  skipButton: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(24),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveMargin(12),
    borderWidth: 1,
    borderColor: '#8A0000',
  },
  skipButtonText: {
    color: '#8A0000',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
  },
});
