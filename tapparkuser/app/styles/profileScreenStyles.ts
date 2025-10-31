import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Enhanced responsive calculation functions - keeping same layout, just making it adaptive
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414 && screenWidth < 768;
const isTablet = screenWidth >= 768 && screenWidth < 1024;
const isLargeTablet = screenWidth >= 1024;

const getResponsiveFontSize = (size: number): number => {
  if (isSmallScreen) return size * 0.85;
  if (isMediumScreen) return size * 0.95;
  if (isLargeScreen) return size;
  if (isTablet) return size * 1.1;
  if (isLargeTablet) return size * 1.2;
  return size;
};

const getResponsiveSize = (size: number): number => {
  if (isSmallScreen) return size * 0.8;
  if (isMediumScreen) return size * 0.9;
  if (isLargeScreen) return size;
  if (isTablet) return size * 1.05;
  if (isLargeTablet) return size * 1.1;
  return size;
};

const getResponsivePadding = (size: number): number => {
  if (isSmallScreen) return size * 0.8;
  if (isMediumScreen) return size * 0.9;
  if (isLargeScreen) return size;
  if (isTablet) return size * 1.1;
  if (isLargeTablet) return size * 1.2;
  return size;
};

const getResponsiveMargin = (size: number): number => {
  if (isSmallScreen) return size * 0.8;
  if (isMediumScreen) return size * 0.9;
  if (isLargeScreen) return size;
  if (isTablet) return size * 1.1;
  if (isLargeTablet) return size * 1.2;
  return size;
};

export const profileScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#383838',
    paddingTop: 0, // Remove any top padding that might push content down
  },
  scrollContainer: {
    flex: 1,
  },
  backgroundSection: {
    height: screenHeight * 0.3,
    position: 'relative',
  },
  backgroundImage: {
    flex: 1,
    width: '100%',
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  profileCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: getResponsiveSize(20),
    borderTopRightRadius: getResponsiveSize(20),
    paddingTop: getResponsivePadding(25),
    paddingBottom: getResponsivePadding(35),
    paddingHorizontal: getResponsivePadding(20),
    minHeight: screenHeight * 0.7,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: getResponsiveSize(8),
    elevation: 8,
    zIndex: 2,
  },
  profilePictureSection: {
    alignItems: 'center',
    marginBottom: getResponsivePadding(25),
  },
  profilePictureContainer: {
    position: 'relative',
    marginTop: -getResponsiveSize(70),
    marginBottom: getResponsivePadding(15),
    backgroundColor: 'transparent',
    borderRadius: getResponsiveSize(90),
    width: getResponsiveSize(180),
    height: getResponsiveSize(180),
    alignItems: 'center',
    justifyContent: 'center',
  },
  profilePicture: {
    width: getResponsiveSize(100),
    height: getResponsiveSize(100),
    borderRadius: getResponsiveSize(50),
    backgroundColor: '#8A0000',
    borderWidth: getResponsiveSize(3),
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  profilePictureImage: {
    borderRadius: getResponsiveSize(50),
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#8A0000',
    width: getResponsiveSize(32),
    height: getResponsiveSize(32),
    borderRadius: getResponsiveSize(16),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: getResponsiveSize(3),
    borderColor: 'white',
  },
  userName: {
    fontSize: getResponsiveFontSize(28),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsivePadding(8),
  },
  userEmail: {
    fontSize: getResponsiveFontSize(18),
    color: '#666666',
  },
  menuContainer: {
    marginBottom: getResponsivePadding(25),
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: getResponsivePadding(18),
    paddingHorizontal: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  menuItemText: {
    fontSize: getResponsiveFontSize(18),
    color: '#8A0000',
    marginLeft: getResponsivePadding(15),
    fontWeight: '500',
  },
  helpButton: {
    backgroundColor: '#8A0000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsivePadding(20),
    paddingHorizontal: getResponsivePadding(35),
    borderRadius: getResponsiveSize(25),
    shadowColor: '#8A0000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: getResponsiveSize(4),
    elevation: 5,
  },
  helpButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(18),
    fontWeight: '600',
    marginLeft: getResponsivePadding(10),
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsivePadding(20),
  },
  loadingText: {
    fontSize: getResponsiveFontSize(16),
    color: '#8A0000',
    marginTop: getResponsiveMargin(8),
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: getResponsiveSize(16),
    padding: getResponsivePadding(24),
    width: screenWidth * 0.85,
    maxWidth: 400,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: getResponsiveSize(8),
    elevation: 10,
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(22),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(8),
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: getResponsiveFontSize(16),
    color: '#666666',
    marginBottom: getResponsiveMargin(20),
    textAlign: 'center',
  },
  modalButton: {
    backgroundColor: '#8A0000',
    width: '100%',
    paddingVertical: getResponsivePadding(14),
    paddingHorizontal: getResponsivePadding(20),
    borderRadius: getResponsiveSize(8),
    marginBottom: getResponsiveMargin(12),
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
  },
  modalButtonRemove: {
    backgroundColor: 'transparent',
    width: '100%',
    paddingVertical: getResponsivePadding(14),
    paddingHorizontal: getResponsivePadding(20),
    borderRadius: getResponsiveSize(8),
    marginBottom: getResponsiveMargin(12),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  modalButtonTextRemove: {
    color: '#FF4444',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
  },
  modalCancelButton: {
    width: '100%',
    paddingVertical: getResponsivePadding(14),
    paddingHorizontal: getResponsivePadding(20),
    borderRadius: getResponsiveSize(8),
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: getResponsiveMargin(8),
  },
  modalCancelButtonText: {
    color: '#666666',
    fontSize: getResponsiveFontSize(16),
    fontWeight: '500',
  },
});









