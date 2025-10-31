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
} from 'react-native';
import { SafeAreaView as SafeAreaViewContext } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { SvgXml } from 'react-native-svg';
import { Image as ExpoImage } from 'expo-image';
import SharedHeader from '../../components/SharedHeader';
import { useAuth } from '../../contexts/AuthContext';
import { useDrawer } from '../../contexts/DrawerContext';
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
                router.push({
                  pathname: '/screens/ActiveParkingScreen',
                  params: {
                    reservationId: response.data.reservationId,
                    sessionId: response.data.reservationId
                  }
                });
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
      
      if (area) {
        setSelectedParkingArea(area);
        // Show vehicle selection modal directly
        setIsVehicleSelectionModalVisible(true);
      } else {
        Alert.alert('Error', 'Could not find parking area for this spot. Please try again.');
      }
    } catch (error) {
      console.error('Error in handleBookFrequentSpot:', error);
      Alert.alert('Error', 'Failed to load parking areas');
    }
  };

  const handleCloseVehicleSelectionModal = () => {
    setIsVehicleSelectionModalVisible(false);
    setSelectedVehicle('');
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



  return (
    <View style={styles.container}>
      <SafeAreaViewContext style={styles.headerSafeArea} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.menuButton} 
            onPress={toggleDrawer}
          >
            <Ionicons name="menu" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>TapPark</Text>
          
          <TouchableOpacity onPress={() => router.push('/ProfileScreen')}>
            <ProfilePicture size={36} />
          </TouchableOpacity>
        </View>
      </SafeAreaViewContext>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Main Slogan */}
        <View style={styles.sloganSection}>
          <Text style={styles.parkingText}>PARKING</Text>
          <View style={styles.madeEasyContainer}>
            <Text style={styles.madeText}>made </Text>
            <Text style={styles.easyText}>easy!</Text>
          </View>
        </View>

        {/* Registered Vehicle Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SvgXml xml={lineGraphIconSvg} width={16} height={16} />
            <Text style={styles.sectionTitle}>Registered Vehicle</Text>
          </View>
          
          {isLoadingVehicles ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#8A0000" />
              <Text style={styles.loadingText}>Loading vehicles...</Text>
            </View>
          ) : vehicles.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <Text style={styles.emptyStateText}>No vehicles registered yet</Text>
              <Text style={styles.emptyStateSubtext}>Add your first vehicle to get started</Text>
              <TouchableOpacity style={styles.addVehicleButton} onPress={handleAddVehicle}>
                <Text style={styles.addVehicleButtonText}>Add Vehicle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.horizontalScroll}
              contentContainerStyle={styles.horizontalScrollContent}
            >
              {(vehicles || []).map((vehicle, index) => (
                <TouchableOpacity key={vehicle.id || index} style={styles.vehicleCard} onPress={() => handleVehicleCardPress(vehicle)}>
                  <View style={styles.vehicleIconContainer}>
                    <SvgXml 
                      xml={getVehicleIcon(vehicle.vehicle_type)} 
                      width={getResponsiveSize(55)} 
                      height={getResponsiveSize(vehicle.vehicle_type.toLowerCase() === 'car' ? 33 : 40)} 
                    />
                  </View>
                  <Text style={styles.vehicleLabel}>Brand and Model</Text>
                  <Text style={styles.vehicleValue}>{vehicle.brand || 'N/A'} - N/A</Text>
                  <Text style={styles.vehicleLabel}>Display Name</Text>
                  <Text style={styles.vehicleValue}>{vehicle.vehicle_type}</Text>
                  <Text style={styles.vehicleLabel}>Plate Number</Text>
                  <Text style={styles.vehicleValue}>{vehicle.plate_number}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Frequently Used Parking Space Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SvgXml xml={profitIconSvg} width={16} height={16} />
            <Text style={styles.sectionTitle}>Frequently used parking space</Text>
          </View>
          
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.horizontalScrollContent}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {isLoadingFrequentSpots ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8A0000" />
                <Text style={styles.loadingText}>Loading frequent spots...</Text>
              </View>
            ) : frequentSpots.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No frequent parking spots found</Text>
                <Text style={styles.emptySubtext}>Your frequently used spots will appear here</Text>
              </View>
            ) : (
              (frequentSpots || []).map((spot, index) => (
                <View key={`${spot.parking_spot_id}-${index}`} style={styles.parkingCard}>
                  <View style={styles.locationHeader}>
                    <View style={styles.locationTextContainer}>
                      <Text style={styles.parkingLocation}>{spot.location_name.toUpperCase()}</Text>
                      <Text style={styles.parkingSpotId}>{generateSpotId(spot.location_name, spot.spot_number)}</Text>
                    </View>
                    <Image source={getLocationLogo(spot.location_name)} style={styles.logoIcon} />
                  </View>
                  <Text style={styles.parkingLabel}>Time Slot</Text>
                  <View style={styles.timeSlotContainer}>
                    <Text style={styles.parkingTime}>
                      {spot.current_reservation 
                        ? `${formatTime(spot.current_reservation.start_time)} - ${formatTime(spot.current_reservation.end_time || new Date(Date.now() + 2*60*60*1000).toISOString())}`
                        : 'Available Now'
                      }
                    </Text>
                  </View>
                  <Text style={styles.parkingPrice}>Used {spot.usage_count} times</Text>
                  <View style={styles.parkingStatusContainer}>
                    <Text style={spot.status === 'AVAILABLE' ? styles.availableStatus : styles.occupiedStatus}>
                      {spot.status}
                    </Text>
                    <TouchableOpacity 
                      style={styles.bookButton}
                      onPress={() => handleBookFrequentSpot(spot)}
                    >
                      <Text style={styles.bookButtonText}>BOOK</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}

          </ScrollView>

          {/* See All Spots Button */}
          <TouchableOpacity style={styles.seeAllButton}>
            <SvgXml xml={doubleUpIconSvg} width={16} height={16} />
            <Text style={styles.seeAllText}>See all spots</Text>
          </TouchableOpacity>
        </View>

        {/* Scroll Indicator Section */}
        <View style={styles.progressSection}>
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <Animated.View 
                style={[
                  styles.scrollHandle,
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

        {/* Select Parking Area Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <SvgXml xml={checkboxIconSvg} width={16} height={16} />
            <Text style={styles.sectionTitle}>Select Parking Area</Text>
          </View>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.horizontalScroll}
            contentContainerStyle={styles.horizontalScrollContent}
          >
            {/* Underground Parking */}
            <TouchableOpacity 
              style={styles.areaCard}
              onPress={() => handleSelectArea('underground')}
            >
              <Text style={styles.areaName}>FPA UNDERGROUND PARKING</Text>
              <Image source={require('../assets/img/fpa-logo.png')} style={styles.areaLogoIcon} />
            </TouchableOpacity>

            {/* Round-About Parking */}
            <TouchableOpacity 
              style={styles.areaCard}
              onPress={() => handleSelectArea('roundabout')}
            >
              <Text style={styles.areaName}>FPA ROUND-ABOUT PARKING</Text>
              <Image source={require('../assets/img/fpa-logo.png')} style={styles.areaLogoIcon} />
            </TouchableOpacity>

            {/* Main Campus Parking */}
            <TouchableOpacity 
              style={styles.areaCard}
              onPress={() => handleSelectArea('maincampus')}
            >
              <Text style={styles.areaName}>MAIN CAMPUS PARKING</Text>
              <Image source={require('../assets/img/fulogofinal.png')} style={styles.areaLogoIcon} />
            </TouchableOpacity>
          </ScrollView>
        </View>

      </ScrollView>

      {/* Parking Booking Modal */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Book a Parking Slot</Text>
            <Text style={styles.modalSubtitle}>Choose a parking area:</Text>
            
            {isLoadingParkingAreas ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8A0000" />
                <Text style={styles.loadingText}>Loading parking areas...</Text>
              </View>
            ) : (
              <View style={styles.parkingAreaButtons}>
                {(parkingAreas || []).map((area) => (
                  <TouchableOpacity 
                    key={area.id}
                    style={styles.parkingAreaButton}
                    onPress={() => handleParkingAreaSelect(area)}
                  >
                    <Text style={styles.parkingAreaButtonText}>{area.name}</Text>
                    <Text style={styles.parkingAreaLocation}>{area.location}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseModal}>
              <Text style={styles.closeButtonText}>Close</Text>
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
        <View style={styles.modalOverlay}>
          <View style={styles.bookingModalContainer}>
            <Text style={styles.bookingModalTitle}>Book a Parking Slot</Text>
            <Text style={styles.bookingModalText}>
              An available slot has been automatically assigned for you at {selectedParkingArea?.name}:
            </Text>
            <Text style={styles.assignedSlotId}>{assignedSlot}</Text>
            {assignedSpotDetails && (
              <Text style={styles.spotTypeText}>
                Spot Type: {assignedSpotDetails.spot_type?.charAt(0).toUpperCase() + assignedSpotDetails.spot_type?.slice(1)}
              </Text>
            )}
            
            {isLoadingParkingSpots ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#8A0000" />
                <Text style={styles.loadingText}>Assigning parking spot...</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.bookNowButton} onPress={handleBookNow}>
                <Text style={styles.bookNowButtonText}>Book Now</Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity style={styles.closeButton} onPress={handleCloseBookingModal}>
              <Text style={styles.closeButtonText}>Close</Text>
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
                {(getCompatibleVehicles() || []).map((vehicle) => (
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
                (!selectedVehicle || getCompatibleVehicles().length === 0) && styles.vehicleSelectionBookNowButtonDisabled
              ]}
              onPress={handleVehicleBookNow}
              disabled={!selectedVehicle || getCompatibleVehicles().length === 0}
            >
              <Text style={styles.vehicleSelectionBookNowButtonText}>
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
}

const styles = StyleSheet.create({
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
    container: {
      flex: 1,
    backgroundColor: 'white',
  },
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
    scrollView: {
      flex: 1,
    },
    sloganSection: {
    paddingHorizontal: getResponsivePadding(20),
    paddingVertical: getResponsivePadding(30),
      alignItems: 'flex-start',
    },
    parkingText: {
    fontSize: getResponsiveFontSize(36),
      fontWeight: 'bold',
      color: '#8A0000',
    lineHeight: getResponsiveFontSize(42),
    },
    madeEasyContainer: {
      flexDirection: 'row',
      alignItems: 'flex-start',
    },
    madeText: {
    fontSize: getResponsiveFontSize(28),
      fontWeight: 'bold',
      color: '#000000',
    lineHeight: getResponsiveFontSize(34),
    },
    easyText: {
    fontSize: getResponsiveFontSize(28),
      fontWeight: 'bold',
      color: '#8A0000',
    lineHeight: getResponsiveFontSize(34),
    },
    section: {
    paddingHorizontal: getResponsivePadding(20),
    marginBottom: getResponsiveMargin(30),
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
    marginBottom: getResponsiveMargin(16),
    },
    sectionTitle: {
    fontSize: getResponsiveFontSize(18),
      fontWeight: '600',
      color: '#1F2937',
    marginLeft: getResponsiveMargin(8),
    },
    horizontalScroll: {
    marginHorizontal: -getResponsivePadding(20),
    },
    horizontalScrollContent: {
    paddingHorizontal: getResponsivePadding(20),
    },
    vehicleCard: {
      backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#8A0000',
      borderRadius: 12,
    padding: getResponsivePadding(16),
    marginRight: getResponsiveMargin(16),
    width: getResponsiveSize(180),
    minHeight: getResponsiveSize(200),
    },
    vehicleIconContainer: {
      backgroundColor: '#8A0000',
      borderRadius: 8,
    padding: getResponsivePadding(18),
      alignItems: 'center',
    marginBottom: getResponsiveMargin(16),
    width: getResponsiveSize(90),
    height: getResponsiveSize(90),
      justifyContent: 'center',
      alignSelf: 'center',
    },
    vehicleLabel: {
    fontSize: getResponsiveFontSize(12),
      color: '#8A0000',
    marginBottom: getResponsiveMargin(4),
    },
    vehicleValue: {
    fontSize: getResponsiveFontSize(14),
      fontWeight: 'bold',
      color: '#000000',
    marginBottom: getResponsiveMargin(8),
    },
  parkingCard: {
      backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#8A0000',
      borderRadius: 12,
    padding: getResponsivePadding(16),
    marginRight: getResponsiveMargin(12),
    width: getResponsiveSize(200),
    minHeight: getResponsiveSize(180),
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
    parkingLabel: {
    fontSize: getResponsiveFontSize(12),
      color: '#6B7280',
    marginBottom: getResponsiveMargin(4),
  },
  timeSlotContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    seeAllButton: {
      flexDirection: 'row',
      alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveMargin(16),
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(16),
      borderWidth: 1,
      borderColor: '#8A0000',
      borderRadius: 8,
      backgroundColor: 'white',
    width: getResponsiveSize(160),
      alignSelf: 'flex-start',
    },
    seeAllText: {
    fontSize: getResponsiveFontSize(14),
      color: '#8A0000',
    marginLeft: getResponsiveMargin(8),
      fontWeight: '600',
    },
    areaCard: {
      backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#8A0000',
      borderRadius: 12,
    padding: getResponsivePadding(16),
    marginRight: getResponsiveMargin(12),
    width: getResponsiveSize(180),
    minHeight: getResponsiveSize(100),
      justifyContent: 'space-between',
    },
    areaName: {
    fontSize: getResponsiveFontSize(14),
      fontWeight: '600',
      color: '#1F2937',
      flex: 1,
    },
  areaLocationIcon: {
    alignSelf: 'flex-end',
    marginTop: getResponsiveMargin(8),
  },
  logoIcon: {
    width: 48,
    height: 48,
    resizeMode: 'contain',
  },
  locationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveMargin(8),
  },
  locationTextContainer: {
    flex: 1,
  },
  areaLogoIcon: {
    width: 64,
    height: 64,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginTop: getResponsiveMargin(8),
    },
    progressSection: {
    paddingHorizontal: getResponsivePadding(20),
    marginBottom: getResponsiveMargin(20),
    },
    progressContainer: {
      alignItems: 'center',
  },
  progressTrack: {
      width: '100%',
    height: getResponsiveSize(4),
      backgroundColor: '#E0E0E0',
    borderRadius: getResponsiveSize(2),
      position: 'relative',
    },
    scrollHandle: {
      position: 'absolute',
    width: getResponsiveSize(20),
    height: getResponsiveSize(8),
      backgroundColor: '#8A0000',
    borderRadius: getResponsiveSize(4),
    top: getResponsiveSize(-2),
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'center',
      alignItems: 'center',
    },
  modalContainer: {
      backgroundColor: '#ffffff',
    borderRadius: getResponsiveSize(16),
    padding: getResponsivePadding(24),
    width: screenWidth * 0.85,
    maxWidth: 400,
      alignItems: 'center',
    },
    modalTitle: {
    fontSize: getResponsiveFontSize(20),
      fontWeight: 'bold',
      color: '#8A0000',
    marginBottom: getResponsiveMargin(8),
    textAlign: 'center',
    },
    modalSubtitle: {
    fontSize: getResponsiveFontSize(16),
      color: '#666666',
    marginBottom: getResponsiveMargin(24),
      textAlign: 'center',
    },
  parkingAreaButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: getResponsiveMargin(24),
    gap: getResponsiveMargin(12),
    },
    parkingAreaButton: {
    flex: 1,
    backgroundColor: '#ffffff',
      borderWidth: 1,
      borderColor: '#E0E0E0',
    borderRadius: getResponsiveSize(8),
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(16),
    paddingTop: getResponsivePadding(20),
      alignItems: 'center',
      justifyContent: 'center',
    },
    parkingAreaButtonText: {
    fontSize: getResponsiveFontSize(16),
      fontWeight: '600',
      color: '#333333',
    },
    closeButton: {
    paddingVertical: getResponsivePadding(8),
    paddingHorizontal: getResponsivePadding(16),
    },
    closeButtonText: {
    fontSize: getResponsiveFontSize(16),
      color: '#666666',
      textAlign: 'center',
    },
  bookingModalContainer: {
      backgroundColor: '#ffffff',
    borderRadius: getResponsiveSize(16),
    padding: getResponsivePadding(24),
    width: screenWidth * 0.85,
    maxWidth: 400,
      alignItems: 'center',
    },
    bookingModalTitle: {
    fontSize: getResponsiveFontSize(20),
      fontWeight: 'bold',
      color: '#8A0000',
    marginBottom: getResponsiveMargin(16),
    textAlign: 'center',
    },
    bookingModalText: {
    fontSize: getResponsiveFontSize(16),
      color: '#666666',
    marginBottom: getResponsiveMargin(16),
      textAlign: 'left',
    lineHeight: getResponsiveFontSize(22),
    },
    assignedSlotId: {
    fontSize: getResponsiveFontSize(24),
      fontWeight: 'bold',
      color: '#333333',
    marginBottom: getResponsiveMargin(12),
    textAlign: 'center',
    },
    spotTypeText: {
    fontSize: getResponsiveFontSize(16),
      color: '#8A0000',
      fontWeight: '600',
    marginBottom: getResponsiveMargin(24),
    textAlign: 'center',
    },
  bookNowButton: {
      backgroundColor: '#8A0000',
    borderRadius: getResponsiveSize(8),
    paddingVertical: getResponsivePadding(16),
    paddingHorizontal: getResponsivePadding(32),
    marginBottom: getResponsiveMargin(16),
      width: '100%',
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
  bookNowButtonText: {
      color: 'white',
    fontSize: getResponsiveFontSize(18),
      fontWeight: 'bold',
    },
  // Vehicle Selection Modal Styles
  vehicleSelectionModalContainer: {
      backgroundColor: '#ffffff',
    borderRadius: getResponsiveSize(16),
    padding: getResponsivePadding(24),
    width: screenWidth * 0.9,
    maxWidth: 400,
    maxHeight: screenHeight * 0.8,
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
  closeXButton: {
    fontSize: getResponsiveFontSize(20),
    color: '#8A0000',
    fontWeight: 'bold',
  },
  vehicleSelectionScroll: {
    marginHorizontal: -getResponsivePadding(24),
  },
  vehicleSelectionScrollContent: {
    paddingHorizontal: getResponsivePadding(24),
  },
  vehicleSelectionCard: {
    backgroundColor: '#ffffff',
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
  progressIndicatorContainer: {
    marginTop: getResponsiveMargin(16),
    marginBottom: getResponsiveMargin(20),
  },
  progressBar: {
    height: getResponsiveSize(4),
    backgroundColor: '#E5E7EB',
    borderRadius: getResponsiveSize(2),
    position: 'relative',
  },
  progressHandle: {
    position: 'absolute',
    top: getResponsiveSize(-2),
    width: getResponsiveSize(8),
    height: getResponsiveSize(8),
    backgroundColor: '#8A0000',
    borderRadius: getResponsiveSize(4),
  },
  vehicleSelectionBookNowButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
  },
  loadingContainer: {
    padding: getResponsivePadding(40),
    alignItems: 'center',
      justifyContent: 'center',
  },
  loadingText: {
    marginTop: getResponsiveMargin(10),
    fontSize: getResponsiveFontSize(16),
    color: '#666666',
  },
  emptyStateContainer: {
    padding: getResponsivePadding(40),
      alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsivePadding(40),
  },
  emptyText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(8),
  },
  emptySubtext: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: getResponsiveFontSize(18),
    color: '#666666',
    textAlign: 'center',
    marginBottom: getResponsiveMargin(8),
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: getResponsiveFontSize(14),
    color: '#999999',
    textAlign: 'center',
    marginBottom: getResponsiveMargin(20),
  },
  addVehicleButton: {
    backgroundColor: '#8A0000',
    paddingHorizontal: getResponsivePadding(24),
    paddingVertical: getResponsivePadding(12),
    borderRadius: getResponsiveSize(8),
  },
  addVehicleButtonText: {
      color: 'white',
    fontSize: getResponsiveFontSize(14),
    fontWeight: '600',
  },
  parkingAreaLocation: {
    fontSize: getResponsiveFontSize(12),
    color: '#666666',
    marginTop: getResponsiveMargin(4),
  },
  parkingSpotsList: {
    maxHeight: getResponsiveSize(300),
    marginVertical: getResponsiveMargin(10),
  },
  parkingSpotCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: getResponsivePadding(15),
    marginBottom: getResponsiveMargin(10),
    borderRadius: getResponsiveSize(8),
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  spotInfo: {
    flex: 1,
  },
  spotNumber: {
    fontSize: getResponsiveFontSize(16),
      fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(2),
  },
  spotType: {
    fontSize: getResponsiveFontSize(14),
    color: '#666666',
    marginBottom: getResponsiveMargin(2),
  },
  spotSection: {
    fontSize: getResponsiveFontSize(12),
    color: '#999999',
  },
  spotStatus: {
    alignItems: 'center',
    },
  // Vehicle Mismatch Modal Styles
  mismatchModalContainer: {
    backgroundColor: '#ffffff',
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
    lineHeight: getResponsiveFontSize(24),
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
    lineHeight: getResponsiveFontSize(20),
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
