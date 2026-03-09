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

// Data-driven scoring weights: each career maps to weighted assessment dimensions
const CAREER_SCORE_WEIGHTS: Record<string, Array<{ key: string; source: 'intelligence' | 'personality' | 'aptitude'; weight: number }>> = {
  "Data Scientist": [
    { key: "Logical-Mathematical Intelligence", source: "intelligence", weight: 0.3 },
    { key: "Numerical Aptitude", source: "aptitude", weight: 0.2 },
    { key: "Abstract Reasoning", source: "aptitude", weight: 0.2 },
  ],
  "UX Designer": [
    { key: "Visual-Spatial Intelligence", source: "intelligence", weight: 0.3 },
    { key: "Creative/Design Skills", source: "aptitude", weight: 0.3 },
    { key: "Interpersonal Intelligence", source: "intelligence", weight: 0.2 },
  ],
  "Project Manager": [
    { key: "Interpersonal Intelligence", source: "intelligence", weight: 0.3 },
    { key: "Communication Skills", source: "aptitude", weight: 0.25 },
    { key: "Big Five - Conscientiousness", source: "personality", weight: 0.2 },
  ],
  "Software Engineer": [
    { key: "Logical-Mathematical Intelligence", source: "intelligence", weight: 0.3 },
    { key: "Technical Skills", source: "aptitude", weight: 0.3 },
    { key: "Abstract Reasoning", source: "aptitude", weight: 0.2 },
  ],
  "Marketing Specialist": [
    { key: "Linguistic", source: "intelligence", weight: 0.25 },
    { key: "Communication Skills", source: "aptitude", weight: 0.25 },
    { key: "Interpersonal Intelligence", source: "intelligence", weight: 0.2 },
  ],
  "Clinical Psychologist": [
    { key: "Interpersonal Intelligence", source: "intelligence", weight: 0.3 },
    { key: "Intrapersonal Intelligence", source: "intelligence", weight: 0.25 },
    { key: "Big Five - Agreeableness", source: "personality", weight: 0.2 },
  ],
  "Financial Analyst": [
    { key: "Numerical Aptitude", source: "aptitude", weight: 0.3 },
    { key: "Logical-Mathematical Intelligence", source: "intelligence", weight: 0.25 },
    { key: "Big Five - Conscientiousness", source: "personality", weight: 0.2 },
  ],
  "Content Strategist": [
    { key: "Linguistic", source: "intelligence", weight: 0.3 },
    { key: "Communication Skills", source: "aptitude", weight: 0.25 },
    { key: "Creative/Design Skills", source: "aptitude", weight: 0.2 },
  ],
  "Environmental Scientist": [
    { key: "Naturalistic Intelligence", source: "intelligence", weight: 0.3 },
    { key: "Abstract Reasoning", source: "aptitude", weight: 0.25 },
    { key: "Technical Skills", source: "aptitude", weight: 0.2 },
  ],
  "Physical Therapist": [
    { key: "Bodily-Kinesthetic Intelligence", source: "intelligence", weight: 0.3 },
    { key: "Interpersonal Intelligence", source: "intelligence", weight: 0.25 },
    { key: "Big Five - Agreeableness", source: "personality", weight: 0.2 },
  ],
  "Teacher / Educator": [
    { key: "Interpersonal Intelligence", source: "intelligence", weight: 0.3 },
    { key: "Linguistic", source: "intelligence", weight: 0.25 },
    { key: "Communication Skills", source: "aptitude", weight: 0.25 },
  ],
  "Journalist / Reporter": [
    { key: "Linguistic", source: "intelligence", weight: 0.35 },
    { key: "Communication Skills", source: "aptitude", weight: 0.25 },
    { key: "Interpersonal Intelligence", source: "intelligence", weight: 0.15 },
  ],
  "Architect": [
    { key: "Visual-Spatial Intelligence", source: "intelligence", weight: 0.35 },
    { key: "Creative/Design Skills", source: "aptitude", weight: 0.25 },
    { key: "Technical Skills", source: "aptitude", weight: 0.15 },
  ],
  "Civil Engineer": [
    { key: "Logical-Mathematical Intelligence", source: "intelligence", weight: 0.25 },
    { key: "Technical Skills", source: "aptitude", weight: 0.25 },
    { key: "Numerical Aptitude", source: "aptitude", weight: 0.2 },
  ],
  "Mechanical Engineer": [
    { key: "Logical-Mathematical Intelligence", source: "intelligence", weight: 0.25 },
    { key: "Technical Skills", source: "aptitude", weight: 0.3 },
    { key: "Abstract Reasoning", source: "aptitude", weight: 0.2 },
  ],
  "Nurse Practitioner": [
    { key: "Interpersonal Intelligence", source: "intelligence", weight: 0.3 },
    { key: "Big Five - Agreeableness", source: "personality", weight: 0.2 },
    { key: "Bodily-Kinesthetic Intelligence", source: "intelligence", weight: 0.2 },
  ],
  "Pharmacist": [
    { key: "Logical-Mathematical Intelligence", source: "intelligence", weight: 0.25 },
    { key: "Numerical Aptitude", source: "aptitude", weight: 0.2 },
    { key: "Big Five - Conscientiousness", source: "personality", weight: 0.25 },
  ],
  "Lawyer / Legal Advisor": [
    { key: "Linguistic", source: "intelligence", weight: 0.3 },
    { key: "Verbal Aptitude", source: "aptitude", weight: 0.25 },
    { key: "Logical-Mathematical Intelligence", source: "intelligence", weight: 0.2 },
  ],
  "Graphic Designer": [
    { key: "Visual-Spatial Intelligence", source: "intelligence", weight: 0.35 },
    { key: "Creative/Design Skills", source: "aptitude", weight: 0.3 },
    { key: "Big Five - Openness", source: "personality", weight: 0.15 },
  ],
  "Human Resources Manager": [
    { key: "Interpersonal Intelligence", source: "intelligence", weight: 0.3 },
    { key: "Communication Skills", source: "aptitude", weight: 0.25 },
    { key: "Big Five - Agreeableness", source: "personality", weight: 0.2 },
  ],
  "Accountant / Auditor": [
    { key: "Numerical Aptitude", source: "aptitude", weight: 0.35 },
    { key: "Big Five - Conscientiousness", source: "personality", weight: 0.25 },
    { key: "Logical-Mathematical Intelligence", source: "intelligence", weight: 0.15 },
  ],
  "Research Scientist": [
    { key: "Abstract Reasoning", source: "aptitude", weight: 0.3 },
    { key: "Logical-Mathematical Intelligence", source: "intelligence", weight: 0.25 },
    { key: "Intrapersonal Intelligence", source: "intelligence", weight: 0.15 },
  ],
  "Social Worker": [
    { key: "Interpersonal Intelligence", source: "intelligence", weight: 0.3 },
    { key: "Big Five - Agreeableness", source: "personality", weight: 0.25 },
    { key: "Communication Skills", source: "aptitude", weight: 0.2 },
  ],
  "Cybersecurity Analyst": [
    { key: "Logical-Mathematical Intelligence", source: "intelligence", weight: 0.3 },
    { key: "Technical Skills", source: "aptitude", weight: 0.3 },
    { key: "Abstract Reasoning", source: "aptitude", weight: 0.15 },
  ],
  "Product Manager": [
    { key: "Interpersonal Intelligence", source: "intelligence", weight: 0.25 },
    { key: "Communication Skills", source: "aptitude", weight: 0.25 },
    { key: "Logical-Mathematical Intelligence", source: "intelligence", weight: 0.2 },
  ],
  "Business Analyst": [
    { key: "Logical-Mathematical Intelligence", source: "intelligence", weight: 0.25 },
    { key: "Communication Skills", source: "aptitude", weight: 0.25 },
    { key: "Numerical Aptitude", source: "aptitude", weight: 0.2 },
  ],
  "Supply Chain Manager": [
    { key: "Logical-Mathematical Intelligence", source: "intelligence", weight: 0.25 },
    { key: "Numerical Aptitude", source: "aptitude", weight: 0.2 },
    { key: "Interpersonal Intelligence", source: "intelligence", weight: 0.2 },
  ],
  "Entrepreneur / Startup Founder": [
    { key: "Big Five - Openness", source: "personality", weight: 0.25 },
    { key: "SDT - Autonomy", source: "personality", weight: 0.25 },
    { key: "Interpersonal Intelligence", source: "intelligence", weight: 0.2 },
  ],
  "Public Relations Specialist": [
    { key: "Linguistic", source: "intelligence", weight: 0.25 },
    { key: "Interpersonal Intelligence", source: "intelligence", weight: 0.25 },
    { key: "Communication Skills", source: "aptitude", weight: 0.25 },
  ],
  "Physician / Doctor": [
    { key: "Logical-Mathematical Intelligence", source: "intelligence", weight: 0.2 },
    { key: "Interpersonal Intelligence", source: "intelligence", weight: 0.25 },
    { key: "Big Five - Conscientiousness", source: "personality", weight: 0.25 },
  ],
};

const BASE_CAREERS: Omit<CareerRecommendation, 'compatibilityScore' | 'passionScore'>[] = [
  {
    title: "Data Scientist",
    description: "Transform complex datasets into actionable insights that drive strategic business decisions",
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
  },
  {
    title: "UX Designer",
    description: "Craft intuitive, delightful digital experiences that solve real user problems",
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
  },
  {
    title: "Project Manager",
    description: "Orchestrate cross-functional teams to deliver complex projects on time and within scope",
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
  },
  {
    title: "Software Engineer",
    description: "Design, build, and maintain the software systems that power modern technology",
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
  },
  {
    title: "Marketing Specialist",
    description: "Develop and execute creative strategies that connect brands with their ideal audiences",
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
  },
  {
    title: "Clinical Psychologist",
    description: "Help individuals navigate mental health challenges through evidence-based therapeutic approaches",
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
  },
  {
    title: "Financial Analyst",
    description: "Evaluate financial data to guide investment decisions and business strategy",
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
  },
  {
    title: "Content Strategist",
    description: "Shape brand narratives and content ecosystems that engage audiences and drive business results",
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
  },
  {
    title: "Environmental Scientist",
    description: "Research and develop solutions to environmental challenges from climate change to conservation",
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
  },
  {
    title: "Physical Therapist",
    description: "Restore movement and improve quality of life through personalized rehabilitation programs",
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
  },
  // ---- 20 NEW CAREERS ----
  {
    title: "Teacher / Educator",
    description: "Inspire and shape the next generation through engaging, effective instruction",
    salaryRange: "$45k - $80k",
    marketDemand: "High",
    accessibility: "High",
    trends: "Stable",
    onetLink: "https://www.onetonline.org/link/summary/25-2031.00",
    educationRequired: "Bachelor's in Education or subject area; teaching certification required",
    keySkills: ["Curriculum Design", "Classroom Management", "Differentiated Instruction", "Assessment", "Communication"],
    dayInLife: "You'll prepare lessons, deliver engaging classes, assess student progress, meet with parents, and collaborate with fellow teachers. Every day brings new challenges and breakthroughs.",
    salaryProgression: { entry: "$38k - $48k", mid: "$50k - $70k", senior: "$72k - $95k" },
    relatedCareers: ["School Counselor", "Instructional Designer", "Education Administrator"],
    strengthsUsed: ["Interpersonal Intelligence", "Linguistic", "Communication Skills"],
    growthSkills: ["EdTech proficiency", "Special education", "Leadership and administration"],
    workStyle: "Structured — classroom-based with collaborative planning periods",
  },
  {
    title: "Journalist / Reporter",
    description: "Investigate, report, and tell stories that inform and engage the public",
    salaryRange: "$40k - $80k",
    marketDemand: "Medium",
    accessibility: "High",
    trends: "Stable",
    onetLink: "https://www.onetonline.org/link/summary/27-3023.00",
    educationRequired: "Bachelor's in Journalism, Communications, or English; strong portfolio essential",
    keySkills: ["Investigative Research", "Writing", "Interviewing", "Fact-Checking", "Deadline Management"],
    dayInLife: "You'll research stories, conduct interviews, write and edit articles under tight deadlines, and pitch new angles. Expect a mix of desk work, fieldwork, and rapid-fire news cycles.",
    salaryProgression: { entry: "$32k - $42k", mid: "$48k - $68k", senior: "$70k - $100k+" },
    relatedCareers: ["Editor", "Broadcast Journalist", "Communications Director"],
    strengthsUsed: ["Linguistic", "Communication Skills", "Interpersonal Intelligence"],
    growthSkills: ["Multimedia storytelling", "Data journalism", "Audience development"],
    workStyle: "Fast-paced — deadline-driven with a mix of independent and collaborative work",
  },
  {
    title: "Architect",
    description: "Design buildings and spaces that are functional, sustainable, and aesthetically inspiring",
    salaryRange: "$70k - $130k",
    marketDemand: "Medium",
    accessibility: "Low",
    trends: "Growing",
    onetLink: "https://www.onetonline.org/link/summary/17-1011.00",
    educationRequired: "Bachelor's or Master's in Architecture; licensure (ARE exam) required",
    keySkills: ["AutoCAD/Revit", "3D Modeling", "Building Codes", "Sustainable Design", "Client Communication"],
    dayInLife: "You'll draft designs, meet with clients, coordinate with engineers and contractors, review building codes, and oversee construction progress. A blend of creative vision and technical precision.",
    salaryProgression: { entry: "$55k - $70k", mid: "$80k - $110k", senior: "$115k - $160k+" },
    relatedCareers: ["Interior Designer", "Urban Planner", "Landscape Architect"],
    strengthsUsed: ["Visual-Spatial Intelligence", "Creative/Design Skills", "Technical Skills"],
    growthSkills: ["Sustainable/green design", "Project management", "Computational design"],
    workStyle: "Hybrid — studio design work with client meetings and site visits",
  },
  {
    title: "Civil Engineer",
    description: "Plan, design, and oversee construction of infrastructure that communities depend on",
    salaryRange: "$65k - $120k",
    marketDemand: "High",
    accessibility: "Medium",
    trends: "Growing",
    onetLink: "https://www.onetonline.org/link/summary/17-2051.00",
    educationRequired: "Bachelor's in Civil Engineering; PE license for senior roles",
    keySkills: ["Structural Analysis", "AutoCAD/Civil 3D", "Project Management", "Materials Science", "Surveying"],
    dayInLife: "You'll review blueprints, perform site inspections, run structural calculations, coordinate with contractors, and ensure compliance with regulations. Mix of office and field work.",
    salaryProgression: { entry: "$58k - $70k", mid: "$78k - $100k", senior: "$105k - $145k" },
    relatedCareers: ["Structural Engineer", "Environmental Engineer", "Construction Manager"],
    strengthsUsed: ["Logical-Mathematical Intelligence", "Technical Skills", "Numerical Aptitude"],
    growthSkills: ["BIM technology", "Sustainability certifications", "Leadership"],
    workStyle: "Hybrid — office design and analysis with regular on-site inspections",
  },
  {
    title: "Mechanical Engineer",
    description: "Design and optimize mechanical systems from consumer products to industrial machinery",
    salaryRange: "$70k - $125k",
    marketDemand: "High",
    accessibility: "Medium",
    trends: "Stable",
    onetLink: "https://www.onetonline.org/link/summary/17-2141.00",
    educationRequired: "Bachelor's in Mechanical Engineering; PE license valued",
    keySkills: ["SolidWorks/CAD", "Thermodynamics", "Materials Science", "Prototyping", "Testing & Validation"],
    dayInLife: "You'll design components in CAD, run simulations, build and test prototypes, troubleshoot production issues, and collaborate with manufacturing teams. Hands-on problem solving every day.",
    salaryProgression: { entry: "$60k - $75k", mid: "$82k - $108k", senior: "$110k - $150k" },
    relatedCareers: ["Aerospace Engineer", "Manufacturing Engineer", "Robotics Engineer"],
    strengthsUsed: ["Logical-Mathematical Intelligence", "Technical Skills", "Abstract Reasoning"],
    growthSkills: ["Additive manufacturing", "Simulation software", "Project leadership"],
    workStyle: "Hybrid — lab/workshop prototyping with office-based design and analysis",
  },
  {
    title: "Nurse Practitioner",
    description: "Provide advanced patient care, diagnose conditions, and prescribe treatments",
    salaryRange: "$90k - $140k",
    marketDemand: "High",
    accessibility: "Low",
    trends: "Growing",
    onetLink: "https://www.onetonline.org/link/summary/29-1171.00",
    educationRequired: "Master's in Nursing (MSN) required; national certification and state licensure",
    keySkills: ["Patient Assessment", "Clinical Decision-Making", "Prescribing", "Patient Education", "Empathy"],
    dayInLife: "You'll see patients, perform exams, order and interpret tests, prescribe medications, and coordinate care plans. Autonomous yet collaborative, with a strong patient relationship focus.",
    salaryProgression: { entry: "$82k - $95k", mid: "$100k - $125k", senior: "$130k - $160k" },
    relatedCareers: ["Physician Assistant", "Registered Nurse", "Clinical Nurse Specialist"],
    strengthsUsed: ["Interpersonal Intelligence", "Big Five - Agreeableness", "Bodily-Kinesthetic Intelligence"],
    growthSkills: ["Specialty certifications", "Telehealth", "Healthcare administration"],
    workStyle: "Clinical — patient-facing with team-based healthcare delivery",
  },
  {
    title: "Pharmacist",
    description: "Ensure safe and effective medication use through expert knowledge and patient counseling",
    salaryRange: "$100k - $145k",
    marketDemand: "Medium",
    accessibility: "Low",
    trends: "Stable",
    onetLink: "https://www.onetonline.org/link/summary/29-1051.00",
    educationRequired: "Doctor of Pharmacy (PharmD) required; state licensure mandatory",
    keySkills: ["Pharmacology", "Drug Interactions", "Patient Counseling", "Compounding", "Regulatory Compliance"],
    dayInLife: "You'll verify prescriptions, counsel patients on medications, monitor drug interactions, collaborate with physicians, and manage pharmacy operations. Precision and trust are paramount.",
    salaryProgression: { entry: "$95k - $110k", mid: "$115k - $135k", senior: "$138k - $160k" },
    relatedCareers: ["Clinical Pharmacist", "Pharmaceutical Scientist", "Pharmacy Manager"],
    strengthsUsed: ["Logical-Mathematical Intelligence", "Numerical Aptitude", "Big Five - Conscientiousness"],
    growthSkills: ["Clinical specialization", "Healthcare informatics", "Business management"],
    workStyle: "Structured — patient-facing retail/clinical with some independent review time",
  },
  {
    title: "Lawyer / Legal Advisor",
    description: "Advocate for clients, interpret laws, and navigate complex legal systems",
    salaryRange: "$75k - $165k",
    marketDemand: "Medium",
    accessibility: "Low",
    trends: "Stable",
    onetLink: "https://www.onetonline.org/link/summary/23-1011.00",
    educationRequired: "Juris Doctor (JD) required; must pass bar exam for practice",
    keySkills: ["Legal Research", "Argumentation", "Contract Drafting", "Negotiation", "Critical Thinking"],
    dayInLife: "You'll research case law, draft legal documents, meet with clients, negotiate settlements, and argue cases in court. Intellectually demanding with high-stakes outcomes.",
    salaryProgression: { entry: "$60k - $85k", mid: "$90k - $140k", senior: "$145k - $250k+" },
    relatedCareers: ["Corporate Counsel", "Judge", "Legal Consultant"],
    strengthsUsed: ["Linguistic", "Verbal Aptitude", "Logical-Mathematical Intelligence"],
    growthSkills: ["Specialization (IP, corporate, criminal)", "Mediation skills", "Business development"],
    workStyle: "Independent — case-driven work with client and courtroom interaction",
  },
  {
    title: "Graphic Designer",
    description: "Create visual concepts that communicate ideas and captivate audiences across media",
    salaryRange: "$45k - $85k",
    marketDemand: "Medium",
    accessibility: "High",
    trends: "Stable",
    onetLink: "https://www.onetonline.org/link/summary/27-1024.00",
    educationRequired: "Bachelor's in Graphic Design or related field; strong portfolio essential",
    keySkills: ["Adobe Creative Suite", "Typography", "Color Theory", "Layout Design", "Brand Identity"],
    dayInLife: "You'll conceptualize designs, create mockups, iterate based on feedback, prepare assets for print and digital, and collaborate with marketing and product teams. Creative and deadline-driven.",
    salaryProgression: { entry: "$38k - $48k", mid: "$52k - $72k", senior: "$75k - $110k" },
    relatedCareers: ["Art Director", "Motion Graphics Designer", "Brand Designer"],
    strengthsUsed: ["Visual-Spatial Intelligence", "Creative/Design Skills", "Big Five - Openness"],
    growthSkills: ["Motion graphics", "UI/UX design", "3D design tools"],
    workStyle: "Creative — studio or remote work with collaborative review cycles",
  },
  {
    title: "Human Resources Manager",
    description: "Build and nurture organizational talent through strategic people management",
    salaryRange: "$70k - $130k",
    marketDemand: "High",
    accessibility: "Medium",
    trends: "Stable",
    onetLink: "https://www.onetonline.org/link/summary/11-3121.00",
    educationRequired: "Bachelor's in HR, Business, or Psychology; SHRM/PHR certifications valued",
    keySkills: ["Talent Acquisition", "Employee Relations", "Compensation & Benefits", "Conflict Resolution", "HR Analytics"],
    dayInLife: "You'll manage hiring pipelines, handle employee concerns, design benefits packages, ensure compliance, and drive culture initiatives. Every day involves people problems and strategic decisions.",
    salaryProgression: { entry: "$55k - $70k", mid: "$78k - $110k", senior: "$115k - $160k" },
    relatedCareers: ["Talent Acquisition Manager", "Organizational Development Specialist", "Compensation Analyst"],
    strengthsUsed: ["Interpersonal Intelligence", "Communication Skills", "Big Five - Agreeableness"],
    growthSkills: ["People analytics", "Employment law expertise", "Change management"],
    workStyle: "Collaborative — people-facing role with strategic planning responsibilities",
  },
  {
    title: "Accountant / Auditor",
    description: "Maintain financial accuracy, ensure compliance, and provide trusted financial guidance",
    salaryRange: "$55k - $100k",
    marketDemand: "High",
    accessibility: "High",
    trends: "Stable",
    onetLink: "https://www.onetonline.org/link/summary/13-2011.01",
    educationRequired: "Bachelor's in Accounting or Finance; CPA certification highly valued",
    keySkills: ["Financial Reporting", "Tax Preparation", "Auditing", "GAAP/IFRS", "Excel/Accounting Software"],
    dayInLife: "You'll prepare financial statements, reconcile accounts, conduct audits, advise on tax strategy, and ensure regulatory compliance. Detail-oriented, cyclical work with busy seasons.",
    salaryProgression: { entry: "$48k - $58k", mid: "$62k - $85k", senior: "$88k - $130k" },
    relatedCareers: ["Tax Advisor", "Controller", "Forensic Accountant"],
    strengthsUsed: ["Numerical Aptitude", "Big Five - Conscientiousness", "Logical-Mathematical Intelligence"],
    growthSkills: ["Industry specialization", "Data analytics", "Advisory services"],
    workStyle: "Structured — office-based with cyclical busy periods (tax/audit season)",
  },
  {
    title: "Research Scientist",
    description: "Push the boundaries of human knowledge through systematic investigation and discovery",
    salaryRange: "$65k - $120k",
    marketDemand: "Medium",
    accessibility: "Low",
    trends: "Growing",
    onetLink: "https://www.onetonline.org/link/summary/19-1042.00",
    educationRequired: "PhD typically required; Master's sufficient for some industry positions",
    keySkills: ["Experimental Design", "Data Analysis", "Scientific Writing", "Grant Writing", "Peer Review"],
    dayInLife: "You'll design experiments, collect and analyze data, write papers, present at conferences, and mentor junior researchers. Deep, focused work with moments of breakthrough excitement.",
    salaryProgression: { entry: "$55k - $72k", mid: "$78k - $105k", senior: "$110k - $150k+" },
    relatedCareers: ["R&D Director", "Lab Manager", "Science Policy Advisor"],
    strengthsUsed: ["Abstract Reasoning", "Logical-Mathematical Intelligence", "Intrapersonal Intelligence"],
    growthSkills: ["Interdisciplinary collaboration", "Data science tools", "Science communication"],
    workStyle: "Independent — lab/research-based with academic collaboration",
  },
  {
    title: "Social Worker",
    description: "Support individuals and communities through counseling, advocacy, and resource coordination",
    salaryRange: "$45k - $75k",
    marketDemand: "High",
    accessibility: "Medium",
    trends: "Growing",
    onetLink: "https://www.onetonline.org/link/summary/21-1021.00",
    educationRequired: "Bachelor's in Social Work (BSW); Master's (MSW) for clinical roles",
    keySkills: ["Case Management", "Crisis Intervention", "Advocacy", "Cultural Competence", "Active Listening"],
    dayInLife: "You'll meet with clients, assess needs, connect families to resources, advocate within systems, and document case progress. Emotionally rich work with direct community impact.",
    salaryProgression: { entry: "$38k - $48k", mid: "$50k - $65k", senior: "$68k - $90k" },
    relatedCareers: ["Counselor", "Community Organizer", "Case Manager"],
    strengthsUsed: ["Interpersonal Intelligence", "Big Five - Agreeableness", "Communication Skills"],
    growthSkills: ["Clinical licensure", "Policy advocacy", "Program management"],
    workStyle: "Field-based — community outreach with office-based documentation",
  },
  {
    title: "Cybersecurity Analyst",
    description: "Protect organizations from digital threats through monitoring, analysis, and defense strategies",
    salaryRange: "$80k - $140k",
    marketDemand: "High",
    accessibility: "Medium",
    trends: "Growing",
    onetLink: "https://www.onetonline.org/link/summary/15-1212.00",
    educationRequired: "Bachelor's in CS, IT, or Cybersecurity; certifications (CISSP, CEH) highly valued",
    keySkills: ["Threat Analysis", "Network Security", "Incident Response", "Penetration Testing", "Security Tools"],
    dayInLife: "You'll monitor security alerts, investigate incidents, conduct vulnerability assessments, update security policies, and train staff on best practices. High-stakes, constantly evolving work.",
    salaryProgression: { entry: "$65k - $85k", mid: "$92k - $120k", senior: "$125k - $170k+" },
    relatedCareers: ["Security Engineer", "Penetration Tester", "Chief Information Security Officer"],
    strengthsUsed: ["Logical-Mathematical Intelligence", "Technical Skills", "Abstract Reasoning"],
    growthSkills: ["Cloud security", "Compliance frameworks", "Threat intelligence"],
    workStyle: "Focused — SOC/office-based with on-call rotation for incidents",
  },
  {
    title: "Product Manager",
    description: "Define product vision and strategy, bridging user needs with business goals and technology",
    salaryRange: "$90k - $160k",
    marketDemand: "High",
    accessibility: "Medium",
    trends: "Growing",
    onetLink: "https://www.onetonline.org/link/summary/11-2021.00",
    educationRequired: "Bachelor's in any field; MBA or technical background preferred",
    keySkills: ["Product Strategy", "User Research", "Roadmap Planning", "Data-Driven Decisions", "Cross-Team Leadership"],
    dayInLife: "You'll prioritize features, align stakeholders, analyze metrics, talk to users, and guide engineering teams. You're the connective tissue between business, design, and technology.",
    salaryProgression: { entry: "$75k - $95k", mid: "$105k - $140k", senior: "$145k - $200k+" },
    relatedCareers: ["Product Owner", "Growth Manager", "Director of Product"],
    strengthsUsed: ["Interpersonal Intelligence", "Communication Skills", "Logical-Mathematical Intelligence"],
    growthSkills: ["Technical depth", "Financial modeling", "Market analysis"],
    workStyle: "Collaborative — embedded in cross-functional product teams with high autonomy",
  },
  {
    title: "Business Analyst",
    description: "Bridge the gap between business needs and technology solutions through rigorous analysis",
    salaryRange: "$65k - $110k",
    marketDemand: "High",
    accessibility: "High",
    trends: "Growing",
    onetLink: "https://www.onetonline.org/link/summary/13-1111.00",
    educationRequired: "Bachelor's in Business, IT, or related field; CBAP certification valued",
    keySkills: ["Requirements Gathering", "Process Modeling", "SQL/Data Analysis", "Stakeholder Management", "Documentation"],
    dayInLife: "You'll elicit requirements from stakeholders, map business processes, analyze data for insights, create user stories, and validate that solutions meet business needs.",
    salaryProgression: { entry: "$55k - $68k", mid: "$72k - $95k", senior: "$98k - $135k" },
    relatedCareers: ["Systems Analyst", "Data Analyst", "Management Consultant"],
    strengthsUsed: ["Logical-Mathematical Intelligence", "Communication Skills", "Numerical Aptitude"],
    growthSkills: ["Data visualization tools", "Agile methodologies", "Domain expertise"],
    workStyle: "Collaborative — stakeholder-facing analysis with independent deep-dive work",
  },
  {
    title: "Supply Chain Manager",
    description: "Optimize the flow of goods from suppliers to customers for maximum efficiency and value",
    salaryRange: "$70k - $120k",
    marketDemand: "High",
    accessibility: "Medium",
    trends: "Growing",
    onetLink: "https://www.onetonline.org/link/summary/11-3071.00",
    educationRequired: "Bachelor's in Supply Chain, Business, or Engineering; APICS certification valued",
    keySkills: ["Logistics Planning", "Vendor Management", "Inventory Optimization", "ERP Systems", "Negotiation"],
    dayInLife: "You'll coordinate with suppliers, optimize inventory levels, resolve logistics issues, analyze cost-efficiency, and implement process improvements. Data-driven with global coordination.",
    salaryProgression: { entry: "$58k - $72k", mid: "$78k - $100k", senior: "$105k - $145k" },
    relatedCareers: ["Logistics Manager", "Procurement Specialist", "Operations Director"],
    strengthsUsed: ["Logical-Mathematical Intelligence", "Numerical Aptitude", "Interpersonal Intelligence"],
    growthSkills: ["AI/ML for demand forecasting", "Sustainability practices", "Global trade compliance"],
    workStyle: "Hybrid — office-based planning with warehouse and supplier visits",
  },
  {
    title: "Entrepreneur / Startup Founder",
    description: "Build innovative businesses from the ground up, turning vision into reality",
    salaryRange: "$0 - $200k+",
    marketDemand: "High",
    accessibility: "High",
    trends: "Growing",
    educationRequired: "No formal requirement; diverse backgrounds valued; MBA or domain expertise helps",
    keySkills: ["Business Strategy", "Fundraising", "Leadership", "Product Development", "Resilience"],
    dayInLife: "Every day is different — pitching investors, building product, hiring talent, solving fires, talking to customers. High risk, high reward. You wear every hat until the team grows.",
    salaryProgression: { entry: "$0 - $50k", mid: "$50k - $150k", senior: "$150k - unlimited" },
    relatedCareers: ["Business Consultant", "Venture Capitalist", "Product Manager"],
    strengthsUsed: ["Big Five - Openness", "SDT - Autonomy", "Interpersonal Intelligence"],
    growthSkills: ["Financial management", "Sales and marketing", "Delegation and team building"],
    workStyle: "Autonomous — self-directed with intense collaboration during team-building phases",
  },
  {
    title: "Public Relations Specialist",
    description: "Shape public perception and build brand reputation through strategic communication",
    salaryRange: "$50k - $95k",
    marketDemand: "Medium",
    accessibility: "High",
    trends: "Stable",
    onetLink: "https://www.onetonline.org/link/summary/27-3031.00",
    educationRequired: "Bachelor's in PR, Communications, or Journalism; APR certification valued",
    keySkills: ["Media Relations", "Press Releases", "Crisis Management", "Event Planning", "Social Media Strategy"],
    dayInLife: "You'll write press releases, pitch journalists, manage social media accounts, handle crisis communications, and coordinate events. Fast-paced, relationship-heavy, and never boring.",
    salaryProgression: { entry: "$40k - $52k", mid: "$55k - $78k", senior: "$80k - $120k" },
    relatedCareers: ["Communications Director", "Media Relations Manager", "Brand Strategist"],
    strengthsUsed: ["Linguistic", "Interpersonal Intelligence", "Communication Skills"],
    growthSkills: ["Digital analytics", "Video production", "International communications"],
    workStyle: "Fast-paced — highly collaborative with media and stakeholder interaction",
  },
  {
    title: "Physician / Doctor",
    description: "Diagnose and treat illnesses, promoting health and well-being through expert medical care",
    salaryRange: "$200k - $400k+",
    marketDemand: "High",
    accessibility: "Low",
    trends: "Growing",
    onetLink: "https://www.onetonline.org/link/summary/29-1218.00",
    educationRequired: "MD or DO degree required; 3-7 years residency training; board certification",
    keySkills: ["Clinical Diagnosis", "Patient Communication", "Medical Procedures", "Evidence-Based Medicine", "Empathy"],
    dayInLife: "You'll see patients, make diagnoses, order and interpret tests, perform procedures, and coordinate with specialists. Long hours but deeply meaningful work saving and improving lives.",
    salaryProgression: { entry: "$55k (residency)", mid: "$200k - $300k", senior: "$300k - $500k+" },
    relatedCareers: ["Surgeon", "Specialist Physician", "Medical Director"],
    strengthsUsed: ["Logical-Mathematical Intelligence", "Interpersonal Intelligence", "Big Five - Conscientiousness"],
    growthSkills: ["Subspecialization", "Research", "Healthcare leadership"],
    workStyle: "Clinical — patient-facing with team-based hospital/practice setting",
  },
];

export function generateCareerRecommendations(profile: UserProfile): CareerRecommendation[] {
  const { intelligenceScores, personalityTraits, aptitudes, interests } = profile;

  const scoreSources: Record<string, Record<string, number>> = {
    intelligence: intelligenceScores,
    personality: personalityTraits,
    aptitude: aptitudes,
  };

  // Calculate passion score from Layer 5 interests alignment
  const interestAvg = Object.values(interests).reduce((s, v) => s + v, 0) / (Object.values(interests).length || 1);
  const passionScore = Math.round(Math.min(interestAvg * 20, 100));

  return BASE_CAREERS.map(career => {
    const weights = CAREER_SCORE_WEIGHTS[career.title];
    let score = 0;

    if (weights) {
      for (const w of weights) {
        score += (scoreSources[w.source]?.[w.key] || 0) * w.weight;
      }
    }

    // Normalize score to 0-100 range
    const normalizedScore = Math.min(Math.max(score * 20, 0), 100);

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
