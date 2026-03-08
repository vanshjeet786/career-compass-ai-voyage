import { RESPONSE_SCALE, LAYER_1_QUESTIONS, LAYER_2_QUESTIONS, LAYER_3_QUESTIONS, LAYER_4_QUESTIONS, LAYER_5_QUESTIONS, LAYER_6_QUESTIONS } from '@/data/questions';

// Build a reverse lookup: question text → { category, layer }
const questionToCategoryMap: Record<string, { category: string; layer: number }> = {};

function buildMap(layerQuestions: Record<string, any>, layerNum: number) {
  for (const [category, questions] of Object.entries(layerQuestions)) {
    const qList = Array.isArray(questions) ? questions : (questions as any)?.questions || [];
    for (const q of qList) {
      if (typeof q === 'string') {
        questionToCategoryMap[q] = { category, layer: layerNum };
      }
    }
  }
}

buildMap(LAYER_1_QUESTIONS, 1);
buildMap(LAYER_2_QUESTIONS, 2);
buildMap(LAYER_3_QUESTIONS, 3);
buildMap(LAYER_4_QUESTIONS, 4);
buildMap(LAYER_5_QUESTIONS, 5);
buildMap(LAYER_6_QUESTIONS, 6);

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
  // Enriched fields
  educationRequired: string;
  keySkills: string[];
  dayInLife: string;
  salaryProgression: { entry: string; mid: string; senior: string };
  relatedCareers: string[];
  strengthsUsed: string[];
  growthSkills: string[];
  workStyle: string;
  passionScore?: number;
}

// Weights for different intelligence categories based on career counseling research
const INTELLIGENCE_WEIGHTS: Record<string, number> = {
  'Linguistic': 1.0,
  'Logical-Mathematical Intelligence': 1.2,
  'Interpersonal Intelligence': 1.1,
  'Intrapersonal Intelligence': 1.0,
  'Naturalistic Intelligence': 0.9,
  'Bodily-Kinesthetic Intelligence': 0.8,
  'Musical Intelligence': 0.8,
  'Visual-Spatial Intelligence': 1.0,
  'Cognitive Styles': 0.7
};

const PERSONALITY_WEIGHTS: Record<string, number> = {
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

const APTITUDE_WEIGHTS: Record<string, number> = {
  'Numerical Aptitude': 1.2,
  'Verbal Aptitude': 1.1,
  'Abstract Reasoning': 1.2,
  'Technical Skills': 1.3,
  'Creative/Design Skills': 1.1,
  'Communication Skills': 1.2
};

export function calculateCategoryScore(responses: ResponseData[], category: string, layer: number): number {
  const categoryQuestions = responses.filter(r => {
    if (r.layer_number !== layer) return false;
    const mapping = questionToCategoryMap[r.question_id];
    return mapping?.category === category && mapping?.layer === layer;
  });

  if (categoryQuestions.length === 0) return 0;

  const sum = categoryQuestions.reduce((acc, q) => {
    const rv = q.response_value as any;
    if (rv && typeof rv === 'object' && 'value' in rv) {
      return acc + Number(rv.value);
    }
    // Handle direct numeric values
    if (typeof rv === 'number') return acc + rv;
    return acc;
  }, 0);

  return Number((sum / categoryQuestions.length).toFixed(2));
}

export function generateUserProfile(responses: ResponseData[], assessmentId: string): UserProfile {
  // Calculate intelligence scores (Layer 1) — capped at 5.0
  const intelligenceScores: Record<string, number> = {};
  Object.keys(LAYER_1_QUESTIONS).forEach(category => {
    const baseScore = calculateCategoryScore(responses, category, 1);
    const weight = INTELLIGENCE_WEIGHTS[category] || 1.0;
    intelligenceScores[category] = Math.min(Number((baseScore * weight).toFixed(2)), 5);
  });

  // Calculate personality traits (Layer 2) — capped at 5.0
  const personalityTraits: Record<string, number> = {};
  Object.keys(LAYER_2_QUESTIONS).forEach(category => {
    const baseScore = calculateCategoryScore(responses, category, 2);
    const weight = PERSONALITY_WEIGHTS[category] || 1.0;
    personalityTraits[category] = Math.min(Number((baseScore * weight).toFixed(2)), 5);
  });

  // Calculate aptitudes (Layer 3) — capped at 5.0
  const aptitudes: Record<string, number> = {};
  Object.keys(LAYER_3_QUESTIONS).forEach(category => {
    const baseScore = calculateCategoryScore(responses, category, 3);
    const weight = APTITUDE_WEIGHTS[category] || 1.0;
    aptitudes[category] = Math.min(Number((baseScore * weight).toFixed(2)), 5);
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
  const { intelligenceScores, personalityTraits, aptitudes, interests } = profile;

  const baseRecommendations: CareerRecommendation[] = [
    {
      title: "Data Scientist",
      description: "Transform complex datasets into actionable insights that drive strategic business decisions",
      compatibilityScore: 0,
      salaryRange: "$95k - $165k",
      marketDemand: "High",
      accessibility: "Medium",
      trends: "Growing",
      onetLink: "https://www.onetonline.org/link/summary/15-2051.00",
      educationRequired: "Bachelor's in CS, Statistics, or Math; Master's preferred for senior roles",
      keySkills: ["Python", "SQL", "Machine Learning", "Statistics", "Data Visualization"],
      dayInLife: "You'll spend mornings exploring datasets and building models, afternoons presenting findings to stakeholders. Expect a blend of deep technical work and cross-team collaboration.",
      salaryProgression: { entry: "$75k - $95k", mid: "$110k - $145k", senior: "$150k - $200k+" },
      relatedCareers: ["Machine Learning Engineer", "Data Analyst", "Business Intelligence Developer"],
      strengthsUsed: ["Logical-Mathematical Intelligence", "Numerical Aptitude", "Abstract Reasoning"],
      growthSkills: ["Domain expertise", "Storytelling with data", "Cloud platforms"],
      workStyle: "Hybrid — collaborative analysis with deep independent focus time",
      passionScore: 0,
    },
    {
      title: "UX Designer",
      description: "Craft intuitive, delightful digital experiences that solve real user problems",
      compatibilityScore: 0,
      salaryRange: "$75k - $130k",
      marketDemand: "High",
      accessibility: "Medium",
      trends: "Growing",
      onetLink: "https://www.onetonline.org/link/summary/15-1255.01",
      educationRequired: "Bachelor's in Design, HCI, or related field; portfolio matters more than degree",
      keySkills: ["User Research", "Wireframing", "Prototyping", "Figma", "Usability Testing"],
      dayInLife: "Your days alternate between user interviews and research, sketching wireframes, prototyping in Figma, and testing designs with real users. Highly collaborative with product and engineering teams.",
      salaryProgression: { entry: "$60k - $80k", mid: "$90k - $120k", senior: "$130k - $170k" },
      relatedCareers: ["Product Designer", "UI Developer", "Design Researcher"],
      strengthsUsed: ["Visual-Spatial Intelligence", "Creative/Design Skills", "Interpersonal Intelligence"],
      growthSkills: ["Front-end development basics", "Design systems", "Accessibility standards"],
      workStyle: "Collaborative — embedded in cross-functional product teams",
      passionScore: 0,
    },
    {
      title: "Project Manager",
      description: "Orchestrate cross-functional teams to deliver complex projects on time and within scope",
      compatibilityScore: 0,
      salaryRange: "$85k - $140k",
      marketDemand: "High",
      accessibility: "High",
      trends: "Stable",
      onetLink: "https://www.onetonline.org/link/summary/11-9021.00",
      educationRequired: "Bachelor's in any field; PMP or Agile certifications highly valued",
      keySkills: ["Stakeholder Management", "Agile/Scrum", "Risk Assessment", "Budgeting", "Communication"],
      dayInLife: "You'll run standups, unblock team members, manage timelines, and communicate progress to leadership. Every day is different — it's a role for people who thrive on variety and coordination.",
      salaryProgression: { entry: "$65k - $85k", mid: "$95k - $125k", senior: "$130k - $165k" },
      relatedCareers: ["Program Manager", "Scrum Master", "Operations Manager"],
      strengthsUsed: ["Interpersonal Intelligence", "Communication Skills", "Big Five - Conscientiousness"],
      growthSkills: ["Technical literacy", "Financial modeling", "Negotiation"],
      workStyle: "Collaborative — constant interaction with diverse teams and stakeholders",
      passionScore: 0,
    },
    {
      title: "Software Engineer",
      description: "Design, build, and maintain the software systems that power modern technology",
      compatibilityScore: 0,
      salaryRange: "$85k - $155k",
      marketDemand: "High",
      accessibility: "Medium",
      trends: "Growing",
      onetLink: "https://www.onetonline.org/link/summary/15-1252.00",
      educationRequired: "Bachelor's in CS or related field; bootcamps and self-taught paths viable",
      keySkills: ["Programming Languages", "System Design", "Algorithms", "Git", "Problem Solving"],
      dayInLife: "You'll write and review code, debug complex problems, participate in design discussions, and ship features. Balance between solo deep work and pair programming or code reviews.",
      salaryProgression: { entry: "$70k - $100k", mid: "$110k - $150k", senior: "$155k - $220k+" },
      relatedCareers: ["Full-Stack Developer", "DevOps Engineer", "Solutions Architect"],
      strengthsUsed: ["Logical-Mathematical Intelligence", "Technical Skills", "Abstract Reasoning"],
      growthSkills: ["System design", "Communication", "Product thinking"],
      workStyle: "Hybrid — deep focus coding with collaborative design and review sessions",
      passionScore: 0,
    },
    {
      title: "Marketing Specialist",
      description: "Develop and execute creative strategies that connect brands with their ideal audiences",
      compatibilityScore: 0,
      salaryRange: "$50k - $85k",
      marketDemand: "Medium",
      accessibility: "High",
      trends: "Stable",
      onetLink: "https://www.onetonline.org/link/summary/13-1161.00",
      educationRequired: "Bachelor's in Marketing, Communications, or Business; certifications help",
      keySkills: ["Content Strategy", "Analytics", "Social Media", "SEO/SEM", "Brand Storytelling"],
      dayInLife: "You'll plan campaigns, analyze performance metrics, create content briefs, and coordinate with designers and sales. It's fast-paced with a blend of creativity and data-driven decisions.",
      salaryProgression: { entry: "$40k - $55k", mid: "$60k - $80k", senior: "$85k - $120k" },
      relatedCareers: ["Brand Manager", "Content Marketer", "Growth Hacker"],
      strengthsUsed: ["Linguistic", "Communication Skills", "Interpersonal Intelligence"],
      growthSkills: ["Data analytics", "Marketing automation", "Video production"],
      workStyle: "Collaborative — fast-paced team environment with creative autonomy",
      passionScore: 0,
    },
    {
      title: "Clinical Psychologist",
      description: "Help individuals navigate mental health challenges through evidence-based therapeutic approaches",
      compatibilityScore: 0,
      salaryRange: "$80k - $130k",
      marketDemand: "High",
      accessibility: "Low",
      trends: "Growing",
      onetLink: "https://www.onetonline.org/link/summary/19-3031.02",
      educationRequired: "Doctoral degree (PsyD or PhD) required; 5-7 years of graduate training",
      keySkills: ["Active Listening", "Empathy", "Diagnostic Assessment", "CBT/DBT Techniques", "Research"],
      dayInLife: "Your days center on one-on-one or group therapy sessions, diagnostic assessments, treatment planning, and case documentation. Deeply rewarding but emotionally demanding work.",
      salaryProgression: { entry: "$60k - $80k", mid: "$90k - $120k", senior: "$120k - $160k" },
      relatedCareers: ["Counselor", "Social Worker", "Psychiatrist"],
      strengthsUsed: ["Interpersonal Intelligence", "Intrapersonal Intelligence", "Big Five - Agreeableness"],
      growthSkills: ["Research methodology", "Business management", "Specialized therapeutic modalities"],
      workStyle: "Independent — primarily one-on-one with clients, with some team consultation",
      passionScore: 0,
    },
    {
      title: "Financial Analyst",
      description: "Evaluate financial data to guide investment decisions and business strategy",
      compatibilityScore: 0,
      salaryRange: "$65k - $120k",
      marketDemand: "High",
      accessibility: "Medium",
      trends: "Stable",
      onetLink: "https://www.onetonline.org/link/summary/13-2051.00",
      educationRequired: "Bachelor's in Finance, Accounting, or Economics; CFA certification valued",
      keySkills: ["Financial Modeling", "Excel/Spreadsheets", "Data Analysis", "Forecasting", "Reporting"],
      dayInLife: "You'll build financial models, analyze market trends, prepare reports for leadership, and present investment recommendations. Detail-oriented work with regular stakeholder interaction.",
      salaryProgression: { entry: "$55k - $70k", mid: "$80k - $110k", senior: "$120k - $170k" },
      relatedCareers: ["Investment Banker", "Accountant", "Risk Analyst"],
      strengthsUsed: ["Numerical Aptitude", "Logical-Mathematical Intelligence", "Big Five - Conscientiousness"],
      growthSkills: ["Industry specialization", "Programming (Python/R)", "Presentation skills"],
      workStyle: "Hybrid — independent analysis with regular team and client presentations",
      passionScore: 0,
    },
    {
      title: "Content Strategist",
      description: "Shape brand narratives and content ecosystems that engage audiences and drive business results",
      compatibilityScore: 0,
      salaryRange: "$60k - $110k",
      marketDemand: "Medium",
      accessibility: "High",
      trends: "Growing",
      onetLink: "https://www.onetonline.org/link/summary/27-3043.00",
      educationRequired: "Bachelor's in Communications, English, Journalism, or Marketing; portfolio-driven",
      keySkills: ["Storytelling", "SEO", "Editorial Planning", "Analytics", "Cross-Channel Strategy"],
      dayInLife: "You'll plan editorial calendars, write or review content, analyze engagement metrics, and collaborate with designers and product teams. Creative work grounded in strategy and data.",
      salaryProgression: { entry: "$45k - $60k", mid: "$70k - $95k", senior: "$100k - $140k" },
      relatedCareers: ["Copywriter", "Brand Strategist", "Content Marketing Manager"],
      strengthsUsed: ["Linguistic", "Communication Skills", "Creative/Design Skills"],
      growthSkills: ["Data analytics", "Video/multimedia production", "UX writing"],
      workStyle: "Hybrid — creative autonomy within collaborative team structures",
      passionScore: 0,
    },
    {
      title: "Environmental Scientist",
      description: "Research and develop solutions to environmental challenges from climate change to conservation",
      compatibilityScore: 0,
      salaryRange: "$55k - $100k",
      marketDemand: "Medium",
      accessibility: "Medium",
      trends: "Growing",
      onetLink: "https://www.onetonline.org/link/summary/19-2041.00",
      educationRequired: "Bachelor's in Environmental Science or related field; Master's for research roles",
      keySkills: ["Field Research", "Data Collection", "GIS", "Environmental Policy", "Scientific Writing"],
      dayInLife: "Your work splits between field research (collecting samples, surveying sites) and lab/office work (analyzing data, writing reports, advising on environmental policy). Meaningful, mission-driven work.",
      salaryProgression: { entry: "$45k - $58k", mid: "$65k - $85k", senior: "$90k - $120k" },
      relatedCareers: ["Conservation Biologist", "Sustainability Consultant", "Climate Analyst"],
      strengthsUsed: ["Naturalistic Intelligence", "Abstract Reasoning", "Technical Skills"],
      growthSkills: ["Policy advocacy", "GIS/remote sensing", "Grant writing"],
      workStyle: "Hybrid — field work combined with lab and office analysis",
      passionScore: 0,
    },
    {
      title: "Physical Therapist",
      description: "Restore movement and improve quality of life through personalized rehabilitation programs",
      compatibilityScore: 0,
      salaryRange: "$70k - $105k",
      marketDemand: "High",
      accessibility: "Low",
      trends: "Growing",
      onetLink: "https://www.onetonline.org/link/summary/29-1123.00",
      educationRequired: "Doctor of Physical Therapy (DPT) degree required; 3 years post-bachelor's",
      keySkills: ["Anatomy Knowledge", "Manual Therapy", "Exercise Prescription", "Patient Communication", "Assessment"],
      dayInLife: "You'll evaluate patients, design personalized treatment plans, guide them through exercises, and track recovery progress. Physically active, deeply personal, and immediately rewarding.",
      salaryProgression: { entry: "$60k - $75k", mid: "$80k - $95k", senior: "$100k - $125k" },
      relatedCareers: ["Occupational Therapist", "Sports Medicine Specialist", "Rehabilitation Counselor"],
      strengthsUsed: ["Bodily-Kinesthetic Intelligence", "Interpersonal Intelligence", "Big Five - Agreeableness"],
      growthSkills: ["Specialized certifications", "Practice management", "Telehealth delivery"],
      workStyle: "Independent — direct patient care with clinical team support",
      passionScore: 0,
    },
  ];

  // Calculate compatibility scores based on profile
  return baseRecommendations.map(career => {
    let score = 0;

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
    } else if (career.title === "Clinical Psychologist") {
      score += (intelligenceScores['Interpersonal Intelligence'] || 0) * 0.3;
      score += (intelligenceScores['Intrapersonal Intelligence'] || 0) * 0.25;
      score += (personalityTraits['Big Five - Agreeableness'] || 0) * 0.2;
    } else if (career.title === "Financial Analyst") {
      score += (aptitudes['Numerical Aptitude'] || 0) * 0.3;
      score += (intelligenceScores['Logical-Mathematical Intelligence'] || 0) * 0.25;
      score += (personalityTraits['Big Five - Conscientiousness'] || 0) * 0.2;
    } else if (career.title === "Content Strategist") {
      score += (intelligenceScores['Linguistic'] || 0) * 0.3;
      score += (aptitudes['Communication Skills'] || 0) * 0.25;
      score += (aptitudes['Creative/Design Skills'] || 0) * 0.2;
    } else if (career.title === "Environmental Scientist") {
      score += (intelligenceScores['Naturalistic Intelligence'] || 0) * 0.3;
      score += (aptitudes['Abstract Reasoning'] || 0) * 0.25;
      score += (aptitudes['Technical Skills'] || 0) * 0.2;
    } else if (career.title === "Physical Therapist") {
      score += (intelligenceScores['Bodily-Kinesthetic Intelligence'] || 0) * 0.3;
      score += (intelligenceScores['Interpersonal Intelligence'] || 0) * 0.25;
      score += (personalityTraits['Big Five - Agreeableness'] || 0) * 0.2;
    }

    // Normalize score to 0-100 range
    const normalizedScore = Math.min(Math.max(score * 20, 0), 100);

    // Calculate passion score from Layer 5 interests alignment
    const interestAvg = Object.values(interests).reduce((s, v) => s + v, 0) / (Object.values(interests).length || 1);
    const passionScore = Math.round(Math.min(interestAvg * 20, 100));

    return {
      ...career,
      compatibilityScore: Math.round(normalizedScore),
      passionScore,
    };
  }).sort((a, b) => b.compatibilityScore - a.compatibilityScore);
}

export function getCareerStrengthMap(
  career: CareerRecommendation,
  profile: UserProfile
): { matching: string[]; gaps: string[] } {
  const allScores: Record<string, number> = {
    ...profile.intelligenceScores,
    ...profile.personalityTraits,
    ...profile.aptitudes,
  };

  const matching: string[] = [];
  const gaps: string[] = [];

  for (const skill of career.strengthsUsed) {
    if ((allScores[skill] || 0) >= 3.5) {
      matching.push(skill);
    }
  }

  for (const skill of career.growthSkills) {
    gaps.push(skill);
  }

  return { matching, gaps };
}

export function getUserProfileSummary(profile: UserProfile): string {
  const topStrengths = profile.overallScores.topStrengths.slice(0, 3);
  const strengthsText = topStrengths.map(s => s.category).join(', ');

  return `Strong in ${strengthsText}. Overall assessment score: ${profile.overallScores.totalScore.toFixed(1)}/5. Top career compatibility areas based on comprehensive analysis of intelligence, personality, and aptitude factors.`;
}
