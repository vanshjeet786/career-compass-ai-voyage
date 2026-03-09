import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export interface PreviousResponse {
  question_id: string;
  response_value: { label?: string; value?: number; text?: string; career1?: string; career2?: string; career3?: string };
  layer_number: number;
}

/**
 * Fetches the most recent completed assessment's responses for the current user.
 * Used to show "You previously answered: X" hints during repeat assessments.
 */
export function usePreviousResponses(currentAssessmentId: string | null) {
  const { user } = useAuth();
  const [previousResponses, setPreviousResponses] = useState<Record<string, PreviousResponse>>({});
  const [hasPreviousAssessment, setHasPreviousAssessment] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user || !currentAssessmentId) return;

    const fetchPrevious = async () => {
      setLoading(true);
      try {
        // Find the most recent completed assessment that isn't the current one
        const { data: prevAssessment, error: assessmentError } = await supabase
          .from("assessments")
          .select("id")
          .eq("user_id", user.id)
          .eq("status", "completed")
          .neq("id", currentAssessmentId)
          .order("completed_at", { ascending: false })
          .limit(1)
          .single();

        if (assessmentError || !prevAssessment) {
          setHasPreviousAssessment(false);
          return;
        }

        // Fetch all responses from that assessment
        const { data: responses, error: responsesError } = await supabase
          .from("assessment_responses")
          .select("question_id, response_value, layer_number")
          .eq("assessment_id", prevAssessment.id);

        if (responsesError || !responses) return;

        const mapped: Record<string, PreviousResponse> = {};
        for (const r of responses) {
          mapped[r.question_id] = {
            question_id: r.question_id,
            response_value: r.response_value as any,
            layer_number: r.layer_number,
          };
        }

        setPreviousResponses(mapped);
        setHasPreviousAssessment(true);
      } catch (err) {
        console.error("Failed to fetch previous responses", err);
      } finally {
        setLoading(false);
      }
    };

    fetchPrevious();
  }, [user, currentAssessmentId]);

  /**
   * Returns a human-readable summary of the previous answer for a question.
   */
  const getPreviousAnswerHint = (questionId: string): string | null => {
    const prev = previousResponses[questionId];
    if (!prev) return null;

    const val = prev.response_value;
    if (val.label) return val.label;
    if (val.text) return val.text.length > 80 ? val.text.slice(0, 80) + "..." : val.text;
    if (val.career1 || val.career2 || val.career3) {
      const careers = [val.career1, val.career2, val.career3].filter(Boolean);
      return careers.join(", ");
    }
    return null;
  };

  return { previousResponses, hasPreviousAssessment, loading, getPreviousAnswerHint };
}
