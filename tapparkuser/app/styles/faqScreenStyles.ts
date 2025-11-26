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

export const faqScreenStyles = StyleSheet.create({
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
  profileCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: getResponsiveSize(20),
    borderTopRightRadius: getResponsiveSize(20),
    paddingTop: getResponsivePadding(25),
    paddingBottom: 0, // Match ProfileScreen - Add 50px to cover the gap
    paddingHorizontal: getResponsivePadding(20),
    height: screenHeight * 0.80,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2, // Match ProfileScreen shadow
    },
    shadowOpacity: 0.1,
    shadowRadius: getResponsiveSize(8),
    elevation: 8, // Match ProfileScreen elevation
    zIndex: 2,
  },
  profilePictureSection: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: getResponsivePadding(25),
    paddingHorizontal: getResponsivePadding(20),
  },
  profilePictureContainer: {
    position: 'relative',
    marginTop: -getResponsiveSize(70),
    alignItems: 'center',
    justifyContent: 'center',
    width: getResponsiveSize(140),
    height: getResponsiveSize(140),
    borderRadius: getResponsiveSize(70),
  },
  userInfoContainer: {
    alignItems: 'center',
    marginTop: getResponsiveSize(15),
  },
  userName: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsivePadding(5),
    textAlign: 'center',
  },
  userEmail: {
    fontSize: getResponsiveFontSize(18),
    color: '#666',
    textAlign: 'center',
  },
  faqScroll: {
    maxHeight: screenHeight * 0.5,
  },
  faqContent: {
    paddingBottom: getResponsivePadding(20),
  },
  faqTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsivePadding(20),
    paddingHorizontal: getResponsivePadding(20),
  },
  faqItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: getResponsiveSize(12),
    marginBottom: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  faqQuestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: '#8A0000',
    flex: 1,
    marginRight: getResponsivePadding(10),
  },
  chevronIcon: {
    marginLeft: getResponsivePadding(10),
  },
  faqAnswerContainer: {
    marginTop: getResponsivePadding(12),
    paddingTop: getResponsivePadding(12),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  faqAnswer: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    lineHeight: getResponsiveFontSize(20),
  },
});
