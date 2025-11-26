import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal, Dimensions, Animated } from 'react-native';
import { useLoading } from '../contexts/LoadingContext';
import { useScreenDimensions, getAdaptiveFontSize } from '../hooks/use-screen-dimensions';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const GlobalSpinner: React.FC = () => {
  const { isLoading, loadingMessage } = useLoading();
  const screenDimensions = useScreenDimensions();
  const insets = useSafeAreaInsets();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isLoading) {
      const shimmer = Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      shimmer.start();
      return () => shimmer.stop();
    }
  }, [isLoading]);

  if (!isLoading) return null;

  const shimmerOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  // Header height + safe area
  const headerHeight = 68 + insets.top;

  return (
    <Modal
      visible={isLoading}
      transparent={true}
      animationType="fade"
      statusBarTranslucent={true}
    >
      <View style={[styles.overlay, { top: headerHeight }]}>
        <View style={styles.contentArea}>
          {/* Content Skeleton */}
          <View style={styles.contentSkeleton}>
            <Animated.View style={[styles.skeletonBox, { width: '80%', height: 30, marginBottom: 20, opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonBox, { width: '60%', height: 20, marginBottom: 15, opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonBox, { width: '90%', height: 15, marginBottom: 10, opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonBox, { width: '85%', height: 15, marginBottom: 10, opacity: shimmerOpacity }]} />
            <Animated.View style={[styles.skeletonBox, { width: '70%', height: 15, marginBottom: 20, opacity: shimmerOpacity }]} />
            
            {/* Card Skeleton */}
            <View style={styles.cardSkeleton}>
              <Animated.View style={[styles.skeletonBox, { width: '100%', height: 120, borderRadius: 8, opacity: shimmerOpacity }]} />
            </View>
          </View>

          {/* Loading Indicator */}
          <View style={styles.loadingIndicator}>
            <ActivityIndicator size="small" color="#8A0000" />
            {loadingMessage && (
              <Text style={[styles.message, { fontSize: getAdaptiveFontSize(screenDimensions, 14) }]}>
                {loadingMessage}
              </Text>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    zIndex: 9999,
    elevation: 9999,
  },
  contentArea: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  contentSkeleton: {
    flex: 1,
  },
  skeletonBox: {
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
  },
  cardSkeleton: {
    marginTop: 20,
  },
  loadingIndicator: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    marginTop: 8,
    color: '#8A0000',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default GlobalSpinner;
