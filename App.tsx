/**
 * Sticker Generator — app root and navigation container.
 */

import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import type {RootStackParamList} from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import SelectPhotosScreen from './src/screens/SelectPhotosScreen';
import GeneratingScreen from './src/screens/GeneratingScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import PackDetailScreen from './src/screens/PackDetailScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Home">
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{title: 'My Sticker Packs'}}
          />
          <Stack.Screen
            name="SelectPhotos"
            component={SelectPhotosScreen}
            options={{title: 'Choose Photos'}}
          />
          <Stack.Screen
            name="Generating"
            component={GeneratingScreen}
            options={{title: 'Generating…', headerBackVisible: false}}
          />
          <Stack.Screen
            name="Review"
            component={ReviewScreen}
            options={{title: 'Review Stickers'}}
          />
          <Stack.Screen
            name="PackDetail"
            component={PackDetailScreen}
            options={{title: 'Pack'}}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{title: 'Settings'}}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
