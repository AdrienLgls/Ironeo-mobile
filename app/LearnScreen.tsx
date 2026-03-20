import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { getArticles, getArticleById, getQuizById } from '../services/learnService';
import type { Article, Quiz, QuizQuestion } from '../types/learn';

export type LearnStackParamList = {
  ArticlesList: undefined;
  ArticleDetail: { articleId: string };
  Quiz: { quizId: string };
};

const Stack = createNativeStackNavigator<LearnStackParamList>();

function ArticlesListScreen({
  navigation,
}: NativeStackScreenProps<LearnStackParamList, 'ArticlesList'>) {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getArticles()
      .then(setArticles)
      .catch(() => setError('Unable to load articles'))
      .finally(() => setLoading(false));
  }, []);

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
        data={articles}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-4 pb-6"
        ListHeaderComponent={
          <Text className="text-white text-h2 font-heading pt-12 mb-6">Learn</Text>
        }
        ListEmptyComponent={
          <Text className="text-white/40 text-body-sm font-body text-center mt-8">
            {error ?? 'No articles available'}
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => navigation.navigate('ArticleDetail', { articleId: item.id })}
            className="bg-white/[0.04] rounded-2xl p-4 mb-3"
          >
            <View className="flex-row items-start justify-between mb-2">
              <View className="bg-accent/20 rounded-full px-2 py-0.5">
                <Text className="text-accent text-caption font-body capitalize">{item.category}</Text>
              </View>
              <Text className="text-white/30 text-caption font-body">{item.readTimeMinutes} min</Text>
            </View>
            <Text className="text-white text-body-sm font-heading leading-snug">{item.title}</Text>
            {item.summary != null && (
              <Text className="text-white/40 text-caption font-body mt-1" numberOfLines={2}>
                {item.summary}
              </Text>
            )}
          </TouchableOpacity>
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
    <ScrollView className="flex-1 bg-background" contentContainerClassName="px-4 pt-12 pb-8">
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-4">
        <Text className="text-accent text-body-sm font-body">← Back</Text>
      </TouchableOpacity>

      <View className="flex-row items-center gap-3 mb-3">
        <View className="bg-accent/20 rounded-full px-2 py-0.5">
          <Text className="text-accent text-caption font-body capitalize">{article.category}</Text>
        </View>
        <Text className="text-white/30 text-caption font-body">{article.readTimeMinutes} min read</Text>
      </View>

      <Text className="text-white text-h2 font-heading mb-6 leading-tight">{article.title}</Text>

      {article.content != null ? (
        <Text className="text-white/70 text-body-sm font-body leading-relaxed">{article.content}</Text>
      ) : (
        <Text className="text-white/30 text-body-sm font-body italic">Content unavailable</Text>
      )}
    </ScrollView>
  );
}

function QuizScreen({
  route,
  navigation,
}: NativeStackScreenProps<LearnStackParamList, 'Quiz'>) {
  const { quizId } = route.params;
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
        <Text className="text-white text-h2 font-heading mb-2">Quiz complete!</Text>
        <Text className="text-white/50 text-body-sm font-body mb-8">
          {score} / {quiz.questions.length} correct
        </Text>
        <TouchableOpacity
          className="bg-accent rounded-2xl py-4 w-full items-center"
          activeOpacity={0.8}
          onPress={() => navigation.goBack()}
        >
          <Text className="text-black text-body font-heading">Back to articles</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background px-4 pt-12">
      <TouchableOpacity onPress={() => navigation.goBack()} className="mb-6">
        <Text className="text-accent text-body-sm font-body">← Back</Text>
      </TouchableOpacity>

      <Text className="text-white/40 text-caption font-body mb-2">
        Question {currentIndex + 1} of {quiz.questions.length}
      </Text>
      <Text className="text-white text-h6 font-heading mb-6 leading-snug">{question.text}</Text>

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
          <Text className="text-black text-body font-heading">{isLast ? 'Finish' : 'Next'}</Text>
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
