import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, ArrowUpRight } from "lucide-react";
import type { Improvement } from "@/utils/assessmentAnalytics";

interface ImprovementsCardProps {
  improvements: Improvement[];
}

export function ImprovementsCard({ improvements }: ImprovementsCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-green-500" />
          Areas Improved
        </CardTitle>
      </CardHeader>
      <CardContent>
        {improvements.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Complete more assessments to track improvements.
          </p>
        ) : (
          <div className="space-y-3">
            {improvements.slice(0, 5).map((imp) => (
              <div key={imp.category} className="flex items-center justify-between">
                <span className="text-sm text-foreground truncate max-w-[60%]">
                  {imp.category}
                </span>
                <div className="flex items-center gap-1.5 text-green-600">
                  <ArrowUpRight className="h-3.5 w-3.5" />
                  <span className="text-sm font-semibold">+{imp.change}</span>
                  <span className="text-xs text-muted-foreground">
                    ({imp.baselineScore} → {imp.currentScore})
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
