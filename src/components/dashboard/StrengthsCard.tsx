import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Strength } from "@/utils/assessmentAnalytics";

interface StrengthsCardProps {
  strengths: Strength[];
}

export function StrengthsCard({ strengths }: StrengthsCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Top Strengths
        </CardTitle>
      </CardHeader>
      <CardContent>
        {strengths.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Complete an assessment to see your strengths.
          </p>
        ) : (
          <div className="space-y-3">
            {strengths.map((s, i) => (
              <div key={s.category}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground truncate max-w-[70%]">
                    {i + 1}. {s.category}
                  </span>
                  <span className="text-sm font-semibold text-primary">
                    {s.score}/5
                  </span>
                </div>
                <Progress value={(s.score / 5) * 100} className="h-1.5" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
