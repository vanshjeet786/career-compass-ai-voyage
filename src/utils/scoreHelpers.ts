import type { UserProfile, CareerRecommendation } from "./userProfile";
import { getDisplayName } from "./categoryLabels";

// ─── Unified Score Colors ───────────────────────────────────────────────────

export function getScoreColor(score: number): { text: string; bg: string; bar: string } {
  if (score >= 4.0) return { text: "text-green-600 dark:text-green-400", bg: "bg-green-500/10", bar: "bg-green-500" };
  if (score >= 3.0) return { text: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10", bar: "bg-amber-500" };
  if (score >= 2.0) return { text: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10", bar: "bg-orange-500" };
  return { text: "text-red-600 dark:text-red-400", bg: "bg-red-500/10", bar: "bg-red-500" };
}

export function getScoreBarHsl(score: number): string {
  if (score >= 4.0) return "hsl(142, 71%, 45%)";
  if (score >= 3.0) return "hsl(38, 92%, 50%)";
  if (score >= 2.0) return "hsl(25, 95%, 53%)";
  return "hsl(0, 84%, 60%)";
}

// ─── Score Tiers ────────────────────────────────────────────────────────────

export type ScoreTier = "exceptional" | "strong" | "developing" | "emerging";

export function getScoreTier(score: number): { tier: ScoreTier; label: string; description: string } {
  if (score >= 4.5) return { tier: "exceptional", label: "Exceptional", description: "A defining trait in your profile" };
  if (score >= 3.5) return { tier: "strong", label: "Strong", description: "A reliable strength you can build on" };
  if (score >= 2.5) return { tier: "developing", label: "Developing", description: "An area with clear growth potential" };
  return { tier: "emerging", label: "Emerging", description: "An untapped opportunity to explore" };
}

// ─── Category Interpretation ────────────────────────────────────────────────

const CATEGORY_CONTEXTS: Record<string, { domain: string; highCareers: string; actionTip: string }> = {
  "Linguistic": { domain: "verbal and written expression", highCareers: "writing, law, teaching, public relations", actionTip: "Seek roles where persuasive communication drives impact" },
  "Logical-Mathematical Intelligence": { domain: "analytical thinking and pattern recognition", highCareers: "STEM, finance, research, data science", actionTip: "Look for roles combining systematic analysis with real-world problem solving" },
  "Interpersonal Intelligence": { domain: "understanding and collaborating with others", highCareers: "management, counseling, sales, team leadership", actionTip: "Lean into roles where reading people and building relationships is central" },
  "Intrapersonal Intelligence": { domain: "self-awareness and personal goal-setting", highCareers: "leadership, entrepreneurship, coaching", actionTip: "Use this self-knowledge to choose environments that truly energize you" },
  "Naturalistic Intelligence": { domain: "environmental awareness and pattern spotting", highCareers: "environmental science, agriculture, conservation", actionTip: "Consider careers connecting analytical skills with natural systems" },
  "Bodily-Kinesthetic Intelligence": { domain: "physical coordination and hands-on learning", highCareers: "trades, sports, performing arts, physical therapy", actionTip: "Prioritize roles with tangible, hands-on work over purely desk-based positions" },
  "Musical Intelligence": { domain: "rhythm, pitch, and auditory pattern recognition", highCareers: "music production, sound engineering, performing arts", actionTip: "Even outside music careers, this sensitivity enhances creative work" },
  "Visual-Spatial Intelligence": { domain: "spatial reasoning and visual thinking", highCareers: "architecture, design, engineering, data visualization", actionTip: "Seek roles where visual thinking translates into tangible outputs" },
  "Cognitive Styles": { domain: "meta-cognitive awareness and adaptability", highCareers: "consulting, education, research", actionTip: "This awareness helps you thrive across diverse work environments" },
  "MBTI": { domain: "personality preferences and work style", highCareers: "varies by type — use preferences to match culture", actionTip: "Focus on work environments that align with your natural energy flow" },
  "Big Five - Openness": { domain: "curiosity, creativity, and intellectual exploration", highCareers: "innovation, R&D, arts, startups", actionTip: "Seek roles that reward experimentation and fresh perspectives" },
  "Big Five - Conscientiousness": { domain: "organization, reliability, and attention to detail", highCareers: "project management, finance, healthcare, operations", actionTip: "Your discipline is a major asset — pair it with work you find meaningful" },
  "Big Five - Extraversion": { domain: "social energy and outgoing engagement", highCareers: "sales, marketing, teaching, leadership", actionTip: "Choose roles with regular interaction, not prolonged isolation" },
  "Big Five - Agreeableness": { domain: "empathy, cooperation, and team harmony", highCareers: "counseling, healthcare, education, HR", actionTip: "Your collaborative nature thrives in team-oriented cultures" },
  "Big Five - Neuroticism": { domain: "emotional sensitivity and stress response", highCareers: "structured environments with good support systems", actionTip: "Prioritize workplaces with clear expectations and strong team support" },
  "SDT - Autonomy": { domain: "independence and self-direction at work", highCareers: "entrepreneurship, consulting, freelancing, remote roles", actionTip: "Negotiate for flexibility and ownership in any role you take" },
  "SDT - Competence": { domain: "drive to master skills and achieve excellence", highCareers: "technical specialties, certifications, skill-intensive roles", actionTip: "Seek roles with clear growth ladders and learning opportunities" },
  "SDT - Relatedness": { domain: "need for meaningful workplace connections", highCareers: "team-oriented cultures, community organizations", actionTip: "Prioritize workplace culture and relationships alongside role fit" },
  "Numerical Aptitude": { domain: "quantitative analysis and number fluency", highCareers: "finance, data science, engineering, accounting", actionTip: "Combine numerical skills with domain expertise for maximum impact" },
  "Verbal Aptitude": { domain: "language comprehension and expression", highCareers: "law, journalism, teaching, marketing", actionTip: "Roles requiring persuasive writing or speaking will leverage this well" },
  "Abstract Reasoning": { domain: "logical deduction and complex problem solving", highCareers: "programming, research, strategy, consulting", actionTip: "Tackle roles where novel, ambiguous problems need elegant solutions" },
  "Technical Skills": { domain: "technical tool mastery and systems thinking", highCareers: "IT, engineering, technical specialist roles", actionTip: "Stay current with emerging tools — your aptitude for learning them is high" },
  "Creative/Design Skills": { domain: "creative ideation and aesthetic judgment", highCareers: "graphic design, UX/UI, advertising, architecture", actionTip: "Pair creative skills with strategic thinking for standout career paths" },
  "Communication Skills": { domain: "persuasion, presentation, and audience connection", highCareers: "leadership, sales, media, public relations", actionTip: "This skill multiplies the value of all your other strengths" },
  "Educational Background": { domain: "formal education and learning resources", highCareers: "varies — strong foundation opens more doors", actionTip: "Supplement with targeted online courses in your career interest areas" },
  "Socioeconomic Factors": { domain: "financial and resource access for career development", highCareers: "varies by resources available", actionTip: "Seek scholarships, free programs, and paid apprenticeships to bridge gaps" },
  "Career Exposure": { domain: "breadth of career awareness and exposure", highCareers: "informed decision-making across all fields", actionTip: "Pursue informational interviews and job shadowing to broaden your view" },
  "Interests and Passions": { domain: "intrinsic motivation and engagement", highCareers: "roles aligned with personal passions", actionTip: "Passion sustains motivation — find the overlap with market demand" },
  "Career Trends Awareness": { domain: "market awareness and strategic thinking", highCareers: "future-proof roles in growing industries", actionTip: "Use this awareness to position yourself in emerging fields early" },
  "Personal Goals and Values": { domain: "value alignment and purpose-driven work", highCareers: "mission-driven organizations, social impact roles", actionTip: "Clear values are your compass — don't compromise them for short-term gains" },
};

export function getScoreInterpretation(score: number, categoryName: string): string {
  const tier = getScoreTier(score);
  const ctx = CATEGORY_CONTEXTS[categoryName];

  if (!ctx) {
    return `You scored ${score.toFixed(1)}/5 — ${tier.description.toLowerCase()}.`;
  }

  if (tier.tier === "exceptional") {
    return `Scoring ${score.toFixed(1)}/5 in ${ctx.domain} is exceptional — this is a defining strength. Careers in ${ctx.highCareers} would let you leverage this fully. ${ctx.actionTip}.`;
  }
  if (tier.tier === "strong") {
    return `At ${score.toFixed(1)}/5, your ${ctx.domain} is a reliable strength. You'd do well in ${ctx.highCareers}. ${ctx.actionTip}.`;
  }
  if (tier.tier === "developing") {
    return `Scoring ${score.toFixed(1)}/5 in ${ctx.domain} shows developing capability with clear room to grow. ${ctx.actionTip}.`;
  }
  return `At ${score.toFixed(1)}/5, ${ctx.domain} is an emerging area for you. This isn't a limitation — it's an opportunity. ${ctx.actionTip}.`;
}

// ─── Layer Narratives ───────────────────────────────────────────────────────

export function getLayerNarrative(layerName: string, subScores: { name: string; score: number }[]): string {
  if (subScores.length === 0) return "";

  const sorted = [...subScores].sort((a, b) => b.score - a.score);
  const top = sorted[0];
  const second = sorted[1];
  const avg = subScores.reduce((s, i) => s + i.score, 0) / subScores.length;

  const topLabel = getDisplayName(top.name);
  const secondLabel = second ? getDisplayName(second.name) : "";

  if (layerName.includes("Intelligence")) {
    return `Your intelligence profile is strongest in ${topLabel} (${top.score.toFixed(1)}/5)${second ? ` and ${secondLabel} (${second.score.toFixed(1)}/5)` : ""}. With an average of ${avg.toFixed(1)}/5, ${avg >= 3.5 ? "you have a well-defined cognitive profile with clear direction" : "there's meaningful room to develop across multiple dimensions"}.`;
  }
  if (layerName.includes("Personality")) {
    return `Your personality profile highlights ${topLabel} (${top.score.toFixed(1)}/5) as your most defining trait${second ? `, followed by ${secondLabel}` : ""}. ${avg >= 3.5 ? "This combination suggests strong self-awareness and clear work style preferences." : "Understanding these traits will help you find environments where you naturally thrive."}`;
  }
  if (layerName.includes("Aptitude")) {
    return `${topLabel} (${top.score.toFixed(1)}/5) stands out as your strongest practical skill${second ? `, closely followed by ${secondLabel}` : ""}. ${avg >= 3.5 ? "Your skill profile is well-rounded and career-ready." : "Targeted skill development can rapidly strengthen your professional toolkit."}`;
  }
  if (layerName.includes("Background")) {
    return `Your background context shows ${topLabel} (${top.score.toFixed(1)}/5) as your strongest foundation. ${avg >= 3.5 ? "You have solid resources to support your career development." : "Identifying accessible pathways and resources will be key to your next steps."}`;
  }
  if (layerName.includes("Interest")) {
    return `${topLabel} (${top.score.toFixed(1)}/5) is where your motivation burns brightest. ${avg >= 3.5 ? "Strong interests and clear values give you a powerful compass for career decisions." : "Exploring diverse experiences can help sharpen what truly energizes you."}`;
  }

  return `Your strongest dimension is ${topLabel} at ${top.score.toFixed(1)}/5, with an overall average of ${avg.toFixed(1)}/5.`;
}

// ─── Executive Summary ──────────────────────────────────────────────────────

export function generateExecutiveSummary(
  profile: UserProfile,
  careers: CareerRecommendation[]
): string {
  const { topStrengths, developmentAreas, totalScore } = profile.overallScores;
  const top2 = topStrengths.slice(0, 2).map((s) => getDisplayName(s.category));
  const topCareer = careers[0];
  const growthNames = developmentAreas.slice(0, 2).map((s) => getDisplayName(s.category));

  const openLine = totalScore >= 4
    ? "Your assessment reveals a highly defined profile with exceptional clarity."
    : totalScore >= 3
      ? "Your assessment paints the picture of someone with clear strengths and promising direction."
      : "Your assessment highlights several emerging strengths with exciting room to grow.";

  const strengthLine = `You scored highest in ${top2[0]}${top2[1] ? ` and ${top2[1]}` : ""}, which positions you well for careers that demand ${getCategoryDomain(top2[0])}${top2[1] ? ` combined with ${getCategoryDomain(top2[1])}` : ""}.`;

  const careerLine = topCareer
    ? `Your top career match is ${topCareer.title} at ${topCareer.compatibilityScore}% compatibility.`
    : "";

  const growthLine = growthNames.length > 0
    ? `Your growth areas in ${growthNames.join(" and ")} are common and should not concern you — they represent opportunities, not limitations.`
    : "";

  return `${openLine} ${strengthLine} ${careerLine} ${growthLine}`;
}

function getCategoryDomain(category: string): string {
  const ctx = CATEGORY_CONTEXTS[category];
  return ctx?.domain || category.toLowerCase();
}

// ─── Strengths / Growth Narratives ──────────────────────────────────────────

export function getStrengthsNarrative(strengths: { name: string; score: number }[]): string {
  if (strengths.length === 0) return "";
  const names = strengths.slice(0, 3).map((s) => getDisplayName(s.name));
  if (names.length === 1) {
    return `Your standout strength in ${names[0]} is the anchor of your professional identity.`;
  }
  return `Your combination of ${names.slice(0, -1).join(", ")} and ${names[names.length - 1]} creates a distinctive professional identity. This blend suggests you'd excel in roles that require both analytical rigor and human connection.`;
}

export function getGrowthNarrative(areas: { name: string; score: number }[]): string {
  if (areas.length === 0) return "";
  const names = areas.map((s) => getDisplayName(s.name));
  return `Your developing areas in ${names.join(" and ")} aren't roadblocks — they're invitations to grow. Many successful professionals have similar profiles and thrive by leaning into their strengths while gradually building complementary skills.`;
}

// ─── Career Relevance ───────────────────────────────────────────────────────

const CAREER_SCORE_KEYS: Record<string, string[]> = {
  "Data Scientist": ["Logical-Mathematical Intelligence", "Numerical Aptitude", "Abstract Reasoning", "Technical Skills"],
  "UX Designer": ["Visual-Spatial Intelligence", "Creative/Design Skills", "Interpersonal Intelligence", "Communication Skills"],
  "Project Manager": ["Interpersonal Intelligence", "Communication Skills", "Big Five - Conscientiousness", "SDT - Competence"],
  "Software Engineer": ["Logical-Mathematical Intelligence", "Technical Skills", "Abstract Reasoning", "Cognitive Styles"],
  "Marketing Specialist": ["Linguistic", "Communication Skills", "Interpersonal Intelligence", "Big Five - Extraversion"],
  "Clinical Psychologist": ["Interpersonal Intelligence", "Intrapersonal Intelligence", "Big Five - Agreeableness", "Communication Skills"],
  "Financial Analyst": ["Numerical Aptitude", "Logical-Mathematical Intelligence", "Big Five - Conscientiousness", "Abstract Reasoning"],
  "Content Strategist": ["Linguistic", "Communication Skills", "Creative/Design Skills", "Big Five - Openness"],
  "Environmental Scientist": ["Naturalistic Intelligence", "Abstract Reasoning", "Technical Skills", "Logical-Mathematical Intelligence"],
  "Physical Therapist": ["Bodily-Kinesthetic Intelligence", "Interpersonal Intelligence", "Big Five - Agreeableness", "Communication Skills"],
};

export function getCareerRelevanceForCategory(categoryName: string): string[] {
  const careers: string[] = [];
  for (const [career, keys] of Object.entries(CAREER_SCORE_KEYS)) {
    if (keys.includes(categoryName)) {
      careers.push(career);
    }
  }
  return careers;
}

// ─── Cross-Layer Insights ───────────────────────────────────────────────────

export interface CrossLayerInsight {
  icon: "brain" | "heart" | "target" | "zap" | "compass" | "lightbulb";
  title: string;
  narrative: string;
}

export function generateCrossLayerInsights(profile: UserProfile): CrossLayerInsight[] {
  const insights: CrossLayerInsight[] = [];

  const get = (key: string): number => {
    return (
      profile.intelligenceScores[key] ??
      profile.personalityTraits[key] ??
      profile.aptitudes[key] ??
      profile.backgroundFactors[key] ??
      profile.interests[key] ??
      0
    );
  };

  // Analytical + Introverted → deep research roles
  if (get("Logical-Mathematical Intelligence") >= 3.8 && get("Big Five - Extraversion") <= 2.8) {
    insights.push({
      icon: "brain",
      title: "Focused Analytical Thinker",
      narrative:
        "Your strong analytical abilities combined with a reflective, inward-oriented personality suggest you thrive in focused, independent research or technical roles. You likely do your best work when given space to think deeply without constant interruption.",
    });
  }

  // Creative + Autonomous → freelance/startup
  if (get("Creative/Design Skills") >= 3.5 && get("SDT - Autonomy") >= 3.8) {
    insights.push({
      icon: "zap",
      title: "Independent Creative Spirit",
      narrative:
        "Your creative abilities paired with a strong drive for independence make you well-suited for freelance work, startups, or any environment where you can shape your own projects. You're energized by the freedom to explore unconventional ideas.",
    });
  }

  // Conscientious + Technical → quality-critical engineering
  if (get("Big Five - Conscientiousness") >= 3.8 && get("Technical Skills") >= 3.5) {
    insights.push({
      icon: "target",
      title: "Precision-Driven Professional",
      narrative:
        "Your disciplined, detail-oriented nature combined with technical proficiency positions you exceptionally well for quality-critical roles — think engineering, finance, or data work where accuracy matters. Others trust your work because you get it right.",
    });
  }

  // Interpersonal + Extraversion → people-facing leadership
  if (get("Interpersonal Intelligence") >= 3.5 && get("Big Five - Extraversion") >= 3.5) {
    insights.push({
      icon: "heart",
      title: "Natural People Leader",
      narrative:
        "Your ability to read others combined with genuine social energy makes you a natural leader. You're at your best in team environments — managing, mentoring, or inspiring others. Roles in leadership, sales, or client relations would leverage this strength beautifully.",
    });
  }

  // High Openness + Low Conscientiousness → needs innovation + structure support
  if (get("Big Five - Openness") >= 3.8 && get("Big Five - Conscientiousness") <= 2.8) {
    insights.push({
      icon: "lightbulb",
      title: "Visionary Innovator",
      narrative:
        "Your high curiosity and creativity generate big ideas, though you may find structured follow-through less natural. You'll thrive in innovation-focused roles with supportive project management or a co-founder who handles execution while you drive vision.",
    });
  }

  // Strong Verbal + Interpersonal → communication-driven leadership
  if (get("Verbal Aptitude") >= 3.5 && get("Interpersonal Intelligence") >= 3.5) {
    insights.push({
      icon: "compass",
      title: "Persuasive Communicator",
      narrative:
        "Your verbal fluency combined with strong interpersonal awareness makes you exceptionally effective at influence and persuasion. Careers in law, consulting, public relations, or executive communication would let you use both strengths simultaneously.",
    });
  }

  // Passion + Low Career Exposure → needs exploration
  if (get("Interests and Passions") >= 3.8 && get("Career Exposure") <= 2.5) {
    insights.push({
      icon: "compass",
      title: "Passionate Explorer",
      narrative:
        "You have strong motivation and clear passions, but haven't yet had broad exposure to different career paths. Informational interviews, job shadowing, and industry events could reveal career options that perfectly match your enthusiasm.",
    });
  }

  // Mastery + Abstract Reasoning → specialist potential
  if (get("SDT - Competence") >= 3.8 && get("Abstract Reasoning") >= 3.5) {
    insights.push({
      icon: "brain",
      title: "Deep Specialist Potential",
      narrative:
        "Your drive to master complex skills combined with strong abstract reasoning suggests you could become an expert in a demanding field. Whether it's AI, advanced engineering, or strategic consulting — you have the cognitive tools and motivation to go deep.",
    });
  }

  // Return top 6 at most
  return insights.slice(0, 6);
}
