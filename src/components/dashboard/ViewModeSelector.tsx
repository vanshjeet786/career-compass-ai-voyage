import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Clock, TrendingUp, BarChart3 } from "lucide-react";
import type { ViewMode } from "@/utils/assessmentAnalytics";

interface ViewModeSelectorProps {
  value: ViewMode;
  onValueChange: (mode: ViewMode) => void;
}

export function ViewModeSelector({ value, onValueChange }: ViewModeSelectorProps) {
  return (
    <ToggleGroup
      type="single"
      value={value}
      onValueChange={(v) => { if (v) onValueChange(v as ViewMode); }}
      className="bg-muted rounded-lg p-1"
    >
      <ToggleGroupItem value="latest" aria-label="Latest assessment" className="gap-1.5 text-xs px-3">
        <Clock className="h-3.5 w-3.5" />
        Latest
      </ToggleGroupItem>
      <ToggleGroupItem value="trend" aria-label="Last 5 assessments trend" className="gap-1.5 text-xs px-3">
        <TrendingUp className="h-3.5 w-3.5" />
        Trend
      </ToggleGroupItem>
      <ToggleGroupItem value="overall" aria-label="All-time overall" className="gap-1.5 text-xs px-3">
        <BarChart3 className="h-3.5 w-3.5" />
        Overall
      </ToggleGroupItem>
    </ToggleGroup>
  );
}
