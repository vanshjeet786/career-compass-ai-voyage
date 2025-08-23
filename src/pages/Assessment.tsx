import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, HelpCircle, Lightbulb, ArrowRight, ArrowLeft } from "lucide-react";
import {
  RESPONSE_SCALE,
  LAYER_1_QUESTIONS,
  LAYER_2_QUESTIONS,
  LAYER_3_QUESTIONS,
  LAYER_4_QUESTIONS,
  LAYER_5_QUESTIONS,
  LAYER_6_QUESTIONS,
} from "@/data/questions";

const likertOptions = Object.keys(RESPONSE_SCALE);

type LayerKey = 1 | 2 | 3 | 4 | 5 | 6;

const getLayerData = (layer: LayerKey): Record<string, string[]> => {
  switch (layer) {
    case 1: return LAYER_1_QUESTIONS;
    case 2: return LAYER_2_QUESTIONS;
    case 3: return LAYER_3_QUESTIONS;
    case 4: return LAYER_4_QUESTIONS;
    case 5: return LAYER_5_QUESTIONS;
    case 6: return LAYER_6_QUESTIONS as Record<string, string[]>;
  }
};

// Function to check if a question is open-ended (Layer 6)
const isOpenEndedQuestion = (layer: LayerKey, question: string) => {
  if (layer !== 6) return false;
  
  // For layer 6, check if the question is open-ended
  // Open-ended questions typically don't have predefined answer options
  // We can identify them by checking if they end with "(open-ended)" or similar patterns
  return question.includes("(open-ended)") || 
         question.includes("How would you") ||
         question.includes("What kind") ||
         question.includes("What are 3") ||
         question.includes("Who can help") ||
         question.includes("What specific skills") ||
         question.includes("What timeline") ||
         question.includes("What fears or doubts") ||
         question.includes("What kind of support");
};

type ResponseValue = { label: string; value: number } | { text: string };

const Assessment = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [layer, setLayer] = useState<LayerKey>(1);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});

  // SEO: title, description, canonical
  useEffect(() => {
    const title = `Career Compass Assessment - Layer ${layer}`;
    document.title = title;
    const metaDesc = `Complete layer ${layer} of the Career Compass assessment to discover strengths.`;
    let descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.name = 'description';
      document.head.appendChild(descTag);
    }
    descTag.content = metaDesc;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin + '/assessment';
  }, [layer]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("assessments")
        .select("id, current_layer")
        .eq("user_id", user.id)
        .eq("status", "in_progress")
        .limit(1);

      if (data && data.length) {
        setAssessmentId(data[0].id);
        setLayer((data[0].current_layer as number) as LayerKey);
      } else {
        const { data: created, error } = await supabase
          .from("assessments")
          .insert({ user_id: user.id })
          .select("id, current_layer")
          .single();
        if (error) {
          toast({ title: "Error", description: error.message, variant: "destructive" });
        } else {
          setAssessmentId(created!.id);
          setLayer((created!.current_layer as number) as LayerKey);
        }
      }
    })();
  }, [user, toast]);

  const layerData = useMemo(() => getLayerData(layer), [layer]);

  const saveResponse = async (questionId: string, value: ResponseValue) => {
    if (!assessmentId) return;
    setResponses((prev) => ({ ...prev, [questionId]: value }));
    await supabase.from("assessment_responses").insert({
      assessment_id: assessmentId,
      layer_number: layer,
      question_id: questionId,
      response_value: value,
    });
  };

  const callAI = async (
    mode: "explain" | "suggest",
    question: string,
  ) => {
    try {
      setAiLoading(question + mode);
      const { data, error } = await supabase.functions.invoke("gemini-assist", {
        body: { mode, question, context: { layer, responses } },
      });
      if (error) throw error;
      if (mode === "explain") setExplanations((p) => ({ ...p, [question]: data.text }));
      if (mode === "suggest") setSuggestions((p) => ({ ...p, [question]: data.text }));
    } catch (e: unknown) {
      let message = "An unknown error occurred.";
      if (e instanceof Error) {
        message = e.message;
      }

      // Check for the specific API key error from the edge function
      if (typeof message === 'string' && message.includes("Missing GEMINI_API_KEY")) {
        toast({
          title: "AI Feature Not Configured",
          description: "The AI features are not enabled. The GEMINI_API_KEY needs to be set by the site administrator in the Supabase project settings.",
          variant: "destructive",
          duration: 10000, // Show for longer
        });
      } else {
        toast({ title: "AI error", description: message, variant: "destructive" });
      }
    } finally {
      setAiLoading(null);
    }
  };

  const nextLayer = async () => {
    if (!assessmentId) return;
    const next = (layer + 1) as LayerKey;
    const done = next > 6;
    if (done) {
      await supabase.from("assessments").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", assessmentId);
      toast({ title: "Assessment completed", description: "View your results now." });
      window.location.href = "/results?assess=" + assessmentId;
      return;
    }
    setLayer(next);
    await supabase.from("assessments").update({ current_layer: next }).eq("id", assessmentId);
  };

  const prevLayer = async () => {
    const prev = (layer - 1) as LayerKey;
    if (prev < 1) return;
    setLayer(prev);
    if (assessmentId) await supabase.from("assessments").update({ current_layer: prev }).eq("id", assessmentId);
  };

  if (loading) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
      <div className="container py-10">
        <header className="mb-8 text-center animate-fade-in">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
            Layer {layer} of 6
          </div>
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent mb-4">
            Career Compass Assessment
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover your strengths and unlock your career potential through our comprehensive assessment
          </p>
          <div className="w-full bg-muted rounded-full h-2 mt-6">
            <div 
              className="bg-gradient-to-r from-primary to-accent h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(layer / 6) * 100}%` }}
            />
          </div>
        </header>

        <div className="space-y-8">
          {Object.entries(layerData).map(([category, questions], catIdx) => (
            <Card key={category} className="animate-fade-in hover-scale border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm" style={{ animationDelay: `${catIdx * 100}ms` }}>
              <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
                <CardTitle className="text-xl flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent" />
                  {category}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 p-6">
                {questions.map((q, idx) => (
                  <div key={q} className="group rounded-xl border border-border/50 p-6 hover:border-primary/20 hover:shadow-md transition-all duration-300 bg-background/50">
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <p className="font-medium flex-1 text-foreground group-hover:text-primary transition-colors">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold mr-3">
                          {idx + 1}
                        </span>
                        {q}
                      </p>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => callAI("explain", q)} 
                          disabled={aiLoading === q + "explain"}
                          className="hover:bg-primary/10 hover:border-primary/20 transition-all duration-200"
                        >
                          {aiLoading === q + "explain" ? (
                            <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                          ) : (
                            <HelpCircle className="h-4 w-4 mr-1" />
                          )}
                          Explain
                        </Button>
                        {/* Show Suggest button only for open-ended questions in Layer 6 */}
                        {isOpenEndedQuestion(layer, q) && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => callAI("suggest", q)} 
                            disabled={aiLoading === q + "suggest"}
                            className="hover:bg-accent/10 hover:border-accent/20 transition-all duration-200"
                          >
                            {aiLoading === q + "suggest" ? (
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                            ) : (
                              <Lightbulb className="h-4 w-4 mr-1" />
                            )}
                            Suggest
                          </Button>
                        )}
                      </div>
                    </div>

                    {layer <= 5 ? (
                      <div className="space-y-3">
                        <RadioGroup
                          value={responses[q]?.label || ""}
                          onValueChange={(val) => saveResponse(q, { label: val, value: RESPONSE_SCALE[val] })}
                          className="grid grid-cols-1 md:grid-cols-5 gap-3"
                        >
                          {likertOptions.map((opt) => (
                            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer" key={opt}>
                              <RadioGroupItem id={`${q}-${opt}`} value={opt} className="text-primary" />
                              <Label htmlFor={`${q}-${opt}`} className="flex-1 cursor-pointer font-medium">{opt}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <Textarea
                          placeholder="Share your thoughts, experiences, and insights..."
                          value={responses[q]?.text || ""}
                          onChange={(e) => saveResponse(q, { text: e.target.value })}
                          className="min-h-[120px] resize-none border-border/50 focus:border-primary/50 focus:ring-primary/20"
                        />
                      </div>
                    )}

                    {(explanations[q] || suggestions[q]) && (
                      <div className="mt-4 space-y-3 animate-fade-in">
                        {explanations[q] && (
                          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                            <p className="text-sm">
                              <span className="font-semibold text-primary flex items-center gap-2 mb-2">
                                <HelpCircle className="h-4 w-4" />
                                Why it matters:
                              </span>
                              <span className="text-muted-foreground">{explanations[q]}</span>
                            </p>
                          </div>
                        )}
                        {suggestions[q] && (
                          <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                            <div className="text-sm">
                              <span className="font-semibold text-accent flex items-center gap-2 mb-2">
                                <Lightbulb className="h-4 w-4" />
                                Suggestions:
                              </span>
                              <div className="whitespace-pre-wrap text-muted-foreground">{suggestions[q]}</div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
        </div>

        <footer className="mt-12 flex items-center justify-between p-6 bg-card/50 backdrop-blur-sm rounded-xl border shadow-lg">
          <Button 
            variant="outline" 
            onClick={prevLayer} 
            disabled={layer === 1}
            className="hover:bg-secondary/50 disabled:opacity-50 transition-all duration-200"
          >
            <ArrowLeft className="h-4 w-4 mr-2" /> Previous
          </Button>
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Step {layer} of 6</p>
            <div className="flex gap-1 mt-1">
              {Array.from({ length: 6 }, (_, i) => (
                <div 
                  key={i} 
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i + 1 <= layer ? 'bg-gradient-to-r from-primary to-accent' : 'bg-muted'
                  }`} 
                />
              ))}
            </div>
          </div>
          <Button 
            onClick={nextLayer}
            className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
          >
            {layer < 6 ? (
              <>
                Next <ArrowRight className="h-4 w-4 ml-2" />
              </>
            ) : (
              <>Finish Assessment</>
            )}
          </Button>
        </footer>
      </div>
    </main>
  );
};

export default Assessment;
