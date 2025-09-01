export interface CareerRecommendation {
  title: string;
  compatibility: number;
  onetLink: string;
  salaryRange: string;
  explanation: string;
  keySkills: string[];
  growthOutlook: string;
  matchingFactors: string[];
}

export const ONET_BASE_URL = "https://www.onetonline.org/link/summary/";

export function generateCareerRecommendations(
  userResponses: any[],
  categoryAverages: { name: string; score: number }[]
): CareerRecommendation[] {
  // Get top strengths (categories with highest scores)
  const topStrengths = categoryAverages
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(cat => cat.name);

  // Career database with O*NET codes and detailed information
  const careerDatabase: Record<string, {
    onetCode: string;
    salaryRange: string;
    keySkills: string[];
    growthOutlook: string;
    matchingCategories: string[];
    description: string;
  }> = {
    "Data Scientist": {
      onetCode: "15-2051.00",
      salaryRange: "$70,000 - $150,000",
      keySkills: ["Python", "Statistics", "Machine Learning", "SQL"],
      growthOutlook: "Much faster than average (22%)",
      matchingCategories: ["Logical-Mathematical Intelligence", "Abstract Reasoning", "Technical Skills"],
      description: "Analyze complex data to help organizations make informed decisions"
    },
    "Software Engineer": {
      onetCode: "15-1252.00",
      salaryRange: "$60,000 - $140,000",
      keySkills: ["Programming", "Problem Solving", "System Design", "Testing"],
      growthOutlook: "Much faster than average (25%)",
      matchingCategories: ["Logical-Mathematical Intelligence", "Technical Skills", "Abstract Reasoning"],
      description: "Design and develop software applications and systems"
    },
    "UX Designer": {
      onetCode: "27-1021.00",
      salaryRange: "$50,000 - $120,000",
      keySkills: ["Design Thinking", "User Research", "Prototyping", "Visual Design"],
      growthOutlook: "Faster than average (13%)",
      matchingCategories: ["Visual-Spatial Intelligence", "Creative/Design Skills", "Interpersonal Intelligence"],
      description: "Create user-centered digital experiences and interfaces"
    },
    "Marketing Manager": {
      onetCode: "11-2021.00",
      salaryRange: "$55,000 - $130,000",
      keySkills: ["Strategy", "Communication", "Analytics", "Brand Management"],
      growthOutlook: "Faster than average (10%)",
      matchingCategories: ["Interpersonal Intelligence", "Communication Skills", "Creative/Design Skills"],
      description: "Develop and execute marketing strategies to promote products or services"
    },
    "Clinical Psychologist": {
      onetCode: "19-3031.02",
      salaryRange: "$60,000 - $120,000",
      keySkills: ["Counseling", "Assessment", "Research", "Empathy"],
      growthOutlook: "Faster than average (8%)",
      matchingCategories: ["Interpersonal Intelligence", "Intrapersonal Intelligence", "Communication Skills"],
      description: "Diagnose and treat mental, emotional, and behavioral disorders"
    },
    "Environmental Engineer": {
      onetCode: "17-2081.00",
      salaryRange: "$65,000 - $125,000",
      keySkills: ["Environmental Science", "Engineering", "Problem Solving", "Sustainability"],
      growthOutlook: "Faster than average (8%)",
      matchingCategories: ["Naturalistic Intelligence", "Logical-Mathematical Intelligence", "Technical Skills"],
      description: "Develop solutions to environmental problems using engineering principles"
    },
    "Content Writer": {
      onetCode: "27-3043.00",
      salaryRange: "$35,000 - $75,000",
      keySkills: ["Writing", "Research", "SEO", "Content Strategy"],
      growthOutlook: "Faster than average (9%)",
      matchingCategories: ["Linguistic", "Creative/Design Skills", "Communication Skills"],
      description: "Create engaging written content for various platforms and audiences"
    },
    "Physical Therapist": {
      onetCode: "29-1123.00",
      salaryRange: "$70,000 - $100,000",
      keySkills: ["Anatomy", "Patient Care", "Exercise Prescription", "Communication"],
      growthOutlook: "Much faster than average (18%)",
      matchingCategories: ["Bodily-Kinesthetic Intelligence", "Interpersonal Intelligence", "Naturalistic Intelligence"],
      description: "Help patients recover from injuries and improve physical function"
    },
    "Financial Analyst": {
      onetCode: "13-2051.00",
      salaryRange: "$55,000 - $110,000",
      keySkills: ["Financial Modeling", "Data Analysis", "Excel", "Risk Assessment"],
      growthOutlook: "Faster than average (6%)",
      matchingCategories: ["Logical-Mathematical Intelligence", "Numerical Aptitude", "Abstract Reasoning"],
      description: "Evaluate investment opportunities and financial performance for organizations"
    },
    "Graphic Designer": {
      onetCode: "27-1024.00",
      salaryRange: "$35,000 - $80,000",
      keySkills: ["Visual Design", "Typography", "Branding", "Software Proficiency"],
      growthOutlook: "Decline (-4%)",
      matchingCategories: ["Visual-Spatial Intelligence", "Creative/Design Skills", "Artistic Intelligence"],
      description: "Create visual concepts to communicate ideas and inspire audiences"
    },
    "Teacher": {
      onetCode: "25-2031.00",
      salaryRange: "$40,000 - $70,000",
      keySkills: ["Curriculum Development", "Classroom Management", "Communication", "Patience"],
      growthOutlook: "Faster than average (8%)",
      matchingCategories: ["Interpersonal Intelligence", "Communication Skills", "Linguistic"],
      description: "Educate students and help them develop academic and social skills"
    },
    "Research Scientist": {
      onetCode: "19-1042.00",
      salaryRange: "$60,000 - $130,000",
      keySkills: ["Research Methods", "Data Analysis", "Scientific Writing", "Critical Thinking"],
      growthOutlook: "Faster than average (8%)",
      matchingCategories: ["Logical-Mathematical Intelligence", "Abstract Reasoning", "Intrapersonal Intelligence"],
      description: "Conduct research to advance knowledge in various scientific fields"
    }
  };

  // Calculate compatibility scores for each career
  const careerScores: { career: string; score: number; matchCount: number }[] = [];

  Object.entries(careerDatabase).forEach(([careerName, careerInfo]) => {
    let score = 0;
    let matchCount = 0;

    // Check how many of user's top strengths match career requirements
    careerInfo.matchingCategories.forEach(category => {
      if (topStrengths.includes(category)) {
        const categoryScore = categoryAverages.find(cat => cat.name === category)?.score || 0;
        score += categoryScore;
        matchCount++;
      }
    });

    // Calculate average compatibility
    const compatibility = matchCount > 0 ? (score / matchCount) * 20 : 0; // Scale to 0-100

    careerScores.push({
      career: careerName,
      score: compatibility,
      matchCount
    });
  });

  // Sort by compatibility and take top 5
  const topCareers = careerScores
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return topCareers.map((item, index) => {
    const careerInfo = careerDatabase[item.career];
    const matchingStrengths = careerInfo.matchingCategories.filter(cat => 
      topStrengths.includes(cat)
    );

    return {
      title: item.career,
      compatibility: Math.round(item.score),
      onetLink: `${ONET_BASE_URL}${careerInfo.onetCode}`,
      salaryRange: careerInfo.salaryRange,
      explanation: `This career aligns well with your strengths in ${matchingStrengths.join(', ')}. ${careerInfo.description}`,
      keySkills: careerInfo.keySkills,
      growthOutlook: careerInfo.growthOutlook,
      matchingFactors: matchingStrengths
    };
  });
}