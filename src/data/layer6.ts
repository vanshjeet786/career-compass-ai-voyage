
export interface Question {
  id: string;
  text: string;
  type: 'likert' | 'open-ended';
  category: string;
}

export interface AssessmentLayer {
  id: string;
  name: string;
  description: string;
  categories: Record<string, Question[]>;
  isOpenEnded: boolean;
}

const createQuestion = (id: string, text: string, type: 'likert' | 'open-ended' = 'likert', category: string): Question => ({
  id,
  text,
  type,
  category
});

export const LAYER_6_QUESTIONS: AssessmentLayer = {
    id: 'layer6',
    name: 'Self-Reflection & Synthesis',
    description: 'Synthesize your insights and create an actionable career plan',
    isOpenEnded: true,
    categories: {
      'Self_Synthesis': [
        createQuestion('l6-synth-1', 'Based on my intelligence strengths, the types of activities I naturally enjoy are:', 'open-ended', 'Self_Synthesis'),
        createQuestion('l6-synth-2', 'Based on my personality, I thrive in environments that are:', 'open-ended', 'Self_Synthesis'),
        createQuestion('l6-synth-3', 'The industries and roles that excite me most are:', 'open-ended', 'Self_Synthesis'),
        createQuestion('l6-synth-4', 'My top 3 career interest areas are:', 'open-ended', 'Self_Synthesis'),
      ],
      'Action_Plan': [
        createQuestion('l6-action-1', 'What are 3 things you can do in the next 30 days to explore your top choice(s)?', 'open-ended', 'Action_Plan'),
        createQuestion('l6-action-2', 'What specific skills or knowledge gaps do you need to address for your target careers?', 'open-ended', 'Action_Plan'),
        createQuestion('l6-action-3', 'Who can help you on this journey? (Mentors, peers, family, online groups)', 'open-ended', 'Action_Plan'),
      ],
    }
};
