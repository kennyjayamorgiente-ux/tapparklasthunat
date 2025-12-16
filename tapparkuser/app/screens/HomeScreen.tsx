import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  SafeAreaView, 
  StyleSheet, 
  Dimensions, 
  ScrollView, 
  Image, 
  Animated, 
  PanResponder, 
  Modal, 
  ActivityIndicator, 
  Alert, 
  StatusBar,
  Pressable,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { Image as ExpoImage } from 'expo-image';
import SharedHeader from '../../components/SharedHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useDrawer } from '../../contexts/DrawerContext';
import { useLoading } from '../../contexts/LoadingContext';
import { useThemeColors, useTheme } from '../../contexts/ThemeContext';
import ApiService from '../../services/api';
import { 
  lineGraphIconSvg, 
  profitIconSvg, 
  checkboxIconSvg,
  doubleUpIconSvg,
  whiteCarIconSvg,
  whiteMotorIconSvg,
  whiteEbikeIconSvg
} from '../assets/icons/index2';
import { getHomeScreenStyles } from '../styles/homeScreenStyles';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

export default function HomeScreen() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { toggleDrawer } = useDrawer();
  const { showLoading, hideLoading } = useLoading();
  const colors = useThemeColors();
  const { isDarkMode } = useTheme();
  const homeScreenStyles = getHomeScreenStyles(colors);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/screens/LoginScreen');
    }
  }, [isAuthenticated, isLoading]);

  // Profile picture component
  const ProfilePicture = ({ size = 32 }: { size?: number }) => {
    const getInitials = () => {
      if (!user) return '?';
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const profileImageUrl = (user as any)?.profile_image || (user as any)?.profile_image_url;

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
              console.warn('⚠️ Failed to load profile image (HomeScreen):', profileImageUrl, error);
            }}
          />
        </View>
      );
    }

    // Fallback to initials
    return (
      <View style={[styles.profilePicture, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.profileInitials, { fontSize: size * 0.4 }]}>
          {getInitials()}
        </Text>
      </View>
    );
  };
  const scrollViewRef = useRef<ScrollView>(null);
  const scrollProgress = useRef(new Animated.Value(0)).current;
  const vehicleScrollProgress = useRef(new Animated.Value(0)).current;
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isBookingModalVisible, setIsBookingModalVisible] = useState(false);
  const [isVehicleSelectionModalVisible, setIsVehicleSelectionModalVisible] = useState(false);
  const [selectedArea, setSelectedArea] = useState('');
  const [assignedSlot, setAssignedSlot] = useState('');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [userVehicles, setUserVehicles] = useState<any[]>([]);
  const [isLoadingVehicles, setIsLoadingVehicles] = useState(false);
  const [parkingAreas, setParkingAreas] = useState<any[]>([]);
  const [parkingSpots, setParkingSpots] = useState<any[]>([]);
  const [isLoadingParkingAreas, setIsLoadingParkingAreas] = useState(false);
  const [isLoadingParkingSpots, setIsLoadingParkingSpots] = useState(false);
  const [selectedVehicleForParking, setSelectedVehicleForParking] = useState<any>(null);
  const [selectedParkingArea, setSelectedParkingArea] = useState<any>(null);
  const [assignedSpotDetails, setAssignedSpotDetails] = useState<any>(null);
  const [frequentSpots, setFrequentSpots] = useState<any[]>([]);
  const [isLoadingFrequentSpots, setIsLoadingFrequentSpots] = useState(false);
  const [selectedSpotForBooking, setSelectedSpotForBooking] = useState<any>(null);
  const [showVehicleMismatchModal, setShowVehicleMismatchModal] = useState(false);
  const [mismatchData, setMismatchData] = useState<any>(null);
  const [canScrollVehicles, setCanScrollVehicles] = useState(false);
  const vehicleScrollViewWidth = useRef(0);
  const vehicleContentWidth = useRef(0);
  const [canScrollFrequentSpots, setCanScrollFrequentSpots] = useState(false);
  const frequentSpotsScrollViewWidth = useRef(0);
  const frequentSpotsContentWidth = useRef(0);
  const [isParkingSpotsModalVisible, setIsParkingSpotsModalVisible] = useState(false);
  const [selectedAreaForSpots, setSelectedAreaForSpots] = useState<any>(null);
  const [isSeeAllSpotsModalVisible, setIsSeeAllSpotsModalVisible] = useState(false);
  const [isAreaDropdownVisible, setIsAreaDropdownVisible] = useState(false);
  const [selectedAreaForSeeAll, setSelectedAreaForSeeAll] = useState<any>(null);
  const [spotsForSeeAll, setSpotsForSeeAll] = useState<any[]>([]);
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoadingSvg, setIsLoadingSvg] = useState(false);
  const [svgAspectRatio, setSvgAspectRatio] = useState<number>(1.2);
  const [clickableSpots, setClickableSpots] = useState<Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    spotNumber?: string;
    spotId?: string;
  }>>([]);
  const [spotStatuses, setSpotStatuses] = useState<Map<string, {
    id: number;
    spot_number: string;
    status: string;
    spot_type: string;
    section_name: string;
    is_user_booked?: boolean; // New field to indicate if current user has booked this spot
  }>>(new Map());

  const handleAddVehicle = () => {
    router.push('/screens/AddVehicleScreen');
  };

  // Fetch user vehicles
  useEffect(() => {
    const fetchVehicles = async () => {
      if (!isAuthenticated) {
        setIsLoadingVehicles(false);
        return;
      }
      try {
        setIsLoadingVehicles(true);
        const response = await ApiService.getVehicles();
        console.log('🚗 Vehicles API response:', response);
        if (response.success && response.data?.vehicles) {
          console.log('🚗 Vehicles data:', response.data.vehicles);
          setVehicles(response.data.vehicles);
          setUserVehicles(response.data.vehicles);
        } else {
          console.log('❌ No vehicles data received');
          setVehicles([]);
          setUserVehicles([]);
        }
      } catch (error) {
        console.error('Error fetching vehicles:', error);
        Alert.alert('Error', 'Failed to load vehicles');
      } finally {
        setIsLoadingVehicles(false);
      }
    };
    fetchVehicles();
  }, [isAuthenticated]);

  // Fetch parking areas on mount
  useEffect(() => {
    if (isAuthenticated) {
      fetchParkingAreas();
    }
  }, [isAuthenticated]);

  // Fetch frequently used parking spots
  useEffect(() => {
    const fetchFrequentSpots = async () => {
      if (!isAuthenticated) {
        setIsLoadingFrequentSpots(false);
        return;
      }
      
      try {
        setIsLoadingFrequentSpots(true);
        const response = await ApiService.getFrequentSpots(5);
        if (response.success && response.data?.frequent_spots) {
          setFrequentSpots(response.data.frequent_spots);
        } else {
          console.log('No frequent spots found or failed to load');
          setFrequentSpots([]);
        }
    } catch (error) {
        console.error('Error fetching frequent spots:', error);
    } finally {
        setIsLoadingFrequentSpots(false);
    }
  };

    fetchFrequentSpots();
  }, [isAuthenticated]);

  // Reset scroll state when vehicles change
  useEffect(() => {
    setCanScrollVehicles(false);
  }, [vehicles.length]);

  // Reset scroll state when frequent spots change
  useEffect(() => {
    setCanScrollFrequentSpots(false);
  }, [frequentSpots.length]);

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
      return userVehicles || []; // Show all vehicles if no specific spot selected
    }

    const spotType = selectedSpotForBooking.spot_type?.toLowerCase();
    if (!spotType) {
      return userVehicles || []; // Show all if spot type is unknown
    }

    return (userVehicles || []).filter(vehicle => {
      const vehicleType = vehicle.vehicle_type.toLowerCase();
      
      // Map vehicle types to spot types for compatibility
      let expectedSpotType = vehicleType;
      if (vehicleType === 'bicycle' || vehicleType === 'ebike') {
        expectedSpotType = 'bike';
      }
      
      return expectedSpotType === spotType;
    });
  };

  // Get logo based on location name
  const getLocationLogo = (locationName: string) => {
    if (locationName.toLowerCase().includes('fpa')) {
      return require('../assets/img/fpa-logo.png');
    } else if (locationName.toLowerCase().includes('fu')) {
      return require('../assets/img/fulogofinal.png');
    }
    return require('../assets/img/fpa-logo.png'); // Default logo
  };

  // Format time for display
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  // Generate spot ID from location and spot number
  const generateSpotId = (locationName: string, spotNumber: string) => {
    const prefix = locationName.toLowerCase().includes('fpa') ? 'FPL' : 'FMC';
    return `${prefix}-${spotNumber.padStart(3, '0')}`;
  };

  // Fetch parking areas
  const fetchParkingAreas = async () => {
    try {
      setIsLoadingParkingAreas(true);
        const response = await ApiService.getParkingAreas();
      if (response.success && response.data?.locations) {
        setParkingAreas(response.data.locations);
      } else {
        console.log('❌ No parking areas data received');
        setParkingAreas([]);
      }
    } catch (error) {
      console.error('Error fetching parking areas:', error);
      Alert.alert('Error', 'Failed to load parking areas');
    } finally {
      setIsLoadingParkingAreas(false);
    }
  };

  // Fetch parking spots for selected area
  const fetchParkingSpots = async (areaId: number, vehicleType?: string) => {
    try {
      setIsLoadingParkingSpots(true);
      const response = await ApiService.getParkingSpots(areaId, vehicleType);
      if (response.success) {
        setParkingSpots(response.data.spots);
      } else {
        Alert.alert('Error', 'Failed to load parking spots');
      }
    } catch (error) {
      console.error('Error fetching parking spots:', error);
      Alert.alert('Error', 'Failed to load parking spots');
    } finally {
      setIsLoadingParkingSpots(false);
    }
  };

  // Handle vehicle card press - show parking areas
  const handleVehicleCardPress = (vehicle: any) => {
    setSelectedVehicleForParking(vehicle);
    fetchParkingAreas();
    setIsModalVisible(true);
  };

  // Handle parking area selection - just select the area
  const handleParkingAreaSelect = async (area: any) => {
    setSelectedParkingArea(area);
    setIsModalVisible(false);
    
    // Check if a vehicle is already selected
    if (!selectedVehicleForParking) {
      Alert.alert('No Vehicle Selected', 'Please select a vehicle from your registered vehicles first.');
      return;
    }
    
    try {
      setIsLoadingParkingSpots(true);
      
      // Check for current booking (reserved or active) first
      const currentBookingResponse = await ApiService.getMyBookings();
      if (currentBookingResponse.success && currentBookingResponse.data.bookings.length > 0) {
        const activeBooking = currentBookingResponse.data.bookings.find(
          (booking: any) => booking.bookingStatus === 'active' || booking.bookingStatus === 'reserved'
        );
        if (activeBooking) {
          const currentBooking = activeBooking;
        const statusText = currentBooking.bookingStatus === 'reserved' ? 'reserved' : 'active';
        Alert.alert(
          'Current Booking',
          `You already have a ${statusText} booking at ${currentBooking.parkingArea?.name || 'Unknown Location'} (Spot ${currentBooking.parkingSlot?.spotNumber || 'Unknown'}).\n\nPlease complete or cancel your current booking before making a new one.`,
          [
            { text: 'OK', style: 'default' }
          ]
        );
        return;
        }
      }
      
      // Get all spots in the area, then filter by vehicle type
      const vehicleType = selectedVehicleForParking.vehicle_type;
      console.log('🚗 Using selected vehicle type:', vehicleType);
      
      const response = await ApiService.getParkingSpots(area.id, vehicleType);
      if (response.success && response.data.spots.length > 0) {
        // Automatically select the first available spot
        const assignedSpot = response.data.spots[0];
        setAssignedSlot(assignedSpot.spot_number);
        setAssignedSpotDetails(assignedSpot);
        setIsBookingModalVisible(true);
      } else {
        const vehicleTypeName = vehicleType ? `${vehicleType} ` : '';
        Alert.alert(
          'No Spots Available', 
          `No ${vehicleTypeName}parking spots are currently available in this area. Please try another area.`
        );
      }
    } catch (error) {
      console.error('Error fetching parking spots:', error);
      Alert.alert('Error', 'Failed to load parking spots');
    } finally {
      setIsLoadingParkingSpots(false);
    }
  };

  // Handle parking spot booking
  const handleBookParkingSpot = async (spot: any) => {
    try {
      // Double-check for current booking before booking
      const currentBookingResponse = await ApiService.getMyBookings();
      if (currentBookingResponse.success && currentBookingResponse.data.bookings.length > 0) {
        const activeBooking = currentBookingResponse.data.bookings.find(
          (booking: any) => booking.bookingStatus === 'active' || booking.bookingStatus === 'reserved'
        );
        if (activeBooking) {
          const currentBooking = activeBooking;
        const statusText = currentBooking.bookingStatus === 'reserved' ? 'reserved' : 'active';
        Alert.alert(
          'Current Booking',
          `You already have a ${statusText} booking at ${currentBooking.parkingArea?.name || 'Unknown Location'} (Spot ${currentBooking.parkingSlot?.spotNumber || 'Unknown'}).\n\nPlease complete or cancel your current booking before making a new one.`,
          [
            { text: 'OK', style: 'default' }
          ]
        );
        setIsBookingModalVisible(false);
        return;
        }
      }
      
      const response = await ApiService.bookParkingSpot(
        selectedVehicleForParking.id,
        spot.id,
        selectedParkingArea.id
      );
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Parking spot booked successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to ActiveParkingScreen with booking details
                showLoading('Loading parking session...');
                router.push({
                  pathname: '/screens/ActiveParkingScreen',
                  params: {
                    reservationId: response.data.reservationId,
                    sessionId: response.data.reservationId
                  }
                });
                setTimeout(() => hideLoading(), 300);
                setIsBookingModalVisible(false);
                setSelectedVehicleForParking(null);
                setSelectedParkingArea(null);
                setParkingSpots([]);
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
    }
  };


  const handleCloseModal = () => {
    setIsModalVisible(false);
  };

  const handleSelectParkingArea = (area: string) => {
    setIsModalVisible(false);
    setSelectedArea(area);
    
    // Generate a random parking slot ID based on the area
    if (area === 'fpa') {
      setAssignedSlot('FPA-A-042');
    } else if (area === 'maincampus') {
      setAssignedSlot('MC-B-100');
    }
    
    // Show the booking modal after a short delay
    setTimeout(() => {
      setIsBookingModalVisible(true);
    }, 300);
  };

  const handleCloseBookingModal = () => {
    setIsBookingModalVisible(false);
    setSelectedArea('');
    setAssignedSlot('');
    setSelectedVehicleForParking(null);
    setSelectedParkingArea(null);
    setAssignedSpotDetails(null);
  };

  const handleBookNow = async () => {
    console.log('🎯 handleBookNow called');
    console.log('🎯 assignedSpotDetails:', assignedSpotDetails);
    console.log('🎯 selectedVehicleForParking:', selectedVehicleForParking);
    console.log('🎯 selectedParkingArea:', selectedParkingArea);
    
    if (!assignedSpotDetails || !selectedVehicleForParking || !selectedParkingArea) {
      console.log('❌ Missing booking information');
      Alert.alert('Error', 'Missing booking information');
      return;
    }

    try {
      console.log('🚀 Calling ApiService.bookParkingSpot with:', {
        vehicleId: selectedVehicleForParking.id,
        spotId: assignedSpotDetails.id,
        areaId: selectedParkingArea.id
      });
      
      const response = await ApiService.bookParkingSpot(
        selectedVehicleForParking.id,
        assignedSpotDetails.id,
        selectedParkingArea.id
      );
      
      console.log('🎯 Booking response:', response);
      
      if (response.success) {
        const bookingDetails = response.data.bookingDetails;
        Alert.alert(
          'Success',
          'Parking spot booked successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to ActiveParkingScreen with complete booking details
                showLoading('Loading parking session...', '/screens/ActiveParkingScreen');
                router.push({
                  pathname: '/screens/ActiveParkingScreen',
                  params: {
                    sessionId: bookingDetails.reservationId,
                    vehicleId: selectedVehicleForParking.id,
                    vehiclePlate: bookingDetails.vehiclePlate,
                    vehicleType: bookingDetails.vehicleType,
                    vehicleBrand: bookingDetails.vehicleBrand,
                    areaName: bookingDetails.areaName,
                    areaLocation: bookingDetails.areaLocation,
                    spotNumber: bookingDetails.spotNumber,
                    spotType: bookingDetails.spotType,
                    startTime: bookingDetails.startTime,
                    status: bookingDetails.status
                  }
                });
                setTimeout(() => hideLoading(), 300);
                setIsBookingModalVisible(false);
                setSelectedVehicleForParking(null);
                setSelectedParkingArea(null);
                setAssignedSpotDetails(null);
                setAssignedSlot('');
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
    }
  };

  const handleBookParking = (area: any) => {
    setSelectedParkingArea(area);
    setIsVehicleSelectionModalVisible(true);
  };

  const handleBookFrequentSpot = async (spot: any) => {
    console.log('🎯 handleBookFrequentSpot called with spot:', spot);
    
    // Store the selected spot for booking
    setSelectedSpotForBooking(spot);
    console.log('✅ selectedSpotForBooking set to:', spot);
    
    try {
      let areasToSearch = parkingAreas;
      
      // Load parking areas if not already loaded
      if (!parkingAreas || parkingAreas.length === 0) {
        console.log('🔄 Loading parking areas for frequent spot booking');
        const response = await ApiService.getParkingAreas();
        if (response.success && response.data?.locations) {
          areasToSearch = response.data.locations;
          setParkingAreas(response.data.locations);
        } else {
          Alert.alert('Error', 'Failed to load parking areas');
          return;
        }
      }
      
      // Find the parking area by location name
      const area = (areasToSearch || []).find(area => 
        area.name.toLowerCase().includes(spot.location_name.toLowerCase()) ||
        spot.location_name.toLowerCase().includes(area.name.toLowerCase())
      );
      
      console.log('🔍 Found parking area:', area);
      console.log('🔍 Available parking areas:', areasToSearch);
      console.log('🔍 Spot location_name:', spot.location_name);
      
      if (area) {
        setSelectedParkingArea(area);
        console.log('✅ selectedParkingArea set to:', area);
      } else {
        console.warn('⚠️ Could not find parking area, but proceeding with spot data');
        // Try to use spot data directly if area not found
        if (spot.parking_area_id) {
          console.log('📌 Using parking_area_id from spot:', spot.parking_area_id);
          // Create a minimal area object from spot data
          setSelectedParkingArea({
            id: spot.parking_area_id,
            name: spot.location_name || 'Unknown Area',
            location: spot.location_name || ''
          });
        }
      }
      
      // Show vehicle selection modal directly (even if area not found, we can still show vehicles)
      console.log('🚀 Setting isVehicleSelectionModalVisible to true');
      setIsVehicleSelectionModalVisible(true);
      console.log('✅ Modal should now be visible');
    } catch (error) {
      console.error('Error in handleBookFrequentSpot:', error);
      Alert.alert('Error', 'Failed to load parking areas');
    }
  };

  const handleCloseVehicleSelectionModal = () => {
    setIsVehicleSelectionModalVisible(false);
    setSelectedVehicle('');
    // Don't clear selectedSpotForBooking here - it might be needed for retry
    // Only clear it after successful booking or when explicitly needed
  };

  // Handlers for direct booking flow

  const handleVehicleSelectedForSpot = async (vehicleId: string) => {
    const selectedVehicle = userVehicles.find(v => v.id.toString() === vehicleId);
    if (!selectedVehicle || !selectedSpotForBooking) return;

    setSelectedVehicleForParking(selectedVehicle);
    setIsVehicleSelectionModalVisible(false);
    
    // Directly book the specific favorite spot
    await handleDirectSpotBooking(selectedVehicle, selectedSpotForBooking);
  };

  const handleDirectSpotBooking = async (vehicle: any, spot: any) => {
    console.log('🎯 handleDirectSpotBooking called with:', { vehicle, spot });
    try {
      // Check for current booking first
      const currentBookingResponse = await ApiService.getMyBookings();
      console.log('🔍 My bookings response:', JSON.stringify(currentBookingResponse, null, 2));
      console.log('🔍 Found bookings:', currentBookingResponse.data?.bookings?.length || 0);
      
      if (currentBookingResponse.success && currentBookingResponse.data.bookings.length > 0) {
        const activeBooking = currentBookingResponse.data.bookings.find(
          (booking: any) => booking.bookingStatus === 'active' || booking.bookingStatus === 'reserved'
        );
        console.log('🔍 Active booking found:', activeBooking);
        if (activeBooking) {
          const statusText = activeBooking.bookingStatus === 'reserved' ? 'reserved' : 'active';
          Alert.alert(
            'Current Booking',
            `You already have a ${statusText} booking at ${activeBooking.parkingArea?.name || 'Unknown Location'} (Spot ${activeBooking.parkingSlot?.spotNumber || 'Unknown'}).\n\nPlease complete or cancel your current booking before making a new one.`,
            [
              { text: 'OK', style: 'default' }
            ]
          );
          return;
        }
      }

      console.log('🚀 Calling ApiService.bookParkingSpot with:', {
        vehicleId: vehicle.id,
        spotId: spot.parking_spot_id,
        areaId: selectedParkingArea.id
      });
      
      const response = await ApiService.bookParkingSpot(
        vehicle.id,
        spot.parking_spot_id,
        selectedParkingArea.id
      );
      
      console.log('🎯 Booking response:', JSON.stringify(response, null, 2));
      console.log('🎯 Booking status:', response.data?.bookingDetails?.status);
      console.log('🎯 Reservation ID:', response.data?.reservationId);
      
      if (response.success) {
        Alert.alert(
          'Success',
          'Parking spot booked successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate to ActiveParkingScreen with complete booking details
                console.log('🚀 Navigating to ActiveParkingScreen with params:', {
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
                });
                
                showLoading('Loading parking session...');
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
                setTimeout(() => hideLoading(), 300);
                // Reset all states
                setSelectedSpotForBooking(null);
                setSelectedVehicleForParking(null);
                setSelectedParkingArea(null);
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
    }
  };


  const handleSelectVehicle = (vehicleId: string) => {
    console.log('🎯 Selecting vehicle ID:', vehicleId, 'Type:', typeof vehicleId);
    setSelectedVehicle(vehicleId);
    const vehicle = userVehicles.find(v => v.id.toString() === vehicleId);
    console.log('🎯 Found vehicle:', vehicle);
    if (vehicle) {
      setSelectedVehicleForParking(vehicle);
    }
  };

  const handleVehicleBookNow = async () => {
    console.log('🎯 handleVehicleBookNow called');
    console.log('🎯 selectedVehicle:', selectedVehicle);
    console.log('🎯 selectedParkingArea:', selectedParkingArea);
    console.log('🎯 selectedSpotForBooking:', selectedSpotForBooking);
    
    if (selectedVehicle && selectedParkingArea) {
      // Check if this is called from frequent spots booking flow
      if (selectedSpotForBooking) {
        console.log('🎯 Using frequent spots booking flow');
        // Use the new handler for frequent spots
        await handleVehicleSelectedForSpot(selectedVehicle);
        return;
      }
      
      console.log('🎯 Using regular parking area booking flow');
      // Original flow for regular parking area booking
      try {
        setIsLoadingParkingSpots(true);
        
        // Get the selected vehicle's type to filter compatible spots
        const vehicle = userVehicles.find(v => v.id.toString() === selectedVehicle);
        const vehicleType = vehicle?.vehicle_type;
        
        console.log('🚗 Selected vehicle ID:', selectedVehicle, 'Type:', typeof selectedVehicle);
        console.log('🚗 All user vehicles:', userVehicles);
        console.log('🚗 Vehicle IDs in array:', userVehicles.map(v => ({id: v.id, type: typeof v.id})));
        console.log('🚗 Selected vehicle object:', vehicle);
        console.log('🚗 Vehicle type:', vehicleType);
        console.log('🚗 Vehicle type from object:', vehicle?.vehicle_type);
        console.log('🚗 Parking area ID:', selectedParkingArea.id);
        
        const response = await ApiService.getParkingSpots(selectedParkingArea.id, vehicleType);
        console.log('📋 API Response:', response);
        
        if (response.success && response.data.spots.length > 0) {
          // Automatically select the first available spot
          const assignedSpot = response.data.spots[0];
          console.log('🎯 Assigned spot:', assignedSpot);
          setAssignedSlot(assignedSpot.spot_number);
          setAssignedSpotDetails(assignedSpot);
          setIsVehicleSelectionModalVisible(false);
          setIsBookingModalVisible(true);
        } else {
          const vehicleTypeName = vehicleType ? `${vehicleType} ` : '';
          Alert.alert(
            'No Spots Available', 
            `No ${vehicleTypeName}parking spots are currently available in this area. Please try another area or select a different vehicle.`
          );
        }
      } catch (error) {
        console.error('Error fetching parking spots:', error);
        Alert.alert('Error', 'Failed to fetch parking spots');
    } finally {
        setIsLoadingParkingSpots(false);
      }
    }
  };

  const handleSelectArea = (areaId: string) => {
    // Handle area selection logic
    console.log('Selecting parking area:', areaId);
  };

  // Parse SVG to extract clickable elements
  const parseSvgForClickableElements = (svgString: string) => {
    const spots: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      spotNumber?: string;
      spotId?: string;
    }> = [];
    
    try {
      // Extract viewBox to calculate relative positions
      const viewBoxMatch = svgString.match(/viewBox=["']([^"']+)["']/);
      let viewBox = { x: 0, y: 0, width: 276, height: 322 }; // Default
      if (viewBoxMatch) {
        const parts = viewBoxMatch[1].trim().split(/[\s,]+/).filter(p => p).map(Number);
        if (parts.length >= 4) {
          viewBox = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
        }
      }
      
      // Find all elements with IDs (likely parking spots)
      const idRegex = /<(\w+)[^>]*\sid=["']([^"']+)["'][^>]*(?:\/>|>)/g;
      let match;
      
      while ((match = idRegex.exec(svgString)) !== null) {
        const elementType = match[1];
        const id = match[2];
        const fullElement = match[0];
        const matchIndex = match.index;
        
        // Skip elements with "element" in their ID - these are not parking spots
        const idLower = id.toLowerCase();
        if (idLower.includes('element')) {
          continue;
        }
        
        // Check if this element is inside a road group (handle nested groups)
        const beforeMatch = svgString.substring(0, matchIndex);
        let isInRoadGroup = false;
        let accumulatedTransform: { x: number; y: number } = { x: 0, y: 0 };
        
        // Find all parent groups and check for road groups, also accumulate transforms
        let searchPos = matchIndex;
        let groupDepth = 0;
        const parentGroups: Array<{ tag: string; index: number }> = [];
        
        while (searchPos >= 0) {
          const lastGroupOpen = beforeMatch.lastIndexOf('<g', searchPos);
          const lastGroupClose = beforeMatch.lastIndexOf('</g>', searchPos);
          
          if (lastGroupOpen > lastGroupClose && lastGroupOpen >= 0) {
            const groupTagStart = lastGroupOpen;
            const groupTagEnd = beforeMatch.indexOf('>', groupTagStart) + 1;
            if (groupTagEnd > groupTagStart) {
              const groupTag = beforeMatch.substring(groupTagStart, groupTagEnd);
              parentGroups.push({ tag: groupTag, index: groupTagStart });
              
              // Check if this group is a road group
              const groupIdMatch = groupTag.match(/id=["']([^"']+)["']/i);
              const groupClassMatch = groupTag.match(/class=["']([^"']+)["']/i);
              
              if (groupIdMatch && groupIdMatch[1].toLowerCase().includes('road')) {
                isInRoadGroup = true;
                break;
              }
              if (groupClassMatch && groupClassMatch[1].toLowerCase().includes('road')) {
                isInRoadGroup = true;
                break;
              }
              
              // Accumulate transform from parent groups (for nested floors/sections)
              const transformMatch = groupTag.match(/transform=["']translate\(([^)]+)\)["']/);
              if (transformMatch) {
                const coords = transformMatch[1].split(/[,\s]+/).map(parseFloat);
                accumulatedTransform.x += coords[0] || 0;
                accumulatedTransform.y += coords[1] || 0;
              }
              
              searchPos = lastGroupOpen - 1;
            } else {
              break;
            }
          } else {
            break;
          }
        }
        
        // Skip road elements
        const classMatch = fullElement.match(/class=["']([^"']+)["']/i);
        const classLower = classMatch ? classMatch[1].toLowerCase() : '';
        
        if (idLower.includes('road') || classLower.includes('road') || isInRoadGroup) {
          continue;
        }
        
        // Extract coordinates based on element type
        let x = 0, y = 0, width = 0, height = 0;
        
        if (elementType === 'rect') {
          const xMatch = fullElement.match(/x=["']([^"']+)["']/);
          const yMatch = fullElement.match(/y=["']([^"']+)["']/);
          const widthMatch = fullElement.match(/width=["']([^"']+)["']/);
          const heightMatch = fullElement.match(/height=["']([^"']+)["']/);
          
          x = xMatch ? parseFloat(xMatch[1]) : 0;
          y = yMatch ? parseFloat(yMatch[1]) : 0;
          width = widthMatch ? parseFloat(widthMatch[1]) : 0;
          height = heightMatch ? parseFloat(heightMatch[1]) : 0;
        } else if (elementType === 'circle') {
          const cxMatch = fullElement.match(/cx=["']([^"']+)["']/);
          const cyMatch = fullElement.match(/cy=["']([^"']+)["']/);
          const rMatch = fullElement.match(/r=["']([^"']+)["']/);
          
          const cx = cxMatch ? parseFloat(cxMatch[1]) : 0;
          const cy = cyMatch ? parseFloat(cyMatch[1]) : 0;
          const r = rMatch ? parseFloat(rMatch[1]) : 0;
          
          x = cx - r;
          y = cy - r;
          width = r * 2;
          height = r * 2;
        } else if (elementType === 'g') {
          // For groups, find the complete group element and its children
          // Find the matching closing </g> tag
          let depth = 1;
          let pos = matchIndex + fullElement.length;
          let groupEnd = -1;
          
          while (pos < svgString.length && depth > 0) {
            const nextOpen = svgString.indexOf('<g', pos);
            const nextClose = svgString.indexOf('</g>', pos);
            
            if (nextClose === -1) break;
            
            if (nextOpen !== -1 && nextOpen < nextClose) {
              depth++;
              pos = nextOpen + 2;
            } else {
              depth--;
              if (depth === 0) {
                groupEnd = nextClose + 4;
                break;
              }
              pos = nextClose + 4;
            }
          }
          
          if (groupEnd === -1) {
            // Couldn't find closing tag, skip
            continue;
          }
          
          const groupContent = svgString.substring(matchIndex, groupEnd);
          
          // Check for transform on the group and combine with accumulated parent transforms
          const transformMatch = fullElement.match(/transform=["']translate\(([^)]+)\)["']/);
          let tx = accumulatedTransform.x;
          let ty = accumulatedTransform.y;
          if (transformMatch) {
            const coords = transformMatch[1].split(/[,\s]+/).map(parseFloat);
            tx += coords[0] || 0;
            ty += coords[1] || 0;
          }
          
          // Look for rect elements inside the group - find the largest one (likely the main parking spot)
          // Also handle nested groups within this group (for sections/floors)
          type RectInfo = { x: number; y: number; width: number; height: number; area: number };
          let largestRect: RectInfo | null = null;
          
          // Extract inner content of the group (without the opening/closing tags) for processing
          const groupTagEndPos = matchIndex + fullElement.length;
          const innerGroupContent = svgString.substring(groupTagEndPos, groupEnd - 4);
          
          // Function to recursively find rects in nested groups
          // Add depth limit to prevent infinite recursion
          const findRectsInContent = (content: string, parentTx: number, parentTy: number, depth: number = 0): void => {
            // Safety: prevent infinite recursion (max depth of 10 levels)
            if (depth > 10) {
              console.warn('⚠️ Maximum recursion depth reached in findRectsInContent');
              return;
            }
            
            // Safety: prevent processing empty or too large content
            if (!content || content.length > 100000) {
              return;
            }
            
            // Find all rects in content (including nested ones - we'll filter by group depth later if needed)
            const rectRegex = /<rect[^>]*>/g;
            const rectMatches: RegExpExecArray[] = [];
            let rectMatch;
            
            // Collect all rect matches first
            rectRegex.lastIndex = 0; // Reset regex
            while ((rectMatch = rectRegex.exec(content)) !== null) {
              rectMatches.push(rectMatch);
            }
            
            // Process found rects
            for (const match of rectMatches) {
              const rectElement = match[0];
              const rxMatch = rectElement.match(/x=["']([^"']+)["']/);
              const ryMatch = rectElement.match(/y=["']([^"']+)["']/);
              const rWidthMatch = rectElement.match(/width=["']([^"']+)["']/);
              const rHeightMatch = rectElement.match(/height=["']([^"']+)["']/);
              
              if (rxMatch && ryMatch && rWidthMatch && rHeightMatch) {
                const rx = parseFloat(rxMatch[1]);
                const ry = parseFloat(ryMatch[1]);
                const rw = parseFloat(rWidthMatch[1]);
                const rh = parseFloat(rHeightMatch[1]);
                
                if (!isNaN(rx) && !isNaN(ry) && !isNaN(rw) && !isNaN(rh) && rw > 0 && rh > 0) {
                  const area = rw * rh;
                  // Keep the largest rect (this represents the main parking spot area)
                  if (!largestRect || area > largestRect.area) {
                    largestRect = {
                      x: rx + parentTx,
                      y: ry + parentTy,
                      width: rw,
                      height: rh,
                      area: area
                    };
                  }
                }
              }
            }
            
            // Also check nested groups (for floors/sections) - but limit recursion
            // Use indexOf instead of regex to avoid regex state issues
            const processedGroups = new Set<number>(); // Track processed group start positions
            let groupCount = 0;
            const maxGroups = 50; // Limit number of groups to process
            let searchStart = 0;
            
            while (groupCount < maxGroups && searchStart < content.length) {
              const groupOpenPos = content.indexOf('<g', searchStart);
              if (groupOpenPos === -1) break;
              
              // Skip if we've already processed this group
              if (processedGroups.has(groupOpenPos)) {
                searchStart = groupOpenPos + 2;
                continue;
              }
              processedGroups.add(groupOpenPos);
              
              const groupTagEnd = content.indexOf('>', groupOpenPos);
              if (groupTagEnd === -1) {
                searchStart = groupOpenPos + 2;
                continue;
              }
              
              const nestedGroupTag = content.substring(groupOpenPos, groupTagEnd + 1);
              
              // Find matching closing tag
              let nestedDepth = 1;
              let nestedPos = groupTagEnd;
              let nestedGroupEnd = -1;
              
              while (nestedPos < content.length && nestedDepth > 0) {
                const nextOpen = content.indexOf('<g', nestedPos);
                const nextClose = content.indexOf('</g>', nestedPos);
                
                if (nextClose === -1) break;
                
                if (nextOpen !== -1 && nextOpen < nextClose) {
                  nestedDepth++;
                  nestedPos = nextOpen + 2;
                } else {
                  nestedDepth--;
                  if (nestedDepth === 0) {
                    nestedGroupEnd = nextClose + 4;
                    break;
                  }
                  nestedPos = nextClose + 4;
                }
              }
              
              if (nestedGroupEnd > groupOpenPos && nestedGroupEnd <= content.length) {
                // Extract inner content (without the group tags) to prevent re-processing
                const innerContent = content.substring(groupTagEnd + 1, nestedGroupEnd - 4);
                
                // Only process if inner content is not empty
                // Remove the length check that was too restrictive - just check it's not the same
                if (innerContent && innerContent.trim().length > 0) {
                  const nestedTransformMatch = nestedGroupTag.match(/transform=["']translate\(([^)]+)\)["']/);
                  let nestedTx = parentTx;
                  let nestedTy = parentTy;
                  
                  if (nestedTransformMatch) {
                    const nestedCoords = nestedTransformMatch[1].split(/[,\s]+/).map(parseFloat);
                    nestedTx += nestedCoords[0] || 0;
                    nestedTy += nestedCoords[1] || 0;
                  }
                  
                  // Recursively search nested groups with increased depth
                  findRectsInContent(innerContent, nestedTx, nestedTy, depth + 1);
                  groupCount++;
                }
                
                // Move search position past this group to avoid re-processing
                searchStart = nestedGroupEnd;
              } else {
                // If we couldn't find the closing tag, skip this group
                searchStart = groupTagEnd + 1;
              }
            }
          };
          
          // Process the inner content of the group (without the group tags themselves)
          findRectsInContent(innerGroupContent, tx, ty, 0);
          
          // Also look for path elements in the group and calculate bounding box (including nested)
          const pathRegex = /<path[^>]*d=["']([^"']+)["'][^>]*>/g;
          let pathMatch;
          let pathMinX = Infinity, pathMinY = Infinity, pathMaxX = -Infinity, pathMaxY = -Infinity;
          let foundPath = false;
          
          // Reset regex lastIndex
          pathRegex.lastIndex = 0;
          while ((pathMatch = pathRegex.exec(groupContent)) !== null) {
            const pathData = pathMatch[1];
            // Parse path data to get bounding box (simplified - handles M, L, H, V commands)
            const coords: number[] = [];
            const numbers = pathData.match(/[-+]?[0-9]*\.?[0-9]+/g);
            if (numbers) {
              numbers.forEach(num => {
                const val = parseFloat(num);
                if (!isNaN(val)) coords.push(val);
              });
              
              // Get min/max from coordinates
              if (coords.length >= 2) {
                for (let i = 0; i < coords.length; i += 2) {
                  if (i + 1 < coords.length) {
                    const px = coords[i] + tx;
                    const py = coords[i + 1] + ty;
                    pathMinX = Math.min(pathMinX, px);
                    pathMinY = Math.min(pathMinY, py);
                    pathMaxX = Math.max(pathMaxX, px);
                    pathMaxY = Math.max(pathMaxY, py);
                    foundPath = true;
                  }
                }
              }
            }
          }
          
          // Use the largest rect if found, otherwise use path bounds, otherwise fallback
          if (largestRect) {
            x = (largestRect as RectInfo).x;
            y = (largestRect as RectInfo).y;
            width = (largestRect as RectInfo).width;
            height = (largestRect as RectInfo).height;
          } else if (foundPath) {
            x = pathMinX;
            y = pathMinY;
            width = pathMaxX - pathMinX;
            height = pathMaxY - pathMinY;
          } else {
            // Fallback: try transform only with estimated size based on viewBox
            if (transformMatch) {
              x = tx;
              y = ty;
              // Use reasonable default size - adjust based on typical parking spot sizes
              width = viewBox.width / 5; // About 1/5 of viewBox width
              height = viewBox.height / 10; // About 1/10 of viewBox height
            } else {
              continue; // Skip if no transform and no rects/paths found
            }
          }
        }
        
        // Extract spot number from ID (handle various formats)
        // Formats: "F1-A-1", "A-1", "spot-1", "parking-1", "section-a-spot-1", etc.
        let spotNumber = id;
        
        // Try different patterns
        // Pattern 1: F{floor}-{section}-{number} or {section}-{number}
        const sectionSpotMatch = id.match(/(?:F\d+-)?([A-Z]+)-(\d+)/i);
        if (sectionSpotMatch) {
          spotNumber = sectionSpotMatch[2]; // Use just the number part
        } else {
          // Pattern 2: spot-{number} or parking-{number}
          const spotMatch = id.match(/(?:spot|parking)[-_]?(\d+)/i);
          if (spotMatch) {
            spotNumber = spotMatch[1];
          } else {
            // Pattern 3: Any number in the ID
            const numMatch = id.match(/(\d+)/);
            if (numMatch) {
              spotNumber = numMatch[1];
            }
          }
        }
        
        // Only add if we have valid coordinates and reasonable size
        if (width > 0 && height > 0 && !isNaN(width) && !isNaN(height)) {
          console.log(`📍 Found spot: ${id} (${spotNumber}) - x:${x}, y:${y}, w:${width}, h:${height}`);
          spots.push({
            id,
            x,
            y,
            width,
            height,
            spotNumber,
            spotId: id,
          });
        } else {
          console.log(`⚠️ Skipping spot ${id} - invalid dimensions: x:${x}, y:${y}, w:${width}, h:${height}`);
        }
      }
      
      // Also look for text elements that might indicate spot numbers
      const textRegex = /<text[^>]*>([^<]+)<\/text>/g;
      while ((match = textRegex.exec(svgString)) !== null) {
        const textContent = match[1].trim();
        const textElement = match[0];
        
        if (/^\d+$/.test(textContent)) {
          const xMatch = textElement.match(/x=["']([^"']+)["']/);
          const yMatch = textElement.match(/y=["']([^"']+)["']/);
          
          if (xMatch && yMatch) {
            const x = parseFloat(xMatch[1]);
            const y = parseFloat(yMatch[1]);
            
            const existingSpot = spots.find(s => 
              Math.abs(s.x - x) < 20 && Math.abs(s.y - y) < 20
            );
            
            if (!existingSpot) {
              spots.push({
                id: `text-spot-${textContent}`,
                x: x - 15,
                y: y - 10,
                width: 30,
                height: 20,
                spotNumber: textContent,
                spotId: `spot-${textContent}`,
              });
            } else {
              existingSpot.spotNumber = textContent;
            }
          }
        }
      }
      
      console.log(`✅ Parsed ${spots.length} clickable spots from SVG`);
    } catch (error) {
      console.error('❌ Error parsing SVG:', error);
    }
    
    return spots;
  };

  // Load spot statuses from backend
  const loadSpotStatuses = async (areaId: number) => {
    try {
      console.log('📊 Loading spot statuses for area:', areaId);
      const response = await ApiService.getParkingSpotsStatus(areaId);
      
      if (response.success && response.data.spots) {
        // Create a Map for quick lookup by spot_number
        const newStatusMap = new Map();
        response.data.spots.forEach((spot: any) => {
          // Store by spot_number (primary key)
          newStatusMap.set(spot.spot_number, spot);
          // Also store by ID for fallback matching
          newStatusMap.set(spot.id.toString(), spot);
        });
        setSpotStatuses(newStatusMap);
        console.log(`✅ Loaded ${newStatusMap.size / 2} spot statuses`);
      } else {
        console.log('⚠️ No spot statuses found');
        setSpotStatuses(new Map());
      }
    } catch (error) {
      console.error('❌ Error loading spot statuses:', error);
      setSpotStatuses(new Map());
    }
  };

  // Handle spot press
  const handleSpotPress = (spot: any) => {
    // Try multiple matching strategies for flexibility
    let spotStatus = spotStatuses.get(spot.spotNumber || '') || spotStatuses.get(spot.id || '');
    
    // If still not found, try matching without floor prefix
    if (!spotStatus && spot.id) {
      const idWithoutFloor = spot.id.replace(/^F\d+-/i, ''); // Remove "F2-" prefix
      spotStatus = spotStatuses.get(idWithoutFloor);
    }
    
    const status = spotStatus?.status || 'unknown';
    const spotType = spotStatus?.spot_type || 'N/A';
    const section = spotStatus?.section_name || 'N/A';
    const isUserBooked = spotStatus?.is_user_booked === true || (typeof spotStatus?.is_user_booked === 'number' && spotStatus.is_user_booked === 1);
    
    let statusMessage = `Spot: ${spot.spotNumber || spot.id}\nStatus: ${status.toUpperCase()}\nType: ${spotType}\nSection: ${section}`;
    if (isUserBooked) {
      statusMessage += '\n\n🔵 Your Booked Spot';
    }
    
    Alert.alert(
      'Parking Spot',
      statusMessage,
      [{ text: 'OK' }]
    );
  };

  // Handle parking area card press - show parking layout
  const handleAreaCardPress = async (area: any) => {
    setSelectedAreaForSpots(area);
    setIsParkingSpotsModalVisible(true);
    setIsLoadingSvg(true);
    setSvgContent('');
    
    try {
      // Load spot statuses in parallel with SVG
      loadSpotStatuses(area.id);
      
      // Load parking layout SVG
      const layoutResponse = await ApiService.getParkingAreaLayout(area.id);
      if (layoutResponse.success && layoutResponse.data.hasLayout && layoutResponse.data.layoutSvg) {
        const svg = layoutResponse.data.layoutSvg;
        setSvgContent(svg);
        
        // Parse SVG for clickable elements
        const spots = parseSvgForClickableElements(svg);
        setClickableSpots(spots);
        
        // Calculate aspect ratio from SVG
        const viewBoxMatch = svg.match(/viewBox=["']([^"']+)["']/);
        const widthMatch = svg.match(/<svg[^>]*width=["']([^"']+)["']/);
        const heightMatch = svg.match(/<svg[^>]*height=["']([^"']+)["']/);
        
        let aspectRatio = 1.2; // Default
        if (viewBoxMatch) {
          const viewBox = viewBoxMatch[1].split(/\s+/);
          if (viewBox.length >= 4) {
            const viewBoxWidth = parseFloat(viewBox[2]);
            const viewBoxHeight = parseFloat(viewBox[3]);
            if (viewBoxWidth > 0 && viewBoxHeight > 0) {
              aspectRatio = viewBoxHeight / viewBoxWidth;
            }
          }
        } else if (widthMatch && heightMatch) {
          const width = parseFloat(widthMatch[1]);
          const height = parseFloat(heightMatch[1]);
          if (width > 0 && height > 0) {
            aspectRatio = height / width;
          }
        }
        setSvgAspectRatio(aspectRatio);
      } else {
        console.log('No layout available for this area');
        setSvgContent('');
        setClickableSpots([]);
      }
    } catch (error) {
      console.error('Error fetching parking layout:', error);
      setSvgContent('');
    } finally {
      setIsLoadingSvg(false);
    }
  };

  const handleCloseParkingSpotsModal = () => {
    setIsParkingSpotsModalVisible(false);
    setSelectedAreaForSpots(null);
    setParkingSpots([]);
    setSvgContent('');
    setIsLoadingSvg(false);
    setClickableSpots([]);
    setSpotStatuses(new Map());
  };

  // Handle "See all spots" button press
  const handleSeeAllSpots = () => {
    // Ensure parking areas are loaded
    if (parkingAreas.length === 0) {
      fetchParkingAreas().then(() => {
        setIsSeeAllSpotsModalVisible(true);
      });
    } else {
      setIsSeeAllSpotsModalVisible(true);
    }
  };

  // Handle area selection in "See all spots" modal
  const handleAreaSelectForSeeAll = async (area: any) => {
    setIsAreaDropdownVisible(false);
    setSelectedAreaForSeeAll(area);
    try {
      setIsLoadingParkingSpots(true);
      // Don't clear spots immediately - keep previous spots visible while loading
      const response = await ApiService.getParkingSpots(area.id);
      if (response.success) {
        setSpotsForSeeAll(response.data.spots);
      } else {
        Alert.alert('Error', 'Failed to load parking spots');
        setSpotsForSeeAll([]);
      }
    } catch (error) {
      console.error('Error fetching parking spots:', error);
      Alert.alert('Error', 'Failed to load parking spots');
      setSpotsForSeeAll([]);
    } finally {
      setIsLoadingParkingSpots(false);
    }
  };

  const handleCloseSeeAllSpotsModal = () => {
    setIsSeeAllSpotsModalVisible(false);
    setIsAreaDropdownVisible(false);
    setSelectedAreaForSeeAll(null);
    setSpotsForSeeAll([]);
  };

  const handleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxScrollX = contentSize.width - layoutMeasurement.width;
    const scrollPercentage = maxScrollX > 0 ? contentOffset.x / maxScrollX : 0;
    scrollProgress.setValue(scrollPercentage);
  };

  const handleVehicleScroll = (event: any) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxScrollX = contentSize.width - layoutMeasurement.width;
    const scrollPercentage = maxScrollX > 0 ? contentOffset.x / maxScrollX : 0;
    vehicleScrollProgress.setValue(Math.min(scrollPercentage, 1));
  };



  // Header Profile Picture component
  const HeaderProfilePicture = () => (
    <TouchableOpacity onPress={() => {
      showLoading();
      router.push('/ProfileScreen');
      setTimeout(() => hideLoading(), 300);
    }}>
      <ProfilePicture size={32} />
    </TouchableOpacity>
  );

  return (
    <View style={homeScreenStyles.container}>
      <StatusBar barStyle={isDarkMode ? "light-content" : "dark-content"} backgroundColor={colors.background} translucent={true} />
      <SharedHeader 
        title="TapPark" 
        rightComponent={<HeaderProfilePicture />}
      />

      {/* ScrollView Container - targeted for loading overlay */}
      <View style={homeScreenStyles.scrollViewContainer}>
        <ScrollView style={homeScreenStyles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Slogan */}
        <View style={homeScreenStyles.sloganSection}>
          <Text style={homeScreenStyles.parkingText}>PARKING</Text>
          <View style={homeScreenStyles.madeEasyContainer}>
            <Text style={homeScreenStyles.madeText}>made </Text>
            <Text style={homeScreenStyles.easyText}>easy!</Text>
          </View>
        </View>

        {/* Registered Vehicle Section */}
        <View style={homeScreenStyles.section}>
          <View style={homeScreenStyles.sectionHeader}>
            <SvgXml xml={lineGraphIconSvg} width={16} height={16} />
            <Text style={homeScreenStyles.sectionTitle}>Registered Vehicle</Text>
          </View>
          
          {isLoadingVehicles ? (
            <View style={homeScreenStyles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={homeScreenStyles.loadingText}>Loading vehicles...</Text>
            </View>
          ) : vehicles.length === 0 ? (
            <View style={homeScreenStyles.emptyStateContainer}>
              <Text style={homeScreenStyles.emptyStateText}>No vehicles registered yet</Text>
              <Text style={homeScreenStyles.emptyStateSubtext}>Add your first vehicle to get started</Text>
              <TouchableOpacity style={homeScreenStyles.addVehicleButton} onPress={handleAddVehicle}>
                <Text style={homeScreenStyles.addVehicleButtonText}>Add Vehicle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={homeScreenStyles.horizontalScroll}
              contentContainerStyle={homeScreenStyles.horizontalScrollContent}
              onScroll={handleVehicleScroll}
              scrollEventThrottle={16}
              onLayout={(event) => {
                // Store the container width when layout is measured
                const layoutWidth = event.nativeEvent.layout.width;
                vehicleScrollViewWidth.current = layoutWidth;
                console.log('🚗 Vehicle ScrollView layout width:', layoutWidth);
                // Re-check scrollability if we already have content width
                if (layoutWidth > 0 && vehicleContentWidth.current > 0) {
                  const canScroll = vehicleContentWidth.current > layoutWidth + 20;
                  console.log('🚗 Vehicle re-check after layout:', { 
                    contentWidth: vehicleContentWidth.current, 
                    containerWidth: layoutWidth, 
                    canScroll 
                  });
                  setCanScrollVehicles(canScroll);
                }
              }}
              onContentSizeChange={(contentWidth) => {
                // Store content width
                vehicleContentWidth.current = contentWidth;
                // Check if content width exceeds container width
                const containerWidth = vehicleScrollViewWidth.current || screenWidth;
                // Add small threshold (20px) to account for padding/margins and ensure we detect overflow
                const canScroll = contentWidth > containerWidth + 20;
                console.log('🚗 Vehicle content check:', { 
                  contentWidth, 
                  containerWidth, 
                  canScroll, 
                  vehicleCount: vehicles.length,
                  threshold: containerWidth + 20,
                  screenWidth
                });
                setCanScrollVehicles(canScroll);
              }}
            >
              {(vehicles || []).map((vehicle, index) => (
                <TouchableOpacity key={vehicle.id || index} style={homeScreenStyles.vehicleCard} onPress={() => handleVehicleCardPress(vehicle)}>
                  <View style={homeScreenStyles.vehicleIconContainer}>
                    <SvgXml 
                      xml={getVehicleIcon(vehicle.vehicle_type)} 
                      width={getResponsiveSize(55)} 
                      height={getResponsiveSize(vehicle.vehicle_type.toLowerCase() === 'car' ? 33 : 40)} 
                    />
                  </View>
                  <Text style={homeScreenStyles.vehicleLabel}>Brand and Model</Text>
                  <Text style={homeScreenStyles.vehicleValue}>{vehicle.brand || 'N/A'} - N/A</Text>
                  <Text style={homeScreenStyles.vehicleLabel}>Display Name</Text>
                  <Text style={homeScreenStyles.vehicleValue}>{vehicle.vehicle_type}</Text>
                  <Text style={homeScreenStyles.vehicleLabel}>Plate Number</Text>
                  <Text style={homeScreenStyles.vehicleValue}>{vehicle.plate_number}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Scroll Indicator for Registered Vehicles - Only show when 3+ vehicles and content overflows */}
        {!isLoadingVehicles && vehicles.length >= 3 && canScrollVehicles && (
          <View style={homeScreenStyles.progressSection}>
            <View style={homeScreenStyles.progressContainer}>
              <View style={homeScreenStyles.progressTrack}>
                <Animated.View 
                  style={[
                    homeScreenStyles.scrollHandle,
                    {
                      left: vehicleScrollProgress.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0, Math.max(0, screenWidth - 40 - getResponsiveSize(20))],
                        extrapolate: 'clamp',
                      }),
                    }
                  ]}
                />
              </View>
            </View>
          </View>
        )}

        {/* Frequently Used Parking Space Section */}
        <View style={homeScreenStyles.section}>
          <View style={homeScreenStyles.sectionHeader}>
            <SvgXml xml={profitIconSvg} width={16} height={16} />
            <Text style={homeScreenStyles.sectionTitle}>Frequently used parking space</Text>
          </View>
          
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={homeScreenStyles.horizontalScroll}
            contentContainerStyle={homeScreenStyles.horizontalScrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onLayout={(event) => {
              // Store the container width when layout is measured
              const layoutWidth = event.nativeEvent.layout.width;
              frequentSpotsScrollViewWidth.current = layoutWidth;
              console.log('📍 Frequent Spots ScrollView layout width:', layoutWidth);
              // Re-check scrollability if we already have content width
              if (layoutWidth > 0 && frequentSpotsContentWidth.current > 0) {
                const canScroll = frequentSpotsContentWidth.current > layoutWidth + 20;
                console.log('📍 Frequent spots re-check after layout:', { 
                  contentWidth: frequentSpotsContentWidth.current, 
                  containerWidth: layoutWidth, 
                  canScroll 
                });
                setCanScrollFrequentSpots(canScroll);
              }
            }}
            onContentSizeChange={(contentWidth) => {
              // Store content width
              frequentSpotsContentWidth.current = contentWidth;
              // Check if content width exceeds container width
              const containerWidth = frequentSpotsScrollViewWidth.current || screenWidth;
              // Add small threshold (20px) to account for padding/margins and ensure we detect overflow
              const canScroll = contentWidth > containerWidth + 20;
              console.log('📍 Frequent spots content check:', { 
                contentWidth, 
                containerWidth, 
                canScroll, 
                spotsCount: frequentSpots.length,
                threshold: containerWidth + 20,
                screenWidth
              });
              setCanScrollFrequentSpots(canScroll);
            }}
          >
            {isLoadingFrequentSpots ? (
              <View style={homeScreenStyles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={homeScreenStyles.loadingText}>Loading frequent spots...</Text>
              </View>
            ) : frequentSpots.length === 0 ? (
              <View style={homeScreenStyles.emptyContainer}>
                <Text style={homeScreenStyles.emptyText}>No frequent parking spots found</Text>
                <Text style={homeScreenStyles.emptySubtext}>Your frequently used spots will appear here</Text>
              </View>
            ) : (
              (frequentSpots || []).map((spot, index) => (
                <View key={`${spot.parking_spot_id}-${index}`} style={homeScreenStyles.parkingCard}>
                  <View style={homeScreenStyles.locationHeader}>
                    <View style={homeScreenStyles.locationTextContainer}>
                      <Text style={homeScreenStyles.parkingLocation}>{spot.location_name.toUpperCase()}</Text>
                      <Text style={homeScreenStyles.parkingSpotId}>{generateSpotId(spot.location_name, spot.spot_number)}</Text>
                    </View>
                    <Image source={getLocationLogo(spot.location_name)} style={homeScreenStyles.logoIcon} />
                  </View>
                  <Text style={homeScreenStyles.parkingLabel}>Time Slot</Text>
                  <View style={homeScreenStyles.timeSlotContainer}>
                    <Text style={homeScreenStyles.parkingTime}>
                      {spot.current_reservation 
                        ? `${formatTime(spot.current_reservation.start_time)} - ${formatTime(spot.current_reservation.end_time || new Date(Date.now() + 2*60*60*1000).toISOString())}`
                        : 'Available Now'
                      }
                    </Text>
                  </View>
                  <Text style={homeScreenStyles.parkingPrice}>Used {spot.usage_count} times</Text>
                  <View style={homeScreenStyles.parkingStatusContainer}>
                    <Text style={spot.status === 'AVAILABLE' ? homeScreenStyles.availableStatus : homeScreenStyles.occupiedStatus}>
                      {spot.status}
                    </Text>
                    <TouchableOpacity 
                      style={homeScreenStyles.bookButton}
                      onPress={() => handleBookFrequentSpot(spot)}
                    >
                      <Text style={homeScreenStyles.bookButtonText}>BOOK</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

          </ScrollView>

          {/* See All Spots Button */}
          <TouchableOpacity style={homeScreenStyles.seeAllButton} onPress={handleSeeAllSpots}>
            <SvgXml xml={doubleUpIconSvg} width={16} height={16} />
            <Text style={homeScreenStyles.seeAllText}>See all spots</Text>
          </TouchableOpacity>
        </View>

        {/* Scroll Indicator Section - Only show when 2+ frequent spots and content overflows */}
        {!isLoadingFrequentSpots && frequentSpots.length >= 2 && canScrollFrequentSpots && (
          <View style={homeScreenStyles.progressSection}>
            <View style={homeScreenStyles.progressContainer}>
              <View style={homeScreenStyles.progressTrack}>
              <Animated.View 
                style={[
                    homeScreenStyles.scrollHandle,
                  {
                    left: scrollProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, Math.max(0, screenWidth - 40 - getResponsiveSize(20))], // Account for padding (20px each side) and handle width
                      extrapolate: 'clamp',
                    }),
                  }
                ]}
              />
            </View>
          </View>
        </View>
        )}

        {/* Select Parking Area Section */}
        <View style={homeScreenStyles.section}>
          <View style={homeScreenStyles.sectionHeader}>
            <SvgXml xml={checkboxIconSvg} width={16} height={16} />
            <Text style={homeScreenStyles.sectionTitle}>Select Parking Area</Text>
          </View>
          
          {isLoadingParkingAreas ? (
            <View style={homeScreenStyles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={homeScreenStyles.loadingText}>Loading parking areas...</Text>
            </View>
          ) : parkingAreas.length === 0 ? (
            <View style={homeScreenStyles.emptyStateContainer}>
              <Text style={homeScreenStyles.emptyStateText}>No parking areas available</Text>
            </View>
          ) : (
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={homeScreenStyles.horizontalScroll}
            contentContainerStyle={homeScreenStyles.horizontalScrollContent}
          >
              {parkingAreas.map((area) => (
            <TouchableOpacity 
                  key={area.id}
              style={homeScreenStyles.areaCard}
                  onPress={() => handleAreaCardPress(area)}
                >
                  <Text style={homeScreenStyles.areaName}>{area.name?.toUpperCase() || 'PARKING AREA'}</Text>
                  <Text style={[homeScreenStyles.areaName, { fontSize: getResponsiveFontSize(12), color: colors.textSecondary, marginTop: 4 }]}>
                    {area.available_spots || 0} / {area.total_spots || 0} spots available
                  </Text>
                  <Image 
                    source={getLocationLogo(area.name || '')} 
                    style={homeScreenStyles.areaLogoIcon} 
                  />
            </TouchableOpacity>
              ))}
          </ScrollView>
          )}
        </View>

      </ScrollView>
      </View>

      {/* Parking Booking Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={homeScreenStyles.modalOverlay}>
          <View style={homeScreenStyles.modalContainer}>
            <Text style={homeScreenStyles.modalTitle}>Book a Parking Slot</Text>
            <Text style={homeScreenStyles.modalSubtitle}>Choose a parking area:</Text>
            
            {isLoadingParkingAreas ? (
              <View style={homeScreenStyles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={homeScreenStyles.loadingText}>Loading parking areas...</Text>
              </View>
            ) : (
              <View style={homeScreenStyles.parkingAreaButtons}>
                {(parkingAreas || []).map((area) => {
                  console.log('📍 Parking Area Data:', JSON.stringify(area, null, 2));
                  return (
                  <TouchableOpacity 
                    key={area.id}
                      style={homeScreenStyles.parkingAreaButton}
                    onPress={() => handleParkingAreaSelect(area)}
                  >
                      <Text style={homeScreenStyles.parkingAreaButtonText}>{area.name}</Text>
                      <Text style={homeScreenStyles.parkingAreaLocation}>
                        {area.location || area.address || area.location_name || 'Location not available'}
                      </Text>
                  </TouchableOpacity>
                  );
                })}
              </View>
            )}
            
            <TouchableOpacity style={homeScreenStyles.closeButton} onPress={handleCloseModal}>
              <Text style={homeScreenStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Booking Confirmation Modal */}
      <Modal
        visible={isBookingModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseBookingModal}
      >
        <View style={homeScreenStyles.modalOverlay}>
          <View style={homeScreenStyles.bookingModalContainer}>
            <Text style={homeScreenStyles.bookingModalTitle}>Book a Parking Slot</Text>
            <Text style={homeScreenStyles.bookingModalText}>
              An available slot has been automatically assigned for you at {selectedParkingArea?.name}:
            </Text>
            <Text style={homeScreenStyles.assignedSlotId}>{assignedSlot}</Text>
            {assignedSpotDetails && (
              <Text style={homeScreenStyles.spotTypeText}>
                Spot Type: {assignedSpotDetails.spot_type?.charAt(0).toUpperCase() + assignedSpotDetails.spot_type?.slice(1)}
              </Text>
            )}
            
            {isLoadingParkingSpots ? (
              <View style={homeScreenStyles.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={homeScreenStyles.loadingText}>Assigning parking spot...</Text>
              </View>
            ) : (
              <TouchableOpacity style={homeScreenStyles.bookNowButton} onPress={handleBookNow}>
                <Text style={homeScreenStyles.bookNowButtonText}>Book Now</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={homeScreenStyles.closeButton} onPress={handleCloseBookingModal}>
              <Text style={homeScreenStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Vehicle Selection Modal */}
      <Modal
        visible={isVehicleSelectionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseVehicleSelectionModal}
      >
        <View style={homeScreenStyles.modalOverlay}>
          <View style={homeScreenStyles.vehicleSelectionModalContainer}>
            <View style={homeScreenStyles.vehicleModalHeader}>
              <Text style={homeScreenStyles.vehicleModalTitle}>Select Vehicle for Reservation</Text>
              <TouchableOpacity onPress={handleCloseVehicleSelectionModal}>
                <Ionicons name="close" size={24} color="#8A0000" />
              </TouchableOpacity>
            </View>
            
            <View style={homeScreenStyles.vehicleTypeInfoContainer}>
              <Text style={homeScreenStyles.vehicleTypeInfoText}>
                {selectedSpotForBooking 
                  ? `💡 Only vehicles compatible with ${selectedSpotForBooking.spot_type} spots are shown`
                  : '💡 Select a vehicle to book a parking spot'
                }
              </Text>
            </View>
            
            {getCompatibleVehicles().length === 0 ? (
              <View style={homeScreenStyles.noCompatibleVehiclesContainer}>
                <Text style={homeScreenStyles.noCompatibleVehiclesText}>
                  No vehicles compatible with this parking spot type
                </Text>
                <Text style={homeScreenStyles.noCompatibleVehiclesSubtext}>
                  Add a {selectedSpotForBooking?.spot_type || 'compatible'} vehicle to your account
                </Text>
              </View>
            ) : (
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                style={homeScreenStyles.vehicleSelectionScroll}
                contentContainerStyle={homeScreenStyles.vehicleSelectionScrollContent}
                onScroll={handleVehicleScroll}
                scrollEventThrottle={16}
              >
                {(getCompatibleVehicles() || []).map((vehicle) => (
                  <TouchableOpacity
                    key={vehicle.id}
                    style={[
                      homeScreenStyles.vehicleSelectionCard,
                      selectedVehicle === vehicle.id.toString() && homeScreenStyles.vehicleSelectionCardSelected
                    ]}
                    onPress={() => handleSelectVehicle(vehicle.id.toString())}
                  >
                    <View style={homeScreenStyles.vehicleSelectionIconContainer}>
                      <SvgXml xml={getVehicleIcon(vehicle.vehicle_type)} width={getResponsiveSize(40)} height={getResponsiveSize(40)} />
                    </View>
                    <Text style={homeScreenStyles.vehicleSelectionLabel}>Brand and Model</Text>
                    <Text style={homeScreenStyles.vehicleSelectionValue}>{vehicle.brand || 'N/A'}</Text>
                    <Text style={homeScreenStyles.vehicleSelectionLabel}>Vehicle Type</Text>
                    <Text style={homeScreenStyles.vehicleSelectionValue}>{vehicle.vehicle_type}</Text>
                    {vehicle.plate_number && (
                      <>
                        <Text style={homeScreenStyles.vehicleSelectionLabel}>Plate Number</Text>
                        <Text style={homeScreenStyles.vehicleSelectionValue}>{vehicle.plate_number}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}

            {/* Progress Indicator */}
            <View style={homeScreenStyles.vehicleSelectionProgressContainer}>
              <View style={homeScreenStyles.vehicleSelectionProgressTrack}>
                <Animated.View 
                  style={[
                    homeScreenStyles.vehicleSelectionProgressHandle,
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
                homeScreenStyles.vehicleSelectionBookNowButton,
                (!selectedVehicle || getCompatibleVehicles().length === 0) && homeScreenStyles.vehicleSelectionBookNowButtonDisabled
              ]}
              onPress={handleVehicleBookNow}
              disabled={!selectedVehicle || getCompatibleVehicles().length === 0}
            >
              <Text style={homeScreenStyles.vehicleSelectionBookNowButtonText}>
                {getCompatibleVehicles().length === 0 ? 'No Compatible Vehicles' : 'Book Now'}
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
        <View style={homeScreenStyles.modalOverlay}>
          <View style={homeScreenStyles.mismatchModalContainer}>
            <View style={homeScreenStyles.mismatchModalHeader}>
              <Text style={homeScreenStyles.mismatchModalTitle}>🚗 Vehicle Type Mismatch</Text>
              <TouchableOpacity onPress={() => setShowVehicleMismatchModal(false)}>
                <Ionicons name="close" size={24} color="#8A0000" />
              </TouchableOpacity>
            </View>
            
            <View style={homeScreenStyles.mismatchContent}>
              <Text style={homeScreenStyles.mismatchMessage}>
                Oops! There's a mismatch between your vehicle and this parking spot.
              </Text>
              
              <View style={homeScreenStyles.mismatchDetails}>
                <View style={homeScreenStyles.mismatchItem}>
                  <Text style={homeScreenStyles.mismatchLabel}>Your Vehicle:</Text>
                  <Text style={homeScreenStyles.mismatchValue}>{mismatchData?.vehicleType || 'Unknown'}</Text>
                </View>
                
                <View style={homeScreenStyles.mismatchItem}>
                  <Text style={homeScreenStyles.mismatchLabel}>Spot Type:</Text>
                  <Text style={homeScreenStyles.mismatchValue}>{mismatchData?.spotType || 'Unknown'}</Text>
                </View>
              </View>
              
              <Text style={homeScreenStyles.mismatchSuggestion}>
                💡 Try selecting a different vehicle or choose a different parking spot that matches your vehicle type.
              </Text>
            </View>
            
            <TouchableOpacity 
              style={homeScreenStyles.mismatchCloseButton}
              onPress={() => setShowVehicleMismatchModal(false)}
            >
              <Text style={homeScreenStyles.mismatchCloseButtonText}>Got it!</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Parking Spots Modal - Shows Parking Layout */}
      <Modal
        visible={isParkingSpotsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseParkingSpotsModal}
      >
        <View style={homeScreenStyles.modalOverlay}>
          <View style={[homeScreenStyles.modalContainer, { 
            maxHeight: isTablet ? screenHeight * 0.9 : screenHeight * 0.92,
            height: isTablet ? screenHeight * 0.9 : screenHeight * 0.92,
            width: isTablet ? screenWidth * 0.9 : screenWidth * 0.98,
            maxWidth: isTablet ? 900 : screenWidth * 0.98,
            padding: getResponsivePadding(20),
          }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: getResponsiveMargin(16) }}>
              <Text style={[homeScreenStyles.modalTitle, { fontSize: getResponsiveFontSize(22) }]}>
                {selectedAreaForSpots?.name || 'Parking Area'} Layout
              </Text>
              <TouchableOpacity onPress={handleCloseParkingSpotsModal}>
                <Ionicons name="close" size={getResponsiveSize(28)} color={colors.primary} />
              </TouchableOpacity>
    </View>
            
            {isLoadingSvg ? (
              <View style={[homeScreenStyles.loadingContainer, { minHeight: getResponsiveSize(300) }]}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={homeScreenStyles.loadingText}>Loading parking layout...</Text>
              </View>
            ) : svgContent ? (() => {
              // Calculate responsive SVG dimensions
              let svgWidth: number;
              let svgMaxHeight: number;
              
              if (isSmallScreen) {
                svgWidth = Math.min(screenWidth * 0.75, 400);
                svgMaxHeight = 500;
              } else if (isMediumScreen) {
                svgWidth = Math.min(screenWidth * 0.75, 450);
                svgMaxHeight = 550;
              } else if (isLargeScreen) {
                svgWidth = Math.min(screenWidth * 0.75, 500);
                svgMaxHeight = 650;
              } else if (isTablet) {
                svgWidth = Math.min(screenWidth * 0.8, 700);
                svgMaxHeight = 900;
              } else if (isLargeTablet) {
                svgWidth = Math.min(screenWidth * 0.85, 900);
                svgMaxHeight = 1200;
              } else {
                svgWidth = Math.min(screenWidth * 0.75, 500);
                svgMaxHeight = 700;
              }
              
              const svgHeight = Math.min(svgWidth * svgAspectRatio, svgMaxHeight);
              const scrollViewWidth = Math.max(svgWidth, isSmallScreen ? 350 : isTablet ? 600 : 400);
              
              return (
                <View style={{
                  width: '100%',
                  flex: 1,
                  backgroundColor: colors.backgroundSecondary || '#F8F9FA',
                  borderRadius: getResponsiveSize(12),
                  padding: getResponsivePadding(12),
                  overflow: 'hidden',
                  minHeight: getResponsiveSize(400),
                }}>
                  <ScrollView 
                    horizontal={true}
                    showsHorizontalScrollIndicator={true}
                    nestedScrollEnabled={true}
                    style={{ width: '100%', flex: 1 }}
                    contentContainerStyle={{ alignItems: 'center' }}
                  >
                    <ScrollView
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                      style={{ width: scrollViewWidth }}
                      contentContainerStyle={{ 
                        alignItems: 'center',
                        paddingVertical: getResponsivePadding(10),
                      }}
                    >
                      <View style={{ position: 'relative', width: svgWidth, height: svgHeight }}>
                        <SvgXml
                          xml={svgContent}
                          width={svgWidth}
                          height={svgHeight}
                          preserveAspectRatio="xMidYMid meet"
                        />
                        {/* Touchable overlay container for spots */}
                        <View 
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            pointerEvents: 'box-none',
                          }}
                        >
                        {clickableSpots.map((spot) => {
                          // Get the actual SVG dimensions from the SVG content
                          const svgWidthMatch = svgContent.match(/<svg[^>]*width=["']([^"']+)["']/);
                          const svgHeightMatch = svgContent.match(/<svg[^>]*height=["']([^"']+)["']/);
                          
                          // Container dimensions (what we pass to SvgXml)
                          const containerWidth = svgWidth;
                          const containerHeight = svgHeight;
                          
                          // Extract viewBox from SVG - this is the coordinate system
                          const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
                          let viewBoxX = 0;
                          let viewBoxY = 0;
                          let viewBoxWidth = 276;
                          let viewBoxHeight = 322;
                          if (viewBoxMatch) {
                            const parts = viewBoxMatch[1].trim().split(/[\s,]+/).filter(p => p).map(Number);
                            if (parts.length >= 4) {
                              viewBoxX = parts[0];
                              viewBoxY = parts[1];
                              viewBoxWidth = parts[2];
                              viewBoxHeight = parts[3];
                            }
                          }
                          
                          // Get actual SVG width/height if specified (for aspect ratio)
                          let svgIntrinsicWidth = viewBoxWidth;
                          let svgIntrinsicHeight = viewBoxHeight;
                          if (svgWidthMatch && svgHeightMatch) {
                            const w = parseFloat(svgWidthMatch[1]);
                            const h = parseFloat(svgHeightMatch[1]);
                            if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
                              svgIntrinsicWidth = w;
                              svgIntrinsicHeight = h;
                            }
                          }
                          
                          // Calculate aspect ratios
                          const viewBoxAspectRatio = viewBoxWidth / viewBoxHeight;
                          const containerAspectRatio = containerWidth / containerHeight;
                          
                          // With preserveAspectRatio="xMidYMid meet", calculate actual rendered size
                          let renderedWidth = containerWidth;
                          let renderedHeight = containerHeight;
                          
                          if (viewBoxAspectRatio > containerAspectRatio) {
                            // ViewBox is wider - fit to width
                            renderedWidth = containerWidth;
                            renderedHeight = containerWidth / viewBoxAspectRatio;
                          } else {
                            // ViewBox is taller - fit to height
                            renderedWidth = containerHeight * viewBoxAspectRatio;
                            renderedHeight = containerHeight;
                          }
                          
                          // Calculate centering offset (xMidYMid centers the content)
                          const offsetX = (containerWidth - renderedWidth) / 2;
                          const offsetY = (containerHeight - renderedHeight) / 2;
                          
                          // Calculate scale factors (viewBox units to rendered pixels)
                          const scaleX = renderedWidth / viewBoxWidth;
                          const scaleY = renderedHeight / viewBoxHeight;
                          
                          // Convert spot coordinates from viewBox space to rendered pixel space
                          // Adjust for viewBox origin
                          const spotXInViewBox = spot.x - viewBoxX;
                          const spotYInViewBox = spot.y - viewBoxY;
                          
                          // Scale to rendered pixels
                          const pixelX = spotXInViewBox * scaleX;
                          const pixelY = spotYInViewBox * scaleY;
                          
                          // Add centering offset
                          const finalX = offsetX + pixelX;
                          const finalY = offsetY + pixelY;
                          
                          // Scale dimensions to rendered pixels
                          const pixelWidth = spot.width * scaleX;
                          const pixelHeight = spot.height * scaleY;
                          
                          // Final coordinates - exact match to spot size
                          const left = finalX;
                          const top = finalY;
                          const width = pixelWidth;
                          const height = pixelHeight;
                          
                          // Verify dimensions are valid
                          if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height) || isNaN(left) || isNaN(top)) {
                            console.log(`⚠️ Invalid spot dimensions for ${spot.id}: left=${left}, top=${top}, width=${width}, height=${height}`);
                            return null;
                          }
                          
                          // Debug log for first few spots
                          if (clickableSpots.indexOf(spot) < 3) {
                            console.log(`🎯 Spot ${spot.id} (${spot.spotNumber}):`, {
                              viewBoxCoords: { x: spot.x, y: spot.y, width: spot.width, height: spot.height },
                              renderedCoords: { left, top, width, height },
                              scale: { x: scaleX, y: scaleY },
                              offset: { x: offsetX, y: offsetY }
                            });
                          }
                          
                          // Get spot status from backend (match by spot ID first, then spot_number)
                          // This matches ActiveParkingScreen's approach for consistency
                          // Try multiple matching strategies for flexibility:
                          // 1. Try full ID first (e.g., "F2-B-1") - most reliable match
                          // 2. Try extracted spot number (e.g., "1" from "F2-B-1")
                          // 3. Try ID without floor prefix (e.g., "B-1" from "F2-B-1")
                          let spotStatus = spotStatuses.get(spot.id || '') || spotStatuses.get(spot.spotNumber || '');
                          
                          // If still not found, try matching without floor prefix
                          if (!spotStatus && spot.id) {
                            const idWithoutFloor = spot.id.replace(/^F\d+-/i, ''); // Remove "F2-" prefix
                            spotStatus = spotStatuses.get(idWithoutFloor);
                          }
                          
                          const spotStatusValue = spotStatus?.status || 'unknown';
                          const isUserBooked = spotStatus?.is_user_booked === true || (typeof spotStatus?.is_user_booked === 'number' && spotStatus.is_user_booked === 1);
                          
                          // Determine color based on status
                          // Blue = Current user's booked spot (highest priority)
                          // Otherwise, use status-based colors (yellow/orange for reserved, red for occupied, green for available)
                          let backgroundColor = 'rgba(200, 200, 200, 0.1)'; // Gray for unknown
                          let borderColor = 'rgba(200, 200, 200, 0.4)';
                          
                          // If current user has booked this spot, show it in blue (regardless of status)
                          if (isUserBooked) {
                            backgroundColor = 'rgba(0, 122, 255, 0.3)'; // Blue with transparency
                            borderColor = 'rgba(0, 122, 255, 0.8)'; // Blue border
                          } else {
                            // Otherwise, use status-based colors for spots booked by others or available spots
                            switch (spotStatusValue) {
                              case 'available':
                                backgroundColor = 'rgba(52, 199, 89, 0.2)'; // Green
                                borderColor = 'rgba(52, 199, 89, 0.6)';
                                break;
                              case 'occupied':
                                backgroundColor = 'rgba(255, 59, 48, 0.2)'; // Red
                                borderColor = 'rgba(255, 59, 48, 0.6)';
                                break;
                              case 'reserved':
                                backgroundColor = 'rgba(255, 204, 0, 0.3)'; // Yellow/Orange for reserved by others
                                borderColor = 'rgba(255, 204, 0, 0.8)';
                                break;
                              default:
                                backgroundColor = 'rgba(200, 200, 200, 0.1)'; // Gray
                                borderColor = 'rgba(200, 200, 200, 0.4)';
                            }
                          }
                          
                          return (
                            <TouchableOpacity
                              key={spot.id}
                              style={{
                                position: 'absolute',
                                left,
                                top,
                                width,
                                height,
                                backgroundColor,
                                borderWidth: 1,
                                borderColor,
                                borderRadius: 2,
                                zIndex: 10,
                              }}
                              onPress={() => handleSpotPress(spot)}
                              activeOpacity={0.6}
                              // No hitSlop to ensure exact fit
                              delayPressIn={0}
                              delayPressOut={0}
                            />
                          );
                        })}
                        </View>
                      </View>
                    </ScrollView>
                  </ScrollView>
                </View>
              );
            })() : (
              <View style={[homeScreenStyles.emptyStateContainer, { minHeight: 200 }]}>
                <Text style={homeScreenStyles.emptyStateText}>🚧 No Layout Available</Text>
                <Text style={homeScreenStyles.emptyStateSubtext}>
                  No parking layout is available for this area yet.
                </Text>
                <Text style={[homeScreenStyles.emptyStateSubtext, { marginTop: 8 }]}>
                  The layout will be displayed here once it's configured for this parking area.
                </Text>
              </View>
            )}

            {/* Legend */}
            {svgContent && (
              <View style={{
                marginTop: getResponsiveMargin(16),
                marginBottom: getResponsiveMargin(8),
                padding: getResponsivePadding(12),
                backgroundColor: colors.card || '#FFFFFF',
                borderRadius: getResponsiveSize(8),
                borderWidth: 1,
                borderColor: colors.border || '#E5E7EB',
              }}>
                <Text style={{
                  fontSize: getResponsiveFontSize(14),
                  fontWeight: 'bold',
                  color: colors.text || '#000000',
                  marginBottom: getResponsiveMargin(8),
                  textAlign: 'center',
                }}>
                  Legend
                </Text>
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: getResponsiveSize(12),
                }}>
                  {/* Road */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      width: getResponsiveSize(24),
                      height: getResponsiveSize(12),
                      backgroundColor: '#808080',
                      borderRadius: 2,
                    }} />
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Road</Text>
                  </View>

                  {/* Parking Spot */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      width: getResponsiveSize(24),
                      height: getResponsiveSize(16),
                      borderWidth: 1.5,
                      borderColor: '#333333',
                      borderRadius: 2,
                      backgroundColor: 'transparent',
                    }} />
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Parking Spot</Text>
                  </View>

                  {/* Available (Green) */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      width: getResponsiveSize(20),
                      height: getResponsiveSize(20),
                      backgroundColor: 'rgba(52, 199, 89, 0.2)',
                      borderWidth: 1,
                      borderColor: 'rgba(52, 199, 89, 0.6)',
                      borderRadius: 2,
                    }} />
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Available</Text>
                  </View>

                  {/* Occupied (Red) */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      width: getResponsiveSize(20),
                      height: getResponsiveSize(20),
                      backgroundColor: 'rgba(255, 59, 48, 0.2)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 59, 48, 0.6)',
                      borderRadius: 2,
                    }} />
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Occupied</Text>
                  </View>

                  {/* Reserved (Yellow) */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      width: getResponsiveSize(20),
                      height: getResponsiveSize(20),
                      backgroundColor: 'rgba(255, 204, 0, 0.3)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 204, 0, 0.8)',
                      borderRadius: 2,
                    }} />
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Reserved</Text>
                  </View>

                  {/* Your Booked Spot (Blue) */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      width: getResponsiveSize(20),
                      height: getResponsiveSize(20),
                      backgroundColor: 'rgba(0, 122, 255, 0.3)',
                      borderWidth: 1,
                      borderColor: 'rgba(0, 122, 255, 0.8)',
                      borderRadius: 2,
                    }} />
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Your Spot</Text>
                  </View>

                  {/* Entry Road (Green Arrow) */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <View style={{
                        width: getResponsiveSize(24),
                        height: getResponsiveSize(12),
                        backgroundColor: '#808080',
                        borderRadius: 2,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Ionicons name="arrow-forward" size={getResponsiveSize(10)} color="#34C759" />
                      </View>
                    </View>
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Entry</Text>
                  </View>

                  {/* Exit Road (Red Arrow) */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <View style={{
                        width: getResponsiveSize(24),
                        height: getResponsiveSize(12),
                        backgroundColor: '#808080',
                        borderRadius: 2,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Ionicons name="arrow-forward" size={getResponsiveSize(10)} color="#FF3B30" />
                      </View>
                    </View>
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Exit</Text>
                  </View>
                </View>
              </View>
            )}
            
            <TouchableOpacity 
              style={[homeScreenStyles.closeButton, { marginTop: 12 }]} 
              onPress={handleCloseParkingSpotsModal}
            >
              <Text style={homeScreenStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* See All Spots Modal */}
      <Modal
        visible={isSeeAllSpotsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseSeeAllSpotsModal}
      >
        <Pressable 
          style={homeScreenStyles.modalOverlay}
          onPress={(e) => {
            // Close dropdown if clicking outside the modal container
            if (isAreaDropdownVisible) {
              setIsAreaDropdownVisible(false);
            }
          }}
        >
          <Pressable 
            onPress={(e) => e.stopPropagation()}
            onStartShouldSetResponder={() => false}
            onMoveShouldSetResponder={() => false}
          >
            <View style={[homeScreenStyles.modalContainer, { 
              maxHeight: isTablet ? screenHeight * 0.9 : screenHeight * 0.85,
              height: isTablet ? screenHeight * 0.9 : screenHeight * 0.85,
              width: isTablet ? screenWidth * 0.9 : screenWidth * 0.95,
              maxWidth: isTablet ? 600 : screenWidth * 0.95,
              flexDirection: 'column',
            }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: 16, flexShrink: 0 }}>
              <View style={{ flex: 1, marginRight: 8, zIndex: 1000 }}>
                <Text style={[homeScreenStyles.modalTitle, { marginBottom: 8 }]}>See All Spots</Text>
                
                {/* Area Dropdown */}
                <View style={{ position: 'relative' }}>
                  <TouchableOpacity 
                    style={{
                      backgroundColor: colors.card,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      borderRadius: 8,
                    }}
                    onPress={() => setIsAreaDropdownVisible(!isAreaDropdownVisible)}
                    activeOpacity={0.7}
                  >
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingHorizontal: 12,
                      paddingVertical: 10,
                      minHeight: 40,
                    }}>
                      <Text style={{
                        fontSize: getResponsiveFontSize(14),
                        color: selectedAreaForSeeAll ? colors.text : colors.textSecondary,
                        flex: 1,
                      }}>
                        {selectedAreaForSeeAll ? selectedAreaForSeeAll.name : 'Select Parking Area'}
                      </Text>
                      <Ionicons 
                        name="chevron-down" 
                        size={20} 
                        color={colors.primary}
                        style={{
                          transform: [{ rotate: isAreaDropdownVisible ? '180deg' : '0deg' }]
                        }}
                      />
                    </View>
                  </TouchableOpacity>
                  
                  {isAreaDropdownVisible && (
                    <View style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      marginTop: 4,
                      backgroundColor: colors.backgroundSecondary || colors.card,
                      borderWidth: 1,
                      borderColor: colors.primary,
                      borderRadius: 8,
                      maxHeight: 200,
                      elevation: 10,
                      shadowColor: colors.shadow,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 8,
                      zIndex: 1001,
                    }}>
                      <ScrollView nestedScrollEnabled={true} style={{ maxHeight: 200 }}>
                        {parkingAreas.map((area) => (
                          <TouchableOpacity
                            key={area.id}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 12,
                              borderBottomWidth: 1,
                              borderBottomColor: colors.border,
                              backgroundColor: selectedAreaForSeeAll?.id === area.id ? colors.primary + '10' : 'transparent',
                            }}
                            onPress={() => handleAreaSelectForSeeAll(area)}
                            activeOpacity={0.7}
                          >
                            <Text style={{
                              fontSize: getResponsiveFontSize(14),
                              color: selectedAreaForSeeAll?.id === area.id ? colors.primary : colors.text,
                              fontWeight: selectedAreaForSeeAll?.id === area.id ? '600' : '400',
                            }}>
                              {area.name}
                            </Text>
                            <Text style={{
                              fontSize: getResponsiveFontSize(12),
                              color: colors.textSecondary,
                              marginTop: 2,
                            }}>
                              {area.available_spots || 0} / {area.total_spots || 0} spots available
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity onPress={handleCloseSeeAllSpotsModal} style={{ marginLeft: 8, flexShrink: 0 }}>
                <Ionicons name="close" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
            
            {selectedAreaForSeeAll ? (
              <>
                <Text style={[homeScreenStyles.modalSubtitle, { flexShrink: 0, marginBottom: 12 }]}>
                  Parking spots in {selectedAreaForSeeAll.name}
                </Text>
                
                {spotsForSeeAll.length === 0 && !isLoadingParkingSpots ? (
                  <View style={homeScreenStyles.emptyStateContainer}>
                    <Text style={homeScreenStyles.emptyStateText}>No parking spots available</Text>
                    <Text style={homeScreenStyles.emptyStateSubtext}>All spots in this area are currently occupied</Text>
                  </View>
                ) : (
                  <View style={{ 
                    flex: 1,
                    position: 'relative', 
                    minHeight: 100,
                    width: '100%',
                  }}>
                    <ScrollView 
                      style={{ 
                        flex: 1,
                        width: '100%', 
                        opacity: isLoadingParkingSpots ? 0.5 : 1 
                      }}
                      contentContainerStyle={{
                        paddingBottom: getResponsivePadding(10),
                      }}
                      showsVerticalScrollIndicator={true}
                      nestedScrollEnabled={true}
                      scrollEnabled={true}
                      bounces={true}
                      scrollEventThrottle={16}
                      removeClippedSubviews={false}
                      onStartShouldSetResponder={() => true}
                      onMoveShouldSetResponder={() => true}
                    >
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                        {spotsForSeeAll.map((spot) => (
                          <View
                            key={spot.id}
                            style={{
                              backgroundColor: colors.card,
                              borderWidth: 1,
                              borderColor: spot.status === 'available' ? colors.success : colors.error,
                              borderRadius: 8,
                              padding: 12,
                              marginBottom: 8,
                              width: '48%',
                              minWidth: 120,
                            }}
                          >
                            <Text style={{ fontSize: getResponsiveFontSize(14), fontWeight: 'bold', color: colors.text }}>
                              Spot {spot.spot_number}
                            </Text>
                            <Text style={{ fontSize: getResponsiveFontSize(12), color: colors.textSecondary, marginTop: 4 }}>
                              Section: {spot.section_name || 'N/A'}
                            </Text>
                            <Text style={{ fontSize: getResponsiveFontSize(12), color: colors.textSecondary }}>
                              Type: {spot.spot_type?.charAt(0).toUpperCase() + spot.spot_type?.slice(1) || 'N/A'}
                            </Text>
                            <View style={{ 
                              marginTop: 8, 
                              paddingHorizontal: 8, 
                              paddingVertical: 4, 
                              borderRadius: 4,
                              backgroundColor: spot.status === 'available' ? colors.success + '20' : colors.error + '20',
                              alignSelf: 'flex-start'
                            }}>
                              <Text style={{ 
                                fontSize: getResponsiveFontSize(10), 
                                fontWeight: '600',
                                color: spot.status === 'available' ? colors.success : colors.error
                              }}>
                                {spot.status?.toUpperCase() || 'UNKNOWN'}
                              </Text>
                            </View>
                          </View>
                        ))}
                      </View>
                    </ScrollView>
                    
                    {isLoadingParkingSpots && (
                      <View style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: colors.background + 'CC',
                        justifyContent: 'center',
                        alignItems: 'center',
                        borderRadius: 8,
                        pointerEvents: isLoadingParkingSpots ? 'auto' : 'none',
                      }}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={[homeScreenStyles.loadingText, { marginTop: 8 }]}>Loading parking spots...</Text>
                      </View>
                    )}
                  </View>
                )}
              </>
            ) : (
              <View style={homeScreenStyles.emptyStateContainer}>
                <Text style={homeScreenStyles.emptyStateText}>Select a parking area to view spots</Text>
              </View>
            )}
            
            <TouchableOpacity 
              style={[homeScreenStyles.closeButton, { marginTop: 16, flexShrink: 0 }]} 
              onPress={handleCloseSeeAllSpotsModal}
            >
              <Text style={homeScreenStyles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  );
}

// Only keep unique styles that aren't in homeScreenStyles.ts
const styles = StyleSheet.create({
  profilePicture: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  });
