import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import EmptyState from '../components/ui/EmptyState';
import { FadeIn } from '../components/ui/FadeIn';
import {
  deletePhoto,
  getCompare,
  getPhotos,
  uploadPhoto,
  type PhotoCompare,
  type ProgressPhoto,
} from '../services/progressPhotoService';

const SCREEN_WIDTH = Dimensions.get('window').width;
const CELL_SIZE = (SCREEN_WIDTH - 32 - 4) / 3; // 16px side padding, 2px gaps

type Category = 'all' | 'front' | 'back' | 'side' | 'other';
type Mode = 'gallery' | 'compare';

const CATEGORIES: { label: string; value: Category }[] = [
  { label: 'Tous', value: 'all' },
  { label: 'Front', value: 'front' },
  { label: 'Back', value: 'back' },
  { label: 'Side', value: 'side' },
  { label: 'Other', value: 'other' },
];

const UPLOAD_CATEGORIES: { label: string; value: Exclude<Category, 'all'> }[] = [
  { label: 'Front', value: 'front' },
  { label: 'Back', value: 'back' },
  { label: 'Side', value: 'side' },
  { label: 'Other', value: 'other' },
];

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-CA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function categoryLabel(cat: ProgressPhoto['category']): string {
  const map: Record<ProgressPhoto['category'], string> = {
    front: 'Front',
    back: 'Back',
    side: 'Side',
    other: 'Autre',
  };
  return map[cat];
}

// ─── Grid Cell ───────────────────────────────────────────────────────────────

interface GridCellProps {
  photo: ProgressPhoto;
  onPress: () => void;
}

function GridCell({ photo, onPress }: GridCellProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.cell, { width: CELL_SIZE, height: CELL_SIZE }]}
    >
      <Image source={{ uri: photo.url }} style={styles.cellImage} resizeMode="cover" />
      <View style={styles.cellOverlay}>
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryBadgeText}>{categoryLabel(photo.category)}</Text>
        </View>
        <Text style={styles.cellDate}>{formatDate(photo.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

interface LightboxProps {
  photos: ProgressPhoto[];
  index: number;
  onClose: () => void;
  onDelete: (id: string) => void;
  onIndexChange: (index: number) => void;
}

function Lightbox({ photos, index, onClose, onDelete, onIndexChange }: LightboxProps) {
  const photo = photos[index];
  if (!photo) return null;

  function handleDelete() {
    Alert.alert('Supprimer', 'Supprimer cette photo ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => onDelete(photo._id),
      },
    ]);
  }

  return (
    <Modal visible animationType="fade" transparent onRequestClose={onClose}>
      <View style={styles.lightboxBg}>
        {/* Header */}
        <View style={styles.lightboxHeader}>
          <TouchableOpacity onPress={onClose} style={styles.lightboxClose}>
            <Ionicons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.lightboxMeta}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>{categoryLabel(photo.category)}</Text>
            </View>
            <Text style={styles.lightboxDate}>{formatDate(photo.createdAt)}</Text>
          </View>
          <TouchableOpacity onPress={handleDelete} style={styles.lightboxDelete}>
            <Ionicons name="trash-outline" size={22} color="#ef4444" />
          </TouchableOpacity>
        </View>

        {/* Image */}
        <Image
          source={{ uri: photo.url }}
          style={styles.lightboxImage}
          resizeMode="contain"
        />

        {/* Weight pill */}
        {photo.weight != null && (
          <View style={styles.weightPill}>
            <Text style={styles.weightPillText}>{photo.weight} kg</Text>
          </View>
        )}

        {/* Navigation arrows */}
        <View style={styles.lightboxNav}>
          <TouchableOpacity
            style={[styles.navArrow, index === 0 && styles.navArrowDisabled]}
            onPress={() => index > 0 && onIndexChange(index - 1)}
            disabled={index === 0}
          >
            <Ionicons name="chevron-back" size={28} color={index === 0 ? 'rgba(255,255,255,0.2)' : '#fff'} />
          </TouchableOpacity>
          <Text style={styles.lightboxCount}>{index + 1} / {photos.length}</Text>
          <TouchableOpacity
            style={[styles.navArrow, index === photos.length - 1 && styles.navArrowDisabled]}
            onPress={() => index < photos.length - 1 && onIndexChange(index + 1)}
            disabled={index === photos.length - 1}
          >
            <Ionicons name="chevron-forward" size={28} color={index === photos.length - 1 ? 'rgba(255,255,255,0.2)' : '#fff'} />
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────────────────

interface UploadModalProps {
  imageUri: string;
  onCancel: () => void;
  onSave: (category: Exclude<Category, 'all'>, weight?: number, notes?: string) => void;
  saving: boolean;
}

function UploadModal({ imageUri, onCancel, onSave, saving }: UploadModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<Exclude<Category, 'all'>>('front');
  const [weightText, setWeightText] = useState('');
  const [notes, setNotes] = useState('');

  function handleSave() {
    const weight = weightText.trim() ? parseFloat(weightText) : undefined;
    onSave(selectedCategory, weight, notes.trim() || undefined);
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onCancel}>
      <View style={styles.uploadOverlay}>
        <View style={styles.uploadSheet}>
          <Text style={styles.uploadTitle}>Nouvelle photo</Text>

          <Image source={{ uri: imageUri }} style={styles.uploadPreview} resizeMode="cover" />

          <Text style={styles.uploadLabel}>Catégorie</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
            {UPLOAD_CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.value}
                onPress={() => setSelectedCategory(c.value)}
                style={[styles.pill, selectedCategory === c.value && styles.pillActive]}
              >
                <Text style={[styles.pillText, selectedCategory === c.value && styles.pillTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <Text style={styles.uploadLabel}>Poids (kg, optionnel)</Text>
          <TextInput
            value={weightText}
            onChangeText={setWeightText}
            placeholder="ex: 82.5"
            placeholderTextColor="rgba(255,255,255,0.2)"
            keyboardType="decimal-pad"
            style={styles.uploadInput}
          />

          <Text style={styles.uploadLabel}>Notes (optionnel)</Text>
          <TextInput
            value={notes}
            onChangeText={setNotes}
            placeholder="Commentaires..."
            placeholderTextColor="rgba(255,255,255,0.2)"
            style={[styles.uploadInput, { height: 72, textAlignVertical: 'top' }]}
            multiline
          />

          <View style={styles.uploadActions}>
            <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
              <Text style={styles.cancelBtnText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn} disabled={saving}>
              {saving ? (
                <ActivityIndicator color="#000" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Enregistrer</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ─── Before/After Mode ────────────────────────────────────────────────────────

interface BeforeAfterProps {
  category: Category;
}

function BeforeAfterView({ category }: BeforeAfterProps) {
  const [compare, setCompare] = useState<PhotoCompare | null>(null);
  const [loading, setLoading] = useState(true);
  const effectiveCategory = category === 'all' ? 'front' : category;

  useEffect(() => {
    setLoading(true);
    getCompare(effectiveCategory)
      .then(setCompare)
      .finally(() => setLoading(false));
  }, [effectiveCategory]);

  if (loading) {
    return <ActivityIndicator color="#EFBF04" style={{ marginTop: 40 }} />;
  }

  if (!compare?.first || !compare?.latest) {
    return (
      <EmptyState
        icon="📷"
        title="Pas assez de photos"
        description="Ajoutez au moins 2 photos dans cette catégorie pour voir la comparaison."
      />
    );
  }

  const deltaSign = compare.weightDelta != null && compare.weightDelta < 0 ? '−' : '+';
  const deltaAbs = compare.weightDelta != null ? Math.abs(compare.weightDelta).toFixed(1) : null;
  const deltaColor = compare.weightDelta != null && compare.weightDelta <= 0 ? '#22c55e' : '#ef4444';

  return (
    <FadeIn>
      {deltaAbs != null && (
        <View style={[styles.deltaChip, { borderColor: deltaColor }]}>
          <Text style={[styles.deltaChipText, { color: deltaColor }]}>
            {deltaSign}{deltaAbs} kg
          </Text>
        </View>
      )}
      <View style={styles.compareRow}>
        <View style={styles.compareCard}>
          <Text style={styles.compareLabel}>Avant</Text>
          <Text style={styles.compareDate}>{formatDate(compare.first.createdAt)}</Text>
          <Image source={{ uri: compare.first.url }} style={styles.compareImage} resizeMode="cover" />
        </View>
        <View style={styles.compareCard}>
          <Text style={styles.compareLabel}>Après</Text>
          <Text style={styles.compareDate}>{formatDate(compare.latest.createdAt)}</Text>
          <Image source={{ uri: compare.latest.url }} style={styles.compareImage} resizeMode="cover" />
        </View>
      </View>
    </FadeIn>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

interface ProgressPhotosScreenProps {
  navigation: { goBack: () => void };
}

export default function ProgressPhotosScreen({ navigation }: ProgressPhotosScreenProps) {
  const insets = useSafeAreaInsets();
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [mode, setMode] = useState<Mode>('gallery');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [uploadUri, setUploadUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const cat = activeCategory === 'all' ? undefined : activeCategory;
      const data = await getPhotos(cat);
      setPhotos(data);
    } catch {
      Alert.alert('Erreur', 'Impossible de charger les photos.');
    } finally {
      setLoading(false);
    }
  }, [activeCategory]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handlePickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission requise', "Autorisez l'accès à la galerie pour importer une photo.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: 'images' as ImagePicker.MediaType,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setUploadUri(result.assets[0].uri);
    }
  }

  async function handleUploadSave(
    category: Exclude<Category, 'all'>,
    weight?: number,
    notes?: string,
  ) {
    if (!uploadUri) return;
    setUploading(true);
    try {
      await uploadPhoto(uploadUri, category, weight, notes);
      setUploadUri(null);
      await load();
    } catch {
      Alert.alert('Erreur', "Impossible d'envoyer la photo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePhoto(id);
      setLightboxIndex(null);
      await load();
    } catch {
      Alert.alert('Erreur', 'Impossible de supprimer la photo.');
    }
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photos de progression</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Category pills */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pillRow}
        contentContainerStyle={styles.pillRowContent}
      >
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.value}
            onPress={() => setActiveCategory(c.value)}
            style={[styles.pill, activeCategory === c.value && styles.pillActive]}
          >
            <Text style={[styles.pillText, activeCategory === c.value && styles.pillTextActive]}>
              {c.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Mode toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          onPress={() => setMode('gallery')}
          style={[styles.modeBtn, mode === 'gallery' && styles.modeBtnActive]}
        >
          <Text style={[styles.modeBtnText, mode === 'gallery' && styles.modeBtnTextActive]}>
            Galerie
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setMode('compare')}
          style={[styles.modeBtn, mode === 'compare' && styles.modeBtnActive]}
        >
          <Text style={[styles.modeBtnText, mode === 'compare' && styles.modeBtnTextActive]}>
            Avant/Après
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {mode === 'gallery' ? (
        loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color="#EFBF04" size="large" />
          </View>
        ) : photos.length === 0 ? (
          <View style={styles.centered}>
            <EmptyState
              icon="📷"
              title="Aucune photo"
              description="Prenez des photos pour suivre votre progression."
            />
          </View>
        ) : (
          <FlatList
            data={photos}
            keyExtractor={(item) => item._id}
            numColumns={3}
            contentContainerStyle={styles.grid}
            columnWrapperStyle={styles.gridRow}
            renderItem={({ item, index }) => (
              <GridCell photo={item} onPress={() => setLightboxIndex(index)} />
            )}
          />
        )
      ) : (
        <ScrollView contentContainerStyle={styles.compareContainer}>
          <BeforeAfterView category={activeCategory} />
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        onPress={handlePickImage}
        style={[styles.fab, { bottom: insets.bottom + 24 }]}
        activeOpacity={0.85}
      >
        <Ionicons name="camera" size={26} color="#000" />
      </TouchableOpacity>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          index={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={handleDelete}
          onIndexChange={setLightboxIndex}
        />
      )}

      {/* Upload modal */}
      {uploadUri !== null && (
        <UploadModal
          imageUri={uploadUri}
          onCancel={() => setUploadUri(null)}
          onSave={handleUploadSave}
          saving={uploading}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Quilon-Medium',
    fontSize: 22,
    color: '#fafafa',
  },
  headerSpacer: {
    width: 32,
  },
  pillRow: {
    flexGrow: 0,
  },
  pillRowContent: {
    paddingHorizontal: 16,
    gap: 8,
    paddingBottom: 12,
  },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  pillActive: {
    backgroundColor: '#EFBF04',
  },
  pillText: {
    fontFamily: 'Rowan-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  pillTextActive: {
    color: '#000',
    fontFamily: 'Quilon-Medium',
  },
  modeToggle: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    padding: 3,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 10,
  },
  modeBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  modeBtnText: {
    fontFamily: 'Rowan-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  modeBtnTextActive: {
    color: '#fafafa',
    fontFamily: 'Quilon-Medium',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  grid: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  gridRow: {
    gap: 2,
    marginBottom: 2,
  },
  cell: {
    position: 'relative',
    overflow: 'hidden',
    borderRadius: 6,
  },
  cellImage: {
    width: '100%',
    height: '100%',
  },
  cellOverlay: {
    ...StyleSheet.absoluteFillObject,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    paddingBottom: 4,
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  categoryBadge: {
    backgroundColor: 'rgba(239,191,4,0.85)',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 9,
    fontFamily: 'Quilon-Medium',
    color: '#000',
  },
  cellDate: {
    fontSize: 9,
    fontFamily: 'Rowan-Regular',
    color: 'rgba(255,255,255,0.8)',
  },
  // Lightbox
  lightboxBg: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  lightboxHeader: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  lightboxClose: {
    padding: 8,
  },
  lightboxMeta: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
  },
  lightboxDate: {
    fontFamily: 'Rowan-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
  },
  lightboxDelete: {
    padding: 8,
  },
  lightboxImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
    alignSelf: 'center',
  },
  weightPill: {
    alignSelf: 'center',
    marginTop: 12,
    backgroundColor: 'rgba(239,191,4,0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#EFBF04',
  },
  weightPillText: {
    fontFamily: 'Quilon-Medium',
    fontSize: 14,
    color: '#EFBF04',
  },
  lightboxNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 24,
  },
  navArrow: {
    padding: 12,
  },
  navArrowDisabled: {
    opacity: 0.3,
  },
  lightboxCount: {
    fontFamily: 'Rowan-Regular',
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  // Upload modal
  uploadOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  uploadSheet: {
    backgroundColor: '#1a1a1a',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  uploadTitle: {
    fontFamily: 'Quilon-Medium',
    fontSize: 18,
    color: '#fafafa',
    marginBottom: 16,
    textAlign: 'center',
  },
  uploadPreview: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    marginBottom: 16,
  },
  uploadLabel: {
    fontFamily: 'Rowan-Regular',
    fontSize: 12,
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  uploadInput: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#fafafa',
    fontFamily: 'Rowan-Regular',
    fontSize: 14,
    marginBottom: 14,
  },
  uploadActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  cancelBtnText: {
    fontFamily: 'Rowan-Regular',
    fontSize: 15,
    color: 'rgba(255,255,255,0.6)',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 14,
    backgroundColor: '#EFBF04',
  },
  saveBtnText: {
    fontFamily: 'Quilon-Medium',
    fontSize: 15,
    color: '#000',
  },
  // Before/After
  compareContainer: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  deltaChip: {
    alignSelf: 'center',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginBottom: 16,
  },
  deltaChipText: {
    fontFamily: 'Quilon-Medium',
    fontSize: 14,
  },
  compareRow: {
    flexDirection: 'row',
    gap: 12,
  },
  compareCard: {
    flex: 1,
    alignItems: 'center',
  },
  compareLabel: {
    fontFamily: 'Quilon-Medium',
    fontSize: 14,
    color: '#fafafa',
    marginBottom: 2,
  },
  compareDate: {
    fontFamily: 'Rowan-Regular',
    fontSize: 11,
    color: 'rgba(255,255,255,0.4)',
    marginBottom: 8,
  },
  compareImage: {
    width: '100%',
    aspectRatio: 0.75,
    borderRadius: 10,
  },
  // FAB
  fab: {
    position: 'absolute',
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EFBF04',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#EFBF04',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
});
