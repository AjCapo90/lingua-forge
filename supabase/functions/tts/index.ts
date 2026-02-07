// Supabase Edge Function: Text-to-Speech via Deepgram Aura
// Returns audio bytes that can be played in browser

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Available voices for different accents
const VOICES = {
  'us-female': 'aura-asteria-en',
  'uk-female': 'aura-luna-en', 
  'us-male': 'aura-orion-en',
  'us-male-deep': 'aura-arcas-en',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const DEEPGRAM_API_KEY = Deno.env.get('DEEPGRAM_API_KEY')
    if (!DEEPGRAM_API_KEY) {
      throw new Error('DEEPGRAM_API_KEY not configured')
    }

    const { text, voice = 'us-female' } = await req.json()

    if (!text || typeof text !== 'string') {
      throw new Error('Text is required')
    }

    // Get voice model
    const voiceModel = VOICES[voice as keyof typeof VOICES] || VOICES['us-female']

    // Call Deepgram TTS API
    const response = await fetch(`https://api.deepgram.com/v1/speak?model=${voiceModel}`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Deepgram TTS error: ${response.status} - ${errorText}`)
    }

    // Get audio as array buffer
    const audioBuffer = await response.arrayBuffer()

    // Return audio with proper headers
    return new Response(audioBuffer, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': audioBuffer.byteLength.toString(),
      },
    })
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
