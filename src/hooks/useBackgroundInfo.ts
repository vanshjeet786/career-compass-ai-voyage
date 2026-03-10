import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { BackgroundInfoData, BackgroundInfoRecord } from "@/types/backgroundInfo";

export function useBackgroundInfo() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const currentQuery = useQuery({
    queryKey: ["background-info", "current", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("background_info_history")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as BackgroundInfoRecord | null;
    },
    enabled: !!user,
  });

  const historyQuery = useQuery({
    queryKey: ["background-info", "history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("background_info_history")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as unknown as BackgroundInfoRecord[];
    },
    enabled: !!user,
  });

  const updateMutation = useMutation({
    mutationFn: async (info: BackgroundInfoData) => {
      const { data, error } = await supabase
        .from("background_info_history")
        .insert({
          user_id: user!.id,
          background_info: info as any,
        })
        .select()
        .single();

      if (error) throw error;
      return data as unknown as BackgroundInfoRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["background-info"] });
    },
  });

  const deleteAllMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("background_info_history")
        .delete()
        .eq("user_id", user!.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["background-info"] });
    },
  });

  return {
    currentInfo: currentQuery.data ?? null,
    history: historyQuery.data ?? [],
    isLoading: currentQuery.isLoading,
    isHistoryLoading: historyQuery.isLoading,
    updateInfo: updateMutation.mutateAsync,
    isUpdating: updateMutation.isPending,
    deleteAll: deleteAllMutation.mutateAsync,
    isDeleting: deleteAllMutation.isPending,
  };
}
