export interface Article {
  id: string;
  title: string;
  category: string;
  readTimeMinutes: number;
  imageUrl?: string;
  content?: string;
  summary?: string;
}

export interface Parcours {
  id: string;
  title: string;
  category: string;
  imageUrl?: string;
  articlesCount: number;
  progressPercent?: number;
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
