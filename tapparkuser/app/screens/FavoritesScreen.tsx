import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Dimensions,
  ScrollView,
  Animated,
  Modal,
  Alert,
  Image
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import SharedHeader from '../../components/SharedHeader';
import { useAuth } from '../../contexts/AuthContext';
import { SvgXml } from 'react-native-svg';
import ApiService from '../../services/api';
import { 
  maroonUsersEditIconSvg,
  maroonLocationIconSvg,
  maroonTimeIconSvg,
  maroonTrashIconSvg,
  tapParkLogoSvg,
  whiteCarIconSvg,
  whiteMotorIconSvg,
  whiteEbikeIconSvg
} from '../assets/icons/index2';

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


const FavoritesScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const vehicleScrollProgress = useRef(new Animated.Value(0)).current;
  const [isVehicleSelectionModalVisible, setIsVehicleSelectionModalVisible] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedSpotForBooking, setSelectedSpotForBooking] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [userVehicles, setUserVehicles] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [showVehicleMismatchModal, setShowVehicleMismatchModal] = useState(false);
  const [mismatchData, setMismatchData] = useState<any>(null);

  // Profile picture component
  const ProfilePicture = ({ size = 100 }: { size?: number }) => {
    const getInitials = () => {
      if (!user) return '?';
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const profileImageUrl = user?.profile_image || (user as any)?.profile_image_url;

    // If profile image URL is provided, show the image
    if (profileImageUrl) {
      return (
        <View style={[styles.profilePicture, { width: size, height: size, borderRadius: size / 2 }]}>
          <ExpoImage
            key={profileImageUrl}
            source={{ uri: profileImageUrl }}
            style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }}
            contentFit="cover"
            cachePolicy="none"
            transition={200}
            onError={({ error }) => {
              console.warn('⚠️ Failed to load profile image (FavoritesScreen):', profileImageUrl, error);
            }}
          />
        </View>
      );
    }

    // Fallback to initials
    return (
      <View style={[styles.profilePicture, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.profileInitials, { fontSize: size * 0.3 }]}>
          {getInitials()}
        </Text>
      </View>
    );
  };

  // Fetch user vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setIsLoadingVehicles(true);
        const response = await ApiService.getVehicles();
        if (response.success) {
          setUserVehicles(response.data.vehicles);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        setIsLoadingVehicles(false);
      }
    };
    fetchVehicles();
  }, []);

  // Refresh favorites when component mounts or when screen is focused
  useEffect(() => {
    const loadFavorites = async () => {
      try {
        setIsLoading(true);
        const response = await ApiService.getFavorites();
        if (response.success) {
          setFavorites(response.data.favorites);
        } else {
          setFavorites([]);
        }
      } catch (error) {
        console.error('Error loading favorites:', error);
        setFavorites([]);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadFavorites();
  }, []);

  // Refresh favorites when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const refreshFavorites = async () => {
        try {
          const response = await ApiService.getFavorites();
          if (response.success) {
            setFavorites(response.data.favorites);
          }
        } catch (error) {
          console.error('Error refreshing favorites:', error);
        }
      };
      
      refreshFavorites();
    }, [])
  );

  const handleEditProfile = () => {
    // Handle edit profile
  };

  // Get vehicle icon based on type
  const getVehicleIcon = (vehicleType: string) => {
    const type = vehicleType.toLowerCase();
    if (type === 'car') {
        return whiteCarIconSvg;
    } else if (type === 'motorcycle') {
        return whiteMotorIconSvg;
    } else if (type === 'bicycle' || type === 'ebike') {
        return whiteEbikeIconSvg;
    }
    return whiteCarIconSvg; // default
  };

  // Filter vehicles by parking spot compatibility
  const getCompatibleVehicles = () => {
    if (!selectedSpotForBooking) {
      return userVehicles; // Show all vehicles if no specific spot selected
    }

    const spotType = selectedSpotForBooking.spot_type?.toLowerCase();
    if (!spotType) {
      return userVehicles; // Show all if spot type is unknown
    }

    return userVehicles.filter(vehicle => {
      const vehicleType = vehicle.vehicle_type.toLowerCase();
      
      // Map vehicle types to spot types for compatibility
      let expectedSpotType = vehicleType;
      if (vehicleType === 'bicycle' || vehicleType === 'ebike') {
        expectedSpotType = 'bike';
      }
      
      return expectedSpotType === spotType;
    });
  };


  const handleBookSpot = (favorite: any) => {
    console.log('🎯 handleBookSpot called with favorite:', favorite);
    setSelectedSpotForBooking(favorite);
    setIsVehicleSelectionModalVisible(true);
  };

  const handleCloseVehicleSelectionModal = () => {
    setIsVehicleSelectionModalVisible(false);
    setSelectedVehicle('');
    setSelectedSpotForBooking(null);
  };

  const handleSelectVehicle = (vehicleId: string) => {
    setSelectedVehicle(vehicleId);
  };

  const handleVehicleBookNow = async () => {
    console.log('🎯 handleVehicleBookNow called');
    console.log('🎯 selectedVehicle:', selectedVehicle);
    console.log('🎯 selectedSpotForBooking:', selectedSpotForBooking);
    
    if (!selectedVehicle || !selectedSpotForBooking) {
      console.log('❌ Missing vehicle or spot selection');
      return;
    }

    try {
      setIsBooking(true);
      
      // Check for current booking first
      const currentBookingResponse = await ApiService.getMyBookings();
      console.log('🔍 My bookings response:', JSON.stringify(currentBookingResponse, null, 2));
      
      if (currentBookingResponse.success && currentBookingResponse.data.bookings.length > 0) {
        const activeBooking = currentBookingResponse.data.bookings.find(
          (booking: any) => booking.bookingStatus === 'active' || booking.bookingStatus === 'reserved'
        );
        if (activeBooking) {
          const statusText = activeBooking.bookingStatus === 'reserved' ? 'reserved' : 'active';
          Alert.alert(
            'Current Booking',
            `You already have a ${statusText} booking at ${activeBooking.parkingArea?.name || 'Unknown Location'} (Spot ${activeBooking.parkingSlot?.spotNumber || 'Unknown'}).\n\nPlease complete or cancel your current booking before making a new one.`,
            [{ text: 'OK', style: 'default' }]
          );
          return;
        }
      }

      // Get the selected vehicle
      const vehicle = userVehicles.find(v => v.id.toString() === selectedVehicle);
      if (!vehicle) {
        Alert.alert('Error', 'Selected vehicle not found');
        return;
      }

      console.log('🚀 Calling ApiService.bookParkingSpot with:', {
        vehicleId: vehicle.id,
        spotId: selectedSpotForBooking.parking_spot_id,
        areaId: selectedSpotForBooking.parking_area_id
      });

      const response = await ApiService.bookParkingSpot(
        vehicle.id,
        selectedSpotForBooking.parking_spot_id,
        selectedSpotForBooking.parking_area_id
      );
      
      console.log('🎯 Booking response:', JSON.stringify(response, null, 2));
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Parking spot booked successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to ActiveParkingScreen with complete booking details
                router.push({
                  pathname: '/screens/ActiveParkingScreen',
                  params: {
                    sessionId: response.data.reservationId,
                    vehicleId: vehicle.id,
                    vehiclePlate: response.data.bookingDetails.vehiclePlate,
                    vehicleType: response.data.bookingDetails.vehicleType,
                    vehicleBrand: response.data.bookingDetails.vehicleBrand,
                    areaName: response.data.bookingDetails.areaName,
                    areaLocation: response.data.bookingDetails.areaLocation,
                    spotNumber: response.data.bookingDetails.spotNumber,
                    spotType: response.data.bookingDetails.spotType,
                    startTime: response.data.bookingDetails.startTime,
                    status: response.data.bookingDetails.status
                  }
                });
                // Reset states
                setIsVehicleSelectionModalVisible(false);
                setSelectedVehicle('');
                setSelectedSpotForBooking(null);
              }
            }
          ]
        );
      } else {
        // Check if it's a vehicle type mismatch
        if ((response.data as any)?.errorCode === 'VEHICLE_TYPE_MISMATCH') {
          setMismatchData((response.data as any).data);
          setShowVehicleMismatchModal(true);
        } else {
          Alert.alert('Error', response.data?.message || 'Failed to book parking spot');
        }
      }
    } catch (error) {
      console.error('Error booking parking spot:', error);
      Alert.alert('Error', 'Failed to book parking spot');
    } finally {
      setIsBooking(false);
    }
  };

  const handleVehicleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxScrollX = contentSize.width - layoutMeasurement.width;
    const scrollPercentage = maxScrollX > 0 ? contentOffset.x / maxScrollX : 0;
    vehicleScrollProgress.setValue(Math.min(scrollPercentage, 1));
  };

  const handleRemoveFavorite = async (parkingSpotId: number) => {
    try {
      const response = await ApiService.removeFavorite(parkingSpotId);
      if (response.success) {
        // Refresh favorites list
        const updatedResponse = await ApiService.getFavorites();
        if (updatedResponse.success) {
          setFavorites(updatedResponse.data.favorites);
        }
      }
    } catch (error) {
      console.error('Error removing favorite:', error);
    }
  };

  // Fetch user vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setIsLoadingVehicles(true);
        const response = await ApiService.getVehicles();
        if (response.success) {
          setUserVehicles(response.data.vehicles);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
      } finally {
        setIsLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, []);

  // Use state for favorite spots to enable re-rendering
  const favoriteSpots = favorites;

  return (
    <View style={styles.container}>
      <SharedHeader 
        title="Favorites" 
        showBackButton={false}
      />
      
      <View style={styles.scrollContainer}>

        {/* Profile Content Card */}
        <View style={styles.profileCard}>
          {/* Profile Picture Section */}
          <View style={styles.fixedProfileSection}>
            <View style={styles.profilePictureContainer}>
              <ProfilePicture size={getResponsiveSize(180)} />
            </View>
            
            <View style={styles.userInfoContainer}>
              <Text style={styles.userName}>FAVORITE SPOTS</Text>
              <Text style={styles.userEmail}>YOUR SAVED PARKING LOCATIONS</Text>
            </View>
          </View>

          <ScrollView style={styles.profileCardScroll} showsVerticalScrollIndicator={false}>
            {/* Favorite Spots */}
            <View style={styles.spotsContainer}>
              <Text style={styles.spotsTitle}>Favorite Spots</Text>
              
              {isLoading ? (
                <View style={styles.emptyFavoritesContainer}>
                  <Text style={styles.emptyFavoritesTitle}>Loading...</Text>
                </View>
              ) : favorites.length === 0 ? (
                <View style={styles.emptyFavoritesContainer}>
                  <Text style={styles.emptyFavoritesTitle}>No Favorite Spots</Text>
                  <Text style={styles.emptyFavoritesMessage}>
                    You haven't added any parking spots to your favorites yet.
                  </Text>
                  <Text style={styles.emptyFavoritesSubMessage}>
                    Book a parking spot and add it to favorites to see it here.
                  </Text>
                </View>
              ) : (
                favorites.map((favorite, index) => (
                <View key={favorite.favorites_id} style={styles.parkingCard}>
                  <View style={styles.locationHeader}>
                    <View style={styles.locationTextContainer}>
                      <Text style={styles.parkingLocation}>{favorite.parking_area_name}</Text>
                      <Text style={styles.parkingSpotId}>{favorite.spot_number} ({favorite.spot_type})</Text>
                    </View>
                    <Image source={require('../assets/img/fulogofinal.png')} style={styles.logoIcon} />
                  </View>
                  <Text style={styles.parkingLabel}>Location</Text>
                  <View style={styles.timeSlotContainer}>
                    <Text style={styles.parkingTime}>{favorite.location}</Text>
                  </View>
                  <View style={styles.parkingStatusContainer}>
                    <Text style={[
                      favorite.spot_status === 'free' ? styles.availableStatus : styles.occupiedStatus
                    ]}>
                      {favorite.spot_status.toUpperCase()}
                    </Text>
                    <View style={styles.parkingActionsContainer}>
                      <TouchableOpacity 
                        style={styles.bookButton}
                        onPress={() => handleBookSpot(favorite)}
                      >
                        <Text style={styles.bookButtonText}>BOOK</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={styles.removeButton}
                        onPress={() => handleRemoveFavorite(favorite.parking_spot_id)}
                      >
                        <SvgXml 
                          xml={maroonTrashIconSvg}
                          width={20}
                          height={20}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
                ))
              )}
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Vehicle Selection Modal */}
      <Modal
        visible={isVehicleSelectionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseVehicleSelectionModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.vehicleSelectionModalContainer}>
            <View style={styles.vehicleModalHeader}>
              <Text style={styles.vehicleModalTitle}>Select Vehicle for Reservation</Text>
              <TouchableOpacity onPress={handleCloseVehicleSelectionModal}>
                <Ionicons name="close" size={24} color="#8A0000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.vehicleTypeInfoContainer}>
              <Text style={styles.vehicleTypeInfoText}>
                {selectedSpotForBooking 
                  ? `💡 Only vehicles compatible with ${selectedSpotForBooking.spot_type} spots are shown`
                  : '💡 Select a vehicle to book a parking spot'
                }
              </Text>
            </View>
            
            {getCompatibleVehicles().length === 0 ? (
              <View style={styles.noCompatibleVehiclesContainer}>
                <Text style={styles.noCompatibleVehiclesText}>
                  No vehicles compatible with this parking spot type
                </Text>
                <Text style={styles.noCompatibleVehiclesSubtext}>
                  Add a {selectedSpotForBooking?.spot_type || 'compatible'} vehicle to your account
                </Text>
              </View>
            ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={styles.vehicleSelectionScroll}
                contentContainerStyle={styles.vehicleSelectionScrollContent}
                onScroll={handleVehicleScroll}
                scrollEventThrottle={16}
              >
                {getCompatibleVehicles().map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[
                      styles.vehicleSelectionCard,
                      selectedVehicle === vehicle.id.toString() && styles.vehicleSelectionCardSelected
                    ]}
                    onPress={() => handleSelectVehicle(vehicle.id.toString())}
                  >
                    <View style={styles.vehicleSelectionIconContainer}>
                      <SvgXml xml={getVehicleIcon(vehicle.vehicle_type)} width={getResponsiveSize(40)} height={getResponsiveSize(40)} />
                    </View>
                    <Text style={styles.vehicleSelectionLabel}>Brand and Model</Text>
                    <Text style={styles.vehicleSelectionValue}>{vehicle.brand || 'N/A'}</Text>
                    <Text style={styles.vehicleSelectionLabel}>Vehicle Type</Text>
                    <Text style={styles.vehicleSelectionValue}>{vehicle.vehicle_type}</Text>
                    {vehicle.plate_number && (
                      <>
                        <Text style={styles.vehicleSelectionLabel}>Plate Number</Text>
                        <Text style={styles.vehicleSelectionValue}>{vehicle.plate_number}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
            
            {/* Progress Indicator */}
            <View style={styles.vehicleSelectionProgressContainer}>
              <View style={styles.vehicleSelectionProgressTrack}>
                <Animated.View 
                  style={[
                    styles.vehicleSelectionProgressHandle,
                    {
                      left: vehicleScrollProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, Math.max(0, (screenWidth * 0.9 - 48) - getResponsiveSize(20))],
                        extrapolate: 'clamp',
                      }),
                    }
                  ]}
                />
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.vehicleSelectionBookNowButton,
                (!selectedVehicle || isBooking || getCompatibleVehicles().length === 0) && styles.vehicleSelectionBookNowButtonDisabled
              ]}
              onPress={handleVehicleBookNow}
              disabled={!selectedVehicle || isBooking || getCompatibleVehicles().length === 0}
            >
              <Text style={styles.vehicleSelectionBookNowButtonText}>
                {isBooking ? 'Booking...' : 
                 getCompatibleVehicles().length === 0 ? 'No Compatible Vehicles' : 'Book Now'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Vehicle Type Mismatch Modal */}
      <Modal
        visible={showVehicleMismatchModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowVehicleMismatchModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.mismatchModalContainer}>
            <View style={styles.mismatchModalHeader}>
              <Text style={styles.mismatchModalTitle}>🚗 Vehicle Type Mismatch</Text>
              <TouchableOpacity onPress={() => setShowVehicleMismatchModal(false)}>
                <Ionicons name="close" size={24} color="#8A0000" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.mismatchContent}>
              <Text style={styles.mismatchMessage}>
                Oops! There's a mismatch between your vehicle and this parking spot.
              </Text>
              
              <View style={styles.mismatchDetails}>
                <View style={styles.mismatchItem}>
                  <Text style={styles.mismatchLabel}>Your Vehicle:</Text>
                  <Text style={styles.mismatchValue}>{mismatchData?.vehicleType || 'Unknown'}</Text>
                </View>
                
                <View style={styles.mismatchItem}>
                  <Text style={styles.mismatchLabel}>Spot Type:</Text>
                  <Text style={styles.mismatchValue}>{mismatchData?.spotType || 'Unknown'}</Text>
                </View>
              </View>
              
              <Text style={styles.mismatchSuggestion}>
                💡 Try selecting a different vehicle or choose a different parking spot that matches your vehicle type.
              </Text>
            </View>
            
            <TouchableOpacity 
              style={styles.mismatchCloseButton}
              onPress={() => setShowVehicleMismatchModal(false)}
            >
              <Text style={styles.mismatchCloseButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#383838',
  },
  scrollContainer: {
    flex: 1,
  },
  backgroundSection: {
    height: screenHeight * 0.3,
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  profileCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: getResponsiveSize(25),
    borderTopRightRadius: getResponsiveSize(25),
    paddingTop: getResponsivePadding(25),
    paddingBottom: getResponsivePadding(35),
    paddingHorizontal: getResponsivePadding(20),
    height: screenHeight * 0.7, // Fixed height - 70% of screen height
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -5,
    },
    shadowOpacity: 0.1,
    shadowRadius: getResponsiveSize(10),
    elevation: 10,
  },
  profileCardScroll: {
    flex: 1,
  },
  fixedProfileSection: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: getResponsiveMargin(30),
  },
  profilePictureContainer: {
    position: 'relative',
    marginTop: -getResponsiveSize(70),
    backgroundColor: 'transparent',
    borderRadius: getResponsiveSize(90),
    width: getResponsiveSize(180),
    height: getResponsiveSize(180),
    borderWidth: getResponsiveSize(3),
    borderColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicture: {
    backgroundColor: '#8A0000',
    borderWidth: 3,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userInfoContainer: {
    alignItems: 'center',
    marginTop: getResponsiveSize(15),
  },
  userName: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(5),
    letterSpacing: 1,
    textAlign: 'center',
  },
  userEmail: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    textAlign: 'center',
  },
  spotsContainer: {
    flex: 1,
  },
  spotsTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(20),
  },
  parkingCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#8A0000',
    borderRadius: 12,
    padding: getResponsivePadding(16),
    marginBottom: getResponsiveMargin(15),
    position: 'relative',
    shadowColor: '#8A0000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: getResponsiveSize(4),
    elevation: 3,
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: getResponsiveMargin(8),
  },
  locationTextContainer: {
    flex: 1,
  },
  parkingLocation: {
    fontSize: getResponsiveFontSize(12),
    color: '#6B7280',
    marginBottom: getResponsiveMargin(4),
  },
  parkingSpotId: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(8),
  },
  logoIcon: {
    width: getResponsiveSize(60),
    height: getResponsiveSize(60),
    resizeMode: 'contain',
  },
  parkingLabel: {
    fontSize: getResponsiveFontSize(12),
    color: '#6B7280',
    marginBottom: getResponsiveMargin(4),
  },
  timeSlotContainer: {
    marginBottom: getResponsiveMargin(8),
  },
  parkingTime: {
    fontSize: getResponsiveFontSize(14),
    color: '#1F2937',
    flex: 1,
  },
  parkingPrice: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: getResponsiveMargin(12),
  },
  parkingStatusContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  parkingActionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  removeButton: {
    padding: 8,
    borderRadius: 6,
    backgroundColor: '#FFE5E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  availableStatus: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  occupiedStatus: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: 'bold',
    color: '#8A0000',
  },
  bookButton: {
    backgroundColor: '#8A0000',
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(8),
    borderRadius: 6,
  },
  bookButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(12),
    fontWeight: 'bold',
  },
  // Vehicle Selection Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleSelectionModalContainer: {
    backgroundColor: 'white',
    borderRadius: getResponsiveSize(16),
    padding: getResponsivePadding(24),
    margin: getResponsiveMargin(20),
    maxHeight: '80%',
    width: '90%',
    alignSelf: 'center',
  },
  vehicleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveMargin(20),
  },
  vehicleModalTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  vehicleCardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: getResponsiveMargin(20),
  },
  vehicleCard: {
    backgroundColor: 'white',
    borderRadius: getResponsiveSize(12),
    padding: getResponsivePadding(16),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: getResponsiveMargin(4),
    minHeight: getResponsiveSize(200),
  },
  selectedVehicleCard: {
    borderWidth: 3,
    borderColor: '#8A0000',
  },
  vehicleIconContainer: {
    backgroundColor: '#8A0000',
    borderRadius: getResponsiveSize(8),
    padding: getResponsivePadding(12),
    marginBottom: getResponsiveMargin(12),
    width: getResponsiveSize(48),
    height: getResponsiveSize(48),
    alignItems: 'center',
    justifyContent: 'center',
  },
  vehicleBrandLabel: {
    fontSize: getResponsiveFontSize(12),
    color: '#999999',
    marginBottom: getResponsiveMargin(4),
  },
  vehicleBrand: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: getResponsiveMargin(8),
    textAlign: 'center',
  },
  vehicleDisplayLabel: {
    fontSize: getResponsiveFontSize(12),
    color: '#999999',
    marginBottom: getResponsiveMargin(4),
  },
  vehicleDisplayName: {
    fontSize: getResponsiveFontSize(14),
    color: '#333333',
    marginBottom: getResponsiveMargin(8),
  },
  vehiclePlateLabel: {
    fontSize: getResponsiveFontSize(12),
    color: '#999999',
    marginBottom: getResponsiveMargin(4),
  },
  vehiclePlateNumber: {
    fontSize: getResponsiveFontSize(14),
    color: '#333333',
  },
  progressIndicatorContainer: {
    marginBottom: getResponsiveMargin(20),
  },
  progressBar: {
    height: getResponsiveSize(4),
    backgroundColor: '#E0E0E0',
    borderRadius: getResponsiveSize(2),
    overflow: 'hidden',
  },
  progressHandle: {
    position: 'absolute',
    width: getResponsiveSize(20),
    height: getResponsiveSize(8),
    backgroundColor: '#8A0000',
    borderRadius: getResponsiveSize(4),
    top: getResponsiveSize(-2),
  },
  vehicleSelectionScroll: {
    marginHorizontal: -getResponsivePadding(24),
  },
  vehicleSelectionScrollContent: {
    paddingHorizontal: getResponsivePadding(24),
  },
  bookNowButton: {
    backgroundColor: '#8A0000',
    paddingVertical: getResponsivePadding(16),
    paddingHorizontal: getResponsivePadding(24),
    borderRadius: getResponsiveSize(8),
    alignItems: 'center',
    marginBottom: getResponsiveMargin(16),
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bookNowButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
  },
  bookNowButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  emptyFavoritesContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: getResponsivePadding(40),
    paddingHorizontal: getResponsivePadding(20),
  },
  emptyFavoritesTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: getResponsiveMargin(12),
  },
  emptyFavoritesMessage: {
    fontSize: getResponsiveFontSize(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: getResponsiveMargin(8),
    lineHeight: 24,
  },
  emptyFavoritesSubMessage: {
    fontSize: getResponsiveFontSize(14),
    color: '#999',
    textAlign: 'center',
    lineHeight: 20,
  },
  // Vehicle Mismatch Modal Styles
  mismatchModalContainer: {
    backgroundColor: 'white',
    borderRadius: getResponsiveSize(16),
    padding: getResponsivePadding(24),
    margin: getResponsiveMargin(20),
    maxWidth: '90%',
    alignSelf: 'center',
  },
  mismatchModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveMargin(20),
  },
  mismatchModalTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#8A0000',
    flex: 1,
  },
  mismatchContent: {
    marginBottom: getResponsiveMargin(24),
  },
  mismatchMessage: {
    fontSize: getResponsiveFontSize(16),
    color: '#333',
    textAlign: 'center',
    marginBottom: getResponsiveMargin(20),
    lineHeight: 24,
  },
  mismatchDetails: {
    backgroundColor: '#F8F9FA',
    borderRadius: getResponsiveSize(8),
    padding: getResponsivePadding(16),
    marginBottom: getResponsiveMargin(16),
  },
  mismatchItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveMargin(8),
  },
  mismatchLabel: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    fontWeight: '500',
  },
  mismatchValue: {
    fontSize: getResponsiveFontSize(14),
    color: '#8A0000',
    fontWeight: 'bold',
  },
  mismatchSuggestion: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
    lineHeight: 20,
  },
  mismatchCloseButton: {
    backgroundColor: '#8A0000',
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(24),
    borderRadius: getResponsiveSize(8),
    alignItems: 'center',
  },
  mismatchCloseButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
  },
  // Vehicle Selection Modal Styles (from HomeScreen)
  vehicleTypeInfoContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: getResponsiveSize(8),
    padding: getResponsivePadding(12),
    marginBottom: getResponsiveMargin(16),
    borderLeftWidth: 4,
    borderLeftColor: '#8A0000',
  },
  vehicleTypeInfoText: {
    fontSize: getResponsiveFontSize(14),
    color: '#4A5568',
    fontStyle: 'italic',
    textAlign: 'center',
  },
  vehicleSelectionCard: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#8A0000',
    borderRadius: getResponsiveSize(12),
    padding: getResponsivePadding(16),
    marginRight: getResponsiveMargin(12),
    width: getResponsiveSize(160),
    minHeight: getResponsiveSize(200),
  },
  vehicleSelectionCardSelected: {
    borderWidth: 3,
    borderColor: '#8A0000',
  },
  vehicleSelectionIconContainer: {
    backgroundColor: '#8A0000',
    borderRadius: getResponsiveSize(8),
    padding: getResponsivePadding(12),
    alignItems: 'center',
    marginBottom: getResponsiveMargin(12),
    width: getResponsiveSize(60),
    height: getResponsiveSize(60),
    justifyContent: 'center',
    alignSelf: 'center',
  },
  vehicleSelectionLabel: {
    fontSize: getResponsiveFontSize(10),
    color: '#8A0000',
    marginBottom: getResponsiveMargin(2),
  },
  vehicleSelectionValue: {
    fontSize: getResponsiveFontSize(12),
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: getResponsiveMargin(6),
  },
  vehicleSelectionProgressContainer: {
    marginVertical: getResponsiveMargin(20),
    alignItems: 'center',
  },
  vehicleSelectionProgressTrack: {
    width: '100%',
    height: getResponsiveSize(4),
    backgroundColor: '#E0E0E0',
    borderRadius: getResponsiveSize(2),
    position: 'relative',
  },
  vehicleSelectionProgressHandle: {
    position: 'absolute',
    width: getResponsiveSize(20),
    height: getResponsiveSize(8),
    backgroundColor: '#8A0000',
    borderRadius: getResponsiveSize(4),
    top: getResponsiveSize(-2),
  },
  vehicleSelectionBookNowButton: {
    backgroundColor: '#8A0000',
    borderRadius: getResponsiveSize(8),
    paddingVertical: getResponsivePadding(16),
    paddingHorizontal: getResponsivePadding(32),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  vehicleSelectionBookNowButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  vehicleSelectionBookNowButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
  },
  // No Compatible Vehicles Styles
  noCompatibleVehiclesContainer: {
    padding: getResponsivePadding(40),
    alignItems: 'center',
    justifyContent: 'center',
  },
  noCompatibleVehiclesText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#8A0000',
    textAlign: 'center',
    marginBottom: getResponsiveMargin(8),
  },
  noCompatibleVehiclesSubtext: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    textAlign: 'center',
    lineHeight: getResponsiveFontSize(20),
  },
});

export default FavoritesScreen;
