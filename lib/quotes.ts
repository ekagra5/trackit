const QUOTES = [
  { text: "We are what we repeatedly do. Excellence, then, is not an act but a habit.", author: "Aristotle" },
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Motivation gets you started. Habit keeps you going.", author: "Jim Ryun" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "You don't have to be great to start, but you have to start to be great.", author: "Zig Ziglar" },
  { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
  { text: "Action is the foundational key to all success.", author: "Pablo Picasso" },
  { text: "The difference between who you are and who you want to be is what you do.", author: "Unknown" },
  { text: "Every day is a new beginning. Take a deep breath, smile and start again.", author: "Unknown" },
  { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "The journey of a thousand miles begins with one step.", author: "Lao Tzu" },
  { text: "Progress, not perfection.", author: "Unknown" },
  { text: "Show up every day. That's all it takes.", author: "Unknown" },
  { text: "Don't count the days, make the days count.", author: "Muhammad Ali" },
  { text: "Your future is created by what you do today, not tomorrow.", author: "Robert Kiyosaki" },
  { text: "A habit is a cable; we weave a thread each day and it becomes strong.", author: "Horace Mann" },
  { text: "First forget inspiration. Habit is more dependable.", author: "Octavia Butler" },
  { text: "Good habits formed at youth make all the difference.", author: "Aristotle" },
  { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin" },
  { text: "The chains of habit are too light to be felt until they are too heavy to be broken.", author: "Warren Buffett" },
  { text: "Start where you are. Use what you have. Do what you can.", author: "Arthur Ashe" },
  { text: "One day or day one — you decide.", author: "Unknown" },
  { text: "Be consistent. Be patient. Be committed.", author: "Unknown" },
  { text: "You are one decision away from a completely different life.", author: "Unknown" },
  { text: "The only bad workout is the one that didn't happen.", author: "Unknown" },
  { text: "Discipline is the bridge between goals and accomplishment.", author: "Jim Rohn" },
  { text: "Success is built one habit at a time.", author: "Unknown" },
  { text: "The secret to change is to focus all your energy on building the new.", author: "Socrates" },
];

export function getTodayQuote(): { text: string; author: string } {
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
  );
  return QUOTES[dayOfYear % QUOTES.length];
}
