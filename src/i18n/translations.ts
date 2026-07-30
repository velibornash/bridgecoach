export type Locale = "en";

export type TranslationKey =
  | "nav.dashboard"
  | "nav.learn"
  | "nav.quiz"
  | "nav.profile"
  | "nav.settings"
  | "common.loading"
  | "common.error"
  | "common.save"
  | "common.cancel"
  | "common.delete"
  | "common.search"
  | "common.noResults"
  | "xp.earned"
  | "xp.level"
  | "xp.toNextLevel"
  | "lesson.completed"
  | "lesson.inProgress"
  | "lesson.locked"
  | "quiz.score"
  | "quiz.correct"
  | "quiz.wrong";

const en: Record<TranslationKey, string> = {
  "nav.dashboard": "Dashboard",
  "nav.learn": "Learn",
  "nav.quiz": "Quiz",
  "nav.profile": "Profile",
  "nav.settings": "Settings",
  "common.loading": "Loading...",
  "common.error": "Something went wrong",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.delete": "Delete",
  "common.search": "Search",
  "common.noResults": "No results found",
  "xp.earned": "XP Earned",
  "xp.level": "Level",
  "xp.toNextLevel": "to next level",
  "lesson.completed": "Completed",
  "lesson.inProgress": "In Progress",
  "lesson.locked": "Locked",
  "quiz.score": "Score",
  "quiz.correct": "Correct",
  "quiz.wrong": "Wrong",
};

const translations: Record<Locale, Record<TranslationKey, string>> = { en };

export function getTranslation(locale: Locale, key: TranslationKey): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key;
}

export function getLocaleFromString(s: string): Locale {
  if (s === "en") return "en";
  return "en";
}
