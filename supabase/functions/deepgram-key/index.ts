// Supabase Edge Function: Generate temporary Deepgram API key for STT
// Client uses this to connect directly to Deepgram WebSocket

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get language from request body (default: English)
    const { language = 'en' } = await req.json().catch(() => ({}))

    // Generate a temporary key with Deepgram's API
    // The key will be valid for 10 seconds (enough to establish WebSocket)
    const response = await fetch('https://api.deepgram.com/v1/projects', {
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      throw new Error(`Deepgram API error: ${response.status}`)
    }

    const projectsData = await response.json()
    const projectId = projectsData.projects?.[0]?.project_id

    if (!projectId) {
      throw new Error('No Deepgram project found')
    }

    // Create a temporary scoped key
    const keyResponse = await fetch(`https://api.deepgram.com/v1/projects/${projectId}/keys`, {
      method: 'POST',
      headers: {
        'Authorization': `Token ${DEEPGRAM_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        comment: `Temp key for LinguaForge STT - ${new Date().toISOString()}`,
        scopes: ['usage:write'],
        time_to_live_in_seconds: 60, // 1 minute TTL
      }),
    })

    if (!keyResponse.ok) {
      const errorText = await keyResponse.text()
      throw new Error(`Failed to create temp key: ${errorText}`)
    }

    const keyData = await keyResponse.json()

    return new Response(
      JSON.stringify({
        key: keyData.key,
        language,
        websocketUrl: `wss://api.deepgram.com/v1/listen?language=${language}&model=nova-2&smart_format=true&interim_results=true`,
      }),
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
