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
