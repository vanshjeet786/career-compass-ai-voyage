import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Timeframe } from "@/utils/assessmentAnalytics";

interface TimeframeFilterProps {
  value: Timeframe;
  onValueChange: (timeframe: Timeframe) => void;
}

export function TimeframeFilter({ value, onValueChange }: TimeframeFilterProps) {
  return (
    <Select value={value} onValueChange={(v) => onValueChange(v as Timeframe)}>
      <SelectTrigger className="w-[140px] h-8 text-xs">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Time</SelectItem>
        <SelectItem value="6month">Last 6 Months</SelectItem>
        <SelectItem value="1year">Last 1 Year</SelectItem>
      </SelectContent>
    </Select>
  );
}
