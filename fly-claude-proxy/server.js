const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');

const app = express();
app.use(cors({ origin: process.env.ALLOWED_ORIGIN || '*' }));
app.use(express.json());

app.post('/api/chat', async (req, res) => {
  try {
    const { oauthToken, systemPrompt, messages, model } = req.body;

    if (!oauthToken) {
      return res.status(400).json({ error: 'oauthToken required' });
    }

    const lastUserMessage = messages.filter(m => m.role === 'user').pop();
    if (!lastUserMessage) {
      return res.status(400).json({ error: 'No user message found' });
    }

    // Use claude CLI directly with --print flag
    const args = [
      '--print',
      '--output-format', 'text',
      '--max-turns', '1'
    ];

    if (systemPrompt) {
      args.push('--system-prompt', systemPrompt);
    }

    args.push(lastUserMessage.content);

    const claudeProcess = spawn('claude', args, {
      env: {
        ...process.env,
        CLAUDE_CODE_OAUTH_TOKEN: oauthToken,
        ANTHROPIC_API_KEY: undefined
      }
    });

    let stdout = '';
    let stderr = '';

    claudeProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    claudeProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    claudeProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Claude CLI error:', stderr);
        
        if (stderr.includes('auth') || stderr.includes('token') || stderr.includes('401')) {
          return res.status(401).json({ 
            error: 'Token non valido o scaduto. Rigenera con: claude setup-token' 
          });
        } else if (stderr.includes('limit') || stderr.includes('rate') || stderr.includes('429')) {
          return res.status(429).json({ 
            error: 'Limite di utilizzo raggiunto. Attendi il reset del tuo piano.' 
          });
        }
        
        return res.status(500).json({ error: stderr || 'Claude CLI error' });
      }

      res.json({
        content: [{ type: 'text', text: stdout.trim() }]
      });
    });

    claudeProcess.on('error', (error) => {
      console.error('Spawn error:', error);
      res.status(500).json({ error: 'Failed to spawn claude CLI' });
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`Claude SDK proxy running on 0.0.0.0:${PORT}`));
