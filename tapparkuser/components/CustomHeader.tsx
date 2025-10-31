import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface CustomHeaderProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  onMenuPress?: () => void;
}

const CustomHeader: React.FC<CustomHeaderProps> = ({ 
  title = 'TapPark', 
  showBackButton = false, 
  onBackPress,
  onMenuPress
}) => {

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#8A0000" />
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.menuButton} 
          onPress={showBackButton ? onBackPress : onMenuPress}
        >
          <Ionicons name="menu" size={24} color="white" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>{title}</Text>
        
        <TouchableOpacity style={styles.addButton}>
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: '#8A0000',
    paddingTop: 44, // Account for status bar
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  menuButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
  },
});

export default CustomHeader;
