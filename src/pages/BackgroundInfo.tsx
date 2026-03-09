import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useBackgroundInfo } from "@/hooks/useBackgroundInfo";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { BackgroundInfoView } from "@/components/background-info/BackgroundInfoView";
import { BackgroundInfoForm } from "@/components/background-info/BackgroundInfoForm";
import { BackgroundInfoHistory } from "@/components/background-info/BackgroundInfoHistory";
import { BackgroundInfoEmpty } from "@/components/background-info/BackgroundInfoEmpty";
import type { BackgroundInfoData } from "@/types/backgroundInfo";

type Mode = "view" | "edit" | "history";

const BackgroundInfo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    currentInfo,
    history,
    isLoading,
    updateInfo,
    isUpdating,
    deleteAll,
    isDeleting,
  } = useBackgroundInfo();

  const [mode, setMode] = useState<Mode>("view");

  const handleSave = async (data: BackgroundInfoData) => {
    try {
      await updateInfo(data);
      toast({
        title: "Background Info Updated",
        description: "Your background information has been saved.",
      });
      setMode("view");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleSaveAndStart = async (data: BackgroundInfoData) => {
    if (!user) return;
    try {
      await updateInfo(data);

      // Abandon any existing in-progress assessments
      await supabase
        .from("assessments")
        .update({ status: "abandoned" })
        .eq("user_id", user.id)
        .eq("status", "in_progress");

      // Create a fresh assessment with background info snapshot
      const { data: assessment, error } = await supabase
        .from("assessments")
        .insert({
          user_id: user.id,
          status: "in_progress",
          current_layer: 1,
          started_at: new Date().toISOString(),
          background_info: { userType: data.userType, details: data.details },
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Assessment Started",
        description: "Your background info has been saved and a new assessment started.",
      });

      navigate(`/assessment?id=${assessment.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleStartAssessment = async () => {
    if (!user || !currentInfo) return;
    try {
      // Abandon any existing in-progress assessments
      await supabase
        .from("assessments")
        .update({ status: "abandoned" })
        .eq("user_id", user.id)
        .eq("status", "in_progress");

      // Create assessment with current background info
      const { data: assessment, error } = await supabase
        .from("assessments")
        .insert({
          user_id: user.id,
          status: "in_progress",
          current_layer: 1,
          started_at: new Date().toISOString(),
          background_info: currentInfo.background_info,
        } as any)
        .select()
        .single();

      if (error) throw error;
      navigate(`/assessment?id=${assessment.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  const handleDeleteAll = async () => {
    try {
      await deleteAll();
      toast({
        title: "Deleted",
        description: "All background information has been removed.",
      });
      setMode("view");
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container py-8 max-w-3xl">
        {mode === "view" && !currentInfo && (
          <BackgroundInfoEmpty onAdd={() => setMode("edit")} />
        )}

        {mode === "view" && currentInfo && (
          <BackgroundInfoView
            record={currentInfo}
            onEdit={() => setMode("edit")}
            onHistory={() => setMode("history")}
            onStartAssessment={handleStartAssessment}
            onDeleteAll={handleDeleteAll}
            isDeleting={isDeleting}
          />
        )}

        {mode === "edit" && (
          <BackgroundInfoForm
            initialData={currentInfo?.background_info ?? null}
            onSave={handleSave}
            onSaveAndStart={handleSaveAndStart}
            onCancel={currentInfo ? () => setMode("view") : undefined}
            isSaving={isUpdating}
          />
        )}

        {mode === "history" && (
          <BackgroundInfoHistory
            history={history}
            onBack={() => setMode("view")}
          />
        )}
      </div>
    </div>
  );
};

export default BackgroundInfo;
