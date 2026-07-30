import {
  User, Lesson, Achievement, Testimonial, Feature,
  Activity, Episode, DailyMission, UserStats,
  QuizQuestion, Certificate, CardHand, LessonContent,
  DailyChallengeData, XpEntry,
} from "@/types";

export const mockUser: User = {
  id: "user-1",
  firstName: "Bob",
  lastName: "Smith",
  email: "bob@bridgecoach.com",
  avatar: "",
  level: 7,
  xp: 2450,
  xpToNextLevel: 3000,
  streak: 12,
  joinedAt: "2026-01-15",
  country: "US",
  experienceLevel: "intermediate",
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
  { id: "c2", title: "Bidding Basics", description: "Mastered the bidding system", earnedAt: "2026-03-01", episodeId: "ep2", gradient: "from-blue-500 to-indigo-600" },
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
    duration: "8 min", xpReward: 50, completed: true, locked: false, category: "Basics", episodeId: "ep1",
    content: lessonContent1, hasCards: true, cards: mockHand1(), bookmarked: true,
  },
  {
    id: "l2", title: "Opening Leads", description: "Master the art of the first card",
    duration: "10 min", xpReward: 60, completed: true, locked: false, category: "Basics", episodeId: "ep1",
    content: lessonContent2, hasCards: true, cards: mockHand2(), bookmarked: false,
  },
  {
    id: "l3", title: "NT Opening Bids", description: "When and how to open 1NT",
    duration: "12 min", xpReward: 70, completed: false, locked: false, category: "Bidding", episodeId: "ep2",
    content: lessonContent3, hasCards: true, cards: mockHand3(), bookmarked: false,
  },
  {
    id: "l4", title: "Stayman Convention", description: "Find major suit fits after 1NT",
    duration: "15 min", xpReward: 80, completed: false, locked: false, category: "Bidding", episodeId: "ep2",
    content: lessonContent4, hasCards: true, cards: mockHand4(), bookmarked: true,
  },
  {
    id: "l5", title: "Transfers", description: "Jacoby transfers explained",
    duration: "14 min", xpReward: 75, completed: false, locked: false, category: "Bidding", episodeId: "ep2",
    content: lessonContent5, hasCards: true, cards: mockHand5(), bookmarked: false,
  },
  { id: "l6", title: "Finessing Techniques", description: "Win tricks with finesses",
    duration: "11 min", xpReward: 65, completed: false, locked: true, category: "Play", episodeId: "ep3",
    content: [], hasCards: false, bookmarked: false,
  },
  { id: "l7", title: "Defensive Signals", description: "Communicate with partner",
    duration: "13 min", xpReward: 70, completed: false, locked: true, category: "Defense", episodeId: "ep4",
    content: [], hasCards: false, bookmarked: false,
  },
  { id: "l8", title: "Trump Management", description: "Handle trump suits effectively",
    duration: "16 min", xpReward: 85, completed: false, locked: true, category: "Play", episodeId: "ep3",
    content: [], hasCards: false, bookmarked: false,
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
    locked: false, gradient: "from-blue-500 to-indigo-600", icon: "♣",
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
    correctIndex: 1,
    explanation: "With only 14 HCP you don't have enough for 1NT (15-17). Open your longest suit or pass if below opening strength.",
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
    cardOptions: ["♠A", "♠K", "♠Q", "♠J", "♠10", "♥A", "♥K", "♥Q", "♥J", "♥10", "♦A", "♦K", "♦Q", "♦J", "♦10", "♣A", "♣K", "♣Q", "♣J", "♣10"],
    correctCards: ["♠A", "♠J", "♠3", "♥K", "♥Q", "♥7", "♦A", "♦8", "♦4", "♣K", "♣J", "♣5"],
    explanation: "♠AJ3 ♥KQ7 ♦A84 ♣KJ5 — 16 HCP, 4-3-3-2 balanced. Perfect for 1NT!",
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
