import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, ArrowRight, ArrowLeft } from "lucide-react";
import { QuestionCard } from "../components/Assessment/QuestionCard";
import {
  LAYER_1_QUESTIONS,
  LAYER_2_QUESTIONS,
  LAYER_3_QUESTIONS,
  LAYER_4_QUESTIONS,
  LAYER_5_QUESTIONS,
  LAYER_6_QUESTIONS,
} from "@/data/questions";

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

  useEffect(() => {
    document.title = `Career Compass Assessment - Layer ${layer}`;
  }, [layer]);

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
          
          const { data: responseData } = await supabase
            .from("assessment_responses")
            .select("question_id, response_value")
            .eq("assessment_id", data[0].id);

          if (responseData) {
            const initialResponses = responseData.reduce((acc, res) => {
              acc[res.question_id] = res.response_value as ResponseValue;
              return acc;
            }, {} as Record<string, ResponseValue>);
            setResponses(initialResponses);
          }

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
      await supabase.from("assessment_responses").upsert({
        assessment_id: assessmentId,
        layer_number: layer,
        question_id: questionId,
        response_value: value,
      }, { onConflict: 'assessment_id, question_id' });
    } catch (error: any) {
      toast({ title: "Error saving response", description: error.message, variant: "destructive" });
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

  if (loading || !assessmentId) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin" /></div>;
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
             const isSpecialLayer = typeof questions === 'object' && !Array.isArray(questions) && 'instructions' in questions;
             const actualQuestions = isSpecialLayer ? (questions as any).questions : questions as string[];

            return (
              <Card key={category} className="animate-fade-in hover-scale border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-card/50 backdrop-blur-sm" style={{ animationDelay: `${catIdx * 100}ms` }}>
                <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
                  <CardTitle className="text-xl flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-primary to-accent" />
                    {category.replace(/_/g, ' ')}
                  </CardTitle>
                  {isSpecialLayer && (
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                      {(questions as any).instructions}
                    </p>
                  )}
                </CardHeader>
                <CardContent className="space-y-6 p-6">
                  {actualQuestions.map((q, idx) => (
                    <QuestionCard
                      key={q}
                      question={q}
                      questionIndex={idx}
                      layer={layer}
                      response={responses[q]}
                      onSaveResponse={saveResponse}
                      allResponses={responses}
                      categoryId={category}
                    />
                  ))}
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
