import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import RenderHtml from 'react-native-render-html';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getArticles, getArticleById, getQuizById, getInProgressArticles, getMasteredArticles, getLearnStats, searchArticles, getFavorites, toggleFavorite, submitQuiz } from '../services/learnService';
import type { InProgressArticle, MasteredArticle, QuizSubmitResult } from '../services/learnService';
import { getParcours } from '../services/parcoursService';
import { getDueReviews } from '../services/userService';
import type { DueReview } from '../services/userService';
import ArticleCard from '../components/learn/ArticleCard';
import EmptyState from '../components/ui/EmptyState';
import ParcoursListTab from '../components/learn/ParcoursListTab';
import ParcoursDetailScreen from './ParcoursDetailScreen';
import HubTabNavigation from '../components/ui/HubTabNavigation';
import type { Article, Quiz, QuizQuestion, Parcours } from '../types/learn';
import { formatDate } from '../utils/formatters';

export type LearnStackParamList = {
  ArticlesList: undefined;
  ArticleDetail: { articleId: string };
  Quiz: { quizId: string; articleId: string };
  ParcoursDetail: { parcoursSlug: string; parcoursTitle: string };
};

const Stack = createNativeStackNavigator<LearnStackParamList>();

const CATEGORIES = ['Tous', 'Technique', 'Nutrition', 'Mentalité', 'Anatomie', 'Favoris'] as const;

const HUB_TABS = [
  { id: 'articles', label: 'Articles' },
  { id: 'parcours', label: 'Parcours' },
  { id: 'progression', label: 'Progression' },
];

function CategoryBadge({ category }: { category?: string }) {
  if (!category) return null;
  return (
    <View style={{ backgroundColor: 'rgba(239,191,4,0.15)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 }}>
      <Text style={{ color: '#EFBF04', fontSize: 11, fontFamily: 'Rowan-Regular', textTransform: 'capitalize' }}>
        {category}
      </Text>
    </View>
  );
}

interface ProgressionTabProps {
  dueReviews: DueReview[];
  inProgress: InProgressArticle[];
  mastered: MasteredArticle[];
  stats: { totalRead: number; avgScore: number; streak: number } | null;
  onNavigate: (articleId: string) => void;
}

function ArticleProgressBar({ percent }: { percent: number }) {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: percent,
      duration: 800,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      useNativeDriver: false,
    }).start();
  }, [widthAnim, percent]);

  return (
    <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 10 }}>
      <Animated.View
        style={{
          height: 3,
          width: widthAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }),
          backgroundColor: '#EFBF04',
          borderRadius: 2,
        }}
      />
    </View>
  );
}

function ProgressionTab({ dueReviews, inProgress, mastered, stats, onNavigate }: ProgressionTabProps) {
  return (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 32 }}>
      {/* Stats banner */}
      {stats !== null && (
        <View style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          backgroundColor: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          padding: 14,
          marginBottom: 20,
        }}>
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#fafafa', fontFamily: 'Quilon-Medium', fontSize: 16 }}>{stats.totalRead}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Rowan-Regular', fontSize: 11, marginTop: 2 }}>articles lus</Text>
          </View>
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#fafafa', fontFamily: 'Quilon-Medium', fontSize: 16 }}>{stats.avgScore}%</Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Rowan-Regular', fontSize: 11, marginTop: 2 }}>score moyen</Text>
          </View>
          <View style={{ width: 1, backgroundColor: 'rgba(255,255,255,0.08)' }} />
          <View style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: '#fafafa', fontFamily: 'Quilon-Medium', fontSize: 16 }}>{stats.streak}j</Text>
            <Text style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Rowan-Regular', fontSize: 11, marginTop: 2 }}>streak</Text>
          </View>
        </View>
      )}

      {/* Quiz à réviser */}
      {dueReviews.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#fafafa', fontFamily: 'Quilon-Medium', fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12, opacity: 0.7 }}>
            Quiz à réviser
          </Text>
          {dueReviews.map((review) => (
            <TouchableOpacity
              key={review._id}
              activeOpacity={0.75}
              onPress={() => onNavigate(review.articleId)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: '#fafafa', fontFamily: 'Quilon-Medium', fontSize: 14, marginBottom: 6 }}>
                📝 {review.title ?? review.articleId}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <Text style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Rowan-Regular', fontSize: 12 }}>
                  Dû : {formatDate(review.dueDate)}
                </Text>
                {review.slug !== undefined && <CategoryBadge category={review.slug} />}
              </View>
              <View style={{
                backgroundColor: '#EFBF04',
                borderRadius: 8,
                paddingHorizontal: 12,
                paddingVertical: 6,
                alignSelf: 'flex-start',
              }}>
                <Text style={{ color: '#000', fontFamily: 'Quilon-Medium', fontSize: 12 }}>Réviser →</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* En cours */}
      {inProgress.length > 0 && (
        <View style={{ marginBottom: 24 }}>
          <Text style={{ color: '#fafafa', fontFamily: 'Quilon-Medium', fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12, opacity: 0.7 }}>
            En cours
          </Text>
          {inProgress.map((article) => (
            <TouchableOpacity
              key={article._id}
              activeOpacity={0.75}
              onPress={() => onNavigate(article._id)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: '#fafafa', fontFamily: 'Quilon-Medium', fontSize: 14, marginBottom: 6 }}>
                📖 {article.title}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <CategoryBadge category={article.category} />
              </View>
              {article.progressPercent !== undefined && (
                <ArticleProgressBar percent={article.progressPercent} />
              )}
              <Text style={{ color: 'rgba(255,255,255,0.35)', fontFamily: 'Rowan-Regular', fontSize: 12 }}>Continuer →</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Maîtrisés */}
      <View style={{ marginBottom: 8 }}>
        <Text style={{ color: '#fafafa', fontFamily: 'Quilon-Medium', fontSize: 13, letterSpacing: 0.5, textTransform: 'uppercase', marginBottom: 12, opacity: 0.7 }}>
          Maîtrisés
        </Text>
        {mastered.length === 0 ? (
          <Text style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Rowan-Regular', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
            Aucun article maîtrisé pour l'instant
          </Text>
        ) : (
          mastered.map((article) => (
            <TouchableOpacity
              key={article._id}
              activeOpacity={0.75}
              onPress={() => onNavigate(article._id)}
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
              }}
            >
              <Text style={{ color: 'rgba(255,255,255,0.45)', fontFamily: 'Quilon-Medium', fontSize: 14, marginBottom: 4 }}>
                ✓ {article.title}
              </Text>
              <Text style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'Rowan-Regular', fontSize: 12 }}>
                Maîtrisé : {formatDate(article.masteredAt)}
                {article.bestScore !== undefined ? `  ·  Score : ${article.bestScore}%` : ''}
              </Text>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function ArticlesListScreen({
  navigation,
}: NativeStackScreenProps<LearnStackParamList, 'ArticlesList'>) {
  const insets = useSafeAreaInsets();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filtered, setFiltered] = useState<Article[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('articles');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [dueReviews, setDueReviews] = useState<DueReview[]>([]);
  const [inProgress, setInProgress] = useState<InProgressArticle[]>([]);
  const [mastered, setMastered] = useState<MasteredArticle[]>([]);
  const [learnStats, setLearnStats] = useState<{ totalRead: number; avgScore: number; streak: number } | null>(null);
  const [parcoursList, setParcoursList] = useState<Parcours[]>([]);
  const [parcoursLoading, setParcoursLoading] = useState(false);

  useEffect(() => {
    Promise.allSettled([
      getArticles(),
      getDueReviews(),
      getInProgressArticles(),
      getMasteredArticles(),
      getLearnStats(),
    ])
      .then((results) => {
        const arts = results[0].status === 'fulfilled' ? results[0].value : [];
        const reviews = results[1].status === 'fulfilled' ? results[1].value : [];
        const inProg = results[2].status === 'fulfilled' ? results[2].value : [];
        const mast = results[3].status === 'fulfilled' ? results[3].value : [];
        const stats = results[4].status === 'fulfilled' ? results[4].value : null;
        setArticles(arts);
        setFiltered(arts);
        setDueReviews(reviews);
        setInProgress(inProg);
        setMastered(mast);
        setLearnStats(stats);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeTab !== 'parcours') return;
    if (parcoursList.length > 0) return;
    setParcoursLoading(true);
    getParcours()
      .then(setParcoursList)
      .catch(() => undefined)
      .finally(() => setParcoursLoading(false));
  }, [activeTab, parcoursList.length]);

  // Debounced search + category filter
  useEffect(() => {
    if (debounceRef.current !== null) {
      clearTimeout(debounceRef.current);
    }

    if (activeCategory === 'Favoris') {
      setSearchLoading(true);
      debounceRef.current = setTimeout(() => {
        getFavorites()
          .then((favs) => {
            const q = searchQuery.trim().toLowerCase();
            setFiltered(q ? favs.filter((a) => a.title.toLowerCase().includes(q)) : favs);
          })
          .catch(() => setFiltered([]))
          .finally(() => setSearchLoading(false));
      }, 300);
      return;
    }

    const q = searchQuery.trim();
    if (q || activeCategory !== 'Tous') {
      setSearchLoading(true);
      debounceRef.current = setTimeout(() => {
        searchArticles(q, activeCategory === 'Tous' ? undefined : activeCategory)
          .then(setFiltered)
          .catch(() => setFiltered([]))
          .finally(() => setSearchLoading(false));
      }, 300);
    } else {
      setFiltered(articles);
    }
  }, [searchQuery, activeCategory, articles]);

  function handleToggleFavorite(articleId: string) {
    // Optimistic update
    setFiltered((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, isFavorite: !a.isFavorite } : a)),
    );
    setArticles((prev) =>
      prev.map((a) => (a.id === articleId ? { ...a, isFavorite: !a.isFavorite } : a)),
    );
    toggleFavorite(articleId).catch(() => {
      // Revert on error
      setFiltered((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, isFavorite: !a.isFavorite } : a)),
      );
      setArticles((prev) =>
        prev.map((a) => (a.id === articleId ? { ...a, isFavorite: !a.isFavorite } : a)),
      );
    });
  }

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#EFBF04" size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header + tabs */}
      <View style={{ paddingTop: insets.top + 16, paddingHorizontal: 16 }}>
        <Text className="text-white text-h2 font-heading mb-4">Apprendre</Text>
        <HubTabNavigation tabs={HUB_TABS} activeTab={activeTab} onTabChange={setActiveTab} />
      </View>

      {activeTab === 'articles' ? (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Search bar */}
              <View style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.06)',
                borderRadius: 12,
                paddingHorizontal: 12,
                marginBottom: 12,
                height: 44,
              }}>
                <Ionicons name="search" size={18} color="rgba(255,255,255,0.4)" />
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Rechercher un article…"
                  placeholderTextColor="rgba(255,255,255,0.4)"
                  style={{
                    flex: 1,
                    marginLeft: 8,
                    color: '#fafafa',
                    fontFamily: 'Rowan-Regular',
                    fontSize: 14,
                  }}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery('')}>
                    <Ionicons name="close-circle" size={18} color="rgba(255,255,255,0.3)" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Category pills */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  {CATEGORIES.map((cat) => {
                    const isActive = activeCategory === cat;
                    return (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setActiveCategory(cat)}
                        activeOpacity={0.7}
                        style={{
                          paddingHorizontal: 14,
                          paddingVertical: 7,
                          borderRadius: 20,
                          backgroundColor: isActive ? '#EFBF04' : 'rgba(255,255,255,0.06)',
                        }}
                      >
                        <Text style={{
                          color: isActive ? '#000' : 'rgba(255,255,255,0.6)',
                          fontFamily: 'Rowan-Regular',
                          fontSize: 13,
                        }}>
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>
          }
          ListEmptyComponent={
            <View>
              {searchLoading ? (
                <ActivityIndicator color="#EFBF04" style={{ marginTop: 32 }} />
              ) : error !== null ? (
                <EmptyState type="error" title="Impossible de charger les articles" description={error} />
              ) : (
                <EmptyState title="Aucun article disponible" />
              )}
            </View>
          }
          renderItem={({ item }) => (
            <ArticleCard
              article={item}
              onPress={() => navigation.navigate('ArticleDetail', { articleId: item.id })}
              onToggleFavorite={handleToggleFavorite}
            />
          )}
        />
      ) : activeTab === 'parcours' ? (
        <ParcoursListTab
          parcours={parcoursList}
          loading={parcoursLoading}
          onPress={(p) => navigation.navigate('ParcoursDetail', { parcoursSlug: p.slug, parcoursTitle: p.title })}
        />
      ) : (
        <ProgressionTab
          dueReviews={dueReviews}
          inProgress={inProgress}
          mastered={mastered}
          stats={learnStats}
          onNavigate={(articleId) => navigation.navigate('ArticleDetail', { articleId })}
        />
      )}
    </View>
  );
}

const articleTagsStyles = {
  body: {
    color: '#fafafa',
    fontFamily: 'Rowan-Regular',
    fontSize: 15,
    lineHeight: 24,
  },
  h1: { fontFamily: 'Quilon-Medium', fontSize: 25, color: '#fafafa', marginTop: 16, marginBottom: 8 },
  h2: { fontFamily: 'Quilon-Medium', fontSize: 20, color: '#fafafa', marginTop: 14, marginBottom: 6 },
  h3: { fontFamily: 'Quilon-Medium', fontSize: 18, color: '#fafafa', marginTop: 12, marginBottom: 4 },
  p: { fontFamily: 'Rowan-Regular', fontSize: 15, color: '#e0e0e0', lineHeight: 24, marginBottom: 12 },
  code: { fontFamily: 'monospace', backgroundColor: 'rgba(255,255,255,0.08)', color: '#EFBF04', paddingHorizontal: 4, borderRadius: 4 },
  pre: { backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 8, padding: 12 },
  strong: { fontFamily: 'Quilon-Medium', color: '#fafafa' },
  ul: { color: '#e0e0e0' },
  li: { fontFamily: 'Rowan-Regular', fontSize: 15, lineHeight: 22, color: '#e0e0e0' },
  blockquote: { borderLeftWidth: 3, borderLeftColor: '#EFBF04', paddingLeft: 12, color: '#a0a0a0' },
} as const;

function ArticleDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<LearnStackParamList, 'ArticleDetail'>) {
  const { articleId } = route.params;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getArticleById(articleId)
      .then(setArticle)
      .catch(() => setError('Unable to load article'))
      .finally(() => setLoading(false));
  }, [articleId]);

  if (loading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#EFBF04" size="large" />
      </View>
    );
  }

  if (error !== null || !article) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <EmptyState type="error" title="Impossible de charger l'article" description={error ?? 'Article introuvable'} />
      </View>
    );
  }

  const htmlContent = article.content == null
    ? null
    : article.content.startsWith('<')
      ? article.content
      : `<p>${article.content.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`;

  return (
    <ScrollView className="flex-1 bg-background" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 32 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
        <Text className="text-accent text-body-sm font-body">← Retour</Text>
      </TouchableOpacity>

      <View className="flex-row items-center gap-3 mb-3">
        <View className="bg-accent/20 rounded-full px-2 py-0.5">
          <Text className="text-accent text-caption font-body capitalize">{article.category}</Text>
        </View>
        <Text className="text-white/30 text-caption font-body">{article.readTimeMinutes} min de lecture</Text>
      </View>

      <Text className="text-white text-h2 font-heading mb-6">{article.title}</Text>

      {htmlContent != null ? (
        <RenderHtml
          contentWidth={width - 32}
          source={{ html: htmlContent }}
          tagsStyles={articleTagsStyles}
          systemFonts={['Quilon-Medium', 'Rowan-Regular']}
        />
      ) : (
        <Text className="text-white/30 text-body-sm font-body italic">Contenu indisponible</Text>
      )}

      {article.quizId != null && (
        <TouchableOpacity
          onPress={() => navigation.navigate('Quiz', { quizId: article.quizId!, articleId })}
          style={{
            marginTop: 24,
            backgroundColor: '#EFBF04',
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#000', fontFamily: 'Quilon-Medium', fontSize: 15 }}>📝 Faire le quiz</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function QuizScreen({
  route,
  navigation,
}: NativeStackScreenProps<LearnStackParamList, 'Quiz'>) {
  const { quizId, articleId } = route.params;
  const insets = useSafeAreaInsets();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<QuizSubmitResult | null>(null);

  useEffect(() => {
    getQuizById(quizId)
      .then(setQuiz)
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [quizId]);

  if (loading || !quiz) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#EFBF04" size="large" />
      </View>
    );
  }

  const question: QuizQuestion = quiz.questions[currentIndex];
  const isLast = currentIndex === quiz.questions.length - 1;

  function handleNext() {
    if (selected === null) return;
    const newAnswers = [...answers, selected];
    if (!quiz) return;
    const currentQuiz: Quiz = quiz;

    if (isLast) {
      setAnswers(newAnswers);
      setSubmitting(true);
      submitQuiz(articleId, newAnswers.map((a) => ({ userAnswer: a })))
        .then(setResult)
        .catch(() => {
          // Fallback local si submit échoue
          const localScore = newAnswers.filter((a, i) => a === currentQuiz.questions[i].correctIndex).length;
          setResult({
            score: localScore,
            totalQuestions: currentQuiz.questions.length,
            percentage: Math.round((localScore / currentQuiz.questions.length) * 100),
            status: 'completed',
            bestScore: Math.round((localScore / currentQuiz.questions.length) * 100),
            nextReviewDue: new Date().toISOString(),
            nextReviewDays: 3,
            weakConcepts: [],
            feedback: { status: 'good', message: '', suggestions: [] },
            streak: 0,
            totalPoints: 0,
            pointsAwarded: 0,
            levelUp: null,
          });
        })
        .finally(() => setSubmitting(false));
    } else {
      setAnswers(newAnswers);
      setCurrentIndex((i) => i + 1);
      setSelected(null);
    }
  }

  if (submitting) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color="#EFBF04" size="large" />
        <Text style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'Rowan-Regular', fontSize: 14, marginTop: 12 }}>
          Calcul des résultats…
        </Text>
      </View>
    );
  }

  if (result !== null) {
    const isMastered = result.percentage >= 80;
    return (
      <ScrollView
        className="flex-1 bg-background"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingTop: insets.top + 16, paddingHorizontal: 16, paddingBottom: 40 }}
      >
        {/* Score */}
        <View style={{ alignItems: 'center', marginBottom: 32 }}>
          <Text style={{ color: '#EFBF04', fontFamily: 'Quilon-Medium', fontSize: 52, lineHeight: 60 }}>
            {result.score}/{result.totalQuestions}
          </Text>
          <Text style={{ color: '#EFBF04', fontFamily: 'Quilon-Medium', fontSize: 18, marginTop: 4 }}>
            {result.percentage}%
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Rowan-Regular', fontSize: 14, marginTop: 8, textAlign: 'center' }}>
            {result.feedback.message !== '' ? result.feedback.message : `${result.score} bonne${result.score > 1 ? 's' : ''} réponse${result.score > 1 ? 's' : ''} sur ${result.totalQuestions}`}
          </Text>
          {result.pointsAwarded > 0 && (
            <View style={{ backgroundColor: 'rgba(239,191,4,0.12)', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 4, marginTop: 10 }}>
              <Text style={{ color: '#EFBF04', fontFamily: 'Rowan-Regular', fontSize: 13 }}>
                +{result.pointsAwarded} pts
              </Text>
            </View>
          )}
        </View>

        {/* Récapitulatif par question */}
        <Text style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Quilon-Medium', fontSize: 12, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 12 }}>
          Récapitulatif
        </Text>
        {quiz.questions.map((q, idx) => {
          const userAnswer = answers[idx] ?? -1;
          const isCorrect = userAnswer === q.correctIndex;
          return (
            <View
              key={q.id}
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                borderRadius: 12,
                padding: 14,
                marginBottom: 10,
                borderLeftWidth: 3,
                borderLeftColor: isCorrect ? '#22c55e' : '#ef4444',
              }}
            >
              <Text style={{ color: '#fafafa', fontFamily: 'Quilon-Medium', fontSize: 13, marginBottom: 8 }}>
                {idx + 1}. {q.text}
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Text style={{ color: isCorrect ? '#22c55e' : '#ef4444', fontFamily: 'Rowan-Regular', fontSize: 12, flex: 1 }}>
                  {isCorrect ? '✓' : '✗'} Ta réponse : {userAnswer >= 0 ? q.options[userAnswer] : '—'}
                </Text>
              </View>
              {!isCorrect && (
                <Text style={{ color: '#22c55e', fontFamily: 'Rowan-Regular', fontSize: 12 }}>
                  ✓ Bonne réponse : {q.options[q.correctIndex]}
                </Text>
              )}
            </View>
          );
        })}

        {/* Bouton maîtrisé */}
        {isMastered && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => navigation.navigate('ArticlesList')}
            style={{
              marginTop: 16,
              backgroundColor: '#EFBF04',
              borderRadius: 16,
              paddingVertical: 16,
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#000', fontFamily: 'Quilon-Medium', fontSize: 15 }}>⭐ Marquer comme maîtrisé</Text>
          </TouchableOpacity>
        )}

        {/* Bouton retour */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={() => navigation.navigate('ArticlesList')}
          style={{
            marginTop: isMastered ? 10 : 16,
            backgroundColor: 'rgba(255,255,255,0.06)',
            borderRadius: 16,
            paddingVertical: 16,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fafafa', fontFamily: 'Quilon-Medium', fontSize: 15 }}>← Retour aux articles</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <View className="flex-1 bg-background px-4" style={{ paddingTop: insets.top + 16 }}>
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
        <Text className="text-accent text-body-sm font-body">← Retour</Text>
      </TouchableOpacity>

      <Text className="text-white/40 text-caption font-body mb-2">
        Question {currentIndex + 1} / {quiz.questions.length}
      </Text>
      <Text className="text-white text-h6 font-heading mb-6">{question.text}</Text>

      <View className="gap-3">
        {question.options.map((option, idx) => (
          <TouchableOpacity
            key={idx}
            activeOpacity={0.7}
            onPress={() => setSelected(idx)}
            className={`rounded-2xl px-4 py-4 border ${
              selected === idx
                ? 'bg-accent border-accent'
                : 'bg-white/[0.04] border-white/[0.08]'
            }`}
          >
            <Text className={`text-body-sm font-body ${selected === idx ? 'text-black' : 'text-white/80'}`}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {selected !== null && (
        <TouchableOpacity
          className="bg-accent rounded-2xl py-4 items-center mt-6"
          activeOpacity={0.8}
          onPress={handleNext}
        >
          <Text className="text-background text-body font-heading">{isLast ? 'Terminer' : 'Suivant'}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

export default function LearnScreen() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ArticlesList" component={ArticlesListScreen} />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
      <Stack.Screen name="Quiz" component={QuizScreen} />
      <Stack.Screen name="ParcoursDetail" component={ParcoursDetailScreen} />
    </Stack.Navigator>
  );
}
