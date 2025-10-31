import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Easing,
} from 'react-native';
import { router } from 'expo-router';
import { SvgXml } from 'react-native-svg';
import {
  whiteHomeIconSvg,
  maroonProfileIconSvg,
  maroonFavIconSvg,
  maroonLocationIconSvg,
  profitIconSvg,
  blackLightIconSvg,
  blackDarkIconSvg,
} from '../app/assets/icons/index2';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive calculations
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414;

const getResponsiveFontSize = (baseSize: number) => {
  if (isSmallScreen) return baseSize * 0.85;
  if (isMediumScreen) return baseSize * 0.95;
  return baseSize;
};

const getResponsiveSize = (baseSize: number) => {
  if (isSmallScreen) return baseSize * 0.8;
  if (isMediumScreen) return baseSize * 0.9;
  return baseSize;
};

const getResponsivePadding = (basePadding: number) => {
  if (isSmallScreen) return basePadding * 0.8;
  if (isMediumScreen) return basePadding * 0.9;
  return basePadding;
};

const getResponsiveMargin = (baseMargin: number) => {
  if (isSmallScreen) return baseMargin * 0.8;
  if (isMediumScreen) return baseMargin * 0.9;
  return baseMargin;
};

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  currentScreen?: string;
}

export default function Sidebar({ visible, onClose, currentScreen = 'Home' }: SidebarProps) {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const slideAnim = useRef(new Animated.Value(-screenWidth)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.back(1.1)),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -screenWidth,
          duration: 250,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleNavigation = (screen: string) => {
    onClose();
    switch (screen) {
      case 'Home':
        router.push('/screens/HomeScreen');
        break;
      case 'Profile':
        // router.push('/screens/ProfileScreen');
        console.log('Navigate to Profile');
        break;
      case 'Favorites':
        // router.push('/screens/FavoritesScreen');
        console.log('Navigate to Favorites');
        break;
      case 'Active Parking':
        // router.push('/screens/ActiveParkingScreen');
        console.log('Navigate to Active Parking');
        break;
      case 'History':
        // router.push('/screens/HistoryScreen');
        console.log('Navigate to History');
        break;
    }
  };

  const handleSignOut = () => {
    onClose();
    // Add sign out logic here
    console.log('Sign out');
    router.push('/screens/LoginScreen');
  };

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    // Add theme toggle logic here
    console.log('Toggle theme to:', isDarkMode ? 'light' : 'dark');
  };

  const menuItems = [
    { id: 'Home', icon: whiteHomeIconSvg, text: 'Home' },
    { id: 'Profile', icon: maroonProfileIconSvg, text: 'Profile' },
    { id: 'Favorites', icon: maroonFavIconSvg, text: 'Favorites' },
    { id: 'Active Parking', icon: maroonLocationIconSvg, text: 'Active Parking' },
    { id: 'History', icon: profitIconSvg, text: 'History' },
  ];

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: overlayOpacity }
        ]}
      >
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.sidebar,
          { transform: [{ translateX: slideAnim }] }
        ]}
      >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>TapPark</Text>
          </View>

          {/* Navigation Items */}
          <View style={styles.menuContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  currentScreen === item.id && styles.activeMenuItem,
                ]}
                onPress={() => handleNavigation(item.id)}
              >
                <SvgXml 
                  xml={item.icon} 
                  width={getResponsiveSize(24)} 
                  height={getResponsiveSize(24)} 
                />
                <Text
                  style={[
                    styles.menuText,
                    currentScreen === item.id && styles.activeMenuText,
                  ]}
                >
                  {item.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Theme Toggle */}
          <View style={styles.themeToggleContainer}>
            <TouchableOpacity style={styles.themeToggle} onPress={toggleTheme}>
              <View style={[styles.themeToggleTrack, isDarkMode && styles.themeToggleTrackDark]}>
                <View style={[styles.themeToggleThumb, isDarkMode && styles.themeToggleThumbDark]}>
                  <SvgXml 
                    xml={isDarkMode ? blackDarkIconSvg : blackLightIconSvg} 
                    width={getResponsiveSize(16)} 
                    height={getResponsiveSize(16)} 
                  />
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <SvgXml 
              xml={maroonProfileIconSvg} 
              width={getResponsiveSize(24)} 
              height={getResponsiveSize(24)} 
            />
            <Text style={styles.signOutText}>Log Out</Text>
          </TouchableOpacity>
        </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  overlayTouchable: {
    flex: 1,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: screenWidth * 0.8,
    maxWidth: 300,
    height: '100%',
    backgroundColor: 'white',
    paddingTop: getResponsivePadding(50),
    shadowColor: '#000',
    shadowOffset: {
      width: 4,
      height: 0,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    backgroundColor: '#8A0000',
    paddingHorizontal: getResponsivePadding(20),
    paddingVertical: getResponsivePadding(16),
    marginBottom: getResponsiveMargin(20),
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  headerTitle: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  menuContainer: {
    paddingHorizontal: getResponsivePadding(20),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsivePadding(15),
    paddingHorizontal: getResponsivePadding(15),
    marginBottom: getResponsiveMargin(5),
    borderRadius: getResponsiveSize(8),
  },
  activeMenuItem: {
    backgroundColor: '#8A0000',
  },
  menuText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#8A0000',
    marginLeft: getResponsiveMargin(15),
  },
  activeMenuText: {
    color: 'white',
  },
  themeToggleContainer: {
    paddingHorizontal: getResponsivePadding(20),
    paddingVertical: getResponsivePadding(20),
    alignItems: 'center',
  },
  themeToggle: {
    alignItems: 'center',
  },
  themeToggleTrack: {
    width: getResponsiveSize(60),
    height: getResponsiveSize(30),
    backgroundColor: '#FFD700',
    borderRadius: getResponsiveSize(15),
    justifyContent: 'center',
    paddingHorizontal: getResponsivePadding(2),
  },
  themeToggleTrackDark: {
    backgroundColor: '#333',
  },
  themeToggleThumb: {
    width: getResponsiveSize(26),
    height: getResponsiveSize(26),
    backgroundColor: 'white',
    borderRadius: getResponsiveSize(13),
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  themeToggleThumbDark: {
    alignSelf: 'flex-end',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(20),
    paddingVertical: getResponsivePadding(15),
    marginTop: 'auto',
    marginBottom: getResponsiveMargin(20),
  },
  signOutText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#8A0000',
    marginLeft: getResponsiveMargin(15),
  },
});
