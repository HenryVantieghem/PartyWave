import { Tabs } from 'expo-router';
import { View, Platform, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : Colors.card,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
          paddingHorizontal: Spacing.md,
          // Floating glass effect
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.1,
          shadowRadius: 12,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={100}
              tint="dark"
              style={{
                position: 'absolute',
                top: 0,
                left: Spacing.md,
                right: Spacing.md,
                bottom: 0,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: Colors.glass.border,
                overflow: 'hidden',
              }}
            />
          ) : (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: Spacing.md,
                right: Spacing.md,
                bottom: 0,
                backgroundColor: Colors.card,
                borderRadius: BorderRadius.xl,
                borderWidth: 1,
                borderColor: Colors.border.default,
              }}
            />
          )
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: focused ? Colors.primary + '20' : 'transparent',
              }}
            >
              <Ionicons
                name={focused ? 'compass' : 'compass-outline'}
                size={size}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="passport"
        options={{
          title: 'Passport',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: focused ? Colors.primary + '20' : 'transparent',
              }}
            >
              <Ionicons
                name={focused ? 'ticket' : 'ticket-outline'}
                size={size}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                width: 60,
                height: 60,
                borderRadius: 30,
                backgroundColor: focused ? Colors.primary : Colors.secondary,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 20,
                shadowColor: focused ? Colors.primary : Colors.secondary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 8,
              }}
            >
              <Ionicons name="camera" size={28} color={Colors.white} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="crew"
        options={{
          title: 'Crew',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: focused ? Colors.primary + '20' : 'transparent',
              }}
            >
              <Ionicons
                name={focused ? 'people' : 'people-outline'}
                size={size}
                color={color}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: focused ? Colors.primary + '20' : 'transparent',
              }}
            >
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={size}
                color={color}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
