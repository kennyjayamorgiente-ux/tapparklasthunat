import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
  Modal
} from 'react-native';
import { Image } from 'expo-image';
import { SvgXml } from 'react-native-svg';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import SharedHeader from '../components/SharedHeader';
import { useAuth } from '../contexts/AuthContext';
import { profileScreenStyles } from './styles/profileScreenStyles';
import { 
  maroonLockIconSvg,
  maroonNewCarIconSvg,
  maroonTestPaperIconSvg,
  maroonDebitIconSvg,
  maroonInfoIconSvg,
  writeMaroonIconSvg,
  whiteCustomerServiceIconSvg
} from './assets/icons/index2';
import { ApiService } from '../services/api';
import { useScreenDimensions } from '../hooks/use-screen-dimensions';


const ProfileScreen: React.FC = () => {
  const router = useRouter();
  const { user, checkAuthStatus } = useAuth();
  const refreshAuth = React.useMemo(() => (
    typeof checkAuthStatus === 'function'
      ? checkAuthStatus
      : async () => {
          console.warn('⚠️ checkAuthStatus is not available from AuthContext');
        }
  ), [checkAuthStatus]);
  const screenDimensions = useScreenDimensions();
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Profile picture component
  const ProfilePicture = ({ size = 120 }: { size?: number }) => {
    const getInitials = () => {
      const profileData = userProfile || user;
      if (!profileData) return '?';
      const firstName = profileData.first_name || '';
      const lastName = profileData.last_name || '';
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    };

    // Check for profile image in userProfile first, then user
    const profileImageUrl = userProfile?.profile_image || user?.profile_image;

    // If profile image URL is provided, show the image
    if (profileImageUrl) {
      return (
        <View style={[profileScreenStyles.profilePicture, { width: size, height: size, borderRadius: size / 2 }]}>
          <Image
            key={profileImageUrl}
            source={{ uri: profileImageUrl }}
            style={{ width: size - 4, height: size - 4, borderRadius: (size - 4) / 2 }}
            contentFit="cover"
            cachePolicy="none"
            transition={200}
            onError={({ error }) => {
              console.warn('⚠️ Failed to load profile image:', profileImageUrl, error);
            }}
          />
        </View>
      );
    }

    // Fallback to initials
    return (
      <View style={[profileScreenStyles.profilePicture, { width: size, height: size, borderRadius: size / 2 }]}>
        <Text style={[profileScreenStyles.profileInitials, { fontSize: size * 0.3 }]}>
          {getInitials()}
        </Text>
      </View>
    );
  };
  
  // Load user profile from API
  const loadUserProfile = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      
      // Check if user is authenticated before making API call
      if (!user) {
        console.log('⚠️ No user found, skipping profile load');
        setIsLoading(false);
        return;
      }
      
      const response = await ApiService.getProfile();
      if (response.success) {
        const updatedUser = response.data.user;
        if (updatedUser.profile_image) {
          const cacheBustedUrl = `${updatedUser.profile_image}?t=${Date.now()}`;
          updatedUser.profile_image = cacheBustedUrl;
          console.log('📸 Profile image URL:', cacheBustedUrl);
        }
        setUserProfile(updatedUser);
      } else {
        console.log('⚠️ Failed to load profile from API, using cached user data');
        setUserProfile(user);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      // Fallback to cached user data instead of showing error
      console.log('⚠️ Using cached user data due to API error');
      setUserProfile(user);
    } finally {
      setIsLoading(false);
    }
  };

  // Load profile when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadUserProfile();
    }, [])
  );
  
  const menuItems = [
    {
      id: 'changePassword',
      title: 'Change Password',
      icon: maroonLockIconSvg,
      onPress: () => router.push('/screens/ChangePasswordScreen')
    },
    {
      id: 'registeredVehicles',
      title: 'Registered Vehicles',
      icon: maroonNewCarIconSvg,
      onPress: () => router.push('/screens/RegisteredVehiclesScreen')
    },
    {
      id: 'termsConditions',
      title: 'Terms & Conditions',
      icon: maroonTestPaperIconSvg,
      onPress: () => router.push('/screens/TermsAndConditionsScreen')
    },
    {
      id: 'balance',
      title: 'Balance',
      icon: maroonDebitIconSvg,
      onPress: () => router.push('/screens/BalanceScreen')
    },
    {
      id: 'faq',
      title: 'FAQ',
      icon: maroonInfoIconSvg,
      onPress: () => router.push('/screens/FAQScreen')
    }
  ];

  const handleEditProfile = () => {
    setShowProfileModal(true);
  };

  const handleTakePhoto = async () => {
    setShowProfileModal(false);
    try {
      // Request camera permission
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'We need access to your camera to take a photo.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const handleChooseFromLibrary = async () => {
    setShowProfileModal(false);
    try {
      // Request media library permission
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'We need access to your photo library to upload a profile picture.',
            [{ text: 'OK' }]
          );
          return;
        }
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadProfilePicture(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error choosing from library:', error);
      Alert.alert('Error', 'Failed to choose image');
    }
  };

  const handleRemovePicture = () => {
    setShowProfileModal(false);
    deleteProfilePicture();
  };

  const uploadProfilePicture = async (imageUri: string) => {
    try {
      setUploading(true);
      const response = await ApiService.uploadProfilePicture(imageUri);

      if (response.success) {
        const latestImage = response.data?.profile_image;
        if (latestImage) {
          const cacheBustedUrl = `${latestImage}?t=${Date.now()}`;
          setUserProfile((prevProfile: typeof userProfile) => prevProfile ? { ...prevProfile, profile_image: cacheBustedUrl } : prevProfile);
        }
        // Reload profile to get updated image URL
        await loadUserProfile(true);
        // Also refresh auth context
        await refreshAuth();
        Alert.alert('Success', 'Profile picture uploaded successfully');
      } else {
        throw new Error(response.message || 'Upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Failed',
        error instanceof Error ? error.message : 'Failed to upload profile picture. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const deleteProfilePicture = async () => {
    try {
      Alert.alert(
        'Remove Profile Picture',
        'Are you sure you want to remove your profile picture?',
        [
          {
            text: 'Cancel',
            style: 'cancel',
          },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              try {
                setUploading(true);
                const response = await ApiService.deleteProfilePicture();

                if (response.success) {
                  // Reload profile
                  await loadUserProfile(true);
                  // Also refresh auth context
                  await refreshAuth();
                  Alert.alert('Success', 'Profile picture removed successfully');
                } else {
                  throw new Error(response.message || 'Delete failed');
                }
              } catch (error) {
                console.error('Delete error:', error);
                Alert.alert(
                  'Delete Failed',
                  error instanceof Error ? error.message : 'Failed to remove profile picture. Please try again.'
                );
              } finally {
                setUploading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Delete error:', error);
      Alert.alert('Error', 'Failed to delete profile picture');
    }
  };

  const handleHelp = () => {
    console.log('How can we help you pressed');
  };

  return (
    <View style={profileScreenStyles.container}>
      <SharedHeader title="Profile" />
      
      <View style={profileScreenStyles.scrollContainer}>

        {/* Profile Content Card */}
        <View style={profileScreenStyles.profileCard}>
          {/* Profile Picture Section */}
          <View style={profileScreenStyles.profilePictureSection}>
            <View style={profileScreenStyles.profilePictureContainer}>
              {uploading ? (
                <View style={{ width: screenDimensions.isTablet ? 140 : 120, height: screenDimensions.isTablet ? 140 : 120, justifyContent: 'center', alignItems: 'center' }}>
                  <ActivityIndicator size="large" color="#8A0000" />
                </View>
              ) : (
                <ProfilePicture size={screenDimensions.isTablet ? 140 : 120} />
              )}
              <TouchableOpacity 
                style={profileScreenStyles.editIconContainer} 
                onPress={handleEditProfile}
                disabled={uploading}
              >
                <SvgXml 
                  xml={writeMaroonIconSvg}
                  width={screenDimensions.isTablet ? 20 : 16}
                  height={screenDimensions.isTablet ? 20 : 16}
                />
              </TouchableOpacity>
            </View>
            
            {isLoading ? (
              <View style={profileScreenStyles.loadingContainer}>
                <ActivityIndicator size="small" color="#8A0000" />
                <Text style={profileScreenStyles.loadingText}>Loading profile...</Text>
              </View>
            ) : userProfile ? (
              <>
                <Text style={profileScreenStyles.userName}>
                  {userProfile.first_name} {userProfile.last_name}
                </Text>
                <Text style={profileScreenStyles.userEmail}>{userProfile.email}</Text>
              </>
            ) : (
              <>
                <Text style={profileScreenStyles.userName}>User</Text>
                <Text style={profileScreenStyles.userEmail}>No profile data</Text>
              </>
            )}
          </View>

          {/* Menu Items */}
          <View style={profileScreenStyles.menuContainer}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={profileScreenStyles.menuItem}
                onPress={item.onPress}
              >
                <SvgXml 
                  xml={item.icon}
                  width={screenDimensions.isTablet ? 28 : 24}
                  height={screenDimensions.isTablet ? 28 : 24}
                />
                <Text style={profileScreenStyles.menuItemText}>{item.title}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Help Button */}
          <TouchableOpacity style={profileScreenStyles.helpButton} onPress={handleHelp}>
            <SvgXml 
              xml={whiteCustomerServiceIconSvg}
              width={screenDimensions.isTablet ? 24 : 20}
              height={screenDimensions.isTablet ? 24 : 20}
            />
            <Text style={profileScreenStyles.helpButtonText}>How can we help you?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Picture Options Modal */}
      <Modal
        visible={showProfileModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowProfileModal(false)}
      >
        <TouchableOpacity 
          activeOpacity={1}
          style={profileScreenStyles.modalOverlay}
          onPress={() => setShowProfileModal(false)}
        >
          <View style={profileScreenStyles.modalContainer}>
            <Text style={profileScreenStyles.modalTitle}>Profile Picture</Text>
            <Text style={profileScreenStyles.modalSubtitle}>Choose an option</Text>
            
            <TouchableOpacity 
              style={profileScreenStyles.modalButton}
              onPress={handleTakePhoto}
            >
              <Text style={profileScreenStyles.modalButtonText}>Take Photo</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={profileScreenStyles.modalButton}
              onPress={handleChooseFromLibrary}
            >
              <Text style={profileScreenStyles.modalButtonText}>Choose from Library</Text>
            </TouchableOpacity>

            {(userProfile?.profile_image || user?.profile_image) && (
              <TouchableOpacity 
                style={profileScreenStyles.modalButtonRemove}
                onPress={handleRemovePicture}
              >
                <Text style={profileScreenStyles.modalButtonTextRemove}>Remove Picture</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity 
              style={profileScreenStyles.modalCancelButton}
              onPress={() => setShowProfileModal(false)}
            >
              <Text style={profileScreenStyles.modalCancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

// Styles are now imported from profileScreenStyles.ts

export default ProfileScreen;
