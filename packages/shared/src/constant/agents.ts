export interface AgentProfile {
  id: string
  name: string
  icon: string
  color: string
  role: string
  priority: string
  style: string
}

export const AGENT_PROFILES: Record<string, AgentProfile> = {
  research: {
    id: 'research',
    name: 'Research',
    icon: '🔍',
    color: '#60A5FA',
    role: 'Information gathering',
    priority: 'Thoroughness, broad coverage',
    style: 'Casts a wide net. Sometimes too broad.',
  },
  analyst: {
    id: 'analyst',
    name: 'Analyst',
    icon: '📊',
    color: '#A78BFA',
    role: 'Critical evaluation, data analysis',
    priority: 'Accuracy, precision',
    style: 'Challenges assumptions. Questions sources.',
  },
  travel: {
    id: 'travel',
    name: 'Travel',
    icon: '✈️',
    color: '#34D399',
    role: 'Travel booking and logistics',
    priority: 'Price, convenience, availability',
    style: 'Practical, deal-focused.',
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    icon: '📅',
    color: '#FBBF24',
    role: 'Schedule management',
    priority: 'Time conflicts, availability',
    style: 'Protective of peoples time.',
  },
  budget: {
    id: 'budget',
    name: 'Budget',
    icon: '💰',
    color: '#F87171',
    role: 'Financial oversight',
    priority: 'Spending limits, policy compliance',
    style: 'Conservative, risk-aware.',
  },
  email: {
    id: 'email',
    name: 'Email',
    icon: '📧',
    color: '#38BDF8',
    role: 'Email communication',
    priority: 'Tone, recipients, timing',
    style: 'Careful, professional.',
  },
  policy: {
    id: 'policy',
    name: 'Policy',
    icon: '📋',
    color: '#FB923C',
    role: 'Rules and compliance',
    priority: 'Policy adherence',
    style: 'Strict, by-the-book.',
  },
} as const

export const USER_PROFILE = {
  id: 'user',
  name: 'You',
  icon: '👤',
  color: '#E5E5E5',
} as const
