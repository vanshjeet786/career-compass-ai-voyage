import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CareerMatch } from "@/utils/assessmentAnalytics";

interface CareerMatchesCardProps {
  matches: CareerMatch[];
}

export function CareerMatchesCard({ matches }: CareerMatchesCardProps) {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-500" />
          Career Matches
        </CardTitle>
      </CardHeader>
      <CardContent>
        {matches.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Complete an assessment to see career matches.
          </p>
        ) : (
          <div className="space-y-2.5">
            {matches.map((m) => (
              <div key={m.career} className="flex items-center justify-between">
                <span className="text-sm text-foreground truncate max-w-[65%]">
                  {m.career}
                </span>
                <Badge variant="secondary" className="text-xs">
                  {m.frequency}x matched
                </Badge>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
