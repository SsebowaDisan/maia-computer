import type { AgentPersonalityConfig } from '../type/orchestrator'

export interface AgentProfile {
  id: string
  name: string
  icon: string
  color: string
  role: string
  priority: string
  style: string
  expertise: string[]
}

export const AGENT_PROFILES: Record<string, AgentProfile> = {
  research: {
    id: 'research',
    name: 'Research',
    icon: '🔍',
    color: '#60A5FA',
    role: 'Information gathering and web search',
    priority: 'Thoroughness, broad coverage',
    style: 'Casts a wide net. Sometimes too broad.',
    expertise: ['web search', 'comparison', 'fact-checking', 'data gathering'],
  },
  analyst: {
    id: 'analyst',
    name: 'Analyst',
    icon: '📊',
    color: '#A78BFA',
    role: 'Critical evaluation and data analysis',
    priority: 'Accuracy, precision',
    style: 'Challenges assumptions. Questions sources.',
    expertise: ['spreadsheets', 'data analysis', 'charts', 'numbers'],
  },
  travel: {
    id: 'travel',
    name: 'Travel',
    icon: '✈️',
    color: '#34D399',
    role: 'Travel booking and logistics',
    priority: 'Price, convenience, availability',
    style: 'Practical, deal-focused.',
    expertise: ['flights', 'hotels', 'itineraries', 'visas', 'transportation'],
  },
  calendar: {
    id: 'calendar',
    name: 'Calendar',
    icon: '📅',
    color: '#FBBF24',
    role: 'Schedule management and time coordination',
    priority: 'Time conflicts, availability',
    style: 'Protective of peoples time.',
    expertise: ['scheduling', 'meetings', 'timezones', 'availability'],
  },
  budget: {
    id: 'budget',
    name: 'Budget',
    icon: '💰',
    color: '#F87171',
    role: 'Financial oversight and cost tracking',
    priority: 'Spending limits, policy compliance',
    style: 'Conservative, risk-aware.',
    expertise: ['expenses', 'budgets', 'policy limits', 'cost comparison'],
  },
  email: {
    id: 'email',
    name: 'Email',
    icon: '📧',
    color: '#38BDF8',
    role: 'Email communication and drafting',
    priority: 'Tone, recipients, timing',
    style: 'Careful, professional.',
    expertise: ['email composition', 'tone', 'recipients', 'follow-ups'],
  },
  policy: {
    id: 'policy',
    name: 'Policy',
    icon: '📋',
    color: '#FB923C',
    role: 'Rules, compliance, and documentation',
    priority: 'Policy adherence',
    style: 'Strict, by-the-book.',
    expertise: ['company policy', 'compliance', 'approvals', 'documentation'],
  },
}

export const USER_PROFILE = {
  id: 'user',
  name: 'You',
  icon: '👤',
  color: '#E5E5E5',
} as const
