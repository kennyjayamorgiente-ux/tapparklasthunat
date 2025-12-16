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
          <TouchableOpacity style={homeScreenStyles.seeAllButton}>
            <SvgXml xml={doubleUpIconSvg} width={16} height={16} />
            <Text style={homeScreenStyles.seeAllText}>See all spots</Text>
          </TouchableOpacity>
        </View>

        {/* Scroll Indicator Section - Only show when 3+ frequent spots and content overflows */}
        {!isLoadingFrequentSpots && frequentSpots.length >= 3 && canScrollFrequentSpots && (
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
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={homeScreenStyles.horizontalScroll}
            contentContainerStyle={homeScreenStyles.horizontalScrollContent}
          >
            {/* Underground Parking */}
            <TouchableOpacity 
              style={homeScreenStyles.areaCard}
              onPress={() => handleSelectArea('underground')}
            >
              <Text style={homeScreenStyles.areaName}>FPA UNDERGROUND PARKING</Text>
              <Image source={require('../assets/img/fpa-logo.png')} style={homeScreenStyles.areaLogoIcon} />
            </TouchableOpacity>

            {/* Round-About Parking */}
            <TouchableOpacity 
              style={homeScreenStyles.areaCard}
              onPress={() => handleSelectArea('roundabout')}
            >
              <Text style={homeScreenStyles.areaName}>FPA ROUND-ABOUT PARKING</Text>
              <Image source={require('../assets/img/fpa-logo.png')} style={homeScreenStyles.areaLogoIcon} />
            </TouchableOpacity>

            {/* Main Campus Parking */}
            <TouchableOpacity 
              style={homeScreenStyles.areaCard}
              onPress={() => handleSelectArea('maincampus')}
            >
              <Text style={homeScreenStyles.areaName}>MAIN CAMPUS PARKING</Text>
              <Image source={require('../assets/img/fulogofinal.png')} style={homeScreenStyles.areaLogoIcon} />
            </TouchableOpacity>
          </ScrollView>
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
