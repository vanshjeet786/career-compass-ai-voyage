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
import { Loader2, HelpCircle, Lightbulb, ArrowRight, ArrowLeft, Plus } from "lucide-react";
import { useSmartExplanations } from "@/hooks/useSmartExplanations";
import { useSmartSuggestions } from "@/hooks/useSmartSuggestions";
import {
  RESPONSE_SCALE,
  LAYER_1_QUESTIONS,
  LAYER_2_QUESTIONS,
  LAYER_3_QUESTIONS,
  LAYER_4_QUESTIONS,
  LAYER_5_QUESTIONS,
  LAYER_6_QUESTIONS,
} from "@/data/questions";
import { PREDETERMINED_SUGGESTIONS } from "@/data/suggestions";

const likertOptions = Object.keys(RESPONSE_SCALE);

type LayerKey = 1 | 2 | 3 | 4 | 5 | 6;

const getLayerData = (layer: LayerKey) => {
  switch (layer) {
    case 1: return LAYER_1_QUESTIONS;
    case 2: return LAYER_2_QUESTIONS;
    case 3: return LAYER_3_QUESTIONS;
    case 4: return LAYER_4_QUESTIONS;
    case 5: return LAYER_5_QUESTIONS;
    case 6: return LAYER_6_QUESTIONS;
  }
};

// Function to check if a question is open-ended (Layer 6)
const isOpenEndedQuestion = (layer: LayerKey, question: string) => {
  if (layer !== 6) return false;
  
  // Improved: Use a regex pattern for more flexible matching of open-ended questions
  const openEndedPatterns = [
    /\(open-ended\)$/i,
    /^How would you/i,
    /^What kind/i,
    /^What are \d+/i,
    /^Who can help/i,
    /^What specific skills/i,
    /^What timeline/i,
    /^What fears or doubts/i,
    /^What kind of support/i,
  ];
  return openEndedPatterns.some(pattern => pattern.test(question));
};

// Function to check if career interests have been provided
const hasCareerInterests = (responses: Record<string, ResponseValue>) => {
  const careerQuestion = "My top 3 career interest areas are:";
  const careerResponse = responses[careerQuestion] as { career1?: string; career2?: string; career3?: string } | undefined;
  return careerResponse && (careerResponse.career1 || careerResponse.career2 || careerResponse.career3);
};

type ResponseValue = 
  | { label: string; value: number }
  | { text: string }
  | { label: string; value: number; customText: string }
  | { career1?: string; career2?: string; career3?: string };

const Assessment = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [layer, setLayer] = useState<LayerKey>(1);
  const [responses, setResponses] = useState<Record<string, ResponseValue>>({});
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});
  const [showAISuggestions, setShowAISuggestions] = useState<Record<string, boolean>>({});
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<Record<string, string[]>>({});
  
  const explanationLoading = aiLoading?.includes('explain') || false;
  const suggestionLoading = aiLoading?.includes('suggest') || false;

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

  // Load or create assessment
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
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
          if (error) throw error;
          setAssessmentId(created!.id);
          setLayer((created!.current_layer as number) as LayerKey);
        }
      } catch (error: any) {
        toast({ title: "Error loading assessment", description: error.message, variant: "destructive" });
      }
    })();
  }, [user, toast]);

  const layerData = useMemo(() => getLayerData(layer), [layer]);

  const saveResponse = async (questionId: string, value: ResponseValue) => {
    if (!assessmentId) return;
    setResponses((prev) => ({ ...prev, [questionId]: value }));
    try {
      await supabase.from("assessment_responses").insert({
        assessment_id: assessmentId,
        layer_number: layer,
        question_id: questionId,
        response_value: value,
      });
    } catch (error: any) {
      toast({ title: "Error saving response", description: error.message, variant: "destructive" });
    }
  };

  const handleExplanation = async (question: string) => {
    if (explanations[question]) return;
    setAiLoading(question + 'explain');
    try {
      const { data, error } = await supabase.functions.invoke("gemini-assist", {
        body: { mode: 'explain', question, context: { layer, responses } },
      });
      if (error) throw error;
      setExplanations(prev => ({ ...prev, [question]: data.text }));
    } catch (error: any) {
      toast({ title: "AI error", description: error.message, variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  const handleExpandedExplanation = async (question: string) => {
    setExpandedExplanations(prev => ({ ...prev, [question]: true }));
    setAiLoading(question + 'explain');
    try {
      const { data, error } = await supabase.functions.invoke("gemini-assist", {
        body: { mode: 'explain', question, context: { layer, responses } },
      });
      if (error) throw error;
      setExplanations(prev => ({ ...prev, [question + '_expanded']: data.text }));
    } catch (error: any) {
      toast({ title: "AI error", description: error.message, variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  const handleSuggestions = async (question: string) => {
    if (suggestions[question]) return;
    setAiLoading(question + 'suggest');
    
    // For Layer 6, call AI first, fallback to predetermined
    if (layer === 6) {
      try {
        const enhancedContext = {
          layer,
          userResponses: responses,
          instruction: "Based on the user's responses from layers 1-5, provide 2-3 specific, actionable suggestions for this question."
        };
        
        const { data, error } = await supabase.functions.invoke("gemini-assist", {
          body: { mode: 'suggest', question, context: enhancedContext },
        });
        
        if (error) throw error;
        
        // Split AI response into multiple suggestions
        const aiSuggestions = data.text.split('\n').filter(s => s.trim()).slice(0, 3);
        setSuggestions(prev => ({ ...prev, [question]: aiSuggestions }));
      } catch (error: any) {
        // Fallback to predetermined suggestions
        const predetermined = PREDETERMINED_SUGGESTIONS[question];
        if (predetermined) {
          setSuggestions(prev => ({ ...prev, [question]: predetermined }));
        } else {
          toast({ title: "AI error", description: error.message, variant: "destructive" });
        }
      }
    } else {
      // For layers 1-5, use predetermined suggestions only
      const predetermined = PREDETERMINED_SUGGESTIONS[question];
      if (predetermined) {
        setSuggestions(prev => ({ ...prev, [question]: predetermined }));
      }
    }
    
    setAiLoading(null);
  };

  const handleAISuggestions = async (question: string) => {
    setShowAISuggestions(prev => ({ ...prev, [question]: true }));
    setAiLoading(question + 'ai_suggest');
    try {
      const { data, error } = await supabase.functions.invoke("gemini-assist", {
        body: { mode: 'suggest', question, context: { layer, responses } },
      });
      if (error) throw error;
      const aiSuggestions = data.text.split('\n').filter(s => s.trim()).slice(0, 3);
      setSuggestions(prev => ({ 
        ...prev, 
        [question]: [...(prev[question] || []), ...aiSuggestions] 
      }));
    } catch (error: any) {
      toast({ title: "AI error", description: error.message, variant: "destructive" });
    } finally {
      setAiLoading(null);
    }
  };

  const nextLayer = async () => {
    if (!assessmentId) return;
    const next = (layer + 1) as LayerKey;
    const done = next > 6;
    try {
      if (done) {
        await supabase.from("assessments").update({ status: "completed", completed_at: new Date().toISOString() }).eq("id", assessmentId);
        toast({ title: "Assessment completed", description: "View your results now." });
        window.location.href = "/results?assess=" + assessmentId;
      } else {
        setLayer(next);
        await supabase.from("assessments").update({ current_layer: next }).eq("id", assessmentId);
      }
    } catch (error: any) {
      toast({ title: "Error advancing layer", description: error.message, variant: "destructive" });
    }
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
          {Object.entries(layerData).map(([category, questions], catIdx) => {
            const isCareerClustering = category === "Career_Clustering" && typeof questions === 'object' && !Array.isArray(questions) && 'instructions' in questions;
            const isPassionPracticality = category === "Passion_Practicality" && typeof questions === 'object' && !Array.isArray(questions) && 'instructions' in questions;
            const actualQuestions = (isCareerClustering || isPassionPracticality) ? (questions as any).questions : questions as string[];

            // Skip Passion_Practicality section if no career interests were provided
            if (isPassionPracticality && !hasCareerInterests(responses)) {
              return null;
            }

            return (
              <Card key={category} className="animate-fade-in hover-scale border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm" style={{ animationDelay: `${catIdx * 100}ms` }}>
                <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent" />
                    {category.replace(/_/g, ' ')}
                  </CardTitle>
                 {(isCareerClustering || isPassionPracticality) && (
                    <div className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      <p className="mb-2">
                        <strong>Instructions:</strong> {(questions as any).instructions}
                      </p>
                      {isPassionPracticality && (
                        <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 mt-3">
                          <p className="text-xs font-medium text-primary mb-2">Your Career Interests:</p>
                          {(() => {
                            const careerResponse = responses["My top 3 career interest areas are:"] as { career1?: string; career2?: string; career3?: string } | undefined;
                            return (
                              <div className="text-xs space-y-1">
                                <div>Career 1: <span className="font-medium">{careerResponse?.career1 || "Not specified"}</span></div>
                                <div>Career 2: <span className="font-medium">{careerResponse?.career2 || "Not specified"}</span></div>
                                <div>Career 3: <span className="font-medium">{careerResponse?.career3 || "Not specified"}</span></div>
                              </div>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {actualQuestions.map((q, idx) => {
                    const isOtherOption = q.startsWith("Other (");
                    const showSuggestButton = isOpenEndedQuestion(layer, q) || isCareerClustering;
                    const isMultiCareerInput = q.includes("My top 3 career interest areas are");

                    return (
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
                              onClick={() => handleExplanation(q)} 
                              className="px-4 py-2 rounded-full hover:bg-transparent hover:text-primary hover:border-primary/50 transition-all duration-200"
                            >
                              <HelpCircle className="h-4 w-4 mr-2" />
                              Explain
                            </Button>
                            {showSuggestButton && (
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleSuggestions(q)} 
                              disabled={aiLoading === q + 'suggest'}
                              className="px-4 py-2 rounded-full hover:bg-transparent hover:text-accent hover:border-accent/50 transition-all duration-200"
                            >
                              {aiLoading === q + 'suggest' ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              ) : (
                                <Lightbulb className="h-4 w-4 mr-2" />
                              )}
                              Suggest
                            </Button>
                            )}
                          </div>
                        </div>

                        {layer <= 5 || !isCareerClustering ? (
                          layer <= 5 ? (
                            <div className="space-y-3">
                              <RadioGroup
                                value={responses[q] && 'label' in responses[q] ? (responses[q] as { label: string }).label : ""}
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
                          ) : isMultiCareerInput ? (
                            <div className="space-y-4">
                              <div className="grid gap-4">
                                {['career1', 'career2', 'career3'].map((field, idx) => (
                                  <div className="space-y-2" key={field}>
                                    <Label htmlFor={`${q}-${field}`} className="text-sm font-medium">Career Interest {idx + 1}</Label>
                                    <input
                                      id={`${q}-${field}`}
                                      type="text"
                                      placeholder={`Enter career interest ${idx + 1}...`}
                                      value={(responses[q] as any)?.[field] || ""}
                                      onChange={(e) => {
                                        const current = responses[q] as { career1?: string; career2?: string; career3?: string } || {};
                                        saveResponse(q, { ...current, [field]: e.target.value });
                                      }}
                                      className="w-full px-3 py-2 border border-border/50 rounded-lg focus:border-primary/50 focus:ring-2 focus:ring-primary/20 transition-all duration-200"
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              <Textarea
                                placeholder="Share your thoughts, experiences, and insights..."
                                value={responses[q] && 'text' in responses[q] ? (responses[q] as { text: string }).text : ""}
                                onChange={(e) => saveResponse(q, { text: e.target.value })}
                                className="min-h-[120px] resize-none border-border/50 focus:border-primary/50 focus:ring-primary/20"
                              />
                            </div>
                          )
                        ) : (isPassionPracticality) ? (
                          <div className="space-y-3">
                            <RadioGroup
                              value={responses[q] && 'label' in responses[q] ? (responses[q] as { label: string }).label : ""}
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
                          <div className="space-y-4">
                            <RadioGroup
                              value={responses[q] && 'label' in responses[q] ? (responses[q] as { label: string }).label : ""}
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
                            {isOtherOption && (
                              <Textarea
                                placeholder="Please specify your own career cluster..."
                                value={responses[q] && 'customText' in responses[q] ? (responses[q] as { customText: string }).customText : ""}
                                onChange={(e) => saveResponse(q, { ...responses[q], customText: e.target.value })}
                                className="min-h-[80px] resize-none border-border/50 focus:border-primary/50 focus:ring-primary/20"
                              />
                            )}
                          </div>
                        )}

                        {(explanations[q] || suggestions[q]) && (
                          <div className="mt-4 space-y-3 animate-fade-in">
                            {explanations[q] && (
                              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 hover:shadow-md transition-all duration-300">
                                <div className="text-sm">
                                  <span className="font-semibold text-primary flex items-center gap-2 mb-2">
                                    <HelpCircle className="h-4 w-4" />
                                    Why it matters:
                                  </span>
                                  <span className="text-muted-foreground mb-3 block">{explanations[q]}</span>
                                   {!expandedExplanations[q] && layer <= 5 && (
                                     <Button 
                                       variant="ghost" 
                                       size="sm"
                                       onClick={() => handleExpandedExplanation(q)}
                                       disabled={aiLoading === q + 'explain'}
                                       className="px-4 py-2 rounded-full hover:bg-transparent hover:text-primary hover:border-primary/30 transition-all duration-200 border border-transparent"
                                     >
                                       {aiLoading === q + 'explain' ? (
                                         <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Loading...</>
                                       ) : (
                                         <><Plus className="h-3 w-3 mr-2" /> Explain More</>
                                       )}
                                     </Button>
                                   )}
                                   {explanations[q + '_expanded'] && (
                                     <div className="mt-3 p-3 rounded-lg bg-primary/3 border border-primary/10">
                                       <span className="font-semibold text-primary text-xs block mb-2">Detailed Explanation:</span>
                                       <span className="text-muted-foreground text-sm">{explanations[q + '_expanded']}</span>
                                     </div>
                                   )}
                                </div>
                              </div>
                            )}
                            {suggestions[q] && Array.isArray(suggestions[q]) && (
                              <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 hover:shadow-md transition-all duration-300">
                                <div className="text-sm">
                                  <span className="font-semibold text-accent flex items-center gap-2 mb-3">
                                    <Lightbulb className="h-4 w-4" />
                                    Smart Suggestions:
                                  </span>
                                  <div className="space-y-2">
                                    {suggestions[q].map((suggestion: string, idx: number) => (
                                      <div key={idx} className="flex items-start gap-2 p-2 rounded border border-accent/10 bg-background/50">
                                        <div className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold flex-shrink-0 mt-0.5">
                                          {idx + 1}
                                        </div>
                                        <span className="text-muted-foreground text-sm">{suggestion}</span>
                                      </div>
                                    ))}
                                  </div>
                                   {!showAISuggestions[q] && layer === 6 && (
                                     <Button 
                                       variant="ghost" 
                                       size="sm"
                                       onClick={() => handleAISuggestions(q)}
                                       disabled={aiLoading === q + 'ai_suggest'}
                                       className="px-4 py-2 rounded-full hover:bg-transparent hover:text-accent hover:border-accent/30 transition-all duration-200 border border-transparent mt-3"
                                     >
                                       {aiLoading === q + 'ai_suggest' ? (
                                         <><Loader2 className="h-3 w-3 mr-2 animate-spin" /> Getting AI suggestions...</>
                                       ) : (
                                         <><Plus className="h-3 w-3 mr-2" /> Get AI Suggestions</>
                                       )}
                                     </Button>
                                   )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
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