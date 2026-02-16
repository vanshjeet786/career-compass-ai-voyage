import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, User, GraduationCap, MapPin, Target } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const BackgroundInfo = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [userType, setUserType] = useState<"student" | "professional" | "graduate" | "other" | "">("");

  const [formData, setFormData] = useState({
    jobTitle: "",
    yearsExperience: "",
    fieldOfStudy: "",
    specialization: "",
    currentStatus: "",
    ageRange: "",
    educationLevel: "",
    locationPreference: "",
    careerGoals: "",
    previousCounseling: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from("assessments")
        .insert({
          user_id: user.id,
          status: "in_progress",
          current_layer: 1,
          started_at: new Date().toISOString(),
          background_info: {
            userType,
            details: formData
          }
        } as any)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your background information has been saved.",
      });

      navigate(`/assessment?id=${data.id}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-xl border-primary/10">
        <CardHeader className="text-center space-y-2">
          <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Tell us about yourself
          </CardTitle>
          <CardDescription className="text-lg">
            This helps our AI tailor the career recommendations specifically to your context.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* User Type */}
            <div className="space-y-2">
              <Label htmlFor="userType" className="flex items-center gap-2">
                <User className="h-4 w-4 text-primary" /> I am currently a...
              </Label>
              <Select onValueChange={(v: any) => setUserType(v)} value={userType}>
                <SelectTrigger className="h-12 text-lg">
                  <SelectValue placeholder="Select your status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="graduate">Recent Graduate</SelectItem>
                  <SelectItem value="professional">Working Professional</SelectItem>
                  <SelectItem value="other">Other / Career Break</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Conditional fields based on user type */}
            {userType === "professional" && (
              <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Current Job Title</Label>
                  <Input id="jobTitle" placeholder="e.g. Software Engineer" value={formData.jobTitle} onChange={(e) => setFormData({...formData, jobTitle: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsExp">Years of Experience</Label>
                  <Input id="yearsExp" type="number" placeholder="e.g. 5" value={formData.yearsExperience} onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})} />
                </div>
              </div>
            )}

            {(userType === "student" || userType === "graduate") && (
              <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="field">Field of Study</Label>
                  <Input id="field" placeholder="e.g. Computer Science" value={formData.fieldOfStudy} onChange={(e) => setFormData({...formData, fieldOfStudy: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spec">Specialization (Optional)</Label>
                  <Input id="spec" placeholder="e.g. AI / Data Science" value={formData.specialization} onChange={(e) => setFormData({...formData, specialization: e.target.value})} />
                </div>
              </div>
            )}

            {userType === "other" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <Label htmlFor="status">Current Status</Label>
                <Input id="status" placeholder="Describe your current situation" value={formData.currentStatus} onChange={(e) => setFormData({...formData, currentStatus: e.target.value})} />
              </div>
            )}

            {/* Additional fields shown for all user types once selected */}
            {userType && (
              <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300 border-t pt-6">
                <p className="text-sm font-medium text-muted-foreground">Additional Information (helps personalize results)</p>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="ageRange" className="flex items-center gap-2">
                      <User className="h-3 w-3" /> Age Range
                    </Label>
                    <Select onValueChange={(v) => setFormData({...formData, ageRange: v})} value={formData.ageRange}>
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
                    <Label htmlFor="educationLevel" className="flex items-center gap-2">
                      <GraduationCap className="h-3 w-3" /> Education Level
                    </Label>
                    <Select onValueChange={(v) => setFormData({...formData, educationLevel: v})} value={formData.educationLevel}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="high-school">High School</SelectItem>
                        <SelectItem value="diploma">Diploma / Certificate</SelectItem>
                        <SelectItem value="bachelors">Bachelor's Degree</SelectItem>
                        <SelectItem value="masters">Master's Degree</SelectItem>
                        <SelectItem value="phd">PhD / Doctorate</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="locationPref" className="flex items-center gap-2">
                    <MapPin className="h-3 w-3" /> Location Preference
                  </Label>
                  <Select onValueChange={(v) => setFormData({...formData, locationPreference: v})} value={formData.locationPreference}>
                    <SelectTrigger>
                      <SelectValue placeholder="Where do you prefer to work?" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote / Work from Home</SelectItem>
                      <SelectItem value="urban">Urban / City-based</SelectItem>
                      <SelectItem value="suburban">Suburban</SelectItem>
                      <SelectItem value="rural">Rural</SelectItem>
                      <SelectItem value="flexible">Flexible / No Preference</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="careerGoals" className="flex items-center gap-2">
                    <Target className="h-3 w-3" /> Career Goals (Optional)
                  </Label>
                  <Textarea
                    id="careerGoals"
                    placeholder="Briefly describe your career goals or what you hope to achieve..."
                    value={formData.careerGoals}
                    onChange={(e) => setFormData({...formData, careerGoals: e.target.value})}
                    className="min-h-[80px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="previousCounseling">Have you had career counseling before?</Label>
                  <Select onValueChange={(v) => setFormData({...formData, previousCounseling: v})} value={formData.previousCounseling}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No, this is my first time</SelectItem>
                      <SelectItem value="informal">Yes, informal guidance</SelectItem>
                      <SelectItem value="formal">Yes, professional counseling</SelectItem>
                      <SelectItem value="online">Yes, through online tools/tests</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 transition-all"
              disabled={
                !userType ||
                loading ||
                (userType === 'professional' && (!formData.jobTitle || !formData.yearsExperience)) ||
                ((userType === 'student' || userType === 'graduate') && !formData.fieldOfStudy) ||
                (userType === 'other' && !formData.currentStatus)
              }
            >
              {loading ? (
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              ) : (
                <>
                  Start Assessment <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default BackgroundInfo;
