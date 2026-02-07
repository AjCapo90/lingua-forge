// Supabase Edge Function: AI Evaluation and Exercise Generation
// Uses xAI Grok for fast, quality language evaluation

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Italian L1 interference patterns
const ITALIAN_L1_PATTERNS = [
  { pattern: 'discuss about', correct: 'discuss', explanation: 'In Italian "discutere di" but English "discuss" is transitive' },
  { pattern: 'depend from', correct: 'depend on', explanation: 'Italian "dipendere da" but English uses "on"' },
  { pattern: 'married with', correct: 'married to', explanation: 'Italian "sposato con" but English uses "to"' },
  { pattern: 'go at home', correct: 'go home', explanation: 'No preposition needed with "home" in English' },
  { pattern: 'I have been yesterday', correct: 'I went yesterday', explanation: 'Use Past Simple with specific past time markers' },
  { pattern: 'the life is', correct: 'life is', explanation: 'Abstract nouns typically don\'t use "the" in English' },
  { pattern: 'informations', correct: 'information', explanation: '"Information" is uncountable in English' },
  { pattern: 'advices', correct: 'advice', explanation: '"Advice" is uncountable in English' },
  { pattern: 'I am agree', correct: 'I agree', explanation: '"Agree" is a verb, not adjective - no "am" needed' },
]

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const XAI_API_KEY = Deno.env.get('XAI_API_KEY')
    if (!XAI_API_KEY) {
      throw new Error('XAI_API_KEY not configured')
    }

    const { 
      userInput, 
      exerciseType,
      context,
      userLevel = 'B1',
      targetLanguage = 'en',
      nativeLanguage = 'Italian',
      previousErrors = [],
      dormantItems = [],
    } = await req.json()

    if (!userInput) {
      throw new Error('userInput is required')
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      userLevel,
      nativeLanguage,
      previousErrors,
      dormantItems,
      l1Patterns: ITALIAN_L1_PATTERNS,
    })

    // Build user message
    const userMessage = buildUserMessage({
      userInput,
      exerciseType,
      context,
    })

    // Call xAI Grok API (OpenAI-compatible format)
    const response = await fetch('https://api.x.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${XAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-4-fast-non-reasoning', // Super fast model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage }
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`xAI API error: ${response.status} - ${errorText}`)
    }

    const data = await response.json()
    const assistantMessage = data.choices?.[0]?.message?.content || ''

    // Parse the structured response
    let parsed
    try {
      const jsonMatch = assistantMessage.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0])
      } else {
        parsed = {
          conversational_reply: assistantMessage,
          corrections: [],
          scores: { grammar: 3, vocabulary: 3, naturalness: 3 },
        }
      }
    } catch {
      parsed = {
        conversational_reply: assistantMessage,
        corrections: [],
        scores: { grammar: 3, vocabulary: 3, naturalness: 3 },
      }
    }

    return new Response(
      JSON.stringify(parsed),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

function buildSystemPrompt({ userLevel, nativeLanguage, previousErrors, dormantItems, l1Patterns }: {
  userLevel: string
  nativeLanguage: string
  previousErrors: string[]
  dormantItems: string[]
  l1Patterns: typeof ITALIAN_L1_PATTERNS
}) {
  const patternsText = l1Patterns.map(p => 
    `- "${p.pattern}" → "${p.correct}" (${p.explanation})`
  ).join('\n')

  return `You are an expert English language coach for a ${nativeLanguage} native speaker at ${userLevel} level.

YOUR ROLE:
- Supportive but challenging language partner
- All exercises must be Level 5 (Active Production) - challenging, contextual
- Keep conversation natural - correct inline, don't lecture
- Push the user slightly beyond their comfort zone

RULES:
1. ALWAYS respond in English
2. Provide corrections with brief ${nativeLanguage} explanations
3. Rate: grammar (1-5), vocabulary (1-5), naturalness (1-5)
4. Detect missed opportunities for more advanced structures
5. Generate follow-up questions requiring complex language

${nativeLanguage.toUpperCase()} L1 INTERFERENCE PATTERNS:
${patternsText}

RESPONSE FORMAT (JSON only):
{
  "conversational_reply": "Your natural response continuing the dialogue",
  "corrections": [
    {
      "original": "what user said wrong",
      "corrected": "correct form",
      "explanation": "brief explanation",
      "error_type": "grammar|vocabulary|l1_interference"
    }
  ],
  "missed_opportunities": [
    {
      "user_said": "simple phrase",
      "could_have_said": "more advanced alternative",
      "target_structure": "what to practice"
    }
  ],
  "scores": {
    "grammar": 1-5,
    "vocabulary": 1-5, 
    "naturalness": 1-5
  },
  "follow_up_question": "Question pushing more complex language"
}`
}

function buildUserMessage({ userInput, exerciseType, context }: {
  userInput: string
  exerciseType?: string
  context?: string
}) {
  switch (exerciseType) {
    case 'free_conversation':
      return `User said: "${userInput}"\n\nEvaluate their English and respond conversationally.`
    
    case 'roleplay':
      return `ROLEPLAY: ${context || 'Work environment'}\nUser: "${userInput}"\n\nStay in character, evaluate, continue.`
    
    case 'opinion':
      return `User's opinion on ${context || 'topic'}: "${userInput}"\n\nEvaluate argumentation and English.`
    
    case 'email':
      return `User writing ${context || 'professional'} email:\n"${userInput}"\n\nEvaluate formality and correctness.`

    case 'generate_exercise':
      return `Generate a Level 5 exercise for ${context || 'B1'} targeting: ${userInput}\n\nReturn JSON: { "exercise_type", "instructions", "prompt", "example_response" }`
    
    default:
      return `User said: "${userInput}"\n\nContext: ${context || 'General'}\n\nEvaluate and respond.`
  }
}
