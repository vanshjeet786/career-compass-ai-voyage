import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  User,
  Briefcase,
  GraduationCap,
  MapPin,
  Target,
  Calendar,
  Clock,
  Edit,
  History,
  ArrowRight,
} from "lucide-react";
import { EDUCATION_LEVELS } from "@/data/backgroundOptions";
import type { BackgroundInfoRecord } from "@/types/backgroundInfo";
import { DeleteConfirmDialog } from "./DeleteConfirmDialog";

interface BackgroundInfoViewProps {
  record: BackgroundInfoRecord;
  onEdit: () => void;
  onHistory: () => void;
  onStartAssessment: () => void;
  onDeleteAll: () => void;
  isDeleting: boolean;
}

const USER_TYPE_LABELS: Record<string, string> = {
  student: "Student",
  graduate: "Recent Graduate",
  professional: "Working Professional",
  other: "Other / Career Break",
};

const LOCATION_LABELS: Record<string, string> = {
  remote: "Remote / Work from Home",
  urban: "Urban / City-based",
  suburban: "Suburban",
  rural: "Rural",
  flexible: "Flexible / No Preference",
};

const COUNSELING_LABELS: Record<string, string> = {
  none: "No, first time",
  informal: "Yes, informal guidance",
  formal: "Yes, professional counseling",
  online: "Yes, through online tools/tests",
};

export const BackgroundInfoView = ({
  record,
  onEdit,
  onHistory,
  onStartAssessment,
  onDeleteAll,
  isDeleting,
}: BackgroundInfoViewProps) => {
  const { userType, details } = record.background_info;
  const educationLabel =
    EDUCATION_LEVELS.find((l) => l.value === details.educationLevel)?.label ??
    details.educationLevel;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Unknown";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="border-primary/10 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-xl">Your Background Info</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Last updated: {formatDate(record.created_at)}
                </p>
              </div>
            </div>
            <Badge
              variant="secondary"
              className="bg-primary/10 text-primary border-primary/20"
            >
              {USER_TYPE_LABELS[userType] ?? userType}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Type-specific fields */}
            {userType === "professional" && (
              <>
                {details.jobTitle && (
                  <InfoField
                    icon={Briefcase}
                    label="Job Title"
                    value={details.jobTitle}
                  />
                )}
                {details.yearsExperience && (
                  <InfoField
                    icon={Clock}
                    label="Years of Experience"
                    value={`${details.yearsExperience} years`}
                  />
                )}
              </>
            )}
            {(userType === "student" || userType === "graduate") && (
              <>
                {details.fieldOfStudy && (
                  <InfoField
                    icon={GraduationCap}
                    label="Degree / Field of Study"
                    value={details.fieldOfStudy}
                  />
                )}
                {details.specialization && (
                  <InfoField
                    icon={GraduationCap}
                    label="Specialization"
                    value={details.specialization}
                  />
                )}
              </>
            )}
            {userType === "other" && details.currentStatus && (
              <InfoField
                icon={User}
                label="Current Status"
                value={details.currentStatus}
              />
            )}

            {/* Common fields */}
            {details.ageRange && (
              <InfoField
                icon={Calendar}
                label="Age Range"
                value={details.ageRange}
              />
            )}
            {details.educationLevel && (
              <InfoField
                icon={GraduationCap}
                label="Education Level"
                value={educationLabel}
              />
            )}
            {details.locationPreference && (
              <InfoField
                icon={MapPin}
                label="Location Preference"
                value={
                  LOCATION_LABELS[details.locationPreference] ??
                  details.locationPreference
                }
              />
            )}
            {details.previousCounseling && (
              <InfoField
                icon={User}
                label="Previous Counseling"
                value={
                  COUNSELING_LABELS[details.previousCounseling] ??
                  details.previousCounseling
                }
              />
            )}
          </div>

          {details.careerGoals && (
            <div className="pt-2 border-t border-border">
              <div className="flex items-center gap-2 mb-1.5">
                <Target className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium text-muted-foreground">
                  Career Goals
                </span>
              </div>
              <p className="text-sm text-foreground">{details.careerGoals}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <Button onClick={onEdit} className="gap-2">
          <Edit className="h-4 w-4" />
          Update Background Info
        </Button>
        <Button variant="outline" onClick={onHistory} className="gap-2">
          <History className="h-4 w-4" />
          View History
        </Button>
        <Button variant="outline" onClick={onStartAssessment} className="gap-2">
          <ArrowRight className="h-4 w-4" />
          Start New Assessment
        </Button>
        <DeleteConfirmDialog onConfirm={onDeleteAll} isDeleting={isDeleting} />
      </div>
    </div>
  );
};

function InfoField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
      <Icon className="h-4 w-4 text-primary mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}
