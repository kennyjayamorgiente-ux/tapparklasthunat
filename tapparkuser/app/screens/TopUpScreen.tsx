import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Modal,
  Alert,
  ActivityIndicator
} from 'react-native';
import { Image as ExpoImage } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import SharedHeader from '../../components/SharedHeader';
import { SvgXml } from 'react-native-svg';
import { useAuth } from '../../contexts/AuthContext';
import { 
  maroonUsersEditIconSvg,
  maroonTimeIconSvg,
  maroonProfitHandIconSvg
} from '../assets/icons/index2';
import { ApiService } from '../../services/api';

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

interface Plan {
  plan_id: number;
  plan_name: string;
  cost: number;
  number_of_hours: number;
  description: string;
}

const TopUpScreen: React.FC = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isConfirmationModalVisible, setIsConfirmationModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);

  // Profile picture component
  const ProfilePicture = ({ size = 120 }: { size?: number }) => {
    const getInitials = () => {
      if (!userProfile) return '?';
      const firstName = userProfile.first_name || '';
      const lastName = userProfile.last_name || '';
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    const profileImageUrl = userProfile?.profile_image || userProfile?.profile_image_url || user?.profile_image;

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
              console.warn('⚠️ Failed to load profile image (TopUpScreen):', profileImageUrl, error);
            }}
          />
        </View>
      );
    }

    return (
      <View style={[styles.profilePicture, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[styles.profileInitials, { fontSize: size * 0.3 }]}>
          {getInitials()}
        </Text>
      </View>
    );
  };

  const loadUserProfile = async () => {
    try {
      const profileResponse = await ApiService.ajaxGetProfile();
      if (profileResponse.success) {
        setUserProfile(profileResponse.data.user);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
      fetchPlans();
    }, [])
  );

  const fetchPlans = async () => {
    try {
      setLoading(true);
      const response = await ApiService.getSubscriptionPlans();
      if (response.success) {
        setPlans(response.data);
      } else {
        Alert.alert('Error', 'Failed to load subscription plans');
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
      Alert.alert('Error', 'Failed to load subscription plans');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (plan: any) => {
    setSelectedPlan(plan);
    setIsConfirmationModalVisible(true);
  };

  const handleCloseConfirmationModal = () => {
    setIsConfirmationModalVisible(false);
    setSelectedPlan(null);
  };

  const handleConfirmPurchase = async () => {
    if (selectedPlan) {
      try {
        setPurchasing(true);
        
        // For now, using payment method ID 1 (you can add payment method selection later)
        const response = await ApiService.purchaseSubscription(selectedPlan.plan_id, 1);
        
        if (response.success) {
          Alert.alert(
            'Purchase Successful!',
            `You have successfully purchased ${response.data.plan_name}!\n\nHours added: ${response.data.hours_added}\nTotal hours remaining: ${response.data.total_hours_remaining} hours`,
            [
              {
                text: 'OK',
                onPress: () => {
                  setIsConfirmationModalVisible(false);
                  setSelectedPlan(null);
                  router.back();
                }
              }
            ]
          );
        } else {
          Alert.alert('Purchase Failed', 'Failed to purchase subscription. Please try again.');
        }
      } catch (error) {
        console.error('Purchase error:', error);
        Alert.alert('Purchase Failed', 'An error occurred while purchasing. Please try again.');
      } finally {
        setPurchasing(false);
      }
    }
  };

  return (
    <View style={styles.container}>
      <SharedHeader 
        title="Top up" 
        showBackButton={true}
        onBackPress={() => router.back()}
      />
      
      <View style={styles.scrollContainer}>
        {/* Profile Card */}
        <View style={styles.profileCard}>
          {/* Profile Picture Section */}
          <View style={styles.profilePictureSection}>
            <View style={styles.profilePictureContainer}>
              <ProfilePicture size={getResponsiveSize(140)} />
            </View>
            <View style={styles.userInfoContainer}>
              {loading ? (
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

          {/* Plans Section */}
          <ScrollView 
            style={styles.profileCardScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.plansSection}>
              <View style={styles.plansHeader}>
                {maroonProfitHandIconSvg && (
                  <SvgXml 
                    xml={maroonProfitHandIconSvg}
                    width={getResponsiveSize(20)}
                    height={getResponsiveSize(20)}
                  />
                )}
                <Text style={styles.plansTitle}>Select a Plan:</Text>
              </View>
              
              <View style={styles.plansList}>
                {loading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#8A0000" />
                    <Text style={styles.loadingText}>Loading plans...</Text>
                  </View>
                ) : plans && plans.length > 0 ? (
                  plans.map((plan, index) => (
                    <TouchableOpacity 
                      key={plan.plan_id}
                      style={styles.planCard}
                      onPress={() => handleSelectPlan(plan)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.planHeader}>
                        <Text style={styles.planTitle}>{plan.plan_name}</Text>
                        <Text style={styles.planSubtitle}>{plan.description}</Text>
                      </View>
                      
                      <View style={styles.planContent}>
                        <View style={styles.priceSection}>
                          <Text style={styles.price}>{plan.cost}</Text>
                          <Text style={styles.currency}>pesos</Text>
                        </View>
                        
                        <View style={styles.hoursSection}>
                          {maroonTimeIconSvg && (
                            <SvgXml 
                              xml={maroonTimeIconSvg}
                              width={getResponsiveSize(20)}
                              height={getResponsiveSize(20)}
                            />
                          )}
                          <Text style={styles.hoursText}>{plan.number_of_hours} hours</Text>
                        </View>
                        
                        <TouchableOpacity 
                          style={styles.selectButton}
                          onPress={() => handleSelectPlan(plan)}
                        >
                          <Text style={styles.selectButtonText}>Select {plan.number_of_hours} hours</Text>
                        </TouchableOpacity>
                      </View>
                    </TouchableOpacity>
                  ))
                ) : (
                  <View style={styles.loadingContainer}>
                    <Text style={styles.loadingText}>No plans available</Text>
                  </View>
                )}
              </View>
            </View>
          </ScrollView>
        </View>
      </View>

      {/* Plan Confirmation Modal */}
      <Modal
        visible={isConfirmationModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseConfirmationModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Confirm Plan Selection</Text>
              <TouchableOpacity onPress={handleCloseConfirmationModal}>
                <Text style={styles.closeXButton}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {selectedPlan && (
              <View style={styles.planDetailsContainer}>
                <View style={styles.planInfoCard}>
                  <Text style={styles.planInfoTitle}>{selectedPlan.plan_name}</Text>
                  <Text style={styles.planInfoSubtitle}>{selectedPlan.description}</Text>
                  
                  <View style={styles.planInfoContent}>
                    <View style={styles.priceInfoSection}>
                      <Text style={styles.priceInfoLabel}>Total Amount:</Text>
                      <View style={styles.priceInfoValue}>
                        <Text style={styles.priceInfoAmount}>{selectedPlan.cost}</Text>
                        <Text style={styles.priceInfoCurrency}>pesos</Text>
                      </View>
                    </View>
                    
                    <View style={styles.hoursInfoSection}>
                      {maroonTimeIconSvg && (
                        <SvgXml 
                          xml={maroonTimeIconSvg}
                          width={getResponsiveSize(20)}
                          height={getResponsiveSize(20)}
                        />
                      )}
                      <Text style={styles.hoursInfoText}>{selectedPlan.number_of_hours} hours will be added to your account</Text>
                    </View>
                    
                    <Text style={styles.planDescription}>{selectedPlan.description}</Text>
                  </View>
                </View>
                
                <View style={styles.modalButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={handleCloseConfirmationModal}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.confirmButton, purchasing && styles.confirmButtonDisabled]}
                    onPress={handleConfirmPurchase}
                    disabled={purchasing}
                  >
                    {purchasing ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.confirmButtonText}>Confirm Purchase</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            )}
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
  profileCard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: getResponsiveSize(20),
    borderTopRightRadius: getResponsiveSize(20),
    paddingTop: getResponsivePadding(10),
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
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: getResponsivePadding(10),
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
  profileCardScroll: {
    flex: 1,
  },
  plansSection: {
    marginTop: getResponsivePadding(10),
  },
  plansHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsivePadding(15),
  },
  plansTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#8A0000',
    marginLeft: getResponsivePadding(10),
  },
  plansList: {
    paddingLeft: getResponsivePadding(10),
  },
  planCard: {
    backgroundColor: 'white',
    borderRadius: getResponsiveSize(12),
    marginBottom: getResponsivePadding(15),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  planHeader: {
    backgroundColor: '#F5F5F5',
    padding: getResponsivePadding(15),
  },
  planTitle: {
    fontSize: getResponsiveFontSize(18),
    fontWeight: 'bold',
    color: '#000',
    marginBottom: getResponsivePadding(5),
  },
  planSubtitle: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
  },
  planContent: {
    padding: getResponsivePadding(15),
  },
  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: getResponsivePadding(15),
  },
  price: {
    fontSize: getResponsiveFontSize(32),
    fontWeight: 'bold',
    color: '#8A0000',
  },
  currency: {
    fontSize: getResponsiveFontSize(16),
    color: '#000',
    marginLeft: getResponsivePadding(5),
  },
  hoursSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsivePadding(20),
  },
  hoursText: {
    fontSize: getResponsiveFontSize(16),
    color: '#8A0000',
    marginLeft: getResponsivePadding(10),
    fontWeight: 'bold',
  },
  selectButton: {
    backgroundColor: '#8A0000',
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(20),
    borderRadius: getResponsiveSize(8),
    alignItems: 'center',
  },
  selectButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(16),
    fontWeight: 'bold',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationModalContainer: {
    backgroundColor: 'white',
    borderRadius: getResponsiveSize(16),
    padding: getResponsivePadding(20),
    width: screenWidth * 0.9,
    maxWidth: 400,
    maxHeight: screenHeight * 0.75,
    minHeight: screenHeight * 0.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveMargin(20),
  },
  modalTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#1F2937',
    flex: 1,
  },
  closeXButton: {
    fontSize: getResponsiveFontSize(20),
    color: '#8A0000',
    fontWeight: 'bold',
  },
  planDetailsContainer: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: 0,
  },
  planInfoCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: getResponsiveSize(12),
    padding: getResponsivePadding(16),
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flex: 1,
    marginBottom: getResponsiveMargin(16),
  },
  planInfoTitle: {
    fontSize: getResponsiveFontSize(22),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsiveMargin(5),
  },
  planInfoSubtitle: {
    fontSize: getResponsiveFontSize(16),
    color: '#666666',
    marginBottom: getResponsiveMargin(15),
  },
  planInfoContent: {
    flex: 1,
  },
  priceInfoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: getResponsiveMargin(15),
    paddingBottom: getResponsivePadding(15),
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  priceInfoLabel: {
    fontSize: getResponsiveFontSize(16),
    color: '#333333',
    fontWeight: '600',
  },
  priceInfoValue: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceInfoAmount: {
    fontSize: getResponsiveFontSize(28),
    fontWeight: 'bold',
    color: '#8A0000',
  },
  priceInfoCurrency: {
    fontSize: getResponsiveFontSize(16),
    color: '#8A0000',
    marginLeft: getResponsivePadding(5),
  },
  hoursInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: getResponsiveMargin(15),
  },
  hoursInfoText: {
    fontSize: getResponsiveFontSize(16),
    color: '#8A0000',
    marginLeft: getResponsivePadding(10),
    fontWeight: '600',
  },
  planDescription: {
    fontSize: getResponsiveFontSize(14),
    color: '#666666',
    lineHeight: getResponsiveFontSize(20),
    fontStyle: 'italic',
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: getResponsiveMargin(12),
    marginTop: getResponsiveMargin(20),
    marginBottom: getResponsiveMargin(10),
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: getResponsiveSize(8),
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(16),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: getResponsiveSize(44),
  },
  cancelButtonText: {
    fontSize: getResponsiveFontSize(14),
    color: '#666666',
    fontWeight: '600',
    textAlign: 'center',
  },
  confirmButton: {
    flex: 1,
    backgroundColor: '#8A0000',
    borderRadius: getResponsiveSize(8),
    paddingVertical: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(16),
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: getResponsiveSize(44),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  confirmButtonText: {
    color: 'white',
    fontSize: getResponsiveFontSize(14),
    fontWeight: 'bold',
    textAlign: 'center',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: getResponsivePadding(40),
  },
  loadingText: {
    fontSize: getResponsiveFontSize(16),
    color: '#8A0000',
    marginTop: getResponsivePadding(10),
  },
  confirmButtonDisabled: {
    opacity: 0.6,
  },
});

export default TopUpScreen;
