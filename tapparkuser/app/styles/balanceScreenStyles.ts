import { StyleSheet, Dimensions } from 'react-native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

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

export const balanceScreenStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#383838',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: getResponsivePadding(20),
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
    maxHeight: screenHeight * 0.75,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: getResponsiveSize(12),
    elevation: 12,
  },
  profilePictureSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsivePadding(25),
  },
  profilePictureContainer: {
    position: 'relative',
    marginTop: -getResponsiveSize(70),
    marginRight: getResponsivePadding(20),
    backgroundColor: 'black',
    borderRadius: getResponsiveSize(60),
    width: getResponsiveSize(120),
    height: getResponsiveSize(120),
    alignItems: 'center',
    justifyContent: 'center',
  },
  userInfoContainer: {
    flex: 1,
    marginTop: getResponsiveSize(5),
  },
  userName: {
    fontSize: getResponsiveFontSize(28),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsivePadding(8),
  },
  userEmail: {
    fontSize: getResponsiveFontSize(18),
    color: '#666',
  },
  debitCardContainer: {
    backgroundColor: 'white',
    borderRadius: getResponsiveSize(16),
    padding: getResponsivePadding(40),
    marginBottom: getResponsivePadding(30),
    shadowColor: '#8A0000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: getResponsiveSize(12),
    elevation: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ownerNameSection: {
    marginBottom: getResponsivePadding(20),
  },
  ownerNameText: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#8A0000',
    letterSpacing: 1,
  },
  studentIdSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsivePadding(20),
  },
  studentIdText: {
    fontSize: getResponsiveFontSize(16),
    color: '#666',
    marginLeft: getResponsivePadding(8),
  },
  balanceSection: {
    alignItems: 'center',
    marginBottom: getResponsivePadding(20),
  },
  balanceLabel: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    marginBottom: getResponsivePadding(8),
  },
  balanceAmount: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: 'bold',
    color: '#8A0000',
  },
  topUpButton: {
    backgroundColor: '#8A0000',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsivePadding(16),
    paddingHorizontal: getResponsivePadding(24),
    borderRadius: getResponsiveSize(12),
    shadowColor: '#8A0000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: getResponsiveSize(8),
    elevation: 6,
  },
  topUpButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    marginLeft: getResponsivePadding(8),
  },
  transactionsSection: {
    marginBottom: getResponsivePadding(20),
  },
  transactionsList: {
    paddingLeft: getResponsivePadding(10),
    maxHeight: getResponsiveSize(200), // Set maximum height for scrolling
  },
  sectionTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsivePadding(16),
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsivePadding(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: '#333',
    marginBottom: getResponsivePadding(4),
  },
  transactionDate: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
  },
  transactionAmount: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#8A0000',
  },
});
