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
    paddingTop: getResponsivePadding(10),
    paddingBottom: 0,
    paddingHorizontal: getResponsivePadding(20),
    height: screenHeight * 0.80,
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
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: getResponsivePadding(10),
  },
  profileContentScroll: {
    flex: 1,
  },
  profilePictureContainer: {
    position: 'relative',
    marginTop: -getResponsiveSize(70),
    backgroundColor: 'transparent',
    borderRadius: getResponsiveSize(90),
    width: getResponsiveSize(180),
    height: getResponsiveSize(180),
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
    marginTop: getResponsiveSize(5),
  },
  userName: {
    fontSize: getResponsiveFontSize(28),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsivePadding(8),
    textAlign: 'center',
  },
  userEmail: {
    fontSize: getResponsiveFontSize(18),
    color: '#666',
    textAlign: 'center',
  },
  debitCardContainer: {
    backgroundColor: '#fcfcfc',
    borderRadius: getResponsiveSize(16),
    padding: getResponsivePadding(40),
    marginBottom: getResponsivePadding(30),
    shadowColor: '#8A0000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.8,
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
    justifyContent: 'space-between',
    marginBottom: getResponsivePadding(40),
  },
  studentIdInfo: {
    flex: 1,
  },
  topRightLogo: {
    position: 'absolute',
    top: getResponsivePadding(60),
    right: getResponsivePadding(20),
    zIndex: 1,
  },
  studentIdLabel: {
    fontSize: getResponsiveFontSize(16),
    color: '#666',
    marginBottom: getResponsivePadding(15),
  },
  studentIdText: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#8A0000',
    letterSpacing: 2,
  },
  balanceSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: getResponsivePadding(20),
  },
  balanceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceText: {
    fontSize: getResponsiveFontSize(24),
    fontWeight: 'bold',
    color: '#8A0000',
    marginLeft: getResponsivePadding(10),
  },
  topUpButton: {
    backgroundColor: '#8A0000',
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(20),
    borderRadius: getResponsiveSize(8),
  },
  topUpText: {
    color: 'white',
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
  },
  transactionsSection: {
    marginTop: getResponsivePadding(10),
  },
  transactionsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsivePadding(15),
  },
  transactionsTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#8A0000',
    marginLeft: getResponsivePadding(10),
  },
  transactionsList: {
    paddingLeft: getResponsivePadding(10),
    maxHeight: getResponsiveSize(200),
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsivePadding(12),
    paddingVertical: getResponsivePadding(8),
    paddingHorizontal: getResponsivePadding(12),
    backgroundColor: '#F8F8F8',
    borderRadius: getResponsiveSize(8),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  transactionIconContainer: {
    marginRight: getResponsivePadding(10),
  },
  transactionInfo: {
    flex: 1,
    marginRight: getResponsivePadding(10),
  },
  transactionAmount: {
    fontSize: getResponsiveFontSize(16),
    color: '#8A0000',
    fontWeight: '600',
  },
  transactionPlanName: {
    fontSize: getResponsiveFontSize(12),
    color: '#666',
    marginTop: getResponsivePadding(2),
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
  transactionsLoadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsivePadding(20),
  },
  transactionsLoadingText: {
    fontSize: getResponsiveFontSize(14),
    color: '#8A0000',
    marginTop: getResponsiveMargin(8),
  },
  emptyTransactionsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsivePadding(20),
  },
  emptyTransactionsText: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(8),
  },
  emptyTransactionsSubtext: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    textAlign: 'center',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: 'white',
    borderRadius: getResponsiveSize(15),
    width: screenWidth * 0.9,
    maxHeight: screenHeight * 0.8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: getResponsivePadding(20),
    paddingVertical: getResponsivePadding(15),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#8A0000',
  },
  closeButton: {
    width: getResponsiveSize(30),
    height: getResponsiveSize(30),
    borderRadius: getResponsiveSize(15),
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: getResponsiveFontSize(18),
    color: '#666',
    fontWeight: 'bold',
  },
  modalContent: {
    paddingHorizontal: getResponsivePadding(20),
    paddingVertical: getResponsivePadding(15),
    maxHeight: screenHeight * 0.5,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: getResponsivePadding(12),
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  detailLabel: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: '#333',
    flex: 1,
  },
  detailValue: {
    fontSize: getResponsiveFontSize(16),
    color: '#666',
    flex: 2,
    textAlign: 'right',
  },
  detailValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 2,
    justifyContent: 'flex-end',
  },
  amountValue: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#8A0000',
  },
  transactionId: {
    fontSize: getResponsiveFontSize(12),
    fontFamily: 'monospace',
    color: '#666',
  },
  modalFooter: {
    paddingHorizontal: getResponsivePadding(20),
    paddingVertical: getResponsivePadding(15),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  modalCloseButton: {
    backgroundColor: '#8A0000',
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(20),
    borderRadius: getResponsiveSize(8),
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
  },
});
