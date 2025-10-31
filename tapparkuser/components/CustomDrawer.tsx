import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useRouter, usePathname } from 'expo-router';
import { useAuth } from '../contexts/AuthContext';
import {
  whiteHomeIconSvg,
  maroonProfileIconSvg,
  maroonFavIconSvg,
  maroonLocationIconSvg,
  maroonHomeIconSvg,
  blackLightIconSvg,
  blackDarkIconSvg,
  maroonArrowIconSvg,
  profitIconSvg,
  whiteFavIconSvg,
  whiteProfileIconSvg,
  whiteLocationIconSvg,
  whiteProfitIconSvg,
} from '../app/assets/icons/index2';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(screenWidth * 0.75, 320);

// Responsive calculations
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;

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

interface CustomDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const CustomDrawer: React.FC<CustomDrawerProps> = ({ isOpen, onClose }) => {
  const [isDarkMode, setIsDarkMode] = React.useState(false);
  const router = useRouter();
  const pathname = usePathname();
  
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const menuItems = React.useMemo(() => [
    { 
      id: 'Home', 
      activeIcon: whiteHomeIconSvg, 
      inactiveIcon: maroonHomeIconSvg, 
      text: 'Home', 
      route: '/screens/HomeScreen' 
    },
    { 
      id: 'Profile', 
      activeIcon: whiteProfileIconSvg, 
      inactiveIcon: maroonProfileIconSvg, 
      text: 'Profile', 
      route: '/ProfileScreen' 
    },
    { 
      id: 'Favorites', 
      activeIcon: whiteFavIconSvg, 
      inactiveIcon: maroonFavIconSvg, 
      text: 'Favorites', 
      route: '/screens/FavoritesScreen' 
    },
    { 
      id: 'Active Parking', 
      activeIcon: whiteLocationIconSvg, 
      inactiveIcon: maroonLocationIconSvg, 
      text: 'Active Parking', 
      route: '/screens/ActiveParkingScreen' 
    },
    { 
      id: 'History', 
      activeIcon: whiteProfitIconSvg, 
      inactiveIcon: profitIconSvg, 
      text: 'History', 
      route: '/screens/HistoryScreen' 
    },
  ], []);

  useEffect(() => {
    if (isOpen) {
      slideAnim.setValue(-DRAWER_WIDTH);
      overlayOpacity.setValue(0);
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen]);

  const handleNavigation = React.useCallback((route: string) => {
    onClose();
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  }, [router, onClose]);

  const { logout } = useAuth();
  
  const handleSignOut = React.useCallback(async () => {
    onClose();
    try {
      await logout();
      router.replace('/screens/LoginScreen');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login even if logout fails
      router.replace('/screens/LoginScreen');
    }
  }, [router, onClose, logout]);

  const toggleTheme = React.useCallback(() => {
    setIsDarkMode(!isDarkMode);
  }, [isDarkMode]);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: slideAnim } }],
    { useNativeDriver: true }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;
      
      if (translationX < -100 || velocityX < -500) {
        onClose();
      } else {
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.backdrop,
          {
            opacity: overlayOpacity,
          },
        ]}
        pointerEvents={isOpen ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={styles.backdropTouchable}
          activeOpacity={1}
          onPress={onClose}
        />
      </Animated.View>

      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        enabled={isOpen}
      >
        <Animated.View
          style={[
            styles.drawer,
            {
              transform: [
                { translateX: slideAnim },
              ],
            },
          ]}
          pointerEvents={isOpen ? 'auto' : 'none'}
        >
          {/* Header */}
          <SafeAreaView style={styles.headerSafeArea} edges={['top']}>
            <View style={styles.header}>
              <TouchableOpacity style={styles.menuButton} onPress={onClose}>
                <Ionicons name="close" size={24} color="white" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>TapPark</Text>
            </View>
          </SafeAreaView>

              {/* Menu Items */}
              <View style={styles.menuContainer}>
                {menuItems.map((item) => {
                  const isActive = pathname === item.route;
                  return (
                    <View key={item.id} style={styles.menuItemWrapper}>
                      {isActive && <View style={styles.activeIndicator} />}
                      <TouchableOpacity
                        style={[
                          styles.menuItem,
                          isActive && styles.activeMenuItem,
                        ]}
                        onPress={() => handleNavigation(item.route)}
                      >
                        <SvgXml 
                          xml={isActive ? item.activeIcon : item.inactiveIcon}
                          width={getResponsiveSize(24)}
                          height={getResponsiveSize(24)}
                        />
                        <Text
                          style={[
                            styles.menuText,
                            isActive && styles.activeMenuText,
                          ]}
                        >
                          {item.text}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  );
                })}
              </View>

              {/* Bottom Section */}
              <View style={styles.bottomSection}>
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
                    xml={maroonArrowIconSvg}
                    width={getResponsiveSize(24)}
                    height={getResponsiveSize(24)} 
                  />
                  <Text style={styles.signOutText}>Log Out</Text>
                </TouchableOpacity>
              </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    zIndex: 1000,
    pointerEvents: 'box-none',
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdropTouchable: {
    flex: 1,
  },
  drawer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 2,
      height: 0,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  headerSafeArea: {
    backgroundColor: 'transparent',
  },
  header: {
    backgroundColor: '#8A0000',
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  menuContainer: {
    paddingHorizontal: 0,
  },
  menuItemWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  activeIndicator: {
    width: 12,
    height: 48,
    backgroundColor: '#8A0000',
    marginRight: 8,
    marginLeft: 0,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 15,
    paddingLeft: 20,
    borderRadius: 8,
    flex: 1,
  },
  activeMenuItem: {
    backgroundColor: '#8A0000',
  },
  menuText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8A0000',
    marginLeft: 15,
  },
  activeMenuText: {
    color: 'white',
  },
  bottomSection: {
    marginTop: 'auto',
    paddingBottom: 20,
  },
  themeToggleContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    alignItems: 'center',
  },
  themeToggle: {
    alignItems: 'center',
  },
  themeToggleTrack: {
    width: 60,
    height: 30,
    backgroundColor: '#FFD700',
    borderRadius: 15,
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  themeToggleTrackDark: {
    backgroundColor: '#333',
  },
  themeToggleThumb: {
    width: 26,
    height: 26,
    backgroundColor: 'white',
    borderRadius: 13,
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    alignSelf: 'center',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#8A0000',
    marginLeft: 15,
  },
});

export default CustomDrawer;
