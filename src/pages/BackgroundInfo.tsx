
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight } from "lucide-react";
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
    currentStatus: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      // 1. Create a new assessment record immediately with background info
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
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Profile Updated",
        description: "Your background information has been saved.",
      });

      // 2. Navigate to Assessment page with the new assessment ID
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
            <span className="text-2xl">👤</span>
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
            <div className="space-y-2">
              <Label htmlFor="userType">I am currently a...</Label>
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

            {userType === "professional" && (
              <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">Current Job Title</Label>
                  <Input
                    id="jobTitle"
                    placeholder="e.g. Software Engineer"
                    value={formData.jobTitle}
                    onChange={(e) => setFormData({...formData, jobTitle: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="yearsExp">Years of Experience</Label>
                  <Input
                    id="yearsExp"
                    type="number"
                    placeholder="e.g. 5"
                    value={formData.yearsExperience}
                    onChange={(e) => setFormData({...formData, yearsExperience: e.target.value})}
                  />
                </div>
              </div>
            )}

            {(userType === "student" || userType === "graduate") && (
              <div className="grid gap-4 md:grid-cols-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <div className="space-y-2">
                  <Label htmlFor="field">Field of Study</Label>
                  <Input
                    id="field"
                    placeholder="e.g. Computer Science"
                    value={formData.fieldOfStudy}
                    onChange={(e) => setFormData({...formData, fieldOfStudy: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spec">Specialization (Optional)</Label>
                  <Input
                    id="spec"
                    placeholder="e.g. AI / Data Science"
                    value={formData.specialization}
                    onChange={(e) => setFormData({...formData, specialization: e.target.value})}
                  />
                </div>
              </div>
            )}

            {userType === "other" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-4 duration-300">
                <Label htmlFor="status">Current Status</Label>
                <Input
                  id="status"
                  placeholder="Describe your current situation"
                  value={formData.currentStatus}
                  onChange={(e) => setFormData({...formData, currentStatus: e.target.value})}
                />
              </div>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-lg font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700 transition-all"
              disabled={!userType || loading}
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
