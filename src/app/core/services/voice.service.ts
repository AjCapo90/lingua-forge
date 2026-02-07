import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';

export interface TranscriptResult {
  text: string;
  confidence: number;
}

@Injectable({ providedIn: 'root' })
export class VoiceService {
  private supabaseUrl = environment.supabaseUrl;
  
  // State
  isRecording = signal(false);
  isTranscribing = signal(false);
  transcript = signal('');
  error = signal<string | null>(null);
  
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;

  /**
   * Start recording audio from microphone
   */
  async startRecording(): Promise<void> {
    try {
      this.error.set(null);
      this.transcript.set('');
      
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        }
      });
      
      // Determine best audio format
      const mimeType = this.getSupportedMimeType();
      
      this.mediaRecorder = new MediaRecorder(this.stream, { mimeType });
      this.audioChunks = [];
      
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };
      
      this.mediaRecorder.start(100); // Collect data every 100ms
      this.isRecording.set(true);
      
    } catch (err: any) {
      console.error('Microphone error:', err);
      this.error.set(err.message || 'Failed to access microphone');
      throw err;
    }
  }

  /**
   * Stop recording and transcribe audio
   */
  async stopRecording(): Promise<TranscriptResult> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording()) {
        reject(new Error('Not recording'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        this.isRecording.set(false);
        
        // Stop all tracks
        if (this.stream) {
          this.stream.getTracks().forEach(track => track.stop());
          this.stream = null;
        }
        
        // Create audio blob
        const mimeType = this.mediaRecorder?.mimeType || 'audio/webm';
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        
        // Transcribe
        try {
          const result = await this.transcribeAudio(audioBlob);
          this.transcript.set(result.text);
          resolve(result);
        } catch (err: any) {
          this.error.set(err.message);
          reject(err);
        }
      };

      this.mediaRecorder.stop();
    });
  }

  /**
   * Cancel recording without transcribing
   */
  cancelRecording(): void {
    if (this.mediaRecorder && this.isRecording()) {
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
    }
    
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    
    this.isRecording.set(false);
    this.audioChunks = [];
  }

  /**
   * Transcribe audio blob using Deepgram
   */
  private async transcribeAudio(audioBlob: Blob): Promise<TranscriptResult> {
    this.isTranscribing.set(true);
    
    try {
      // Get temporary Deepgram key from edge function
      const keyResponse = await fetch(`${this.supabaseUrl}/functions/v1/deepgram-key`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: 'en' })
      });
      
      if (!keyResponse.ok) {
        const error = await keyResponse.text();
        throw new Error(`Failed to get Deepgram key: ${error}`);
      }
      
      const { key } = await keyResponse.json();
      
      // Send audio to Deepgram Nova-3
      const transcriptResponse = await fetch(
        'https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true&language=en',
        {
          method: 'POST',
          headers: {
            'Authorization': `Token ${key}`,
            'Content-Type': audioBlob.type,
          },
          body: audioBlob
        }
      );
      
      if (!transcriptResponse.ok) {
        const error = await transcriptResponse.text();
        throw new Error(`Transcription failed: ${error}`);
      }
      
      const data = await transcriptResponse.json();
      const alternative = data.results?.channels?.[0]?.alternatives?.[0];
      
      return {
        text: alternative?.transcript || '',
        confidence: alternative?.confidence || 0,
      };
      
    } finally {
      this.isTranscribing.set(false);
    }
  }

  /**
   * Get the best supported audio MIME type
   */
  private getSupportedMimeType(): string {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/mpeg',
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    return 'audio/webm'; // fallback
  }

  /**
   * Check if browser supports audio recording
   */
  isSupported(): boolean {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder);
  }
}
