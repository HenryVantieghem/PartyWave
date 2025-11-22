import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

const { width } = Dimensions.get('window');
const PHOTO_SIZE = (width - Spacing.base * 3) / 3;

interface Memory {
  id: string;
  photo_url: string;
  thumbnail_url?: string;
  caption?: string;
  likes_count: number;
  uploaded_by: string;
  created_at: string;
}

export default function PartyMemoriesScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const partyId = params.id as string;

  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMemories();
  }, [partyId]);

  const fetchMemories = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('party_memories')
        .select('*')
        .eq('party_id', partyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setMemories(data || []);
    } catch (error) {
      console.error('Error fetching memories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchMemories();
    setRefreshing(false);
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="dark" style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text variant="h3" weight="bold">
              Memories
            </Text>
            <TouchableOpacity style={styles.uploadButton}>
              <Ionicons name="camera" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </BlurView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />}
      >
        <View style={styles.photosGrid}>
          {memories.map((memory) => (
            <TouchableOpacity
              key={memory.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              style={styles.photoItem}
            >
              <Image source={{ uri: memory.thumbnail_url || memory.photo_url }} style={styles.photo} />
              <View style={styles.photoOverlay}>
                <Ionicons name="heart" size={16} color={Colors.white} />
                <Text variant="caption" color="white" style={{ marginLeft: 4 }}>
                  {memory.likes_count}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.dark,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    height: 56,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base / 2,
  },
  photosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.base / 2,
  },
  photoItem: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    position: 'relative',
  },
  photo: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoOverlay: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
  },
});
