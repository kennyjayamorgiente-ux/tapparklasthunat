import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Animated,
  ActivityIndicator,
  Alert,
  Image,
  Modal
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import SharedHeader from '../../components/SharedHeader';
import InteractiveParkingLayout from '../../components/InteractiveParkingLayout';
import { activeParkingScreenStyles } from '../styles/activeParkingScreenStyles';
import ApiService from '../../services/api';

const ActiveParkingScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState('ticket');
  
  // Booking data state
  const [bookingData, setBookingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // SVG Layout state
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoadingSvg, setIsLoadingSvg] = useState(false);
  
  // Display state
  const [qrScanned, setQrScanned] = useState(false);
  const [parkingEndTime, setParkingEndTime] = useState<number | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  
  // Timer state and logic
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false); // Start as false, will start when attendant scans
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Real parking start time from booking data
  const parkingStartTime = useRef<number | null>(null);
  const totalParkingTime = 60 * 60; // 1 hour total parking time in seconds


  // Function to load SVG content using AJAX
  const loadSvgContent = async () => {
    if (!bookingData?.parkingArea?.id) return;
    
    setIsLoadingSvg(true);
    try {
      console.log('🖼️ Loading parking layout for area:', bookingData.parkingArea.id);
      
      // Get the layout info with SVG content directly
      const layoutInfo = await ApiService.getParkingAreaLayout(bookingData.parkingArea.id);
      console.log('📦 Layout info response:', layoutInfo);
      
      if (layoutInfo.success && layoutInfo.data.hasLayout && layoutInfo.data.layoutSvg) {
        console.log('✅ Layout found with SVG content, length:', layoutInfo.data.layoutSvg.length);
        setSvgContent(layoutInfo.data.layoutSvg);
      } else {
        console.log('❌ No layout available for this area');
        setSvgContent('');
      }
    } catch (error) {
      console.error('❌ Error loading SVG content:', error);
      setSvgContent('');
    } finally {
      setIsLoadingSvg(false);
    }
  };

  // Load SVG when layout tab is activated
  useEffect(() => {
    if (activeTab === 'layout' && bookingData && !svgContent) {
      loadSvgContent();
    }
  }, [activeTab, bookingData]);

  // Fetch booking data when component mounts
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setIsLoading(true);
        
        
        // Get reservation ID from params (passed from HomeScreen)
        const reservationId = params.reservationId || params.sessionId;
        console.log('🎯 ActiveParkingScreen - Params received:', params);
        console.log('🎯 ActiveParkingScreen - Reservation ID:', reservationId);
        
        if (reservationId) {
          // Try to get booking details by reservation ID
          const response = await ApiService.getBookingDetails(Number(reservationId));
          if (response.success) {
            setBookingData(response.data);
            
            // Set real parking start time from database
            const startTime = new Date(response.data.timestamps.startTime).getTime();
            parkingStartTime.current = startTime;
            
            // Always start with timer off - wait for QR scan or test button
            setElapsedTime(0);
            setIsTimerRunning(false);
          } else {
            Alert.alert('Error', 'Failed to load booking details');
            router.back();
          }
        } else {
          // Fallback: check for active reservations
          console.log('🎯 ActiveParkingScreen - No reservation ID, checking for active bookings...');
          const response = await ApiService.getMyBookings();
          console.log('🎯 ActiveParkingScreen - My bookings response:', JSON.stringify(response, null, 2));
          
          if (response.success && response.data.bookings.length > 0) {
            console.log('🎯 ActiveParkingScreen - Found bookings:', response.data.bookings.length);
            // Find the most recent active or reserved reservation
            const activeReservation = response.data.bookings.find(
              (booking: any) => booking.bookingStatus === 'active' || booking.bookingStatus === 'reserved'
            );
            
            if (activeReservation) {
              console.log('✅ Found active/reserved reservation:', activeReservation.reservationId, 'Status:', activeReservation.bookingStatus);
              setBookingData(activeReservation);
              
              // Timer is now purely local - starts only when attendant scans
              // Don't set parkingStartTime here - it will be set when attendant scans
              parkingStartTime.current = null;
              setElapsedTime(0);
              setIsTimerRunning(false);
            } else {
              console.log('❌ No active or reserved reservations found');
              console.log('📊 All booking statuses:', response.data.bookings.map(b => ({ id: b.reservationId, status: b.bookingStatus })));
              setBookingData(null);
            }
          } else {
            console.log('No bookings found');
            setBookingData(null);
          }
        }
      } catch (error) {
        console.error('Error fetching booking data:', error);
        setBookingData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingData();
  }, [params.reservationId, params.sessionId, router]);

  // Simple local timer - ONLY controlled by attendant scans
  useEffect(() => {
    if (isTimerRunning && parkingStartTime.current !== null) {
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - parkingStartTime.current!) / 1000);
        setElapsedTime(elapsed);
        
        // Update progress animation
        const progress = Math.min(elapsed / totalParkingTime, 1);
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      }, 1000);
      
      intervalRef.current = interval;
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isTimerRunning, parkingStartTime.current, totalParkingTime, progressAnim]);

  // Clear data when component unmounts
  useEffect(() => {
    return () => {
      // Clear all data when leaving the screen
      setBookingData(null);
      setIsTimerRunning(false);
      setElapsedTime(0);
      setParkingEndTime(null);
      setQrScanned(false);
      parkingStartTime.current = null;
    };
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Check if we have booking data and verify it's still active
      if (bookingData) {
        const checkActiveStatus = async () => {
          try {
            const response = await ApiService.getBookingDetails(bookingData.reservationId);
            if (response.success && response.data) {
              if (response.data.bookingStatus !== 'active' && response.data.bookingStatus !== 'reserved') {
                console.log('Reservation is no longer active, clearing data');
                setBookingData(null);
                setIsTimerRunning(false);
                setElapsedTime(0);
                setParkingEndTime(null);
                setQrScanned(false);
                parkingStartTime.current = null;
              }
            }
          } catch (error) {
            console.error('Error checking reservation status:', error);
          }
        };
        
        checkActiveStatus();
      }
    }, [bookingData])
  );

  // Real-time polling to sync with attendant actions
  useEffect(() => {
    if (!bookingData?.reservationId) return;

    let pollingInterval: ReturnType<typeof setInterval> | null = null;

    const pollReservationStatus = async () => {
      try {
        console.log('🔄 Polling reservation status for real-time sync...');
        const response = await ApiService.getBookingDetails(bookingData.reservationId);
        
        if (response.success) {
          const bookingData = response.data;
          console.log('📊 Current booking status:', bookingData);

          // If attendant started the session and our timer isn't running
          if (bookingData.bookingStatus === 'active' && !isTimerRunning && bookingData.timestamps.startTime) {
            console.log('🟢 Attendant started session - syncing timer');
            const startTime = new Date(bookingData.timestamps.startTime).getTime();
            parkingStartTime.current = startTime;
            setIsTimerRunning(true);
            setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
            setQrScanned(true);
          }
          
          // If attendant ended the session and our timer is still running
          if (bookingData.bookingStatus === 'completed' && isTimerRunning) {
            console.log('🔴 Attendant ended session - stopping timer');
            setIsTimerRunning(false);
            setParkingEndTime(Date.now());
            
            // Clear all parking data after session ends
            setTimeout(() => {
              setBookingData(null);
              setElapsedTime(0);
              setParkingEndTime(null);
              setQrScanned(false);
              parkingStartTime.current = null;
            }, 3000); // Wait 3 seconds before clearing
          }
        }
      } catch (error) {
        // Don't log authentication errors as errors - they're expected when not logged in
        if (error instanceof Error && error.message.includes('Access token required')) {
          console.log('🔐 User logged out - stopping reservation polling');
          // Clear booking data and stop polling when user is logged out
          setBookingData(null);
          setElapsedTime(0);
          setParkingEndTime(null);
          setQrScanned(false);
          parkingStartTime.current = null;
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
        } else {
          console.error('❌ Error polling reservation status:', error);
        }
      }
    };

    // Start polling every 3 seconds
    pollingInterval = setInterval(pollReservationStatus, 3000);

    // Cleanup
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [bookingData?.reservationId, isTimerRunning]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };




  const handleAddToFavorites = async () => {
    if (bookingData) {
      try {
        console.log('Booking data:', JSON.stringify(bookingData, null, 2));
        console.log('Parking slot data:', bookingData.parkingSlot);
        console.log('Parking spot ID:', bookingData.parkingSlot?.parkingSpotId);
        
        let parkingSpotId = bookingData.parkingSlot?.parkingSpotId;
        
        // Fallback: If parkingSpotId is not available, get it from reservation
        if (!parkingSpotId) {
          console.log('Parking spot ID not found in booking data, getting from reservation...');
          const spotIdResponse = await ApiService.getParkingSpotIdFromReservation(bookingData.reservationId);
          if (spotIdResponse.success) {
            parkingSpotId = spotIdResponse.data.parkingSpotId;
            console.log('Got parking spot ID from reservation:', parkingSpotId);
          } else {
            throw new Error('Failed to get parking spot ID from reservation');
          }
        }
        
        const response = await ApiService.addFavorite(parkingSpotId);
        
        if (response.success) {
          // Check if it's already in favorites
          if (response.message && response.message.includes('already in favorites')) {
            Alert.alert(
              'Already in Favorites!',
              `Parking spot ${bookingData.parkingSlot.spotNumber} at ${bookingData.parkingArea.name} is already in your favorites.`,
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Added to Favorites!',
              `Parking spot ${bookingData.parkingSlot.spotNumber} at ${bookingData.parkingArea.name} has been added to your favorites.`,
              [{ text: 'OK' }]
            );
          }
        } else {
          Alert.alert(
            'Error',
            response.message || 'Failed to add to favorites',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error adding to favorites:', error);
        
        // Check if the error message indicates it's already in favorites
        if (error instanceof Error && error.message && error.message.includes('already in favorites')) {
          Alert.alert(
            'Already in Favorites!',
            `Parking spot ${bookingData.parkingSlot.spotNumber} at ${bookingData.parkingArea.name} is already in your favorites.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Error',
            'Failed to add to favorites. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    }
  };


  const deductParkingTimeFromPlan = async (parkingDurationSeconds: number) => {
    try {
      // Calculate hours, minutes, seconds
      const hours = Math.floor(parkingDurationSeconds / 3600);
      const minutes = Math.floor((parkingDurationSeconds % 3600) / 60);
      const seconds = parkingDurationSeconds % 60;
      
      // Here you would typically call an API to deduct time from user's plan
      // For now, we'll just show the calculation
      console.log(`Deducting ${hours}h ${minutes}m ${seconds}s from user's plan`);
      
      // TODO: Implement API call to deduct time from user's subscribed plan
      // await ApiService.deductParkingTime({
      //   userId: bookingData.userId,
      //   duration: parkingDurationSeconds,
      //   reservationId: bookingData.reservationId
      // });
      
    } catch (error) {
      console.error('Error deducting parking time from plan:', error);
    }
  };

  const endParkingSession = async (reservationId: number) => {
    try {
      const response = await ApiService.endParkingSession(reservationId);
      
      if (response.success) {
        console.log('✅ Parking session ended successfully');
        console.log('✅ Booking status set to completed');
        console.log('✅ Parking spot freed');
      } else {
        console.error('❌ Failed to end parking session:', response.message);
      }
    } catch (error) {
      console.error('❌ Error ending parking session:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={activeParkingScreenStyles.container}>
        <SharedHeader 
          title="Active Parking"
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
            Loading booking details...
          </Text>
        </View>
      </View>
    );
  }

  // Show error state if no booking data
  if (!bookingData) {
    return (
      <View style={activeParkingScreenStyles.container}>
        <SharedHeader 
          title="Active Parking"
        />
        <View style={activeParkingScreenStyles.emptyStateContainer}>
          <Text style={activeParkingScreenStyles.emptyStateTitle}>No Active Parking Session</Text>
          <Text style={activeParkingScreenStyles.emptyStateMessage}>
            You don't have any active parking reservations at the moment.
          </Text>
          <Text style={activeParkingScreenStyles.emptyStateSubMessage}>
            Please log in and book a parking spot from the Home screen to start a new session.
          </Text>
          <TouchableOpacity
            style={activeParkingScreenStyles.goBackButton}
            onPress={() => router.back()}
          >
            <Text style={activeParkingScreenStyles.goBackButtonText}>Go Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={activeParkingScreenStyles.container}>
      <SharedHeader 
        title="Active Parking"
      />

      <View style={activeParkingScreenStyles.content}>
        {/* Section Title */}
        <Text style={activeParkingScreenStyles.sectionTitle}>Parking Ticket</Text>

        {/* Navigation Tabs */}
        <View style={activeParkingScreenStyles.tabsContainer}>
          <TouchableOpacity
            style={[
              activeParkingScreenStyles.tab,
              activeTab === 'ticket' && activeParkingScreenStyles.activeTab
            ]}
            onPress={() => setActiveTab('ticket')}
          >
            <Text 
              style={[
                activeParkingScreenStyles.tabText,
                activeTab === 'ticket' && activeParkingScreenStyles.activeTabText
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              Parking Ticket
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              activeParkingScreenStyles.tab,
              activeTab === 'layout' && activeParkingScreenStyles.activeTab
            ]}
            onPress={() => setActiveTab('layout')}
          >
            <Text 
              style={[
                activeParkingScreenStyles.tabText,
                activeTab === 'layout' && activeParkingScreenStyles.activeTabText
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              Parking Layout
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              activeParkingScreenStyles.tab,
              activeTab === 'time' && activeParkingScreenStyles.activeTab
            ]}
            onPress={() => setActiveTab('time')}
          >
            <Text 
              style={[
                activeParkingScreenStyles.tabText,
                activeTab === 'time' && activeParkingScreenStyles.activeTabText
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              Parking Time
            </Text>
          </TouchableOpacity>
        </View>


        {/* Tab Content */}
        {activeTab === 'ticket' && (
          <View style={activeParkingScreenStyles.ticketContainer}>
            {/* QR Code Section - Real QR Code Display */}
            <View style={activeParkingScreenStyles.qrSection}>
              <View style={activeParkingScreenStyles.qrContainer}>
                {bookingData ? (
                  <View>
                    <QRCode
                      value={JSON.stringify({
                        reservationId: bookingData.reservationId,
                        displayName: bookingData.displayName,
                        vehiclePlate: bookingData.vehicleDetails.plateNumber,
                        parkingArea: bookingData.parkingArea.name,
                        parkingSpot: bookingData.parkingSlot.spotNumber,
                        timestamp: bookingData.timestamps.startTime
                      })}
                      size={240}
                      color="black"
                      backgroundColor="white"
                      logoSize={30}
                      logoMargin={2}
                      logoBorderRadius={15}
                      quietZone={10}
                    />
                  </View>
                ) : (
                <View style={activeParkingScreenStyles.qrPlaceholder}>
                  <Text style={activeParkingScreenStyles.qrPlaceholderEmoji}>📱</Text>
                  <Text style={activeParkingScreenStyles.qrPlaceholderText}>QR Code</Text>
                    <Text style={activeParkingScreenStyles.qrPlaceholderSubtext}>
                      {bookingData ? 'No QR Code Data' : 'Loading...'}
                    </Text>
                </View>
                )}
              </View>
              <Text style={activeParkingScreenStyles.qrInstruction}>
                {!isTimerRunning ? 'Waiting for attendant to start parking session...' : 
                 'Parking session is active. Attendant will end the session.'}
              </Text>
            </View>

            {/* Dashed Separator */}
            <View style={activeParkingScreenStyles.separator} />

            {/* Parking Details */}
            <View style={activeParkingScreenStyles.detailsContainer}>
              <View style={activeParkingScreenStyles.detailsColumn}>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Display Name</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>{bookingData.displayName}</Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Parking Area</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>{bookingData.parkingArea.name}</Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Date</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>
                    {new Date(bookingData.timestamps.bookingTime).toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
              
              <View style={activeParkingScreenStyles.detailsColumn}>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Vehicle Detail</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>
                    {bookingData.vehicleDetails.brand} - {bookingData.vehicleDetails.vehicleType}
                  </Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Parking Slot</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>
                    {bookingData.parkingSlot.spotNumber} ({bookingData.parkingSlot.spotType})
                  </Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Plate Number</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>{bookingData.vehicleDetails.plateNumber}</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'layout' && (
          <View style={activeParkingScreenStyles.layoutContainer}>
            {isLoadingSvg ? (
              <View style={activeParkingScreenStyles.emptyStateContainer}>
                <ActivityIndicator size="large" color="#8A0000" />
                <Text style={activeParkingScreenStyles.emptyStateMessage}>
                  Loading parking layout...
                </Text>
              </View>
            ) : svgContent ? (
              <View style={activeParkingScreenStyles.svgContainer}>
                <View style={activeParkingScreenStyles.layoutHeader}>
                  <Text style={activeParkingScreenStyles.layoutTitle}>
                    {bookingData?.parkingArea?.name || 'Parking Area'} Layout
                  </Text>
                  <TouchableOpacity
                    style={activeParkingScreenStyles.refreshButton}
                    onPress={loadSvgContent}
                  >
                    <Ionicons name="refresh" size={16} color="#FFFFFF" />
                    <Text style={activeParkingScreenStyles.refreshButtonText}> Refresh</Text>
                  </TouchableOpacity>
                </View>
                <SvgXml
                  xml={svgContent}
                  width="100%"
                  height={600}
                />
              </View>
            ) : (
              <View style={activeParkingScreenStyles.emptyStateContainer}>
                <Text style={activeParkingScreenStyles.emptyStateTitle}>🚧 No Layout Available</Text>
                <Text style={activeParkingScreenStyles.emptyStateMessage}>
                  No parking layout is available for this area yet.
                </Text>
                <Text style={activeParkingScreenStyles.emptyStateSubMessage}>
                  The layout will be displayed here once it's configured for this parking area.
                </Text>
                <TouchableOpacity
                  style={activeParkingScreenStyles.refreshButton}
                  onPress={loadSvgContent}
                >
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <Text style={activeParkingScreenStyles.refreshButtonText}> Try Again</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {activeTab === 'time' && (
          <View style={activeParkingScreenStyles.timeContainer}>
            {/* Circular Timer */}
            <View style={activeParkingScreenStyles.timerSection}>
              <View style={activeParkingScreenStyles.timerContainer}>
                <View style={activeParkingScreenStyles.timerCircle}>
                  <Animated.View 
                    style={[
                      activeParkingScreenStyles.timerProgress,
                      {
                        transform: [{
                          rotate: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['-90deg', '270deg'], // Start from top, go clockwise
                          })
                        }]
                      }
                    ]} 
                  />
                  <View style={activeParkingScreenStyles.timerContent}>
                    <Text style={activeParkingScreenStyles.timerText}>
                      {parkingEndTime ? 
                        formatTime(Math.floor((parkingEndTime - (parkingStartTime.current || 0)) / 1000)) : 
                        formatTime(elapsedTime)
                      }
                    </Text>
                    <View style={activeParkingScreenStyles.timerLabels}>
                      <Text style={activeParkingScreenStyles.timerLabel}>hour</Text>
                      <Text style={activeParkingScreenStyles.timerLabel}>min</Text>
                      <Text style={activeParkingScreenStyles.timerLabel}>sec</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Parking Details Card */}
            <View style={activeParkingScreenStyles.parkingDetailsCard}>
              <View style={activeParkingScreenStyles.detailsColumn}>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Vehicle</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>
                    {bookingData.vehicleDetails.brand} - {bookingData.vehicleDetails.vehicleType}
                  </Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Parking Area</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>{bookingData.parkingArea.name}</Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Date</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>
                    {new Date(bookingData.timestamps.bookingTime).toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
              
              <View style={activeParkingScreenStyles.detailsColumn}>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Plate Number</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>{bookingData.vehicleDetails.plateNumber}</Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Parking Spot</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>
                    {bookingData.parkingSlot.spotNumber} ({bookingData.parkingSlot.spotType})
                  </Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Partial Amount</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>--</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Add to Favorites Button */}
        {activeTab === 'ticket' && (
          <TouchableOpacity style={activeParkingScreenStyles.favoritesButton} onPress={handleAddToFavorites}>
            <SvgXml 
              xml={`<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 18.35L8.55 17.03C3.4 12.36 0 9.28 0 5.5C0 2.42 2.42 0 5.5 0C7.24 0 8.91 0.81 10 2.09C11.09 0.81 12.76 0 14.5 0C17.58 0 20 2.42 20 5.5C20 9.28 16.6 12.36 11.45 17.04L10 18.35Z" fill="white"/>
<path d="M6 8L8 10L14 4" stroke="#8A0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`}
              width={20}
              height={20}
            />
            <Text style={activeParkingScreenStyles.favoritesText}>Add to Favorites</Text>
          </TouchableOpacity>
        )}



        {/* Test Modal */}
        <Modal
          visible={showTestModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTestModal(false)}
        >
          <View style={activeParkingScreenStyles.spotOverlay}>
            <View style={activeParkingScreenStyles.spotModalContent}>
              <Text style={activeParkingScreenStyles.spotModalTitle}>🧪 Test Options</Text>
              <Text style={activeParkingScreenStyles.spotModalTitle}>
                This screen displays parking session status. The attendant will scan your QR code to start and end the session.
              </Text>
              
              <TouchableOpacity 
                style={activeParkingScreenStyles.spotModalCloseButton}
                onPress={() => setShowTestModal(false)}
              >
                <Text style={activeParkingScreenStyles.spotModalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        </View>
    </View>
  );
};

export default ActiveParkingScreen;
