import { RESPONSE_SCALE, LAYER_1_QUESTIONS, LAYER_2_QUESTIONS, LAYER_3_QUESTIONS, LAYER_4_QUESTIONS, LAYER_5_QUESTIONS } from '@/data/questions';

export interface UserProfile {
  id?: string;
  assessmentId: string;
  intelligenceScores: Record<string, number>;
  personalityTraits: Record<string, number>;
  aptitudes: Record<string, number>;
  backgroundFactors: Record<string, number>;
  interests: Record<string, number>;
  layer6Insights: Record<string, any>;
  overallScores: {
    totalScore: number;
    topStrengths: Array<{ category: string; score: number; type: string }>;
    developmentAreas: Array<{ category: string; score: number; type: string }>;
  };
  lastUpdated: Date;
}

export interface ResponseData {
  question_id: string;
  response_value: any;
  layer_number: number;
}

export interface CareerRecommendation {
  title: string;
  description: string;
  compatibilityScore: number;
  salaryRange: string;
  marketDemand: 'High' | 'Medium' | 'Low';
  accessibility: 'High' | 'Medium' | 'Low';
  trends: 'Growing' | 'Stable' | 'Declining';
  onetLink?: string;
}

// Weights for different intelligence categories based on career counseling research
const INTELLIGENCE_WEIGHTS = {
  'Linguistic': 1.0,
  'Logical-Mathematical Intelligence': 1.2, // Higher weight for analytical roles
  'Interpersonal Intelligence': 1.1,
  'Intrapersonal Intelligence': 1.0,
  'Naturalistic Intelligence': 0.9,
  'Bodily-Kinesthetic Intelligence': 0.8,
  'Musical Intelligence': 0.8,
  'Visual-Spatial Intelligence': 1.0,
  'Cognitive Styles': 0.7
};

const PERSONALITY_WEIGHTS = {
  'MBTI': 1.0,
  'Big Five - Openness': 1.1,
  'Big Five - Conscientiousness': 1.2,
  'Big Five - Extraversion': 1.0,
  'Big Five - Agreeableness': 0.9,
  'Big Five - Neuroticism': 0.8,
  'SDT - Autonomy': 1.1,
  'SDT - Competence': 1.2,
  'SDT - Relatedness': 1.0
};

const APTITUDE_WEIGHTS = {
  'Numerical Aptitude': 1.2,
  'Verbal Aptitude': 1.1,
  'Abstract Reasoning': 1.2,
  'Technical Skills': 1.3,
  'Creative/Design Skills': 1.1,
  'Communication Skills': 1.2
};

export function calculateCategoryScore(responses: ResponseData[], category: string, layer: number): number {
  const categoryQuestions = responses.filter(r => 
    r.layer_number === layer && 
    r.question_id.includes(category)
  );

  if (categoryQuestions.length === 0) return 0;

  const sum = categoryQuestions.reduce((acc, q) => {
    if (q.response_value && 'value' in q.response_value) {
      return acc + q.response_value.value;
    }
    return acc;
  }, 0);

  return Number((sum / categoryQuestions.length).toFixed(2));
}

export function generateUserProfile(responses: ResponseData[], assessmentId: string): UserProfile {
  // Calculate intelligence scores (Layer 1)
  const intelligenceScores: Record<string, number> = {};
  Object.keys(LAYER_1_QUESTIONS).forEach(category => {
    const baseScore = calculateCategoryScore(responses, category, 1);
    const weight = INTELLIGENCE_WEIGHTS[category] || 1.0;
    intelligenceScores[category] = Number((baseScore * weight).toFixed(2));
  });

  // Calculate personality traits (Layer 2)
  const personalityTraits: Record<string, number> = {};
  Object.keys(LAYER_2_QUESTIONS).forEach(category => {
    const baseScore = calculateCategoryScore(responses, category, 2);
    const weight = PERSONALITY_WEIGHTS[category] || 1.0;
    personalityTraits[category] = Number((baseScore * weight).toFixed(2));
  });

  // Calculate aptitudes (Layer 3)
  const aptitudes: Record<string, number> = {};
  Object.keys(LAYER_3_QUESTIONS).forEach(category => {
    const baseScore = calculateCategoryScore(responses, category, 3);
    const weight = APTITUDE_WEIGHTS[category] || 1.0;
    aptitudes[category] = Number((baseScore * weight).toFixed(2));
  });

  // Calculate background factors (Layer 4)
  const backgroundFactors: Record<string, number> = {};
  Object.keys(LAYER_4_QUESTIONS).forEach(category => {
    backgroundFactors[category] = calculateCategoryScore(responses, category, 4);
  });

  // Calculate interests (Layer 5)
  const interests: Record<string, number> = {};
  Object.keys(LAYER_5_QUESTIONS).forEach(category => {
    interests[category] = calculateCategoryScore(responses, category, 5);
  });

  // Extract Layer 6 insights
  const layer6Insights: Record<string, any> = {};
  responses
    .filter(r => r.layer_number === 6)
    .forEach(r => {
      layer6Insights[r.question_id] = r.response_value;
    });

  // Calculate overall scores and identify strengths/development areas
  const allScores = [
    ...Object.entries(intelligenceScores).map(([k, v]) => ({ category: k, score: v, type: 'intelligence' })),
    ...Object.entries(personalityTraits).map(([k, v]) => ({ category: k, score: v, type: 'personality' })),
    ...Object.entries(aptitudes).map(([k, v]) => ({ category: k, score: v, type: 'aptitude' })),
  ];

  const topStrengths = allScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  const developmentAreas = allScores
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);

  const totalScore = allScores.reduce((sum, item) => sum + item.score, 0) / allScores.length;

  return {
    assessmentId,
    intelligenceScores,
    personalityTraits,
    aptitudes,
    backgroundFactors,
    interests,
    layer6Insights,
    overallScores: {
      totalScore: Number(totalScore.toFixed(2)),
      topStrengths,
      developmentAreas
    },
    lastUpdated: new Date()
  };
}

export function generateCareerRecommendations(profile: UserProfile): CareerRecommendation[] {
  const { intelligenceScores, personalityTraits, aptitudes, interests, layer6Insights } = profile;
  
  // Base career recommendations based on top strengths
  const baseRecommendations: CareerRecommendation[] = [
    {
      title: "Data Scientist",
      description: "Analyze complex datasets to extract insights for business decisions",
      compatibilityScore: 0,
      salaryRange: "$95k - $165k",
      marketDemand: "High",
      accessibility: "Medium",
      trends: "Growing",
      onetLink: "https://www.onetonline.org/link/summary/15-2051.00"
    },
    {
      title: "UX Designer", 
      description: "Create intuitive and user-friendly digital experiences",
      compatibilityScore: 0,
      salaryRange: "$75k - $130k",
      marketDemand: "High",
      accessibility: "Medium", 
      trends: "Growing",
      onetLink: "https://www.onetonline.org/link/summary/15-1255.01"
    },
    {
      title: "Project Manager",
      description: "Lead cross-functional teams to deliver projects on time and within budget",
      compatibilityScore: 0,
      salaryRange: "$85k - $140k", 
      marketDemand: "High",
      accessibility: "High",
      trends: "Stable",
      onetLink: "https://www.onetonline.org/link/summary/11-9021.00"
    },
    {
      title: "Software Engineer",
      description: "Design and develop software applications and systems",
      compatibilityScore: 0,
      salaryRange: "$85k - $155k",
      marketDemand: "High", 
      accessibility: "Medium",
      trends: "Growing",
      onetLink: "https://www.onetonline.org/link/summary/15-1252.00"
    },
    {
      title: "Marketing Specialist",
      description: "Develop and execute marketing strategies to promote products or services", 
      compatibilityScore: 0,
      salaryRange: "$50k - $85k",
      marketDemand: "Medium",
      accessibility: "High",
      trends: "Stable",
      onetLink: "https://www.onetonline.org/link/summary/13-1161.00"
    }
  ];

  // Calculate compatibility scores based on profile
  return baseRecommendations.map(career => {
    let score = 0;
    
    // Factor in intelligence scores
    if (career.title === "Data Scientist") {
      score += (intelligenceScores['Logical-Mathematical Intelligence'] || 0) * 0.3;
      score += (aptitudes['Numerical Aptitude'] || 0) * 0.2;
      score += (aptitudes['Abstract Reasoning'] || 0) * 0.2;
    } else if (career.title === "UX Designer") {
      score += (intelligenceScores['Visual-Spatial Intelligence'] || 0) * 0.3;
      score += (aptitudes['Creative/Design Skills'] || 0) * 0.3;
      score += (intelligenceScores['Interpersonal Intelligence'] || 0) * 0.2;
    } else if (career.title === "Project Manager") {
      score += (intelligenceScores['Interpersonal Intelligence'] || 0) * 0.3;
      score += (aptitudes['Communication Skills'] || 0) * 0.25;
      score += (personalityTraits['Big Five - Conscientiousness'] || 0) * 0.2;
    } else if (career.title === "Software Engineer") {
      score += (intelligenceScores['Logical-Mathematical Intelligence'] || 0) * 0.3;
      score += (aptitudes['Technical Skills'] || 0) * 0.3;
      score += (aptitudes['Abstract Reasoning'] || 0) * 0.2;
    } else if (career.title === "Marketing Specialist") {
      score += (intelligenceScores['Linguistic'] || 0) * 0.25;
      score += (aptitudes['Communication Skills'] || 0) * 0.25;
      score += (intelligenceScores['Interpersonal Intelligence'] || 0) * 0.2;
    }

    // Normalize score to 0-100 range
    const normalizedScore = Math.min(Math.max(score * 20, 0), 100);
    
    return {
      ...career,
      compatibilityScore: Math.round(normalizedScore)
    };
  }).sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

export function getUserProfileSummary(profile: UserProfile): string {
  const topStrengths = profile.overallScores.topStrengths.slice(0, 3);
  const strengthsText = topStrengths.map(s => s.category).join(', ');
  
  return `Strong in ${strengthsText}. Overall assessment score: ${profile.overallScores.totalScore.toFixed(1)}/5. Top career compatibility areas based on comprehensive analysis of intelligence, personality, and aptitude factors.`;
}