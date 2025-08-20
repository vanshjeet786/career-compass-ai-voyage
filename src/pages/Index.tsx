import { useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Target, TrendingUp, Users, ArrowRight, CheckCircle } from "lucide-react";

const Index = () => {
  const { user, loading } = useAuth();

  // SEO: title, description, canonical
  useEffect(() => {
    document.title = "Career Compass - Discover Your Professional Path";
    const metaDesc = "Take our comprehensive 6-layer assessment to discover your career strengths, aptitudes, and ideal professional path with AI-powered insights.";
    let descTag = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!descTag) {
      descTag = document.createElement('meta');
      descTag.name = 'description';
      document.head.appendChild(descTag);
    }
    descTag.content = metaDesc;
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = window.location.origin;
  }, []);

  if (loading) return null;

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            Discover Your Career Compass
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Navigate your professional journey with our comprehensive 6-layer assessment. 
            Uncover your strengths, aptitudes, and ideal career path with AI-powered insights.
          </p>
          
          {user ? (
            <div className="space-y-4">
              <p className="text-lg text-foreground">Welcome back, {user.email}!</p>
              <Button asChild size="lg" className="text-lg px-8 py-4">
                <Link to="/assessment">
                  Continue Assessment <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          ) : (
            <Button asChild size="lg" className="text-lg px-8 py-4">
              <Link to="/auth">
                Start Your Journey <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Career Compass?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Our scientifically-backed assessment combines multiple intelligence theories with AI assistance
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center">
            <CardHeader>
              <Brain className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Multi-Intelligence Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Evaluate across 8+ intelligence types including logical, linguistic, spatial, and interpersonal
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Target className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>6-Layer Deep Dive</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                From core aptitudes to personality traits and career preferences - we cover it all
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <TrendingUp className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>AI-Powered Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Get personalized explanations and career suggestions powered by advanced AI
              </p>
            </CardContent>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-primary mb-4" />
              <CardTitle>Career Counselor Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Ask questions about your results and get personalized career guidance
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Assessment Layers Preview */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">The 6-Layer Assessment</h2>
          <p className="text-lg text-muted-foreground">
            Each layer reveals different aspects of your professional profile
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { layer: 1, title: "Core Aptitudes", desc: "Mathematical, verbal, and logical reasoning" },
            { layer: 2, title: "Cognitive Styles", desc: "How you process and organize information" },
            { layer: 3, title: "Multiple Intelligences", desc: "Your unique intelligence profile" },
            { layer: 4, title: "Personality Traits", desc: "Work style preferences and behaviors" },
            { layer: 5, title: "Interests & Values", desc: "What motivates and energizes you" },
            { layer: 6, title: "Career Exploration", desc: "Open-ended reflection and goals" }
          ].map(({ layer, title, desc }, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                    {layer}
                  </div>
                  <CardTitle className="text-lg">{title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">What You'll Get</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              {[
                "Comprehensive intelligence and aptitude analysis",
                "Visual charts and radar graphs of your strengths",
                "AI-powered career recommendations",
                "Downloadable PDF report of your results",
                "Interactive career counselor chatbot"
              ].map((benefit, i) => (
                <div key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-foreground">{benefit}</p>
                </div>
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Ready to Start?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground mb-4">
                  Join thousands who have discovered their ideal career path through our assessment.
                </p>
                {user ? (
                  <Button asChild className="w-full">
                    <Link to="/assessment">Continue Assessment</Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full">
                    <Link to="/auth">Get Started Free</Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
