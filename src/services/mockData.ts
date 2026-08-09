import {
  User, Lesson, Achievement, Testimonial, Feature,
  Activity, Episode, DailyMission, UserStats,
  QuizQuestion, Certificate, CardHand, LessonContent,
  DailyChallengeData, XpEntry, Mission,
  RewardItem, Reward, AppNotification, SearchResult, CatalogCourse,
  Caption, Flashcard, BookmarkItem, LessonNote,
  LearningStats, LeaderboardEntry, Friend, CommunityPost,
} from "@/types";

export const mockUser: User = {
  id: "user-1",
  firstName: "Bob",
  lastName: "Smith",
  email: "bob@bridgecoach.com",
  avatar: "",
  level: 7,
  xp: 3500,
  xpToNextLevel: 4200,
  streak: 12,
  joinedAt: "2026-01-15",
  country: "US",
  experienceLevel: "intermediate",
  completedLessonIds: ["l1", "l2"],
  currentLessonId: "l3",
};

export const mockUserStats: UserStats = {
  totalLessons: 48,
  completedLessons: 12,
  totalQuizzes: 24,
  averageScore: 78,
  totalXpEarned: 2450,
  daysActive: 45,
  longestStreak: 14,
  totalHours: 28,
  cardsPlayed: 3840,
  correctBids: 187,
  totalBids: 245,
};

export const mockCertificates: Certificate[] = [
  { id: "c1", title: "Bridge Fundamentals", description: "Completed all beginner bridge basics", earnedAt: "2026-02-15", episodeId: "ep1", gradient: "from-emerald-500 to-teal-600" },
  { id: "c2", title: "Bidding Basics", description: "Mastered the bidding system", earnedAt: "2026-03-01", episodeId: "ep2", gradient: "from-indigo-500 to-indigo-600" },
];

const lessonContent1: LessonContent[] = [
  { id: "lc1", type: "heading", text: "What is a Trick?" },
  { id: "lc2", type: "text", text: "In Contract Bridge, a trick consists of four cards — one played by each player in clockwise order. The highest card of the lead suit wins the trick, unless a trump is played." },
  { id: "lc3", type: "tip", text: "The player who wins a trick leads the next one. This is called being 'on lead'." },
  { id: "lc4", type: "heading", text: "Following Suit" },
  { id: "lc5", type: "text", text: "You must follow suit if you can. If you cannot follow suit, you may play any card — including a trump card which will win the trick." },
  { id: "lc6", type: "example", text: "West leads ♠K. North plays ♠3. East plays ♠7. South plays ♠5. West wins the trick with ♠K and leads the next card." },
  { id: "lc7", type: "card-interactive", text: "Look at the cards below. Which card wins this trick?" },
];

const lessonContent2: LessonContent[] = [
  { id: "ld1", type: "heading", text: "Opening Lead Principles" },
  { id: "ld2", type: "text", text: "The opening lead is one of the most important decisions in bridge. A good lead can set the defense on the right path; a bad one can give away the contract." },
  { id: "ld3", type: "heading", text: "Leading Against Notrump" },
  { id: "ld4", type: "text", text: "Against notrump contracts, lead your longest and strongest suit. The goal is to establish small cards in that suit as winners." },
  { id: "ld5", type: "tip", text: "With a suit headed by an honor sequence (KQJ, QJ10), lead the top card. With interior sequences (KJ10, AQJ), lead the higher of the touching cards." },
  { id: "ld6", type: "example", text: "Holding ♠KQ752, lead the ♠K against 3NT. This tells partner you have the queen and likely length in the suit." },
];

const lessonContent3: LessonContent[] = [
  { id: "ln1", type: "heading", text: "The 1NT Opening Bid" },
  { id: "ln2", type: "text", text: "Opening 1NT is one of the most descriptive bids in bridge. It shows exactly 15-17 high card points and a balanced hand." },
  { id: "ln3", type: "heading", text: "What is a Balanced Hand?" },
  { id: "ln4", type: "text", text: "A balanced hand has no void or singleton and at most one doubleton. The distributions are 4-3-3-3, 4-4-3-2, or 5-3-3-2." },
  { id: "ln5", type: "tip", text: "With 5-3-3-2 distribution and 15-17 HCP, always open 1NT. Do not open your 5-card major." },
  { id: "ln6", type: "example", text: "♠AJ3 ♥KQ7 ♦A842 ♣KJ5 — 16 HCP, balanced (4-3-3-2). Open 1NT." },
];

const lessonContent4: LessonContent[] = [
  { id: "ls1", type: "heading", text: "The Stayman Convention" },
  { id: "ls2", type: "text", text: "Stayman is used after a 1NT opening to find a 4-4 major suit fit. Responder bids 2♣, asking opener to show a 4-card major." },
  { id: "ls3", type: "heading", text: "Opener's Responses" },
  { id: "ls4", type: "text", text: "With a 4-card major, opener bids that major (2♥ or 2♠). With both majors, bid 2♥ first. With no 4-card major, bid 2♦." },
  { id: "ls5", type: "tip", text: "Stayman promises at least 8 HCP. With fewer points and a long major, transfer instead." },
  { id: "ls6", type: "example", text: "Opener: 1NT (15-17). Responder: ♠KQ74 ♥A83 ♦J65 ♣972 — Bid 2♣ Stayman." },
];

const lessonContent5: LessonContent[] = [
  { id: "lt1", type: "heading", text: "Jacoby Transfers" },
  { id: "lt2", type: "text", text: "Jacoby transfers allow the strong 1NT opener to become declarer, protecting the hand with most points from the opening lead." },
  { id: "lt3", type: "heading", text: "How Transfers Work" },
  { id: "lt4", type: "text", text: "Responder bids the suit below their major: 2♦ shows hearts, 2♥ shows spades. Opener must accept the transfer by bidding the next suit up." },
  { id: "lt5", type: "tip", text: "Use transfers with 5+ cards in a major. With 0-7 HCP, pass opener's bid. With 8+ HCP, make a second bid." },
  { id: "lt6", type: "example", text: "Opener: 1NT. Responder: ♠AJ875 ♥K4 ♦Q72 ♣83 — Bid 2♥ (transfer to spades). Opener bids 2♠." },
];

export const mockLessons: Lesson[] = [
  {
    id: "l1", title: "Trick-Taking Fundamentals", description: "Learn how tricks work in bridge",
    duration: "8 min", xpReward: 50, completed: true, locked: false, category: "Basics", subcategory: "Fundamentals", episodeId: "ep1",
    content: lessonContent1, hasCards: true, cards: mockHand1(), bookmarked: true,
    sectionsCompleted: lessonContent1.map(c => c.id), currentSectionIndex: lessonContent1.length,
  },
  {
    id: "l2", title: "Opening Leads", description: "Master the art of the first card",
    duration: "10 min", xpReward: 60, completed: true, locked: false, category: "Basics", subcategory: "Fundamentals", episodeId: "ep1",
    content: lessonContent2, hasCards: true, cards: mockHand2(), bookmarked: false,
    sectionsCompleted: lessonContent2.map(c => c.id), currentSectionIndex: lessonContent2.length,
  },
  {
    id: "l3", title: "NT Opening Bids", description: "When and how to open 1NT",
    duration: "12 min", xpReward: 70, completed: false, locked: false, category: "Bidding", subcategory: "Notrump", episodeId: "ep2",
    content: lessonContent3, hasCards: true, cards: mockHand3(), bookmarked: false,
    sectionsCompleted: ["ln1", "ln2"], currentSectionIndex: 2,
  },
  {
    id: "l4", title: "Stayman Convention", description: "Find major suit fits after 1NT",
    duration: "15 min", xpReward: 80, completed: false, locked: false, category: "Bidding", subcategory: "Conventions", episodeId: "ep2",
    content: lessonContent4, hasCards: true, cards: mockHand4(), bookmarked: true,
    sectionsCompleted: [], currentSectionIndex: 0,
  },
  {
    id: "l5", title: "Transfers", description: "Jacoby transfers explained",
    duration: "14 min", xpReward: 75, completed: false, locked: false, category: "Bidding", subcategory: "Conventions", episodeId: "ep2",
    content: lessonContent5, hasCards: true, cards: mockHand5(), bookmarked: false,
    sectionsCompleted: [], currentSectionIndex: 0,
  },
  { id: "l6", title: "Finessing Techniques", description: "Win tricks with finesses",
    duration: "11 min", xpReward: 65, completed: false, locked: true, category: "Play", subcategory: "Declarer", episodeId: "ep3",
    content: [], hasCards: false, bookmarked: false,
    sectionsCompleted: [], currentSectionIndex: 0,
  },
  { id: "l7", title: "Defensive Signals", description: "Communicate with partner",
    duration: "13 min", xpReward: 70, completed: false, locked: true, category: "Defense", subcategory: "Signals", episodeId: "ep4",
    content: [], hasCards: false, bookmarked: false,
    sectionsCompleted: [], currentSectionIndex: 0,
  },
  { id: "l8", title: "Trump Management", description: "Handle trump suits effectively",
    duration: "16 min", xpReward: 85, completed: false, locked: true, category: "Play", subcategory: "Declarer", episodeId: "ep3",
    content: [], hasCards: false, bookmarked: false,
    sectionsCompleted: [], currentSectionIndex: 0,
  },
];

function mockHand1(): CardHand[] {
  return [
    { position: "north", cards: ["♠A", "♠K", "♠3", "♥Q", "♥7", "♦J", "♦5", "♣10", "♣4"], label: "North (Dummy)", highlight: ["♠A", "♠K"] },
    { position: "south", cards: ["♠Q", "♠J", "♠2", "♥A", "♥K", "♦A", "♦Q", "♣A", "♣K"], label: "South (You)", highlight: ["♠Q"] },
    { position: "east", cards: ["♠9", "♠8", "♠7", "♥J", "♥5", "♦K", "♦3", "♣J", "♣2"], label: "East" },
    { position: "west", cards: ["♠10", "♠6", "♠5", "♥9", "♥3", "♦9", "♦2", "♣Q", "♣7"], label: "West" },
  ];
}
function mockHand2(): CardHand[] {
  return [
    { position: "north", cards: ["♠K", "♠7", "♠4", "♥A", "♥J", "♦Q", "♦6", "♣J", "♣5"], label: "North (Dummy)" },
    { position: "south", cards: ["♠Q", "♠J", "♠2", "♥K", "♥7", "♦A", "♦K", "♣A", "♣4"], label: "South (You)" },
    { position: "east", cards: ["♠A", "♠8", "♠5", "♥Q", "♥4", "♦J", "♦3", "♣Q", "♣2"], label: "East" },
    { position: "west", cards: ["♠10", "♠9", "♠3", "♥9", "♥3", "♦9", "♦2", "♣K", "♣7"], label: "West" },
  ];
}
function mockHand3(): CardHand[] {
  return [
    { position: "south", cards: ["♠A", "♠J", "♠3", "♥K", "♥Q", "♥7", "♦A", "♦8", "♦4", "♣K", "♣J", "♣5"], label: "Your Hand (South)" },
  ];
}
function mockHand4(): CardHand[] {
  return [
    { position: "south", cards: ["♠K", "♠Q", "♠7", "♠4", "♥A", "♥8", "♥3", "♦J", "♦6", "♣Q", "♣9", "♣2"], label: "Your Hand (South)" },
  ];
}
function mockHand5(): CardHand[] {
  return [
    { position: "south", cards: ["♠A", "♠J", "♠8", "♠7", "♠5", "♥K", "♥4", "♦Q", "♦7", "♦2", "♣A", "♣3"], label: "Your Hand (South)" },
  ];
}

export const mockEpisodes: Episode[] = [
  {
    id: "ep1", title: "Bridge Fundamentals", description: "Learn the basic rules, trick-taking, and how a hand of bridge works.",
    episodeNumber: 1, difficulty: "beginner", xpReward: 120, totalXp: 300,
    duration: "45 min", lessonCount: 6, completedLessons: 6, completion: 100,
    locked: false, gradient: "from-emerald-500 to-teal-600", icon: "♠",
    lessons: ["Trick-Taking Fundamentals", "Opening Leads", "Following Suit", "Winning Tricks", "Basic Scoring", "Partner Communication"],
  },
  {
    id: "ep2", title: "Bidding Basics", description: "Understand how to communicate with your partner through the bidding system.",
    episodeNumber: 2, difficulty: "beginner", xpReward: 150, totalXp: 400,
    duration: "60 min", lessonCount: 8, completedLessons: 3, completion: 38,
    locked: false, gradient: "from-indigo-500 to-indigo-600", icon: "♣",
    lessons: ["NT Opening Bids", "Stayman Convention", "Jacoby Transfers", "Major Suit Openings", "Minor Suit Openings", "Responding to 1NT", "Overcalls", "Takeout Doubles"],
  },
  {
    id: "ep3", title: "Declarer Play", description: "Master the techniques of playing the hand as declarer.",
    episodeNumber: 3, difficulty: "beginner", xpReward: 180, totalXp: 500,
    duration: "75 min", lessonCount: 8, completedLessons: 3, completion: 38,
    locked: false, gradient: "from-violet-500 to-purple-600", icon: "♥",
    lessons: ["Finessing Techniques", "Trump Management", "Establishing Long Suits", "Ruffing in Dummy", "Entry Management", "Duck & Hold Up", "Safety Plays", "Endplay Basics"],
  },
  {
    id: "ep4", title: "Defensive Play", description: "Learn how to defend effectively and communicate with signals.",
    episodeNumber: 4, difficulty: "intermediate", xpReward: 200, totalXp: 550,
    duration: "80 min", lessonCount: 8, completedLessons: 0, completion: 0,
    locked: true, gradient: "from-amber-500 to-orange-600", icon: "♦",
    lessons: ["Opening Leads Against NT", "Opening Leads Against Suits", "Third Hand Play", "Defensive Signals", "Count Signals", "Attitude Signals", "Suit Preference", "Discarding"],
  },
  {
    id: "ep5", title: "Advanced Bidding", description: "Explore sophisticated bidding conventions.",
    episodeNumber: 5, difficulty: "intermediate", xpReward: 240, totalXp: 650,
    duration: "90 min", lessonCount: 10, completedLessons: 0, completion: 0,
    locked: true, gradient: "from-rose-500 to-pink-600", icon: "♠",
    lessons: ["Blackwood Convention", "Gerber", "Cue Bids", "Splinter Bids", "Fourth Suit Forcing", "Checkback Stayman", "Weak Two Bids", "Preempts", "Strong 2C", "Competitive Bidding"],
  },
  {
    id: "ep6", title: "Expert Techniques", description: "Fine-tune your game with advanced plays.",
    episodeNumber: 6, difficulty: "advanced", xpReward: 300, totalXp: 800,
    duration: "100 min", lessonCount: 10, completedLessons: 0, completion: 0,
    locked: true, gradient: "from-red-500 to-rose-600", icon: "♥",
    lessons: ["Squeeze Plays", "Trump Coup", "Loser on Loser", "Dummy Reversal", "Morton's Fork", "Scissors Coup", "Crocodile Coup", "Deschapelles Coup", "Merrimac Coup", "Vienna Coup"],
  },
];

export const mockAchievements: Achievement[] = [
  { id: "a1", title: "First Trick", description: "Complete your first lesson", icon: "🎯", category: "lessons", unlocked: true, unlockedAt: "2026-01-15", progress: 1, maxProgress: 1, xpReward: 50, rarity: "common" },
  { id: "a2", title: "Streak Starter", description: "3-day learning streak", icon: "🔥", category: "streak", unlocked: true, unlockedAt: "2026-01-18", progress: 3, maxProgress: 3, xpReward: 75, rarity: "common" },
  { id: "a3", title: "Bidder", description: "Complete all bidding basics", icon: "🃏", category: "lessons", unlocked: true, unlockedAt: "2026-02-01", progress: 3, maxProgress: 3, xpReward: 100, rarity: "rare" },
  { id: "a4", title: "Dedicated", description: "7-day learning streak", icon: "⚡", category: "streak", unlocked: false, progress: 5, maxProgress: 7, xpReward: 150, rarity: "rare" },
  { id: "a5", title: "Scholar", description: "Complete 10 lessons", icon: "📚", category: "lessons", unlocked: false, progress: 7, maxProgress: 10, xpReward: 200, rarity: "rare" },
  { id: "a6", title: "Perfect Score", description: "Get 100% on any quiz", icon: "💯", category: "quizzes", unlocked: false, progress: 0, maxProgress: 1, xpReward: 250, rarity: "epic" },
  { id: "a7", title: "Card Shark", description: "Win 100 tricks", icon: "🦈", category: "mastery", unlocked: false, progress: 64, maxProgress: 100, xpReward: 300, rarity: "epic" },
  { id: "a8", title: "Iron Mind", description: "30-day learning streak", icon: "🧠", category: "streak", unlocked: false, progress: 12, maxProgress: 30, xpReward: 500, rarity: "legendary" },
  { id: "a9", title: "Quiz Whiz", description: "Complete 10 quizzes", icon: "🧪", category: "quizzes", unlocked: false, progress: 6, maxProgress: 10, xpReward: 150, rarity: "common" },
  { id: "a10", title: "Memory Master", description: "Score 90%+ on 5 quizzes", icon: "🎓", category: "quizzes", unlocked: false, progress: 2, maxProgress: 5, xpReward: 250, rarity: "rare" },
  { id: "a11", title: "Bridge Fanatic", description: "Play for 30 days total", icon: "❤️", category: "mastery", unlocked: false, progress: 12, maxProgress: 30, xpReward: 400, rarity: "epic" },
  { id: "a12", title: "Specialist", description: "Complete 3 lessons in one day", icon: "🌟", category: "special", unlocked: false, progress: 1, maxProgress: 3, xpReward: 175, rarity: "rare" },
];

export const mockTestimonials: Testimonial[] = [
  { id: "t1", name: "Sarah Chen", role: "Complete Beginner → Club Player", avatar: "", content: "I went from knowing nothing to confidently playing at my local club in just 8 weeks." },
  { id: "t2", name: "James Mitchell", role: "Returning Player", avatar: "", content: "After 20 years away, Bridge Coach brought me back up to speed faster than I thought possible." },
  { id: "t3", name: "Emma Rodriguez", role: "Competitive Player", avatar: "", content: "The AI coach is a game-changer. Instant feedback on my bidding decisions has improved enormously." },
];

export const mockFeatures: Feature[] = [
  { id: "f1", title: "Interactive Lessons", description: "Learn by doing with real-time feedback on every bid and play", icon: "graduation-cap" },
  { id: "f2", title: "Smart Quiz Engine", description: "Adaptive quizzes that target your weak spots", icon: "brain" },
  { id: "f3", title: "AI Coach", description: "Personalized guidance that analyzes your decisions", icon: "bot" },
  { id: "f4", title: "Daily Challenges", description: "Quick daily puzzles to keep your skills sharp", icon: "calendar" },
  { id: "f5", title: "Achievement System", description: "Earn XP, unlock achievements, track progress", icon: "trophy" },
  { id: "f6", title: "Learning Path", description: "Structured curriculum from beginner to advanced", icon: "map" },
];

export const mockDailyMission: DailyMission = {
  id: "dm1",
  title: "Complete a Bidding Quiz",
  description: "Practice your NT bidding with 5 quiz questions",
  xpReward: 80,
  progress: 3,
  maxProgress: 5,
  type: "quiz",
};

export const mockActivity: Activity[] = [
  { id: "act1", type: "lesson", description: "Completed 'NT Opening Bids'", timestamp: "2 hours ago", xp: 70 },
  { id: "act2", type: "quiz", description: "Scored 90% on Bidding Quiz", timestamp: "Yesterday", xp: 40 },
  { id: "act3", type: "achievement", description: "Unlocked 'Bidder' achievement", timestamp: "2 days ago" },
  { id: "act4", type: "streak", description: "12-day streak! Keep going!", timestamp: "Today" },
  { id: "act5", type: "xp", description: "Earned 50 XP from Daily Challenge", timestamp: "3 days ago", xp: 50 },
  { id: "act6", type: "lesson", description: "Started 'Stayman Convention'", timestamp: "4 days ago" },
  { id: "act7", type: "quiz", description: "Scored 100% on Basics Quiz", timestamp: "5 days ago", xp: 50 },
  { id: "act8", type: "achievement", description: "Unlocked 'First Trick' achievement", timestamp: "6 days ago" },
];

export const mockQuizQuestions: QuizQuestion[] = [
  {
    id: "q1", type: "single",
    question: "How many points are needed for a 1NT opening bid?",
    options: ["12-14", "15-17", "16-18", "20-21"],
    correctIndex: 1,
    explanation: "A 1NT opening bid shows 15-17 high card points and a balanced hand.",
    xpReward: 15,
  },
  {
    id: "q2", type: "single",
    question: "What shape qualifies as balanced?",
    options: ["4-3-3-3", "5-4-2-2", "6-3-2-2", "All of the above"],
    correctIndex: 0,
    explanation: "4-3-3-3 is perfectly balanced. 5-4-2-2 and 6-3-2-2 have two doubletons, which can be played as balanced but are not technically balanced.",
    xpReward: 15,
  },
  {
    id: "q3", type: "multiple",
    question: "Which of these are balanced hand patterns? (Select all that apply)",
    options: ["4-3-3-3", "5-4-2-2", "4-4-3-2", "5-3-3-2", "6-3-2-2"],
    correctIndices: [0, 2, 3],
    explanation: "4-3-3-3, 4-4-3-2, and 5-3-3-2 are balanced. 5-4-2-2 has two doubletons and 6-3-2-2 has a 6-card suit.",
    xpReward: 20,
  },
  {
    id: "q4", type: "single",
    question: "With 14 HCP and a balanced hand, what do you open?",
    options: ["1NT", "Pass", "1 of a suit", "2NT"],
    correctIndex: 2,
    explanation: "With 14 HCP you're too strong to pass and just short of a 1NT opening (15-17). Open 1 of your longest suit.",
    xpReward: 15,
  },
  {
    id: "q5", type: "multiple",
    question: "Which bids show a balanced hand? (Select all that apply)",
    options: ["1NT opening", "1♣ opening followed by 1NT rebid", "2NT opening", "1♠ opening"],
    correctIndices: [0, 1, 2],
    explanation: "1NT (15-17), 2NT (20-21), and a 1-level suit followed by 1NT rebid (12-14) all show balanced hands.",
    xpReward: 20,
  },
  {
    id: "q6", type: "card-select",
    question: "Select the cards that form a balanced 16 HCP hand for a 1NT opening:",
    cardOptions: ["♠A", "♠K", "♠Q", "♠J", "♠10", "♠9", "♠8", "♠7", "♠6", "♠5", "♠4", "♠3", "♠2", "♥A", "♥K", "♥Q", "♥J", "♥10", "♥9", "♥8", "♥7", "♥6", "♥5", "♥4", "♥3", "♥2", "♦A", "♦K", "♦Q", "♦J", "♦10", "♦9", "♦8", "♦7", "♦6", "♦5", "♦4", "♦3", "♦2", "♣A", "♣K", "♣Q", "♣J", "♣10", "♣9", "♣8", "♣7", "♣6", "♣5", "♣4", "♣3", "♣2"],
    correctCards: ["♠A", "♠3", "♠2", "♥K", "♥Q", "♥2", "♦A", "♦Q", "♦3", "♣J", "♣8", "♣5", "♣2"],
    explanation: "♠A32 ♥KQ2 ♦AQ3 ♣J852 — 16 HCP, 4-3-3-3 balanced. Perfect for a 1NT opening!",
    xpReward: 25,
  },
  {
    id: "q7", type: "single",
    question: "After 1NT opening, what does 2♣ ask?",
    options: ["For a 5-card major", "For a 4-card major", "To play in clubs", "For point count"],
    correctIndex: 1,
    explanation: "2♣ is Stayman, asking opener if they have a 4-card major suit.",
    xpReward: 15,
  },
  {
    id: "q8", type: "drag-drop",
    question: "Match each point range to its correct opening bid:",
    dragItems: [
      { id: "d1", text: "12-14 HCP", targetId: "rebid" },
      { id: "d2", text: "15-17 HCP", targetId: "1nt" },
      { id: "d3", text: "20-21 HCP", targetId: "2nt" },
      { id: "d4", text: "25+ HCP", targetId: "2c" },
    ],
    dropTargets: [
      { id: "1nt", label: "1NT", accepts: ["d2"] },
      { id: "2nt", label: "2NT", accepts: ["d3"] },
      { id: "rebid", label: "1♣ → 1NT rebid", accepts: ["d1"] },
      { id: "2c", label: "2♣ (strong)", accepts: ["d4"] },
    ],
    explanation: "12-14: open 1♣ and rebid 1NT. 15-17: open 1NT. 20-21: open 2NT. 25+: open 2♣.",
    xpReward: 30,
  },
];

export const mockXpEntries: XpEntry[] = (() => {
  const now = Date.now();
  const day = 86400000;
  return [
    { id: "xp1", amount: 70, source: "lesson", description: "Completed 'NT Opening Bids'", timestamp: new Date(now - 2 * 3600000).toISOString() },
    { id: "xp2", amount: 40, source: "quiz", description: "Scored 90% on Bidding Quiz", timestamp: new Date(now - 6 * 3600000).toISOString() },
    { id: "xp3", amount: 25, source: "challenge", description: "Daily Bridge Puzzle solved", timestamp: new Date(now - 12 * 3600000).toISOString() },
    { id: "xp4", amount: 50, source: "achievement", description: "Unlocked 'Bidder' achievement", timestamp: new Date(now - day).toISOString() },
    { id: "xp5", amount: 15, source: "streak_bonus", description: "12-day streak bonus", timestamp: new Date(now - day).toISOString() },
    { id: "xp6", amount: 30, source: "quiz", description: "Scored 80% on Defense Quiz", timestamp: new Date(now - 1.5 * day).toISOString() },
    { id: "xp7", amount: 60, source: "lesson", description: "Completed 'Opening Leads'", timestamp: new Date(now - 2 * day).toISOString() },
    { id: "xp8", amount: 10, source: "daily_bonus", description: "Daily login bonus", timestamp: new Date(now - 2 * day).toISOString() },
    { id: "xp9", amount: 100, source: "challenge", description: "Weekly Challenge completed", timestamp: new Date(now - 3 * day).toISOString() },
    { id: "xp10", amount: 20, source: "quiz", description: "Scored 70% on Play Quiz", timestamp: new Date(now - 4 * day).toISOString() },
    { id: "xp11", amount: 55, source: "lesson", description: "Completed 'Basic Scoring'", timestamp: new Date(now - 5 * day).toISOString() },
    { id: "xp12", amount: 35, source: "achievement", description: "Unlocked 'Streak Starter'", timestamp: new Date(now - 6 * day).toISOString() },
    { id: "xp13", amount: 10, source: "daily_bonus", description: "Daily login bonus", timestamp: new Date(now - 6 * day).toISOString() },
    { id: "xp14", amount: 45, source: "lesson", description: "Completed 'Trick-Taking'", timestamp: new Date(now - 7 * day).toISOString() },
  ];
})();

export const mockDailyChallenges: DailyChallengeData[] = (() => {
  const now = Date.now();
  const day = 86400000;
  const today = new Date(now);
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return [
    { id: "dc0", date: fmt(today), title: "Bridge Puzzle of the Day", description: "Find the winning line in today's bridge hand. Play all four hands correctly.", xpReward: 40, bonusXp: 20, completed: false, type: "puzzle", difficulty: "medium" },
    { id: "dc1", date: fmt(new Date(now - day)), title: "Bidding Challenge", description: "Correctly bid 5 consecutive hands using Stayman and Transfers.", xpReward: 50, bonusXp: 15, completed: true, type: "quiz", difficulty: "hard" },
    { id: "dc2", date: fmt(new Date(now - 2 * day)), title: "Quick Practice", description: "Complete 3 lessons to earn bonus XP.", xpReward: 30, bonusXp: 10, completed: true, type: "practice", difficulty: "easy" },
    { id: "dc3", date: fmt(new Date(now - 3 * day)), title: "Streak Saver", description: "Do any activity to keep your streak alive.", xpReward: 20, bonusXp: 5, completed: true, type: "streak", difficulty: "easy" },
    { id: "dc4", date: fmt(new Date(now - 4 * day)), title: "Notrump Mastery", description: "Score 80%+ on the NT bidding quiz.", xpReward: 45, bonusXp: 15, completed: false, type: "quiz", difficulty: "medium" },
  ];
})();

export const mockDailyChallengeHistory: DailyChallengeData[] = (() => {
  const now = Date.now();
  const day = 86400000;
  const fmt = (d: Date) => d.toISOString().split("T")[0];
  return [
    { id: "h1", date: fmt(new Date(now - 7 * day)), title: "Defense Basics", description: "Complete the opening leads lesson.", xpReward: 35, bonusXp: 10, completed: true, type: "practice", difficulty: "easy" },
    { id: "h2", date: fmt(new Date(now - 8 * day)), title: "Card Play Challenge", description: "Win 10 tricks in the practice hands.", xpReward: 40, bonusXp: 10, completed: true, type: "puzzle", difficulty: "medium" },
    { id: "h3", date: fmt(new Date(now - 9 * day)), title: "Stayman Expert", description: "Answer 5 Stayman questions correctly.", xpReward: 50, bonusXp: 15, completed: true, type: "quiz", difficulty: "hard" },
    { id: "h4", date: fmt(new Date(now - 10 * day)), title: "Daily Warmup", description: "Complete any 1 lesson.", xpReward: 25, bonusXp: 5, completed: true, type: "practice", difficulty: "easy" },
    { id: "h5", date: fmt(new Date(now - 11 * day)), title: "Bidding Precision", description: "Score 100% on a 3-question quiz.", xpReward: 60, bonusXp: 20, completed: false, type: "quiz", difficulty: "hard" },
    { id: "h6", date: fmt(new Date(now - 12 * day)), title: "Two-Day Streak", description: "Learn on consecutive days.", xpReward: 20, bonusXp: 10, completed: true, type: "streak", difficulty: "easy" },
    { id: "h7", date: fmt(new Date(now - 13 * day)), title: "Hand Analysis", description: "Analyze 3 bridge hands correctly.", xpReward: 45, bonusXp: 15, completed: true, type: "puzzle", difficulty: "medium" },
  ];
})();

export const mockRewards: Reward[] = [
  { id: "r1", type: "xp", label: "Lesson XP", description: "Completed 'NT Opening Bids'", amount: 70, icon: "⚡", earnedAt: "2 hours ago", rarity: "common" },
  { id: "r2", type: "stars", label: "Perfect Quiz", description: "Scored 100% on Bidding Quiz", amount: 5, icon: "⭐", earnedAt: "Yesterday", rarity: "rare" },
  { id: "r3", type: "coins", label: "Daily Bonus", description: "Daily login reward", amount: 50, icon: "🪙", earnedAt: "Today", rarity: "common" },
  { id: "r4", type: "badge", label: "Bidder Badge", description: "Completed all bidding basics", amount: 1, icon: "🃏", earnedAt: "2 days ago", rarity: "rare" },
  { id: "r5", type: "mystery_chest", label: "Mystery Chest", description: "3-day streak reward", amount: 1, icon: "🎁", earnedAt: "3 days ago", rarity: "epic" },
  { id: "r6", type: "xp", label: "Challenge XP", description: "Completed daily bridge puzzle", amount: 40, icon: "⚡", earnedAt: "4 days ago", rarity: "common" },
  { id: "r7", type: "stars", label: "Achievement Stars", description: "Unlocked 'Streak Starter'", amount: 10, icon: "⭐", earnedAt: "5 days ago", rarity: "epic" },
  { id: "r8", type: "coins", label: "Weekly Reward", description: "Weekly challenge completion", amount: 200, icon: "🪙", earnedAt: "6 days ago", rarity: "rare" },
  { id: "r9", type: "badge", label: "First Trick Badge", description: "Completed your first lesson", amount: 1, icon: "🎯", earnedAt: "7 days ago", rarity: "common" },
  { id: "r10", type: "mystery_chest", label: "Mystery Chest", description: "7-day streak reward", amount: 1, icon: "🎁", earnedAt: "8 days ago", rarity: "legendary" },
];

export const rewardItems: RewardItem[] = [
  { id: "ri1", type: "coins", label: "Coins", description: "Spend on customization and perks", amount: 1250, icon: "🪙", rarity: "common" },
  { id: "ri2", type: "stars", label: "Stars", description: "Earned from quizzes and achievements", amount: 47, icon: "⭐", rarity: "rare" },
  { id: "ri3", type: "badge", label: "Badges", description: "Unlocked achievements", amount: 3, icon: "🃏", rarity: "rare" },
];

export const mockNotifications: AppNotification[] = [
  { id: "n1", type: "xp", title: "XP Earned!", description: "You earned 70 XP for completing 'NT Opening Bids'", timestamp: "2 min ago", read: false, icon: "⚡", actionLabel: "View Lesson", actionHref: "/lesson" },
  { id: "n2", type: "achievement", title: "Achievement Unlocked!", description: "You unlocked 'Bidder' — Complete all bidding basics", timestamp: "1 hour ago", read: false, icon: "🎯", actionLabel: "View Achievements", actionHref: "/achievements" },
  { id: "n3", type: "reminder", title: "Daily Reminder", description: "Don't forget to complete today's challenge!", timestamp: "3 hours ago", read: false, icon: "🔔", actionLabel: "Go to Challenges", actionHref: "/challenges" },
  { id: "n4", type: "lesson", title: "New Lesson Available", description: "'Finessing Techniques' is now unlocked for you", timestamp: "Yesterday", read: true, icon: "📖", actionLabel: "Start Lesson", actionHref: "/lesson" },
  { id: "n5", type: "friend", title: "Friend Joined!", description: "Sarah Chen has joined Bridge Coach", timestamp: "2 days ago", read: true, icon: "👋" },
  { id: "n6", type: "xp", title: "Bonus XP!", description: "You earned 50 XP from Daily Challenge", timestamp: "3 days ago", read: true, icon: "⚡" },
  { id: "n7", type: "achievement", title: "Streak Starter", description: "You earned 'Streak Starter' — 3-day streak!", timestamp: "5 days ago", read: true, icon: "🔥" },
  { id: "n8", type: "reminder", title: "Streak at Risk!", description: "Complete a lesson today to keep your 12-day streak", timestamp: "6 days ago", read: true, icon: "⚠️" },
];

export const mockSearchResults: Record<string, SearchResult[]> = {
  lessons: [
    { id: "s1", title: "NT Opening Bids", description: "When and how to open 1NT with 15-17 HCP", category: "lesson", href: "/lesson", match: "1NT, opening, balanced hand, 15-17 HCP" },
    { id: "s2", title: "Stayman Convention", description: "Find 4-4 major suit fits after 1NT", category: "lesson", href: "/lesson", match: "Stayman, 2C, major suit, convention" },
    { id: "s3", title: "Jacoby Transfers", description: "Transfer responses to 1NT opening", category: "lesson", href: "/lesson", match: "transfer, Jacoby, 2D, 2H, responder" },
    { id: "s4", title: "Opening Leads", description: "Master the art of the first card", category: "lesson", href: "/lesson", match: "lead, opening, defense, notrump" },
  ],
  topics: [
    { id: "s5", title: "Balanced Hands", description: "Understanding balanced hand patterns (4-3-3-3, 4-4-3-2, 5-3-3-2)", category: "topic", href: "/learning-path", match: "balanced, distribution, HCP, notrump" },
    { id: "s6", title: "Trick-Taking", description: "How tricks work and how to win them", category: "topic", href: "/learning-path", match: "trick, win, lead, follow suit, trump" },
    { id: "s7", title: "Point Counting", description: "Counting high card points and distribution points", category: "topic", href: "/learning-path", match: "HCP, points, counting, valuation" },
  ],
  conventions: [
    { id: "s8", title: "Stayman Convention", description: "Asks opener for a 4-card major after 1NT", category: "convention", href: "/lesson", match: "Stayman, 2C, major, 1NT, convention" },
    { id: "s9", title: "Jacoby Transfer", description: "Transfers to show 5+ card major after 1NT", category: "convention", href: "/lesson", match: "transfer, Jacoby, 2D, 2H, 5-card" },
    { id: "s10", title: "Blackwood Convention", description: "Ace-asking convention using 4NT", category: "convention", href: "/learning-path", match: "Blackwood, 4NT, aces, slam, convention" },
    { id: "s11", title: "Gerber Convention", description: "Ace-asking using 4C", category: "convention", href: "/learning-path", match: "Gerber, 4C, aces, notrump, convention" },
  ],
  videos: [
    { id: "s12", title: "How to Count Points", description: "Video tutorial on counting HCP", category: "video", href: "/lesson", match: "video, count, points, HCP, tutorial" },
    { id: "s13", title: "1NT Opening Explained", description: "Complete guide to 1NT openings", category: "video", href: "/lesson", match: "video, 1NT, opening, notrump, guide" },
  ],
  faq: [
    { id: "s14", title: "What is a balanced hand?", description: "A hand with no void/singleton and at most one doubleton", category: "faq", href: "/learning-path", match: "balanced hand, distribution, FAQ" },
    { id: "s15", title: "How many points for 1NT?", description: "15-17 high card points", category: "faq", href: "/quiz", match: "1NT, points, HCP, opening, FAQ" },
    { id: "s16", title: "What is Stayman?", description: "A convention to find major suit fits after 1NT", category: "faq", href: "/quiz", match: "Stayman, convention, major, 1NT, FAQ" },
  ],
};

export const mockCaptions: Caption[] = [
  { id: "cap1", start: 0, end: 5, text: "Welcome to this lesson on NT Opening Bids." },
  { id: "cap2", start: 5, end: 12, text: "Today we'll learn when and how to open 1NT with a balanced hand." },
  { id: "cap3", start: 12, end: 20, text: "A 1NT opening shows exactly 15-17 high card points." },
  { id: "cap4", start: 20, end: 28, text: "Your hand must also be balanced — no voids or singletons." },
  { id: "cap5", start: 28, end: 35, text: "The balanced patterns are 4-3-3-3, 4-4-3-2, and 5-3-3-2." },
  { id: "cap6", start: 35, end: 45, text: "With 5-3-3-2 distribution and 15-17 HCP, always open 1NT." },
  { id: "cap7", start: 45, end: 55, text: "Do not open your 5-card major — describe your balanced hand first." },
  { id: "cap8", start: 55, end: 62, text: "Let's look at a few example hands to practice." },
];

export const mockFlashcards: Flashcard[] = [
  { id: "fc1", front: "What is a balanced hand?", back: "No void or singleton, at most one doubleton. Patterns: 4-3-3-3, 4-4-3-2, 5-3-3-2", category: "Basics", difficulty: "easy", status: "known", lastReviewed: "2026-07-28", timesReviewed: 5 },
  { id: "fc2", front: "What HCP range does 1NT opening show?", back: "15-17 high card points", category: "Bidding", difficulty: "easy", status: "known", lastReviewed: "2026-07-28", timesReviewed: 4 },
  { id: "fc3", front: "What is Stayman?", back: "2♣ response to 1NT asking opener for a 4-card major", category: "Conventions", difficulty: "medium", status: "unknown", lastReviewed: null, timesReviewed: 0 },
  { id: "fc4", front: "What does opener bid with both majors after Stayman?", back: "Bid 2♥ first. This allows responder to correct to 2♠ if needed.", category: "Conventions", difficulty: "hard", status: "unknown", lastReviewed: null, timesReviewed: 0 },
  { id: "fc5", front: "What is a Jacoby Transfer?", back: "A bid of 2♦ (for hearts) or 2♥ (for spades) after partner's 1NT, showing 5+ cards in the major", category: "Conventions", difficulty: "medium", status: "review_later", lastReviewed: "2026-07-25", timesReviewed: 2 },
  { id: "fc6", front: "How many points for 2NT opening?", back: "20-21 HCP, balanced hand", category: "Bidding", difficulty: "easy", status: "known", lastReviewed: "2026-07-27", timesReviewed: 3 },
  { id: "fc7", front: "What is the opening lead against notrump?", back: "Lead your longest and strongest suit. With honor sequences, lead the top card.", category: "Defense", difficulty: "medium", status: "unknown", lastReviewed: null, timesReviewed: 0 },
  { id: "fc8", front: "What is Blackwood?", back: "4NT asks for aces. Responses: 5♣=0 or 4, 5♦=1, 5♥=2, 5♠=3", category: "Conventions", difficulty: "hard", status: "review_later", lastReviewed: "2026-07-20", timesReviewed: 1 },
  { id: "fc9", front: "What does a double of 1NT show?", back: "Typically 15+ HCP, balanced, suggesting penalty", category: "Bidding", difficulty: "hard", status: "unknown", lastReviewed: null, timesReviewed: 0 },
  { id: "fc10", front: "What is a finesse?", back: "Leading toward an honor to trap the opponent's higher honor", category: "Play", difficulty: "medium", status: "known", lastReviewed: "2026-07-26", timesReviewed: 3 },
];

export const mockBookmarks: BookmarkItem[] = [
  { id: "bm1", title: "NT Opening Bids", description: "When and how to open 1NT with 15-17 HCP", href: "/lesson", category: "lesson", icon: "📖", addedAt: "2 days ago", episodeId: "ep2" },
  { id: "bm2", title: "Stayman Convention", description: "Find 4-4 major suit fits after 1NT", href: "/lesson", category: "lesson", icon: "📖", addedAt: "3 days ago", episodeId: "ep2" },
  { id: "bm3", title: "How to Count Points", description: "Video tutorial on counting HCP", href: "/lesson", category: "video", icon: "🎬", addedAt: "5 days ago" },
  { id: "bm4", title: "1NT Opening Explained", description: "Complete guide to 1NT openings", href: "/lesson", category: "video", icon: "🎬", addedAt: "1 week ago" },
  { id: "bm5", title: "Understanding Balanced Hands", description: "A deep dive into hand patterns", href: "/learning-path", category: "article", icon: "📄", addedAt: "1 week ago" },
  { id: "bm6", title: "Trick-Taking Fundamentals", description: "Learn how tricks work in bridge", href: "/lesson", category: "lesson", icon: "📖", addedAt: "2 weeks ago", episodeId: "ep1" },
  { id: "bm7", title: "Defensive Signals Guide", description: "How to communicate with partner", href: "/learning-path", category: "article", icon: "📄", addedAt: "2 weeks ago" },
];

export const mockAllNotes: LessonNote[] = [
  { id: "mn1", text: "Remember: 1NT = 15-17 HCP, balanced. This is the most important rule for opening bids.", timestamp: Date.now() - 3600000, pinned: true, lessonId: "l3", lessonTitle: "NT Opening Bids" },
  { id: "mn2", text: "Stayman only works with 8+ HCP. With fewer points and a long major, use transfers instead.", timestamp: Date.now() - 7200000, pinned: true, lessonId: "l4", lessonTitle: "Stayman Convention" },
  { id: "mn3", text: "Balanced patterns: 4-3-3-3, 4-4-3-2, 5-3-3-2. Anything else is unbalanced.", timestamp: Date.now() - 86400000, pinned: false, lessonId: "l3", lessonTitle: "NT Opening Bids" },
  { id: "mn4", text: "Transfer then bid again shows 8+ HCP. Transfer and pass shows 0-7 HCP.", timestamp: Date.now() - 172800000, pinned: false, lessonId: "l5", lessonTitle: "Transfers" },
  { id: "mn5", text: "Opening leads against NT: lead longest and strongest suit.", timestamp: Date.now() - 259200000, pinned: false, lessonId: "l2", lessonTitle: "Opening Leads" },
];

export const mockCatalog: CatalogCourse[] = [
  { id: "c1", title: "Bridge Fundamentals", description: "Learn the basic rules, trick-taking, and how a hand of bridge works.", category: "Basics", difficulty: "beginner", duration: "45 min", lessonCount: 6, completedCount: 6, xpReward: 300, image: "", gradient: "from-emerald-500 to-teal-600", icon: "♠", progress: 100, locked: false, tags: ["rules", "tricks", "scoring"] },
  { id: "c2", title: "Bidding Basics", description: "Understand how to communicate with your partner through bidding.", category: "Bidding", difficulty: "beginner", duration: "60 min", lessonCount: 8, completedCount: 3, xpReward: 400, image: "", gradient: "from-indigo-500 to-indigo-600", icon: "♣", progress: 38, locked: false, tags: ["bidding", "1NT", "majors"] },
  { id: "c3", title: "Declarer Play", description: "Master techniques of playing the hand as declarer.", category: "Play", difficulty: "beginner", duration: "75 min", lessonCount: 8, completedCount: 3, xpReward: 500, image: "", gradient: "from-violet-500 to-purple-600", icon: "♥", progress: 38, locked: false, tags: ["finesse", "trump", "declarer"] },
  { id: "c4", title: "Defensive Play", description: "Learn how to defend effectively and signal with partner.", category: "Defense", difficulty: "intermediate", duration: "80 min", lessonCount: 8, completedCount: 0, xpReward: 550, image: "", gradient: "from-amber-500 to-orange-600", icon: "♦", progress: 0, locked: true, tags: ["defense", "signals", "lead"] },
  { id: "c5", title: "Advanced Bidding", description: "Explore sophisticated bidding conventions and competitive auctions.", category: "Bidding", difficulty: "intermediate", duration: "90 min", lessonCount: 10, completedCount: 0, xpReward: 650, image: "", gradient: "from-rose-500 to-pink-600", icon: "♠", progress: 0, locked: true, tags: ["Blackwood", "splinter", "preempt"] },
  { id: "c6", title: "Expert Techniques", description: "Fine-tune your game with advanced plays and coups.", category: "Play", difficulty: "advanced", duration: "100 min", lessonCount: 10, completedCount: 0, xpReward: 800, image: "", gradient: "from-red-500 to-rose-600", icon: "♥", progress: 0, locked: true, tags: ["squeeze", "coup", "expert"] },
  { id: "c7", title: "Notrump Play", description: "Specialized techniques for playing notrump contracts.", category: "Play", difficulty: "intermediate", duration: "50 min", lessonCount: 6, completedCount: 0, xpReward: 350, image: "", gradient: "from-cyan-500 to-blue-600", icon: "♣", progress: 0, locked: true, tags: ["notrump", "entries", "hold-up"] },
  { id: "c8", title: "Slam Bidding", description: "Learn how to bid and make slam contracts.", category: "Bidding", difficulty: "advanced", duration: "70 min", lessonCount: 8, completedCount: 0, xpReward: 600, image: "", gradient: "from-yellow-500 to-amber-600", icon: "♦", progress: 0, locked: true, tags: ["slam", "Blackwood", "grand slam"] },
];

export const mockMissions: Mission[] = [
  {
    id: "m1", title: "Complete Episode 1", description: "Finish all lessons in Bridge Fundamentals",
    type: "main", category: "daily", xpReward: 120, progress: 6, maxProgress: 6, completed: true,
    icon: "📖", gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "m2", title: "Complete Episode 2", description: "Finish all lessons in Bidding Basics",
    type: "main", category: "daily", xpReward: 150, progress: 3, maxProgress: 8, completed: false,
    icon: "📖", gradient: "from-indigo-500 to-indigo-600",
  },
  {
    id: "m3", title: "Score 90%+ on Quiz", description: "Get a high score on any bidding quiz",
    type: "side", category: "daily", xpReward: 80, progress: 1, maxProgress: 1, completed: true,
    icon: "🎯", gradient: "from-violet-500 to-purple-600",
  },
  {
    id: "m4", title: "3-Day Streak", description: "Maintain a 3-day learning streak",
    type: "side", category: "daily", xpReward: 50, progress: 3, maxProgress: 3, completed: true,
    icon: "🔥", gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "m5", title: "5 Lessons This Week", description: "Complete 5 lessons this week",
    type: "bonus", category: "weekly", xpReward: 200, progress: 4, maxProgress: 5, completed: false,
    icon: "⚡", gradient: "from-rose-500 to-pink-600",
  },
  {
    id: "m6", title: "10 Quiz Questions", description: "Answer 10 quiz questions correctly",
    type: "side", category: "weekly", xpReward: 100, progress: 7, maxProgress: 10, completed: false,
    icon: "🧠", gradient: "from-cyan-500 to-blue-600",
  },
  {
    id: "m7", title: "Daily Login Streak (7 days)", description: "Log in for 7 consecutive days",
    type: "bonus", category: "weekly", xpReward: 300, progress: 7, maxProgress: 7, completed: true,
    icon: "🌟", gradient: "from-yellow-500 to-amber-600",
  },
  {
    id: "m8", title: "Complete Episode 3", description: "Finish all lessons in Declarer Play",
    type: "main", category: "weekly", xpReward: 180, progress: 0, maxProgress: 8, completed: false,
    icon: "📖", gradient: "from-violet-500 to-purple-600",
  },
];

export const mockLearningStats: LearningStats = {
  hoursLearned: 28,
  lessonsFinished: 12,
  quizAccuracy: 78,
  currentStreak: 12,
  averageScore: 82,
  weeklyActivity: [
    { day: "Mon", hours: 1.5 },
    { day: "Tue", hours: 2.0 },
    { day: "Wed", hours: 0.5 },
    { day: "Thu", hours: 1.0 },
    { day: "Fri", hours: 2.5 },
    { day: "Sat", hours: 1.0 },
    { day: "Sun", hours: 0 },
  ],
  monthlyProgress: [
    { month: "Jan", lessons: 4, xp: 300 },
    { month: "Feb", lessons: 6, xp: 450 },
    { month: "Mar", lessons: 2, xp: 180 },
    { month: "Apr", lessons: 8, xp: 620 },
    { month: "May", lessons: 5, xp: 410 },
    { month: "Jun", lessons: 7, xp: 530 },
    { month: "Jul", lessons: 3, xp: 240 },
  ],
  categoryBreakdown: [
    { category: "Basics", completed: 6, total: 6 },
    { category: "Bidding", completed: 3, total: 8 },
    { category: "Play", completed: 2, total: 8 },
    { category: "Defense", completed: 0, total: 8 },
    { category: "Conventions", completed: 1, total: 4 },
  ],
};

export const mockLeaderboard: LeaderboardEntry[] = [
  { rank: 1, userId: "u1", name: "Sarah Chen", avatar: "", level: 12, xp: 4850, country: "US", isFriend: true },
  { rank: 2, userId: "u2", name: "James Mitchell", avatar: "", level: 10, xp: 4200, country: "GB", isFriend: false },
  { rank: 3, userId: "u3", name: "Emma Rodriguez", avatar: "", level: 9, xp: 3850, country: "ES", isFriend: true },
  { rank: 4, userId: "u5", name: "Bob Smith", avatar: "", level: 7, xp: 3500, country: "US", isFriend: false, isCurrentUser: true },
  { rank: 5, userId: "u4", name: "Alex Kim", avatar: "", level: 8, xp: 3200, country: "KR", isFriend: false },
  { rank: 6, userId: "u6", name: "Maria Garcia", avatar: "", level: 7, xp: 2380, country: "ES", isFriend: true },
  { rank: 7, userId: "u7", name: "Tom Wilson", avatar: "", level: 6, xp: 2100, country: "US", isFriend: false },
  { rank: 8, userId: "u8", name: "Lisa Wang", avatar: "", level: 6, xp: 1950, country: "CN", isFriend: true },
  { rank: 9, userId: "u9", name: "David Brown", avatar: "", level: 5, xp: 1700, country: "GB", isFriend: false },
  { rank: 10, userId: "u10", name: "Anna Novak", avatar: "", level: 5, xp: 1550, country: "HR", isFriend: false },
  { rank: 11, userId: "u11", name: "Petar Jovanovic", avatar: "", level: 4, xp: 1300, country: "RS", isFriend: true },
  { rank: 12, userId: "u12", name: "Sophie Martin", avatar: "", level: 4, xp: 1150, country: "FR", isFriend: false },
  { rank: 13, userId: "u13", name: "Marco Rossi", avatar: "", level: 3, xp: 950, country: "IT", isFriend: false },
  { rank: 14, userId: "u14", name: "Hana Tanaka", avatar: "", level: 3, xp: 800, country: "JP", isFriend: false },
  { rank: 15, userId: "u15", name: "Omar Hassan", avatar: "", level: 2, xp: 600, country: "AE", isFriend: false },
];

export const mockFriends: Friend[] = [
  { id: "f1", name: "Sarah Chen", avatar: "", level: 12, xp: 4850, country: "US", online: true, lastActive: "now", achievements: 8, mutualFriends: 3 },
  { id: "f2", name: "Emma Rodriguez", avatar: "", level: 9, xp: 3850, country: "ES", online: true, lastActive: "5 min ago", achievements: 6, mutualFriends: 5 },
  { id: "f3", name: "Maria Garcia", avatar: "", level: 7, xp: 2380, country: "ES", online: false, lastActive: "2 hours ago", achievements: 4, mutualFriends: 2 },
  { id: "f4", name: "Lisa Wang", avatar: "", level: 6, xp: 1950, country: "CN", online: true, lastActive: "just now", achievements: 5, mutualFriends: 1 },
  { id: "f5", name: "Petar Jovanovic", avatar: "", level: 4, xp: 1300, country: "RS", online: false, lastActive: "1 day ago", achievements: 3, mutualFriends: 4 },
  { id: "f6", name: "Alex Kim", avatar: "", level: 8, xp: 3200, country: "KR", online: false, lastActive: "3 hours ago", achievements: 7, mutualFriends: 0 },
  { id: "f7", name: "James Mitchell", avatar: "", level: 10, xp: 4200, country: "GB", online: true, lastActive: "1 min ago", achievements: 9, mutualFriends: 2 },
  { id: "f8", name: "Tom Wilson", avatar: "", level: 6, xp: 2100, country: "US", online: false, lastActive: "Yesterday", achievements: 4, mutualFriends: 1 },
];

export const mockCommunityPosts: CommunityPost[] = [
  {
    id: "cp1", userId: "u1", userName: "Sarah Chen", userAvatar: "", userLevel: 12,
    type: "achievement", content: "Just unlocked the 'Iron Mind' achievement — 30-day streak! 🧠🔥",
    timestamp: "2 hours ago", likes: 24, comments: 5, liked: false, relatedTitle: "Iron Mind", relatedXp: 500,
  },
  {
    id: "cp2", userId: "u3", userName: "Emma Rodriguez", userAvatar: "", userLevel: 9,
    type: "lesson_completed", content: "Finished 'Finessing Techniques' — finally understand when to finesse!",
    timestamp: "4 hours ago", likes: 12, comments: 3, liked: true, relatedTitle: "Finessing Techniques", relatedXp: 65,
  },
  {
    id: "cp3", userId: "u6", userName: "Maria Garcia", userAvatar: "", userLevel: 7,
    type: "milestone", content: "Completed Episode 2: Bidding Basics! 🎉 On to Declarer Play!",
    timestamp: "Yesterday", likes: 31, comments: 8, liked: false, relatedTitle: "Bidding Basics", relatedXp: 150,
  },
  {
    id: "cp4", userId: "u2", userName: "James Mitchell", userAvatar: "", userLevel: 10,
    type: "achievement", content: "Earned 'Card Shark' — 100 tricks won! 🦈♠️",
    timestamp: "Yesterday", likes: 18, comments: 4, liked: true, relatedTitle: "Card Shark", relatedXp: 300,
  },
  {
    id: "cp5", userId: "u8", userName: "Lisa Wang", userAvatar: "", userLevel: 6,
    type: "lesson_completed", content: "Stayman is starting to click! 2♣ asking for a 4-card major makes so much sense now.",
    timestamp: "2 days ago", likes: 9, comments: 2, liked: false, relatedTitle: "Stayman Convention", relatedXp: 80,
  },
  {
    id: "cp6", userId: "u5", userName: "Bob Smith", userAvatar: "", userLevel: 7,
    type: "streak", content: "12-day streak and going strong! Never missed a day of practice. 💪",
    timestamp: "2 days ago", likes: 15, comments: 6, liked: false, relatedTitle: "12-Day Streak", relatedXp: 50,
  },
  {
    id: "cp7", userId: "u11", userName: "Petar Jovanovic", userAvatar: "", userLevel: 4,
    type: "milestone", content: "First bridge lesson completed! This is amazing — can't wait to learn more! 🃏",
    timestamp: "3 days ago", likes: 22, comments: 7, liked: true, relatedTitle: "First Lesson", relatedXp: 50,
  },
  {
    id: "cp8", userId: "u7", userName: "Tom Wilson", userAvatar: "", userLevel: 6,
    type: "lesson_completed", content: "Opens leads against notrump — lead longest and strongest. Got it!",
    timestamp: "3 days ago", likes: 7, comments: 1, liked: false, relatedTitle: "Opening Leads", relatedXp: 60,
  },
  {
    id: "cp9", userId: "u4", userName: "Alex Kim", userAvatar: "", userLevel: 8,
    type: "achievement", content: "Unlocked 'Perfect Score' — 100% on the Bidding Quiz! 💯🎯",
    timestamp: "4 days ago", likes: 28, comments: 9, liked: false, relatedTitle: "Perfect Score", relatedXp: 250,
  },
  {
    id: "cp10", userId: "u11", userName: "Petar Jovanovic", userAvatar: "", userLevel: 4,
    type: "streak", content: "3-day streak! The daily challenges are really helping me improve.",
    timestamp: "4 days ago", likes: 11, comments: 3, liked: true, relatedTitle: "3-Day Streak", relatedXp: 30,
  },
];

export const mockPublicProfiles: Record<string, { user: User; stats: UserStats; achievements: Achievement[]; activity: Activity[] }> = {
  "u1": {
    user: { ...mockUser, id: "u1", firstName: "Sarah", lastName: "Chen", level: 12, xp: 4850, xpToNextLevel: 6000, streak: 30, country: "US", experienceLevel: "advanced", completedLessonIds: ["l1", "l2", "l3", "l4", "l5"], currentLessonId: "l6" },
    stats: { ...mockUserStats, completedLessons: 18, totalLessons: 48, averageScore: 91, totalXpEarned: 4850, daysActive: 90, longestStreak: 30, totalHours: 52, cardsPlayed: 8200, correctBids: 412, totalBids: 480 },
    achievements: mockAchievements.map((a) => a.id === "a4" || a.id === "a8" ? { ...a, unlocked: true, unlockedAt: "2026-06-15" } : a),
    activity: [...mockActivity],
  },
  "u3": {
    user: { ...mockUser, id: "u3", firstName: "Emma", lastName: "Rodriguez", level: 9, xp: 3850, xpToNextLevel: 4500, streak: 18, country: "ES", experienceLevel: "intermediate", completedLessonIds: ["l1", "l2", "l3"], currentLessonId: "l4" },
    stats: { ...mockUserStats, completedLessons: 10, totalLessons: 48, averageScore: 85, totalXpEarned: 3850, daysActive: 65, longestStreak: 18, totalHours: 38, cardsPlayed: 5400, correctBids: 278, totalBids: 340 },
    achievements: mockAchievements.map((a) => a.id === "a6" ? { ...a, unlocked: true, unlockedAt: "2026-05-20" } : a),
    activity: [...mockActivity.slice(0, 4)],
  },
};

export const mockExtendedCertificates: Certificate[] = [
  { id: "c1", title: "Bridge Fundamentals", description: "Completed all beginner bridge basics — trick-taking, following suit, basic scoring, and partner communication.", earnedAt: "2026-02-15", episodeId: "ep1", gradient: "from-emerald-500 to-teal-600" },
  { id: "c2", title: "Bidding Basics", description: "Mastered the bidding system including 1NT openings, Stayman, Jacoby Transfers, and major/minor suit openings.", earnedAt: "2026-03-01", episodeId: "ep2", gradient: "from-indigo-500 to-indigo-600" },
  { id: "c3", title: "Declarer Play", description: "Learned finessing, trump management, establishing long suits, and entry management techniques.", earnedAt: "2026-04-10", episodeId: "ep3", gradient: "from-violet-500 to-purple-600" },
  { id: "c4", title: "Defensive Play", description: "Mastered opening leads, third hand play, defensive signaling, count and attitude signals.", earnedAt: "2026-05-22", episodeId: "ep4", gradient: "from-amber-500 to-orange-600" },
];
