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
        tabBarStyle: {
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: Platform.OS === 'ios' ? 'transparent' : Colors.card,
          borderTopWidth: 0,
          elevation: 0,
          height: Platform.OS === 'ios' ? 88 : 72,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
          paddingTop: 8,
          paddingHorizontal: Spacing.sm,
          shadowColor: Colors.primary,
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.15,
          shadowRadius: 16,
        },
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView
              intensity={100}
              tint="dark"
              style={{
                position: 'absolute',
                top: 0,
                left: Spacing.sm,
                right: Spacing.sm,
                bottom: 0,
                borderRadius: BorderRadius['2xl'],
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.12)',
                overflow: 'hidden',
              }}
            />
          ) : (
            <View
              style={{
                position: 'absolute',
                top: 0,
                left: Spacing.sm,
                right: Spacing.sm,
                bottom: 0,
                backgroundColor: Colors.card,
                borderRadius: BorderRadius['2xl'],
                borderWidth: 1,
                borderColor: Colors.border.default,
              }}
            />
          )
        ),
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Discover',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              {focused ? (
                <LinearGradient
                  colors={[Colors.primary + '30', Colors.primary + '10']}
                  style={styles.iconGradient}
                >
                  <Text style={styles.emojiIcon}>⚡</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.emojiIconInactive}>⚡</Text>
              )}
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
              {focused ? (
                <LinearGradient
                  colors={[Colors.primary + '30', Colors.primary + '10']}
                  style={styles.iconGradient}
                >
                  <Text style={styles.emojiIcon}>📅</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.emojiIconInactive}>📅</Text>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="camera"
        options={{
          title: '',
          tabBarIcon: ({ focused }) => (
            <View style={styles.cameraContainer}>
              <LinearGradient
                colors={focused ? Gradients.primary : ['#4ECDC4', '#95E1D3']}
                style={styles.cameraButton}
              >
                <Text style={styles.cameraEmoji}>📸</Text>
              </LinearGradient>
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
              {focused ? (
                <LinearGradient
                  colors={[Colors.primary + '30', Colors.primary + '10']}
                  style={styles.iconGradient}
                >
                  <Text style={styles.emojiIcon}>👥</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.emojiIconInactive}>👥</Text>
              )}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ focused }) => (
            <View style={styles.iconContainer}>
              {focused ? (
                <LinearGradient
                  colors={[Colors.primary + '30', Colors.primary + '10']}
                  style={styles.iconGradient}
                >
                  <Text style={styles.emojiIcon}>👤</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.emojiIconInactive}>👤</Text>
              )}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGradient: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '40',
  },
  emojiIcon: {
    fontSize: 24,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  emojiIconInactive: {
    fontSize: 24,
    opacity: 0.6,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
  cameraContainer: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  cameraButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cameraEmoji: {
    fontSize: 28,
    includeFontPadding: false,
    textAlignVertical: 'center',
  },
});
