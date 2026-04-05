import type { PlanStep } from '@maia/shared'
import type { ProviderRegistry } from '../llm/ProviderRegistry'

const DECIDE_PROMPT = `you control web apps inside maia computer. you pick one action per turn, then tell the team what you found.

actions you can take:
- click(target) — css selector or the visible text of the element
- type(target, value) — type into an input. target is a css selector
- scroll("down" / "up" / css-selector) — scroll the page
- press_key(key) — Enter, Tab, Escape, etc.
- go_back() — return to the previous page (target is ignored, use "back")

CRITICAL — read the "Visible page text" section carefully. if the answer is already there, set action to null, step_complete to true, and put the answer in teamMessage. do NOT search again if you already have the answer.

how to navigate:
- search results page: pick the most relevant result and click it
- article page: READ THE TEXT. if you can see the answer → report it (action: null, step_complete: true)
- if the page doesn't have the answer: go_back() and try another result
- after typing in a search box: press_key("Enter") next turn
- don't paste the user's task as a search query — rephrase it
- if the search results page already shows the answer in a featured snippet, just report it

your messages appear in a team group chat alongside real humans. they should sound like a coworker texting — not a report, not a data dump. the user is your teammate, not your boss.

<examples>
<example>
<situation>searched for weather in kampala, results show 21°C cloudy</situation>
<good_teamMessage>found it — 21°C in kampala rn, cloudy with 84% humidity. barely any rain chance</good_teamMessage>
<bad_teamMessage>The current weather in Kampala, Uganda is cloudy with a temperature of 21°C and humidity of 84%.</bad_teamMessage>
</example>
<example>
<situation>searched for CTO of Stripe, found David Singleton</situation>
<good_teamMessage>ok so david singleton is stripe's CTO — been there since 2021, previously at google</good_teamMessage>
<bad_teamMessage>The current Chief Technology Officer of Stripe is David Singleton. He has been serving in this role since 2021.</bad_teamMessage>
</example>
<example>
<situation>searched for flights to tokyo, cheapest is $450</situation>
<good_teamMessage>cheapest i found is $450 roundtrip on ANA, departing thursday — not bad honestly</good_teamMessage>
<bad_teamMessage>I have found flight options to Tokyo. The cheapest available flight is a roundtrip on ANA for $450.</bad_teamMessage>
</example>
<example>
<situation>searched for president of uganda</situation>
<good_teamMessage>looks like yoweri museveni — been president since 1986, that's wild</good_teamMessage>
<bad_teamMessage>The current president of Uganda is Yoweri Museveni. He has been in office since 1986.</bad_teamMessage>
</example>
<example>
<situation>user asked something ambiguous, need clarification</situation>
<good_question>cto of which company?</good_question>
<bad_question>Could you please specify which company you are referring to?</bad_question>
</example>
</examples>

respond with json:
{
  "thinking": "what i see and my plan (private, not shown to team)",
  "action": {"type": "click", "target": "selector or text"} | null,
  "step_complete": false,
  "teamMessage": "short casual message to the team" | null,
  "highlights": ["exact text from the page to highlight"] | null,
  "question": "casual question if something is unclear" | null,
  "questionSeverity": "low" | "medium" | "high" | null,
  "questionDefault": "what you'll do if no one answers" | null
}

highlights: when you find something important on the page — a key fact, a number, a name, a sentence that answers the user's question — copy the EXACT text from the page into this array. the text will be highlighted in yellow on the page so the user can see what you found. only highlight the most relevant 1-3 phrases. leave null if nothing important found yet.`

export interface DOMAction {
  type: 'click' | 'type' | 'scroll' | 'press_key' | 'go_back'
  target: string
  value?: string
}

export interface DecisionResult {
  thinking: string
  action: DOMAction | undefined
  stepComplete: boolean
  teamMessage: string | undefined
  highlights: string[] | undefined
  question: string | undefined
  questionSeverity: string | undefined
  questionDefault: string | undefined
}

export class ActionDecider {
  private readonly llm: ProviderRegistry

  constructor(llm: ProviderRegistry) {
    this.llm = llm
  }

  async decide(
    pageDescription: string,
    networkSummary: string,
    taskDescription: string,
    plan: PlanStep[],
    currentStep: number,
    recentActions: string[],
    chatContext: string[],
    personalityPrompt: string,
    agentId: string,
  ): Promise<DecisionResult> {
    const step = plan[currentStep]
    const planText = plan.map((s) =>
      `  ${s.status === 'completed' ? '✅' : s.status === 'in_progress' ? '🔄' : '○'} Step ${s.step}: ${s.description} (expect: ${s.contract.output})`,
    ).join('\n')

    const systemPrompt = personalityPrompt
      ? `${personalityPrompt}\n\n${DECIDE_PROMPT}`
      : DECIDE_PROMPT

    const userPrompt = `page state:
${pageDescription}
${networkSummary ? `\nnetwork data:\n${networkSummary}` : ''}

${chatContext.length > 0 ? `team chat (the user is your teammate — their messages may answer your questions):\n${chatContext.slice(-5).join('\n')}\n` : ''}plan:
${planText}

current step: ${currentStep + 1} — ${step?.description ?? 'unknown'}
expected result: ${step?.contract.output ?? 'complete the step'}
recent actions: ${recentActions.slice(-5).join(' → ') || 'none yet'}

task: ${taskDescription}
${taskDescription.includes('DO NOT ask') ? '\nimportant: the user already clarified this task. do not set the "question" field. just act and report.' : ''}

what's your next action?`

    const response = await this.llm.sendMessage(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: 1024, temperature: 0.3 },
    )

    return this.parseDecision(response.content)
  }

  private parseDecision(content: string): DecisionResult {
    const empty: DecisionResult = {
      thinking: content,
      action: undefined,
      stepComplete: false,
      teamMessage: undefined,
      highlights: undefined,
      question: undefined,
      questionSeverity: undefined,
      questionDefault: undefined,
    }

    // Try to find the outermost JSON object (non-greedy brace matching)
    const jsonMatch = content.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*(?:\[[^\]]*\][^{}]*)*\}/)
    if (!jsonMatch) return empty

    try {
      const parsed = JSON.parse(jsonMatch[0]) as {
        thinking?: string
        action?: DOMAction | null
        step_complete?: boolean
        stepComplete?: boolean
        teamMessage?: string | null
        highlights?: string[] | null
        question?: string | null
        questionSeverity?: string | null
        questionDefault?: string | null
      }

      return {
        thinking: parsed.thinking ?? '',
        action: parsed.action ?? undefined,
        stepComplete: parsed.step_complete ?? parsed.stepComplete ?? false,
        teamMessage: this.casualize(parsed.teamMessage ?? undefined),
        highlights: parsed.highlights ?? undefined,
        question: parsed.question ?? undefined,
        questionSeverity: parsed.questionSeverity ?? undefined,
        questionDefault: parsed.questionDefault ?? undefined,
      }
    } catch {
      // LLM returned malformed JSON — treat as no action, retry next cycle
      return empty
    }
  }

  /** Post-process teamMessage to enforce casual tone if the LLM went formal. */
  private casualize(msg: string | undefined): string | undefined {
    if (!msg) return undefined

    let text = msg

    // Strip formal sentence starters
    text = text.replace(/^(The |I have |According to |Based on |It (is|was|has|appears) |This (is|was|suggests|conflicts) )/i, '')

    // Lowercase the first char if it was uppercase after stripping
    if (text.length > 0 && text[0] === text[0]!.toUpperCase() && text[0] !== text[0]!.toLowerCase()) {
      text = text[0]!.toLowerCase() + text.slice(1)
    }

    // Remove stiff connectors
    text = text.replace(/\. However,? /g, ' — ')
    text = text.replace(/\. Additionally,? /g, ', also ')
    text = text.replace(/\. Furthermore,? /g, ', plus ')
    text = text.replace(/\. He has been /g, ' — been ')
    text = text.replace(/\. She has been /g, ' — been ')
    text = text.replace(/He is recognized for /gi, 'known for ')
    text = text.replace(/She is recognized for /gi, 'known for ')
    text = text.replace(/has been recognized for /gi, 'known for ')
    text = text.replace(/specifically /gi, '')
    text = text.replace(/particularly /gi, '')

    // Add a casual opener if it starts too abruptly with a name/noun
    if (/^[a-z]/.test(text) && !text.startsWith('found') && !text.startsWith('ok') && !text.startsWith('looks') && !text.startsWith('heads') && !text.startsWith('yo') && !text.startsWith('hmm') && !text.startsWith('so ') && !text.startsWith('wait')) {
      text = 'found it — ' + text
    }

    return text
  }
}
