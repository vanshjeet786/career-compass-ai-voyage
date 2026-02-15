
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

export const useAssessmentHistory = () => {
  const { user } = useAuth();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchHistory = async () => {
      try {
        const { data, error } = await supabase
          .from("assessments")
          .select(`
            id,
            status,
            completed_at,
            created_at,
            assessment_results (
               intelligence_scores,
               personality_insights,
               created_at
            )
          `)
          .eq("user_id", user.id)
          .eq("status", "completed")
          .order("completed_at", { ascending: false });

        if (error) throw error;
        setAssessments(data || []);
      } catch (err) {
        console.error("Failed to fetch assessment history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  /**
   * Compares the most recent assessment (or a specific one) with the previous one.
   */
  const getProgressAnalysis = (currentAssessmentId: string) => {
    if (assessments.length < 2) return null;

    // Sort chronologically (oldest first) to find the index
    const sorted = [...assessments].sort((a, b) =>
        new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    );

    const currentIndex = sorted.findIndex(a => a.id === currentAssessmentId);
    if (currentIndex <= 0) return null; // No previous history to compare

    const current = sorted[currentIndex];
    const previous = sorted[currentIndex - 1];

    // Extract scores (handling potential JSON structure variations)
    const currentScores = current.assessment_results?.[0]?.intelligence_scores || {};
    const prevScores = previous.assessment_results?.[0]?.intelligence_scores || {};

    const improvements: { category: string; change: number }[] = [];
    const declines: { category: string; change: number }[] = [];

    Object.entries(currentScores).forEach(([category, score]) => {
        const currentVal = Number(score);
        const prevVal = Number(prevScores[category]);

        if (!isNaN(currentVal) && !isNaN(prevVal)) {
            const change = currentVal - prevVal;
            if (change > 0.3) improvements.push({ category, change });
            else if (change < -0.3) declines.push({ category, change });
        }
    });

    return {
        improvements,
        declines,
        totalAssessments: currentIndex + 1,
        previousDate: previous.completed_at
    };
  };

  return { assessments, loading, getProgressAnalysis };
};
