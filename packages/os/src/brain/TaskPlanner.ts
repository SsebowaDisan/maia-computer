import type { PlanStep } from '@maia/shared'
import { PLAN_STEP_STATUS } from '@maia/shared'
import type { ProviderRegistry } from '../llm/ProviderRegistry'
import type { EventBus } from '../events/EventBus'

const PLAN_PROMPT = `break this task into steps for a computer that controls a web browser. it can type, click links, press keys, scroll, go back, and read page content. the browser is already open on google.com.

the agent researches like a thorough human:
- always check at least 5 different web pages/sources before answering
- read the actual page content on each page — scroll through it fully
- save detailed notes and content from each page to research memory
- the research memory content will be used later (e.g., to write reports in google docs)
- share a detailed, well-structured answer at the end

IMPORTANT: when clicking search results, the agent must click the LINK TEXT (e.g. "Machine learning - Wikipedia") not a CSS selector. search results are clickable links with descriptive titles.

<examples>
<example>
<task>weather in kampala</task>
<plan>[{"step":1,"description":"type 'weather kampala' in the google search box and press Enter","output":"search results page with weather widget"},{"step":2,"description":"read the weather data from google's featured widget or click a weather site","output":"weather details extracted"},{"step":3,"description":"share a detailed weather summary including temperature, conditions, humidity, and forecast with the team","output":"weather info shared"}]</plan>
</example>
<example>
<task>what is machine learning</task>
<plan>[{"step":1,"description":"type 'what is machine learning' in the google search box and press Enter","output":"search results page"},{"step":2,"description":"click Wikipedia article, scroll through full page, extract definition, types, history, and applications — save all content to research memory","output":"wikipedia content saved to research memory"},{"step":3,"description":"go back to search results, click IBM or Google AI article, scroll through, extract their explanation and examples — save to research memory","output":"second source content saved"},{"step":4,"description":"go back, click a third source like MIT or Stanford for academic perspective, scroll and extract — save to research memory","output":"third source content saved"},{"step":5,"description":"go back, click a fourth source — a tech blog or tutorial for practical examples, scroll and extract","output":"fourth source content saved"},{"step":6,"description":"go back, click a fifth source for any missing angles, scroll and extract","output":"fifth source content saved"},{"step":7,"description":"share a comprehensive explanation with the team — include definition, types, examples, history, and applications from all 5 sources","output":"detailed explanation shared with full research"}]</plan>
</example>
<example>
<task>who is the CEO of stripe</task>
<plan>[{"step":1,"description":"type 'CEO of Stripe' in the google search box and press Enter","output":"search results with featured snippet"},{"step":2,"description":"read the featured snippet then click the Wikipedia or Stripe page for full background","output":"CEO name and background found"},{"step":3,"description":"verify on a second source — click a Forbes or Bloomberg article about the CEO","output":"info cross-referenced"},{"step":4,"description":"share the CEO name, age, background, education, achievements, and company history with the team","output":"detailed bio shared"}]</plan>
</example>
<example>
<task>compare notion vs coda pricing</task>
<plan>[{"step":1,"description":"type 'notion pricing 2026' in the google search box and press Enter","output":"search results"},{"step":2,"description":"click the official Notion pricing page and read every plan tier with features and prices","output":"notion pricing saved to research memory"},{"step":3,"description":"go back, type 'coda pricing 2026' in the search box and press Enter","output":"coda search results"},{"step":4,"description":"click the official Coda pricing page and read every plan tier with features and prices","output":"coda pricing saved to research memory"},{"step":5,"description":"share a detailed side-by-side comparison table with prices, features, pros and cons, and a recommendation","output":"comparison shared"}]</plan>
</example>
<example>
<task>best hotels in brussels</task>
<plan>[{"step":1,"description":"type 'best hotels brussels 2026' in the google search box and press Enter","output":"search results with hotel listings"},{"step":2,"description":"click the Booking.com or TripAdvisor result and extract top hotels with prices, ratings, and locations","output":"hotel data from first source saved"},{"step":3,"description":"go back and click a second source for cross-referencing reviews and rankings","output":"hotel data from second source saved"},{"step":4,"description":"share a ranked list of top hotels with prices, ratings, locations, pros and cons from both sources","output":"hotel recommendations shared"}]</plan>
</example>
<example>
<task>how to make pasta carbonara</task>
<plan>[{"step":1,"description":"type 'authentic pasta carbonara recipe' in the google search box and press Enter","output":"search results with recipe sites"},{"step":2,"description":"click a reputable recipe source like Bon Appétit or Serious Eats and read the full recipe","output":"recipe details extracted"},{"step":3,"description":"go back and check a second source to compare techniques and tips","output":"alternative recipe read"},{"step":4,"description":"share the complete recipe with ingredients, step-by-step instructions, tips, and common mistakes to avoid","output":"full recipe shared"}]</plan>
</example>
<example>
<task>latest news about AI</task>
<plan>[{"step":1,"description":"type 'latest AI news today 2026' in the google search box and press Enter","output":"search results with news articles"},{"step":2,"description":"click a top news source like Reuters, BBC, or TechCrunch and read the main stories","output":"first source news extracted"},{"step":3,"description":"go back and click a second news source for broader coverage","output":"second source news extracted"},{"step":4,"description":"share a news briefing with the top 3-5 AI stories, what happened, and why it matters","output":"news summary shared"}]</plan>
</example>
<example>
<task>best wireless headphones under $300</task>
<plan>[{"step":1,"description":"type 'best wireless headphones under $300 2026' in the google search box and press Enter","output":"search results with reviews and comparisons"},{"step":2,"description":"click a tech review site like RTINGS, Wirecutter, or Tom's Guide and read their top picks","output":"first review source data saved"},{"step":3,"description":"go back and click a second review source for another perspective","output":"second review source data saved"},{"step":4,"description":"share a ranked recommendation with model names, prices, pros, cons, and best-for categories","output":"headphone recommendations shared"}]</plan>
</example>
</examples>

rules:
- plans should be 4-5 steps for simple questions, 6-8 for research tasks
- step 1 is ALWAYS: type the search query and press Enter
- always include at least 5 source visits before the final summary
- on each source: scroll through the full page, extract key content, save to research memory
- the agent must SAVE page content in research memory — this content is reused later for reports, emails, etc.
- the LAST step must always be sharing a DETAILED answer with the team
- mention "research memory" in output descriptions so the agent knows to store findings

respond with json array only.`

export class TaskPlanner {
  private readonly llm: ProviderRegistry
  private readonly eventBus: EventBus

  constructor(llm: ProviderRegistry, eventBus: EventBus) {
    this.llm = llm
    this.eventBus = eventBus
  }

  async createPlan(taskDescription: string): Promise<PlanStep[]> {
    const response = await this.llm.sendMessage([
      { role: 'system', content: PLAN_PROMPT },
      { role: 'user', content: taskDescription },
    ], { maxTokens: 2048, temperature: 0.5 })

    const rawSteps = this.parseSteps(response.content)

    const plan: PlanStep[] = rawSteps.map((raw) => ({
      step: raw.step,
      description: raw.description,
      status: PLAN_STEP_STATUS.PENDING,
      contract: {
        output: raw.output,
      },
    }))

    this.eventBus.publish({
      type: 'brain.plan_created',
      steps: plan,
      timestamp: Date.now(),
    })

    return plan
  }

  updateStepStatus(plan: PlanStep[], stepIndex: number, status: PlanStep['status']): void {
    const step = plan[stepIndex]
    if (step) {
      step.status = status
      this.eventBus.publish({
        type: 'brain.plan_updated',
        stepIndex,
        status,
        timestamp: Date.now(),
      })
    }
  }

  private parseSteps(content: string): Array<{ step: number; description: string; output: string }> {
    // Extract JSON from the response (may be wrapped in markdown code blocks)
    const jsonMatch = content.match(/\[[\s\S]*\]/)
    if (!jsonMatch) {
      throw new Error('Failed to parse plan: no JSON array found in response')
    }

    const parsed = JSON.parse(jsonMatch[0]) as Array<{
      step: number
      description: string
      output: string
    }>

    if (!Array.isArray(parsed) || parsed.length === 0) {
      throw new Error('Failed to parse plan: empty or invalid array')
    }

    return parsed
  }
}
