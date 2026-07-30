export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatar: string;
  level: number;
  xp: number;
  xpToNextLevel: number;
  streak: number;
  joinedAt: string;
  country: string;
  experienceLevel: ExperienceLevel;
  completedLessonIds: string[];
  currentLessonId: string | null;
}

export type ExperienceLevel = "new" | "beginner" | "intermediate" | "advanced";

export interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  xpReward: number;
  completed: boolean;
  locked: boolean;
  category: string;
  subcategory: string;
  episodeId: string;
  content: LessonContent[];
  hasCards: boolean;
  cards?: CardHand[];
  bookmarked?: boolean;
  notes?: LessonNote[];
  sectionsCompleted: string[];
  currentSectionIndex: number;
}

export interface LessonContent {
  id: string;
  type: "text" | "heading" | "tip" | "example" | "card-interactive";
  text: string;
}

export interface CardHand {
  position: "north" | "east" | "south" | "west";
  cards: string[];
  label: string;
  highlight?: string[];
}

export interface LessonNote {
  id: string;
  text: string;
  timestamp: number;
  pinned: boolean;
  lessonId?: string;
  lessonTitle?: string;
}

export type XpSource = "lesson" | "quiz" | "challenge" | "achievement" | "streak_bonus" | "daily_bonus";

export interface XpEntry {
  id: string;
  amount: number;
  source: XpSource;
  description: string;
  timestamp: string;
}

export interface LevelInfo {
  level: number;
  minXp: number;
  maxXp: number;
  title: string;
}

export type AchievementCategory = "lessons" | "quizzes" | "streak" | "mastery" | "special";

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  maxProgress: number;
  xpReward: number;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface DailyChallengeData {
  id: string;
  date: string;
  title: string;
  description: string;
  xpReward: number;
  bonusXp: number;
  completed: boolean;
  type: "quiz" | "puzzle" | "practice" | "streak";
  difficulty: "easy" | "medium" | "hard";
}

export interface Episode {
  id: string;
  title: string;
  description: string;
  episodeNumber: number;
  difficulty: "beginner" | "intermediate" | "advanced";
  xpReward: number;
  totalXp: number;
  duration: string;
  lessonCount: number;
  completedLessons: number;
  completion: number;
  locked: boolean;
  gradient: string;
  icon: string;
  lessons: string[];
}

export type QuizQuestionType = "single" | "multiple" | "card-select" | "drag-drop";

export interface QuizQuestion {
  id: string;
  type: QuizQuestionType;
  question: string;
  options?: string[];
  correctIndex?: number;
  correctIndices?: number[];
  correctCards?: string[];
  cardOptions?: string[];
  dragItems?: DragItem[];
  dropTargets?: DropTarget[];
  explanation: string;
  xpReward: number;
}

export interface DragItem {
  id: string;
  text: string;
  targetId: string;
}

export interface DropTarget {
  id: string;
  label: string;
  accepts: string[];
}

export interface QuizResult {
  totalQuestions: number;
  correctAnswers: number;
  score: number;
  xpEarned: number;
  answers: Record<string, boolean>;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar: string;
  content: string;
}

export interface Feature {
  id: string;
  title: string;
  description: string;
  icon: string;
}

export interface Activity {
  id: string;
  type: "lesson" | "quiz" | "achievement" | "xp" | "streak";
  description: string;
  timestamp: string;
  xp?: number;
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  progress: number;
  maxProgress: number;
  type: "play" | "quiz" | "streak" | "practice";
}

export interface UserStats {
  totalLessons: number;
  completedLessons: number;
  totalQuizzes: number;
  averageScore: number;
  totalXpEarned: number;
  daysActive: number;
  longestStreak: number;
  totalHours: number;
  cardsPlayed: number;
  correctBids: number;
  totalBids: number;
}

export interface Certificate {
  id: string;
  title: string;
  description: string;
  earnedAt: string;
  episodeId: string;
  gradient: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

export interface RegisterFormData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  repeatPassword: string;
  country: string;
  experienceLevel: ExperienceLevel;
  agreeToTerms: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

export type MissionType = "main" | "side" | "bonus";
export type MissionCategory = "daily" | "weekly";

export interface Mission {
  id: string;
  title: string;
  description: string;
  type: MissionType;
  category: MissionCategory;
  xpReward: number;
  progress: number;
  maxProgress: number;
  completed: boolean;
  icon: string;
  gradient: string;
}

export interface ChapterProgress {
  episodeId: string;
  completedLessons: number;
  totalLessons: number;
  currentLessonId: string | null;
  completedLessonIds: string[];
}

export type RewardType = "coins" | "xp" | "stars" | "badge" | "mystery_chest";

export interface Reward {
  id: string;
  type: RewardType;
  label: string;
  description: string;
  amount: number;
  icon: string;
  earnedAt: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export interface RewardItem {
  id: string;
  type: RewardType;
  label: string;
  description: string;
  amount: number;
  icon: string;
  rarity: "common" | "rare" | "epic" | "legendary";
}

export type NotificationType = "xp" | "achievement" | "reminder" | "lesson" | "friend";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  timestamp: string;
  read: boolean;
  icon: string;
  actionLabel?: string;
  actionHref?: string;
}

export interface SearchResult {
  id: string;
  title: string;
  description: string;
  category: "lesson" | "topic" | "convention" | "video" | "faq";
  href: string;
  match: string;
}

export type CourseLevel = "beginner" | "intermediate" | "advanced" | "all";

export interface CatalogCourse {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: CourseLevel;
  duration: string;
  lessonCount: number;
  completedCount: number;
  xpReward: number;
  image: string;
  gradient: string;
  icon: string;
  progress: number;
  locked: boolean;
  tags: string[];
}

export interface VideoState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  isMuted: boolean;
  captionsEnabled: boolean;
}

export interface Caption {
  id: string;
  start: number;
  end: number;
  text: string;
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  category: string;
  difficulty: "easy" | "medium" | "hard";
  status: "known" | "unknown" | "review_later";
  lastReviewed: string | null;
  timesReviewed: number;
}

export type BookmarkCategory = "lesson" | "video" | "article";

export interface BookmarkItem {
  id: string;
  title: string;
  description: string;
  href: string;
  category: BookmarkCategory;
  icon: string;
  addedAt: string;
  episodeId?: string;
}
