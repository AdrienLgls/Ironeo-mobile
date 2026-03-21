import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import api from '../../services/api';
import { formatChatTimestamp } from '../../utils/formatters';
import {
  deleteMessage,
  getMessages,
  reactToMessage,
  sendMessage,
} from '../../services/groupService';
import type { ChatMessage } from '../../services/groupService';
import type { UserProfile } from '../../types/user';

// ─── Constants ────────────────────────────────────────────────────────────────

const REACTION_EMOJIS = ['👍', '💪', '🔥', '👏', '❤️'];
const POLL_INTERVAL_MS = 30_000;

// ─── ReplyBar ─────────────────────────────────────────────────────────────────

interface ReplyBarProps {
  userName: string;
  text: string;
  onCancel: () => void;
}

function ReplyBar({ userName, text, onCancel }: ReplyBarProps) {
  return (
    <View style={styles.replyBar}>
      <View style={styles.replyBorder} />
      <Text style={styles.replyText} numberOfLines={1}>
        <Text style={styles.replyName}>Répondre à {userName} : </Text>
        {text}
      </Text>
      <TouchableOpacity onPress={onCancel} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.replyCancel}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

// ─── ReactionPicker ───────────────────────────────────────────────────────────

interface ReactionPickerProps {
  visible: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

function ReactionPicker({ visible, onSelect, onClose }: ReactionPickerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity style={styles.pickerBackdrop} activeOpacity={1} onPress={onClose}>
        <View style={styles.pickerContainer}>
          {REACTION_EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => onSelect(emoji)}
              style={styles.pickerEmoji}
              activeOpacity={0.7}
            >
              <Text style={styles.pickerEmojiText}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

// ─── MessageBubble ────────────────────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
  isOwn: boolean;
  onLongPress: (message: ChatMessage) => void;
  onReactionPress: (message: ChatMessage) => void;
}

function MessageBubble({ message, isOwn, onLongPress, onReactionPress }: MessageBubbleProps) {
  return (
    <View style={[styles.bubbleWrapper, isOwn ? styles.bubbleWrapperOwn : styles.bubbleWrapperOther]}>
      {!isOwn && (
        <Text style={styles.senderName}>{message.user.pseudo}</Text>
      )}

      <TouchableOpacity
        activeOpacity={0.85}
        onLongPress={() => onLongPress(message)}
        onPress={() => onReactionPress(message)}
        style={[
          styles.bubble,
          isOwn ? styles.bubbleOwn : styles.bubbleOther,
        ]}
      >
        {message.replyTo && (
          <View style={styles.replyPreview}>
            <Text style={styles.replyPreviewName} numberOfLines={1}>
              {message.replyTo.userName}
            </Text>
            <Text style={styles.replyPreviewText} numberOfLines={1}>
              {message.replyTo.text}
            </Text>
          </View>
        )}
        <Text style={styles.bubbleText}>{message.text}</Text>
      </TouchableOpacity>

      <Text style={[styles.timestamp, isOwn ? styles.timestampOwn : styles.timestampOther]}>
        {formatChatTimestamp(message.createdAt)}
      </Text>

      {message.reactions && message.reactions.length > 0 && (
        <View style={[styles.reactionsRow, isOwn ? styles.reactionsRowOwn : styles.reactionsRowOther]}>
          {message.reactions.map((r) => (
            <View key={r.emoji} style={styles.reactionPill}>
              <Text style={styles.reactionPillText}>{r.emoji} {r.users.length}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── GroupChatTab ──────────────────────────────────────────────────────────────

interface Props {
  groupId: string;
}

export default function GroupChatTab({ groupId }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [pickerTarget, setPickerTarget] = useState<ChatMessage | null>(null);

  const flatListRef = useRef<FlatList<ChatMessage>>(null);

  const loadMessages = useCallback(async () => {
    try {
      const data = await getMessages(groupId);
      const sorted = [...data].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
      setMessages(sorted);
    } catch {
      // silent on poll failure
    }
  }, [groupId]);

  // Keep ref in sync so the polling interval always calls the latest version
  const loadMessagesRef = useRef(loadMessages);
  useEffect(() => {
    loadMessagesRef.current = loadMessages;
  }, [loadMessages]);

  // Load current user once
  useEffect(() => {
    api
      .get<UserProfile>('/users/me')
      .then(({ data }) => setCurrentUserId(data.id))
      .catch(() => undefined);
  }, []);

  // Initial load + polling — interval created once, never recreated
  useEffect(() => {
    loadMessagesRef.current();
    const interval = setInterval(() => loadMessagesRef.current(), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll when messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages.length]);

  async function handleSend() {
    const text = inputText.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const sent = await sendMessage(groupId, text, replyTo?._id);
      setInputText('');
      setReplyTo(null);
      setMessages((prev) => {
        const next = [...prev, sent];
        return next.sort(
          (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
      });
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch {
      Alert.alert('Erreur', 'Impossible d\'envoyer le message.');
    } finally {
      setSending(false);
    }
  }

  function handleLongPress(message: ChatMessage) {
    if (message.user._id !== currentUserId) return;
    Alert.alert('Message', undefined, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteMessage(groupId, message._id);
            setMessages((prev) => prev.filter((m) => m._id !== message._id));
          } catch {
            Alert.alert('Erreur', 'Impossible de supprimer ce message.');
          }
        },
      },
    ]);
  }

  function handleReactionPress(message: ChatMessage) {
    setPickerTarget(message);
  }

  async function handleSelectReaction(emoji: string) {
    const target = pickerTarget;
    setPickerTarget(null);
    if (!target) return;
    try {
      await reactToMessage(groupId, target._id, emoji);
      await loadMessages();
    } catch {
      // silent
    }
  }

  function handleReply(message: ChatMessage) {
    setReplyTo(message);
  }

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const isOwn = item.user._id === currentUserId;
      return (
        <MessageBubble
          message={item}
          isOwn={isOwn}
          onLongPress={handleLongPress}
          onReactionPress={handleReactionPress}
        />
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentUserId],
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={90}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onScrollToIndexFailed={() => undefined}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Aucun message. Soyez le premier !</Text>
          </View>
        }
      />

      {replyTo && (
        <ReplyBar
          userName={replyTo.user.pseudo}
          text={replyTo.text}
          onCancel={() => setReplyTo(null)}
        />
      )}

      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Message..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          multiline
          maxLength={500}
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
          activeOpacity={0.7}
          style={styles.sendButton}
        >
          <Text style={[styles.sendIcon, inputText.trim() ? styles.sendIconActive : styles.sendIconInactive]}>
            ➤
          </Text>
        </TouchableOpacity>
      </View>

      <ReactionPicker
        visible={pickerTarget !== null}
        onSelect={handleSelectReaction}
        onClose={() => setPickerTarget(null)}
      />
    </KeyboardAvoidingView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 12,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.3)',
    fontFamily: 'Rowan-Regular',
    fontSize: 14,
  },
  // ── Bubble ──
  bubbleWrapper: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  bubbleWrapperOwn: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  bubbleWrapperOther: {
    alignSelf: 'flex-start',
    alignItems: 'flex-start',
  },
  senderName: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Rowan-Regular',
    fontSize: 11,
    marginBottom: 3,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  bubbleOwn: {
    backgroundColor: 'rgba(239,191,4,0.15)',
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    color: '#fafafa',
    fontFamily: 'Rowan-Regular',
    fontSize: 14,
    lineHeight: 20,
  },
  timestamp: {
    fontSize: 10,
    fontFamily: 'Rowan-Regular',
    color: 'rgba(255,255,255,0.3)',
    marginTop: 3,
  },
  timestampOwn: {
    textAlign: 'right',
  },
  timestampOther: {
    textAlign: 'left',
  },
  // ── Reactions ──
  reactionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    marginTop: 4,
  },
  reactionsRowOwn: {
    justifyContent: 'flex-end',
  },
  reactionsRowOther: {
    justifyContent: 'flex-start',
  },
  reactionPill: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  reactionPillText: {
    fontSize: 12,
    color: '#fafafa',
  },
  // ── Reply preview inside bubble ──
  replyPreview: {
    borderLeftWidth: 2,
    borderLeftColor: '#EFBF04',
    paddingLeft: 8,
    marginBottom: 6,
  },
  replyPreviewName: {
    color: '#EFBF04',
    fontFamily: 'Quilon-Medium',
    fontSize: 11,
    marginBottom: 2,
  },
  replyPreviewText: {
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Rowan-Regular',
    fontSize: 12,
  },
  // ── Reply bar ──
  replyBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 10,
  },
  replyBorder: {
    width: 3,
    height: '100%',
    backgroundColor: '#EFBF04',
    borderRadius: 2,
    minHeight: 20,
  },
  replyText: {
    flex: 1,
    color: 'rgba(255,255,255,0.6)',
    fontFamily: 'Rowan-Regular',
    fontSize: 13,
  },
  replyName: {
    color: '#EFBF04',
    fontFamily: 'Quilon-Medium',
  },
  replyCancel: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 14,
  },
  // ── Input ──
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 10,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fafafa',
    fontFamily: 'Rowan-Regular',
    fontSize: 14,
    maxHeight: 120,
  },
  sendButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendIcon: {
    fontSize: 20,
  },
  sendIconActive: {
    color: '#EFBF04',
  },
  sendIconInactive: {
    color: 'rgba(255,255,255,0.2)',
  },
  // ── Reaction picker ──
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerContainer: {
    flexDirection: 'row',
    backgroundColor: '#1e1e1e',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 16,
  },
  pickerEmoji: {
    padding: 4,
  },
  pickerEmojiText: {
    fontSize: 28,
  },
});
