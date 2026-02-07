import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-voice-test',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="test-container">
      <h1>🎤 Voice Test</h1>
      <p class="subtitle">Test STT → AI → TTS pipeline</p>
      
      <!-- Input Section -->
      <mat-card class="input-card">
        <h3>1. Your Input</h3>
        
        <!-- Text Input -->
        <textarea 
          [(ngModel)]="userInput" 
          placeholder="Type something in English (or use mic)..."
          rows="3"
          class="text-input">
        </textarea>
        
        <!-- Mic Button -->
        <div class="mic-section">
          <button mat-fab [color]="isRecording() ? 'warn' : 'primary'" 
                  (click)="toggleRecording()"
                  [disabled]="isProcessing()">
            <mat-icon>{{ isRecording() ? 'stop' : 'mic' }}</mat-icon>
          </button>
          <span class="mic-status">
            @if (isRecording()) {
              🔴 Recording... (click to stop)
            } @else {
              Click to speak
            }
          </span>
        </div>
        
        @if (transcript()) {
          <div class="transcript">
            <strong>Transcript:</strong> {{ transcript() }}
          </div>
        }
        
        <button mat-raised-button color="primary" 
                (click)="sendToAI()"
                [disabled]="!userInput.trim() || isProcessing()"
                class="send-btn">
          @if (isProcessing()) {
            <mat-spinner diameter="20"></mat-spinner>
          } @else {
            Send to AI
          }
        </button>
      </mat-card>
      
      <!-- AI Response Section -->
      @if (aiResponse()) {
        <mat-card class="response-card">
          <h3>2. AI Response</h3>
          
          <div class="reply">
            <p>{{ aiResponse()?.conversational_reply }}</p>
            <button mat-icon-button (click)="playTTS(aiResponse()?.conversational_reply)"
                    [disabled]="isPlayingTTS()">
              <mat-icon>{{ isPlayingTTS() ? 'volume_up' : 'volume_off' }}</mat-icon>
            </button>
          </div>
          
          @if (aiResponse()?.corrections?.length) {
            <div class="corrections">
              <h4>✏️ Corrections:</h4>
              @for (c of aiResponse()?.corrections; track c.original) {
                <div class="correction-item">
                  <span class="wrong">❌ {{ c.original }}</span>
                  <span class="right">✅ {{ c.corrected }}</span>
                  <span class="explanation">💡 {{ c.explanation }}</span>
                  @if (c.error_type === 'l1_interference') {
                    <span class="l1-badge">🇮🇹 L1 Interference</span>
                  }
                </div>
              }
            </div>
          }
          
          @if (aiResponse()?.missed_opportunities?.length) {
            <div class="missed">
              <h4>💡 You could have said:</h4>
              @for (m of aiResponse()?.missed_opportunities; track m.user_said) {
                <div class="missed-item">
                  <span>"{{ m.user_said }}" → "{{ m.could_have_said }}"</span>
                </div>
              }
            </div>
          }
          
          <div class="scores">
            <span>Grammar: {{ aiResponse()?.scores?.grammar }}/5</span>
            <span>Vocabulary: {{ aiResponse()?.scores?.vocabulary }}/5</span>
            <span>Naturalness: {{ aiResponse()?.scores?.naturalness }}/5</span>
          </div>
          
          @if (aiResponse()?.follow_up_question) {
            <div class="follow-up">
              <strong>🎯 Follow-up:</strong> {{ aiResponse()?.follow_up_question }}
            </div>
          }
        </mat-card>
      }
      
      <!-- Debug Log -->
      @if (logs().length) {
        <mat-card class="log-card">
          <h3>📋 Debug Log</h3>
          @for (log of logs(); track $index) {
            <div class="log-item" [class]="log.type">{{ log.message }}</div>
          }
        </mat-card>
      }
    </div>
  `,
  styles: [`
    .test-container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 { margin-bottom: 0; }
    .subtitle { color: #666; margin-bottom: 20px; }
    
    mat-card {
      margin-bottom: 16px;
      padding: 16px;
    }
    
    .text-input {
      width: 100%;
      padding: 12px;
      font-size: 16px;
      border: 1px solid #ddd;
      border-radius: 8px;
      resize: vertical;
      margin-bottom: 12px;
    }
    
    .mic-section {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 16px;
    }
    
    .mic-status {
      font-size: 14px;
      color: #666;
    }
    
    .transcript {
      background: #e3f2fd;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .send-btn {
      width: 100%;
    }
    
    .reply {
      display: flex;
      align-items: flex-start;
      gap: 8px;
      background: #f5f5f5;
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .reply p {
      flex: 1;
      margin: 0;
      font-size: 16px;
    }
    
    .corrections, .missed {
      margin-bottom: 16px;
    }
    
    h4 { margin: 0 0 8px 0; }
    
    .correction-item, .missed-item {
      background: #fff3e0;
      padding: 12px;
      border-radius: 8px;
      margin-bottom: 8px;
    }
    
    .correction-item span {
      display: block;
      margin-bottom: 4px;
    }
    
    .wrong { color: #c62828; }
    .right { color: #2e7d32; }
    .explanation { color: #555; font-style: italic; }
    .l1-badge {
      display: inline-block;
      background: #ffcc02;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 12px;
      margin-top: 4px;
    }
    
    .scores {
      display: flex;
      gap: 16px;
      padding: 12px;
      background: #e8f5e9;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    
    .follow-up {
      background: #e3f2fd;
      padding: 12px;
      border-radius: 8px;
    }
    
    .log-card {
      background: #263238;
      color: #aed581;
    }
    
    .log-item {
      font-family: monospace;
      font-size: 12px;
      padding: 4px 0;
    }
    
    .log-item.error { color: #ef5350; }
    .log-item.success { color: #66bb6a; }
  `]
})
export class VoiceTestComponent {
  private supabaseUrl = environment.supabaseUrl;
  
  userInput = '';
  transcript = signal('');
  aiResponse = signal<any>(null);
  isRecording = signal(false);
  isProcessing = signal(false);
  isPlayingTTS = signal(false);
  logs = signal<{type: string, message: string}[]>([]);
  
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];

  private log(message: string, type = 'info') {
    this.logs.update(logs => [...logs, { type, message: `[${new Date().toLocaleTimeString()}] ${message}` }]);
  }

  async toggleRecording() {
    if (this.isRecording()) {
      this.stopRecording();
    } else {
      await this.startRecording();
    }
  }

  async startRecording() {
    try {
      this.log('Requesting microphone access...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };
      
      this.mediaRecorder.onstop = async () => {
        this.log('Recording stopped, processing audio...');
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        await this.transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      this.mediaRecorder.start();
      this.isRecording.set(true);
      this.log('Recording started...', 'success');
    } catch (error: any) {
      this.log(`Microphone error: ${error.message}`, 'error');
    }
  }

  stopRecording() {
    if (this.mediaRecorder && this.isRecording()) {
      this.mediaRecorder.stop();
      this.isRecording.set(false);
    }
  }

  async transcribeAudio(audioBlob: Blob) {
    try {
      this.log('Getting Deepgram key...');
      
      // Get temp key from edge function
      const keyResponse = await fetch(`${this.supabaseUrl}/functions/v1/deepgram-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'en' })
      });
      
      if (!keyResponse.ok) {
        throw new Error('Failed to get Deepgram key');
      }
      
      const { key } = await keyResponse.json();
      this.log('Got Deepgram key, transcribing...');
      
      // Send audio to Deepgram
      const formData = new FormData();
      formData.append('audio', audioBlob);
      
      const transcriptResponse = await fetch(
        'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true',
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${key}`,
          },
          body: audioBlob
        }
      );
      
      if (!transcriptResponse.ok) {
        throw new Error('Transcription failed');
      }
      
      const data = await transcriptResponse.json();
      const transcriptText = data.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
      
      this.transcript.set(transcriptText);
      this.userInput = transcriptText;
      this.log(`Transcribed: "${transcriptText}"`, 'success');
    } catch (error: any) {
      this.log(`Transcription error: ${error.message}`, 'error');
    }
  }

  async sendToAI() {
    if (!this.userInput.trim()) return;
    
    this.isProcessing.set(true);
    this.log('Sending to AI...');
    
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/claude-evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: this.userInput,
          exerciseType: 'free_conversation',
          userLevel: 'B1',
          nativeLanguage: 'Italian'
        })
      });
      
      if (!response.ok) {
        throw new Error('AI evaluation failed');
      }
      
      const data = await response.json();
      this.aiResponse.set(data);
      this.log('AI response received!', 'success');
    } catch (error: any) {
      this.log(`AI error: ${error.message}`, 'error');
    } finally {
      this.isProcessing.set(false);
    }
  }

  async playTTS(text: string | undefined) {
    if (!text) return;
    
    this.isPlayingTTS.set(true);
    this.log('Generating TTS...');
    
    try {
      const response = await fetch(`${this.supabaseUrl}/functions/v1/tts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'us-female' })
      });
      
      if (!response.ok) {
        throw new Error('TTS failed');
      }
      
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      audio.onended = () => {
        this.isPlayingTTS.set(false);
        URL.revokeObjectURL(audioUrl);
      };
      
      await audio.play();
      this.log('Playing audio...', 'success');
    } catch (error: any) {
      this.log(`TTS error: ${error.message}`, 'error');
      this.isPlayingTTS.set(false);
    }
  }
}
