import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import EmptyState from '../ui/EmptyState';
import { FadeIn } from '../ui/FadeIn';
import { SkeletonCircle, SkeletonText } from '../ui/Skeleton';
import {
  acceptFriendRequest,
  getFriendRequests,
  getFriends,
  rejectFriendRequest,
  removeFriend,
  searchUsers,
  sendFriendRequest,
  type Friend,
  type FriendRequest,
} from '../../services/socialService';

// ─── Avatar ─────────────────────────────────────────────────────────────────

function AvatarCircle({ pseudo }: { pseudo: string }) {
  const initials = pseudo.slice(0, 2).toUpperCase();
  return (
    <View style={styles.avatar}>
      <Text style={styles.avatarText}>{initials}</Text>
    </View>
  );
}

// ─── Skeleton row ────────────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <View style={[styles.card, styles.skeletonRow]}>
      <SkeletonCircle size={48} />
      <View style={styles.skeletonInfo}>
        <SkeletonText width={120} height={14} style={{ marginBottom: 6 }} />
        <SkeletonText width={60} height={11} />
      </View>
    </View>
  );
}

// ─── Section header ──────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionHeader}>{label}</Text>;
}

// ─── Search result card ───────────────────────────────────────────────────────

type SearchButtonState = 'add' | 'pending' | 'friend';

interface SearchCardProps {
  user: Friend;
  isFriend: boolean;
  initialState: SearchButtonState;
  onSendRequest: (userId: string, onError: () => void) => void;
}

function SearchCard({ user, isFriend, initialState, onSendRequest }: SearchCardProps) {
  const [btnState, setBtnState] = useState<SearchButtonState>(initialState);

  function handleAdd() {
    if (btnState !== 'add') return;
    setBtnState('pending');
    onSendRequest(user._id, () => setBtnState('add'));
  }

  return (
    <View style={styles.card}>
      <AvatarCircle pseudo={user.pseudo} />
      <View style={styles.userInfo}>
        <Text style={styles.pseudo}>{user.pseudo}</Text>
        {user.level !== undefined && (
          <Text style={styles.level}>Niveau {user.level}</Text>
        )}
      </View>
      {!isFriend && (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleAdd}
          style={[
            styles.btn,
            btnState === 'add' && styles.btnGold,
            btnState === 'pending' && styles.btnMuted,
            btnState === 'friend' && styles.btnGhost,
          ]}
        >
          {btnState === 'friend' ? (
            <View style={styles.btnRow}>
              <Ionicons name="checkmark" size={14} color="rgba(255,255,255,0.6)" />
              <Text style={[styles.btnText, styles.btnTextMuted]}>Ami</Text>
            </View>
          ) : (
            <Text
              style={[
                styles.btnText,
                btnState === 'add' ? styles.btnTextDark : styles.btnTextMuted,
              ]}
            >
              {btnState === 'add' ? 'Ajouter' : 'En attente'}
            </Text>
          )}
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Friend request card ──────────────────────────────────────────────────────

interface RequestCardProps {
  request: FriendRequest;
  onAccept: (fromId: string, requestId: string) => void;
  onReject: (requestId: string) => void;
}

function RequestCard({ request, onAccept, onReject }: RequestCardProps) {
  const [busy, setBusy] = useState(false);

  async function handleAccept() {
    if (busy) return;
    setBusy(true);
    try {
      await acceptFriendRequest(request.from._id);
      onAccept(request.from._id, request._id);
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue. Réessaie.');
      setBusy(false);
    }
  }

  async function handleReject() {
    if (busy) return;
    setBusy(true);
    try {
      await rejectFriendRequest(request._id);
      onReject(request._id);
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue. Réessaie.');
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      <AvatarCircle pseudo={request.from.pseudo} />
      <View style={styles.userInfo}>
        <Text style={styles.pseudo}>{request.from.pseudo}</Text>
        {request.from.level !== undefined && (
          <Text style={styles.level}>Niveau {request.from.level}</Text>
        )}
      </View>
      <View style={styles.requestActions}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleAccept}
          disabled={busy}
          style={[styles.btn, styles.btnGold, styles.btnSm]}
        >
          {busy ? (
            <ActivityIndicator size="small" color="#000" />
          ) : (
            <Text style={[styles.btnText, styles.btnTextDark]}>Accepter</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleReject}
          disabled={busy}
          style={[styles.btn, styles.btnGhost, styles.btnSm]}
        >
          <Text style={[styles.btnText, styles.btnTextMuted]}>Refuser</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Friend card ──────────────────────────────────────────────────────────────

interface FriendCardProps {
  friend: Friend;
  onRemove: (friendId: string) => void;
}

function FriendCard({ friend, onRemove }: FriendCardProps) {
  async function handleRemove() {
    try {
      await removeFriend(friend._id);
      onRemove(friend._id);
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue. Réessaie.');
    }
  }

  return (
    <View style={styles.card}>
      <AvatarCircle pseudo={friend.pseudo} />
      <View style={styles.userInfo}>
        <Text style={styles.pseudo}>{friend.pseudo}</Text>
        {friend.level !== undefined && (
          <Text style={styles.level}>Niveau {friend.level}</Text>
        )}
      </View>
      <TouchableOpacity activeOpacity={0.7} onPress={handleRemove} style={styles.trashBtn}>
        <Ionicons name="trash-outline" size={18} color="rgba(255,255,255,0.3)" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

interface FriendsScreenProps {
  onUserPress?: (userId: string) => void;
}

export default function FriendsScreen({ onUserPress: _onUserPress }: FriendsScreenProps) {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [requests, setRequests] = useState<FriendRequest[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Friend[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Track requests sent optimistically during this session
  const sentRequests = useRef<Set<string>>(new Set());

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    Promise.all([getFriends(), getFriendRequests()])
      .then(([f, r]) => {
        setFriends(f);
        setRequests(r);
      })
      .finally(() => setLoadingData(false));
  }, []);

  // ── Debounce search ─────────────────────────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Execute search ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (debouncedQuery.length < 2) {
      setSearchResults([]);
      return;
    }
    setSearchLoading(true);
    searchUsers(debouncedQuery)
      .then(setSearchResults)
      .finally(() => setSearchLoading(false));
  }, [debouncedQuery]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const friendIds = new Set(friends.map((f) => f._id));

  const handleSendRequest = useCallback((userId: string, onError: () => void) => {
    sentRequests.current.add(userId);
    sendFriendRequest(userId).catch(() => {
      sentRequests.current.delete(userId);
      onError();
      Alert.alert('Erreur', 'Une erreur est survenue. Réessaie.');
    });
  }, []);

  const handleAccept = useCallback((fromId: string, requestId: string) => {
    setRequests((prev) => prev.filter((r) => r._id !== requestId));
    setFriends((prev) => {
      const user = searchResults.find((u) => u._id === fromId);
      if (user && !prev.some((f) => f._id === fromId)) return [...prev, user];
      return prev;
    });
  }, [searchResults]);

  const handleReject = useCallback((requestId: string) => {
    setRequests((prev) => prev.filter((r) => r._id !== requestId));
  }, []);

  const handleRemoveFriend = useCallback((friendId: string) => {
    setFriends((prev) => prev.filter((f) => f._id !== friendId));
  }, []);

  // ── Derived ──────────────────────────────────────────────────────────────────
  const isSearching = debouncedQuery.length >= 2 || searchQuery.length >= 2;

  function getSearchButtonState(user: Friend): SearchButtonState {
    if (friendIds.has(user._id)) return 'friend';
    if (sentRequests.current.has(user._id)) return 'pending';
    return 'add';
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={16} color="rgba(255,255,255,0.4)" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Rechercher un utilisateur..."
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Search mode */}
      {isSearching ? (
        <FadeIn>
          {searchLoading ? (
            <View style={styles.section}>
              {[0, 1, 2].map((i) => <SkeletonRow key={i} />)}
            </View>
          ) : searchResults.length === 0 ? (
            <EmptyState
              icon="👤"
              title="Aucun résultat"
              description="Essaie un autre pseudo"
              compact
            />
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item._id}
              contentContainerStyle={styles.section}
              renderItem={({ item }) => (
                <SearchCard
                  user={item}
                  isFriend={friendIds.has(item._id)}
                  initialState={getSearchButtonState(item)}
                  onSendRequest={handleSendRequest}
                />
              )}
            />
          )}
        </FadeIn>
      ) : loadingData ? (
        /* Loading skeletons */
        <View style={styles.section}>
          {[0, 1, 2, 3].map((i) => <SkeletonRow key={i} />)}
        </View>
      ) : (
        /* Normal mode — requests + friends */
        <FlatList
          data={[]}
          keyExtractor={() => ''}
          renderItem={null}
          contentContainerStyle={styles.section}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Demandes reçues */}
              {requests.length > 0 && (
                <FadeIn>
                  <SectionHeader label={`Demandes reçues (${requests.length})`} />
                  {requests.map((req) => (
                    <RequestCard
                      key={req._id}
                      request={req}
                      onAccept={handleAccept}
                      onReject={handleReject}
                    />
                  ))}
                </FadeIn>
              )}

              {/* Mes amis */}
              {friends.length > 0 ? (
                <FadeIn>
                  <SectionHeader label={`Mes amis (${friends.length})`} />
                  {friends.map((friend) => (
                    <FriendCard
                      key={friend._id}
                      friend={friend}
                      onRemove={handleRemoveFriend}
                    />
                  ))}
                </FadeIn>
              ) : requests.length === 0 ? (
                <EmptyState
                  icon="👥"
                  title="Pas encore d'amis"
                  description="Recherche des utilisateurs pour commencer"
                  cta={
                    <TouchableOpacity
                      activeOpacity={0.7}
                      onPress={() => setSearchQuery(' ')}
                      style={[styles.btn, styles.btnGold]}
                    >
                      <Text style={[styles.btnText, styles.btnTextDark]}>
                        Rechercher des utilisateurs
                      </Text>
                    </TouchableOpacity>
                  }
                />
              ) : null}
            </>
          }
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  // Search bar
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fafafa',
    fontFamily: 'Rowan-Regular',
    fontSize: 15,
  },
  // Section
  section: {
    paddingBottom: 24,
  },
  sectionHeader: {
    fontFamily: 'Quilon-Medium',
    fontSize: 13,
    color: 'rgba(255,255,255,0.4)',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 10,
    marginTop: 4,
  },
  // Card
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 10,
  },
  skeletonRow: {
    gap: 12,
  },
  skeletonInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  // Avatar
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontFamily: 'Quilon-Medium',
    fontSize: 16,
    color: '#fafafa',
  },
  // User info
  userInfo: {
    flex: 1,
  },
  pseudo: {
    fontFamily: 'Quilon-Medium',
    fontSize: 16,
    color: '#fafafa',
    marginBottom: 2,
  },
  level: {
    fontFamily: 'Rowan-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
  },
  // Buttons
  btn: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSm: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnGold: {
    backgroundColor: '#EFBF04',
  },
  btnMuted: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  btnText: {
    fontFamily: 'Quilon-Medium',
    fontSize: 13,
  },
  btnTextDark: {
    color: '#121212',
  },
  btnTextMuted: {
    color: 'rgba(255,255,255,0.6)',
  },
  // Request actions
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  // Trash icon
  trashBtn: {
    padding: 8,
  },
});
