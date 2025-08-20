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

const Assessment = () => {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [layer, setLayer] = useState<LayerKey>(1);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, string>>({});
  const [suggestions, setSuggestions] = useState<Record<string, string>>({});
  const [responses, setResponses] = useState<Record<string, any>>({});

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
  }, [user]);

  const layerData = useMemo(() => getLayerData(layer), [layer]);

  const saveResponse = async (questionId: string, value: any) => {
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
      const { data, error } = await supabase.functions.invoke("hf-assist", {
        body: { mode, question, context: { layer, responses } },
      });
      if (error) throw error;
      if (mode === "explain") setExplanations((p) => ({ ...p, [question]: data.text }));
      if (mode === "suggest") setSuggestions((p) => ({ ...p, [question]: data.text }));
    } catch (e: any) {
      toast({ title: "AI error", description: e.message ?? String(e), variant: "destructive" });
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
    <main className="min-h-screen container py-10">
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Career Compass Assessment</h1>
        <p className="text-muted-foreground">Layer {layer} of 6</p>
      </header>

      <div className="space-y-6">
        {Object.entries(layerData).map(([category, questions]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {questions.map((q, idx) => (
                <div key={q} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-medium flex-1">{idx + 1}. {q}</p>
                    <div className="flex gap-2">
                      <Button variant="secondary" size="sm" onClick={() => callAI("explain", q)} disabled={aiLoading === q + "explain"}>
                        <HelpCircle className="h-4 w-4 mr-1" /> Explain
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => callAI("suggest", q)} disabled={aiLoading === q + "suggest"}>
                        <Lightbulb className="h-4 w-4 mr-1" /> Suggest
                      </Button>
                    </div>
                  </div>

                  {layer <= 5 ? (
                    <div className="mt-3">
                      <RadioGroup
                        value={responses[q]?.label || ""}
                        onValueChange={(val) => saveResponse(q, { label: val, value: RESPONSE_SCALE[val] })}
                        className="grid grid-cols-2 md:grid-cols-5 gap-2"
                      >
                        {likertOptions.map((opt) => (
                          <div className="flex items-center space-x-2" key={opt}>
                            <RadioGroupItem id={`${q}-${opt}`} value={opt} />
                            <Label htmlFor={`${q}-${opt}`}>{opt}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ) : (
                    <div className="mt-3">
                      <Textarea
                        placeholder="Type your answer..."
                        value={responses[q]?.text || ""}
                        onChange={(e) => saveResponse(q, { text: e.target.value })}
                      />
                    </div>
                  )}

                  {(explanations[q] || suggestions[q]) && (
                    <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {explanations[q] && <p><span className="font-semibold">Why it matters:</span> {explanations[q]}</p>}
                      {suggestions[q] && <div>
                        <span className="font-semibold">Suggestions:</span>
                        <div className="whitespace-pre-wrap mt-1">{suggestions[q]}</div>
                      </div>}
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>

      <footer className="mt-8 flex items-center justify-between">
        <Button variant="secondary" onClick={prevLayer} disabled={layer === 1}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Previous
        </Button>
        <Button onClick={nextLayer}>
          {layer < 6 ? (
            <>
              Next <ArrowRight className="h-4 w-4 ml-2" />
            </>
          ) : (
            <>Finish</>
          )}
        </Button>
      </footer>
    </main>
  );
};

export default Assessment;
