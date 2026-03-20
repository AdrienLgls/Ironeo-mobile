import api from './api';
import type { Article, Quiz } from '../types/learn';

export async function getArticles(): Promise<Article[]> {
  const { data } = await api.get<Article[]>('/articles');
  return data;
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
