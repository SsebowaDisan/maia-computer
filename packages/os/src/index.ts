// App management
export { AppRegistry } from './app/AppRegistry'
export { SessionStore } from './app/SessionStore'
export { loadManifests } from './app/AppManifest'
export type { WebContainerAPI, WebContainerConfig, DOMElement } from './app/WebContainer'

// Intelligence Layer (Kernel)
export { NetworkBrain } from './kernel/NetworkBrain'
export { DOMBrain } from './kernel/DOMBrain'
export { VisionBrain } from './kernel/VisionBrain'
export { IntelligenceRouter } from './kernel/IntelligenceRouter'
export { PageScraper } from './kernel/PageScraper'
export { SearchIndex } from './kernel/SearchIndex'

// Brain
export { Brain } from './brain/Brain'
export { TaskPlanner } from './brain/TaskPlanner'
export { ActionDecider } from './brain/ActionDecider'
export { SelfHealer } from './brain/SelfHealer'
export { CostTracker } from './brain/CostTracker'
export { Orchestrator } from './brain/Orchestrator'
export { buildPersonalityPrompt, getPersonality } from './brain/AgentPersonality'
export { NavigationMemory } from './brain/NavigationMemory'

// LLM
export { OpenAIAdapter } from './llm/OpenAIAdapter'
export { ClaudeAdapter } from './llm/ClaudeAdapter'
export { ProviderRegistry } from './llm/ProviderRegistry'
export type { LLMProvider, LLMMessage, LLMOptions, LLMResponse } from './llm/LLMProvider'

// Events
export { EventBus } from './events/EventBus'
export { EventLogger } from './events/EventLogger'

// Communication
export { MessageBus } from './communication/MessageBus'
export { MessageHistory } from './communication/MessageHistory'
export { classifyIntent, classifyIntentWithLLM, isTakeoverRequest, isResumeRequest } from './communication/IntentClassifier'

// Recording
export { Recorder } from './recording/Recorder'
export { VerifiedRegistry } from './recording/VerifiedRegistry'
