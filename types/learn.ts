export interface Article {
  id: string;
  title: string;
  category: string;
  readTimeMinutes: number;
  content?: string;
  summary?: string;
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
