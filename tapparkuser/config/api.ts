import Constants from 'expo-constants';
import { Platform, NativeModules } from 'react-native';

// API Configuration for Tapparkuser
export const API_CONFIG = {
  // Your computer's IP address (from ipconfig)
  COMPUTER_IP: '192.168.0.110',
  
  // API Base URLs
  LOCALHOST: 'http://localhost:3000/api',
  NETWORK: 'http://192.168.0.110:3000/api',
  
  // Current environment
  // Change this to 'network' when testing on physical device
  ENVIRONMENT: 'network' as 'localhost' | 'network',

  // Set to false to disable auto-detection and always use the values above
  AUTO_DETECT: false,
};

const API_PORT = 3000;
const API_PATH = '/api';

const stripProtocol = (value: string) => value.replace(/^[a-zA-Z]+:\/\//, '');

const normalizeLocalhostForPlatform = (host: string) => {
  if (Platform.OS === 'android' && (host === 'localhost' || host === '127.0.0.1')) {
    return '10.0.2.2';
  }
  return host;
};

const getExpoDetectedHost = (): string | null => {
  const expoConfigCandidates: Array<string | undefined | null> = [
    Constants?.expoGoConfig?.debuggerHost,
    Constants?.expoGoConfig?.hostUri,
    (Constants as any)?.expoConfig?.hostUri || null
  ];

  for (const candidate of expoConfigCandidates) {
    if (!candidate) continue;

    const cleanedCandidate = stripProtocol(candidate);
    const hostPart = cleanedCandidate.split(':')[0];

    if (!hostPart) continue;

    // Use Android emulator loopback when necessary
    const normalizedHost = normalizeLocalhostForPlatform(hostPart);
    return `${normalizedHost}:${API_PORT}`;
  }

  return null;
};

const getSourceModuleHost = (): string | null => {
  const scriptURL: string | undefined = NativeModules?.SourceCode?.scriptURL;
  if (!scriptURL) return null;

  const match = scriptURL.match(/^https?:\/\/([^/:]+)(?::(\d+))?/);
  if (!match) return null;

  const host = normalizeLocalhostForPlatform(match[1]);
  return `${host}:${API_PORT}`;
};

const buildUrlFromHost = (hostWithPort: string) => `http://${hostWithPort}${API_PATH}`;

// Get the appropriate API URL based on environment
export const getApiUrl = () => {
  const detectedHost = getExpoDetectedHost() || getSourceModuleHost();
  if (__DEV__) {
    console.log('[API CONFIG] AUTO_DETECT:', API_CONFIG.AUTO_DETECT);
    console.log('[API CONFIG] detectedHost via Expo:', getExpoDetectedHost());
    console.log('[API CONFIG] detectedHost via SourceModule:', getSourceModuleHost());
    console.log('[API CONFIG] configured NETWORK host:', API_CONFIG.NETWORK);
  }

  if (API_CONFIG.AUTO_DETECT) {
    if (__DEV__ && detectedHost) {
      return buildUrlFromHost(detectedHost);
    }

    if (detectedHost) {
      return buildUrlFromHost(detectedHost);
    }
  }

  return API_CONFIG.ENVIRONMENT === 'network' 
    ? API_CONFIG.NETWORK 
    : API_CONFIG.LOCALHOST;
};

export default API_CONFIG;



