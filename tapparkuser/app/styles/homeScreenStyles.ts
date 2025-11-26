import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Responsive calculation functions
const isSmallScreen = screenWidth < 400;
const isTablet = screenWidth >= 768 && screenWidth < 1024;
const isLargeTablet = screenWidth >= 1024;

const getResponsiveFontSize = (size: number): number => {
  if (isSmallScreen) return size * 0.9;
  if (isTablet) return size * 1.1;
  if (isLargeTablet) return size * 1.2;
  return size;
};

const getResponsiveSize = (size: number): number => {
  if (isSmallScreen) return size * 0.9;
  if (isTablet) return size * 1.1;
  if (isLargeTablet) return size * 1.2;
  return size;
};

const getResponsivePadding = (size: number): number => {
  if (isSmallScreen) return size * 0.9;
  if (isTablet) return size * 1.1;
  if (isLargeTablet) return size * 1.2;
  return size;
};

const getResponsiveMargin = (size: number): number => {
  if (isSmallScreen) return size * 0.9;
  if (isTablet) return size * 1.1;
  if (isLargeTablet) return size * 1.2;
  return size;
};

export const homeScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
    backgroundColor: '#fcfcfc',
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
    backgroundColor: '#fcfcfc',
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
    backgroundColor: '#fcfcfc',
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
  addVehicleSection: {
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
  },
  addVehicleText: {
    color: 'white',
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    marginLeft: getResponsiveMargin(8),
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#F8F8F8',
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
    backgroundColor: '#F8F8F8',
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
  // Booking Modal Styles
  bookingModalContainer: {
    backgroundColor: 'white',
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
  vehicleSelectionModalCard: {
    backgroundColor: '#fcfcfc',
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
  vehicleSelectionModalIconContainer: {
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
  progressFill: {
    height: '100%',
    width: '33%',
    backgroundColor: '#8A0000',
    borderRadius: getResponsiveSize(2),
  },
  bookNowButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
});
