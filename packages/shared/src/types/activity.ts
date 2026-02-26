import { SlidePosition } from './session';

export interface ActivityConfig {
  slidePosition: SlidePosition;
  activityType: ActivityType;
  activityId: string;
  config: ActivityDefinition;
}

export type ActivityType = 'poll' | 'quiz' | 'stmath-game' | 'word-cloud' | 'web-link';

export interface ActivityDefinition {
  type: ActivityType;
  activityId?: string;
}

export interface PollActivity extends ActivityDefinition {
  type: 'poll';
  question: string;
  options: string[];
  allowMultiple: boolean;
  showResults: 'live' | 'after-close' | 'never';
}

export interface QuizActivity extends ActivityDefinition {
  type: 'quiz';
  question: string;
  options: string[];
  correctAnswer: number;
  timeLimit?: number;
  points: number;
}

export interface STMathGameActivity extends ActivityDefinition {
  type: 'stmath-game';
  gameType: 'pattern-match' | 'number-sequence' | 'spatial-reasoning';
  difficulty: 'easy' | 'medium' | 'hard';
  targetScore: number;
  timeLimit?: number;
}

export interface WordCloudActivity extends ActivityDefinition {
  type: 'word-cloud';
  prompt: string;
  maxWords?: number;
  minLength?: number;
}

export interface WebLinkActivity extends ActivityDefinition {
  type: 'web-link';
  title: string;
  url: string;
  description?: string;
  displayMode: 'iframe' | 'new-tab' | 'redirect';
  iframeHeight?: string;
}

// Results aggregation
export interface PollResults {
  activityId: string;
  question: string;
  options: string[];
  responses: number[];
  totalResponses: number;
}

export interface QuizResults {
  activityId: string;
  question: string;
  correctAnswer: number;
  correctCount: number;
  incorrectCount: number;
  responses: number[]; // Count of responses for each option
  totalResponses: number;
  averageTime?: number;
  leaderboard?: LeaderboardEntry[];
}

export interface LeaderboardEntry {
  participantId: string;
  name?: string;
  points: number;
  correctAnswers: number;
  timeElapsed: number;
}

export interface WordCloudResults {
  activityId: string;
  words: Array<{ text: string; count: number }>;
  totalSubmissions: number;
}

export type ActivityResults = PollResults | QuizResults | WordCloudResults;

// Presentation configuration
export interface PresentationConfig {
  presentationId: string;
  title: string;
  description?: string;
  activities: ActivityConfig[];
}
