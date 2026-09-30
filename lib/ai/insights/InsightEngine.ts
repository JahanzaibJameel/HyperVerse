import { EMPTY_SNAPSHOT, type UserSnapshot } from './types';

/**
 * Intent classification. The engine matches the user's question against these
 * buckets, most specific first, and falls back to `general`.
 *
 * This is intentionally a small, explicit keyword set rather than anything
 * statistical: it has to be predictable, testable, and reviewable, and it runs
 * on device with no model files.
 */
export type Intent =
  | 'routine'
  | 'workout'
  | 'finance'
  | 'health'
  | 'tasks'
  | 'habits'
  | 'progress'
  | 'general';

const INTENT_KEYWORDS: Array<{ intent: Intent; keywords: string[] }> = [
  { intent: 'workout', keywords: ['workout', 'exercise', 'train', 'gym', 'run', 'fitness', 'recovery'] },
  // Checked after workout: "plan my workout" should read as a workout question,
  // and the routine phrases below are specific enough not to swallow it.
  { intent: 'routine', keywords: ['morning routine', 'my routine', 'my day', 'today', 'schedule', 'organise', 'organize'] },
  { intent: 'finance', keywords: ['finance', 'money', 'spend', 'spending', 'budget', 'save', 'saving', 'invest', 'net worth', 'cost'] },
  { intent: 'health', keywords: ['health', 'sleep', 'step', 'steps', 'heart', 'calorie', 'calories', 'hydration', 'water', 'weight', 'bpm'] },
  { intent: 'tasks', keywords: ['task', 'todo', 'to do', 'overdue', 'priority', 'backlog', 'deadline'] },
  { intent: 'habits', keywords: ['habit', 'streak', 'consistency'] },
  { intent: 'progress', keywords: ['progress', 'level', 'xp', 'summary', 'overview', 'report', 'how am i', 'doing'] },
];

export function classifyIntent(message: string): Intent {
  const text = message.toLowerCase();

  for (const { intent, keywords } of INTENT_KEYWORDS) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return intent;
    }
  }

  return 'general';
}

const currency = (value: number): string =>
  `$${Math.round(value).toLocaleString()}`;

const bullet = (text: string): string => `• ${text}`;

/**
 * Generates a grounded answer from the user's own records.
 *
 * Every branch states real numbers read from the database. When the user has no
 * data for the requested topic the answer says so and names the action that
 * would populate it, rather than inventing a plausible-sounding number.
 */
export function generateInsight(
  message: string,
  snapshot: UserSnapshot = EMPTY_SNAPSHOT
): string {
  const intent = classifyIntent(message);
  const data = snapshot ?? EMPTY_SNAPSHOT;

  const hasNoData =
    data.tasks.length === 0 &&
    data.habits.length === 0 &&
    !data.health &&
    !data.finance;

  if (hasNoData) {
    return [
      `I have no records for you yet, so there is nothing to analyse.`,
      ``,
      `Once you add data I can answer properly. Try:`,
      bullet('Create a task under Tasks'),
      bullet('Log a workout on Health'),
      bullet('Add a habit under Habits'),
      bullet('Add a transaction or savings goal on Finance'),
    ].join('\n');
  }

  switch (intent) {
    case 'finance':
      return financeInsight(data);
    case 'health':
      return healthInsight(data);
    case 'workout':
      return workoutInsight(data);
    case 'routine':
      return routineInsight(data);
    case 'tasks':
      return tasksInsight(data);
    case 'habits':
      return habitsInsight(data);
    case 'progress':
      return progressInsight(data);
    default:
      return generalInsight(data, message);
  }
}

function financeInsight(data: UserSnapshot): string {
  const f = data.finance;
  if (!f) {
    return [
      `I have no financial records for you yet.`,
      ``,
      `Add a transaction or a savings goal on the Finance tab and I can break down where your money is going.`,
    ].join('\n');
  }

  const lines: string[] = [`Here is your financial position as recorded:`];

  if (f.income > 0) {
    lines.push(bullet(`Income: ${currency(f.income)}`));
  }
  if (f.expenses > 0) {
    lines.push(bullet(`Spending: ${currency(f.expenses)}`));
  }
  lines.push(bullet(`Net position: ${currency(f.balance)}`));

  if (f.income > 0) {
    lines.push(
      bullet(
        `Savings rate: ${f.savingsRate}% — ${
          f.savingsRate >= 20
            ? 'healthy, above the common 20% benchmark'
            : 'below the common 20% benchmark'
        }`
      )
    );
  }

  if (f.recentTransactions.length > 0) {
    lines.push(``, `Most recent:`);
    for (const tx of f.recentTransactions.slice(0, 3)) {
      const sign = tx.type === 'income' ? '+' : '-';
      lines.push(bullet(`${tx.title}: ${sign}${currency(tx.amount)}`));
    }
  }

  const behind = f.goals.filter((g) => g.target > 0 && g.current < g.target);
  if (behind.length > 0) {
    lines.push(``, `Goals needing attention:`);
    for (const g of behind.slice(0, 3)) {
      const pct = Math.round((g.current / g.target) * 100);
      lines.push(bullet(`${g.title}: ${currency(g.current)} / ${currency(g.target)} (${pct}%)`));
    }
  } else if (f.goals.length > 0) {
    lines.push(``, `All ${f.goals.length} savings goals are fully funded.`);
  }

  if (f.income === 0 && f.expenses === 0) {
    lines.push(``, `You have no transactions recorded, so there is no cash flow to summarise yet.`);
  }

  return lines.join('\n');
}

function healthInsight(data: UserSnapshot): string {
  const h = data.health;
  if (!h) {
    return [
      `I have no health metrics for you yet.`,
      ``,
      `Log a workout or any health reading on the Health tab and I can track trends over time.`,
    ].join('\n');
  }

  const lines: string[] = [`Your latest health readings:`];
  lines.push(bullet(`Steps: ${h.steps.toLocaleString()} / ${h.stepsGoal.toLocaleString()}`));
  lines.push(bullet(`Calories: ${h.calories.toLocaleString()} kcal`));
  lines.push(bullet(`Sleep: ${h.sleepHours.toFixed(1)}h`));
  lines.push(bullet(`Heart rate: ${h.heartRate} bpm`));
  lines.push(bullet(`Workouts: ${h.workouts}`));
  if (h.waterIntake !== null) {
    lines.push(bullet(`Hydration: ${h.waterIntake} units`));
  }

  if (h.history.length >= 2) {
    const recent = h.history.slice(-7);
    const avgSleep = recent.reduce((sum, d) => sum + d.sleepHours, 0) / recent.length;
    const avgSteps = recent.reduce((sum, d) => sum + d.steps, 0) / recent.length;
    lines.push(``, `Across your last ${recent.length} recorded days:`);
    lines.push(bullet(`Average sleep: ${avgSleep.toFixed(1)}h`));
    lines.push(bullet(`Average steps: ${Math.round(avgSteps).toLocaleString()}`));
  }

  const notes: string[] = [];
  if (h.steps > 0 && h.steps >= h.stepsGoal) notes.push('you have hit your step goal');
  if (h.sleepHours > 0 && h.sleepHours < 7) notes.push('sleep is below 7h, which affects recovery');
  if (h.sleepHours >= 8) notes.push('sleep is at a level that supports good recovery');
  if (h.heartRate > 100) notes.push('resting heart rate is elevated, worth tracking over time');

  if (notes.length > 0) {
    lines.push(``, `Worth noting: ${notes.join('; ')}.`);
  }

  return lines.join('\n');
}

function workoutInsight(data: UserSnapshot): string {
  const h = data.health;

  if (!h || h.workouts === 0) {
    return [
      `You have no workouts recorded.`,
      ``,
      `Start with something short and consistent rather than a long session. Once you log a workout, I can use your recovery data to suggest when to push and when to rest.`,
    ].join('\n');
  }

  const lines: string[] = [`You have logged ${h.workouts} workout${h.workouts === 1 ? '' : 's'}.`];

  if (h.sleepHours > 0) {
    const ready = h.sleepHours >= 7;
    lines.push(
      bullet(
        `Recovery signal: ${h.sleepHours.toFixed(1)}h sleep — ${
          ready ? 'you are likely recovered enough to train' : 'below 7h, so favour a lighter session'
        }`
      )
    );
  }

  if (h.heartRate > 0) {
    lines.push(bullet(`Heart rate at last reading: ${h.heartRate} bpm`));
  }

  lines.push(``, `Based on what is actually recorded, keep the next session moderate and re-check sleep before increasing load.`);
  return lines.join('\n');
}

function routineInsight(data: UserSnapshot): string {
  const lines: string[] = [`Here is a routine built from your real data:`];
  const open = data.tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress');
  const overdue = open.filter((t) => t.isOverdue);

  if (overdue.length > 0) {
    lines.push(bullet(`Start with the ${overdue.length} overdue task${overdue.length === 1 ? '' : 's'} — these are the highest cost to leave open`));
  }
  if (open.length > overdue.length) {
    const rest = open.filter((t) => !t.isOverdue);
    const high = rest.filter((t) => t.priority === 'high' || t.priority === 'urgent');
    lines.push(
      bullet(
        high.length > 0
          ? `Then take the ${high.length} high or urgent task${high.length === 1 ? '' : 's'} next`
          : `Then work through your ${rest.length} remaining open task${rest.length === 1 ? '' : 's'}`
      )
    );
  }
  if (open.length === 0) {
    lines.push(bullet('You have no open tasks, so the day is clear for deeper work'));
  }

  const pendingHabits = data.habits.filter((h) => !h.completedToday);
  if (pendingHabits.length > 0) {
    lines.push(
      bullet(
        `Before you finish: ${pendingHabits.length} habit${pendingHabits.length === 1 ? '' : 's'} still open today (${pendingHabits
          .slice(0, 3)
          .map((h) => h.title)
          .join(', ')})`
      )
    );
  }

  if (data.health) {
    if (data.health.sleepHours > 0 && data.health.sleepHours < 7) {
      lines.push(bullet('Protect an earlier bedtime tonight — your sleep is currently under 7h'));
    } else {
      lines.push(bullet('Your sleep is in a good range, so schedule demanding work earlier in the day'));
    }
  }

  if (data.streak > 0) {
    lines.push(bullet(`You are on a ${data.streak} day streak — keep it alive`));
  }

  return lines.join('\n');
}

function tasksInsight(data: UserSnapshot): string {
  if (data.tasks.length === 0) {
    return [
      `You have no tasks yet.`,
      ``,
      `Create one from the Tasks tab and I can help you prioritise it.`,
    ].join('\n');
  }

  const open = data.tasks.filter((t) => t.status === 'todo' || t.status === 'in_progress');
  const done = data.tasks.filter((t) => t.status === 'completed');
  const overdue = open.filter((t) => t.isOverdue);
  const byPriority = { urgent: 0, high: 0, medium: 0, low: 0 };
  for (const t of open) byPriority[t.priority] += 1;

  const lines: string[] = [
    `You have ${data.tasks.length} task${data.tasks.length === 1 ? '' : 's'}: ${open.length} open, ${done.length} completed.`,
  ];

  if (overdue.length > 0) {
    lines.push(``, `Overdue (${overdue.length}):`);
    for (const t of overdue.slice(0, 5)) lines.push(bullet(`${t.title} (${t.priority})`));
  }

  lines.push(``, `Open by priority:`);
  lines.push(bullet(`Urgent: ${byPriority.urgent}`));
  lines.push(bullet(`High: ${byPriority.high}`));
  lines.push(bullet(`Medium: ${byPriority.medium}`));
  lines.push(bullet(`Low: ${byPriority.low}`));

  const availableXp = open.reduce((sum, t) => sum + t.xpReward, 0);
  if (availableXp > 0) {
    lines.push(``, `Completing everything open is worth ${availableXp} XP.`);
  }

  return lines.join('\n');
}

function habitsInsight(data: UserSnapshot): string {
  if (data.habits.length === 0) {
    return [
      `You have no habits set up.`,
      ``,
      `Add one from the Habits tab. Starting with a single daily habit is more effective than adding five at once.`,
    ].join('\n');
  }

  const doneToday = data.habits.filter((h) => h.completedToday);
  const lines: string[] = [
    `You track ${data.habits.length} habit${data.habits.length === 1 ? '' : 's'}. Today: ${doneToday.length}/${data.habits.length} complete.`,
    ``,
  ];

  for (const h of data.habits) {
    const mark = h.completedToday ? 'done' : 'open';
    lines.push(bullet(`${h.title} — ${mark}, streak ${h.currentStreak} (best ${h.bestStreak})`));
  }

  const atRisk = data.habits.filter((h) => h.currentStreak > 0 && !h.completedToday);
  if (atRisk.length > 0) {
    lines.push(
      ``,
      `${atRisk.map((h) => h.title).join(', ')} ${atRisk.length === 1 ? 'has' : 'have'} an active streak at risk today.`
    );
  }

  return lines.join('\n');
}

function progressInsight(data: UserSnapshot): string {
  const lines: string[] = [`Progress summary:`];
  lines.push(bullet(`Level ${data.level}${data.streak > 0 ? `, ${data.streak} day streak` : ''}`));

  const done = data.tasks.filter((t) => t.status === 'completed');
  if (data.tasks.length > 0) {
    const pct = Math.round((done.length / data.tasks.length) * 100);
    lines.push(bullet(`Tasks: ${done.length}/${data.tasks.length} complete (${pct}%)`));
  }

  const doneHabits = data.habits.filter((h) => h.completedToday);
  if (data.habits.length > 0) {
    lines.push(bullet(`Habits today: ${doneHabits.length}/${data.habits.length}`));
  }

  if (data.health) {
    lines.push(
      bullet(`Health: ${data.health.steps.toLocaleString()} steps, ${data.health.sleepHours.toFixed(1)}h sleep, ${data.health.workouts} workouts`)
    );
  }

  if (data.finance) {
    lines.push(
      bullet(`Finance: ${currency(data.finance.income)} in, ${currency(data.finance.expenses)} out, ${data.finance.savingsRate}% saved`)
    );
  }

  return lines.join('\n');
}

function generalInsight(data: UserSnapshot, message: string): string {
  const topic = message.trim().replace(/\?+$/, '') || 'that';

  const lines: string[] = [
    `I do not have a specific analysis for "${topic}", but here is what your records actually show:`,
    ``,
  ];
  lines.push(progressInsight(data));
  lines.push(``, `Ask me about your finances, health, tasks, habits, or progress and I will break down the relevant numbers.`);
  return lines.join('\n');
}
