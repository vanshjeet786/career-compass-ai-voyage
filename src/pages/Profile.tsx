import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import {
  Loader2,
  FileText,
  TrendingUp,
  Calendar,
  Eye,
  Zap,
  Target,
  BarChart3,
  Plus,
  MessageSquare,
  Trophy,
  ArrowRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { generateUserProfile, generateCareerRecommendations } from "@/utils/userProfile";

interface Assessment {
  id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  current_layer: number;
}

interface DashboardData {
  totalAssessments: number;
  completedAssessments: number;
  lastActivity: string;
  topStrength: { category: string; score: number } | null;
  topCareer: { title: string; compatibility: number } | null;
  latestAssessmentId: string | null;
}

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    document.title = "Dashboard - Career Compass";
  }, []);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    try {
      const { data: assessmentData, error } = await supabase
        .from("assessments")
        .select("id, status, started_at, completed_at, current_layer")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false });

      if (error) throw error;
      setAssessments(assessmentData || []);

      const total = assessmentData?.length || 0;
      const completed = assessmentData?.filter((a) => a.status === "completed") || [];
      const lastActivity = assessmentData?.[0]?.started_at || new Date().toISOString();
      const latestCompleted = completed[0] || null;

      let topStrength: DashboardData["topStrength"] = null;
      let topCareer: DashboardData["topCareer"] = null;
      let latestAssessmentId: string | null = latestCompleted?.id || null;

      if (latestCompleted) {
        // Fetch responses for the latest completed assessment
        const { data: responses } = await supabase
          .from("assessment_responses")
          .select("question_id, response_value, layer_number")
          .eq("assessment_id", latestCompleted.id);

        if (responses && responses.length > 0) {
          const profile = generateUserProfile(
            responses.map((r) => ({
              question_id: r.question_id,
              response_value: r.response_value,
              layer_number: r.layer_number,
            })),
            latestCompleted.id
          );

          // Top strength
          if (profile.overallScores.topStrengths.length > 0) {
            const top = profile.overallScores.topStrengths[0];
            topStrength = { category: top.category, score: top.score };
          }

          // Top career
          const careers = generateCareerRecommendations(profile);
          if (careers.length > 0) {
            const best = careers.sort((a, b) => b.compatibilityScore - a.compatibilityScore)[0];
            topCareer = { title: best.title, compatibility: best.compatibilityScore };
          }
        }
      }

      setData({
        totalAssessments: total,
        completedAssessments: completed.length,
        lastActivity,
        topStrength,
        topCareer,
        latestAssessmentId,
      });
    } catch (error: any) {
      toast({
        title: "Error loading dashboard",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });

  if (loading || loadingData) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const completionRate =
    data && data.totalAssessments > 0
      ? Math.round((data.completedAssessments / data.totalAssessments) * 100)
      : 0;

  return (
    <main className="min-h-screen bg-background">
      <div className="container py-8 max-w-6xl space-y-8">
        {/* Header */}
        <div className="animate-fade-in">
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Your career assessment overview
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 animate-fade-in">
          <Button
            onClick={() => navigate("/assessment")}
            className="h-auto py-4 px-5 bg-primary text-primary-foreground hover:bg-primary/90 justify-start gap-3"
          >
            <div className="p-2 bg-primary-foreground/20 rounded-lg">
              <Plus className="h-5 w-5" />
            </div>
            <div className="text-left">
              <div className="font-semibold">New Assessment</div>
              <div className="text-xs opacity-80">Start a fresh evaluation</div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() =>
              data?.latestAssessmentId
                ? navigate(`/results?assess=${data.latestAssessmentId}`)
                : navigate("/results")
            }
            className="h-auto py-4 px-5 justify-start gap-3 border-border hover:bg-muted"
          >
            <div className="p-2 bg-primary/10 rounded-lg">
              <BarChart3 className="h-5 w-5 text-primary" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-foreground">View Results</div>
              <div className="text-xs text-muted-foreground">See latest insights</div>
            </div>
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate("/background-info")}
            className="h-auto py-4 px-5 justify-start gap-3 border-border hover:bg-muted"
          >
            <div className="p-2 bg-accent/10 rounded-lg">
              <MessageSquare className="h-5 w-5 text-accent" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-foreground">Background Info</div>
              <div className="text-xs text-muted-foreground">Update your profile</div>
            </div>
          </Button>
        </div>

        {/* Stats Grid */}
        {data && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
            {/* Top Strength */}
            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Trophy className="h-4 w-4 text-secondary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Top Strength
                  </span>
                </div>
                {data.topStrength ? (
                  <>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {data.topStrength.category}
                    </p>
                    <p className="text-2xl font-bold text-primary mt-1">
                      {data.topStrength.score}
                      <span className="text-sm text-muted-foreground font-normal">/5</span>
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Complete an assessment</p>
                )}
              </CardContent>
            </Card>

            {/* Top Career */}
            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-4 w-4 text-accent" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Top Match
                  </span>
                </div>
                {data.topCareer ? (
                  <>
                    <p className="text-sm font-semibold text-foreground truncate">
                      {data.topCareer.title}
                    </p>
                    <p className="text-2xl font-bold text-accent mt-1">
                      {data.topCareer.compatibility}
                      <span className="text-sm text-muted-foreground font-normal">%</span>
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">Complete an assessment</p>
                )}
              </CardContent>
            </Card>

            {/* Progress */}
            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-primary" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Completion
                  </span>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {data.completedAssessments}
                  <span className="text-sm text-muted-foreground font-normal">
                    /{data.totalAssessments}
                  </span>
                </p>
                <Progress value={completionRate} className="h-1.5 mt-2" />
              </CardContent>
            </Card>

            {/* Last Activity */}
            <Card className="border-border bg-card">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Last Active
                  </span>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {formatDate(data.lastActivity)}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Assessment History */}
        <Card className="border-border bg-card animate-fade-in">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Assessment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {assessments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-3" />
                <h3 className="font-semibold text-foreground mb-1">No assessments yet</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Take your first career assessment to get started
                </p>
                <Button onClick={() => navigate("/assessment")} size="sm">
                  Start Assessment
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {assessments.map((assessment, index) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`p-2 rounded-lg shrink-0 ${
                          assessment.status === "completed"
                            ? "bg-accent/10"
                            : "bg-primary/10"
                        }`}
                      >
                        {assessment.status === "completed" ? (
                          <TrendingUp className="h-4 w-4 text-accent" />
                        ) : (
                          <FileText className="h-4 w-4 text-primary" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-foreground">
                          Assessment #{assessments.length - index}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                          <Badge
                            variant={assessment.status === "completed" ? "default" : "secondary"}
                            className={`text-xs ${
                              assessment.status === "completed"
                                ? "bg-accent/15 text-accent border-accent/20"
                                : "bg-primary/15 text-primary border-primary/20"
                            }`}
                          >
                            {assessment.status === "completed"
                              ? "Completed"
                              : `Layer ${assessment.current_layer}/6`}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {formatDate(assessment.started_at)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        assessment.status === "completed"
                          ? navigate(`/results?assess=${assessment.id}`)
                          : navigate("/assessment")
                      }
                      className="shrink-0 gap-1 text-muted-foreground hover:text-primary"
                    >
                      {assessment.status === "completed" ? (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">View</span>
                        </>
                      ) : (
                        <>
                          <ArrowRight className="h-3.5 w-3.5" />
                          <span className="hidden sm:inline">Continue</span>
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Profile;
