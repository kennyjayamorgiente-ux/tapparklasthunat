import React, { useState, useEffect, useRef } from 'react';
import {
  Text,
  TouchableOpacity,
  View,
  Animated,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Dimensions,
  ScrollView
} from 'react-native';
import { SvgXml } from 'react-native-svg';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { PinchGestureHandler, State } from 'react-native-gesture-handler';
import SharedHeader from '../../components/SharedHeader';
import InteractiveParkingLayout from '../../components/InteractiveParkingLayout';
import { getActiveParkingScreenStyles } from '../styles/activeParkingScreenStyles';
import { useThemeColors, useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import ApiService from '../../services/api';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// Enhanced responsive calculations
const isSmallScreen = screenWidth < 375;
const isMediumScreen = screenWidth >= 375 && screenWidth < 414;
const isLargeScreen = screenWidth >= 414 && screenWidth < 768;
const isTablet = screenWidth >= 768 && screenWidth < 1024;
const isLargeTablet = screenWidth >= 1024;

const getResponsiveFontSize = (baseSize: number): number => {
  if (isSmallScreen) return baseSize * 0.85;
  if (isMediumScreen) return baseSize * 0.95;
  if (isLargeScreen) return baseSize;
  if (isTablet) return baseSize * 1.1;
  if (isLargeTablet) return baseSize * 1.2;
  return baseSize;
};

const getResponsiveSize = (baseSize: number): number => {
  if (isSmallScreen) return baseSize * 0.8;
  if (isMediumScreen) return baseSize * 0.9;
  if (isLargeScreen) return baseSize;
  if (isTablet) return baseSize * 1.05;
  if (isLargeTablet) return baseSize * 1.1;
  return baseSize;
};

const getResponsivePadding = (basePadding: number): number => {
  if (isSmallScreen) return basePadding * 0.8;
  if (isMediumScreen) return basePadding * 0.9;
  if (isLargeScreen) return basePadding;
  if (isTablet) return basePadding * 1.1;
  if (isLargeTablet) return basePadding * 1.2;
  return basePadding;
};

const getResponsiveMargin = (baseMargin: number): number => {
  if (isSmallScreen) return baseMargin * 0.8;
  if (isMediumScreen) return baseMargin * 0.9;
  if (isLargeScreen) return baseMargin;
  if (isTablet) return baseMargin * 1.1;
  if (isLargeTablet) return baseMargin * 1.2;
  return baseMargin;
};

// Helper function to format decimal hours to HH.MM format (e.g., 83.5 -> "83.30")
const formatHoursToHHMM = (decimalHours: number): string => {
  if (!decimalHours || decimalHours === 0) return '0.00';
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  return `${hours}.${minutes.toString().padStart(2, '0')}`;
};

const ActiveParkingScreen: React.FC = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colors = useThemeColors();
  const { isDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  const activeParkingScreenStyles = getActiveParkingScreenStyles(colors);
  const [activeTab, setActiveTab] = useState('ticket');
  
  // Booking data state
  const [bookingData, setBookingData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // SVG Layout state
  const [svgContent, setSvgContent] = useState<string>('');
  const [isLoadingSvg, setIsLoadingSvg] = useState(false);
  const [layoutId, setLayoutId] = useState<number | null>(null);
  
  // Clickable spots from SVG
  const [clickableSpots, setClickableSpots] = useState<Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    spotNumber?: string;
    spotId?: string;
  }>>([]);
  const [selectedSpot, setSelectedSpot] = useState<any>(null);
  const [showSpotModal, setShowSpotModal] = useState(false);
  
  // Spot statuses from backend (matched by spot_number)
  const [spotStatuses, setSpotStatuses] = useState<Map<string, {
    id: number;
    spot_number: string;
    status: string;
    spot_type: string;
    section_name: string;
    is_user_booked?: boolean | number; // Indicates if current user has booked this spot
  }>>(new Map());
  
  // Zoom state for SVG - using regular state for simplicity
  const [scale, setScale] = React.useState(1);
  const savedScaleRef = React.useRef(1);
  
  // Display state
  const [qrScanned, setQrScanned] = useState(false);
  const [parkingEndTime, setParkingEndTime] = useState<number | null>(null);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showParkingEndModal, setShowParkingEndModal] = useState(false);
  const [parkingEndDetails, setParkingEndDetails] = useState<any>(null);
  
  // Timer state and logic
  const [elapsedTime, setElapsedTime] = useState(0); // in seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false); // Start as false, will start when attendant scans
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  // Real parking start time from booking data
  const parkingStartTime = useRef<number | null>(null);
  const totalParkingTime = 60 * 60; // 1 hour total parking time in seconds

  // Format duration helper
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  // Handle parking end modal close
  const handleParkingEndModalClose = () => {
    setShowParkingEndModal(false);
    setParkingEndDetails(null);
    // Clear all parking data
    setBookingData(null);
    setElapsedTime(0);
    setParkingEndTime(null);
    setQrScanned(false);
    parkingStartTime.current = null;
    // Navigate back to home
    router.replace('/screens/HomeScreen');
  };


  // Parse SVG to extract clickable elements
  const parseSvgForClickableElements = (svgString: string) => {
    const spots: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
      spotNumber?: string;
      spotId?: string;
    }> = [];
    
    try {
      // Extract viewBox to calculate relative positions
      const viewBoxMatch = svgString.match(/viewBox=["']([^"']+)["']/);
      let viewBox = { x: 0, y: 0, width: 276, height: 322 }; // Default
      if (viewBoxMatch) {
        const parts = viewBoxMatch[1].trim().split(/[\s,]+/).filter(p => p).map(Number);
        if (parts.length >= 4) {
          viewBox = { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
        }
      }
      
      // Also try to get width/height attributes
      const widthMatch = svgString.match(/width=["']([^"']+)["']/);
      const heightMatch = svgString.match(/height=["']([^"']+)["']/);
      if (widthMatch && heightMatch) {
        const w = parseFloat(widthMatch[1]);
        const h = parseFloat(heightMatch[1]);
        if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
          viewBox.width = w;
          viewBox.height = h;
        }
      }
      
      // Find all elements with IDs (likely parking spots)
      const idRegex = /<(\w+)[^>]*\sid=["']([^"']+)["'][^>]*>/g;
      let match;
      
      while ((match = idRegex.exec(svgString)) !== null) {
        const elementType = match[1];
        const id = match[2];
        const fullElement = match[0];
        const matchIndex = match.index;
        
        // Skip elements with "element" in their ID - these are not parking spots
        const idLower = id.toLowerCase();
        if (idLower.includes('element')) {
          console.log(`🚫 Skipping element (not a parking spot): ${id}`);
          continue;
        }
        
        // Check if this element is inside a road group (handle nested groups)
        const beforeMatch = svgString.substring(0, matchIndex);
        let isInRoadGroup = false;
        let accumulatedTransform: { x: number; y: number } = { x: 0, y: 0 };
        
        // Find all parent groups and check for road groups, also accumulate transforms
        let searchPos = matchIndex;
        const parentGroups: Array<{ tag: string; index: number }> = [];
        
        while (searchPos >= 0) {
          const lastGroupOpen = beforeMatch.lastIndexOf('<g', searchPos);
          const lastGroupClose = beforeMatch.lastIndexOf('</g>', searchPos);
          
          if (lastGroupOpen > lastGroupClose && lastGroupOpen >= 0) {
            const groupTagStart = lastGroupOpen;
            const groupTagEnd = beforeMatch.indexOf('>', groupTagStart) + 1;
            if (groupTagEnd > groupTagStart) {
              const groupTag = beforeMatch.substring(groupTagStart, groupTagEnd);
              parentGroups.push({ tag: groupTag, index: groupTagStart });
              
              // Check if this group is a road group
              const groupIdMatch = groupTag.match(/id=["']([^"']+)["']/i);
              const groupClassMatch = groupTag.match(/class=["']([^"']+)["']/i);
              
              if (groupIdMatch && groupIdMatch[1].toLowerCase().includes('road')) {
                isInRoadGroup = true;
                break;
              }
              if (groupClassMatch && groupClassMatch[1].toLowerCase().includes('road')) {
                isInRoadGroup = true;
                break;
              }
              
              // Accumulate transform from parent groups (for nested floors/sections)
              const transformMatch = groupTag.match(/transform=["']translate\(([^)]+)\)["']/);
              if (transformMatch) {
                const coords = transformMatch[1].split(/[,\s]+/).map(parseFloat);
                accumulatedTransform.x += coords[0] || 0;
                accumulatedTransform.y += coords[1] || 0;
              }
              
              searchPos = lastGroupOpen - 1;
            } else {
              break;
            }
          } else {
            break;
          }
        }
        
        // Skip road elements - check if ID or class contains "road" (case-insensitive)
        const classMatch = fullElement.match(/class=["']([^"']+)["']/i);
        const classLower = classMatch ? classMatch[1].toLowerCase() : '';
        
        if (idLower.includes('road') || classLower.includes('road') || isInRoadGroup) {
          console.log(`🚫 Skipping road element: ${id}${isInRoadGroup ? ' (in road group)' : ''}`);
          continue;
        }
        
        // Extract coordinates based on element type
        let x = 0, y = 0, width = 0, height = 0;
        
        if (elementType === 'rect') {
          const xMatch = fullElement.match(/x=["']([^"']+)["']/);
          const yMatch = fullElement.match(/y=["']([^"']+)["']/);
          const widthMatch = fullElement.match(/width=["']([^"']+)["']/);
          const heightMatch = fullElement.match(/height=["']([^"']+)["']/);
          
          x = xMatch ? parseFloat(xMatch[1]) : 0;
          y = yMatch ? parseFloat(yMatch[1]) : 0;
          width = widthMatch ? parseFloat(widthMatch[1]) : 40;
          height = heightMatch ? parseFloat(heightMatch[1]) : 20;
        } else if (elementType === 'circle') {
          const cxMatch = fullElement.match(/cx=["']([^"']+)["']/);
          const cyMatch = fullElement.match(/cy=["']([^"']+)["']/);
          const rMatch = fullElement.match(/r=["']([^"']+)["']/);
          
          const cx = cxMatch ? parseFloat(cxMatch[1]) : 0;
          const cy = cyMatch ? parseFloat(cyMatch[1]) : 0;
          const r = rMatch ? parseFloat(rMatch[1]) : 10;
          
          x = cx - r;
          y = cy - r;
          width = r * 2;
          height = r * 2;
        } else if (elementType === 'g') {
          // For groups, find the complete group element and its children
          // Find the matching closing </g> tag
          let depth = 1;
          let pos = matchIndex + fullElement.length;
          let groupEnd = -1;
          
          while (pos < svgString.length && depth > 0) {
            const nextOpen = svgString.indexOf('<g', pos);
            const nextClose = svgString.indexOf('</g>', pos);
            
            if (nextClose === -1) break;
            
            if (nextOpen !== -1 && nextOpen < nextClose) {
              depth++;
              pos = nextOpen + 2;
            } else {
              depth--;
              if (depth === 0) {
                groupEnd = nextClose + 4;
                break;
              }
              pos = nextClose + 4;
            }
          }
          
          if (groupEnd === -1) {
            // Couldn't find closing tag, skip
            continue;
          }
          
          const groupContent = svgString.substring(matchIndex, groupEnd);
          
          // Check for transform on the group and combine with accumulated parent transforms
          const transformMatch = fullElement.match(/transform=["']translate\(([^)]+)\)["']/);
          let tx = accumulatedTransform.x;
          let ty = accumulatedTransform.y;
          if (transformMatch) {
            const coords = transformMatch[1].split(/[,\s]+/).map(parseFloat);
            tx += coords[0] || 0;
            ty += coords[1] || 0;
          }
          
          // Look for rect elements inside the group - find the largest one (likely the main parking spot)
          // Also handle nested groups within this group (for sections/floors)
          type RectInfo = { x: number; y: number; width: number; height: number; area: number };
          let largestRect: RectInfo | null = null;
          
          // Extract inner content of the group (without the opening/closing tags) for processing
          const groupTagEndPos = matchIndex + fullElement.length;
          const innerGroupContent = svgString.substring(groupTagEndPos, groupEnd - 4);
          
          // Function to recursively find rects in nested groups
          // Add depth limit to prevent infinite recursion
          const findRectsInContent = (content: string, parentTx: number, parentTy: number, depth: number = 0): void => {
            // Safety: prevent infinite recursion (max depth of 10 levels)
            if (depth > 10) {
              console.warn('⚠️ Maximum recursion depth reached in findRectsInContent');
              return;
            }
            
            // Safety: prevent processing empty or too large content
            if (!content || content.length > 100000) {
              return;
            }
            
            // Find all rects in content (including nested ones - we'll filter by group depth later if needed)
            const rectRegex = /<rect[^>]*>/g;
            const rectMatches: RegExpExecArray[] = [];
            let rectMatch;
            
            // Collect all rect matches first
            rectRegex.lastIndex = 0; // Reset regex
            while ((rectMatch = rectRegex.exec(content)) !== null) {
              rectMatches.push(rectMatch);
            }
            
            // Process found rects
            for (const match of rectMatches) {
              const rectElement = match[0];
              const rxMatch = rectElement.match(/x=["']([^"']+)["']/);
              const ryMatch = rectElement.match(/y=["']([^"']+)["']/);
              const rWidthMatch = rectElement.match(/width=["']([^"']+)["']/);
              const rHeightMatch = rectElement.match(/height=["']([^"']+)["']/);
              
              if (rxMatch && ryMatch && rWidthMatch && rHeightMatch) {
                const rx = parseFloat(rxMatch[1]);
                const ry = parseFloat(ryMatch[1]);
                const rw = parseFloat(rWidthMatch[1]);
                const rh = parseFloat(rHeightMatch[1]);
                
                if (!isNaN(rx) && !isNaN(ry) && !isNaN(rw) && !isNaN(rh) && rw > 0 && rh > 0) {
                  const area = rw * rh;
                  // Keep the largest rect (this represents the main parking spot area)
                  if (!largestRect || area > largestRect.area) {
                    largestRect = {
                      x: rx + parentTx,
                      y: ry + parentTy,
                      width: rw,
                      height: rh,
                      area: area
                    };
                  }
                }
              }
            }
            
            // Also check nested groups (for floors/sections) - but limit recursion
            // Use indexOf instead of regex to avoid regex state issues
            const processedGroups = new Set<number>(); // Track processed group start positions
            let groupCount = 0;
            const maxGroups = 50; // Limit number of groups to process
            let searchStart = 0;
            
            while (groupCount < maxGroups && searchStart < content.length) {
              const groupOpenPos = content.indexOf('<g', searchStart);
              if (groupOpenPos === -1) break;
              
              // Skip if we've already processed this group
              if (processedGroups.has(groupOpenPos)) {
                searchStart = groupOpenPos + 2;
                continue;
              }
              processedGroups.add(groupOpenPos);
              
              const groupTagEnd = content.indexOf('>', groupOpenPos);
              if (groupTagEnd === -1) {
                searchStart = groupOpenPos + 2;
                continue;
              }
              
              const nestedGroupTag = content.substring(groupOpenPos, groupTagEnd + 1);
              
              // Find matching closing tag
              let nestedDepth = 1;
              let nestedPos = groupTagEnd;
              let nestedGroupEnd = -1;
              
              while (nestedPos < content.length && nestedDepth > 0) {
                const nextOpen = content.indexOf('<g', nestedPos);
                const nextClose = content.indexOf('</g>', nestedPos);
                
                if (nextClose === -1) break;
                
                if (nextOpen !== -1 && nextOpen < nextClose) {
                  nestedDepth++;
                  nestedPos = nextOpen + 2;
                } else {
                  nestedDepth--;
                  if (nestedDepth === 0) {
                    nestedGroupEnd = nextClose + 4;
                    break;
                  }
                  nestedPos = nextClose + 4;
                }
              }
              
              if (nestedGroupEnd > groupOpenPos && nestedGroupEnd <= content.length) {
                // Extract inner content (without the group tags) to prevent re-processing
                const innerContent = content.substring(groupTagEnd + 1, nestedGroupEnd - 4);
                
                // Only process if inner content is not empty
                if (innerContent && innerContent.trim().length > 0) {
                  const nestedTransformMatch = nestedGroupTag.match(/transform=["']translate\(([^)]+)\)["']/);
                  let nestedTx = parentTx;
                  let nestedTy = parentTy;
                  
                  if (nestedTransformMatch) {
                    const nestedCoords = nestedTransformMatch[1].split(/[,\s]+/).map(parseFloat);
                    nestedTx += nestedCoords[0] || 0;
                    nestedTy += nestedCoords[1] || 0;
                  }
                  
                  // Recursively search nested groups with increased depth
                  findRectsInContent(innerContent, nestedTx, nestedTy, depth + 1);
                  groupCount++;
                }
                
                // Move search position past this group to avoid re-processing
                searchStart = nestedGroupEnd;
              } else {
                // If we couldn't find the closing tag, skip this group
                searchStart = groupTagEnd + 1;
              }
            }
          };
          
          // Process the inner content of the group (without the group tags themselves)
          findRectsInContent(innerGroupContent, tx, ty, 0);
          
          // Also look for path elements in the group and calculate bounding box (including nested)
          const pathRegex = /<path[^>]*d=["']([^"']+)["'][^>]*>/g;
          let pathMatch;
          let pathMinX = Infinity, pathMinY = Infinity, pathMaxX = -Infinity, pathMaxY = -Infinity;
          let foundPath = false;
          
          // Reset regex lastIndex
          pathRegex.lastIndex = 0;
          while ((pathMatch = pathRegex.exec(innerGroupContent)) !== null) {
            const pathData = pathMatch[1];
            // Parse path data to get bounding box (simplified - handles M, L, H, V commands)
            const coords: number[] = [];
            const numbers = pathData.match(/[-+]?[0-9]*\.?[0-9]+/g);
            if (numbers) {
              numbers.forEach(num => {
                const val = parseFloat(num);
                if (!isNaN(val)) coords.push(val);
              });
              
              // Get min/max from coordinates
              if (coords.length >= 2) {
                for (let i = 0; i < coords.length; i += 2) {
                  if (i + 1 < coords.length) {
                    const px = coords[i] + tx;
                    const py = coords[i + 1] + ty;
                    pathMinX = Math.min(pathMinX, px);
                    pathMinY = Math.min(pathMinY, py);
                    pathMaxX = Math.max(pathMaxX, px);
                    pathMaxY = Math.max(pathMaxY, py);
                    foundPath = true;
                  }
                }
              }
            }
          }
          
          // Use the largest rect if found, otherwise use path bounds, otherwise fallback
          if (largestRect) {
            x = (largestRect as RectInfo).x;
            y = (largestRect as RectInfo).y;
            width = (largestRect as RectInfo).width;
            height = (largestRect as RectInfo).height;
          } else if (foundPath) {
            x = pathMinX;
            y = pathMinY;
            width = pathMaxX - pathMinX;
            height = pathMaxY - pathMinY;
          } else {
            // Fallback: try transform only with estimated size based on viewBox
            if (transformMatch) {
              x = tx;
              y = ty;
              // Use reasonable default size - adjust based on typical parking spot sizes
              width = viewBox.width / 5; // About 1/5 of viewBox width
              height = viewBox.height / 10; // About 1/10 of viewBox height
            } else {
              continue; // Skip if no transform and no rects/paths found
            }
          }
        }
        
        // Extract spot number from ID (handle various formats)
        // Formats: "F1-A-1", "A-1", "spot-1", "parking-1", "section-a-spot-1", etc.
        let spotNumber = id;
        
        // Try different patterns
        // Pattern 1: F{floor}-{section}-{number} or {section}-{number}
        const sectionSpotMatch = id.match(/(?:F\d+-)?([A-Z]+)-(\d+)/i);
        if (sectionSpotMatch) {
          spotNumber = sectionSpotMatch[2]; // Use just the number part
        } else {
          // Pattern 2: spot-{number} or parking-{number}
          const spotMatch = id.match(/(?:spot|parking)[-_]?(\d+)/i);
          if (spotMatch) {
            spotNumber = spotMatch[1];
          } else {
            // Pattern 3: Any number in the ID
            const numMatch = id.match(/(\d+)/);
            if (numMatch) {
              spotNumber = numMatch[1];
            }
          }
        }
        
        // Only add if we have valid coordinates and reasonable size
        if (width > 0 && height > 0 && !isNaN(width) && !isNaN(height)) {
          spots.push({
            id,
            x,
            y,
            width,
            height,
            spotNumber,
            spotId: id,
          });
        }
      }
      
      // Also look for text elements that might indicate spot numbers
      const textRegex = /<text[^>]*>([^<]+)<\/text>/g;
      while ((match = textRegex.exec(svgString)) !== null) {
        const textContent = match[1].trim();
        const textElement = match[0];
        
        // Check if text looks like a spot number
        if (/^\d+$/.test(textContent)) {
          const xMatch = textElement.match(/x=["']([^"']+)["']/);
          const yMatch = textElement.match(/y=["']([^"']+)["']/);
          
          if (xMatch && yMatch) {
            const x = parseFloat(xMatch[1]);
            const y = parseFloat(yMatch[1]);
            
            // Check if we already have a spot at this location
            const existingSpot = spots.find(s => 
              Math.abs(s.x - x) < 20 && Math.abs(s.y - y) < 20
            );
            
            if (!existingSpot) {
              spots.push({
                id: `text-spot-${textContent}`,
                x: x - 15,
                y: y - 10,
                width: 30,
                height: 20,
                spotNumber: textContent,
                spotId: `spot-${textContent}`,
              });
            } else {
              // Update existing spot with number
              existingSpot.spotNumber = textContent;
            }
          }
        }
      }
      
      console.log(`✅ Parsed ${spots.length} clickable spots from SVG`);
    } catch (error) {
      console.error('❌ Error parsing SVG:', error);
    }
    
    return spots;
  };

  // Function to load spot statuses from backend (with smooth update like attendant dashboard)
  const loadSpotStatuses = async (areaId: number, skipChangeCheck = false) => {
    try {
      console.log('📊 Loading spot statuses for area:', areaId);
      const response = await ApiService.getParkingSpotsStatus(areaId);
      
      if (response.success && response.data.spots) {
        // Create a Map for quick lookup by spot_number and ID
        const newStatusMap = new Map();
        response.data.spots.forEach((spot: any) => {
          // Store by spot_number (primary key)
          newStatusMap.set(spot.spot_number, spot);
          // Also store by ID for fallback matching (matches HomeScreen approach)
          newStatusMap.set(spot.id.toString(), spot);
        });
        
        // Only update if there are changes (to avoid unnecessary re-renders)
        if (!skipChangeCheck) {
          setSpotStatuses(currentStatuses => {
            // Check if there are any changes
            let hasChanges = false;
            
            // Check if any spot status changed
            for (const [spotNumber, newSpot] of newStatusMap.entries()) {
              const currentSpot = currentStatuses.get(spotNumber);
              if (!currentSpot || currentSpot.status !== newSpot.status) {
                hasChanges = true;
                break;
              }
            }
            
            // Also check if any spots were added or removed
            if (!hasChanges && currentStatuses.size !== newStatusMap.size) {
              hasChanges = true;
            }
            
            if (hasChanges) {
              console.log('📊 Spot statuses have changes, updating...');
              return newStatusMap;
            } else {
              console.log('📊 No changes detected in spot statuses, skipping update');
              return currentStatuses;
            }
          });
        } else {
          // Initial load - always update
          setSpotStatuses(newStatusMap);
          console.log(`✅ Loaded ${newStatusMap.size} spot statuses`);
        }
      } else {
        console.log('⚠️ No spot statuses found');
        if (skipChangeCheck) {
          setSpotStatuses(new Map());
        }
      }
    } catch (error) {
      console.error('❌ Error loading spot statuses:', error);
      if (skipChangeCheck) {
        setSpotStatuses(new Map());
      }
    }
  };

  // Function to load SVG content using AJAX
  const loadSvgContent = async (forceRefresh = false) => {
    if (!bookingData?.parkingArea?.id) return;
    
    // Clear existing content if forcing refresh
    if (forceRefresh) {
      setSvgContent('');
      setClickableSpots([]);
    }
    
    setIsLoadingSvg(true);
    try {
      console.log('🖼️ Loading parking layout for area:', bookingData.parkingArea.id, forceRefresh ? '(FORCE REFRESH)' : '');
      
      // Load spot statuses in parallel with SVG (initial load - skip change check)
      loadSpotStatuses(bookingData.parkingArea.id, true);
      
      // Get the layout info with SVG content directly
      const layoutInfo = await ApiService.getParkingAreaLayout(bookingData.parkingArea.id);
      console.log('📦 Layout info response:', layoutInfo);
      
      if (layoutInfo.success && layoutInfo.data.hasLayout && layoutInfo.data.layoutSvg) {
        console.log('✅ Layout found with SVG content, length:', layoutInfo.data.layoutSvg.length);
        console.log('📄 SVG preview (first 200 chars):', layoutInfo.data.layoutSvg.substring(0, 200));
        console.log('🆔 Layout ID:', layoutInfo.data.layoutId);
        setSvgContent(layoutInfo.data.layoutSvg);
        setLayoutId(layoutInfo.data.layoutId);
        
        // Parse SVG for clickable elements
        const spots = parseSvgForClickableElements(layoutInfo.data.layoutSvg);
        setClickableSpots(spots);
      } else {
        console.log('❌ No layout available for this area');
        console.log('📊 Response data:', {
          success: layoutInfo.success,
          hasLayout: layoutInfo.data?.hasLayout,
          hasSvg: !!layoutInfo.data?.layoutSvg,
          layoutSvgLength: layoutInfo.data?.layoutSvg?.length || 0
        });
        setSvgContent('');
        setClickableSpots([]);
        setLayoutId(null);
      }
    } catch (error) {
      console.error('❌ Error loading SVG content:', error);
      setSvgContent('');
      setClickableSpots([]);
      setLayoutId(null);
    } finally {
      setIsLoadingSvg(false);
    }
  };

  // Load SVG when layout tab is activated - always fetch fresh data
  useEffect(() => {
    if (activeTab === 'layout' && bookingData) {
      loadSvgContent(true); // Force refresh when tab is activated
    }
  }, [activeTab, bookingData]);

  // Real-time polling for spot status updates (like attendant dashboard)
  useEffect(() => {
    if (activeTab !== 'layout' || !bookingData?.parkingArea?.id) {
      return; // Only poll when layout tab is active
    }

    let pollingInterval: ReturnType<typeof setInterval> | null = null;
    
    // Start polling every 10 seconds to update spot statuses
    const startPolling = () => {
      console.log('🔄 Starting real-time polling for parking spot statuses...');
      
      pollingInterval = setInterval(async () => {
        try {
          console.log('📡 Polling spot statuses for real-time updates...');
          await loadSpotStatuses(bookingData.parkingArea.id);
        } catch (error) {
          console.error('❌ Error during spot status polling:', error);
        }
      }, 10000); // Poll every 10 seconds (same as attendant dashboard)
    };

    // Start polling after initial load
    const timer = setTimeout(() => {
      startPolling();
    }, 2000); // Wait 2 seconds after initial load

    // Cleanup function
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
      if (pollingInterval) {
        console.log('🛑 Stopping real-time polling for spot statuses');
        clearInterval(pollingInterval);
      }
    };
  }, [activeTab, bookingData?.parkingArea?.id]);

  // Fetch booking data when component mounts
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setIsLoading(true);
        
        
        // Get reservation ID from params (passed from HomeScreen)
        const reservationId = params.reservationId || params.sessionId;
        console.log('🎯 ActiveParkingScreen - Params received:', params);
        console.log('🎯 ActiveParkingScreen - Reservation ID:', reservationId);
        
        if (reservationId) {
          // Try to get booking details by reservation ID
          const response = await ApiService.getBookingDetails(Number(reservationId));
          if (response.success) {
            setBookingData(response.data);
            
            // If booking is already active, start timer immediately
            if (response.data.bookingStatus === 'active' && response.data.timestamps.startTime) {
              const startTime = new Date(response.data.timestamps.startTime).getTime();
              parkingStartTime.current = startTime;
              setIsTimerRunning(true);
              // Calculate elapsed time from database start_time
              const calculatedElapsed = Math.floor((Date.now() - startTime) / 1000);
              setElapsedTime(calculatedElapsed);
              setQrScanned(true);
              console.log(`🟢 Booking already active - starting timer immediately with ${calculatedElapsed}s elapsed`);
            } else {
              // Set real parking start time from database (but don't start timer yet)
              if (response.data.timestamps.startTime) {
                const startTime = new Date(response.data.timestamps.startTime).getTime();
                parkingStartTime.current = startTime;
              }
              // Always start with timer off - wait for QR scan
              setElapsedTime(0);
              setIsTimerRunning(false);
            }
          } else {
            Alert.alert('Error', 'Failed to load booking details');
            router.back();
          }
        } else {
          // Fallback: check for active reservations
          console.log('🎯 ActiveParkingScreen - No reservation ID, checking for active bookings...');
          const response = await ApiService.getMyBookings();
          console.log('🎯 ActiveParkingScreen - My bookings response:', JSON.stringify(response, null, 2));
          
          if (response.success && response.data.bookings.length > 0) {
            console.log('🎯 ActiveParkingScreen - Found bookings:', response.data.bookings.length);
            // Find the most recent active or reserved reservation
            const activeReservation = response.data.bookings.find(
              (booking: any) => booking.bookingStatus === 'active' || booking.bookingStatus === 'reserved'
            );
            
            if (activeReservation) {
              console.log('✅ Found active/reserved reservation:', activeReservation.reservationId, 'Status:', activeReservation.bookingStatus);
              setBookingData(activeReservation);
              
              // If reservation is already active, start timer immediately
              if (activeReservation.bookingStatus === 'active' && activeReservation.timestamps?.startTime) {
                const startTime = new Date(activeReservation.timestamps.startTime).getTime();
                parkingStartTime.current = startTime;
                setIsTimerRunning(true);
                // Calculate elapsed time from database start_time
                const calculatedElapsed = Math.floor((Date.now() - startTime) / 1000);
                setElapsedTime(calculatedElapsed);
                setQrScanned(true);
                console.log(`🟢 Reservation already active - starting timer immediately with ${calculatedElapsed}s elapsed`);
              } else {
                // Timer is now purely local - starts only when attendant scans
                // Don't set parkingStartTime here - it will be set when attendant scans
                parkingStartTime.current = null;
                setElapsedTime(0);
                setIsTimerRunning(false);
              }
            } else {
              console.log('❌ No active or reserved reservations found');
              console.log('📊 All booking statuses:', response.data.bookings.map(b => ({ id: b.reservationId, status: b.bookingStatus })));
              setBookingData(null);
            }
          } else {
            console.log('No bookings found');
            setBookingData(null);
          }
        }
      } catch (error) {
        console.error('Error fetching booking data:', error);
        setBookingData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBookingData();
  }, [params.reservationId, params.sessionId, router]);

  // Simple local timer - ONLY controlled by attendant scans
  useEffect(() => {
    if (isTimerRunning && parkingStartTime.current !== null) {
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = Math.floor((now - parkingStartTime.current!) / 1000);
        setElapsedTime(elapsed);
        
        // Update progress animation
        const progress = Math.min(elapsed / totalParkingTime, 1);
        Animated.timing(progressAnim, {
          toValue: progress,
          duration: 1000,
          useNativeDriver: false,
        }).start();
      }, 1000);
      
      intervalRef.current = interval;
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [isTimerRunning, parkingStartTime.current, totalParkingTime, progressAnim]);

  // Clear data when component unmounts
  useEffect(() => {
    return () => {
      // Clear all data when leaving the screen
      setBookingData(null);
      setIsTimerRunning(false);
      setElapsedTime(0);
      setParkingEndTime(null);
      setQrScanned(false);
      parkingStartTime.current = null;
    };
  }, []);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Check if we have booking data and verify it's still active
      if (bookingData) {
        const checkActiveStatus = async () => {
          try {
            const response = await ApiService.getBookingDetails(bookingData.reservationId);
            if (response.success && response.data) {
              if (response.data.bookingStatus !== 'active' && response.data.bookingStatus !== 'reserved') {
                console.log('Reservation is no longer active, clearing data');
                setBookingData(null);
                setIsTimerRunning(false);
                setElapsedTime(0);
                setParkingEndTime(null);
                setQrScanned(false);
                parkingStartTime.current = null;
              }
            }
          } catch (error) {
            console.error('Error checking reservation status:', error);
          }
        };
        
        checkActiveStatus();
      }
    }, [bookingData])
  );

  // Real-time polling to sync with attendant actions
  useEffect(() => {
    // Don't poll if user is not authenticated
    if (!isAuthenticated) {
      console.log('🔐 User not authenticated - skipping reservation polling');
      return;
    }

    if (!bookingData?.reservationId) return;

    let pollingInterval: ReturnType<typeof setInterval> | null = null;

    const pollReservationStatus = async () => {
      // Double-check authentication before each poll
      if (!isAuthenticated) {
        console.log('🔐 User logged out during polling - stopping');
        if (pollingInterval) {
          clearInterval(pollingInterval);
          pollingInterval = null;
        }
        return;
      }

      try {
        console.log('🔄 Polling reservation status for real-time sync...');
        const response = await ApiService.getBookingDetails(bookingData.reservationId);
        
        if (response.success) {
          const bookingData = response.data;
          console.log('📊 Current booking status:', bookingData);

          // If attendant started the session and our timer isn't running
          if (bookingData.bookingStatus === 'active' && !isTimerRunning && bookingData.timestamps.startTime) {
            console.log('🟢 Attendant started session - syncing timer');
            // Use current time as start time to ensure timer starts from 0
            // This avoids delays from database time vs client time
            const currentTime = Date.now();
            parkingStartTime.current = currentTime;
            setIsTimerRunning(true);
            setElapsedTime(0); // Always start from 0 when first detected
            setQrScanned(true);
            console.log(`⏱️ Timer started from 0 at ${new Date(currentTime).toISOString()}`);
          }
          
          // If attendant ended the session and our timer is still running
          if (bookingData.bookingStatus === 'completed' && isTimerRunning) {
            console.log('🔴 Attendant ended session - stopping timer');
            setIsTimerRunning(false);
            setParkingEndTime(Date.now());
            
            // Fetch parking end details
            try {
              const endDetailsResponse = await ApiService.getBookingDetails(bookingData.reservationId);
              if (endDetailsResponse.success) {
                const details = endDetailsResponse.data;
                // Calculate duration
                const startTime = new Date(details.timestamps.startTime);
                const endTime = new Date();
                const durationMinutes = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60));
                // Convert to decimal hours (e.g., 30 minutes = 0.50 hours, 90 minutes = 1.50 hours)
                const durationHours = durationMinutes / 60;
                
                // Wait a moment for backend to process the deduction, then get updated balance
                await new Promise(resolve => setTimeout(resolve, 500));
                
                // Get user's subscription balance AFTER deduction (balance should already be updated by backend)
                const balanceResponse = await ApiService.getSubscriptionBalance();
                const balanceHours = balanceResponse.success ? balanceResponse.data.total_hours_remaining : 0;
                
                // Check for penalty information from booking details
                const penaltyInfo = details.penaltyInfo || null;
                const hasPenalty = penaltyInfo?.hasPenalty || false;
                const penaltyHours = penaltyInfo?.penaltyHours || 0;

                setParkingEndDetails({
                  durationMinutes,
                  durationHours,
                  chargeHours: durationHours, // Use decimal hours to match backend deduction
                  balanceHours: balanceHours, // This is the balance AFTER deduction from backend
                  startTime: details.timestamps.startTime,
                  endTime: endTime.toISOString(),
                  areaName: details.parkingArea?.name || 'Unknown',
                  spotNumber: details.parkingSlot?.spotNumber || 'Unknown',
                  hasPenalty: hasPenalty,
                  penaltyHours: penaltyHours
                });
                setShowParkingEndModal(true);

                // Show alert if there's a penalty
                if (hasPenalty && penaltyHours > 0) {
                  const penaltyHoursFormatted = Math.floor(penaltyHours);
                  const penaltyMinutesFormatted = Math.round((penaltyHours - penaltyHoursFormatted) * 60);
                  Alert.alert(
                    'Penalty Notice',
                    `You exceeded your remaining balance by ${penaltyHoursFormatted} hour${penaltyHoursFormatted !== 1 ? 's' : ''} ${penaltyMinutesFormatted} minute${penaltyMinutesFormatted !== 1 ? 's' : ''}. This penalty will be deducted from your next subscription plan.`,
                    [{ text: 'OK', style: 'default' }]
                  );
                }
              }
            } catch (error) {
              console.error('Error fetching parking end details:', error);
              // Still show modal with basic info
              const startTime = bookingData.timestamps?.startTime ? new Date(bookingData.timestamps.startTime) : new Date();
              const endTime = new Date();
              const durationMinutes = Math.ceil((endTime.getTime() - startTime.getTime()) / (1000 * 60));
              // Convert to decimal hours (e.g., 30 minutes = 0.50 hours, 90 minutes = 1.50 hours)
              const durationHours = durationMinutes / 60;
              
              setParkingEndDetails({
                durationMinutes,
                durationHours,
                chargeHours: durationHours, // Use decimal hours to match backend deduction
                balanceHours: 0,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                areaName: bookingData.parkingArea?.name || 'Unknown',
                spotNumber: bookingData.parkingSlot?.spotNumber || 'Unknown'
              });
              setShowParkingEndModal(true);
            }
          }
        }
      } catch (error) {
        // Handle authentication errors gracefully - user logged out
        if (error instanceof Error && (
          error.message.includes('Authentication error') ||
          error.message.includes('Please login again') ||
          error.message.includes('Access token required') ||
          error.message.includes('401')
        )) {
          console.log('🔐 User logged out - stopping reservation polling');
          // Clear booking data and stop polling when user is logged out
          setBookingData(null);
          setElapsedTime(0);
          setParkingEndTime(null);
          setQrScanned(false);
          parkingStartTime.current = null;
          if (pollingInterval) {
            clearInterval(pollingInterval);
            pollingInterval = null;
          }
          // Navigate back to home/login screen
          router.replace('/screens/HomeScreen');
        } else {
          console.error('❌ Error polling reservation status:', error);
        }
      }
    };

    // Poll immediately, then start polling every 1 second for real-time updates
    pollReservationStatus();
    pollingInterval = setInterval(pollReservationStatus, 1000);

    // Cleanup
    return () => {
      if (pollingInterval) {
        clearInterval(pollingInterval);
      }
    };
  }, [bookingData?.reservationId, isTimerRunning, isAuthenticated]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };




  const handleAddToFavorites = async () => {
    if (bookingData) {
      try {
        console.log('Booking data:', JSON.stringify(bookingData, null, 2));
        console.log('Parking slot data:', bookingData.parkingSlot);
        console.log('Parking spot ID:', bookingData.parkingSlot?.parkingSpotId);
        
        let parkingSpotId = bookingData.parkingSlot?.parkingSpotId;
        
        // Fallback: If parkingSpotId is not available, get it from reservation
        if (!parkingSpotId) {
          console.log('Parking spot ID not found in booking data, getting from reservation...');
          const spotIdResponse = await ApiService.getParkingSpotIdFromReservation(bookingData.reservationId);
          if (spotIdResponse.success) {
            parkingSpotId = spotIdResponse.data.parkingSpotId;
            console.log('Got parking spot ID from reservation:', parkingSpotId);
          } else {
            throw new Error('Failed to get parking spot ID from reservation');
          }
        }
        
        const response = await ApiService.addFavorite(parkingSpotId);
        
        if (response.success) {
          // Check if it's already in favorites
          if (response.message && response.message.includes('already in favorites')) {
            Alert.alert(
              'Already in Favorites!',
              `Parking spot ${bookingData.parkingSlot.spotNumber} at ${bookingData.parkingArea.name} is already in your favorites.`,
              [{ text: 'OK' }]
            );
          } else {
            Alert.alert(
              'Added to Favorites!',
              `Parking spot ${bookingData.parkingSlot.spotNumber} at ${bookingData.parkingArea.name} has been added to your favorites.`,
              [{ text: 'OK' }]
            );
          }
        } else {
          Alert.alert(
            'Error',
            response.message || 'Failed to add to favorites',
            [{ text: 'OK' }]
          );
        }
      } catch (error) {
        console.error('Error adding to favorites:', error);
        
        // Check if the error message indicates it's already in favorites
        if (error instanceof Error && error.message && error.message.includes('already in favorites')) {
          Alert.alert(
            'Already in Favorites!',
            `Parking spot ${bookingData.parkingSlot.spotNumber} at ${bookingData.parkingArea.name} is already in your favorites.`,
            [{ text: 'OK' }]
          );
        } else {
          Alert.alert(
            'Error',
            'Failed to add to favorites. Please try again.',
            [{ text: 'OK' }]
          );
        }
      }
    }
  };


  const deductParkingTimeFromPlan = async (parkingDurationSeconds: number) => {
    try {
      // Calculate hours, minutes, seconds
      const hours = Math.floor(parkingDurationSeconds / 3600);
      const minutes = Math.floor((parkingDurationSeconds % 3600) / 60);
      const seconds = parkingDurationSeconds % 60;
      
      // Here you would typically call an API to deduct time from user's plan
      // For now, we'll just show the calculation
      console.log(`Deducting ${hours}h ${minutes}m ${seconds}s from user's plan`);
      
      // TODO: Implement API call to deduct time from user's subscribed plan
      // await ApiService.deductParkingTime({
      //   userId: bookingData.userId,
      //   duration: parkingDurationSeconds,
      //   reservationId: bookingData.reservationId
      // });
      
    } catch (error) {
      console.error('Error deducting parking time from plan:', error);
    }
  };

  const endParkingSession = async (reservationId: number) => {
    try {
      const response = await ApiService.endParkingSession(reservationId);
      
      if (response.success) {
        console.log('✅ Parking session ended successfully');
        console.log('✅ Booking status set to completed');
        console.log('✅ Parking spot freed');
      } else {
        console.error('❌ Failed to end parking session:', response.message);
      }
    } catch (error) {
      console.error('❌ Error ending parking session:', error);
    }
  };

  if (isLoading) {
    return (
      <View style={activeParkingScreenStyles.container}>
        <SharedHeader 
          title="Active Parking"
        />
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, fontSize: 16, color: '#666' }}>
            Loading booking details...
          </Text>
        </View>
      </View>
    );
  }

  // Show error state if no booking data
  if (!bookingData) {
    return (
      <View style={activeParkingScreenStyles.container}>
        <SharedHeader 
          title="Active Parking"
        />
        <View style={activeParkingScreenStyles.emptyStateContainer}>
          <Text style={activeParkingScreenStyles.emptyStateTitle}>No Active Parking Session</Text>
          <Text style={activeParkingScreenStyles.emptyStateMessage}>
            You don't have any active parking reservations at the moment.
          </Text>
          <Text style={activeParkingScreenStyles.emptyStateSubMessage}>
            Please log in and book a parking spot from the Home screen to start a new session.
          </Text>
          <TouchableOpacity
            style={activeParkingScreenStyles.goBackButton}
            onPress={() => router.back()}
          >
            <Text style={activeParkingScreenStyles.goBackButtonText}>Go Back to Home</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={activeParkingScreenStyles.container}>
      <SharedHeader 
        title="Active Parking"
      />

      <View style={activeParkingScreenStyles.content}>
        {/* Section Title */}
        <Text style={activeParkingScreenStyles.sectionTitle}>
          {activeTab === 'ticket' ? 'Parking Ticket' : 
           activeTab === 'layout' ? 'Parking Layout' : 
           'Parking Time'}
        </Text>

        {/* Navigation Tabs */}
        <View style={activeParkingScreenStyles.tabsContainer}>
          <TouchableOpacity
            style={[
              activeParkingScreenStyles.tab,
              activeTab === 'ticket' && activeParkingScreenStyles.activeTab
            ]}
            onPress={() => setActiveTab('ticket')}
          >
            <Text 
              style={[
                activeParkingScreenStyles.tabText,
                activeTab === 'ticket' && activeParkingScreenStyles.activeTabText
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              Parking Ticket
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              activeParkingScreenStyles.tab,
              activeTab === 'layout' && activeParkingScreenStyles.activeTab
            ]}
            onPress={() => setActiveTab('layout')}
          >
            <Text 
              style={[
                activeParkingScreenStyles.tabText,
                activeTab === 'layout' && activeParkingScreenStyles.activeTabText
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              Parking Layout
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              activeParkingScreenStyles.tab,
              activeTab === 'time' && activeParkingScreenStyles.activeTab
            ]}
            onPress={() => setActiveTab('time')}
          >
            <Text 
              style={[
                activeParkingScreenStyles.tabText,
                activeTab === 'time' && activeParkingScreenStyles.activeTabText
              ]}
              numberOfLines={1}
              adjustsFontSizeToFit={true}
              minimumFontScale={0.8}
            >
              Parking Time
            </Text>
          </TouchableOpacity>
        </View>


        {/* Tab Content */}
        {activeTab === 'ticket' && (
          <View style={activeParkingScreenStyles.ticketContainer}>
            {/* QR Code Section - Real QR Code Display */}
            <View style={activeParkingScreenStyles.qrSection}>
              <View style={activeParkingScreenStyles.qrContainer}>
                {bookingData ? (
                  <View>
                    <QRCode
                      value={JSON.stringify({
                        reservationId: bookingData.reservationId,
                        displayName: bookingData.displayName,
                        vehiclePlate: bookingData.vehicleDetails.plateNumber,
                        parkingArea: bookingData.parkingArea.name,
                        parkingSpot: bookingData.parkingSlot.spotNumber,
                        timestamp: bookingData.timestamps.startTime
                      })}
                      size={(() => {
                        // Responsive QR code size based on screen width
                        if (isSmallScreen) return Math.min(screenWidth * 0.55, 180); // Small screens
                        if (isMediumScreen) return Math.min(screenWidth * 0.6, 200); // Medium screens
                        if (isLargeScreen) return Math.min(screenWidth * 0.55, 240); // Large phones
                        if (isTablet) return Math.min(screenWidth * 0.35, 300); // Tablets
                        return Math.min(screenWidth * 0.3, 320); // Large tablets
                      })()}
                      color="black"
                      backgroundColor="white"
                      logoSize={(() => {
                        // Responsive logo size
                        if (isSmallScreen) return 20;
                        if (isMediumScreen) return 24;
                        if (isLargeScreen) return 28;
                        if (isTablet) return 35;
                        return 40;
                      })()}
                      logoMargin={2}
                      logoBorderRadius={15}
                      quietZone={isSmallScreen ? 8 : 10}
                    />
                  </View>
                ) : (
                <View style={activeParkingScreenStyles.qrPlaceholder}>
                  <Text style={activeParkingScreenStyles.qrPlaceholderEmoji}>📱</Text>
                  <Text style={activeParkingScreenStyles.qrPlaceholderText}>QR Code</Text>
                    <Text style={activeParkingScreenStyles.qrPlaceholderSubtext}>
                      {bookingData ? 'No QR Code Data' : 'Loading...'}
                    </Text>
                </View>
                )}
              </View>
              <Text 
                style={activeParkingScreenStyles.qrInstruction}
                numberOfLines={2}
                adjustsFontSizeToFit={true}
                minimumFontScale={0.8}
              >
                {!isTimerRunning ? 'Waiting for attendant to start parking session...' : 
                 'Parking session is active. Attendant will end the session.'}
              </Text>
            </View>

            {/* Dashed Separator */}
            <View style={activeParkingScreenStyles.separator} />

            {/* Parking Details */}
            <View style={activeParkingScreenStyles.detailsContainer}>
              <View style={activeParkingScreenStyles.detailsColumn}>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Display Name</Text>
                  <Text 
                    style={activeParkingScreenStyles.detailValue}
                    numberOfLines={2}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.85}
                  >
                    {bookingData.displayName}
                  </Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Parking Area</Text>
                  <Text 
                    style={activeParkingScreenStyles.detailValue}
                    numberOfLines={2}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.85}
                  >
                    {bookingData.parkingArea.name}
                  </Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Date</Text>
                  <Text 
                    style={activeParkingScreenStyles.detailValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.85}
                  >
                    {new Date(bookingData.timestamps.bookingTime).toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
              
              <View style={activeParkingScreenStyles.detailsColumn}>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Vehicle Detail</Text>
                  <Text 
                    style={activeParkingScreenStyles.detailValue}
                    numberOfLines={2}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.85}
                  >
                    {bookingData.vehicleDetails.brand} - {bookingData.vehicleDetails.vehicleType}
                  </Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Parking Slot</Text>
                  <Text 
                    style={activeParkingScreenStyles.detailValue}
                    numberOfLines={2}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.85}
                  >
                    {bookingData.parkingSlot.spotNumber} ({bookingData.parkingSlot.spotType})
                  </Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Plate Number</Text>
                  <Text 
                    style={activeParkingScreenStyles.detailValue}
                    numberOfLines={1}
                    adjustsFontSizeToFit={true}
                    minimumFontScale={0.85}
                  >
                    {bookingData.vehicleDetails.plateNumber}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {activeTab === 'layout' && (
          <View style={activeParkingScreenStyles.layoutContainer}>
            {isLoadingSvg ? (
              <View style={activeParkingScreenStyles.emptyStateContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
                <Text style={activeParkingScreenStyles.emptyStateMessage}>
                  Loading parking layout...
                </Text>
              </View>
            ) : svgContent ? (
              <View style={activeParkingScreenStyles.svgContainer}>
                <View style={activeParkingScreenStyles.layoutHeader}>
                  <Text style={activeParkingScreenStyles.layoutTitle}>
                    {bookingData?.parkingArea?.name || 'Parking Area'} Layout
                  </Text>
                  <TouchableOpacity
                    style={activeParkingScreenStyles.refreshButton}
                    onPress={() => {
                      loadSvgContent(true);
                      if (bookingData?.parkingArea?.id) {
                        loadSpotStatuses(bookingData.parkingArea.id, true); // Force refresh on manual refresh
                      }
                    }}
                  >
                    <Ionicons name="refresh" size={16} color="#FFFFFF" />
                    <Text style={activeParkingScreenStyles.refreshButtonText}> Refresh</Text>
                  </TouchableOpacity>
                </View>
                <View style={{ 
                  width: '100%',
                  flex: 1,
                  minHeight: 350,
                  maxHeight: screenHeight * 0.65,
                  overflow: 'hidden',
                }}>
                  <PinchGestureHandler
                    onGestureEvent={(event) => {
                      const newScale = savedScaleRef.current * event.nativeEvent.scale;
                      // Limit zoom between 0.5x and 5x
                      const clampedScale = Math.max(0.5, Math.min(5, newScale));
                      setScale(clampedScale);
                    }}
                    onHandlerStateChange={(event) => {
                      if (event.nativeEvent.oldState === State.ACTIVE) {
                        savedScaleRef.current = scale;
                      }
                    }}
                  >
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={true}
                      style={{ 
                        width: '100%',
                        height: '100%',
                      }}
                      contentContainerStyle={{ 
                        minWidth: (screenWidth - 80) * scale,
                      }}
                      scrollEnabled={true}
                      bounces={false}
                    >
                      <ScrollView
                        showsVerticalScrollIndicator={true}
                        contentContainerStyle={{
                          minHeight: ((screenWidth - 80) * (322 / 276)) * scale,
                        }}
                        scrollEnabled={true}
                        bounces={false}
                      >
                        <View style={{
                          transform: [{ scale }],
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: screenWidth - 80,
                          height: (screenWidth - 80) * (322 / 276),
                          position: 'relative',
                        }}
                        pointerEvents="box-none"
                        >
                          <SvgXml
                            xml={svgContent}
                            width={screenWidth - 80}
                            height={(screenWidth - 80) * (322 / 276)}
                            preserveAspectRatio="xMidYMid meet"
                            pointerEvents="none"
                          />
                          {/* Clickable overlay container for spots */}
                          <View 
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              pointerEvents: 'box-none',
                            }}
                          >
                            {clickableSpots.map((spot) => {
                            // Get the actual SVG dimensions from the SVG content
                            const svgWidthMatch = svgContent.match(/<svg[^>]*width=["']([^"']+)["']/);
                            const svgHeightMatch = svgContent.match(/<svg[^>]*height=["']([^"']+)["']/);
                            
                            // Container dimensions (what we pass to SvgXml)
                            const containerWidth = screenWidth - 80;
                            const containerHeight = (screenWidth - 80) * (322 / 276);
                            
                            // Extract viewBox from SVG - this is the coordinate system
                            const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
                            let viewBoxX = 0;
                            let viewBoxY = 0;
                            let viewBoxWidth = 276;
                            let viewBoxHeight = 322;
                            if (viewBoxMatch) {
                              const parts = viewBoxMatch[1].trim().split(/[\s,]+/).filter(p => p).map(Number);
                              if (parts.length >= 4) {
                                viewBoxX = parts[0];
                                viewBoxY = parts[1];
                                viewBoxWidth = parts[2];
                                viewBoxHeight = parts[3];
                              }
                            }
                            
                            // Get actual SVG width/height if specified (for aspect ratio)
                            let svgIntrinsicWidth = viewBoxWidth;
                            let svgIntrinsicHeight = viewBoxHeight;
                            if (svgWidthMatch && svgHeightMatch) {
                              const w = parseFloat(svgWidthMatch[1]);
                              const h = parseFloat(svgHeightMatch[1]);
                              if (!isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
                                svgIntrinsicWidth = w;
                                svgIntrinsicHeight = h;
                              }
                            }
                            
                            // Calculate aspect ratios
                            const viewBoxAspectRatio = viewBoxWidth / viewBoxHeight;
                            const containerAspectRatio = containerWidth / containerHeight;
                            
                            // With preserveAspectRatio="xMidYMid meet", calculate actual rendered size
                            let renderedWidth = containerWidth;
                            let renderedHeight = containerHeight;
                            
                            if (viewBoxAspectRatio > containerAspectRatio) {
                              // ViewBox is wider - fit to width
                              renderedWidth = containerWidth;
                              renderedHeight = containerWidth / viewBoxAspectRatio;
                            } else {
                              // ViewBox is taller - fit to height
                              renderedWidth = containerHeight * viewBoxAspectRatio;
                              renderedHeight = containerHeight;
                            }
                            
                            // Calculate centering offset (xMidYMid centers the content)
                            const offsetX = (containerWidth - renderedWidth) / 2;
                            const offsetY = (containerHeight - renderedHeight) / 2;
                            
                            // Calculate scale factors (viewBox units to rendered pixels)
                            const scaleX = renderedWidth / viewBoxWidth;
                            const scaleY = renderedHeight / viewBoxHeight;
                            
                            // Convert spot coordinates from viewBox space to rendered pixel space
                            // Adjust for viewBox origin
                            const spotXInViewBox = spot.x - viewBoxX;
                            const spotYInViewBox = spot.y - viewBoxY;
                            
                            // Scale to rendered pixels
                            const pixelX = spotXInViewBox * scaleX;
                            const pixelY = spotYInViewBox * scaleY;
                            
                            // Add centering offset
                            const finalX = offsetX + pixelX;
                            const finalY = offsetY + pixelY;
                            
                            // Scale dimensions to rendered pixels
                            const pixelWidth = spot.width * scaleX;
                            const pixelHeight = spot.height * scaleY;
                            
                            // Final coordinates - exact match to spot size (no padding)
                            const left = finalX;
                            const top = finalY;
                            const width = pixelWidth;
                            const height = pixelHeight;
                            
                            // Verify dimensions are valid
                            if (width <= 0 || height <= 0 || isNaN(width) || isNaN(height) || isNaN(left) || isNaN(top)) {
                              if (__DEV__) {
                                console.warn('⚠️ Invalid spot dimensions:', { spot: spot.id, left, top, width, height });
                              }
                              return null;
                            }
                            
                            // Debug logging for first spot and current spot
                            if (__DEV__ && (clickableSpots.indexOf(spot) === 0 || spot.spotNumber === bookingData?.parkingSlot?.spotNumber)) {
                              console.log('🎯 Spot positioning:', {
                                spotId: spot.id,
                                spotNumber: spot.spotNumber,
                                isFirst: clickableSpots.indexOf(spot) === 0,
                                isCurrent: spot.spotNumber === bookingData?.parkingSlot?.spotNumber,
                                viewBoxCoords: { x: spot.x, y: spot.y, width: spot.width, height: spot.height },
                                viewBox: { x: viewBoxX, y: viewBoxY, width: viewBoxWidth, height: viewBoxHeight },
                                svgIntrinsic: { width: svgIntrinsicWidth, height: svgIntrinsicHeight },
                                container: { width: containerWidth, height: containerHeight },
                                rendered: { width: renderedWidth, height: renderedHeight },
                                offset: { x: offsetX, y: offsetY },
                                scale: { x: scaleX, y: scaleY },
                                finalCoords: { left, top, width, height },
                                parentScale: scale,
                              });
                            }
                            
                            // Get spot status from backend (match by spot ID first, then spot_number)
                            // Try multiple matching strategies for flexibility
                            let spotStatus = spotStatuses.get(spot.id || '') || spotStatuses.get(spot.spotNumber || '');
                            
                            // If still not found, try matching without floor prefix
                            if (!spotStatus && spot.id) {
                              const idWithoutFloor = spot.id.replace(/^F\d+-/i, ''); // Remove "F2-" prefix
                              spotStatus = spotStatuses.get(idWithoutFloor);
                            }
                            
                            const spotStatusValue = spotStatus?.status || 'unknown';
                            const isUserBooked = spotStatus?.is_user_booked === true || (typeof spotStatus?.is_user_booked === 'number' && spotStatus.is_user_booked === 1);
                            
                            // Determine color based on status
                            // Blue = Current user's booked spot (highest priority)
                            // Otherwise, use status-based colors (yellow for reserved, red for occupied, green for available)
                            let backgroundColor = 'rgba(200, 200, 200, 0.1)'; // Gray for unknown
                            let borderColor = 'rgba(200, 200, 200, 0.4)';
                            
                            // If current user has booked this spot, show it in blue (regardless of status)
                            if (isUserBooked) {
                              backgroundColor = 'rgba(0, 122, 255, 0.3)'; // Blue with transparency
                              borderColor = 'rgba(0, 122, 255, 0.8)'; // Blue border
                            } else {
                              // Otherwise, use status-based colors for spots booked by others or available spots
                              switch (spotStatusValue) {
                                case 'available':
                                  backgroundColor = 'rgba(52, 199, 89, 0.2)'; // Green
                                  borderColor = 'rgba(52, 199, 89, 0.6)';
                                  break;
                                case 'occupied':
                                  backgroundColor = 'rgba(255, 59, 48, 0.2)'; // Red
                                  borderColor = 'rgba(255, 59, 48, 0.6)';
                                  break;
                                case 'reserved':
                                  backgroundColor = 'rgba(255, 204, 0, 0.3)'; // Yellow for reserved by others
                                  borderColor = 'rgba(255, 204, 0, 0.8)';
                                  break;
                                default:
                                  backgroundColor = 'rgba(200, 200, 200, 0.1)'; // Gray
                                  borderColor = 'rgba(200, 200, 200, 0.4)';
                              }
                            }
                            
                            return (
                              <TouchableOpacity
                                key={spot.id}
                                style={{
                                  position: 'absolute',
                                  left,
                                  top,
                                  width,
                                  height,
                                  backgroundColor,
                                  borderWidth: isUserBooked ? 2 : 1,
                                  borderColor,
                                  borderRadius: 2,
                                  zIndex: 10,
                                }}
                                onPress={() => {
                                  console.log('📍 Spot tapped:', spot.spotNumber || spot.id, 'Status:', spotStatusValue);
                                  setSelectedSpot({
                                    ...spot,
                                    isCurrentSpot: isUserBooked,
                                    status: spotStatusValue,
                                    spotData: spotStatus,
                                  });
                                  setShowSpotModal(true);
                                }}
                                activeOpacity={0.6}
                                // No hitSlop to ensure exact fit
                                delayPressIn={0}
                                delayPressOut={0}
                              />
                            );
                            })}
                          </View>
                        </View>
                      </ScrollView>
                    </ScrollView>
                  </PinchGestureHandler>
                </View>
              </View>
            ) : (
              <View style={activeParkingScreenStyles.emptyStateContainer}>
                <Text style={activeParkingScreenStyles.emptyStateTitle}>🚧 No Layout Available</Text>
                <Text style={activeParkingScreenStyles.emptyStateMessage}>
                  No parking layout is available for this area yet.
                </Text>
                <Text style={activeParkingScreenStyles.emptyStateSubMessage}>
                  The layout will be displayed here once it's configured for this parking area.
                </Text>
                <TouchableOpacity
                  style={activeParkingScreenStyles.refreshButton}
                  onPress={() => loadSvgContent(true)}
                >
                  <Ionicons name="refresh" size={16} color="#FFFFFF" />
                  <Text style={activeParkingScreenStyles.refreshButtonText}> Try Again</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Legend */}
            {svgContent && (
              <View style={{
                marginTop: getResponsiveMargin(16),
                marginBottom: getResponsiveMargin(8),
                padding: getResponsivePadding(12),
                backgroundColor: colors.card || '#FFFFFF',
                borderRadius: getResponsiveSize(8),
                borderWidth: 1,
                borderColor: colors.border || '#E5E7EB',
              }}>
                <Text style={{
                  fontSize: getResponsiveFontSize(14),
                  fontWeight: 'bold',
                  color: colors.text || '#000000',
                  marginBottom: getResponsiveMargin(8),
                  textAlign: 'center',
                }}>
                  Legend
                </Text>
                <View style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: getResponsiveSize(12),
                }}>
                  {/* Road */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      width: getResponsiveSize(24),
                      height: getResponsiveSize(12),
                      backgroundColor: '#808080',
                      borderRadius: 2,
                    }} />
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Road</Text>
                  </View>

                  {/* Parking Spot */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      width: getResponsiveSize(24),
                      height: getResponsiveSize(16),
                      borderWidth: 1.5,
                      borderColor: '#333333',
                      borderRadius: 2,
                      backgroundColor: 'transparent',
                    }} />
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Parking Spot</Text>
                  </View>

                  {/* Available (Green) */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      width: getResponsiveSize(20),
                      height: getResponsiveSize(20),
                      backgroundColor: 'rgba(52, 199, 89, 0.2)',
                      borderWidth: 1,
                      borderColor: 'rgba(52, 199, 89, 0.6)',
                      borderRadius: 2,
                    }} />
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Available</Text>
                  </View>

                  {/* Occupied (Red) */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      width: getResponsiveSize(20),
                      height: getResponsiveSize(20),
                      backgroundColor: 'rgba(255, 59, 48, 0.2)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 59, 48, 0.6)',
                      borderRadius: 2,
                    }} />
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Occupied</Text>
                  </View>

                  {/* Reserved (Yellow) */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      width: getResponsiveSize(20),
                      height: getResponsiveSize(20),
                      backgroundColor: 'rgba(255, 204, 0, 0.3)',
                      borderWidth: 1,
                      borderColor: 'rgba(255, 204, 0, 0.8)',
                      borderRadius: 2,
                    }} />
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Reserved</Text>
                  </View>

                  {/* Your Booked Spot (Blue) */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      width: getResponsiveSize(20),
                      height: getResponsiveSize(20),
                      backgroundColor: 'rgba(0, 122, 255, 0.3)',
                      borderWidth: 1,
                      borderColor: 'rgba(0, 122, 255, 0.8)',
                      borderRadius: 2,
                    }} />
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Your Spot</Text>
                  </View>

                  {/* Entry Road (Green Arrow) */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <View style={{
                        width: getResponsiveSize(24),
                        height: getResponsiveSize(12),
                        backgroundColor: '#808080',
                        borderRadius: 2,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Ionicons name="arrow-forward" size={getResponsiveSize(10)} color="#34C759" />
                      </View>
                    </View>
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Entry</Text>
                  </View>

                  {/* Exit Road (Red Arrow) */}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    marginRight: getResponsiveMargin(8),
                    marginBottom: getResponsiveMargin(4),
                  }}>
                    <View style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                    }}>
                      <View style={{
                        width: getResponsiveSize(24),
                        height: getResponsiveSize(12),
                        backgroundColor: '#808080',
                        borderRadius: 2,
                        justifyContent: 'center',
                        alignItems: 'center',
                      }}>
                        <Ionicons name="arrow-forward" size={getResponsiveSize(10)} color="#FF3B30" />
                      </View>
                    </View>
                    <Text style={{
                      fontSize: getResponsiveFontSize(11),
                      color: colors.textSecondary || '#666666',
                      marginLeft: getResponsiveMargin(6),
                    }}>Exit</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {activeTab === 'time' && (
          <View style={activeParkingScreenStyles.timeContainer}>
            {/* Circular Timer */}
            <View style={activeParkingScreenStyles.timerSection}>
              <View style={activeParkingScreenStyles.timerContainer}>
                <View style={activeParkingScreenStyles.timerCircle}>
                  <Animated.View 
                    style={[
                      activeParkingScreenStyles.timerProgress,
                      {
                        transform: [{
                          rotate: progressAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: ['-90deg', '270deg'], // Start from top, go clockwise
                          })
                        }]
                      }
                    ]} 
                  />
                  <View style={activeParkingScreenStyles.timerContent}>
                    <Text style={activeParkingScreenStyles.timerText}>
                      {parkingEndTime ? 
                        formatTime(Math.floor((parkingEndTime - (parkingStartTime.current || 0)) / 1000)) : 
                        formatTime(elapsedTime)
                      }
                    </Text>
                    <View style={activeParkingScreenStyles.timerLabels}>
                      <Text style={activeParkingScreenStyles.timerLabel}>hour</Text>
                      <Text style={activeParkingScreenStyles.timerLabel}>min</Text>
                      <Text style={activeParkingScreenStyles.timerLabel}>sec</Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* Parking Details Card */}
            <View style={activeParkingScreenStyles.parkingDetailsCard}>
              <View style={activeParkingScreenStyles.detailsColumn}>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Vehicle</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>
                    {bookingData.vehicleDetails.brand} - {bookingData.vehicleDetails.vehicleType}
                  </Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Parking Area</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>{bookingData.parkingArea.name}</Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Date</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>
                    {new Date(bookingData.timestamps.bookingTime).toLocaleDateString('en-US', {
                      month: '2-digit',
                      day: '2-digit',
                      year: '2-digit'
                    })}
                  </Text>
                </View>
              </View>
              
              <View style={activeParkingScreenStyles.detailsColumn}>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Plate Number</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>{bookingData.vehicleDetails.plateNumber}</Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Parking Spot</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>
                    {bookingData.parkingSlot.spotNumber} ({bookingData.parkingSlot.spotType})
                  </Text>
                </View>
                <View style={activeParkingScreenStyles.detailRow}>
                  <Text style={activeParkingScreenStyles.detailLabel}>Partial Amount</Text>
                  <Text style={activeParkingScreenStyles.detailValue}>--</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Add to Favorites Button */}
        {activeTab === 'ticket' && (
          <TouchableOpacity style={activeParkingScreenStyles.favoritesButton} onPress={handleAddToFavorites}>
            <SvgXml 
              xml={`<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 18.35L8.55 17.03C3.4 12.36 0 9.28 0 5.5C0 2.42 2.42 0 5.5 0C7.24 0 8.91 0.81 10 2.09C11.09 0.81 12.76 0 14.5 0C17.58 0 20 2.42 20 5.5C20 9.28 16.6 12.36 11.45 17.04L10 18.35Z" fill="white"/>
<path d="M6 8L8 10L14 4" stroke="#8A0000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`}
              width={20}
              height={20}
            />
            <Text style={activeParkingScreenStyles.favoritesText}>Add to Favorites</Text>
          </TouchableOpacity>
        )}



        {/* Test Modal */}
        <Modal
          visible={showTestModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowTestModal(false)}
        >
          <View style={activeParkingScreenStyles.spotOverlay}>
            <View style={activeParkingScreenStyles.spotModalContent}>
              <Text style={activeParkingScreenStyles.spotModalTitle}>🧪 Test Options</Text>
              <Text style={activeParkingScreenStyles.spotModalTitle}>
                This screen displays parking session status. The attendant will scan your QR code to start and end the session.
              </Text>
              
              <TouchableOpacity 
                style={activeParkingScreenStyles.spotModalCloseButton}
                onPress={() => setShowTestModal(false)}
              >
                <Text style={activeParkingScreenStyles.spotModalCloseText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Spot Details Modal */}
        <Modal
          visible={showSpotModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowSpotModal(false)}
        >
          <View style={activeParkingScreenStyles.modalOverlay}>
            <View style={activeParkingScreenStyles.spotModalContent}>
              {selectedSpot && (
                <>
                  <Text style={activeParkingScreenStyles.spotModalTitle}>
                    {selectedSpot.spotNumber ? `Spot ${selectedSpot.spotNumber}` : 'Parking Spot'}
                    {selectedSpot.isCurrentSpot && ' (Your Spot)'}
                  </Text>
                  
                  <View style={activeParkingScreenStyles.spotModalInfo}>
                    {selectedSpot.spotNumber && (
                      <View style={activeParkingScreenStyles.spotModalRow}>
                        <Text style={activeParkingScreenStyles.spotModalLabel}>Spot Number:</Text>
                        <Text style={activeParkingScreenStyles.spotModalValue}>
                          {selectedSpot.spotNumber}
                        </Text>
                      </View>
                    )}
                    
                    {selectedSpot.spotId && (
                      <View style={activeParkingScreenStyles.spotModalRow}>
                        <Text style={activeParkingScreenStyles.spotModalLabel}>Spot ID:</Text>
                        <Text style={activeParkingScreenStyles.spotModalValue}>
                          {selectedSpot.spotId}
                        </Text>
                      </View>
                    )}
                    
                    {bookingData?.parkingArea?.name && (
                      <View style={activeParkingScreenStyles.spotModalRow}>
                        <Text style={activeParkingScreenStyles.spotModalLabel}>Parking Area:</Text>
                        <Text style={activeParkingScreenStyles.spotModalValue}>
                          {bookingData.parkingArea.name}
                        </Text>
                      </View>
                    )}
                    
                    {layoutId && (
                      <View style={activeParkingScreenStyles.spotModalRow}>
                        <Text style={activeParkingScreenStyles.spotModalLabel}>Layout ID:</Text>
                        <Text style={activeParkingScreenStyles.spotModalValue}>
                          {layoutId}
                        </Text>
                      </View>
                    )}
                    
                    {selectedSpot.status && (
                      <View style={activeParkingScreenStyles.spotModalRow}>
                        <Text style={activeParkingScreenStyles.spotModalLabel}>Status:</Text>
                        <Text style={[
                          activeParkingScreenStyles.spotModalValue,
                          {
                            color: selectedSpot.status === 'available' ? '#34C759' :
                                   selectedSpot.status === 'occupied' ? '#FF3B30' :
                                   selectedSpot.status === 'reserved' ? '#FF9500' : '#8E8E93',
                            fontWeight: 'bold'
                          }
                        ]}>
                          {selectedSpot.status.charAt(0).toUpperCase() + selectedSpot.status.slice(1)}
                        </Text>
                      </View>
                    )}
                    
                    {selectedSpot.isCurrentSpot && (
                      <View style={activeParkingScreenStyles.spotModalRow}>
                        <Text style={[activeParkingScreenStyles.spotModalValue, { color: '#8A0000', fontWeight: 'bold' }]}>
                          ✓ This is your reserved parking spot
                        </Text>
                      </View>
                    )}
                  </View>

                  <TouchableOpacity
                    style={activeParkingScreenStyles.spotModalCloseButton}
                    onPress={() => setShowSpotModal(false)}
                  >
                    <Text style={activeParkingScreenStyles.spotModalCloseText}>Close</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </Modal>

        {/* Parking End Details Modal */}
        <Modal
          visible={showParkingEndModal}
          transparent={true}
          animationType="fade"
          onRequestClose={handleParkingEndModalClose}
        >
          <View style={activeParkingScreenStyles.modalOverlay}>
            <View style={activeParkingScreenStyles.parkingEndModalContainer}>
              <Text style={activeParkingScreenStyles.parkingEndModalTitle}>Parking Session Ended</Text>
              
              {parkingEndDetails && (
                <View style={activeParkingScreenStyles.parkingEndDetailsContainer}>
                  <View style={activeParkingScreenStyles.parkingEndDetailRow}>
                    <Text style={activeParkingScreenStyles.parkingEndDetailLabel}>Duration:</Text>
                    <Text style={activeParkingScreenStyles.parkingEndDetailValue}>
                      {formatDuration(parkingEndDetails.durationMinutes)}
                    </Text>
                  </View>
                  
                  <View style={activeParkingScreenStyles.parkingEndDetailRow}>
                    <Text style={activeParkingScreenStyles.parkingEndDetailLabel}>Hours Deducted:</Text>
                    <Text style={activeParkingScreenStyles.parkingEndDetailValue}>
                      {formatHoursToHHMM(parkingEndDetails.chargeHours)} hr{parkingEndDetails.chargeHours >= 1 ? 's' : ''}
                    </Text>
                  </View>
                  
                  <View style={activeParkingScreenStyles.parkingEndDetailRow}>
                    <Text style={activeParkingScreenStyles.parkingEndDetailLabel}>Remaining Balance:</Text>
                    <Text style={activeParkingScreenStyles.parkingEndDetailValue}>
                      {formatHoursToHHMM(parkingEndDetails.balanceHours)} hr{parkingEndDetails.balanceHours >= 1 ? 's' : ''}
                    </Text>
                  </View>
                  
                  {parkingEndDetails.hasPenalty && parkingEndDetails.penaltyHours > 0 && (
                    <View style={[activeParkingScreenStyles.parkingEndDetailRow, { 
                      backgroundColor: 'rgba(255, 193, 7, 0.1)', 
                      padding: 12, 
                      borderRadius: 8, 
                      marginTop: 8,
                      borderLeftWidth: 4,
                      borderLeftColor: '#FFC107'
                    }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[activeParkingScreenStyles.parkingEndDetailLabel, { 
                          color: '#FF9800', 
                          fontWeight: 'bold',
                          marginBottom: 4 
                        }]}>
                          ⚠️ Penalty Notice
                        </Text>
                        <Text style={[activeParkingScreenStyles.parkingEndDetailValue, { 
                          color: '#F57C00',
                          fontSize: getResponsiveFontSize(12)
                        }]}>
                          You exceeded your balance by {formatHoursToHHMM(parkingEndDetails.penaltyHours)} hr. This penalty will be deducted from your next subscription plan.
                        </Text>
                      </View>
                    </View>
                  )}
                  
                  <View style={activeParkingScreenStyles.parkingEndDetailRow}>
                    <Text style={activeParkingScreenStyles.parkingEndDetailLabel}>Parking Area:</Text>
                    <Text style={activeParkingScreenStyles.parkingEndDetailValue}>
                      {parkingEndDetails.areaName}
                    </Text>
                  </View>
                  
                  <View style={activeParkingScreenStyles.parkingEndDetailRow}>
                    <Text style={activeParkingScreenStyles.parkingEndDetailLabel}>Spot Number:</Text>
                    <Text style={activeParkingScreenStyles.parkingEndDetailValue}>
                      {parkingEndDetails.spotNumber}
                    </Text>
                  </View>
                </View>
              )}
              
              <TouchableOpacity 
                style={activeParkingScreenStyles.parkingEndModalButton} 
                onPress={handleParkingEndModalClose}
              >
                <Text style={activeParkingScreenStyles.parkingEndModalButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        </View>
    </View>
  );
};

export default ActiveParkingScreen;
