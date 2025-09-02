import React from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Loader2, HelpCircle, Lightbulb, Plus } from "lucide-react";
import { useSmartExplanations } from "../../hooks/useSmartExplanations";
import { useSmartSuggestions } from "../../hooks/useSmartSuggestions";
import { RESPONSE_SCALE } from "../../data/questions";

const likertOptions = Object.keys(RESPONSE_SCALE);

type ResponseValue = 
  | { label: string; value: number }
  | { text: string }
  | { label: string; value: number; customText: string }
  | { career1?: string; career2?: string; career3?: string };

interface QuestionCardProps {
  question: string;
  questionIndex: number;
  layer: number;
  response: ResponseValue | undefined;
  onSaveResponse: (questionId: string, value: ResponseValue) => void;
  allResponses: Record<string, ResponseValue>;
  categoryId: string;
}

// Function to check if a question is open-ended
const isOpenEndedQuestion = (layer: number, question: string) => {
  if (layer !== 6) return false;
  const openEndedPatterns = [
    /\(open-ended\)$/i, /^How would you/i, /^What kind/i,
    /^What are \d+/i, /^Who can help/i, /^What specific skills/i,
    /^What timeline/i, /^What fears or doubts/i, /^What kind of support/i,
  ];
  return openEndedPatterns.some(pattern => pattern.test(question));
};

// Function to check if a question is multi-input
const isMultiInputQuestion = (question: string) => {
  return question.includes("(multi-input)");
};

export const QuestionCard: React.FC<QuestionCardProps> = ({ 
  question, 
  questionIndex, 
  layer, 
  response, 
  onSaveResponse,
  allResponses,
  categoryId
}) => {
  const { getExplanation, getExpandedExplanation, explanations, expandedExplanations, loading: explanationLoading } = useSmartExplanations();
  const { getSuggestions, getAISuggestions, suggestions, aiSuggestions, loading: suggestionLoading } = useSmartSuggestions();

  const handleExplanation = () => {
    getExplanation(question, layer);
  };
  
  const handleExpandedExplanation = () => {
    getExpandedExplanation(question, layer, allResponses);
  };
  
  const handleSuggestions = () => {
    getSuggestions(question, layer, allResponses);
  };

  const handleAISuggestions = () => {
    getAISuggestions(question, layer, allResponses);
  };

  const isOtherOption = question.startsWith("Other (");
  const showSuggestButton = isOpenEndedQuestion(layer, question) || categoryId === "Career_Clustering";
  const isMultiInput = isMultiInputQuestion(question);

  return (
    <div className="group rounded-xl border border-border/50 p-6 hover:border-primary/20 hover:shadow-md transition-all duration-300 bg-background/50">
      <div className="flex items-start justify-between gap-4 mb-4">
        <p className="font-medium flex-1 text-foreground group-hover:text-primary transition-colors">
          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold mr-3">
            {questionIndex + 1}
          </span>
          {question}
        </p>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleExplanation} 
            disabled={explanationLoading === question}
            className="hover:bg-primary/10 hover:border-primary/20 transition-colors duration-200"
          >
            {explanationLoading === question ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <HelpCircle className="h-4 w-4 mr-1" />}
            Explain
          </Button>
          {showSuggestButton && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleSuggestions} 
              disabled={suggestionLoading === question}
              className="hover:bg-accent/10 hover:border-accent/20 transition-colors duration-200"
            >
              {suggestionLoading === question ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Lightbulb className="h-4 w-4 mr-1" />}
              Suggest
            </Button>
          )}
        </div>
      </div>

      {/* Response Inputs */}
      {layer <= 5 || (!isMultiInput && !isOpenEndedQuestion(layer, question) && categoryId !== 'Career_Clustering' && categoryId !== 'Passion_Practicality') ? (
        <RadioGroup
          value={response && 'label' in response ? (response as { label: string }).label : ""}
          onValueChange={(val) => onSaveResponse(question, { label: val, value: RESPONSE_SCALE[val] })}
          className="grid grid-cols-1 md:grid-cols-5 gap-3"
        >
          {likertOptions.map((opt) => (
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer" key={opt}>
              <RadioGroupItem id={`${question}-${opt}`} value={opt} className="text-primary" />
              <Label htmlFor={`${question}-${opt}`} className="flex-1 cursor-pointer font-medium">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      ) : isMultiInput ? (
         <div className="space-y-4">
            <div className="grid gap-4">
              {['career1', 'career2', 'career3'].map((field, idx) => (
                <div className="space-y-2" key={field}>
                  <Label htmlFor={`${question}-${field}`} className="text-sm font-medium">Career Interest {idx + 1}</Label>
                  <Input
                    id={`${question}-${field}`}
                    placeholder={`Enter career interest ${idx + 1}...`}
                    value={(response as any)?.[field] || ""}
                    onChange={(e) => {
                      const current = response as { career1?: string; career2?: string; career3?: string } || {};
                      onSaveResponse(question, { ...current, [field]: e.target.value });
                    }}
                    className="border-border/50 focus:border-primary/50 focus:ring-primary/20"
                  />
                </div>
              ))}
            </div>
        </div>
      ) : isOpenEndedQuestion(layer, question) ? (
        <Textarea
          placeholder="Share your thoughts, experiences, and insights..."
          value={response && 'text' in response ? (response as { text: string }).text : ""}
          onChange={(e) => onSaveResponse(question, { text: e.target.value })}
          className="min-h-[120px] resize-none border-border/50 focus:border-primary/50 focus:ring-primary/20"
        />
      ) : (
        <RadioGroup
          value={response && 'label' in response ? (response as { label: string }).label : ""}
          onValueChange={(val) => onSaveResponse(question, { label: val, value: RESPONSE_SCALE[val] })}
          className="grid grid-cols-1 md:grid-cols-5 gap-3"
        >
          {likertOptions.map((opt) => (
            <div className="flex items-center space-x-3 p-3 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-200 cursor-pointer" key={opt}>
              <RadioGroupItem id={`${question}-${opt}`} value={opt} className="text-primary" />
              <Label htmlFor={`${question}-${opt}`} className="flex-1 cursor-pointer font-medium">{opt}</Label>
            </div>
          ))}
        </RadioGroup>
      )}
      
      {isOtherOption && (
          <Textarea
            placeholder="Please specify your own career cluster..."
            value={response && 'customText' in response ? (response as { customText: string }).customText : ""}
            onChange={(e) => onSaveResponse(question, { ...response, customText: e.target.value } as any)}
            className="mt-4 min-h-[80px] resize-none border-border/50 focus:border-primary/50 focus:ring-primary/20"
          />
      )}

      {/* Explanations and Suggestions Display */}
      {(explanations[question] || suggestions[question] || aiSuggestions[question] || expandedExplanations[question]) && (
        <div className="mt-4 space-y-3 animate-fade-in">
          {explanations[question] && (
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="text-sm">
                <span className="font-semibold text-primary flex items-center gap-2 mb-2">
                  <HelpCircle className="h-4 w-4" /> Why it matters:
                </span>
                <span className="text-muted-foreground mb-3 block">{explanations[question]}</span>
                {!expandedExplanations[question] && (
                  <Button variant="ghost" size="sm" onClick={handleExpandedExplanation} disabled={explanationLoading === question} className="text-primary hover:text-primary/80 p-0 h-auto font-medium">
                    {explanationLoading === question ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Loading...</> : <><Plus className="h-3 w-3 mr-1" /> Explain More</>}
                  </Button>
                )}
              </div>
            </div>
          )}
          {expandedExplanations[question] && (
             <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="text-sm">
                    <span className="font-semibold text-primary flex items-center gap-2 mb-2">
                        <HelpCircle className="h-4 w-4" /> Detailed Explanation:
                    </span>
                    <span className="text-muted-foreground mb-3 block">{expandedExplanations[question]}</span>
                </div>
             </div>
          )}
          {(suggestions[question] || aiSuggestions[question]) && (
             <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                <div className="text-sm">
                   <span className="font-semibold text-accent flex items-center gap-2 mb-3">
                     <Lightbulb className="h-4 w-4" /> Smart Suggestions:
                   </span>
                   <div className="space-y-2">
                    {(suggestions[question] || (aiSuggestions[question] ? [aiSuggestions[question]] : [])).map((suggestion: string, idx: number) => (
                      <div key={idx} className="flex items-start gap-2 p-2 rounded border border-accent/10 bg-background/50">
                        <div className="w-5 h-5 rounded-full bg-accent/20 text-accent text-xs flex items-center justify-center font-semibold flex-shrink-0 mt-0.5">
                          {idx + 1}
                        </div>
                        <span className="text-muted-foreground text-sm">{suggestion}</span>
                      </div>
                    ))}
                   </div>
                   {!aiSuggestions[question] && (
                    <Button variant="ghost" size="sm" onClick={handleAISuggestions} disabled={suggestionLoading === question} className="text-accent hover:text-accent/80 p-0 h-auto font-medium mt-3">
                      {suggestionLoading === question ? <><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Getting AI suggestions...</> : <><Plus className="h-3 w-3 mr-1" /> Get AI Suggestions</>}
                    </Button>
                  )}
                </div>
             </div>
          )}
        </div>
      )}
    </div>
  );
};