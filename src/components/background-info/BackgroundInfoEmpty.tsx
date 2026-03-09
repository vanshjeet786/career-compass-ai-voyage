import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus } from "lucide-react";

interface BackgroundInfoEmptyProps {
  onAdd: () => void;
}

export const BackgroundInfoEmpty = ({ onAdd }: BackgroundInfoEmptyProps) => {
  return (
    <Card className="border-dashed border-2 border-muted-foreground/20">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
          <UserPlus className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          No background info saved yet
        </h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6">
          Add your background information to help our AI tailor career
          recommendations specifically to your context.
        </p>
        <Button onClick={onAdd} size="lg">
          <UserPlus className="h-4 w-4 mr-2" />
          Add Background Info
        </Button>
      </CardContent>
    </Card>
  );
};
