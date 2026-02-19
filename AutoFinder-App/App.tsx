import "react-native-gesture-handler";
import Main from "./src/Main";
import { NavigationContainer } from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Linking, Platform } from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider, initialWindowMetrics } from "react-native-safe-area-context";

export default function App() {
  const navigationRef = useRef<any>(null);
  const isReadyRef = useRef(false);
  const pendingUrlRef = useRef<string | null>(null);

  useEffect(() => {
    const handleDeepLink = (event: { url: string }) => {
      handleNavigation(event.url);
    };
    Linking.getInitialURL()
      .then((url) => {
        if (url) handleNavigation(url);
      })
      .catch((error) => {
        console.error('❌ Error getting initial URL:', error);
      });
    const subscription = Linking.addEventListener('url', handleDeepLink);
    return () => subscription.remove();
  }, []);

  const handleNavigation = (url: string) => {
    if (!isReadyRef.current || !navigationRef.current) {
      pendingUrlRef.current = url;
      return;
    }
    pendingUrlRef.current = null;

    try {
      // Parse URL: https://autofinder.pk/car/123 or autofinder://car/123
      const urlObj = new URL(url.replace('autofinder://', 'https://autofinder.pk/'));
      const path = urlObj.pathname;
      
      console.log('🔗 Parsed path:', path);

      // Extract ID from path
      const pathParts = path.split('/').filter(p => p);
      const type = pathParts[0]; // car, bike, rental-car, etc.
      const id = pathParts[1]; // ad ID

      if (!id) {
        console.log('⚠️ No ID found in URL');
        return;
      }

      // Navigate based on type
      switch (type) {
        case 'car':
          navigationRef.current.navigate('CarDetails', { 
            carDetails: { _id: id } 
          });
          break;
        case 'bike':
          navigationRef.current.navigate('BikeDetails', { 
            carDetails: { _id: id } 
          });
          break;
        case 'rental-car':
          navigationRef.current.navigate('RentalCarDetailsScreen', { 
            carDetails: { _id: id } 
          });
          break;
        case 'new-car':
          navigationRef.current.navigate('NewCarDetails', { 
            carDetails: { _id: id } 
          });
          break;
        case 'new-bike':
          navigationRef.current.navigate('NewBikeDetailsScreen', { 
            carDetails: { _id: id } 
          });
          break;
        case 'auto-part':
          navigationRef.current.navigate('AutoPartsDetailsScreen', { 
            part: { _id: id } 
          });
          break;
        default:
          console.log('⚠️ Unknown type:', type);
      }
    } catch (error) {
      console.error('❌ Error handling deep link:', error);
    }
  };

  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <View style={styles.container}>
        <StatusBar style="light" animated />
        <NavigationContainer
          ref={navigationRef}
          onReady={() => {
            isReadyRef.current = true;
            if (pendingUrlRef.current) {
              const url = pendingUrlRef.current;
              pendingUrlRef.current = null;
              setTimeout(() => handleNavigation(url), 0);
            }
          }}
          linking={{
            prefixes: [
              'autofinder://',
              'https://autofinder.pk',
              'https://www.autofinder.pk',
            ],
            config: {
              screens: {
                CarDetails: {
                  path: 'car/:id',
                  parse: {
                    id: (id: string) => id,
                  },
                },
                BikeDetails: {
                  path: 'bike/:id',
                  parse: {
                    id: (id: string) => id,
                  },
                },
                RentalCarDetailsScreen: {
                  path: 'rental-car/:id',
                  parse: {
                    id: (id: string) => id,
                  },
                },
                NewCarDetails: {
                  path: 'new-car/:id',
                  parse: {
                    id: (id: string) => id,
                  },
                },
                NewBikeDetailsScreen: {
                  path: 'new-bike/:id',
                  parse: {
                    id: (id: string) => id,
                  },
                },
                AutoPartsDetailsScreen: {
                  path: 'auto-part/:id',
                  parse: {
                    id: (id: string) => id,
                  },
                },
              },
            },
          }}
        >
          <Main />
        </NavigationContainer>
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
    color: '#666',
  },
});
