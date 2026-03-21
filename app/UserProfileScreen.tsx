import React, { useEffect, useState, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getUserProfile, sendFriendRequest, removeFriend } from '../services/socialService';
import ActivityHeatmap from '../components/profile/ActivityHeatmap';
import { FadeIn } from '../components/ui/FadeIn';
import { SkeletonCircle, SkeletonText, SkeletonBox } from '../components/ui/Skeleton';
import api from '../services/api';
import type { SocialStackParamList } from './SocialScreen';
import type { UserProfile } from '../types/user';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type UserProfileParams = { userId: string };

interface UserProfileData {
  _id: string;
  pseudo: string;
  avatar?: string;
  level?: number;
  xp?: number;
  bio?: string;
  isPrivate?: boolean;
  isFriend?: boolean;
  requestPending?: boolean;
  stats?: {
    totalSessions: number;
    totalVolume: number;
    longestStreak: number;
  };
  heatmapData?: Array<{ date: string; count: number }>;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(pseudo: string): string {
  return pseudo.charAt(0).toUpperCase();
}

function buildHeatmapRecord(
  data?: Array<{ date: string; count: number }>,
): Record<string, number> {
  if (!data) return {};
  return data.reduce<Record<string, number>>((acc, item) => {
    acc[item.date] = item.count;
    return acc;
  }, {});
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ProfileSkeleton() {
  return (
    <View style={{ alignItems: 'center', gap: 12, paddingTop: 24 }}>
      <SkeletonCircle size={80} />
      <SkeletonText width={140} height={20} />
      <SkeletonText width={80} height={16} />
      <SkeletonBox width={180} height={40} borderRadius={20} style={{ marginTop: 8 }} />
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 16 }}>
        {([0, 1, 2] as const).map((i) => (
          <SkeletonBox key={i} width={90} height={64} borderRadius={16} />
        ))}
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function UserProfileScreen({
  navigation,
  route,
}: NativeStackScreenProps<SocialStackParamList, 'UserProfile'>) {
  const { userId } = route.params as UserProfileParams;
  const insets = useSafeAreaInsets();

  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch current user ID once
  useEffect(() => {
    api
      .get<UserProfile>('/users/me')
      .then(({ data }) => setCurrentUserId(data.id))
      .catch(() => undefined);
  }, []);

  const loadProfile = useCallback(async () => {
    setLoading(true);
    const data = await getUserProfile(userId);
    setProfile(data as UserProfileData | null);
    setLoading(false);
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
      return () => {};
    }, [loadProfile]),
  );

  async function handleAddFriend() {
    if (!profile) return;
    setActionLoading(true);
    try {
      await sendFriendRequest(profile._id);
      setProfile((prev) => (prev ? { ...prev, requestPending: true } : prev));
    } finally {
      setActionLoading(false);
    }
  }

  async function handleRemoveFriend() {
    if (!profile) return;
    setActionLoading(true);
    try {
      await removeFriend(profile._id);
      setProfile((prev) =>
        prev ? { ...prev, isFriend: false, requestPending: false } : prev,
      );
    } finally {
      setActionLoading(false);
    }
  }

  const isSelf = currentUserId != null && currentUserId === userId;
  const canSeeStats = profile != null && (!profile.isPrivate || profile.isFriend);

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
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
          style={{ padding: 4 }}
        >
          <Text
            style={{ color: '#EFBF04', fontFamily: 'Rowan-Regular', fontSize: 16 }}
          >
            ← Retour
          </Text>
        </TouchableOpacity>
        <Text
          style={{
            color: '#ffffff',
            fontFamily: 'Quilon-Medium',
            fontSize: 18,
            flex: 1,
          }}
        >
          Profil
        </Text>
      </View>

      {/* Content */}
      {loading ? (
        <ProfileSkeleton />
      ) : profile == null ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}
        >
          <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Rowan-Regular', fontSize: 14 }}>
            Profil introuvable
          </Text>
        </View>
      ) : (
        <FadeIn duration={300}>
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingBottom: 48,
              alignItems: 'center',
              gap: 0,
            }}
          >
            {/* Avatar */}
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: 'rgba(239,191,4,0.2)',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 12,
                overflow: 'hidden',
              }}
            >
              {profile.avatar ? (
                <Image
                  source={{ uri: profile.avatar }}
                  style={{ width: 80, height: 80, borderRadius: 40 }}
                />
              ) : (
                <Text
                  style={{
                    color: '#EFBF04',
                    fontFamily: 'Quilon-Medium',
                    fontSize: 28,
                  }}
                >
                  {getInitials(profile.pseudo)}
                </Text>
              )}
            </View>

            {/* Pseudo */}
            <Text
              style={{
                color: '#ffffff',
                fontFamily: 'Quilon-Medium',
                fontSize: 24,
                marginBottom: 8,
              }}
            >
              {profile.pseudo}
            </Text>

            {/* Level badge */}
            {profile.level != null && (
              <View
                style={{
                  backgroundColor: 'rgba(239,191,4,0.2)',
                  borderRadius: 20,
                  paddingHorizontal: 14,
                  paddingVertical: 4,
                  marginBottom: 12,
                }}
              >
                <Text
                  style={{
                    color: '#EFBF04',
                    fontFamily: 'Rowan-Regular',
                    fontSize: 13,
                  }}
                >
                  Niv. {profile.level}
                </Text>
              </View>
            )}

            {/* Bio */}
            {profile.bio != null && profile.bio.length > 0 && (
              <Text
                style={{
                  color: 'rgba(255,255,255,0.6)',
                  fontFamily: 'Rowan-Regular',
                  fontSize: 14,
                  textAlign: 'center',
                  marginBottom: 16,
                  paddingHorizontal: 24,
                }}
              >
                {profile.bio}
              </Text>
            )}

            {/* Friend action button */}
            {!isSelf && (
              <View style={{ marginBottom: 24, width: '100%', alignItems: 'center' }}>
                {profile.isFriend ? (
                  <TouchableOpacity
                    onPress={handleRemoveFriend}
                    disabled={actionLoading}
                    activeOpacity={0.7}
                    style={{
                      borderWidth: 1,
                      borderColor: 'rgba(248,113,113,0.6)',
                      borderRadius: 20,
                      paddingHorizontal: 24,
                      paddingVertical: 10,
                    }}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#EFBF04" size="small" />
                    ) : (
                      <Text
                        style={{
                          color: 'rgba(248,113,113,0.9)',
                          fontFamily: 'Rowan-Regular',
                          fontSize: 14,
                        }}
                      >
                        Supprimer l'ami
                      </Text>
                    )}
                  </TouchableOpacity>
                ) : profile.requestPending ? (
                  <View
                    style={{
                      borderRadius: 20,
                      paddingHorizontal: 24,
                      paddingVertical: 10,
                      backgroundColor: 'rgba(255,255,255,0.06)',
                    }}
                  >
                    <Text
                      style={{
                        color: 'rgba(255,255,255,0.3)',
                        fontFamily: 'Rowan-Regular',
                        fontSize: 14,
                      }}
                    >
                      En attente…
                    </Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={handleAddFriend}
                    disabled={actionLoading}
                    activeOpacity={0.8}
                    style={{
                      backgroundColor: '#EFBF04',
                      borderRadius: 20,
                      paddingHorizontal: 24,
                      paddingVertical: 10,
                    }}
                  >
                    {actionLoading ? (
                      <ActivityIndicator color="#EFBF04" size="small" />
                    ) : (
                      <Text
                        style={{
                          color: '#000000',
                          fontFamily: 'Quilon-Medium',
                          fontSize: 14,
                        }}
                      >
                        Ajouter comme ami
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Stats row — only when visible */}
            {canSeeStats && profile.stats != null && (
              <View
                style={{
                  flexDirection: 'row',
                  gap: 12,
                  width: '100%',
                  marginBottom: 24,
                }}
              >
                {(
                  [
                    { label: 'Séances', value: String(profile.stats.totalSessions) },
                    { label: 'Volume', value: `${profile.stats.totalVolume}kg` },
                    { label: 'Streak', value: `${profile.stats.longestStreak}j` },
                  ] as const
                ).map(({ label, value }) => (
                  <View
                    key={label}
                    style={{
                      flex: 1,
                      backgroundColor: 'rgba(255,255,255,0.04)',
                      borderRadius: 16,
                      padding: 12,
                      alignItems: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: '#EFBF04',
                        fontFamily: 'Quilon-Medium',
                        fontSize: 18,
                      }}
                    >
                      {value}
                    </Text>
                    <Text
                      style={{
                        color: 'rgba(255,255,255,0.5)',
                        fontFamily: 'Rowan-Regular',
                        fontSize: 11,
                        marginTop: 2,
                      }}
                    >
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {/* Activity heatmap — only if profile is public (or friend) */}
            {canSeeStats && (
              <View
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  borderRadius: 16,
                  padding: 16,
                  marginBottom: 16,
                }}
              >
                <ActivityHeatmap
                  activityData={buildHeatmapRecord(profile.heatmapData)}
                  maxWeeks={26}
                />
              </View>
            )}

            {/* Private profile message */}
            {profile.isPrivate && !profile.isFriend && !isSelf && (
              <View
                style={{
                  width: '100%',
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderRadius: 16,
                  padding: 24,
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ fontSize: 32 }}>🔒</Text>
                <Text
                  style={{
                    color: '#ffffff',
                    fontFamily: 'Quilon-Medium',
                    fontSize: 16,
                    marginTop: 4,
                  }}
                >
                  Profil privé
                </Text>
                <Text
                  style={{
                    color: 'rgba(255,255,255,0.4)',
                    fontFamily: 'Rowan-Regular',
                    fontSize: 13,
                    textAlign: 'center',
                  }}
                >
                  Devenez amis pour voir les stats
                </Text>
              </View>
            )}
          </ScrollView>
        </FadeIn>
      )}
    </View>
  );
}
