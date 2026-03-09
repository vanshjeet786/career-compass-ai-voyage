import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, ArrowRight, X, User, GraduationCap, MapPin, Target } from "lucide-react";
import { Combobox } from "@/components/ui/combobox";
import { INDIAN_DEGREES, SPECIALIZATIONS, JOB_TITLES, EDUCATION_LEVELS } from "@/data/backgroundOptions";
import type { BackgroundInfoData, BackgroundInfoDetails } from "@/types/backgroundInfo";
import { EMPTY_FORM_DATA } from "@/types/backgroundInfo";

interface BackgroundInfoFormProps {
  initialData?: BackgroundInfoData | null;
  onSave: (data: BackgroundInfoData) => Promise<void>;
  onSaveAndStart?: (data: BackgroundInfoData) => Promise<void>;
  onCancel?: () => void;
  isSaving: boolean;
}

export const BackgroundInfoForm = ({
  initialData,
  onSave,
  onSaveAndStart,
  onCancel,
  isSaving,
}: BackgroundInfoFormProps) => {
  const [userType, setUserType] = useState<BackgroundInfoData["userType"] | "">(
    initialData?.userType ?? ""
  );
  const [formData, setFormData] = useState<BackgroundInfoDetails>(
    initialData?.details ?? { ...EMPTY_FORM_DATA }
  );

  const isValid =
    !!userType &&
    (userType === "professional"
      ? !!formData.jobTitle && !!formData.yearsExperience
      : userType === "student" || userType === "graduate"
        ? !!formData.fieldOfStudy
        : userType === "other"
          ? !!formData.currentStatus
          : false);

  const buildData = (): BackgroundInfoData => ({
    userType: userType as BackgroundInfoData["userType"],
    details: formData,
  });

  return (
    <Card className="w-full shadow-xl border-primary/10">
      <CardHeader className="text-center space-y-2">
        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-2">
          <User className="h-6 w-6 text-primary" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
          {initialData ? "Update Your Background" : "Tell us about yourself"}
        </CardTitle>
        <CardDescription>
          {initialData
            ? "Edit any fields you want to update. Leave others as-is."
            : "This helps our AI tailor career recommendations to your context."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* User Type */}
          <div className="space-y-2">
            <Label htmlFor="userType" className="flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> I am currently a...
            </Label>
            <Select
              onValueChange={(v: any) => setUserType(v)}
              value={userType}
            >
              <SelectTrigger className="h-12 text-lg">
                <SelectValue placeholder="Select your status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="graduate">Recent Graduate</SelectItem>
                <SelectItem value="professional">
                  Working Professional
                </SelectItem>
                <SelectItem value="other">Other / Career Break</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Professional fields */}
          {userType === "professional" && (
            <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Current Job Title</Label>
                <Combobox
                  options={JOB_TITLES}
                  value={formData.jobTitle}
                  onValueChange={(v) =>
                    setFormData({ ...formData, jobTitle: v })
                  }
                  placeholder="Search or type your job title..."
                  searchPlaceholder="Search job titles..."
                  emptyMessage="No matching title found."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearsExp">Years of Experience</Label>
                <Input
                  id="yearsExp"
                  type="number"
                  placeholder="e.g. 5"
                  value={formData.yearsExperience}
                  onChange={(e) =>
                    setFormData({ ...formData, yearsExperience: e.target.value })
                  }
                />
              </div>
            </div>
          )}

          {/* Student/Graduate fields */}
          {(userType === "student" || userType === "graduate") && (
            <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <div className="space-y-2">
                <Label htmlFor="field">Degree / Field of Study</Label>
                <Combobox
                  options={INDIAN_DEGREES}
                  value={formData.fieldOfStudy}
                  onValueChange={(v) =>
                    setFormData({ ...formData, fieldOfStudy: v })
                  }
                  placeholder="Search degrees (e.g. B.Tech, MBA)..."
                  searchPlaceholder="Search degrees..."
                  emptyMessage="No matching degree found."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spec">Specialization (Optional)</Label>
                <Combobox
                  options={SPECIALIZATIONS}
                  value={formData.specialization}
                  onValueChange={(v) =>
                    setFormData({ ...formData, specialization: v })
                  }
                  placeholder="Search specializations..."
                  searchPlaceholder="Search specializations..."
                  emptyMessage="No matching specialization found."
                />
              </div>
            </div>
          )}

          {/* Other fields */}
          {userType === "other" && (
            <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
              <Label htmlFor="status">Current Status</Label>
              <Input
                id="status"
                placeholder="Describe your current situation"
                value={formData.currentStatus}
                onChange={(e) =>
                  setFormData({ ...formData, currentStatus: e.target.value })
                }
              />
            </div>
          )}

          {/* Additional fields - always shown when userType selected */}
          {userType && (
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 border-t pt-6">
              <p className="text-sm font-medium text-muted-foreground">
                Additional Information (helps personalize results)
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <User className="h-3 w-3" /> Age Range
                  </Label>
                  <Select
                    onValueChange={(v) =>
                      setFormData({ ...formData, ageRange: v })
                    }
                    value={formData.ageRange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select age range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="16-18">16-18</SelectItem>
                      <SelectItem value="19-22">19-22</SelectItem>
                      <SelectItem value="23-28">23-28</SelectItem>
                      <SelectItem value="29-35">29-35</SelectItem>
                      <SelectItem value="36-45">36-45</SelectItem>
                      <SelectItem value="46+">46+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <GraduationCap className="h-3 w-3" /> Education Level
                  </Label>
                  <Select
                    onValueChange={(v) =>
                      setFormData({ ...formData, educationLevel: v })
                    }
                    value={formData.educationLevel}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select education level" />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_LEVELS.map((level) => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="h-3 w-3" /> Location Preference
                </Label>
                <Select
                  onValueChange={(v) =>
                    setFormData({ ...formData, locationPreference: v })
                  }
                  value={formData.locationPreference}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Where do you prefer to work?" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">
                      Remote / Work from Home
                    </SelectItem>
                    <SelectItem value="urban">Urban / City-based</SelectItem>
                    <SelectItem value="suburban">Suburban</SelectItem>
                    <SelectItem value="rural">Rural</SelectItem>
                    <SelectItem value="flexible">
                      Flexible / No Preference
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Target className="h-3 w-3" /> Career Goals (Optional)
                </Label>
                <Textarea
                  placeholder="Briefly describe your career goals or what you hope to achieve..."
                  value={formData.careerGoals}
                  onChange={(e) =>
                    setFormData({ ...formData, careerGoals: e.target.value })
                  }
                  className="min-h-[80px] resize-none"
                />
              </div>

              <div className="space-y-2">
                <Label>Have you had career counseling before?</Label>
                <Select
                  onValueChange={(v) =>
                    setFormData({ ...formData, previousCounseling: v })
                  }
                  value={formData.previousCounseling}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">
                      No, this is my first time
                    </SelectItem>
                    <SelectItem value="informal">
                      Yes, informal guidance
                    </SelectItem>
                    <SelectItem value="formal">
                      Yes, professional counseling
                    </SelectItem>
                    <SelectItem value="online">
                      Yes, through online tools/tests
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-2">
            <Button
              onClick={() => onSave(buildData())}
              disabled={!isValid || isSaving}
              className="gap-2"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Save
            </Button>
            {onSaveAndStart && (
              <Button
                variant="default"
                onClick={() => onSaveAndStart(buildData())}
                disabled={!isValid || isSaving}
                className="gap-2 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
                Save & Start Assessment
              </Button>
            )}
            {onCancel && (
              <Button variant="ghost" onClick={onCancel} className="gap-2">
                <X className="h-4 w-4" />
                Cancel
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
