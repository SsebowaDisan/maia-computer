import type { AgentCapability, AgentPersonalityConfig } from '../type/orchestrator'

export interface AgentProfile {
  id: string
  name: string
  icon: string
  color: string
  role: string
  priority: string
  style: string
  expertise: string[]
  capability: AgentCapability
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
    capability: {
      domains: ['web search', 'information', 'facts', 'comparison', 'verification', 'news', 'general knowledge'],
      verbs: ['search', 'find', 'compare', 'verify', 'check', 'look up', 'research'],
      apps: ['chrome', 'google.search'],
      complexity: 'multi-step',
    },
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
    capability: {
      domains: ['data', 'numbers', 'statistics', 'charts', 'spreadsheets', 'trends', 'benchmarks'],
      verbs: ['analyze', 'compare', 'calculate', 'evaluate', 'interpret', 'chart', 'measure'],
      apps: ['google.sheets', 'airtable', 'notion'],
      complexity: 'analytical',
    },
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
    capability: {
      domains: ['flights', 'hotels', 'transportation', 'visas', 'itineraries', 'accommodation', 'travel'],
      verbs: ['book', 'search', 'compare', 'reserve', 'cancel', 'find'],
      apps: ['google.flights', 'booking.com', 'expedia', 'airbnb', 'tripadvisor'],
      complexity: 'multi-step',
    },
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
    capability: {
      domains: ['scheduling', 'meetings', 'availability', 'timezones', 'dates', 'events', 'conflicts'],
      verbs: ['schedule', 'check', 'block', 'move', 'cancel', 'find time'],
      apps: ['google.calendar', 'outlook.calendar'],
      complexity: 'single-step',
    },
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
    capability: {
      domains: ['expenses', 'costs', 'pricing', 'budgets', 'invoices', 'spending', 'money'],
      verbs: ['track', 'compare', 'calculate', 'approve', 'report', 'flag'],
      apps: ['google.sheets', 'airtable', 'quickbooks'],
      complexity: 'analytical',
    },
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
    capability: {
      domains: ['email', 'communication', 'drafts', 'replies', 'follow-ups', 'messages'],
      verbs: ['compose', 'reply', 'forward', 'search', 'organize', 'send', 'draft'],
      apps: ['google.gmail', 'outlook'],
      complexity: 'single-step',
    },
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
    capability: {
      domains: ['policy', 'compliance', 'approvals', 'rules', 'documentation', 'audit'],
      verbs: ['check', 'verify', 'approve', 'flag', 'document', 'review'],
      apps: ['notion', 'google.docs'],
      complexity: 'single-step',
    },
  },
}

export const USER_PROFILE = {
  id: 'user',
  name: 'You',
  icon: '👤',
  color: '#E5E5E5',
} as const
