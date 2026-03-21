import api from './api';
import type { Article, Quiz } from '../types/learn';

export async function getArticles(): Promise<Article[]> {
  try {
    const { data } = await api.get<Article[]>('/articles');
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getArticleById(id: string): Promise<Article> {
  const { data } = await api.get<Article>(`/articles/${id}`);
  return data;
}

export async function getQuizById(id: string): Promise<Quiz> {
  const { data } = await api.get<Quiz>(`/quizzes/${id}`);
  return data;
}

export interface InProgressArticle {
  _id: string;
  title: string;
  slug?: string;
  category?: string;
  imageUrl?: string;
  progressPercent?: number;
}

export interface MasteredArticle {
  _id: string;
  title: string;
  slug?: string;
  category?: string;
  masteredAt: string;
  bestScore?: number;
}

export async function getInProgressArticles(): Promise<InProgressArticle[]> {
  try {
    const { data } = await api.get<InProgressArticle[]>('/articles/user/in-progress');
    return data || [];
  } catch {
    return [];
  }
}

export async function getMasteredArticles(): Promise<MasteredArticle[]> {
  try {
    const { data } = await api.get<MasteredArticle[]>('/articles/user/mastered');
    return data || [];
  } catch {
    return [];
  }
}

export async function getLearnStats(): Promise<{ totalRead: number; avgScore: number; streak: number } | null> {
  try {
    const { data } = await api.get<{ totalRead: number; avgScore: number; streak: number }>('/quiz/stats');
    return data || null;
  } catch {
    return null;
  }
}

export async function searchArticles(query: string, category?: string): Promise<Article[]> {
  try {
    const params: Record<string, string> = { search: query };
    if (category && category !== 'Tous') {
      params.category = category.toLowerCase();
    }
    const { data } = await api.get<Article[]>('/articles', { params });
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getFavorites(): Promise<Article[]> {
  try {
    const { data } = await api.get<Article[]>('/articles/user/favorites');
    return data ?? [];
  } catch {
    return [];
  }
}

export async function toggleFavorite(articleId: string): Promise<void> {
  await api.post(`/articles/${articleId}/favorite`);
}

export async function markStarted(articleId: string): Promise<void> {
  await api.post(`/articles/${articleId}/start`);
}

export interface QuizAnswer {
  userAnswer: number;
}

export interface QuizFeedback {
  status: string;
  message: string;
  suggestions: string[];
}

export interface QuizSubmitResult {
  score: number;
  totalQuestions: number;
  percentage: number;
  status: string;
  bestScore: number;
  nextReviewDue: string;
  nextReviewDays: number;
  weakConcepts: string[];
  feedback: QuizFeedback;
  streak: number;
  totalPoints: number;
  pointsAwarded: number;
  levelUp: string | null;
}

export async function submitQuiz(
  articleId: string,
  answers: QuizAnswer[],
): Promise<QuizSubmitResult> {
  const { data } = await api.post<QuizSubmitResult>('/quiz/submit', { articleId, answers });
  return data;
}
