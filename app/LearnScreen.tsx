import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getArticles, getArticleById, getQuizById, getInProgressArticles, getMasteredArticles, getLearnStats } from '../services/learnService';
import type { InProgressArticle, MasteredArticle } from '../services/learnService';
import { getDueReviews } from '../services/userService';
import type { DueReview } from '../services/userService';
import ArticleCard from '../components/learn/ArticleCard';
import HubTabNavigation from '../components/ui/HubTabNavigation';
import type { Article, Quiz, QuizQuestion } from '../types/learn';

export type LearnStackParamList = {
  ArticlesList: undefined;
  ArticleDetail: { articleId: string };
  Quiz: { quizId: string };
};

const Stack = createNativeStackNavigator<LearnStackParamList>();

const CATEGORIES = ['Tous', 'Technique', 'Nutrition', 'Mentalité', 'Anatomie'] as const;

const HUB_TABS = [
  { id: 'articles', label: 'Articles' },
  { id: 'progression', label: 'Progression' },
];

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('fr-CA', { day: 'numeric', month: 'short' });
  } catch {
    return iso;
  }
}

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
                <View style={{ height: 3, backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 2, marginBottom: 10 }}>
                  <View style={{ height: 3, width: `${article.progressPercent}%`, backgroundColor: '#EFBF04', borderRadius: 2 }} />
                </View>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('articles');

  const [dueReviews, setDueReviews] = useState<DueReview[]>([]);
  const [inProgress, setInProgress] = useState<InProgressArticle[]>([]);
  const [mastered, setMastered] = useState<MasteredArticle[]>([]);
  const [learnStats, setLearnStats] = useState<{ totalRead: number; avgScore: number; streak: number } | null>(null);

  useEffect(() => {
    Promise.all([
      getArticles(),
      getDueReviews(),
      getInProgressArticles(),
      getMasteredArticles(),
      getLearnStats(),
    ])
      .then(([arts, reviews, inProg, mast, stats]) => {
        setArticles(arts);
        setFiltered(arts);
        setDueReviews(reviews);
        setInProgress(inProg);
        setMastered(mast);
        setLearnStats(stats);
      })
      .catch(() => setError('Unable to load data'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (activeCategory === 'Tous') {
      setFiltered(articles);
    } else {
      setFiltered(articles.filter((a) => a.category.toLowerCase() === activeCategory.toLowerCase()));
    }
  }, [activeCategory, articles]);

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
                        backgroundColor: isActive ? '#EFBF04' : 'rgba(255,255,255,0.08)',
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
          }
          ListEmptyComponent={
            <View>
              <Text className="text-white/40 text-body-sm font-body text-center mt-8">
                {error ?? 'Aucun article disponible'}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <ArticleCard
              article={item}
              onPress={() => navigation.navigate('ArticleDetail', { articleId: item.id })}
            />
          )}
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

function ArticleDetailScreen({
  route,
  navigation,
}: NativeStackScreenProps<LearnStackParamList, 'ArticleDetail'>) {
  const { articleId } = route.params;
  const insets = useSafeAreaInsets();
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

  if (error || !article) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <Text className="text-red-400 text-body-sm font-body">{error ?? 'Article not found'}</Text>
      </View>
    );
  }

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

      {article.content != null ? (
        <Text className="text-white/70 text-body-sm font-body">{article.content}</Text>
      ) : (
        <Text className="text-white/30 text-body-sm font-body italic">Contenu indisponible</Text>
      )}
    </ScrollView>
  );
}

function QuizScreen({
  route,
  navigation,
}: NativeStackScreenProps<LearnStackParamList, 'Quiz'>) {
  const { quizId } = route.params;
  const insets = useSafeAreaInsets();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

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
    if (selected === question.correctIndex) {
      setScore((s) => s + 1);
    }
    if (isLast) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
    }
  }

  if (finished) {
    return (
      <View className="flex-1 bg-background items-center justify-center px-6">
        <Text className="text-5xl mb-4">🎯</Text>
        <Text className="text-white text-h2 font-heading mb-2">Quiz terminé !</Text>
        <Text className="text-white/50 text-body-sm font-body mb-8">
          {score} / {quiz.questions.length} bonnes réponses
        </Text>
        <TouchableOpacity
          className="bg-accent rounded-2xl py-4 w-full items-center"
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Text className="text-background text-body font-heading">Retour aux articles</Text>
        </TouchableOpacity>
      </View>
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
    </Stack.Navigator>
  );
}
