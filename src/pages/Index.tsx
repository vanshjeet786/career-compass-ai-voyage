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
          <h1 className="text-5xl md:text-7xl font-display font-black mb-6 text-foreground animate-fade-up">
            Navigate Your <span className="text-primary">Perfect</span> Career Path
          </h1>
          <p className="text-xl font-manrope text-muted-foreground mb-8 max-w-2xl mx-auto animate-fade-up animation-delay-200">
            Find your professional north star with Career Compass. Our scientifically-backed 6-layer assessment 
            reveals your unique strengths and guides you to careers where you'll truly thrive.
          </p>
          
          {user ? (
            <div className="space-y-4">
              <p className="text-lg text-foreground">Welcome back, {user.email}!</p>
              <Button asChild size="lg" className="font-montserrat font-bold text-2xl tracking-wider text-primary-foreground relative overflow-hidden group transition-all duration-300 shadow-lg shadow-primary/50 hover:shadow-primary/80 dark:shadow-primary/30 dark:hover:shadow-primary/50 rounded-full px-12 py-8 bg-[length:200%_200%] bg-gradient-to-r from-primary via-accent to-destructive animate-gradient-cycle hover:scale-105 hover:-translate-y-1 transform">
                <Link to="/assessment">
                  <span className="relative z-10 animate-text-glow">
                    Continue Your Journey <ArrowRight className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform duration-200" />
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
                </Link>
              </Button>
            </div>
          ) : (
            <Button asChild size="lg" className="font-montserrat font-bold text-2xl tracking-wider text-primary-foreground relative overflow-hidden group transition-all duration-300 shadow-lg shadow-primary/50 hover:shadow-primary/80 dark:shadow-primary/30 dark:hover:shadow-primary/50 rounded-full px-12 py-8 bg-[length:200%_200%] bg-gradient-to-r from-primary via-accent to-destructive animate-gradient-cycle hover:scale-105 hover:-translate-y-1 transform">
              <Link to="/auth">
                <span className="relative z-10 animate-text-glow">
                  Start Your Journey <ArrowRight className="ml-2 h-5 w-5 inline-block group-hover:translate-x-1 transition-transform duration-200" />
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-shimmer" />
              </Link>
            </Button>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-poppins font-bold mb-4">Why Choose Career Compass?</h2>
          <p className="text-lg font-manrope text-muted-foreground max-w-2xl mx-auto">
            Our scientifically-backed assessment combines multiple intelligence theories with AI assistance
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="text-center group hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary bg-gradient-to-br from-card to-muted/30">
            <CardHeader>
              <Brain className="h-12 w-12 mx-auto text-primary mb-4 group-hover:text-primary/80 transition-colors duration-200" />
              <CardTitle className="font-poppins group-hover:text-primary transition-colors duration-200">Multi-Intelligence Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-manrope text-muted-foreground">
                Evaluate across 8+ intelligence types including logical, linguistic, spatial, and interpersonal
              </p>
            </CardContent>
          </Card>

          <Card className="text-center group hover:shadow-lg transition-all duration-200 border-l-4 border-l-secondary bg-gradient-to-br from-card to-muted/30">
            <CardHeader>
              <Target className="h-12 w-12 mx-auto text-secondary mb-4 group-hover:text-secondary/80 transition-colors duration-200" />
              <CardTitle className="font-poppins group-hover:text-secondary transition-colors duration-200">6-Layer Deep Dive</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-manrope text-muted-foreground">
                From core aptitudes to personality traits and career preferences - we cover it all
              </p>
            </CardContent>
          </Card>

          <Card className="text-center group hover:shadow-lg transition-all duration-200 border-l-4 border-l-accent bg-gradient-to-br from-card to-muted/30">
            <CardHeader>
              <TrendingUp className="h-12 w-12 mx-auto text-accent mb-4 group-hover:text-accent/80 transition-colors duration-200" />
              <CardTitle className="font-poppins group-hover:text-accent transition-colors duration-200">AI-Powered Insights</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-manrope text-muted-foreground">
                Get personalized explanations and career suggestions powered by advanced AI
              </p>
            </CardContent>
          </Card>

          <Card className="text-center group hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary bg-gradient-to-br from-card to-muted/30">
            <CardHeader>
              <Users className="h-12 w-12 mx-auto text-primary mb-4 group-hover:text-primary/80 transition-colors duration-200" />
              <CardTitle className="font-poppins group-hover:text-primary transition-colors duration-200">Career Counselor Chat</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-manrope text-muted-foreground">
                Ask questions about your results and get personalized career guidance
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Assessment Layers Preview */}
      <section className="container mx-auto px-4 py-16 bg-muted/30">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-poppins font-bold mb-4">The 6-Layer Assessment</h2>
          <p className="text-lg font-manrope text-muted-foreground">
            Each layer reveals different aspects of your professional profile
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {[
            { layer: 1, title: "Core Aptitudes", desc: "Mathematical, verbal, and logical reasoning", color: "primary" },
            { layer: 2, title: "Cognitive Styles", desc: "How you process and organize information", color: "secondary" },
            { layer: 3, title: "Multiple Intelligences", desc: "Your unique intelligence profile", color: "accent" },
            { layer: 4, title: "Personality Traits", desc: "Work style preferences and behaviors", color: "primary" },
            { layer: 5, title: "Interests & Values", desc: "What motivates and energizes you", color: "secondary" },
            { layer: 6, title: "Career Exploration", desc: "Open-ended reflection and goals", color: "accent" }
          ].map(({ layer, title, desc, color }, i) => (
            <Card key={i} className="group hover:shadow-lg transition-all duration-200 bg-card">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`h-8 w-8 rounded-full bg-${color} text-${color}-foreground flex items-center justify-center text-sm font-bold group-hover:bg-${color}/80 transition-colors duration-200 shadow-lg`}>
                    {layer}
                  </div>
                  <CardTitle className={`text-lg font-poppins group-hover:text-${color} transition-colors duration-200`}>{title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm font-manrope text-muted-foreground">{desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-poppins font-bold mb-4">What You'll Get</h2>
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
                  <p className="font-manrope text-foreground">{benefit}</p>
                </div>
              ))}
            </div>

            <Card className="bg-gradient-to-br from-card to-muted/30">
              <CardHeader>
                <CardTitle className="font-poppins">Ready to Start?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-manrope text-muted-foreground mb-4">
                  Join thousands who have discovered their ideal career path through our assessment.
                </p>
                {user ? (
                  <Button asChild className="w-full font-montserrat font-bold">
                    <Link to="/assessment">Continue Assessment</Link>
                  </Button>
                ) : (
                  <Button asChild className="w-full font-montserrat font-bold">
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
