import React from 'react';
import { View, Image, StyleSheet, ViewStyle, ImageSourcePropType } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { Colors, Gradients } from '@/constants/colors';
import { BorderRadius, Layout, Spacing } from '@/constants/theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';

interface AvatarProps {
  source?: ImageSourcePropType | string;
  fallbackText?: string;
  name?: string;
  size?: AvatarSize;
  online?: boolean;
  gradient?: boolean;
  style?: ViewStyle;
}

export const Avatar: React.FC<AvatarProps> = ({
  source,
  fallbackText,
  name,
  size = 'md',
  online = false,
  gradient = false,
  style,
}) => {
  const avatarSize = Layout.avatarSize[size];
  const fontSize = avatarSize / 2.5;
  const statusSize = avatarSize / 4;

  const getInitials = (text?: string) => {
    const displayName = text || fallbackText || name;
    if (!displayName) return '?';
    const parts = displayName.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  const avatarStyle = [
    styles.avatar,
    { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
    style,
  ];

  if (source) {
    const imageSource = typeof source === 'string' ? { uri: source } : source;
    return (
      <View style={avatarStyle}>
        <Image
          source={imageSource}
          style={styles.image}
          defaultSource={require('../../../assets/images/avatar-placeholder.png')}
        />
        {online && (
          <View
            style={[
              styles.statusDot,
              {
                width: statusSize,
                height: statusSize,
                borderRadius: statusSize / 2,
                borderWidth: avatarSize / 20,
              },
            ]}
          />
        )}
      </View>
    );
  }

  if (gradient) {
    return (
      <View style={avatarStyle}>
        <LinearGradient
          colors={Gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          <Text
            variant="body"
            weight="bold"
            color="white"
            style={[styles.initials, { fontSize }]}
          >
            {getInitials()}
          </Text>
        </LinearGradient>
        {online && (
          <View
            style={[
              styles.statusDot,
              {
                width: statusSize,
                height: statusSize,
                borderRadius: statusSize / 2,
                borderWidth: avatarSize / 20,
              },
            ]}
          />
        )}
      </View>
    );
  }

  return (
    <View style={[avatarStyle, styles.placeholder]}>
      <Text
        variant="body"
        weight="bold"
        color="secondary"
        style={[styles.initials, { fontSize }]}
      >
        {getInitials()}
      </Text>
      {online && (
        <View
          style={[
            styles.statusDot,
            {
              width: statusSize,
              height: statusSize,
              borderRadius: statusSize / 2,
              borderWidth: avatarSize / 20,
            },
          ]}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9999,
  },
  placeholder: {
    backgroundColor: Colors.surface,
  },
  initials: {
    textAlign: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.live,
    borderColor: Colors.background,
  },
});
