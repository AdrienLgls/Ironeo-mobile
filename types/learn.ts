export interface Article {
  id: string;
  title: string;
  category: string;
  readTimeMinutes: number;
  imageUrl?: string;
  content?: string;
  summary?: string;
  quizId?: string;
  isFavorite?: boolean;
}

export interface Parcours {
  id: string;
  slug: string;
  title: string;
  description?: string;
  category: string;
  imageUrl?: string;
  articleCount: number;
  progress?: number;
  isStarted?: boolean;
}

export interface ParcoursArticle {
  id: string;
  title: string;
  isCompleted: boolean;
  isLocked: boolean;
}

export interface ParcoursDetailType {
  id: string;
  title: string;
  description?: string;
  articles: ParcoursArticle[];
}

export interface Quiz {
  id: string;
  title: string;
  questions: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  text: string;
  options: string[];
  correctIndex: number;
}
