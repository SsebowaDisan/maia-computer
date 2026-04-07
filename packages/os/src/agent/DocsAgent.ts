import { AppAgent, type AgentTask, type AgentResult } from './AppAgent'
import { pino } from 'pino'

const logger = pino({ name: 'docs-agent' })

/**
 * DocsAgent — knows Google Docs inside out.
 *
 * Skills:
 *   createDoc()              → click Blank document, wait for editor
 *   nameDoc(title)           → click title field, type name
 *   writeHeading(text, level)→ select heading style, type
 *   writeParagraph(text)     → type in document body
 *   downloadPDF()            → File → Download → PDF
 */
export class DocsAgent extends AppAgent {

  async execute(task: AgentTask): Promise<AgentResult> {
    logger.info({ task: task.description }, 'DocsAgent starting')

    // Determine what to do based on the task
    const isDownload = /download|pdf|export/i.test(task.description)
    const isWrite = /write|report|create|document|compose/i.test(task.description)

    if (isDownload && !isWrite) {
      return this.handleDownload()
    }

    if (isWrite) {
      return this.handleWriteReport(task)
    }

    return { success: false, error: 'DocsAgent does not know how to handle this task' }
  }

  private async handleWriteReport(task: AgentTask): Promise<AgentResult> {
    this.chat('opening a new doc to start writing')

    // Step 1: Create a new document
    await this.createDoc()

    // Step 2: Name it
    const title = await this.generateTitle(task.description)
    await this.nameDoc(title)
    this.chat(`calling it "${title}"`)

    // Step 3: Generate report content using LLM
    const content = await this.generateReportContent(task)

    // Step 4: Write the report section by section
    await this.writeReport(content)

    this.chat('done writing — all sections are in')

    // Step 5: Download as PDF if requested
    if (/download|pdf/i.test(task.description)) {
      await this.downloadPDF()
      this.chat('pdf is ready for download')
    }

    return { success: true, content: `Report "${title}" created in Google Docs` }
  }

  private async handleDownload(): Promise<AgentResult> {
    this.chat('grabbing the pdf now')
    await this.downloadPDF()
    return { success: true, content: 'PDF downloaded' }
  }

  // ── SKILL: Create doc ─────────────────────────────────────────

  private async createDoc(): Promise<void> {
    logger.info('SKILL: createDoc')

    // Navigate to docs home first — we might be on an existing doc
    await this.intelligence.act(this.appId, 'navigate', 'https://docs.google.com/document/u/0/')
    await this.sleep(2000)
    await this.waitForPage()
    await this.waitForBridge()
    await this.sleep(1000)

    // Click "Blank document" or the + button
    let clicked = await this.visualClick('Blank document')
    if (!clicked) {
      clicked = await this.visualClick('Blank')
    }
    if (!clicked) {
      clicked = await this.visualClick('+')
    }

    await this.sleep(2000)
    await this.waitForPage()
    await this.waitForBridge()
    await this.sleep(1000)
  }

  // ── SKILL: Name doc ───────────────────────────────────────────

  private async nameDoc(title: string): Promise<void> {
    logger.info({ title }, 'SKILL: nameDoc')

    // Click the title field (shows "Untitled document")
    let clicked = await this.visualClick('Untitled document')
    if (!clicked) {
      // Try the input directly
      clicked = await this.visualClick('input.docs-title-input')
    }
    await this.sleep(300)

    // Clear and type the title
    await this.pressKey('Home')
    await this.sleep(50)
    await this.pressKey('Shift+End')
    await this.sleep(50)
    await this.type('input.docs-title-input', title)
    await this.sleep(200)

    // Confirm
    await this.pressKey('Enter')
    await this.sleep(500)

    // Click into the document body to start writing
    const bodyClicked = await this.visualClick('div.kix-appview-editor')
    if (!bodyClicked) {
      // Try clicking the page content area
      await this.visualClick('[contenteditable="true"]')
    }
    await this.sleep(300)
  }

  // ── SKILL: Write heading ──────────────────────────────────────

  private async writeHeading(text: string, level: number): Promise<void> {
    logger.info({ text: text.slice(0, 30), level }, 'SKILL: writeHeading')

    // Apply heading style using keyboard shortcut
    // Cmd+Alt+1 = Heading 1, Cmd+Alt+2 = Heading 2, etc.
    await this.pressKey(`Control+Alt+${level}`)
    await this.sleep(200)

    // Type the heading text
    await this.typeText(text)
    await this.pressKey('Enter')
    await this.sleep(200)

    // Reset to normal text
    await this.pressKey('Control+Alt+0')
    await this.sleep(200)
  }

  // ── SKILL: Write paragraph ────────────────────────────────────

  private async writeParagraph(text: string): Promise<void> {
    logger.info({ length: text.length }, 'SKILL: writeParagraph')
    await this.typeText(text)
    await this.pressKey('Enter')
    await this.pressKey('Enter')
    await this.sleep(200)
  }

  // ── SKILL: Download PDF ───────────────────────────────────────

  private async downloadPDF(): Promise<void> {
    logger.info('SKILL: downloadPDF')

    // File menu → Download → PDF
    await this.visualClick('File')
    await this.sleep(500)
    await this.visualClick('Download')
    await this.sleep(500)
    await this.visualClick('PDF Document')
    await this.sleep(2000)
  }

  // ── Report writing logic ──────────────────────────────────────

  private async writeReport(content: ReportContent): Promise<void> {
    // Write title
    await this.writeHeading(content.title, 1)
    await this.sleep(200)

    // Write each section
    for (const section of content.sections) {
      await this.writeHeading(section.heading, 2)
      await this.writeParagraph(section.body)
    }

    // Write conclusion if present
    if (content.conclusion) {
      await this.writeHeading('Conclusion', 2)
      await this.writeParagraph(content.conclusion)
    }
  }

  private async generateTitle(taskDescription: string): Promise<string> {
    const response = await this.askLLM(
      'generate a short, professional document title. respond with just the title, nothing else.',
      taskDescription,
      32,
    )
    return response.replace(/^["']|["']$/g, '')
  }

  private async generateReportContent(task: AgentTask): Promise<ReportContent> {
    const context = task.researchFindings ?? task.context ?? ''

    const response = await this.askLLM(
      `write a structured report based on the research findings provided.
respond with JSON:
{
  "title": "report title",
  "sections": [
    {"heading": "section name", "body": "2-4 paragraphs of content. include specific facts, numbers, and quotes from the research."}
  ],
  "conclusion": "concluding paragraph"
}
write 4-6 sections. each section should be substantive — 100-200 words.`,
      `task: ${task.description}\n\nresearch findings:\n${context.slice(0, 8000)}`,
      4096,
    )

    const parsed = this.parseJSON<ReportContent>(response)
    if (!parsed) {
      // Fallback — simple report
      return {
        title: 'Research Report',
        sections: [{ heading: 'Findings', body: context.slice(0, 2000) }],
        conclusion: 'Further research may be needed.',
      }
    }

    return parsed
  }

  /** Type text character-by-character into the active element. */
  private async typeText(text: string): Promise<void> {
    // For long text, type in chunks to avoid timeouts
    const chunkSize = 200
    for (let i = 0; i < text.length; i += chunkSize) {
      const chunk = text.slice(i, i + chunkSize)
      const dom = this.intelligence.getDOMBrain()
      await dom.executeInPage(
        this.appId,
        `document.execCommand('insertText', false, ${JSON.stringify(chunk)})`,
      )
      await this.sleep(300)
    }
  }
}

interface ReportSection {
  heading: string
  body: string
}

interface ReportContent {
  title: string
  sections: ReportSection[]
  conclusion?: string
}
