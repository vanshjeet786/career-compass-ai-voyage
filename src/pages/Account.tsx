import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBackgroundInfo } from "@/hooks/useBackgroundInfo";
import { Navigate, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  User,
  Mail,
  Calendar,
  Edit,
  Check,
  X,
  ArrowRight,
  Briefcase,
  GraduationCap,
  FileText,
  Key,
  Settings,
} from "lucide-react";

const USER_TYPE_LABELS: Record<string, string> = {
  student: "Student",
  graduate: "Recent Graduate",
  professional: "Working Professional",
  other: "Other / Career Break",
};

const Account = () => {
  const { user, loading } = useAuth();
  const { currentInfo, isLoading: bgLoading } = useBackgroundInfo();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<{
    full_name: string | null;
    created_at: string | null;
  } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [assessmentStats, setAssessmentStats] = useState({
    total: 0,
    completed: 0,
    lastActivity: null as string | null,
  });

  const [changingPassword, setChangingPassword] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    document.title = "Account - Career Compass";
  }, []);

  useEffect(() => {
    if (!user) return;
    loadProfile();
    loadStats();
  }, [user]);

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, created_at")
        .eq("id", user!.id)
        .maybeSingle();

      if (error) throw error;
      setProfile(data);
      setNameValue(data?.full_name ?? "");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error loading profile",
        description: error.message,
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const loadStats = async () => {
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select("id, status, started_at")
        .eq("user_id", user!.id)
        .order("started_at", { ascending: false });

      if (error) throw error;
      const all = data ?? [];
      setAssessmentStats({
        total: all.length,
        completed: all.filter((a) => a.status === "completed").length,
        lastActivity: all[0]?.started_at ?? null,
      });
    } catch {
      // non-critical
    }
  };

  const saveName = async () => {
    setSavingName(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: nameValue.trim() || null, updated_at: new Date().toISOString() })
        .eq("id", user!.id);

      if (error) throw error;
      setProfile((p) => (p ? { ...p, full_name: nameValue.trim() || null } : p));
      setEditingName(false);
      toast({ title: "Name updated" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setSavingName(false);
    }
  };

  const savePassword = async () => {
    if (newPassword.length < 6) {
      toast({
        variant: "destructive",
        title: "Password too short",
        description: "Password must be at least 6 characters.",
      });
      return;
    }
    setSavingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      setChangingPassword(false);
      setNewPassword("");
      toast({ title: "Password updated" });
    } catch (error: any) {
      toast({ variant: "destructive", title: "Error", description: error.message });
    } finally {
      setSavingPassword(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const initials = user.email
    ? user.email.slice(0, 2).toUpperCase()
    : "U";

  const bgInfo = currentInfo?.background_info;

  return (
    <main className="min-h-screen bg-background">
      <div className="container py-8 max-w-3xl space-y-6">
        <h1 className="text-3xl font-bold text-foreground">Account</h1>

        {/* Profile Card */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="bg-primary/15 text-primary text-xl font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 space-y-3">
                {/* Full Name */}
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <User className="h-3 w-3" /> Full Name
                  </Label>
                  {editingName ? (
                    <div className="flex items-center gap-2 mt-1">
                      <Input
                        value={nameValue}
                        onChange={(e) => setNameValue(e.target.value)}
                        placeholder="Enter your full name"
                        className="h-8 max-w-xs"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={saveName}
                        disabled={savingName}
                      >
                        {savingName ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Check className="h-4 w-4 text-green-500" />
                        )}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8"
                        onClick={() => {
                          setEditingName(false);
                          setNameValue(profile?.full_name ?? "");
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {profile?.full_name || "Not set"}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setEditingName(true)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Email */}
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Mail className="h-3 w-3" /> Email
                  </Label>
                  <p className="text-sm font-medium text-foreground">
                    {user.email}
                  </p>
                </div>

                {/* Member since */}
                <div>
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Member Since
                  </Label>
                  <p className="text-sm font-medium text-foreground">
                    {formatDate(profile?.created_at ?? user.created_at)}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Background Info Summary */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4 text-primary" />
                Background Info
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/background-info")}
                className="gap-1 text-primary"
              >
                Manage
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            {bgLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            ) : bgInfo ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    {USER_TYPE_LABELS[bgInfo.userType] ?? bgInfo.userType}
                  </span>
                </div>
                {bgInfo.userType === "professional" && bgInfo.details.jobTitle && (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {bgInfo.details.jobTitle}
                      {bgInfo.details.yearsExperience
                        ? ` (${bgInfo.details.yearsExperience} yrs)`
                        : ""}
                    </span>
                  </div>
                )}
                {(bgInfo.userType === "student" || bgInfo.userType === "graduate") &&
                  bgInfo.details.fieldOfStudy && (
                    <div className="flex items-center gap-2">
                      <GraduationCap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        {bgInfo.details.fieldOfStudy}
                        {bgInfo.details.specialization
                          ? ` - ${bgInfo.details.specialization}`
                          : ""}
                      </span>
                    </div>
                  )}
                {bgInfo.details.educationLevel && (
                  <div className="flex items-center gap-2">
                    <GraduationCap className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{bgInfo.details.educationLevel}</span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No background info saved yet.{" "}
                <button
                  onClick={() => navigate("/background-info")}
                  className="text-primary underline underline-offset-2"
                >
                  Add now
                </button>
              </p>
            )}
          </CardContent>
        </Card>

        {/* Assessment Stats */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" />
              Assessment Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex items-center gap-6 text-sm">
              <div>
                <span className="text-2xl font-bold text-foreground">
                  {assessmentStats.total}
                </span>
                <span className="text-muted-foreground ml-1">total</span>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div>
                <span className="text-2xl font-bold text-accent">
                  {assessmentStats.completed}
                </span>
                <span className="text-muted-foreground ml-1">completed</span>
              </div>
              {assessmentStats.lastActivity && (
                <>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-muted-foreground">
                    Last: {formatDate(assessmentStats.lastActivity)}
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              Security
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {changingPassword ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password (min 6 characters)"
                    className="max-w-sm"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={savePassword}
                    disabled={savingPassword}
                  >
                    {savingPassword ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : null}
                    Update Password
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setChangingPassword(false);
                      setNewPassword("");
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setChangingPassword(true)}
                className="gap-2"
              >
                <Key className="h-4 w-4" />
                Change Password
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Account;
