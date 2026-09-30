import { classifyIntent, generateInsight } from '@/lib/ai/insights/InsightEngine';
import { EMPTY_SNAPSHOT, type UserSnapshot } from '@/lib/ai/insights/types';

const baseSnapshot: UserSnapshot = {
  name: 'Sam',
  level: 4,
  streak: 6,
  tasks: [
    { title: 'Ship release', status: 'todo', priority: 'urgent', category: 'work', isOverdue: true, dueDate: 1, xpReward: 100 },
    { title: 'Write docs', status: 'in_progress', priority: 'high', category: 'work', isOverdue: false, dueDate: null, xpReward: 50 },
    { title: 'Old thing', status: 'completed', priority: 'low', category: 'work', isOverdue: false, dueDate: null, xpReward: 20 },
  ],
  habits: [
    { title: 'Read', frequency: 'daily', currentStreak: 3, bestStreak: 9, completedToday: true },
    { title: 'Stretch', frequency: 'daily', currentStreak: 4, bestStreak: 4, completedToday: false },
  ],
  health: {
    steps: 9500,
    stepsGoal: 10000,
    calories: 2100,
    sleepHours: 7.5,
    heartRate: 65,
    workouts: 3,
    waterIntake: 6,
    history: [
      { date: 1, sleepHours: 7, steps: 8000 },
      { date: 2, sleepHours: 8, steps: 11000 },
    ],
  },
  finance: {
    income: 5000,
    expenses: 3200,
    balance: 1800,
    savings: 400,
    savingsRate: 36,
    goals: [{ title: 'Emergency', current: 600, target: 3000 }],
    recentTransactions: [{ title: 'Salary', amount: 5000, type: 'income', date: 1 }],
  },
  recordedAt: 1_000,
};

describe('classifyIntent', () => {
  it.each([
    ['analyse my finances', 'finance'],
    ['how much did I spend', 'finance'],
    ['how did I sleep', 'health'],
    ['what are my steps', 'health'],
    ['which tasks are overdue', 'tasks'],
    ['show me my todo list', 'tasks'],
    ['how are my habits', 'habits'],
    ['what should I do today', 'routine'],
    ['plan my workout', 'workout'],
    ['how am I doing', 'progress'],
    ['what is the weather', 'general'],
  ])('classifies %j as %j', (message, expected) => {
    expect(classifyIntent(message)).toBe(expected);
  });
});

describe('generateInsight', () => {
  it('tells the user when there is no data rather than inventing numbers', () => {
    const out = generateInsight('analyse my finances', EMPTY_SNAPSHOT);
    expect(out).toMatch(/no records for you yet/i);
    expect(out).toContain('Create a task under Tasks');
  });

  it('reports real income, spending and savings rate for a finance question', () => {
    const out = generateInsight('analyse my finances', baseSnapshot);
    expect(out).toContain('$5,000');
    expect(out).toContain('$3,200');
    expect(out).toContain('36%');
  });

  it('names goals that are behind target with their percentage', () => {
    const out = generateInsight('finances', baseSnapshot);
    expect(out).toContain('Emergency');
    expect(out).toContain('20%');
  });

  it('reports real health figures', () => {
    const out = generateInsight('how did I sleep', baseSnapshot);
    expect(out).toContain('9,500');
    expect(out).toContain('7.5h');
    expect(out).toContain('65 bpm');
  });

  it('averages sleep across recorded days', () => {
    const out = generateInsight('health trends', baseSnapshot);
    expect(out).toContain('last 2 recorded days');
    expect(out).toContain('7.5h'); // (7 + 8) / 2
  });

  it('lists overdue tasks by name for a tasks question', () => {
    const out = generateInsight('which tasks are overdue', baseSnapshot);
    expect(out).toContain('Ship release');
    expect(out).not.toContain('Write docs\n');
  });

  it('breaks open tasks down by priority', () => {
    const out = generateInsight('my tasks', baseSnapshot);
    expect(out).toContain('Urgent: 1');
    expect(out).toContain('High: 1');
    expect(out).toContain('Low: 0');
  });

  it('sums available XP across open tasks', () => {
    const out = generateInsight('my tasks', baseSnapshot);
    expect(out).toContain('150 XP');
  });

  it('flags a habit with an active streak that is not done today', () => {
    const out = generateInsight('how are my habits', baseSnapshot);
    expect(out).toContain('1/2 complete');
    expect(out).toMatch(/Stretch has an active streak at risk/);
  });

  it('leads the day plan with overdue work', () => {
    const out = generateInsight('what should I do today', baseSnapshot);
    expect(out).toContain('1 overdue task');
    expect(out).toContain('high or urgent');
    expect(out).toContain('6 day streak');
  });

  it('does not invent a workout plan when nothing is logged', () => {
    const noWorkout: UserSnapshot = {
      ...baseSnapshot,
      health: { ...baseSnapshot.health!, workouts: 0 },
    };
    const out = generateInsight('plan my workout', noWorkout);
    expect(out).toMatch(/no workouts recorded/i);
  });

  it('uses recovery data to advise when workouts exist', () => {
    const out = generateInsight('workout', baseSnapshot);
    expect(out).toContain('3 workouts');
    expect(out).toContain('7.5h sleep');
    expect(out).toMatch(/recovered enough to train/);
  });

  it('warns about low sleep in the routine', () => {
    const tired: UserSnapshot = {
      ...baseSnapshot,
      health: { ...baseSnapshot.health!, sleepHours: 5.5 },
    };
    const out = generateInsight('plan my day', tired);
    expect(out).toMatch(/sleep is currently under 7h/i);
  });

  it('falls back to a progress summary for unrecognised questions', () => {
    const out = generateInsight('tell me a joke', baseSnapshot);
    expect(out).toContain('tell me a joke');
    expect(out).toContain('Progress summary');
    expect(out).toContain('Level 4');
  });

  it('always returns a non-empty string for every intent', () => {
    const intents = ['finance', 'health', 'workout', 'routine', 'tasks', 'habits', 'progress', 'anything'];
    for (const intent of intents) {
      const out = generateInsight(intent, baseSnapshot);
      expect(typeof out).toBe('string');
      expect(out.length).toBeGreaterThan(0);
    }
  });
});
