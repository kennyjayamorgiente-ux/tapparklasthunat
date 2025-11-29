import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { DrawerProvider } from '../contexts/DrawerContext';
import { AuthProvider } from '../contexts/AuthContext';
import { LoadingProvider } from '../contexts/LoadingContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import CustomDrawer from '../components/CustomDrawer';
import GlobalSpinner from '../components/GlobalSpinner';
import { useDrawer } from '../contexts/DrawerContext';

function RootLayoutNav() {
	const { isDrawerOpen, closeDrawer } = useDrawer();
	
	return (
		<>
			<Stack
				screenOptions={{
					headerShown: false,
					animation: 'fade',
				}}
			>
				<Stack.Screen 
					name="index" 
					options={{
						animation: 'fade',
					}}
				/>
				<Stack.Screen name="screens" />
				<Stack.Screen name="attendant-screen" />
				<Stack.Screen name="ProfileScreen" />
				<Stack.Screen 
					name="screens/TermsAndConditionsScreen" 
					options={{
						presentation: 'modal',
						animation: 'slide_from_bottom',
					}}
				/>
				<Stack.Screen name="screens/BalanceScreen" />
				<Stack.Screen 
					name="screens/FAQScreen" 
					options={{
						presentation: 'modal',
						animation: 'slide_from_bottom',
					}}
				/>
				<Stack.Screen 
					name="(tabs)" 
					options={{
						animation: 'fade',
					}}
				/>
				<Stack.Screen 
					name="modal" 
					options={{
						presentation: 'modal',
						animation: 'slide_from_bottom',
					}}
				/>
			</Stack>
			<CustomDrawer isOpen={isDrawerOpen} onClose={closeDrawer} />
		</>
	);
}

export default function RootLayout() {
	return (
		<GestureHandlerRootView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
			<ThemeProvider>
				<AuthProvider>
					<LoadingProvider>
						<DrawerProvider>
							<RootLayoutNav />
							<GlobalSpinner />
						</DrawerProvider>
					</LoadingProvider>
				</AuthProvider>
			</ThemeProvider>
		</GestureHandlerRootView>
	);
}