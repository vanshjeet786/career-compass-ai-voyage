// Human-readable display names for assessment category keys.
// Used at the presentation layer only — internal scoring still uses raw keys.

const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  // Layer 1: Intelligence Types
  "Linguistic": "Language & Communication",
  "Logical-Mathematical Intelligence": "Analytical Thinking",
  "Interpersonal Intelligence": "People Skills",
  "Intrapersonal Intelligence": "Self-Awareness",
  "Naturalistic Intelligence": "Environmental Awareness",
  "Bodily-Kinesthetic Intelligence": "Hands-On Skills",
  "Musical Intelligence": "Rhythm & Audio Perception",
  "Visual-Spatial Intelligence": "Visual & Spatial Thinking",
  "Cognitive Styles": "Learning & Thinking Styles",

  // Layer 2: Personality Traits
  "MBTI": "Personality Type Preferences",
  "Big Five - Openness": "Curiosity & Creativity",
  "Big Five - Conscientiousness": "Organization & Discipline",
  "Big Five - Extraversion": "Social Energy",
  "Big Five - Agreeableness": "Empathy & Cooperation",
  "Big Five - Neuroticism": "Emotional Sensitivity",
  "SDT - Autonomy": "Drive for Independence",
  "SDT - Competence": "Mastery & Achievement",
  "SDT - Relatedness": "Connection & Belonging",

  // Layer 3: Aptitudes & Skills
  "Numerical Aptitude": "Number Fluency & Analysis",
  "Verbal Aptitude": "Verbal Comprehension",
  "Abstract Reasoning": "Abstract & Logical Reasoning",
  "Technical Skills": "Technical Proficiency",
  "Creative/Design Skills": "Creative & Design Thinking",
  "Communication Skills": "Persuasion & Presentation",

  // Layer 4: Background & Context
  "Educational Background": "Educational Foundation",
  "Socioeconomic Factors": "Resources & Access",
  "Career Exposure": "Career Awareness",

  // Layer 5: Interests & Values
  "Interests and Passions": "Passions & Motivation",
  "Career Trends Awareness": "Market & Trend Awareness",
  "Personal Goals and Values": "Purpose & Values",
};

/**
 * Returns a human-readable display name for a technical category key.
 * Falls back to the raw key if no mapping exists.
 */
export function getDisplayName(technicalKey: string): string {
  return CATEGORY_DISPLAY_NAMES[technicalKey] ?? technicalKey;
}
