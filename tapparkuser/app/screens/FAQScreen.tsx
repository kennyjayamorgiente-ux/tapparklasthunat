import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { useRouter } from 'expo-router';
import SharedHeader from '../../components/SharedHeader';
import { SvgXml } from 'react-native-svg';
import { 
  tapParkLogoSvg,
  maroonSimpleArrowDownSvg
} from '../assets/icons/index2';

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

const FAQScreen = () => {
  const router = useRouter();
  const [expandedItems, setExpandedItems] = useState<number[]>([]);

  const faqData = [
    {
      question: "What is TapPark?",
      answer: "TapPark is a smart parking management system that helps you find, reserve, and pay for parking spots in real-time. It uses advanced technology to optimize parking availability and reduce traffic congestion."
    },
    {
      question: "How does TapPark Work?",
      answer: "TapPark uses sensors, mobile apps, and cloud technology to monitor parking spaces. Users can view available spots, make reservations, and pay through the app. The system provides real-time updates on parking availability."
    },
    {
      question: "What are the benefits of using TapPark?",
      answer: "Benefits include reduced time searching for parking, guaranteed parking spots, contactless payments, real-time availability updates, reduced traffic congestion, and better parking space utilization."
    },
    {
      question: "Can I reserve parking spot in advance?",
      answer: "Yes! TapPark allows you to reserve parking spots in advance. You can book a spot up to 24 hours ahead of time, ensuring you have a guaranteed parking space when you arrive."
    },
    {
      question: "How does TapPark help with traffic?",
      answer: "By reducing the time drivers spend searching for parking, TapPark helps decrease traffic congestion. Real-time availability information and advance reservations minimize circling and waiting, leading to smoother traffic flow."
    },
    {
      question: "What kind of technology does TapPark use?",
      answer: "TapPark uses IoT sensors, mobile applications, cloud computing, real-time data processing, GPS tracking, and secure payment systems to provide a comprehensive parking management solution."
    },
    {
      question: "How will I know if a parking spot is available?",
      answer: "The TapPark app shows real-time availability of parking spots. You'll see green indicators for available spots, red for occupied, and yellow for reserved spots. The system updates every few seconds."
    },
    {
      question: "How do I book a parking spot using TapPark?",
      answer: "Simply open the TapPark app, select your desired location, view available spots on the map, tap on an available spot, confirm your reservation, and pay through the app. You'll receive a confirmation with parking details."
    }
  ];

  const toggleExpanded = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  return (
    <View style={styles.container}>
      <SharedHeader 
        title="FAQs" 
        showBackButton={true}
        onBackPress={() => router.back()}
      />
      
      <View style={styles.scrollContainer}>
        {/* Background Section */}
        <View style={styles.backgroundSection} />
        
        {/* Profile Content Card */}
        <View style={styles.profileCard}>
          {/* Profile Picture Section */}
          <View style={styles.profilePictureSection}>
            <View style={styles.profilePictureContainer}>
              <SvgXml 
                xml={tapParkLogoSvg}
                width={getResponsiveSize(120)}
                height={getResponsiveSize(120)}
              />
            </View>
            <View style={styles.userInfoContainer}>
              <Text style={styles.userName}>FREQUENTLY ASKED</Text>
              <Text style={styles.userEmail}>QUESTIONS</Text>
            </View>
          </View>

          {/* FAQ Content */}
          <ScrollView 
            style={styles.faqScroll}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.faqContent}
          >
            {faqData.map((faq, index) => (
              <TouchableOpacity
                key={index}
                style={styles.faqItem}
                onPress={() => toggleExpanded(index)}
                activeOpacity={0.7}
              >
                <View style={styles.faqQuestionContainer}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <SvgXml 
                    xml={maroonSimpleArrowDownSvg}
                    width={getResponsiveSize(16)}
                    height={getResponsiveSize(16)}
                    style={[
                      styles.chevronIcon,
                      { transform: [{ rotate: expandedItems.includes(index) ? '180deg' : '0deg' }] }
                    ]}
                  />
                </View>
                
                {expandedItems.includes(index) && (
                  <View style={styles.faqAnswerContainer}>
                    <Text style={styles.faqAnswer}>{faq.answer}</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
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
  backgroundSection: {
    height: screenHeight * 0.3,
    position: 'relative',
  },
  profileCard: {
    backgroundColor: 'white',
    borderTopLeftRadius: getResponsiveSize(20),
    borderTopRightRadius: getResponsiveSize(20),
    marginTop: -getResponsiveSize(70),
    minHeight: screenHeight * 0.75,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: getResponsiveSize(8),
    paddingTop: getResponsivePadding(30),
    paddingHorizontal: getResponsivePadding(20),
    paddingBottom: getResponsivePadding(20),
    flex: 1,
  },
  profilePictureSection: {
    flexDirection: 'column',
    alignItems: 'center',
    marginBottom: getResponsivePadding(25),
    paddingHorizontal: getResponsivePadding(20),
  },
  profilePictureContainer: {
    position: 'relative',
    marginTop: -getResponsiveSize(70),
    alignItems: 'center',
    justifyContent: 'center',
    width: getResponsiveSize(140),
    height: getResponsiveSize(140),
    borderRadius: getResponsiveSize(70),
  },
  userInfoContainer: {
    alignItems: 'center',
    marginTop: getResponsiveSize(15),
  },
  userName: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsivePadding(5),
    textAlign: 'center',
  },
  userEmail: {
    fontSize: getResponsiveFontSize(18),
    color: '#666',
    textAlign: 'center',
  },
  faqScroll: {
    maxHeight: screenHeight * 0.5,
  },
  faqContent: {
    paddingBottom: getResponsivePadding(20),
  },
  faqTitle: {
    fontSize: getResponsiveFontSize(20),
    fontWeight: 'bold',
    color: '#8A0000',
    marginBottom: getResponsivePadding(20),
    paddingHorizontal: getResponsivePadding(20),
  },
  faqItem: {
    backgroundColor: '#F8F8F8',
    borderRadius: getResponsiveSize(12),
    marginBottom: getResponsivePadding(12),
    paddingHorizontal: getResponsivePadding(16),
    paddingVertical: getResponsivePadding(12),
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  faqQuestionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestion: {
    fontSize: getResponsiveFontSize(16),
    fontWeight: '600',
    color: '#8A0000',
    flex: 1,
    marginRight: getResponsivePadding(10),
  },
  chevronIcon: {
    marginLeft: getResponsivePadding(10),
  },
  faqAnswerContainer: {
    marginTop: getResponsivePadding(12),
    paddingTop: getResponsivePadding(12),
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  faqAnswer: {
    fontSize: getResponsiveFontSize(14),
    color: '#666',
    lineHeight: getResponsiveFontSize(20),
  },
});

export default FAQScreen;