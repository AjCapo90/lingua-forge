import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase.service';

// ============================================================
// EXERCISE TYPES - Level 5 Active Production
// ============================================================

export type ExerciseCategory = 'speaking' | 'writing' | 'listening' | 'reading' | 'grammar';

export type ExerciseType = 
  // SPEAKING 🎤
  | 'situation_response'      // Describe a situation, user responds verbally
  | 'roleplay'                // Simulated conversation scenario
  | 'picture_description'     // Describe what you see (future: with images)
  | 'opinion_express'         // Express and defend an opinion
  | 'story_continue'          // Continue a story using target items
  
  // WRITING ✍️
  | 'context_response'        // Situation → write response using items
  | 'email_draft'             // Write email (formal/informal)
  | 'paraphrase'              // Rewrite using target structures
  | 'error_correction'        // Find and fix errors
  
  // LISTENING 👂
  | 'dictation'               // Listen → write exactly
  | 'comprehension'           // Listen → answer questions
  
  // GRAMMAR 📚
  | 'tense_transform'         // Change tense of sentences
  | 'l1_interference_fix'     // Fix Italian-specific errors
  | 'sentence_build'          // Build sentence from fragments
  
  // INTEGRATION 🔄
  | 'multi_item_scenario';    // Use multiple items in one response

export interface StudyItem {
  id: number;
  content: string;
  type: 'vocabulary' | 'phrasal_verb' | 'collocation' | 'idiom' | 'expression';
  definition: string | null;
  examples: string[] | null;
  cefr_level: string;
  frequency_rank: number; // priority score
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  category: ExerciseCategory;
  items: StudyItem[];           // Items this exercise practices
  prompt: string;               // The question/situation
  context?: string;             // Additional context
  hints?: string[];             // Optional hints
  expectedElements?: string[];  // What we expect in the answer
  difficulty: 1 | 2 | 3;        // 1=easy, 2=medium, 3=hard
  inputMode: 'write' | 'speak' | 'both';
  timeEstimate: number;         // seconds
}

export interface ExerciseResult {
  exercise: Exercise;
  userResponse: string;
  responseMode: 'written' | 'spoken';
  scores: {
    grammar: number;      // 1-5
    vocabulary: number;   // 1-5  
    naturalness: number;  // 1-5
    itemUsage: number;    // 1-5 (did they use target items correctly?)
  };
  feedback: string;
  corrections: Array<{
    original: string;
    corrected: string;
    explanation: string;
    isL1Interference?: boolean;
  }>;
  itemsUsedCorrectly: number[];
  missedOpportunities: Array<{
    itemId: number;
    suggestion: string;
  }>;
  xpEarned: number;
}

// ============================================================
// EXERCISE TEMPLATES
// ============================================================

const EXERCISE_TEMPLATES: Record<ExerciseType, {
  category: ExerciseCategory;
  promptTemplates: string[];
  difficulty: 1 | 2 | 3;
  inputMode: 'write' | 'speak' | 'both';
  timeEstimate: number;
}> = {
  // SPEAKING
  situation_response: {
    category: 'speaking',
    promptTemplates: [
      "Your friend is stressed about {topic}. What would you tell them?",
      "You're at work and need to {action}. How would you start the conversation?",
      "A colleague asks about your weekend. Describe what you did.",
      "You're explaining to someone why you were late. What do you say?",
      "Your boss asks for your opinion on {topic}. How do you respond?",
    ],
    difficulty: 2,
    inputMode: 'both',
    timeEstimate: 60,
  },
  
  roleplay: {
    category: 'speaking',
    promptTemplates: [
      "You're in a job interview. The interviewer asks: '{question}'",
      "You're calling customer service to complain about {issue}.",
      "You're at a restaurant and there's a problem with your order.",
      "You're negotiating a deadline with your project manager.",
      "You're giving feedback to a colleague about their work.",
    ],
    difficulty: 3,
    inputMode: 'both',
    timeEstimate: 90,
  },
  
  picture_description: {
    category: 'speaking',
    promptTemplates: [
      "Describe a typical morning in your life.",
      "Describe your ideal workspace.",
      "Describe what's happening at a busy train station.",
    ],
    difficulty: 2,
    inputMode: 'both',
    timeEstimate: 60,
  },
  
  opinion_express: {
    category: 'speaking',
    promptTemplates: [
      "Do you think remote work is better than office work? Explain.",
      "What's your opinion on {topic}? Give at least two reasons.",
      "Some people say {statement}. Do you agree or disagree?",
    ],
    difficulty: 3,
    inputMode: 'both',
    timeEstimate: 90,
  },
  
  story_continue: {
    category: 'speaking',
    promptTemplates: [
      "Continue this story: 'Last week, something unexpected happened at work...'",
      "Continue: 'I was walking home when I suddenly...'",
    ],
    difficulty: 2,
    inputMode: 'both',
    timeEstimate: 60,
  },
  
  // WRITING
  context_response: {
    category: 'writing',
    promptTemplates: [
      "Your manager emails asking why a project is delayed. Write a brief response.",
      "A friend asks for advice about {topic}. Write your response.",
      "You need to explain a technical problem to a non-technical person.",
    ],
    difficulty: 2,
    inputMode: 'write',
    timeEstimate: 120,
  },
  
  email_draft: {
    category: 'writing',
    promptTemplates: [
      "Write a formal email to schedule a meeting with a client.",
      "Write an informal email to a colleague about {topic}.",
      "Write an email apologizing for missing a deadline.",
    ],
    difficulty: 3,
    inputMode: 'write',
    timeEstimate: 180,
  },
  
  paraphrase: {
    category: 'writing',
    promptTemplates: [
      "Rewrite this sentence using '{phrasal_verb}': {original_sentence}",
      "Express the same idea using the word '{word}': {original_sentence}",
    ],
    difficulty: 2,
    inputMode: 'write',
    timeEstimate: 60,
  },
  
  error_correction: {
    category: 'grammar',
    promptTemplates: [
      "Find and correct the error: '{sentence_with_error}'",
      "This sentence has a common Italian-speaker mistake. Fix it: '{sentence}'",
    ],
    difficulty: 2,
    inputMode: 'write',
    timeEstimate: 45,
  },
  
  // LISTENING
  dictation: {
    category: 'listening',
    promptTemplates: [
      "Listen and write exactly what you hear.",
    ],
    difficulty: 2,
    inputMode: 'write',
    timeEstimate: 60,
  },
  
  comprehension: {
    category: 'listening',
    promptTemplates: [
      "Listen to the audio and answer: {question}",
    ],
    difficulty: 2,
    inputMode: 'write',
    timeEstimate: 90,
  },
  
  // GRAMMAR
  tense_transform: {
    category: 'grammar',
    promptTemplates: [
      "Change this sentence to {target_tense}: '{sentence}'",
      "Rewrite in the passive voice: '{sentence}'",
    ],
    difficulty: 2,
    inputMode: 'write',
    timeEstimate: 45,
  },
  
  l1_interference_fix: {
    category: 'grammar',
    promptTemplates: [
      "An Italian speaker wrote: '{italian_error}'. What's wrong and how do you fix it?",
    ],
    difficulty: 2,
    inputMode: 'write',
    timeEstimate: 45,
  },
  
  sentence_build: {
    category: 'grammar',
    promptTemplates: [
      "Create a sentence using: {word1}, {word2}, {word3}",
      "Build a question using '{phrasal_verb}'",
    ],
    difficulty: 2,
    inputMode: 'write',
    timeEstimate: 60,
  },
  
  // INTEGRATION
  multi_item_scenario: {
    category: 'speaking',
    promptTemplates: [
      "You're in a meeting. Use ALL of these in your response: {items_list}",
      "Describe your day using these expressions: {items_list}",
    ],
    difficulty: 3,
    inputMode: 'both',
    timeEstimate: 120,
  },
};

// ============================================================
// SERVICE
// ============================================================

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private supabase = inject(SupabaseService);

  /**
   * Generate a session's worth of exercises
   */
  async generateSession(options: {
    durationMinutes: number;
    userLevel: string;
    focusTypes?: ExerciseType[];
  }): Promise<Exercise[]> {
    const { durationMinutes, userLevel, focusTypes } = options;
    
    // 1. Select items for this session
    const items = await this.selectItems(userLevel, durationMinutes);
    
    // 2. Generate varied exercises
    const exercises = this.createExercises(items, durationMinutes, focusTypes);
    
    return exercises;
  }

  /**
   * Select items based on priority and variety
   */
  private async selectItems(level: string, minutes: number): Promise<StudyItem[]> {
    // Estimate: ~1.5 min per item
    const itemCount = Math.floor(minutes / 1.5);
    
    // Get mix of types
    const typeDistribution = {
      phrasal_verb: Math.ceil(itemCount * 0.35),  // 35% phrasal verbs (Italian weakness!)
      vocabulary: Math.ceil(itemCount * 0.25),
      collocation: Math.ceil(itemCount * 0.25),
      idiom: Math.ceil(itemCount * 0.10),
      expression: Math.ceil(itemCount * 0.05),
    };

    const allItems: StudyItem[] = [];
    
    for (const [type, count] of Object.entries(typeDistribution)) {
      const { data } = await this.supabase.client
        .from('items')
        .select('id, content, type, definition, examples, cefr_level, frequency_rank')
        .eq('type', type)
        .in('cefr_level', this.getLevelsForUser(level))
        .not('frequency_rank', 'is', null)
        .order('frequency_rank', { ascending: false })
        .limit(count);
      
      if (data) {
        allItems.push(...data as StudyItem[]);
      }
    }
    
    // Shuffle to avoid predictable order
    return this.shuffle(allItems);
  }

  private getLevelsForUser(level: string): string[] {
    // For B1/B2 user: include some A2 for reinforcement, some C1 for challenge
    const levelMap: Record<string, string[]> = {
      'A1': ['A1'],
      'A2': ['A1', 'A2'],
      'B1': ['A2', 'B1', 'B2'],
      'B2': ['B1', 'B2', 'C1'],
      'C1': ['B2', 'C1', 'C2'],
      'C2': ['C1', 'C2'],
    };
    return levelMap[level] || ['B1', 'B2'];
  }

  /**
   * Create varied exercises from selected items
   */
  private createExercises(
    items: StudyItem[], 
    minutes: number,
    focusTypes?: ExerciseType[]
  ): Exercise[] {
    const exercises: Exercise[] = [];
    let totalTime = 0;
    const targetTime = minutes * 60;
    
    // Define exercise variety for a balanced session
    const exerciseRotation: ExerciseType[] = focusTypes || [
      'situation_response',   // Speaking
      'context_response',     // Writing
      'paraphrase',           // Writing + Grammar
      'opinion_express',      // Speaking
      'sentence_build',       // Grammar
      'roleplay',             // Speaking (harder)
      'multi_item_scenario',  // Integration
    ];
    
    let rotationIndex = 0;
    let itemIndex = 0;
    
    while (totalTime < targetTime && itemIndex < items.length) {
      const type = exerciseRotation[rotationIndex % exerciseRotation.length];
      const template = EXERCISE_TEMPLATES[type];
      
      // Get 1-3 items for this exercise
      const itemsForExercise = type === 'multi_item_scenario'
        ? items.slice(itemIndex, itemIndex + 3)
        : [items[itemIndex]];
      
      if (itemsForExercise.length === 0) break;
      
      const exercise = this.buildExercise(type, template, itemsForExercise);
      exercises.push(exercise);
      
      totalTime += template.timeEstimate;
      itemIndex += itemsForExercise.length;
      rotationIndex++;
    }
    
    return exercises;
  }

  private buildExercise(
    type: ExerciseType,
    template: typeof EXERCISE_TEMPLATES[ExerciseType],
    items: StudyItem[]
  ): Exercise {
    const promptTemplate = template.promptTemplates[
      Math.floor(Math.random() * template.promptTemplates.length)
    ];
    
    // Replace placeholders with actual content
    let prompt = promptTemplate;
    const mainItem = items[0];
    
    prompt = prompt.replace('{word}', mainItem.content);
    prompt = prompt.replace('{phrasal_verb}', mainItem.content);
    prompt = prompt.replace('{items_list}', items.map(i => `"${i.content}"`).join(', '));
    prompt = prompt.replace('{topic}', this.getRandomTopic());
    prompt = prompt.replace('{action}', this.getRandomAction());
    prompt = prompt.replace('{question}', this.getRandomQuestion());
    
    return {
      id: crypto.randomUUID(),
      type,
      category: template.category,
      items,
      prompt,
      expectedElements: items.map(i => i.content),
      difficulty: template.difficulty,
      inputMode: template.inputMode,
      timeEstimate: template.timeEstimate,
    };
  }

  private getRandomTopic(): string {
    const topics = [
      'work-life balance', 'a new project', 'learning English',
      'technology', 'remote work', 'their career', 'a decision',
      'travel plans', 'a difficult situation', 'time management'
    ];
    return topics[Math.floor(Math.random() * topics.length)];
  }

  private getRandomAction(): string {
    const actions = [
      'ask for a day off', 'report a problem', 'suggest an idea',
      'discuss a deadline', 'give feedback', 'request help',
      'explain a delay', 'propose a solution'
    ];
    return actions[Math.floor(Math.random() * actions.length)];
  }

  private getRandomQuestion(): string {
    const questions = [
      'What are your strengths?', 'Where do you see yourself in 5 years?',
      'Why do you want this position?', 'Tell me about a challenge you faced.',
      'How do you handle pressure?'
    ];
    return questions[Math.floor(Math.random() * questions.length)];
  }

  private shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  /**
   * Get display info for exercise type
   */
  getExerciseInfo(type: ExerciseType): { 
    icon: string; 
    label: string; 
    description: string;
    color: string;
  } {
    const info: Record<ExerciseType, { icon: string; label: string; description: string; color: string }> = {
      situation_response: { icon: '💬', label: 'Respond to Situation', description: 'React naturally to a scenario', color: '#4CAF50' },
      roleplay: { icon: '🎭', label: 'Roleplay', description: 'Act out a conversation', color: '#9C27B0' },
      picture_description: { icon: '🖼️', label: 'Describe', description: 'Describe what you see', color: '#2196F3' },
      opinion_express: { icon: '🗣️', label: 'Express Opinion', description: 'Share and defend your view', color: '#FF9800' },
      story_continue: { icon: '📖', label: 'Continue Story', description: 'Keep the story going', color: '#795548' },
      context_response: { icon: '✍️', label: 'Written Response', description: 'Write a natural reply', color: '#607D8B' },
      email_draft: { icon: '📧', label: 'Write Email', description: 'Compose a professional email', color: '#00BCD4' },
      paraphrase: { icon: '🔄', label: 'Paraphrase', description: 'Rewrite using target word', color: '#8BC34A' },
      error_correction: { icon: '🔍', label: 'Fix Error', description: 'Find and correct mistakes', color: '#F44336' },
      dictation: { icon: '👂', label: 'Dictation', description: 'Write what you hear', color: '#673AB7' },
      comprehension: { icon: '🎧', label: 'Listen & Answer', description: 'Answer based on audio', color: '#3F51B5' },
      tense_transform: { icon: '⏰', label: 'Change Tense', description: 'Transform the sentence', color: '#E91E63' },
      l1_interference_fix: { icon: '🇮🇹', label: 'Italian Error', description: 'Fix common Italian mistake', color: '#009688' },
      sentence_build: { icon: '🧱', label: 'Build Sentence', description: 'Create using given words', color: '#CDDC39' },
      multi_item_scenario: { icon: '🎯', label: 'Integration', description: 'Use multiple items together', color: '#FF5722' },
    };
    return info[type];
  }
}
