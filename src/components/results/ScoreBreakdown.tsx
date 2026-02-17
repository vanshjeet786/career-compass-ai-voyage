import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";

interface SubScore {
  name: string;
  score: number;
}

interface LayerBreakdown {
  layerName: string;
  layerNumber: number;
  description: string;
  subScores: SubScore[];
  explanations: Record<string, { high: string; low: string }>;
}

interface ScoreBreakdownProps {
  layers: LayerBreakdown[];
}

const LAYER_EXPLANATIONS: Record<string, Record<string, { high: string; low: string }>> = {
  "Layer 1: Intelligence Types": {
    Linguistic: {
      high: "Strong verbal and written communication skills. You excel at expressing ideas clearly and persuasively. Careers in writing, law, teaching, and public relations would leverage this strength.",
      low: "You may prefer non-verbal communication or visual/hands-on approaches. Consider roles that emphasize technical skills, design, or quantitative analysis over extensive writing.",
    },
    "Logical-Mathematical Intelligence": {
      high: "Excellent analytical and problem-solving abilities. You thrive with data, patterns, and systematic thinking. Ideal for STEM careers, finance, and research.",
      low: "You may prefer creative or interpersonal work over heavy analytical tasks. Look for roles that balance structure with creativity.",
    },
    "Interpersonal Intelligence": {
      high: "Strong ability to understand and work with others. You're a natural collaborator and leader. Great for management, counseling, sales, and team-based roles.",
      low: "You may prefer independent work. Consider roles in research, programming, writing, or technical fields where solo contributions are valued.",
    },
    "Intrapersonal Intelligence": {
      high: "Strong self-awareness and emotional regulation. You understand your motivations and can set meaningful goals. Great foundation for leadership and entrepreneurship.",
      low: "Consider developing reflection practices. Mentorship and career coaching can help clarify your direction.",
    },
    "Naturalistic Intelligence": {
      high: "You notice environmental patterns and connect with the natural world. Consider environmental science, agriculture, conservation, or outdoor education.",
      low: "You may prefer urban or indoor work environments. Focus on your other intelligence strengths for career direction.",
    },
    "Bodily-Kinesthetic Intelligence": {
      high: "Excellent physical coordination and hands-on learning. Consider trades, sports, performing arts, surgery, or physical therapy.",
      low: "You may prefer desk-based or cognitive work. Focus on roles emphasizing thinking and communication over physical activity.",
    },
    "Musical Intelligence": {
      high: "Strong sense of rhythm, pitch, and musical patterns. Consider music production, sound engineering, performing arts, or music therapy.",
      low: "Music may not be a primary career driver, but it can be a fulfilling hobby alongside your professional path.",
    },
    "Visual-Spatial Intelligence": {
      high: "Excellent ability to visualize and think in 3D. Ideal for architecture, design, engineering, art, or navigation-related fields.",
      low: "You may prefer verbal or logical approaches. Consider roles that don't heavily rely on spatial reasoning.",
    },
    "Cognitive Styles": {
      high: "You have strong awareness of how you learn best. This meta-cognitive skill helps you adapt and succeed across different work environments.",
      low: "Experimenting with different learning approaches could help you discover more effective study and work strategies.",
    },
  },
  "Layer 2: Personality Traits": {
    MBTI: {
      high: "You show clear personality preferences, suggesting strong self-awareness. Use this clarity to find work environments that match your natural style.",
      low: "Balanced personality preferences give you flexibility to adapt to various work environments and team dynamics.",
    },
    "Big Five - Openness": {
      high: "Highly curious and creative. You thrive in roles requiring innovation, artistic expression, and intellectual exploration.",
      low: "You prefer stability and proven methods. Consider structured roles in operations, administration, or established industries.",
    },
    "Big Five - Conscientiousness": {
      high: "Very organized and reliable. You excel in project management, finance, healthcare, and any role requiring attention to detail.",
      low: "You may work best in flexible, creative environments. Consider roles in startups, creative agencies, or freelance work.",
    },
    "Big Five - Extraversion": {
      high: "Energized by social interaction. Sales, marketing, teaching, and leadership roles would suit your outgoing nature.",
      low: "You recharge through solitude. Research, writing, programming, and analytical roles may suit you better.",
    },
    "Big Five - Agreeableness": {
      high: "Highly empathetic and cooperative. Excellent for counseling, healthcare, education, and team-oriented roles.",
      low: "You're direct and independent in your thinking. Consider competitive fields, law, negotiation, or strategic roles.",
    },
    "Big Five - Neuroticism": {
      high: "You're sensitive and may experience stress more intensely. Consider structured environments with good support systems, or roles in empathetic fields.",
      low: "Emotionally stable and calm under pressure. Great for high-stakes roles in emergency services, leadership, or crisis management.",
    },
    "SDT - Autonomy": {
      high: "You strongly value independence in your work. Entrepreneurship, consulting, freelancing, and remote roles would satisfy this need.",
      low: "You work well with guidance and structure. Consider established organizations with clear career paths and mentorship.",
    },
    "SDT - Competence": {
      high: "You have a strong drive to master skills. Careers with clear progression, certifications, and skill development opportunities will motivate you.",
      low: "Focus on finding roles where you feel capable and can build confidence through gradual skill development.",
    },
    "SDT - Relatedness": {
      high: "You value deep connections at work. Seek team-oriented cultures, collaborative projects, and community-focused organizations.",
      low: "You may prefer professional boundaries. Consider roles where performance is measured individually.",
    },
  },
  "Layer 3: Aptitudes & Skills": {
    "Numerical Aptitude": {
      high: "Strong with numbers and quantitative analysis. Excellent for finance, data science, engineering, and accounting.",
      low: "Focus on careers where verbal, creative, or interpersonal skills are more central than numerical analysis.",
    },
    "Verbal Aptitude": {
      high: "Excellent language and communication skills. Great for law, journalism, teaching, marketing, and public relations.",
      low: "Consider roles where visual, technical, or quantitative skills matter more than extensive verbal communication.",
    },
    "Abstract Reasoning": {
      high: "Strong logical thinking and pattern recognition. Ideal for programming, research, strategic planning, and consulting.",
      low: "You may prefer concrete, practical tasks. Consider hands-on or people-oriented careers over highly theoretical ones.",
    },
    "Technical Skills": {
      high: "Strong technical aptitude. You learn tools and systems quickly. Excellent for IT, engineering, and technical specialist roles.",
      low: "You may prefer people-focused or creative work over heavy technical tasks. Consider business, education, or arts roles.",
    },
    "Creative/Design Skills": {
      high: "Strong creative abilities. Consider graphic design, UX/UI, advertising, architecture, or art direction.",
      low: "You may prefer analytical or structured work. Consider pairing creativity with other strengths in hybrid roles.",
    },
    "Communication Skills": {
      high: "Excellent communicator. You can persuade, present, and connect with audiences. Great for leadership, sales, and media.",
      low: "Consider developing communication skills through practice, or focus on roles where technical output matters more.",
    },
  },
  "Layer 4: Background & Context": {
    "Educational Background": {
      high: "Strong educational foundation. You have access to resources that can accelerate your career development.",
      low: "Limited educational resources may require creative alternatives like online courses, bootcamps, or apprenticeships.",
    },
    "Socioeconomic Factors": {
      high: "Good financial and resource support for career development. You can invest in education and skill-building.",
      low: "Financial constraints may shape your career choices. Look for scholarships, free training programs, and paid apprenticeships.",
    },
    "Career Exposure": {
      high: "Wide exposure to different careers gives you informed decision-making ability. Use this breadth to make confident choices.",
      low: "Limited career exposure suggests seeking informational interviews, job shadowing, and career exploration programs.",
    },
  },
  "Layer 5: Interests & Values": {
    "Interests and Passions": {
      high: "Clear, strong interests guide your career direction. Pursue roles that align with these passions for long-term fulfillment.",
      low: "You may be exploring or haven't identified strong interests yet. Try diverse experiences to discover what energizes you.",
    },
    "Career Trends Awareness": {
      high: "Good awareness of market trends. You can make strategic career decisions aligned with growing industries.",
      low: "Spend time researching emerging fields and industry trends to make more informed career choices.",
    },
    "Personal Goals and Values": {
      high: "Clear personal values drive your career choices. This alignment leads to greater job satisfaction and purpose.",
      low: "Clarifying your values through reflection exercises and career counseling can help focus your career search.",
    },
  },
};

const getBarColor = (score: number) => {
  if (score >= 4) return "hsl(142, 71%, 45%)";
  if (score >= 3) return "hsl(48, 96%, 53%)";
  return "hsl(0, 84%, 60%)";
};

const ScoreBreakdown = ({ layers }: ScoreBreakdownProps) => {
  return (
    <div className="space-y-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold">Layer-by-Layer Score Breakdown</h2>
        <p className="text-sm text-muted-foreground mt-1">
          See how you scored in each assessment layer and what it means for your career direction.
        </p>
      </div>

      <Accordion type="multiple" defaultValue={["layer-1"]} className="space-y-3">
        {layers.map((layer) => {
          const avgScore =
            layer.subScores.length > 0
              ? layer.subScores.reduce((s, i) => s + i.score, 0) / layer.subScores.length
              : 0;

          const explanations =
            LAYER_EXPLANATIONS[layer.layerName] || {};

          return (
            <AccordionItem
              key={layer.layerNumber}
              value={`layer-${layer.layerNumber}`}
              className="border rounded-lg px-4"
            >
              <AccordionTrigger className="hover:no-underline">
                <div className="flex items-center gap-3 text-left">
                  <Badge variant="outline" className="text-xs shrink-0">
                    L{layer.layerNumber}
                  </Badge>
                  <div>
                    <span className="font-semibold">{layer.layerName}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      Avg: {avgScore.toFixed(1)}/5
                    </span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <p className="text-sm text-muted-foreground mb-4">{layer.description}</p>

                {layer.subScores.length > 0 && (
                  <div className="h-[250px] mb-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={layer.subScores}
                        layout="vertical"
                        margin={{ left: 10, right: 20, top: 5, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis type="number" domain={[0, 5]} tick={{ fontSize: 11 }} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={160}
                          tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px",
                          }}
                          formatter={(value: number) => [`${value.toFixed(2)}/5`, "Score"]}
                        />
                        <Bar dataKey="score" radius={[0, 6, 6, 0]}>
                          {layer.subScores.map((entry, index) => (
                            <Cell key={index} fill={getBarColor(entry.score)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Sub-layer explanations */}
                <div className="space-y-3">
                  {layer.subScores.map((sub) => {
                    const exp = explanations[sub.name];
                    const explanation =
                      exp
                        ? sub.score >= 3.5
                          ? exp.high
                          : exp.low
                        : null;

                    return (
                      <div
                        key={sub.name}
                        className="p-3 rounded-lg bg-muted/50 border border-border/50"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{sub.name}</span>
                          <Badge
                            variant={sub.score >= 4 ? "default" : sub.score >= 3 ? "secondary" : "destructive"}
                            className="text-xs"
                          >
                            {sub.score.toFixed(1)}/5
                          </Badge>
                        </div>
                        {explanation && (
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {explanation}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </div>
  );
};

export default ScoreBreakdown;
