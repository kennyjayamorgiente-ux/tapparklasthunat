import { getApiUrl } from '../config/api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system/legacy';

const MULTIPART_UPLOAD_TYPE = (FileSystem as any)?.FileSystemUploadType?.MULTIPART ?? 1;


// Get API URL based on environment (localhost for emulator, network IP for physical device)
const API_BASE_URL = getApiUrl();
console.log('🌍 API Base URL:', API_BASE_URL);

// API Service for Tapparkuser Backend
export class ApiService {
  private static baseURL = API_BASE_URL;
  
  private static buildUrl(endpoint: string): string {
    if (/^https?:\/\//i.test(endpoint)) {
      return endpoint;
    }

    const baseWithSlash = this.baseURL.endsWith('/') ? this.baseURL : `${this.baseURL}/`;
    const normalizedBase = baseWithSlash.replace(/\/+$/, '/');
    const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
    return `${normalizedBase}${normalizedEndpoint}`;
  }

  // Generic request method
  private static async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = this.buildUrl(endpoint);
    
    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add Authorization header if token exists
    const token = await this.getStoredToken();
    console.log('🔑 API Request - Token status:', token ? 'Token exists' : 'No token');
    console.log('🌐 API Request - URL:', url);
    
    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      console.warn('⚠️ No authentication token found for API request to:', endpoint);
    }

    const config: RequestInit = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      console.log(`📡 Attempting API request to: ${url}`);
      
      const response = await fetch(url, config);
      
      // Handle non-JSON responses (network errors, etc.)
      let data;
      const contentType = response.headers.get('content-type');
      
      try {
        const responseText = await response.text();
        console.log(`📥 Response status: ${response.status}, Content-Type: ${contentType}`);
        
        // Try to parse as JSON
        if (contentType && contentType.includes('application/json')) {
          try {
            data = JSON.parse(responseText);
          } catch (jsonError) {
            // If response is not valid JSON, throw a clearer error
            console.error('❌ Failed to parse JSON response:', responseText.substring(0, 200));
            throw new Error(`Invalid JSON response from server. Status: ${response.status}`);
          }
        } else {
          // For non-JSON responses
          if (!response.ok) {
            console.error('❌ Non-JSON error response:', responseText.substring(0, 200));
            throw new Error(`Server returned non-JSON response. Status: ${response.status}. ${responseText.substring(0, 100)}`);
          }
          // If response is OK but not JSON, return empty object
          data = {};
        }
      } catch (parseError) {
        // If we can't parse the response at all
        console.error('❌ Parse error:', parseError);
        throw new Error(`Unable to parse server response. Status: ${response.status}`);
      }

      if (!response.ok) {
        // Handle 401 Unauthorized - token is invalid or expired
        if (response.status === 401) {
          console.log('🔐 Token expired or invalid, removing token');
          await this.removeToken();
          throw new Error('Authentication error: Please login again');
        }
        // Handle 503 Service Unavailable - usually database connection errors
        if (response.status === 503) {
          const errorMessage = data.message || data.error || 'Service unavailable';
          console.error(`❌ Database Error (${response.status}):`, errorMessage);
          throw new Error(errorMessage);
        }
        // Include full error details for debugging
        const errorMessage = data.message || data.error || `HTTP error! status: ${response.status}`;
        console.error(`❌ API Error (${response.status}):`, errorMessage);
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      // Handle network errors (connection refused, timeout, etc.)
      // Check for various network error patterns
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorString = String(error);
      
      if (
        error instanceof TypeError ||
        errorString.includes('Failed to fetch') ||
        errorString.includes('Network request failed') ||
        errorString.includes('NetworkError') ||
        errorMessage.includes('fetch') ||
        errorMessage.includes('network') ||
        errorMessage.includes('ECONNREFUSED') ||
        errorMessage.includes('ENOTFOUND')
      ) {
        console.error('🌐 Network error detected:', errorMessage);
        console.error('🔍 URL attempted:', url);
        console.error('💡 Make sure:');
        console.error('   1. Backend server is running');
        console.error('   2. IP address is correct:', url);
        console.error('   3. Device and computer are on the same WiFi network');
        console.error('   4. Firewall allows connections on port 3000');
        throw new Error(`Network error: Cannot reach server at ${this.baseURL}. Ensure backend is running and devices are on the same network.`);
      }
      
      // Don't log authentication errors that are expected
      if (error instanceof Error && (
        error.message.includes('Authentication error') ||
        error.message.includes('Access token required') ||
        error.message.includes('Please login again') ||
        error.message.includes('401') ||
        error.message.includes('Invalid email or password')
      )) {
        // Only log in debug mode, don't spam console
        console.log('🔐 Authentication issue:', error.message);
        throw error;
      }
      
      // Re-throw the error if it's already an Error instance with a message
      if (error instanceof Error) {
        console.error('❌ API Request failed:', error.message);
        throw error;
      }
      
      console.error('❌ API Request failed (unknown error):', error);
      throw error instanceof Error ? error : new Error(String(error));
    }
  }

  // Token management
  private static token: string | null = null;
  private static readonly TOKEN_KEY = 'tappark_auth_token';
  private static tokenInitialized = false;

  // Initialize token from AsyncStorage on app start
  static async initializeToken(): Promise<void> {
    if (this.tokenInitialized) return;
    
    try {
      const storedToken = await AsyncStorage.getItem(this.TOKEN_KEY);
      if (storedToken) {
        this.token = storedToken;
        console.log('Token initialized from AsyncStorage');
      }
      this.tokenInitialized = true;
    } catch (error) {
      console.error('Error initializing token:', error);
      this.tokenInitialized = true;
    }
  }

  static async getStoredToken(): Promise<string | null> {
    try {
      // First check in-memory token
      if (this.token) {
        return this.token;
      }
      
      // If not in memory, try to get from AsyncStorage
      const storedToken = await AsyncStorage.getItem(this.TOKEN_KEY);
      if (storedToken) {
        this.token = storedToken; // Cache in memory
        return storedToken;
      }
      
      return null;
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  private static async storeToken(token: string): Promise<void> {
    try {
      // Store token in both memory and AsyncStorage
      this.token = token;
      await AsyncStorage.setItem(this.TOKEN_KEY, token);
      console.log('Token stored in memory and AsyncStorage');
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  private static async removeToken(): Promise<void> {
    try {
      // Remove token from both memory and AsyncStorage
      this.token = null;
      await AsyncStorage.removeItem(this.TOKEN_KEY);
      console.log('Token removed from memory and AsyncStorage');
    } catch (error) {
      console.error('Failed to remove token:', error);
    }
  }

  // Authentication endpoints
  static async login(email: string, password: string) {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: {
        user: {
          user_id: number;
          email: string;
          first_name: string;
          last_name: string;
          hour_balance: number;
          type_id: number;
          account_type_name: string;
        };
        token: string;
      };
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store token after successful login
    if (response.success && response.data.token) {
      await this.storeToken(response.data.token);
    }

    return response;
  }

  static async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const response = await this.request<{
      success: boolean;
      message: string;
      data: {
        user: {
          id: number;
          email: string;
          firstName: string;
          lastName: string;
          phone?: string;
          isVerified: boolean;
        };
        token: string;
      };
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    // Store token after successful registration
    if (response.success && response.data.token) {
      await this.storeToken(response.data.token);
    }

    return response;
  }

  static async logout() {
    try {
      await this.request('/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Always remove token locally
      await this.removeToken();
    }
  }

  static async getProfile() {
    return this.request<{
      success: boolean;
      data: {
        user: {
          user_id: number;
          email: string;
          first_name: string;
          last_name: string;
          phone?: string;
          profile_image?: string;
          hour_balance: number;
          is_verified: boolean;
          created_at: string;
          type_id: number;
          account_type_name: string;
        };
      };
    }>('/auth/profile');
  }

  // Upload profile picture
  static async uploadProfilePicture(imageUri: string) {
    const token = await this.getStoredToken();
    if (!token) {
      throw new Error('Authentication required');
    }

    // Create FormData
    const formData = new FormData();
    
    // Extract filename from URI and determine type
    const filename = imageUri.split('/').pop() || 'profile.jpg';
    const match = /\.(\w+)$/.exec(filename.toLowerCase());
    let mimeType = 'image/jpeg';
    if (match) {
      const ext = match[1];
      if (ext === 'png') mimeType = 'image/png';
      else if (ext === 'gif') mimeType = 'image/gif';
      else if (ext === 'webp') mimeType = 'image/webp';
    }

    // Append file to FormData
    formData.append('profilePicture', {
      uri: imageUri,
      type: mimeType,
      name: filename,
    } as any);

    const url = this.buildUrl('/auth/profile/picture');

    try {
      console.log('📤 Uploading profile picture to:', url);

      const uploadResult = await FileSystem.uploadAsync(url, imageUri, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        httpMethod: 'POST',
        uploadType: MULTIPART_UPLOAD_TYPE as any,
        fieldName: 'profilePicture',
        mimeType,
        parameters: {},
      });

      let responseData: any = {};

      if (uploadResult.body) {
        try {
          responseData = JSON.parse(uploadResult.body);
        } catch (jsonError) {
          console.warn('⚠️ Upload response not JSON:', uploadResult.body?.slice(0, 200));
        }
      }

      if (uploadResult.status !== 200) {
        const errorMessage = responseData.message || responseData.error || `Failed to upload profile picture (status ${uploadResult.status})`;
        console.error('❌ Upload profile picture failed:', {
          status: uploadResult.status,
          url,
          responseBody: uploadResult.body?.slice(0, 200)
        });
        throw new Error(errorMessage);
      }

      return responseData;
    } catch (error) {
      console.error('Upload profile picture error:', error);
      throw error;
    }
  }

  // Delete profile picture
  static async deleteProfilePicture() {
    return this.request<{
      success: boolean;
      message: string;
    }>('/auth/profile/picture', {
      method: 'DELETE',
    });
  }

  // Change password
  static async changePassword(currentPassword: string, newPassword: string) {
    return this.request<{
      success: boolean;
      message: string;
    }>('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({
        currentPassword,
        newPassword
      }),
    });
  }

  // Vehicle endpoints
  static async getVehicles() {
    return this.request<{
      success: boolean;
      data: {
        vehicles: Array<{
          id: number;
          plate_number: string;
          vehicle_type: string;
          brand?: string;
          model?: string;
          color?: string;
          is_default: boolean;
          created_at: string;
        }>;
      };
    }>('/vehicles');
  }

  static async addVehicle(vehicleData: {
    plateNumber: string;
    vehicleType: string;
    brand?: string;
    model?: string;
    color?: string;
    isDefault?: boolean;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        vehicle: {
          id: number;
          plate_number: string;
          vehicle_type: string;
          brand?: string;
          model?: string;
          color?: string;
          is_default: boolean;
          created_at: string;
        };
      };
    }>('/vehicles', {
      method: 'POST',
      body: JSON.stringify(vehicleData),
    });
  }

  // Parking endpoints
  static async getParkingLocations(lat?: number, lng?: number, radius?: number) {
    const params = new URLSearchParams();
    if (lat) params.append('lat', lat.toString());
    if (lng) params.append('lng', lng.toString());
    if (radius) params.append('radius', radius.toString());

    const queryString = params.toString();
    const endpoint = queryString ? `/parking/locations?${queryString}` : '/parking/locations';

    return this.request<{
      success: boolean;
      data: {
        locations: Array<{
          id: number;
          name: string;
          address: string;
          latitude: number;
          longitude: number;
          total_spots: number;
          available_spots: number;
          hourly_rate: number;
          daily_rate: number;
          operating_hours: Record<string, any>;
          amenities: string[];
          is_active: boolean;
        }>;
      };
    }>(endpoint);
  }

  static async startParking(vehicleId: number, locationId: number) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        session: {
          id: number;
          qrCode: string;
          qrCodeImage: string;
          startTime: string;
          hourlyRate: number;
        };
      };
    }>('/parking/start', {
      method: 'POST',
      body: JSON.stringify({ vehicleId, locationId }),
    });
  }

  static async endParking(sessionId: number) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        session: {
          id: number;
          durationMinutes: number;
          totalCost: number;
          endTime: string;
        };
      };
    }>(`/parking/end/${sessionId}`, {
      method: 'POST',
    });
  }

  static async getActiveSession() {
    return this.request<{
      success: boolean;
      data: {
        session: {
          id: number;
          plate_number: string;
          vehicle_type: string;
          location_name: string;
          start_time: string;
          duration_minutes: number;
          current_cost: number;
        } | null;
      };
    }>('/parking/active');
  }

  // Payment endpoints
  static async getBalance() {
    return this.request<{
      success: boolean;
      data: {
        balance: number;
      };
    }>('/payments/balance');
  }

  static async topUpWallet(amount: number, paymentMethod: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        transactionId: string;
        amount: number;
        newBalance: number;
      };
    }>('/payments/topup', {
      method: 'POST',
      body: JSON.stringify({ amount, paymentMethod }),
    });
  }

  // Health check
  static async healthCheck() {
    return this.request<{
      success: boolean;
      status: string;
      timestamp: string;
      environment: string;
      version: string;
    }>('/health');
  }

  // Parking Areas endpoints
  static async getParkingAreas() {
    return this.request<{
      success: boolean;
      data: {
        locations: Array<{
          id: number;
          name: string;
          address: string;
          latitude: number | null;
          longitude: number | null;
          total_spots: number;
          available_spots: number;
          hourly_rate: string;
          daily_rate: string;
          operating_hours: string;
          amenities: string;
          is_active: string;
        }>;
      };
    }>('/parking/locations');
  }

  static async getParkingSpots(areaId: number, vehicleType?: string) {
    const query = new URLSearchParams();
    if (vehicleType) {
      query.append('vehicleType', vehicleType);
    }

    const queryString = query.toString();
    const url = queryString
      ? `/parking-areas/areas/${areaId}/spots?${queryString}`
      : `/parking-areas/areas/${areaId}/spots`;

    return this.request<{
      success: boolean;
      data: {
        spots: Array<{
          id: number;
          spot_number: string;
          status: string;
          spot_type: string;
          section_name: string;
        }>;
      };
    }>(url);
  }

  static async bookParkingSpot(vehicleId: number, spotId: number, areaId: number) {
    return this.request<{
      success: boolean;
      data: {
        reservationId: number;
        qrCode: string;
        message: string;
        bookingDetails: {
          reservationId: number;
          qrCode: string;
          vehiclePlate: string;
          vehicleType: string;
          vehicleBrand: string;
          areaName: string;
          areaLocation: string;
          spotNumber: string;
          spotType: string;
          startTime: string;
          status: string;
        };
      };
    }>('/parking-areas/book', {
      method: 'POST',
      body: JSON.stringify({
        vehicleId,
        spotId,
        areaId
      }),
    });
  }

  // Timer is now purely local - no server-side timer needed

  // Get user history
  static async getHistory(page: number = 1, limit: number = 20, type?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (type) {
      params.append('type', type);
    }
    
    return this.request<{
      success: boolean;
      data: {
        history: any[];
        pagination: {
          currentPage: number;
          totalPages: number;
          totalItems: number;
          itemsPerPage: number;
        };
      };
    }>(`/history?${params.toString()}`);
  }

  // Get parking history only
  static async getParkingHistory(page: number = 1, limit: number = 10, status?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (status) {
      params.append('status', status);
    }
    
    return this.request<{
      success: boolean;
      data: {
        sessions: any[];
        pagination: {
          currentPage: number;
          totalPages: number;
          totalItems: number;
          itemsPerPage: number;
        };
      };
    }>(`/history/parking?${params.toString()}`);
  }

  // Get payment history only
  static async getPaymentHistory(page: number = 1, limit: number = 10, type?: string) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });
    
    if (type) {
      params.append('type', type);
    }
    
    return this.request<{
      success: boolean;
      data: {
        payments: any[];
        pagination: {
          currentPage: number;
          totalPages: number;
          totalItems: number;
          itemsPerPage: number;
        };
      };
    }>(`/history/payments?${params.toString()}`);
  }

  // Get history statistics
  static async getHistoryStats(period: number = 30) {
    return this.request<{
      success: boolean;
      data: {
        parking: {
          total_sessions: number;
          completed_sessions: number;
          active_sessions: number;
        };
        payments: {
          total_payments: number;
          total_topup: number;
          total_parking_fees: number;
          avg_parking_cost: number;
        };
        monthlyBreakdown: Array<{
          month: string;
          sessions_count: number;
        }>;
        topLocations: Array<{
          location_name: string;
          visit_count: number;
        }>;
      };
    }>(`/history/stats?period=${period}`);
  }

  // Get parking spot ID from reservation ID
  static async getParkingSpotIdFromReservation(reservationId: number) {
    return this.request<{
      success: boolean;
      data: {
        parkingSpotId: number;
      };
    }>(`/parking-areas/reservation/${reservationId}/parking-spot-id`);
  }

  static async getBookingDetails(reservationId: number) {
    // Add cache-busting parameter to prevent caching
    const timestamp = Date.now();
    return this.request<{
      success: boolean;
      data: {
        reservationId: number;
        displayName: string;
        userEmail: string;
        vehicleDetails: {
          plateNumber: string;
          vehicleType: string;
          brand: string;
          color: string;
        };
        parkingArea: {
          name: string;
          location: string;
        };
        parkingSlot: {
          spotNumber: string;
          spotType: string;
          sectionName: string;
        };
        timestamps: {
          bookingTime: string;
          startTime: string;
        };
        bookingStatus: string;
        qrCode: string;
      };
    }>(`/parking-areas/booking/${reservationId}?t=${timestamp}`);
  }

  static async getMyBookings() {
    // Add cache-busting parameter to prevent caching
    const timestamp = Date.now();
    return this.request<{
      success: boolean;
      data: {
        bookings: Array<{
          reservationId: number;
          displayName: string;
          userEmail: string;
          vehicleDetails: {
            plateNumber: string;
            vehicleType: string;
            brand: string;
            color: string;
          };
          parkingArea: {
            name: string;
            location: string;
          };
          parkingSlot: {
            spotNumber: string;
            spotType: string;
            sectionName: string;
          };
          timestamps: {
            bookingTime: string;
            startTime: string;
          };
          bookingStatus: string;
          qrCode: string;
        }>;
      };
    }>(`/parking-areas/my-bookings?t=${timestamp}`);
  }

  static async endParkingSession(reservationId: number) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        reservationId: number;
        status: string;
        spotFreed: boolean;
      };
    }>(`/parking-areas/end-session/${reservationId}`, {
      method: 'PUT',
    });
  }

  // Favorites API methods
  static async getFavorites() {
    return this.request<{
      success: boolean;
      data: {
        favorites: Array<{
          favorites_id: number;
          parking_spot_id: number;
          user_id: number;
          created_at: string;
          spot_number: string;
          spot_type: string;
          spot_status: string;
          parking_section_id: number;
          section_name: string;
          parking_area_id: number;
          parking_area_name: string;
          location: string;
          hourly_rate: number;
        }>;
      };
    }>('/favorites');
  }

  static async addFavorite(parkingSpotId: number) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/favorites/${parkingSpotId}`, {
      method: 'POST',
    });
  }

  static async removeFavorite(parkingSpotId: number) {
    return this.request<{
      success: boolean;
      message: string;
    }>(`/favorites/${parkingSpotId}`, {
      method: 'DELETE',
    });
  }

  static async checkFavorite(parkingSpotId: number) {
    return this.request<{
      success: boolean;
      data: {
        isFavorite: boolean;
      };
    }>(`/favorites/check/${parkingSpotId}`);
  }

  // Subscription/Plans API methods
  static async getSubscriptionPlans() {
    return this.request<{
      success: boolean;
      data: Array<{
        plan_id: number;
        plan_name: string;
        cost: number;
        number_of_hours: number;
        description: string;
      }>;
    }>('/subscriptions/plans');
  }

  static async purchaseSubscription(planId: number, paymentMethodId: number) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        plan_name: string;
        hours_added: number;
        cost: number;
        total_hours_remaining: number;
      };
    }>('/subscriptions/purchase', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: planId,
        payment_method_id: paymentMethodId
      })
    });
  }

  static async getSubscriptionBalance() {
    return this.request<{
      success: boolean;
      data: {
        total_hours_remaining: number;
        total_hours_used: number;
        active_subscriptions: number;
        user_hour_balance: number;
        subscriptions: Array<{
          subscription_id: number;
          purchase_date: string;
          hours_remaining: number;
          hours_used: number;
          plan_name: string;
          cost: number;
          number_of_hours: number;
        }>;
      };
    }>('/subscriptions/balance');
  }

  // Get frequently used parking spots
  static async getFrequentSpots(limit: number = 5) {
    return this.request<{
      success: boolean;
      data: {
        frequent_spots: Array<{
          location_name: string;
          location_address: string;
          spot_number: string;
          spot_type: string;
          parking_spot_id: number;
          usage_count: number;
          last_used: string;
          status: string;
          current_reservation: any;
        }>;
      };
    }>(`/history/frequent-spots?limit=${limit}`);
  }

  // Attendant API methods
  static async getVehicleTypes() {
    return this.request<{
      success: boolean;
      data: {
        vehicleTypes: Array<{
          id: string;
          name: string;
          totalCapacity: number;
          occupied: number;
          available: number;
          reserved: number;
        }>;
      };
    }>('/attendant/vehicle-types');
  }

  static async getParkingSlots() {
    return this.request<{
      success: boolean;
      data: {
        parkingSlots: Array<{
          id: string;
          slotId: string;
          vehicleType: string;
          status: 'available' | 'occupied' | 'reserved';
          section: string;
          occupantName?: string;
          plateNumber?: string;
        }>;
      };
    }>('/attendant/parking-slots');
  }

  static async getDashboardStats() {
    return this.request<{
      success: boolean;
      data: {
        totalSlots: number;
        occupiedSlots: number;
        availableSlots: number;
        reservedSlots: number;
        occupancyRate: number;
      };
    }>('/attendant/dashboard-stats');
  }

  static async getParkingSlotDetails(slotId: string) {
    return this.request<{
      success: boolean;
      data: {
        slotDetails: {
          id: string;
          slotId: string;
          vehicleType: string;
          status: string;
          section: string;
          areaName: string;
          location: string;
        };
      };
    }>(`/attendant/parking-slot/${slotId}`);
  }

  static async getAttendantProfile() {
    return this.request<{
      success: boolean;
      data: {
        attendantProfile: {
          attendantId: string;
          attendantName: string;
          email: string;
          hourBalance: number;
          accountType: string;
          assignedAreas: string;
          createdAt: string;
        };
      };
    }>('/attendant/profile');
  }

  static async getNotificationSettings() {
    return this.request<{
      success: boolean;
      data: {
        notificationSettings: {
          newReservationAlerts: boolean;
          lowCapacityAlerts: boolean;
          systemMaintenanceAlerts: boolean;
          emailNotifications: boolean;
          pushNotifications: boolean;
        };
      };
    }>('/attendant/notification-settings');
  }

  static async updateNotificationSettings(notificationSettings: {
    newReservationAlerts: boolean;
    lowCapacityAlerts: boolean;
    systemMaintenanceAlerts: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
  }) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        notificationSettings: typeof notificationSettings;
      };
    }>('/attendant/notification-settings', {
      method: 'PUT',
      body: JSON.stringify({ notificationSettings }),
    });
  }

  // QR Scanner API methods for attendants
  static async startParkingSessionViaQR(qrCodeData: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        reservationId: number;
        vehiclePlate: string;
        spotNumber: string;
        areaName: string;
        location: string;
        startTime: string;
        status: string;
      };
    }>('/attendant/start-parking-session', {
      method: 'POST',
      body: JSON.stringify({ qrCodeData }),
    });
  }

  static async endParkingSessionViaQR(qrCodeData: string) {
    return this.request<{
      success: boolean;
      message: string;
      data: {
        reservationId: number;
        vehiclePlate: string;
        spotNumber: string;
        areaName: string;
        location: string;
        startTime: string;
        endTime: string;
        durationMinutes: number;
        status: string;
      };
    }>('/attendant/end-parking-session', {
      method: 'POST',
      body: JSON.stringify({ qrCodeData }),
    });
  }

  static async getParkingSessionStatus(qrCode: string) {
    return this.request<{
      success: boolean;
      data: {
        reservationId: number;
        vehiclePlate: string;
        spotNumber: string;
        areaName: string;
        location: string;
        status: string;
        startTime: string;
        endTime: string;
        durationMinutes: number;
      };
    }>(`/attendant/parking-session-status/${qrCode}`);
  }

  // Get parking scan history for attendants
  static async getParkingScanHistory() {
    return this.request<{
      success: boolean;
      data: {
        scans: Array<{
          id: string;
          reservationId: number;
          vehiclePlate: string;
          vehicleType: string;
          vehicleBrand: string;
          parkingArea: string;
          parkingSlot: string;
          scanType: 'start' | 'end';
          scanTime: string;
          attendantName: string;
          userType: string;
          status: string;
        }>;
      };
    }>('/attendant/scan-history');
  }

  // Parking Layout API Methods
  static async getParkingAreaLayout(areaId: number) {
    return this.request<{
      success: boolean;
      data: {
        areaId: number;
        areaName: string;
        location: string;
        layoutName: string;
        layoutSvg: string;
        hasLayout: boolean;
      };
    }>(`/parking-areas/area/${areaId}/layout`);
  }

  static async getParkingLayouts() {
    return this.request<{
      success: boolean;
      data: {
        layouts: Array<{
          areaId: number;
          areaName: string;
          location: string;
          floor: number;
          hasLayoutData: boolean;
          layoutDataLength: number;
          createdAt: string;
        }>;
      };
    }>('/parking-areas/layouts');
  }

  static async loadLayoutSvg(layoutName: string) {
    const url = this.buildUrl(`/parking-areas/layout/${layoutName}`);

    return fetch(url)
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.text();
      });
  }

}

export default ApiService;
