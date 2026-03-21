import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useToast } from '../../context/ToastContext';
import { hapticImpact } from '../../utils/haptics';
import EmptyState from '../ui/EmptyState';
import { FadeIn } from '../ui/FadeIn';
import { SkeletonBox, SkeletonText } from '../ui/Skeleton';
import {
  createGroup,
  discoverGroups,
  getMyGroups,
  joinGroupByCode,
  requestJoinGroup,
  type Group,
} from '../../services/groupService';

// ─── Props ────────────────────────────────────────────────────────────────────

interface GroupsScreenProps {
  onGroupPress?: (groupId: string) => void;
}

// ─── Group card ───────────────────────────────────────────────────────────────

interface GroupCardProps {
  group: Group;
  action?: React.ReactNode;
  onPress?: () => void;
}

function GroupCard({ group, action, onPress }: GroupCardProps) {
  const content = (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <Text style={styles.cardName}>{group.name}</Text>
        {group.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {group.description}
          </Text>
        ) : null}
      </View>
      <View style={styles.cardFooter}>
        <View style={styles.cardMeta}>
          <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.4)" />
          <Text style={styles.cardMetaText}>{group.memberCount} membres</Text>
        </View>
        <View
          style={[
            styles.badge,
            group.isPublic ? styles.badgePublic : styles.badgePrivate,
          ]}
        >
          <Text style={styles.badgeText}>
            {group.isPublic ? 'Public' : 'Privé'}
          </Text>
        </View>
      </View>
      {action ? <View style={styles.cardAction}>{action}</View> : null}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.7} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

// ─── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <View style={[styles.card, { gap: 10 }]}>
      <SkeletonText width={140} height={14} />
      <SkeletonText width="90%" height={11} />
      <SkeletonText width="70%" height={11} />
      <View style={styles.cardFooter}>
        <SkeletonBox width={80} height={20} borderRadius={10} />
        <SkeletonBox width={52} height={20} borderRadius={10} />
      </View>
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ label }: { label: string }) {
  return <Text style={styles.sectionHeader}>{label}</Text>;
}

// ─── Join by code modal ───────────────────────────────────────────────────────

interface JoinModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function JoinByCodeModal({ visible, onClose, onSuccess }: JoinModalProps) {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleClose() {
    setCode('');
    setError(null);
    onClose();
  }

  async function handleJoin() {
    if (code.length !== 6) {
      setError('Le code doit contenir 6 caractères.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await joinGroupByCode(code.toUpperCase());
      setCode('');
      onSuccess();
      onClose();
    } catch {
      setError('Code invalide ou groupe introuvable.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Rejoindre par code</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={22} color="#EFBF04" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Code d'invitation (6 car.)"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={code}
            onChangeText={(v) => {
              setCode(v.toUpperCase().slice(0, 6));
              setError(null);
            }}
            autoCapitalize="characters"
            autoCorrect={false}
            maxLength={6}
          />

          {error ? <Text style={styles.inputError}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, styles.btnGold, loading && styles.btnDisabled]}
            activeOpacity={0.8}
            onPress={handleJoin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#EFBF04" />
            ) : (
              <Text style={[styles.btnText, styles.btnTextDark]}>Rejoindre</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Create group modal ───────────────────────────────────────────────────────

interface CreateModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

function CreateGroupModal({ visible, onClose, onSuccess }: CreateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function handleClose() {
    setName('');
    setDescription('');
    setIsPublic(true);
    setError(null);
    onClose();
  }

  async function handleCreate() {
    if (!name.trim()) {
      setError('Le nom du groupe est requis.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        isPublic,
      });
      handleClose();
      onSuccess();
    } catch {
      setError('Impossible de créer le groupe. Réessaie.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Créer un groupe</Text>
            <TouchableOpacity onPress={handleClose} hitSlop={8}>
              <Ionicons name="close" size={22} color="#EFBF04" />
            </TouchableOpacity>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Nom du groupe"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={name}
            onChangeText={(v) => {
              setName(v);
              setError(null);
            }}
            autoCapitalize="sentences"
            autoCorrect={false}
          />

          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Description (optionnel)"
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
            textAlignVertical="top"
          />

          <View style={styles.toggleRow}>
            <View>
              <Text style={styles.toggleLabel}>Groupe public</Text>
              <Text style={styles.toggleSub}>
                {isPublic
                  ? 'Visible et ouvert à tous'
                  : 'Sur invitation uniquement'}
              </Text>
            </View>
            <Switch
              value={isPublic}
              onValueChange={setIsPublic}
              trackColor={{ false: 'rgba(255,255,255,0.12)', true: '#EFBF04' }}
              thumbColor="#fafafa"
            />
          </View>

          {error ? <Text style={styles.inputError}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.btn, styles.btnGold, loading && styles.btnDisabled]}
            activeOpacity={0.8}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#EFBF04" />
            ) : (
              <Text style={[styles.btnText, styles.btnTextDark]}>Créer</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Discover card with join request ─────────────────────────────────────────

interface DiscoverCardProps {
  group: Group;
  onRequestSent: (groupId: string) => void;
}

function DiscoverCard({ group, onRequestSent }: DiscoverCardProps) {
  const [state, setState] = useState<'idle' | 'loading' | 'sent'>('idle');
  const toast = useToast();

  async function handleRequest() {
    if (state !== 'idle') return;
    hapticImpact().catch(() => undefined);
    setState('loading');
    try {
      await requestJoinGroup(group._id);
      setState('sent');
      onRequestSent(group._id);
    } catch {
      setState('idle');
      toast.error('Une erreur est survenue. Réessaie.');
    }
  }

  const action = (
    <TouchableOpacity
      style={[
        styles.btn,
        state === 'idle' ? styles.btnGhost : styles.btnMuted,
        styles.btnSm,
      ]}
      activeOpacity={0.7}
      onPress={handleRequest}
      disabled={state !== 'idle'}
    >
      {state === 'loading' ? (
        <ActivityIndicator size="small" color="#EFBF04" />
      ) : (
        <Text style={[styles.btnText, styles.btnTextMuted]}>
          {state === 'sent' ? 'Demande envoyée' : 'Demander à rejoindre'}
        </Text>
      )}
    </TouchableOpacity>
  );

  return <GroupCard group={group} action={action} />;
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GroupsScreen({ onGroupPress }: GroupsScreenProps) {
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [discovered, setDiscovered] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  const [joinModalVisible, setJoinModalVisible] = useState(false);
  const [createModalVisible, setCreateModalVisible] = useState(false);

  const loadData = useCallback(() => {
    setLoading(true);
    Promise.all([getMyGroups(), discoverGroups()])
      .then(([mine, discover]) => {
        setMyGroups(mine);
        setDiscovered(discover);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleRequestSent(groupId: string) {
    setDiscovered((prev) => prev.filter((g) => g._id !== groupId));
  }

  return (
    <View style={styles.container}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <TouchableOpacity
          style={[styles.btn, styles.btnGhost, styles.btnSm]}
          activeOpacity={0.7}
          onPress={() => setJoinModalVisible(true)}
        >
          <Ionicons name="key-outline" size={14} color="#EFBF04" style={{ marginRight: 6 }} />
          <Text style={[styles.btnText, styles.btnTextMuted]}>Rejoindre par code</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.btnGold, styles.btnSm]}
          activeOpacity={0.8}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add" size={15} color="#EFBF04" style={{ marginRight: 4 }} />
          <Text style={[styles.btnText, styles.btnTextDark]}>Créer un groupe</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {loading ? (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <SectionHeader label="Mes groupes" />
          {[0, 1].map((i) => <SkeletonCard key={i} />)}
          <SectionHeader label="Découvrir" />
          {[0, 1, 2].map((i) => <SkeletonCard key={i + 10} />)}
        </ScrollView>
      ) : (
        <FlatList
          data={[]}
          keyExtractor={(_, index) => index.toString()}
          renderItem={null}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <>
              {/* Mes groupes */}
              <FadeIn>
                <SectionHeader label={`Mes groupes (${myGroups.length})`} />
                {myGroups.length === 0 ? (
                  <EmptyState
                    icon="🏷️"
                    title="Pas encore de groupe"
                    description="Crée ou rejoins un groupe pour t'entraîner avec d'autres"
                    compact
                  />
                ) : (
                  myGroups.map((group) => (
                    <GroupCard
                      key={group._id}
                      group={group}
                      onPress={() => onGroupPress?.(group._id)}
                    />
                  ))
                )}
              </FadeIn>

              {/* Découvrir */}
              {discovered.length > 0 ? (
                <FadeIn delay={80}>
                  <SectionHeader label="Découvrir" />
                  {discovered.map((group) => (
                    <DiscoverCard
                      key={group._id}
                      group={group}
                      onRequestSent={handleRequestSent}
                    />
                  ))}
                </FadeIn>
              ) : null}
            </>
          }
        />
      )}

      {/* Modals */}
      <JoinByCodeModal
        visible={joinModalVisible}
        onClose={() => setJoinModalVisible(false)}
        onSuccess={loadData}
      />
      <CreateGroupModal
        visible={createModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onSuccess={loadData}
      />
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
  // Header
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 20,
  },
  // Scroll
  scrollContent: {
    paddingBottom: 32,
  },
  // Section header
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
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    marginBottom: 12,
  },
  cardName: {
    fontFamily: 'Quilon-Medium',
    fontSize: 16,
    color: '#fafafa',
    marginBottom: 4,
  },
  cardDesc: {
    fontFamily: 'Rowan-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
    lineHeight: 18,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardMetaText: {
    fontFamily: 'Rowan-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
  cardAction: {
    marginTop: 12,
  },
  // Badge
  badge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgePublic: {
    backgroundColor: 'rgba(239, 191, 4, 0.15)',
  },
  badgePrivate: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  badgeText: {
    fontFamily: 'Rowan-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.5)',
  },
  // Buttons
  btn: {
    flexDirection: 'row',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSm: {
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  btnGold: {
    backgroundColor: '#EFBF04',
  },
  btnMuted: {
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  btnGhost: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  btnDisabled: {
    opacity: 0.5,
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
  // Modal overlay + sheet
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 14,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  sheetTitle: {
    fontFamily: 'Quilon-Medium',
    fontSize: 17,
    color: '#fafafa',
  },
  // Inputs
  input: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fafafa',
    fontFamily: 'Rowan-Regular',
    fontSize: 15,
  },
  inputMultiline: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  inputError: {
    fontFamily: 'Rowan-Regular',
    fontSize: 12,
    color: '#ef4444',
    marginTop: -6,
  },
  // Toggle row
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  toggleLabel: {
    fontFamily: 'Quilon-Medium',
    fontSize: 14,
    color: '#fafafa',
    marginBottom: 2,
  },
  toggleSub: {
    fontFamily: 'Rowan-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
  },
});
