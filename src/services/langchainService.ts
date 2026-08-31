/**
 * TransCreate — langchainService.ts
 * Core AI engine powered by Google DeepMind Gemma 4
 * via Google AI Studio (generativelanguage.googleapis.com)
 *
 * Architecture:
 *  1. Structured JSON transcreation prompt → Gemma 4 generates culturally adapted text
 *  2. Gemma 4 Function Calling → auto-invokes tools:
 *       • flag_cultural_risk  — populates the risk dashboard
 *       • extract_glossary_term — builds the cultural glossary
 *       • generate_dubbing_cue  — structures emotion/pace notes for voice actors
 */

import type {
  CultureKey, EmotionTag, TranscreatedLine,
  CulturalRisk, CulturalRiskLevel, CompareResult, GlossaryEntry,
} from '../types/transcript'
import type { ScriptLine } from '../types/transcript'
import { CULTURES } from '../types/transcript'
import { getMockTranscreation } from './mockService'

// ─── Google AI Studio / Gemma 4 Config ──────────────────────────────────────

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined
const GEMMA_MODEL   = (import.meta.env.VITE_GEMMA_MODEL as string) || 'gemma-4-27b-it'
const GEMMA_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMMA_MODEL}:generateContent`

// ─── Gemma 4 Function / Tool Declarations ───────────────────────────────────

const TOOLS = [
  {
    function_declarations: [
      {
        name: 'flag_cultural_risk',
        description: 'Flag a script line that contains culturally sensitive content — idioms, slang, humor, or references that will not translate directly.',
        parameters: {
          type: 'OBJECT',
          properties: {
            risk:          { type: 'STRING', enum: ['critical', 'caution', 'safe'], description: 'Risk level' },
            reason:        { type: 'STRING', description: 'Brief plain-English reason for the flag' },
            flagged_terms: { type: 'ARRAY', items: { type: 'STRING' }, description: 'Specific words or phrases flagged' },
          },
          required: ['risk', 'reason', 'flagged_terms'],
        },
      },
      {
        name: 'extract_glossary_term',
        description: 'Extract a culturally specific term from the script and provide adaptations for target cultures.',
        parameters: {
          type: 'OBJECT',
          properties: {
            original_term: { type: 'STRING', description: 'The original term/phrase from the source script' },
            meaning:       { type: 'STRING', description: 'Cultural meaning in the source language' },
            adaptations:   {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  culture:     { type: 'STRING' },
                  adapted:     { type: 'STRING' },
                  explanation: { type: 'STRING' },
                },
              },
            },
          },
          required: ['original_term', 'meaning'],
        },
      },
      {
        name: 'generate_dubbing_cue',
        description: 'Generate structured performance direction for a voice actor dubbing a transcreated line.',
        parameters: {
          type: 'OBJECT',
          properties: {
            emotion:        { type: 'STRING', description: 'Primary emotion to convey' },
            pace:           { type: 'STRING', enum: ['slow', 'normal', 'fast'], description: 'Speaking pace' },
            stress_words:   { type: 'ARRAY', items: { type: 'STRING' }, description: 'Words to emphasise' },
            director_note:  { type: 'STRING', description: 'One-line performance direction for the voice actor' },
          },
          required: ['emotion', 'pace', 'stress_words', 'director_note'],
        },
      },
    ],
  },
]

// ─── Core Gemma 4 API call ───────────────────────────────────────────────────

interface GemmaRequest {
  contents: { role: string; parts: { text: string }[] }[]
  tools?: typeof TOOLS
  generationConfig?: Record<string, unknown>
}

async function callGemma4(
  prompt: string,
  opts: { useFunctions?: boolean; timeoutMs?: number } = {}
): Promise<{ text: string; functionCall?: { name: string; args: Record<string, unknown> } }> {
  if (!GEMINI_API_KEY) throw new Error('NO_KEY')

  const { useFunctions = false, timeoutMs = 25000 } = opts
  const controller = new AbortController()
  const tid = setTimeout(() => controller.abort(), timeoutMs)

  const body: GemmaRequest = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 600 },
  }
  if (useFunctions) body.tools = TOOLS

  try {
    const res = await fetch(`${GEMMA_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    clearTimeout(tid)

    if (!res.ok) {
      const err = await res.text()
      throw new Error(`Gemma 4 API ${res.status}: ${err}`)
    }

    const data = await res.json()
    const candidate = data.candidates?.[0]?.content?.parts?.[0]

    // Function call response
    if (candidate?.functionCall) {
      return { text: '', functionCall: candidate.functionCall }
    }

    // Text response
    return { text: candidate?.text ?? '' }
  } catch (err: unknown) {
    clearTimeout(tid)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Gemma 4 request timed out')
    }
    throw err
  }
}

// ─── JSON strip helper ───────────────────────────────────────────────────────

function stripCodeFences(raw: string): string {
  return raw
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '')
    .trim()
}

// ─── Transcreation ───────────────────────────────────────────────────────────

const EMOTIONS: EmotionTag[] = [
  'neutral', 'warm familiarity', 'dry irony', 'excited', 'tense',
  'melancholic', 'comedic', 'reverent', 'confrontational', 'playful',
]

export async function transcreateLines(
  lines: ScriptLine[],
  sourceCulture: CultureKey,
  targetCulture: CultureKey,
  onLineComplete: (line: TranscreatedLine) => void
): Promise<void> {
  const CONCURRENCY = 2

  async function processLine(line: ScriptLine, i: number) {
    const context = lines
      .slice(Math.max(0, i - 2), i)
      .map(l => l.text)
      .join('\n') || '(start of script)'

    const prompt = `You are a professional transcreation specialist for the film industry.
Adapt the dialogue line for a ${targetCulture} audience.
Do NOT translate literally — translate the EMOTIONAL INTENT. Replace idioms, slang, humor, and cultural references with native equivalents for the target culture.
Match the speaking length so it fits the original timing.

SOURCE CULTURE: ${sourceCulture}
TARGET CULTURE: ${targetCulture}
CONTEXT (preceding lines): ${context}
LINE TO TRANSCREATE: "${line.text}"

Respond ONLY with raw valid JSON — no markdown, no prose, no extra text:
{
  "transcreated_text": "...",
  "emotion_tag": "<one of: ${EMOTIONS.join(' | ')}>",
  "pronunciation_hint": "...",
  "rationale": "...",
  "confidence": "<high | medium | low>"
}`

    let parsed: {
      transcreated_text: string
      emotion_tag: EmotionTag
      pronunciation_hint: string
      rationale: string
      confidence: 'high' | 'medium' | 'low'
    } | null = null

    for (let attempt = 0; attempt <= 1; attempt++) {
      try {
        if (attempt > 0) await new Promise(r => setTimeout(r, 2000))
        const { text } = await callGemma4(prompt)
        const clean = stripCodeFences(text)
        parsed = JSON.parse(clean)
        break
      } catch (err) {
        if (attempt === 1) {
          console.error('Gemma 4 error for line', line.index, '(after retry):', err)
          parsed = getMockTranscreation(line.text + line.index, sourceCulture, targetCulture) as typeof parsed
        }
      }
    }

    onLineComplete({
      id: line.id,
      index: line.index,
      startTime: line.startTime,
      endTime: line.endTime,
      originalText: line.text,
      transcreatedText: parsed!.transcreated_text,
      emotionTag: parsed!.emotion_tag as EmotionTag,
      pronunciationHint: parsed!.pronunciation_hint,
      rationale: parsed!.rationale,
      confidence: parsed!.confidence,
      isLoading: false,
    })
  }

  for (let i = 0; i < lines.length; i += CONCURRENCY) {
    const batch = lines.slice(i, i + CONCURRENCY)
    await Promise.all(batch.map((line, j) => processLine(line, i + j)))
  }
}

// ─── Re-transcreate a single line ────────────────────────────────────────────

export async function retranscreateOne(
  line: ScriptLine,
  sourceCulture: CultureKey,
  targetCulture: CultureKey,
  userHint?: string
): Promise<TranscreatedLine> {
  const prompt = `You are a professional transcreation specialist for the film industry.
Adapt the following script line for a ${targetCulture} audience.
Translate the EMOTIONAL INTENT, not the literal words.

SOURCE CULTURE: ${sourceCulture}
TARGET CULTURE: ${targetCulture}
ORIGINAL LINE: "${line.text}"
${userHint ? `CREATOR DIRECTION: "${userHint}"` : ''}

Respond ONLY with raw valid JSON:
{
  "transcreated_text": "...",
  "emotion_tag": "<one of: ${EMOTIONS.join(' | ')}>",
  "pronunciation_hint": "...",
  "rationale": "...",
  "confidence": "<high | medium | low>"
}`

  try {
    const { text } = await callGemma4(prompt)
    const parsed = JSON.parse(stripCodeFences(text))
    return {
      id: line.id, index: line.index,
      startTime: line.startTime, endTime: line.endTime,
      originalText: line.text,
      transcreatedText: parsed.transcreated_text,
      emotionTag: parsed.emotion_tag as EmotionTag,
      pronunciationHint: parsed.pronunciation_hint,
      rationale: parsed.rationale,
      confidence: parsed.confidence,
      isLoading: false,
    }
  } catch (err) {
    console.error('Retranscreation error:', err)
    const fallback = getMockTranscreation(line.text, sourceCulture, targetCulture)
    return {
      id: line.id, index: line.index,
      startTime: line.startTime, endTime: line.endTime,
      originalText: line.text,
      transcreatedText: fallback.transcreated_text,
      emotionTag: fallback.emotion_tag as EmotionTag,
      pronunciationHint: fallback.pronunciation_hint,
      rationale: fallback.rationale,
      confidence: fallback.confidence,
      isLoading: false,
    }
  }
}

// ─── Cultural Risk Scanner — uses Gemma 4 Function Calling ───────────────────

export async function scanCulturalRisks(
  lines: ScriptLine[],
  sourceCulture: CultureKey,
  onResult: (risk: CulturalRisk) => void
): Promise<void> {
  for (const line of lines) {
    try {
      const prompt = `Analyze this ${sourceCulture} script line for cultural translation risk.
Call the flag_cultural_risk function with your analysis.

LINE: "${line.text}"

Risk levels:
- "critical": Contains idioms, puns, humor, or references that WILL be misunderstood cross-culturally
- "caution": Contains colloquial tone or mild cultural specificity
- "safe": Factual or universal dialogue that translates cleanly`

      const { functionCall } = await callGemma4(prompt, { useFunctions: true })

      if (functionCall && functionCall.name === 'flag_cultural_risk') {
        const args = functionCall.args as { risk: CulturalRiskLevel; reason: string; flagged_terms: string[] }
        onResult({
          lineId: line.id,
          risk: args.risk,
          reason: args.reason,
          flaggedTerms: args.flagged_terms ?? [],
        })
      } else {
        throw new Error('No function call returned')
      }
    } catch (err) {
      console.error('Risk scan error:', err)
      const hasSlang = /(!{2,}|\?{2,}|\.{3,}|yaar|bhai|dude|bro|mate|lol|omg)/i.test(line.text)
      onResult({
        lineId: line.id,
        risk: hasSlang ? 'caution' : 'safe',
        reason: hasSlang ? 'Contains informal/colloquial expressions' : 'Appears culturally neutral',
        flaggedTerms: [],
      })
    }
    await new Promise(r => setTimeout(r, 300))
  }
}

// ─── Multi-culture Comparison ─────────────────────────────────────────────────

export async function compareAcrossCultures(
  line: ScriptLine,
  sourceCulture: CultureKey,
  targetCultures: CultureKey[],
  onResult: (cultureKey: CultureKey, result: CompareResult) => void
): Promise<void> {
  const cultureMap = new Map(CULTURES.map(c => [c.key, c.label]))

  for (const target of targetCultures) {
    try {
      const prompt = `Transcreate this line for a ${cultureMap.get(target)} (${target}) audience.
Translate the emotional intent, not the literal words.

SOURCE (${sourceCulture}): "${line.text}"

Respond ONLY with raw valid JSON:
{
  "transcreated_text": "...",
  "emotion_tag": "<one of: ${EMOTIONS.join(' | ')}>",
  "rationale": "..."
}`

      const { text } = await callGemma4(prompt)
      const parsed = JSON.parse(stripCodeFences(text))
      onResult(target, {
        cultureKey: target,
        cultureLabel: cultureMap.get(target) ?? target,
        text: parsed.transcreated_text,
        emotionTag: parsed.emotion_tag as EmotionTag,
        rationale: parsed.rationale,
      })
    } catch (err) {
      console.error(`Compare error (${target}):`, err)
      const fallback = getMockTranscreation(line.text, sourceCulture, target)
      onResult(target, {
        cultureKey: target,
        cultureLabel: cultureMap.get(target) ?? target,
        text: fallback.transcreated_text,
        emotionTag: fallback.emotion_tag as EmotionTag,
        rationale: fallback.rationale,
      })
    }
    await new Promise(r => setTimeout(r, 300))
  }
}

// ─── Glossary Generator — uses Gemma 4 Function Calling ──────────────────────

export async function generateGlossary(
  lines: ScriptLine[],
  sourceCulture: CultureKey,
  targetCultures: CultureKey[]
): Promise<GlossaryEntry[]> {
  const cultureMap = new Map(CULTURES.map(c => [c.key, c.label]))
  const targetLabels = targetCultures.map(t => cultureMap.get(t) ?? t).join(', ')
  const allText = lines.map(l => l.text).join('\n')

  try {
    const prompt = `You are a cultural linguistics expert. Analyze this ${cultureMap.get(sourceCulture)} script and extract all culturally specific terms — idioms, slang, humor, metaphors, and cultural references.

For each term, call the extract_glossary_term function showing how it would be adapted for: ${targetLabels}.

SCRIPT:
${allText}`

    const results: GlossaryEntry[] = []
    const { functionCall } = await callGemma4(prompt, { useFunctions: true })

    if (functionCall && functionCall.name === 'extract_glossary_term') {
      const args = functionCall.args as {
        original_term: string
        meaning: string
        adaptations?: { culture: string; adapted: string; explanation: string }[]
      }
      results.push({
        originalTerm: args.original_term,
        meaning: args.meaning,
        adaptations: args.adaptations ?? [],
      })
    }

    if (results.length > 0) return results
    throw new Error('No glossary entries returned')

  } catch (err) {
    console.error('Glossary generation error — using fallback:', err)

    // Rich realistic fallback for demo mode
    const mockGlossary: GlossaryEntry[] = [
      {
        originalTerm: 'yaar',
        meaning: 'Buddy, friend, mate (informal address with warmth)',
        adaptations: targetCultures.map(c => {
          const culture = cultureMap.get(c) ?? c
          if (c === 'en-US') return { culture, adapted: 'man / dude', explanation: 'Captures the casual, warm intimacy.' }
          if (c === 'en-GB') return { culture, adapted: 'mate', explanation: 'The quintessential British equivalent.' }
          if (c === 'ja-JP') return { culture, adapted: 'お前 (omae)', explanation: 'Intimate address between close friends.' }
          if (c === 'es-MX') return { culture, adapted: 'güey / compa', explanation: 'Very common Mexican slang for a close friend.' }
          return { culture, adapted: 'buddy', explanation: 'Universal casual adaptation.' }
        }),
      },
      {
        originalTerm: 'bhai',
        meaning: 'Brother — used for deep camaraderie, not just family',
        adaptations: targetCultures.map(c => {
          const culture = cultureMap.get(c) ?? c
          if (c === 'en-US') return { culture, adapted: 'bro', explanation: 'Matches the familial affection applied to non-family.' }
          if (c === 'ko-KR') return { culture, adapted: '형 (hyung)', explanation: 'Exact cultural match for addressing an older male friend.' }
          if (c === 'es-MX') return { culture, adapted: 'carnal', explanation: '"Carnal" captures the exact "blood brother" street slang equivalent.' }
          return { culture, adapted: 'bro', explanation: 'Safest universal equivalent.' }
        }),
      },
      {
        originalTerm: 'jugaad',
        meaning: 'A flexible, improvised hack or clever workaround',
        adaptations: targetCultures.map(c => {
          const culture = cultureMap.get(c) ?? c
          if (c === 'en-US') return { culture, adapted: 'lifehack / MacGyvering', explanation: '"MacGyvering" implies brilliant improvisation from limited resources.' }
          if (c === 'pt-BR') return { culture, adapted: 'gambiarra', explanation: 'The exact Brazilian equivalent for a makeshift clever hack.' }
          if (c === 'fr-FR') return { culture, adapted: 'système D', explanation: 'French term for resourcefulness and finding quick workarounds.' }
          return { culture, adapted: 'clever hack', explanation: 'Descriptive translation — no direct equivalent exists.' }
        }),
      },
    ]
    return mockGlossary
  }
}
