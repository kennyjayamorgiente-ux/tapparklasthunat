import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

// Enhanced responsive calculations
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


export const activeParkingScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12, // Match HomeScreen
    paddingBottom: 12,
    backgroundColor: '#8A0000',
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
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingTop: getResponsivePadding(20),
    paddingHorizontal: getResponsivePadding(12),
    paddingBottom: getResponsivePadding(80), // Increased bottom padding to compensate for removing SafeAreaView
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(15),
    textAlign: 'left',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(8),
    marginBottom: getResponsiveMargin(15),
    padding: getResponsivePadding(4),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: getResponsiveSize(45),
  },
  tab: {
    flex: 1,
    paddingVertical: getResponsivePadding(8),
    paddingHorizontal: getResponsivePadding(8),
    borderRadius: getResponsiveSize(6),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: getResponsiveSize(42),
  },
  activeTab: {
    backgroundColor: '#8A0000',
  },
  tabText: {
    fontSize: isSmallScreen ? getResponsiveFontSize(10) : getResponsiveFontSize(12),
    fontWeight: '500',
    color: '#666666',
    textAlign: 'center',
  },
  activeTabText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: isSmallScreen ? getResponsiveFontSize(10) : getResponsiveFontSize(12),
    textAlign: 'center',
  },
  ticketContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(12),
    padding: getResponsivePadding(20),
    paddingBottom: getResponsivePadding(30),
    borderWidth: 1,
    borderColor: '#8A0000',
    flex: 1,
    minHeight: getResponsiveSize(650),
  },
  qrSection: {
    alignItems: 'center',
    marginBottom: getResponsivePadding(100),
    marginTop: getResponsivePadding(50),
    flex: 1,
    justifyContent: 'center',
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: getResponsivePadding(20),
    borderRadius: getResponsiveSize(8),
    marginTop: getResponsiveMargin(50),
    marginBottom: getResponsiveMargin(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: getResponsiveSize(250),
  },
  qrInstruction: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#8A0000',
    textAlign: 'center',
  },
  separator: {
    height: 1,
    borderTopWidth: 1,
    borderTopColor: '#8A0000',
    borderStyle: 'dashed',
    marginVertical: getResponsiveMargin(10),
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flex: 1,
  },
  detailsColumn: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(10),
    justifyContent: 'space-around',
  },
  detailRow: {
    marginBottom: getResponsiveMargin(8),
    flex: 1,
    justifyContent: 'center',
  },
  detailLabel: {
    fontSize: getResponsiveFontSize(14),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(4),
    textAlign: 'center',
  },
  detailValue: {
    fontSize: getResponsiveFontSize(16),
    color: '#666666',
    fontWeight: '500',
    textAlign: 'center',
    flex: 1,
    textAlignVertical: 'center',
  },
  placeholderContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(12),
    padding: getResponsivePadding(40),
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: getResponsiveMargin(20),
  },
  placeholderText: {
    fontSize: getResponsiveFontSize(16),
    color: '#666666',
    textAlign: 'center',
  },
  favoritesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8A0000',
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(20),
    borderRadius: getResponsiveSize(8),
    alignSelf: 'center',
    minWidth: getResponsiveSize(200),
    marginTop: getResponsiveMargin(10),
    marginBottom: getResponsiveMargin(20), // Add bottom margin to avoid Android navigation buttons
  },
  favoritesText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    marginLeft: getResponsiveMargin(10),
  },


  // QR Placeholder Styles for Backend Integration
  qrPlaceholder: {
    width: isSmallScreen ? getResponsiveSize(200) : getResponsiveSize(240),
    height: isSmallScreen ? getResponsiveSize(200) : getResponsiveSize(240),
    backgroundColor: '#F0F0F0',
    borderRadius: getResponsiveSize(12),
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: getResponsivePadding(20),
  },
  qrPlaceholderEmoji: {
    fontSize: getResponsiveFontSize(48),
    marginBottom: getResponsiveMargin(8),
  },
  qrPlaceholderText: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(4),
  },
  qrPlaceholderSubtext: {
    fontSize: getResponsiveFontSize(12),
    color: '#666666',
    textAlign: 'center',
  },
  // Parking Time Tab Styles
  timeContainer: {
    flex: 1,
    paddingHorizontal: getResponsivePadding(20),
    paddingTop: getResponsivePadding(10),
    paddingBottom: getResponsivePadding(5),
  },
  timerSection: {
    alignItems: 'center',
    marginBottom: getResponsiveMargin(15),
    flex: 0.6, // Reduce flex to make room for details card
    justifyContent: 'center',
  },
  timerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerCircle: {
    width: isSmallScreen ? getResponsiveSize(180) : getResponsiveSize(220),
    height: isSmallScreen ? getResponsiveSize(180) : getResponsiveSize(220),
    borderRadius: isSmallScreen ? getResponsiveSize(90) : getResponsiveSize(110),
    backgroundColor: '#F0F0F0',
    borderWidth: getResponsiveSize(10),
    borderColor: '#E0E0E0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  timerProgress: {
    position: 'absolute',
    width: isSmallScreen ? getResponsiveSize(180) : getResponsiveSize(220),
    height: isSmallScreen ? getResponsiveSize(180) : getResponsiveSize(220),
    borderRadius: isSmallScreen ? getResponsiveSize(90) : getResponsiveSize(110),
    borderWidth: getResponsiveSize(10),
    borderColor: 'transparent',
    borderTopColor: '#8A0000',
    borderRightColor: '#8A0000',
    borderBottomColor: 'transparent',
    borderLeftColor: 'transparent',
  },
  timerContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerText: {
    fontSize: getResponsiveFontSize(36),
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: getResponsiveMargin(8),
  },
  timerLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: isSmallScreen ? getResponsiveSize(120) : getResponsiveSize(150),
  },
  timerLabel: {
    fontSize: getResponsiveFontSize(16),
    color: '#999999',
    textAlign: 'center',
  },
  parkingDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(16),
    borderWidth: 2,
    borderColor: '#8A0000',
    padding: getResponsivePadding(20),
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: getResponsiveMargin(10),
    marginBottom: getResponsiveMargin(10),
    flex: 0.4, // Ensure it takes up remaining space
    minHeight: getResponsiveSize(120), // Ensure minimum height
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },
  emptyStateMessage: {
    fontSize: getResponsiveFontSize(16),
    color: '#666',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 24,
  },
  emptyStateSubMessage: {
    fontSize: getResponsiveFontSize(14),
    color: '#999',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 20,
  },
  goBackButton: {
    backgroundColor: '#8A0000',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
  },
  goBackButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
  },

  // Interactive Parking Layout Styles
  layoutContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: getResponsiveSize(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    marginBottom: getResponsiveMargin(20),
  },
  layoutScrollContent: {
    padding: getResponsivePadding(15),
  },
  svgContainer: {
    alignItems: 'center',
    marginBottom: getResponsiveMargin(20),
    backgroundColor: '#F8F9FA',
    borderRadius: getResponsiveSize(8),
    padding: getResponsivePadding(20),
    minHeight: 850,
  },
  layoutHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveMargin(15),
    paddingHorizontal: getResponsivePadding(10),
  },
  layoutTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  refreshButton: {
    backgroundColor: '#8A0000',
    paddingHorizontal: getResponsivePadding(12),
    paddingVertical: getResponsivePadding(6),
    borderRadius: getResponsiveSize(6),
    marginLeft: getResponsiveMargin(10),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  refreshButtonText: {
    color: '#FFFFFF',
    fontSize: getResponsiveFontSize(12),
    fontWeight: '600',
  },
  svgWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  spotTouchArea: {
    position: 'absolute',
    zIndex: 10,
  },
  spotOverlay: {
    width: '100%',
    height: '100%',
    borderRadius: getResponsiveSize(3),
    alignItems: 'center',
    justifyContent: 'center',
    borderStyle: 'solid',
  },
  spotOverlayText: {
    fontSize: getResponsiveFontSize(10),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  parkingInfoContainer: {
    paddingHorizontal: getResponsivePadding(10),
  },
  parkingInfoTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(15),
    textAlign: 'center',
  },
  currentSpotInfo: {
    backgroundColor: '#F8F9FA',
    borderRadius: getResponsiveSize(8),
    padding: getResponsivePadding(15),
    marginBottom: getResponsiveMargin(20),
    borderWidth: 1,
    borderColor: '#8A0000',
  },
  currentSpotHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveMargin(10),
  },
  currentSpotTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#8A0000',
  },
  statusIndicator: {
    width: getResponsiveSize(12),
    height: getResponsiveSize(12),
    borderRadius: getResponsiveSize(6),
  },
  spotDetails: {
    gap: getResponsiveMargin(5),
  },
  spotDetailText: {
    fontSize: getResponsiveFontSize(14),
    color: '#333333',
  },
  spotDetailLabel: {
    fontWeight: 'bold',
    color: '#8A0000',
  },
  legendContainer: {
    marginBottom: getResponsiveMargin(20),
  },
  legendTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(10),
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveMargin(8),
    width: '48%',
  },
  legendColor: {
    width: getResponsiveSize(12),
    height: getResponsiveSize(12),
    borderRadius: getResponsiveSize(2),
    marginRight: getResponsiveMargin(8),
  },
  legendText: {
    fontSize: getResponsiveFontSize(12),
    color: '#333333',
  },
  spotTypesContainer: {
    marginBottom: getResponsiveMargin(10),
  },
  spotTypesTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(10),
  },
  spotTypesItems: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  spotTypeItem: {
    alignItems: 'center',
  },
  spotTypeIcon: {
    fontSize: getResponsiveFontSize(24),
    marginBottom: getResponsiveMargin(4),
  },
  spotTypeText: {
    fontSize: getResponsiveFontSize(12),
    color: '#333333',
    textAlign: 'center',
  },
  statisticsContainer: {
    marginBottom: getResponsiveMargin(20),
  },
  statisticsTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(10),
  },
  statisticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  statisticItem: {
    width: '48%',
    backgroundColor: '#F8F9FA',
    borderRadius: getResponsiveSize(8),
    padding: getResponsivePadding(12),
    alignItems: 'center',
    marginBottom: getResponsiveMargin(8),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  statisticNumber: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(4),
  },
  statisticLabel: {
    fontSize: getResponsiveFontSize(12),
    color: '#666666',
    textAlign: 'center',
  },
  instructionsContainer: {
    backgroundColor: '#F0F8FF',
    borderRadius: getResponsiveSize(8),
    padding: getResponsivePadding(15),
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  instructionsTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: getResponsiveMargin(10),
  },
  instructionsText: {
    fontSize: getResponsiveFontSize(14),
    color: '#333333',
    lineHeight: getResponsiveFontSize(20),
  },

  // Spot Modal Styles
  spotModalContent: {
    backgroundColor: 'white',
    borderRadius: getResponsiveSize(12),
    padding: getResponsivePadding(20),
    margin: getResponsiveMargin(20),
    maxWidth: screenWidth - 40,
    alignSelf: 'center',
  },
  spotModalTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#8A0000',
    textAlign: 'center',
    marginBottom: getResponsiveMargin(20),
  },
  spotModalInfo: {
    marginBottom: getResponsiveMargin(20),
  },
  spotModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: getResponsiveMargin(12),
  },
  spotModalLabel: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#333333',
  },
  spotModalValue: {
    fontSize: getResponsiveFontSize(16),
    color: '#666666',
  },
  spotModalStatusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  spotModalStatusIndicator: {
    width: getResponsiveSize(12),
    height: getResponsiveSize(12),
    borderRadius: getResponsiveSize(6),
    marginRight: getResponsiveMargin(8),
  },
  spotModalStatusText: {
    fontSize: getResponsiveFontSize(16),
    color: '#666666',
  },
  spotModalCloseButton: {
    backgroundColor: '#8A0000',
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(20),
    borderRadius: getResponsiveSize(8),
    alignItems: 'center',
  },
  spotModalCloseText: {
    color: 'white',
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
  },
});
