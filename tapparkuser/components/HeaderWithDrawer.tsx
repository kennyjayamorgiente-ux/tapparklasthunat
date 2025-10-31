import React from 'react';
import { useSidebar } from '../contexts/SidebarContext';
import CustomHeader from './CustomHeader';

interface HeaderWithDrawerProps {
  title?: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
}

const HeaderWithDrawer: React.FC<HeaderWithDrawerProps> = (props) => {
  const { toggleSidebar } = useSidebar();
  
  return <CustomHeader {...props} onMenuPress={toggleSidebar} />;
};

export default HeaderWithDrawer;
