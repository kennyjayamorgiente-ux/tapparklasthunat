import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../contexts/DrawerContext';
import { useScreenDimensions, getAdaptiveFontSize, getAdaptiveSpacing, getAdaptivePadding } from '../hooks/use-screen-dimensions';

interface SharedHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightIcon?: string;
  onRightPress?: () => void;
  rightComponent?: React.ReactNode;
}

const SharedHeader: React.FC<SharedHeaderProps> = ({ 
  title = 'TapPark', 
  showBackButton = false, 
  onBackPress,
  rightIcon,
  onRightPress,
  rightComponent
}) => {
  const { toggleDrawer } = useDrawer();
  const screenDimensions = useScreenDimensions();
  const lastPressTime = useRef(0);

  const handleLeftPress = () => {
    const now = Date.now();
    if (now - lastPressTime.current < 300) return; // Debounce rapid presses
    lastPressTime.current = now;
    
    if (showBackButton && onBackPress) {
      onBackPress();
    } else {
      toggleDrawer();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={[styles.header, { 
        paddingHorizontal: getAdaptivePadding(screenDimensions, 20),
        paddingVertical: getAdaptivePadding(screenDimensions, 16) + 3
      }]}>
        <TouchableOpacity 
          style={styles.leftButton} 
          onPress={handleLeftPress}
        >
          <Ionicons 
            name={showBackButton ? "arrow-back" : "menu"} 
            size={screenDimensions.isTablet ? 28 : 24} 
            color="white" 
          />
        </TouchableOpacity>
        
        <Text style={[styles.headerTitle, { fontSize: getAdaptiveFontSize(screenDimensions, 20) }]}>{title}</Text>
        
        {rightComponent ? (
          <View style={styles.rightButton}>
            {rightComponent}
          </View>
        ) : rightIcon ? (
          <TouchableOpacity style={styles.rightButton} onPress={onRightPress}>
            <Ionicons name={rightIcon as any} size={screenDimensions.isTablet ? 28 : 24} color="white" />
          </TouchableOpacity>
        ) : (
          <View style={styles.rightButton} />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
    marginBottom: 0,
  },
  header: {
    backgroundColor: '#8A0000',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  leftButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  rightButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
});

export default SharedHeader;