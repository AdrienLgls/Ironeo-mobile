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
import { getArticles, getArticleById, getQuizById } from '../services/learnService';
import ArticleCard from '../components/learn/ArticleCard';
import type { Article, Quiz, QuizQuestion } from '../types/learn';

export type LearnStackParamList = {
  ArticlesList: undefined;
  ArticleDetail: { articleId: string };
  Quiz: { quizId: string };
};

const Stack = createNativeStackNavigator<LearnStackParamList>();

const CATEGORIES = ['Tous', 'Technique', 'Nutrition', 'Mentalité', 'Anatomie'] as const;

function ArticlesListScreen({
  navigation,
}: NativeStackScreenProps<LearnStackParamList, 'ArticlesList'>) {
  const insets = useSafeAreaInsets();
  const [articles, setArticles] = useState<Article[]>([]);
  const [filtered, setFiltered] = useState<Article[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('Tous');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getArticles()
      .then((data) => {
        setArticles(data);
        setFiltered(data);
      })
      .catch(() => setError('Unable to load articles'))
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
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={{ paddingTop: insets.top + 16 }}>
            <Text className="text-white text-h2 font-heading mb-4">Apprendre</Text>

            {/* Category filter pills */}
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
          </View>
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
