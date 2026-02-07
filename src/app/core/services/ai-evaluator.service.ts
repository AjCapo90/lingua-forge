import { Injectable, inject } from '@angular/core';
import { Exercise, ExerciseResult, StudyItem } from './exercise.service';

interface EvaluationResponse {
  scores: {
    grammar: number;
    vocabulary: number;
    naturalness: number;
    itemUsage: number;
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
    content: string;
    suggestion: string;
  }>;
  encouragement: string;
}

@Injectable({ providedIn: 'root' })
export class AIEvaluatorService {
  
  // Using Supabase Edge Function to call Grok API
  private readonly EVALUATE_URL = '/functions/v1/evaluate-response';

  /**
   * Evaluate a user's response to an exercise
   */
  async evaluate(
    exercise: Exercise,
    userResponse: string,
    responseMode: 'written' | 'spoken'
  ): Promise<ExerciseResult> {
    
    try {
      // Call the Edge Function for AI evaluation
      const evaluation = await this.callAI(exercise, userResponse);
      
      // Calculate XP
      const avgScore = (
        evaluation.scores.grammar +
        evaluation.scores.vocabulary +
        evaluation.scores.naturalness +
        evaluation.scores.itemUsage
      ) / 4;
      
      const xpEarned = this.calculateXP(avgScore, evaluation.itemsUsedCorrectly.length, exercise.difficulty);
      
      return {
        exercise,
        userResponse,
        responseMode,
        scores: evaluation.scores,
        feedback: evaluation.feedback,
        corrections: evaluation.corrections,
        itemsUsedCorrectly: evaluation.itemsUsedCorrectly,
        missedOpportunities: evaluation.missedOpportunities,
        xpEarned,
      };
    } catch (error) {
      console.error('AI evaluation failed, using fallback:', error);
      return this.fallbackEvaluation(exercise, userResponse, responseMode);
    }
  }

  private async callAI(exercise: Exercise, userResponse: string): Promise<EvaluationResponse> {
    const prompt = this.buildPrompt(exercise, userResponse);
    
    // For now, use a mock response - in production this calls the Edge Function
    // TODO: Implement actual API call when Edge Function is ready
    return this.mockAIResponse(exercise, userResponse);
  }

  private buildPrompt(exercise: Exercise, userResponse: string): string {
    const itemsList = exercise.items.map(i => 
      `- "${i.content}" (${i.type}): ${i.definition || 'no definition'}`
    ).join('\n');

    return `You are an English tutor for an Italian native speaker at B1/B2 level.

EXERCISE TYPE: ${exercise.type}
CATEGORY: ${exercise.category}
PROMPT: ${exercise.prompt}

TARGET ITEMS TO USE:
${itemsList}

USER'S RESPONSE:
"${userResponse}"

EVALUATE the response and return JSON:
{
  "scores": {
    "grammar": 1-5,
    "vocabulary": 1-5,
    "naturalness": 1-5,
    "itemUsage": 1-5
  },
  "feedback": "Brief, encouraging feedback",
  "corrections": [
    {"original": "...", "corrected": "...", "explanation": "...", "isL1Interference": true/false}
  ],
  "itemsUsedCorrectly": [item_ids used correctly],
  "missedOpportunities": [{"itemId": id, "content": "the word", "suggestion": "how they could have used it"}],
  "encouragement": "Positive note about what they did well"
}

IMPORTANT:
- Be encouraging but honest
- Flag Italian interference patterns (wrong prepositions, tense errors with "yesterday"/"last week", etc.)
- If they didn't use a target item, suggest WHERE they could have used it
- Keep feedback concise and actionable`;
  }

  /**
   * Mock AI response for development/offline
   */
  private mockAIResponse(exercise: Exercise, userResponse: string): EvaluationResponse {
    const response = userResponse.toLowerCase();
    const usedItems: number[] = [];
    const missed: Array<{ itemId: number; content: string; suggestion: string }> = [];
    
    // Check which items were used
    for (const item of exercise.items) {
      const itemWords = item.content.toLowerCase().split(' ');
      const mainWord = itemWords[0];
      
      if (response.includes(mainWord) || response.includes(item.content.toLowerCase())) {
        usedItems.push(item.id);
      } else {
        missed.push({
          itemId: item.id,
          content: item.content,
          suggestion: `You could have used "${item.content}" when describing the situation.`
        });
      }
    }
    
    // Simple grammar check
    const grammarIssues: Array<{ original: string; corrected: string; explanation: string; isL1Interference?: boolean }> = [];
    
    // Check for common Italian errors
    const italianPatterns = [
      { pattern: /\bhas\s+\w+ed\b.*\byesterday\b/i, fix: 'Use Past Simple (not Present Perfect) with "yesterday"', l1: true },
      { pattern: /\bdiscuss\s+about\b/i, fix: '"discuss" doesn\'t need "about"', l1: true },
      { pattern: /\bdepend\s+from\b/i, fix: 'Use "depend on" not "depend from"', l1: true },
      { pattern: /\bmarried\s+with\b/i, fix: 'Use "married to" not "married with"', l1: true },
      { pattern: /\bi\s+have\s+\d+\s+years\b/i, fix: 'Say "I am X years old" not "I have X years"', l1: true },
    ];
    
    for (const { pattern, fix, l1 } of italianPatterns) {
      const match = response.match(pattern);
      if (match) {
        grammarIssues.push({
          original: match[0],
          corrected: fix,
          explanation: `This is a common Italian interference pattern. In English: ${fix}`,
          isL1Interference: l1,
        });
      }
    }
    
    // Calculate scores
    const itemUsageScore = Math.min(5, Math.round((usedItems.length / exercise.items.length) * 5) || 1);
    const grammarScore = Math.max(1, 5 - grammarIssues.length);
    const vocabScore = itemUsageScore;
    const naturalnessScore = response.length > 20 ? 4 : 3;
    
    // Generate feedback
    let feedback = '';
    if (usedItems.length === exercise.items.length) {
      feedback = '🎉 Excellent! You used all the target items correctly!';
    } else if (usedItems.length > 0) {
      feedback = `Good effort! You used ${usedItems.length}/${exercise.items.length} target items.`;
    } else {
      feedback = `Try to include the target expressions in your answer.`;
    }
    
    if (grammarIssues.length > 0) {
      feedback += ` Watch out for some grammar patterns.`;
    }
    
    return {
      scores: {
        grammar: grammarScore,
        vocabulary: vocabScore,
        naturalness: naturalnessScore,
        itemUsage: itemUsageScore,
      },
      feedback,
      corrections: grammarIssues,
      itemsUsedCorrectly: usedItems,
      missedOpportunities: missed,
      encouragement: usedItems.length > 0 
        ? 'Great job attempting the exercise! Keep practicing!' 
        : 'Don\'t worry, practice makes perfect!',
    };
  }

  /**
   * Fallback when AI is unavailable
   */
  private fallbackEvaluation(
    exercise: Exercise,
    userResponse: string,
    responseMode: 'written' | 'spoken'
  ): ExerciseResult {
    const mock = this.mockAIResponse(exercise, userResponse);
    const avgScore = (mock.scores.grammar + mock.scores.vocabulary + mock.scores.naturalness + mock.scores.itemUsage) / 4;
    
    return {
      exercise,
      userResponse,
      responseMode,
      scores: mock.scores,
      feedback: mock.feedback,
      corrections: mock.corrections,
      itemsUsedCorrectly: mock.itemsUsedCorrectly,
      missedOpportunities: mock.missedOpportunities,
      xpEarned: this.calculateXP(avgScore, mock.itemsUsedCorrectly.length, exercise.difficulty),
    };
  }

  private calculateXP(avgScore: number, itemsUsed: number, difficulty: number): number {
    const baseXP = 10;
    const scoreBonus = Math.round((avgScore - 2.5) * 5); // -12.5 to +12.5
    const itemBonus = itemsUsed * 5;
    const difficultyMultiplier = difficulty;
    
    return Math.max(5, baseXP + scoreBonus + itemBonus) * difficultyMultiplier;
  }
}
