import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, ArrowUpRight, ArrowDownRight, Plus, Minus } from "lucide-react";
import { EDUCATION_LEVELS } from "@/data/backgroundOptions";
import type { BackgroundInfoRecord, BackgroundInfoDetails } from "@/types/backgroundInfo";

interface BackgroundInfoHistoryProps {
  history: BackgroundInfoRecord[];
  onBack: () => void;
}

const USER_TYPE_LABELS: Record<string, string> = {
  student: "Student",
  graduate: "Recent Graduate",
  professional: "Working Professional",
  other: "Other / Career Break",
};

const FIELD_LABELS: Record<keyof BackgroundInfoDetails, string> = {
  jobTitle: "Job Title",
  yearsExperience: "Years of Experience",
  fieldOfStudy: "Field of Study",
  specialization: "Specialization",
  currentStatus: "Current Status",
  ageRange: "Age Range",
  educationLevel: "Education Level",
  locationPreference: "Location Preference",
  careerGoals: "Career Goals",
  previousCounseling: "Previous Counseling",
};

function getEducationLabel(value: string): string {
  return EDUCATION_LEVELS.find((l) => l.value === value)?.label ?? value;
}

function formatFieldValue(key: string, value: string): string {
  if (key === "educationLevel") return getEducationLabel(value);
  return value;
}

function computeDiffs(
  current: BackgroundInfoRecord,
  previous: BackgroundInfoRecord | null
): Array<{ field: string; type: "added" | "changed" | "removed"; oldVal?: string; newVal?: string }> {
  const diffs: Array<{ field: string; type: "added" | "changed" | "removed"; oldVal?: string; newVal?: string }> = [];
  const curDetails = current.background_info.details;
  const prevDetails = previous?.background_info.details;

  if (!previous) {
    // First entry - show all fields as "added"
    for (const [key, val] of Object.entries(curDetails)) {
      if (val) {
        diffs.push({
          field: FIELD_LABELS[key as keyof BackgroundInfoDetails] ?? key,
          type: "added",
          newVal: formatFieldValue(key, val),
        });
      }
    }
    if (current.background_info.userType !== previous?.background_info.userType) {
      diffs.unshift({
        field: "User Type",
        type: "added",
        newVal: USER_TYPE_LABELS[current.background_info.userType] ?? current.background_info.userType,
      });
    }
    return diffs;
  }

  // Compare user types
  if (current.background_info.userType !== previous.background_info.userType) {
    diffs.push({
      field: "User Type",
      type: "changed",
      oldVal: USER_TYPE_LABELS[previous.background_info.userType] ?? previous.background_info.userType,
      newVal: USER_TYPE_LABELS[current.background_info.userType] ?? current.background_info.userType,
    });
  }

  // Compare detail fields
  const allKeys = new Set([
    ...Object.keys(curDetails),
    ...(prevDetails ? Object.keys(prevDetails) : []),
  ]) as Set<keyof BackgroundInfoDetails>;

  for (const key of allKeys) {
    const curVal = curDetails[key] || "";
    const prevVal = prevDetails?.[key] || "";

    if (curVal && !prevVal) {
      diffs.push({
        field: FIELD_LABELS[key] ?? key,
        type: "added",
        newVal: formatFieldValue(key, curVal),
      });
    } else if (!curVal && prevVal) {
      diffs.push({
        field: FIELD_LABELS[key] ?? key,
        type: "removed",
        oldVal: formatFieldValue(key, prevVal),
      });
    } else if (curVal !== prevVal) {
      diffs.push({
        field: FIELD_LABELS[key] ?? key,
        type: "changed",
        oldVal: formatFieldValue(key, prevVal),
        newVal: formatFieldValue(key, curVal),
      });
    }
  }

  return diffs;
}

function formatDate(dateString: string | null): string {
  if (!dateString) return "Unknown";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const BackgroundInfoHistory = ({
  history,
  onBack,
}: BackgroundInfoHistoryProps) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h2 className="text-xl font-semibold text-foreground">
          Background Info History
        </h2>
        <Badge variant="secondary" className="text-xs">
          {history.length} {history.length === 1 ? "version" : "versions"}
        </Badge>
      </div>

      {history.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No history available.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-[19px] top-8 bottom-4 w-0.5 bg-border" />

          <div className="space-y-4">
            {history.map((entry, index) => {
              const previous = index < history.length - 1 ? history[index + 1] : null;
              const diffs = computeDiffs(entry, previous);
              const isCurrent = index === 0;

              return (
                <div key={entry.id} className="relative flex gap-4">
                  {/* Timeline dot */}
                  <div
                    className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                      isCurrent
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border-2 border-border text-muted-foreground"
                    }`}
                  >
                    <Clock className="h-4 w-4" />
                  </div>

                  <Card className={`flex-1 ${isCurrent ? "border-primary/20" : ""}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-sm font-medium">
                            {formatDate(entry.created_at)}
                          </CardTitle>
                          {isCurrent && (
                            <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                              Current
                            </Badge>
                          )}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {USER_TYPE_LABELS[entry.background_info.userType] ??
                            entry.background_info.userType}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      {diffs.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          No changes from previous version.
                        </p>
                      ) : (
                        <div className="space-y-1.5">
                          {diffs.map((diff, di) => (
                            <div
                              key={di}
                              className="flex items-start gap-2 text-xs"
                            >
                              {diff.type === "added" && (
                                <>
                                  <Plus className="h-3.5 w-3.5 text-green-500 mt-0.5 shrink-0" />
                                  <span>
                                    <span className="font-medium text-foreground">
                                      {diff.field}:
                                    </span>{" "}
                                    <span className="text-green-600">
                                      {diff.newVal}
                                    </span>
                                  </span>
                                </>
                              )}
                              {diff.type === "removed" && (
                                <>
                                  <Minus className="h-3.5 w-3.5 text-red-500 mt-0.5 shrink-0" />
                                  <span>
                                    <span className="font-medium text-foreground">
                                      {diff.field}:
                                    </span>{" "}
                                    <span className="text-red-500 line-through">
                                      {diff.oldVal}
                                    </span>
                                  </span>
                                </>
                              )}
                              {diff.type === "changed" && (
                                <>
                                  <ArrowUpRight className="h-3.5 w-3.5 text-blue-500 mt-0.5 shrink-0" />
                                  <span>
                                    <span className="font-medium text-foreground">
                                      {diff.field}:
                                    </span>{" "}
                                    <span className="text-muted-foreground line-through">
                                      {diff.oldVal}
                                    </span>{" "}
                                    <span className="text-blue-600">
                                      {diff.newVal}
                                    </span>
                                  </span>
                                </>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
