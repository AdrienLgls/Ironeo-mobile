import api from './api';
import type { Parcours, ParcoursDetailType, ParcoursArticle } from '../types/learn';

// Raw shape returned by GET /parcours
interface RawParcoursItem {
  _id: string;
  slug: string;
  title: string;
  description?: string;
  category?: string;
  thumbnailUrl?: string;
  articles?: { _id: string }[];
  userProgress?: {
    completed: number;
    total: number;
    percentage: number;
  } | null;
}

// Raw shape returned by GET /parcours/:slug
interface RawParcoursDetail {
  _id: string;
  title: string;
  description?: string;
  articles?: RawDetailArticle[];
  userProgress?: {
    completed: number;
    total: number;
    percentage: number;
  } | null;
}

interface RawDetailArticle {
  _id: string;
  title: string;
  isPaid?: boolean;
  hasAccess?: boolean;
  progress?: {
    status: string;
    bestScore?: number;
    lastReviewed?: string;
  } | null;
}

function mapParcours(raw: RawParcoursItem): Parcours {
  const articleCount = raw.articles?.length ?? 0;
  const progress = raw.userProgress?.percentage;
  const isStarted = raw.userProgress != null;

  return {
    id: raw._id,
    slug: raw.slug,
    title: raw.title,
    description: raw.description,
    category: raw.category ?? '',
    imageUrl: raw.thumbnailUrl,
    articleCount,
    progress,
    isStarted,
  };
}

function mapParcoursDetail(raw: RawParcoursDetail): ParcoursDetailType {
  const completedCount = raw.userProgress?.completed ?? 0;
  const totalCount = raw.articles?.length ?? 0;

  const articles: ParcoursArticle[] = (raw.articles ?? []).map((a, index) => {
    const isCompleted = a.progress?.status === 'mastered';
    // locked if: paid, no access, and not yet reached (index >= completed)
    const isLocked = (a.isPaid === true && a.hasAccess === false) && index >= completedCount;

    return {
      id: a._id,
      title: a.title,
      isCompleted,
      isLocked: isLocked && !isCompleted,
    };
  });

  // If no progress data, lock nothing (guest view)
  const finalArticles: ParcoursArticle[] = totalCount > 0 && raw.userProgress === undefined
    ? articles.map((a) => ({ ...a, isLocked: false }))
    : articles;

  return {
    id: raw._id,
    title: raw.title,
    description: raw.description,
    articles: finalArticles,
  };
}

export async function getParcours(): Promise<Parcours[]> {
  const { data } = await api.get<RawParcoursItem[]>('/parcours');
  return (data ?? []).map(mapParcours);
}

export async function getParcoursDetail(slug: string): Promise<ParcoursDetailType> {
  const { data } = await api.get<RawParcoursDetail>(`/parcours/${slug}`);
  return mapParcoursDetail(data);
}
