import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive calculation functions
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414 && screenWidth < 768;
const isTablet = screenWidth >= 768 && screenWidth < 1024;
const isLargeTablet = screenWidth >= 1024;

const getResponsiveFontSize = (baseSize: number): number => {
  if (isSmallScreen) return baseSize * 0.85;
  if (isMediumScreen) return baseSize * 0.95;
  if (isLargeScreen) return baseSize;
  if (isTablet) return baseSize * 1.1;
  if (isLargeTablet) return baseSize * 1.2;
  return baseSize;
};

const getResponsiveSize = (baseSize: number): number => {
  if (isSmallScreen) return baseSize * 0.8;
  if (isMediumScreen) return baseSize * 0.9;
  if (isLargeScreen) return baseSize;
  if (isTablet) return baseSize * 1.05;
  if (isLargeTablet) return baseSize * 1.1;
  return baseSize;
};

const getResponsivePadding = (basePadding: number): number => {
  if (isSmallScreen) return basePadding * 0.8;
  if (isMediumScreen) return basePadding * 0.9;
  if (isLargeScreen) return basePadding;
  if (isTablet) return basePadding * 1.1;
  if (isLargeTablet) return basePadding * 1.2;
  return basePadding;
};

const getResponsiveMargin = (baseMargin: number): number => {
  if (isSmallScreen) return baseMargin * 0.8;
  if (isMediumScreen) return baseMargin * 0.9;
  if (isLargeScreen) return baseMargin;
  if (isTablet) return baseMargin * 1.1;
  if (isLargeTablet) return baseMargin * 1.2;
  return baseMargin;
};

export const favoritesScreenStyles = StyleSheet.create({
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
    bottom: 0, // Match ProfileScreen position
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: getResponsiveSize(20), // Match ProfileScreen
    borderTopRightRadius: getResponsiveSize(20), // Match ProfileScreen
    paddingTop: getResponsivePadding(25),
    paddingBottom: 0,
    paddingHorizontal: getResponsivePadding(20),
    height: screenHeight * 0.80,
    flexDirection: 'column', // Enable flexbox for proper ScrollView sizing
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2, // Match ProfileScreen shadow
    },
    shadowOpacity: 0.1,
    shadowRadius: getResponsiveSize(8), // Match ProfileScreen shadow
    elevation: 8, // Match ProfileScreen elevation
  },
  profileCardScroll: {
    flex: 1,
  },
  profileCardScrollContent: {
    paddingBottom: 0,
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
    backgroundColor: '#fcfcfc',
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

