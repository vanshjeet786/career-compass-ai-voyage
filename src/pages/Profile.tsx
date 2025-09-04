import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogOut, FileText, TrendingUp, User, Calendar, Eye, Download, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

interface Assessment {
  id: string;
  status: string;
  started_at: string;
  completed_at?: string;
  current_layer: number;
}

interface ProfileStats {
  totalAssessments: number;
  completedAssessments: number;
  averageScore: number;
  lastActivity: string;
}

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loadingData, setLoadingData] = useState(true);

  // SEO setup
  useEffect(() => {
    document.title = "Profile Dashboard - Career Compass";
    const metaDesc = "Manage your career assessments, view insights, and track your progress.";
    let descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.name = 'description';
      document.head.appendChild(descTag);
    }
    descTag.content = metaDesc;
  }, []);

  // Load user assessments and stats
  useEffect(() => {
    if (!user) return;
    loadUserData();
  }, [user]);

  const loadUserData = async () => {
    try {
      // Fetch user assessments
      const { data: assessmentData, error: assessmentError } = await supabase
        .from("assessments")
        .select("id, status, started_at, completed_at, current_layer")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false });

      if (assessmentError) throw assessmentError;
      setAssessments(assessmentData || []);

      // Calculate stats
      const totalAssessments = assessmentData?.length || 0;
      const completedAssessments = assessmentData?.filter(a => a.status === 'completed').length || 0;
      
      // Get average score from completed assessments
      let averageScore = 0;
      if (completedAssessments > 0) {
        const { data: responseData } = await supabase
          .from("assessment_responses")
          .select("response_value, assessment_id")
          .in("assessment_id", assessmentData?.filter(a => a.status === 'completed').map(a => a.id) || []);

          if (responseData && responseData.length > 0) {
            const scores = responseData
              .filter(r => r.response_value && typeof r.response_value === 'object' && 'value' in r.response_value)
              .map(r => (r.response_value as any).value as number);
          
          averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        }
      }

      const lastActivity = assessmentData?.[0]?.started_at || new Date().toISOString();

      setStats({
        totalAssessments,
        completedAssessments,
        averageScore: Number(averageScore.toFixed(1)),
        lastActivity
      });
    } catch (error: any) {
      toast({
        title: "Error loading profile data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoadingData(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error: any) {
      toast({
        title: "Sign out error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const viewResults = (assessmentId: string) => {
    navigate(`/results?assess=${assessmentId}`);
  };

  const continueAssessment = (assessmentId: string) => {
    navigate(`/assessment`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading || loadingData) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  return (
    <main className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container py-12 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6 animate-fade-in">
          <div className="text-center md:text-left">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-medium mb-4">
              <User className="h-4 w-4" />
              Profile Dashboard
            </div>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent mb-4">
              Welcome back!
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Manage your career assessments and track your progress
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => navigate('/assessment')}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <FileText className="h-5 w-5 mr-2" />
              New Assessment
            </Button>
            <Button
              onClick={handleSignOut}
              variant="outline"
              size="lg"
              className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
            >
              <LogOut className="h-5 w-5 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-6 mb-12">
            <Card className="animate-fade-in border-0 shadow-lg bg-card/50 backdrop-blur-sm" style={{ animationDelay: '100ms' }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.totalAssessments}</p>
                    <p className="text-sm text-muted-foreground">Total Assessments</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in border-0 shadow-lg bg-card/50 backdrop-blur-sm" style={{ animationDelay: '200ms' }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-accent/10 rounded-full">
                    <TrendingUp className="h-6 w-6 text-accent" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.completedAssessments}</p>
                    <p className="text-sm text-muted-foreground">Completed</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in border-0 shadow-lg bg-card/50 backdrop-blur-sm" style={{ animationDelay: '300ms' }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-secondary/10 rounded-full">
                    <BarChart3 className="h-6 w-6 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{stats.averageScore}/5</p>
                    <p className="text-sm text-muted-foreground">Average Score</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="animate-fade-in border-0 shadow-lg bg-card/50 backdrop-blur-sm" style={{ animationDelay: '400ms' }}>
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{formatDate(stats.lastActivity).split(',')[0]}</p>
                    <p className="text-sm text-muted-foreground">Last Activity</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Assessment History */}
        <Card className="animate-fade-in border-0 shadow-xl bg-card/50 backdrop-blur-sm" style={{ animationDelay: '500ms' }}>
          <CardHeader className="bg-gradient-to-r from-primary/10 to-accent/10 border-b">
            <CardTitle className="text-2xl flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-gradient-to-r from-primary to-accent" />
              Assessment History
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {assessments.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assessments yet</h3>
                <p className="text-muted-foreground mb-6">Take your first career assessment to get started!</p>
                <Button
                  onClick={() => navigate('/assessment')}
                  className="bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                >
                  Start Assessment
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.map((assessment, index) => (
                  <div
                    key={assessment.id}
                    className="flex items-center justify-between p-6 rounded-xl border border-border/50 hover:border-primary/20 hover:shadow-md transition-all duration-300 bg-background/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${
                        assessment.status === 'completed' 
                          ? 'bg-accent/10' 
                          : 'bg-primary/10'
                      }`}>
                        {assessment.status === 'completed' ? (
                          <TrendingUp className={`h-5 w-5 ${assessment.status === 'completed' ? 'text-accent' : 'text-primary'}`} />
                        ) : (
                          <FileText className={`h-5 w-5 ${assessment.status === 'completed' ? 'text-accent' : 'text-primary'}`} />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold">
                          Assessment #{assessments.length - index}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <Badge 
                            variant={assessment.status === 'completed' ? 'default' : 'secondary'}
                            className={assessment.status === 'completed' ? 'bg-accent/20 text-accent' : 'bg-primary/20 text-primary'}
                          >
                            {assessment.status === 'completed' ? 'Completed' : `Layer ${assessment.current_layer}/6`}
                          </Badge>
                          <Separator orientation="vertical" className="h-4" />
                          <span className="text-sm text-muted-foreground">
                            Started {formatDate(assessment.started_at)}
                          </span>
                          {assessment.completed_at && (
                            <>
                              <Separator orientation="vertical" className="h-4" />
                              <span className="text-sm text-muted-foreground">
                                Completed {formatDate(assessment.completed_at)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {assessment.status === 'completed' ? (
                        <Button
                          onClick={() => viewResults(assessment.id)}
                          variant="outline"
                          size="sm"
                          className="hover:bg-accent/10 hover:text-accent hover:border-accent/30"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Results
                        </Button>
                      ) : (
                        <Button
                          onClick={() => continueAssessment(assessment.id)}
                          variant="outline" 
                          size="sm"
                          className="hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          Continue
                        </Button>
                      )}
                    </div>
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