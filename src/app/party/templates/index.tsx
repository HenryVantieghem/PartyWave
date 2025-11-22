import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Text } from '@/components/ui/Text';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { Spacing, BorderRadius } from '@/constants/theme';
import { usePartyStore } from '@/stores/partyStore';
import { useAuthStore } from '@/stores/authStore';
import { PartyTemplate } from '@/types/party';

export default function TemplatesBrowserScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const selectMode = params.select === 'true';

  const { profile } = useAuthStore();
  const { templates, fetchTemplates } = usePartyStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'mine' | 'public'>('all');

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTemplates();
    setRefreshing(false);
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.back();
  };

  const handleSelectTemplate = (template: PartyTemplate) => {
    if (selectMode) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // Return to party create with template ID
      router.back();
      router.setParams({ templateId: template.id });
    } else {
      // Navigate to template detail/edit
      router.push(`/party/templates/${template.id}` as any);
    }
  };

  const filteredTemplates = templates.filter((template) => {
    if (filter === 'mine') return template.created_by === profile?.id;
    if (filter === 'public') return template.is_public;
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
      <BlurView intensity={80} tint="dark" style={styles.header}>
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <TouchableOpacity onPress={handleBack} style={styles.backButton}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
            <Text variant="h3" weight="bold">
              {selectMode ? 'Select Template' : 'Party Templates'}
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/party/templates/create' as any)}
              style={styles.addButton}
            >
              <Ionicons name="add" size={24} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </BlurView>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScroll}>
          {[
            { key: 'all' as const, label: 'All Templates', icon: 'apps' },
            { key: 'mine' as const, label: 'My Templates', icon: 'person' },
            { key: 'public' as const, label: 'Public', icon: 'globe' },
          ].map(({ key, label, icon }) => (
            <TouchableOpacity
              key={key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(key);
              }}
              style={[
                styles.filterTab,
                filter === key && styles.filterTabActive,
              ]}
            >
              <Ionicons
                name={icon as any}
                size={16}
                color={filter === key ? Colors.white : Colors.text.secondary}
              />
              <Text
                variant="caption"
                weight="semibold"
                color={filter === key ? 'white' : 'secondary'}
                style={{ marginLeft: Spacing.xs }}
              >
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.primary} />
        }
      >
        {filteredTemplates.length === 0 ? (
          <Card variant="liquid" style={{ marginTop: Spacing.xl }}>
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={48} color={Colors.text.tertiary} />
              <Text variant="body" color="secondary" center style={{ marginTop: Spacing.md }}>
                {filter === 'mine' ? 'No templates created yet' : 'No templates found'}
              </Text>
              <Text variant="caption" color="tertiary" center style={{ marginTop: Spacing.xs }}>
                {filter === 'mine' && 'Create your first template to reuse party setups'}
              </Text>
            </View>
          </Card>
        ) : (
          <View style={styles.templateGrid}>
            {filteredTemplates.map((template) => (
              <TouchableOpacity
                key={template.id}
                onPress={() => handleSelectTemplate(template)}
                style={styles.templateCard}
                activeOpacity={0.7}
              >
                <Card variant="liquid">
                  <View style={styles.templateHeader}>
                    <Text style={styles.templateEmoji}>{template.icon_emoji}</Text>
                    {template.created_by === profile?.id && (
                      <View style={styles.ownerBadge}>
                        <Ionicons name="person" size={12} color={Colors.accent.gold} />
                      </View>
                    )}
                  </View>
                  <Text variant="h4" weight="bold" numberOfLines={1}>
                    {template.name}
                  </Text>
                  {template.description && (
                    <Text variant="caption" color="secondary" numberOfLines={2} style={{ marginTop: Spacing.xs }}>
                      {template.description}
                    </Text>
                  )}
                  <View style={styles.templateMeta}>
                    <View style={styles.metaItem}>
                      <Ionicons name="time-outline" size={14} color={Colors.text.tertiary} />
                      <Text variant="caption" color="tertiary" style={{ marginLeft: 4 }}>
                        {template.default_duration_hours}h
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="people-outline" size={14} color={Colors.text.tertiary} />
                      <Text variant="caption" color="tertiary" style={{ marginLeft: 4 }}>
                        {template.suggested_capacity || '—'}
                      </Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Ionicons name="rocket-outline" size={14} color={Colors.text.tertiary} />
                      <Text variant="caption" color="tertiary" style={{ marginLeft: 4 }}>
                        {template.use_count}
                      </Text>
                    </View>
                  </View>
                  {template.default_vibe_tags.length > 0 && (
                    <View style={styles.vibeChips}>
                      {template.default_vibe_tags.slice(0, 3).map((vibe) => (
                        <View key={vibe} style={styles.vibeChip}>
                          <Text variant="caption" color="tertiary">
                            {vibe}
                          </Text>
                        </View>
                      ))}
                      {template.default_vibe_tags.length > 3 && (
                        <View style={styles.vibeChip}>
                          <Text variant="caption" color="tertiary">
                            +{template.default_vibe_tags.length - 3}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 100 }} />
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
  addButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterContainer: {
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border.dark,
  },
  filterScroll: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.base,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
  },
  templateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  templateCard: {
    width: '48%',
  },
  templateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  templateEmoji: {
    fontSize: 32,
  },
  ownerBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateMeta: {
    flexDirection: 'row',
    marginTop: Spacing.md,
    gap: Spacing.md,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vibeChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  vibeChip: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: BorderRadius.sm,
  },
});
