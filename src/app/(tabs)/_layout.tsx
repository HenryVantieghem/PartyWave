import { Tabs } from 'expo-router';
import { View, Platform, StyleSheet, Text } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Gradients } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.text.secondary,
        tabBarShowLabel: false, // REFERENCE-MATCHED: Icon-only tab bar
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 32 : 8,
          paddingTop: 8,
          paddingHorizontal: Spacing.base,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={90}
              tint="dark"
              style={{
                position: 'absolute',
                top: 0,
                left: Spacing.base,
                right: Spacing.base,
                bottom: Platform.OS === 'ios' ? 32 : 8,
                borderRadius: BorderRadius['2xl'],
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
                backgroundColor: 'rgba(26, 26, 30, 0.85)', // REFERENCE-MATCHED: Darker tab bar
                overflow: 'hidden',
              }}
            />
          ) : (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: Spacing.base,
                right: Spacing.base,
                bottom: 8,
                backgroundColor: '#1C1C1E',
                borderRadius: BorderRadius['2xl'],
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.08)',
              }}
            />
          )
        ),
        tabBarItemStyle: {
          paddingVertical: 6,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "radio-button-on" : "radio-button-on-outline"}
                size={26}
                color={focused ? Colors.primary : Colors.text.secondary}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="passport"
        options={{
          title: 'Parties',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "calendar" : "calendar-outline"}
                size={26}
                color={focused ? Colors.primary : Colors.text.secondary}
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
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "duplicate" : "duplicate-outline"}
                size={26}
                color={focused ? Colors.primary : Colors.text.secondary}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="crew"
        options={{
          title: 'Crew',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "people" : "people-outline"}
                size={26}
                color={focused ? Colors.primary : Colors.text.secondary}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          href: null, // Hide messages tab - replaced by Crew
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              <Ionicons
                name={focused ? "person-circle" : "person-circle-outline"}
                size={28}
                color={focused ? Colors.primary : Colors.text.secondary}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
