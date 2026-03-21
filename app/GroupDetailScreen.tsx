import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import HubTabNavigation from '../components/ui/HubTabNavigation';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonBox, SkeletonText, SkeletonCircle } from '../components/ui/Skeleton';
import GroupChatTab from '../components/social/GroupChatTab';
import GroupLeaderboardTab from '../components/social/GroupLeaderboardTab';
import {
  getGroupDetail,
  getGroupActivity,
  leaveGroup,
} from '../services/groupService';
import type { GroupDetail, GroupMember } from '../services/groupService';
import type { ActivityItem } from '../services/socialService';
import { formatRelativeTime } from '../utils/formatters';

// ─── Navigation types ────────────────────────────────────────────────────────

export type GroupDetailParams = {
  GroupDetail: { groupId: string };
};

type Props = NativeStackScreenProps<GroupDetailParams, 'GroupDetail'>;

// ─── Constants ────────────────────────────────────────────────────────────────

const GROUP_TABS = [
  { id: 'activite', label: 'Activité' },
  { id: 'membres', label: 'Membres' },
  { id: 'chat', label: 'Chat' },
  { id: 'classement', label: 'Classement' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getInitials(pseudo: string): string {
  return pseudo
    .split(' ')
    .map((w) => w[0] ?? '')
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

function getActivityDescription(item: ActivityItem): string {
  if (item.type === 'workout_completed') {
    return 'A terminé une séance';
  }
  if (item.type === 'personal_record') {
    const exerciseName = typeof item.data.exerciseName === 'string' ? item.data.exerciseName : '';
    const weight = typeof item.data.weight === 'number' ? item.data.weight : null;
    const parts = ['🏆 Nouveau record'];
    if (exerciseName) parts.push(exerciseName);
    if (weight !== null) parts.push(`${weight}kg`);
    return parts.join(' — ');
  }
  return item.type.replace(/_/g, ' ');
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ActivityItemRow({ item }: { item: ActivityItem }) {
  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Avatar circle */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: 'rgba(239,191,4,0.15)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: '#EFBF04',
            fontFamily: 'Quilon-Medium',
            fontSize: 13,
          }}
        >
          {getInitials(item.userPseudo)}
        </Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: '#fafafa',
            fontFamily: 'Quilon-Medium',
            fontSize: 13,
            marginBottom: 2,
          }}
        >
          {item.userPseudo}
        </Text>
        <Text
          style={{
            color: 'rgba(255,255,255,0.6)',
            fontFamily: 'Rowan-Regular',
            fontSize: 13,
          }}
          numberOfLines={2}
        >
          {getActivityDescription(item)}
        </Text>
      </View>

      {/* Timestamp */}
      <Text
        style={{
          color: 'rgba(255,255,255,0.3)',
          fontFamily: 'Rowan-Regular',
          fontSize: 11,
        }}
      >
        {formatRelativeTime(item.createdAt)}
      </Text>
    </View>
  );
}

function MemberRow({ member }: { member: GroupMember }) {
  return (
    <View
      style={{
        backgroundColor: 'rgba(255,255,255,0.04)',
        borderRadius: 12,
        padding: 12,
        marginBottom: 8,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
      }}
    >
      {/* Avatar circle 44px */}
      <View
        style={{
          width: 44,
          height: 44,
          borderRadius: 22,
          backgroundColor: 'rgba(255,255,255,0.08)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text
          style={{
            color: '#fafafa',
            fontFamily: 'Quilon-Medium',
            fontSize: 14,
          }}
        >
          {getInitials(member.pseudo)}
        </Text>
      </View>

      {/* Info */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: '#fafafa',
            fontFamily: 'Quilon-Medium',
            fontSize: 14,
          }}
        >
          {member.pseudo}
        </Text>
        {member.level !== undefined && (
          <Text
            style={{
              color: 'rgba(255,255,255,0.4)',
              fontFamily: 'Rowan-Regular',
              fontSize: 12,
              marginTop: 2,
            }}
          >
            Niv. {member.level}
          </Text>
        )}
      </View>

      {/* Admin badge */}
      {member.role === 'admin' && (
        <View
          style={{
            backgroundColor: 'rgba(239,191,4,0.15)',
            borderRadius: 999,
            paddingHorizontal: 10,
            paddingVertical: 3,
            borderWidth: 1,
            borderColor: 'rgba(239,191,4,0.3)',
          }}
        >
          <Text
            style={{
              color: '#EFBF04',
              fontFamily: 'Quilon-Medium',
              fontSize: 11,
            }}
          >
            Admin
          </Text>
        </View>
      )}
    </View>
  );
}

function LoadingSkeleton() {
  return (
    <View style={{ paddingHorizontal: 16 }}>
      {/* Header card skeleton */}
      <View
        style={{
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 16,
          padding: 16,
          marginBottom: 20,
        }}
      >
        <SkeletonText width="60%" height={20} style={{ marginBottom: 8 }} />
        <SkeletonText width="90%" height={14} style={{ marginBottom: 4 }} />
        <SkeletonText width="70%" height={14} style={{ marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <SkeletonBox width={80} height={24} borderRadius={999} />
          <SkeletonBox width={60} height={24} borderRadius={999} />
        </View>
      </View>
      {/* Tab skeleton */}
      <SkeletonBox width="100%" height={40} borderRadius={10} style={{ marginBottom: 20 }} />
      {/* Items skeleton */}
      {[1, 2, 3].map((i) => (
        <View
          key={i}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <SkeletonCircle size={40} />
          <View style={{ flex: 1, gap: 6 }}>
            <SkeletonText width="50%" height={13} />
            <SkeletonText width="80%" height={13} />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GroupDetailScreen({ route, navigation }: Props) {
  const { groupId } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const confirm = useConfirm();

  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(false);
  const [activeTab, setActiveTab] = useState('activite');

  useEffect(() => {
    Promise.all([getGroupDetail(groupId), getGroupActivity(groupId)])
      .then(([groupData, activityData]) => {
        setGroup(groupData);
        setActivity(activityData);
      })
      .catch(() => {
        toast.error('Impossible de charger le groupe. Réessayez.');
      })
      .finally(() => setLoading(false));
  }, [groupId, toast]);

  const handleLeave = useCallback(async () => {
    const ok = await confirm({
      title: 'Quitter le groupe',
      message: `Voulez-vous vraiment quitter "${group?.name ?? 'ce groupe'}" ?`,
      confirmText: 'Quitter',
      destructive: true,
    });
    if (!ok) return;
    setLeaving(true);
    try {
      await leaveGroup(groupId);
      navigation.goBack();
    } catch {
      toast.error('Impossible de quitter le groupe. Réessayez.');
      setLeaving(false);
    }
  }, [groupId, group?.name, navigation, confirm, toast]);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212' }}>
        {/* Header */}
        <View
          style={{
            paddingTop: insets.top + 8,
            paddingHorizontal: 16,
            paddingBottom: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
            <Text style={{ color: '#EFBF04', fontFamily: 'Rowan-Regular', fontSize: 15 }}>← Retour</Text>
          </TouchableOpacity>
        </View>
        <LoadingSkeleton />
      </View>
    );
  }

  if (!group) {
    return (
      <View style={{ flex: 1, backgroundColor: '#121212', alignItems: 'center', justifyContent: 'center' }}>
        <EmptyState icon="❌" title="Groupe introuvable" type="error" />
        <TouchableOpacity onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          <Text style={{ color: '#EFBF04', fontFamily: 'Rowan-Regular', fontSize: 14 }}>← Retour</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const members: GroupMember[] = group.members ?? [];

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      {/* ── Header ── */}
      <View
        style={{
          paddingTop: insets.top + 8,
          paddingHorizontal: 16,
          paddingBottom: 12,
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={{ color: '#EFBF04', fontFamily: 'Rowan-Regular', fontSize: 15 }}>←</Text>
        </TouchableOpacity>
        <Text
          style={{
            color: '#fafafa',
            fontFamily: 'Quilon-Medium',
            fontSize: 20,
            flex: 1,
          }}
          numberOfLines={1}
        >
          {group.name}
        </Text>
      </View>

      {/* ── Tab header (group info card + tab nav): hidden in chat/classement for space ── */}
      {activeTab !== 'chat' && activeTab !== 'classement' && (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 80,
          }}
        >
          {/* Group header card */}
          <View
            style={{
              backgroundColor: 'rgba(255,255,255,0.04)',
              borderRadius: 16,
              padding: 16,
              marginBottom: 20,
            }}
          >
            <Text
              style={{
                color: '#fafafa',
                fontFamily: 'Quilon-Medium',
                fontSize: 24,
                marginBottom: 6,
              }}
            >
              {group.name}
            </Text>
            {group.description ? (
              <Text
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: 'Rowan-Regular',
                  fontSize: 14,
                  lineHeight: 20,
                  marginBottom: 12,
                }}
              >
                {group.description}
              </Text>
            ) : null}
            {/* Stats row */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text
                style={{
                  color: 'rgba(255,255,255,0.5)',
                  fontFamily: 'Rowan-Regular',
                  fontSize: 13,
                }}
              >
                {group.memberCount} membre{group.memberCount !== 1 ? 's' : ''}
              </Text>
              <View
                style={{
                  backgroundColor: group.isPublic
                    ? 'rgba(34,197,94,0.15)'
                    : 'rgba(239,191,4,0.15)',
                  borderRadius: 999,
                  paddingHorizontal: 10,
                  paddingVertical: 3,
                }}
              >
                <Text
                  style={{
                    color: group.isPublic ? '#22c55e' : '#EFBF04',
                    fontFamily: 'Quilon-Medium',
                    fontSize: 11,
                  }}
                >
                  {group.isPublic ? 'Public' : 'Privé'}
                </Text>
              </View>
            </View>
          </View>

          {/* Tabs */}
          <HubTabNavigation
            tabs={GROUP_TABS}
            activeTab={activeTab}
            onTabChange={setActiveTab}
          />

          {/* Tab: Activité */}
          {activeTab === 'activite' && (
            <>
              {activity.length === 0 ? (
                <EmptyState
                  icon="📭"
                  title="Aucune activité"
                  description="Les séances et records des membres apparaîtront ici."
                  compact
                />
              ) : (
                activity.map((item) => <ActivityItemRow key={item._id} item={item} />)
              )}
            </>
          )}

          {/* Tab: Membres */}
          {activeTab === 'membres' && (
            <>
              {members.length === 0 ? (
                <EmptyState icon="👥" title="Aucun membre" compact />
              ) : (
                members.map((member) => <MemberRow key={member._id} member={member} />)
              )}
            </>
          )}
        </ScrollView>
      )}

      {/* ── Tab: Chat ── */}
      {activeTab === 'chat' && (
        <View style={{ flex: 1 }}>
          {/* Compact tab nav for Chat */}
          <View style={{ paddingHorizontal: 16, paddingTop: 4, paddingBottom: 0 }}>
            <HubTabNavigation
              tabs={GROUP_TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </View>
          <GroupChatTab groupId={groupId} />
        </View>
      )}

      {/* ── Tab: Classement ── */}
      {activeTab === 'classement' && (
        <View style={{ flex: 1, paddingHorizontal: 16 }}>
          <View style={{ paddingTop: 4, paddingBottom: 0 }}>
            <HubTabNavigation
              tabs={GROUP_TABS}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
          </View>
          <GroupLeaderboardTab groupId={groupId} />
        </View>
      )}

      {/* ── Footer: leave button (hidden in chat/classement to avoid overlap) ── */}
      {activeTab !== 'chat' && activeTab !== 'classement' && (
        <View
          style={{
            position: 'absolute',
            bottom: insets.bottom + 16,
            left: 16,
            right: 16,
          }}
        >
          <TouchableOpacity
            onPress={handleLeave}
            disabled={leaving}
            activeOpacity={0.8}
            style={{
              backgroundColor: 'rgba(239,68,68,0.12)',
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              borderWidth: 1,
              borderColor: 'rgba(239,68,68,0.25)',
            }}
          >
            {leaving ? (
              <ActivityIndicator color="#ef4444" size="small" />
            ) : (
              <Text
                style={{
                  color: '#ef4444',
                  fontFamily: 'Quilon-Medium',
                  fontSize: 15,
                }}
              >
                Quitter le groupe
              </Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
