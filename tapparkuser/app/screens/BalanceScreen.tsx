import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert,
  Modal
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import SharedHeader from '../../components/SharedHeader';
import { useAuth } from '../../contexts/AuthContext';
import { SvgXml } from 'react-native-svg';
import { 
  tapParkLogoSvg,
  maroonLocationIconSvg,
  maroonTimeIconSvg,
  maroonDebitIconSvg,
  maroonArrowToTopRightIconSvg,
  maroonArrowToBottomLeftIconSvg,
  maroonProfitHandIconSvg
} from '../assets/icons/index2';
import { ApiService } from '../../services/api';
import { useScreenDimensions } from '../../hooks/use-screen-dimensions';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Responsive calculations
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


const BalanceScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const screenDimensions = useScreenDimensions();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [subscriptionBalance, setSubscriptionBalance] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransactionModalVisible, setIsTransactionModalVisible] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);

  // Profile picture component
  const ProfilePicture = ({ size = 120 }: { size?: number }) => {
    const getInitials = () => {
      if (!user) return '?';
      const firstName = user.first_name || '';
      const lastName = user.last_name || '';
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const profileImageUrl = user?.profile_image || (user as any)?.profile_image_url;

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
              console.warn('⚠️ Failed to load profile image (BalanceScreen):', profileImageUrl, error);
            }}
          />
        </View>
      );
    }

    // Fallback to initials
    return (
      <View style={[styles.profilePicture, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.profileInitials, { fontSize: size * 0.3 }]}>
          {getInitials()}
        </Text>
      </View>
    );
  };

  // Load user profile and transactions from API
  const loadBalanceData = async () => {
    try {
      setIsLoading(true);
      
      // Load user profile
      const profileResponse = await ApiService.getProfile();
      if (profileResponse.success) {
        setUserProfile(profileResponse.data.user);
      }

      // Load subscription balance
      const subscriptionResponse = await ApiService.getSubscriptionBalance();
      if (subscriptionResponse.success) {
        setSubscriptionBalance(subscriptionResponse.data);
      }

      // Load payment history (transactions) using AJAX
      console.log('🔄 Loading payment history...');
      const transactionsResponse = await ApiService.getPaymentHistory(1, 20);
      console.log('📊 Transactions response:', transactionsResponse);
      
      if (transactionsResponse.success) {
        console.log('✅ Transactions loaded successfully');
        console.log('📋 Number of transactions:', transactionsResponse.data.payments?.length || 0);
        console.log('📋 First transaction:', transactionsResponse.data.payments?.[0]);
        
        // Debug each transaction to check for number_of_hours
        if (transactionsResponse.data.payments?.length > 0) {
          transactionsResponse.data.payments.forEach((transaction, index) => {
            console.log(`🔍 Transaction ${index + 1}:`, {
              payment_id: transaction.payment_id,
              plan_name: transaction.location_name,
              number_of_hours: transaction.number_of_hours,
              cost: transaction.cost,
              amount: transaction.amount,
              payment_type: transaction.payment_type
            });
          });
        }
        
        setTransactions(transactionsResponse.data.payments || []);
      } else {
        console.error('❌ Failed to load transactions:', transactionsResponse.message);
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading balance data:', error);
      Alert.alert('Error', 'Failed to load balance information');
    } finally {
      setIsLoading(false);
    }
  };

  // Load data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadBalanceData();
    }, [])
  );

  // Format transaction amount for display
  const formatTransactionAmount = (transaction: any) => {
    console.log('Transaction data:', { 
      payment_id: transaction.payment_id,
      payment_type: transaction.payment_type,
      subscription_id: transaction.subscription_id,
      plan_name: transaction.plan_name,
      number_of_hours: transaction.number_of_hours,
      amount: transaction.amount
    });
    
    if (transaction.type === 'parking') {
      // For parking sessions, show hours deducted
      const hoursDeducted = transaction.hours_deducted || 0;
      return `- ${hoursDeducted} hrs`;
    } else if (transaction.payment_type === 'subscription') {
      // For subscription purchases - RELY ON number_of_hours from plans table
      const hours = transaction.number_of_hours;
      if (!hours) {
        console.warn('⚠️ number_of_hours is missing from transaction:', transaction.payment_id);
        return '+ 0 hrs (data missing)';
      }
      return `+ ${hours} hrs`;
    } else {
      // Other payment types
      return `- ${transaction.amount || 0}`;
    }
  };

  // Get subscription plan name
  const getSubscriptionPlanName = (transaction: any) => {
    return transaction.subscription_plan_name || transaction.plan_name || 'Subscription Plan';
  };

  // Get transaction icon based on type
  const getTransactionIcon = (transaction: any) => {
    if (transaction.type === 'parking') {
      return maroonArrowToTopRightIconSvg; // Parking consumes hours
    } else {
      return transaction.payment_type === 'subscription' ? maroonArrowToBottomLeftIconSvg : maroonArrowToTopRightIconSvg;
    }
  };

  // Handle transaction selection and open modal
  const handleTransactionPress = (transaction: any) => {
    setSelectedTransaction(transaction);
    setIsTransactionModalVisible(true);
  };

  // Close transaction modal
  const closeTransactionModal = () => {
    setIsTransactionModalVisible(false);
    setSelectedTransaction(null);
  };

  // Format transaction date
  const formatTransactionDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get transaction status color
  const getTransactionStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'success':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
      case 'cancelled':
        return '#F44336';
      default:
        return '#8A0000';
    }
  };

  return (
    <View style={styles.container}>
      <SharedHeader 
        title="Balance" 
        showBackButton={true}
        onBackPress={() => router.back()}
      />
      
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Profile Picture Section */}
          <View style={styles.profilePictureSection}>
            <View style={styles.profilePictureContainer}>
              <ProfilePicture size={screenDimensions.isTablet ? 140 : 120} />
            </View>
            <View style={styles.userInfoContainer}>
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#8A0000" />
                  <Text style={styles.loadingText}>Loading...</Text>
                </View>
              ) : userProfile ? (
                <>
                  <Text style={styles.userName}>
                    {userProfile.first_name?.toUpperCase()} {userProfile.last_name?.toUpperCase()}
                  </Text>
                  <Text style={styles.userEmail}>{userProfile.email}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.userName}>USER</Text>
                  <Text style={styles.userEmail}>No profile data</Text>
                </>
              )}
            </View>
          </View>

          {/* Scrollable Content Area */}
          <ScrollView 
            style={styles.profileContentScroll}
            showsVerticalScrollIndicator={false}
          >
            {/* Debit Card Container */}
            <View style={styles.debitCardContainer}>
            {/* TapPark Logo - Top Right */}
            <View style={styles.topRightLogo}>
              <SvgXml 
                xml={tapParkLogoSvg}
                width={getResponsiveSize(70)}
                height={getResponsiveSize(70)}
              />
            </View>

            {/* Owner Name */}
            <View style={styles.ownerNameSection}>
              <Text style={styles.ownerNameText}>
                {userProfile ? `${userProfile.first_name?.toUpperCase()} ${userProfile.last_name?.toUpperCase()}` : 'USER'}
              </Text>
            </View>

            {/* Student ID Section */}
            <View style={styles.studentIdSection}>
              <View style={styles.studentIdInfo}>
                <Text style={styles.studentIdLabel}>STUDENT ID</Text>
                <Text style={styles.studentIdText}>
                  {userProfile?.external_user_id || 'N/A'}
                </Text>
              </View>
            </View>

            {/* Balance Section */}
            <View style={styles.balanceSection}>
              <View style={styles.balanceInfo}>
                <SvgXml 
                  xml={maroonTimeIconSvg}
                  width={getResponsiveSize(32)}
                  height={getResponsiveSize(32)}
                />
                <Text style={styles.balanceText}>
                  {subscriptionBalance ? `${subscriptionBalance.total_hours_remaining || 0} hrs` : '0 hrs'}
                </Text>
              </View>
              <TouchableOpacity 
                style={styles.topUpButton}
                onPress={() => router.push('/screens/TopUpScreen')}
              >
                <Text style={styles.topUpText}>+ TOP UP</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Transactions Section */}
          <View style={styles.transactionsSection}>
            <View style={styles.transactionsHeader}>
              <SvgXml 
                xml={maroonProfitHandIconSvg}
                width={getResponsiveSize(20)}
                height={getResponsiveSize(20)}
              />
              <Text style={styles.transactionsTitle}>Transactions:</Text>
            </View>
            
            {isLoading ? (
              <View style={styles.transactionsLoadingContainer}>
                <ActivityIndicator size="small" color="#8A0000" />
                <Text style={styles.transactionsLoadingText}>Loading transactions...</Text>
              </View>
            ) : transactions.length === 0 ? (
              <View style={styles.emptyTransactionsContainer}>
                <Text style={styles.emptyTransactionsText}>No transactions found</Text>
                <Text style={styles.emptyTransactionsSubtext}>Your transaction history will appear here</Text>
                <Text style={[styles.emptyTransactionsSubtext, { marginTop: 10, fontSize: 12, color: '#999' }]}>
                  Debug: transactions.length = {transactions.length}
                </Text>
              </View>
            ) : (
              transactions.map((transaction, index) => (
                <TouchableOpacity 
                  key={transaction.payment_id || index} 
                  style={styles.transactionItem}
                  onPress={() => handleTransactionPress(transaction)}
                  activeOpacity={0.7}
                >
                  <View style={styles.transactionIconContainer}>
                    <SvgXml 
                      xml={getTransactionIcon(transaction)}
                      width={getResponsiveSize(16)}
                      height={getResponsiveSize(16)}
                    />
                  </View>
                  <View style={styles.transactionInfo}>
                    <Text style={styles.transactionAmount}>
                      {formatTransactionAmount(transaction)}
                    </Text>
                    {transaction.payment_type === 'subscription' && (
                      <Text style={styles.transactionPlanName}>
                        {getSubscriptionPlanName(transaction)}
                      </Text>
                    )}
                  </View>
                  <SvgXml 
                    xml={maroonTimeIconSvg}
                    width={getResponsiveSize(16)}
                    height={getResponsiveSize(16)}
                  />
                </TouchableOpacity>
              ))
            )}
          </View>
          </ScrollView>
        </View>
      </ScrollView>

      {/* Transaction Details Modal */}
      <Modal
        visible={isTransactionModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={closeTransactionModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Transaction Details</Text>
              <TouchableOpacity 
                onPress={closeTransactionModal}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Modal Content */}
            {selectedTransaction && (
              <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
                {/* Transaction Type */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Type:</Text>
                  <View style={styles.detailValueContainer}>
                    <SvgXml 
                      xml={getTransactionIcon(selectedTransaction)}
                      width={getResponsiveSize(20)}
                      height={getResponsiveSize(20)}
                    />
                    <Text style={styles.detailValue}>
                      {selectedTransaction.type === 'parking' ? 'Parking Session' : 
                       selectedTransaction.payment_type === 'subscription' ? 'Top Up' : 'Payment'}
                    </Text>
                  </View>
                </View>

                {/* Subscription Plan Name */}
                {selectedTransaction.payment_type === 'subscription' && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Plan:</Text>
                    <Text style={styles.detailValue}>
                      {getSubscriptionPlanName(selectedTransaction)}
                    </Text>
                  </View>
                )}

                {/* Amount */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Amount:</Text>
                  <Text style={[styles.detailValue, styles.amountValue]}>
                    {formatTransactionAmount(selectedTransaction)}
                  </Text>
                </View>

                {/* Date */}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Date:</Text>
                  <Text style={styles.detailValue}>
                    {formatTransactionDate(selectedTransaction.created_at || selectedTransaction.date)}
                  </Text>
                </View>

                {/* Status */}
                {selectedTransaction.status && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Status:</Text>
                    <Text style={[styles.detailValue, { color: getTransactionStatusColor(selectedTransaction.status) }]}>
                      {selectedTransaction.status.charAt(0).toUpperCase() + selectedTransaction.status.slice(1)}
                    </Text>
                  </View>
                )}

                {/* Transaction ID */}
                {selectedTransaction.payment_id && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Transaction ID:</Text>
                    <Text style={[styles.detailValue, styles.transactionId]}>
                      {selectedTransaction.payment_id}
                    </Text>
                  </View>
                )}

                {/* Parking Details */}
                {selectedTransaction.type === 'parking' && (
                  <>
                    {selectedTransaction.location_name && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Location:</Text>
                        <Text style={styles.detailValue}>{selectedTransaction.location_name}</Text>
                      </View>
                    )}
                    {selectedTransaction.spot_number && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Spot:</Text>
                        <Text style={styles.detailValue}>{selectedTransaction.spot_number}</Text>
                      </View>
                    )}
                    {selectedTransaction.hours_deducted && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Hours Used:</Text>
                        <Text style={styles.detailValue}>{selectedTransaction.hours_deducted} hours</Text>
                      </View>
                    )}
                  </>
                )}

                {/* Payment Details */}
                {selectedTransaction.type !== 'parking' && (
                  <>
                    {selectedTransaction.payment_method && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Payment Method:</Text>
                        <Text style={styles.detailValue}>{selectedTransaction.payment_method}</Text>
                      </View>
                    )}
                    {selectedTransaction.reference_number && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Reference:</Text>
                        <Text style={[styles.detailValue, styles.transactionId]}>
                          {selectedTransaction.reference_number}
                        </Text>
                      </View>
                    )}
                  </>
                )}

                {/* Description */}
                {selectedTransaction.description && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Description:</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.description}</Text>
                  </View>
                )}
              </ScrollView>
            )}

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCloseButton}
                onPress={closeTransactionModal}
              >
                <Text style={styles.modalCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
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
    paddingBottom: getResponsivePadding(20),
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
    backgroundColor: 'white',
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
    maxHeight: getResponsiveSize(200), // Set maximum height for scrolling
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

export default BalanceScreen;