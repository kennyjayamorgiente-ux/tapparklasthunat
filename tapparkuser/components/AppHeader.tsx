import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useDrawer } from '../contexts/DrawerContext';

interface AppHeaderProps {
  title: string;
  rightIcon?: string;
  onRightPress?: () => void;
}

const AppHeader: React.FC<AppHeaderProps> = ({ 
  title, 
  rightIcon, 
  onRightPress 
}) => {
  const { toggleDrawer } = useDrawer();

  return (
    <View style={styles.header}>
      <TouchableOpacity 
        style={styles.menuButton}
        onPress={toggleDrawer}
      >
        <Ionicons name="menu" size={24} color="white" />
      </TouchableOpacity>
      
      <Text style={styles.title}>{title}</Text>
      
      {rightIcon ? (
        <TouchableOpacity style={styles.rightButton} onPress={onRightPress}>
          <Ionicons name={rightIcon as any} size={24} color="white" />
        </TouchableOpacity>
      ) : (
        <View style={styles.rightButton} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#8A0000',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuButton: {
    padding: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
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

export default AppHeader;
