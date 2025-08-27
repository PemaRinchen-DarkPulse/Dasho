import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench } from "lucide-react";

const Maintenance = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-12">
        <Card className="max-w-2xl mx-auto shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Wrench className="w-5 h-5 mr-2 text-primary" />
              Maintenance
            </CardTitle>
            <CardDescription>Track and manage equipment maintenance tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">This is a placeholder page. We can add maintenance logs and schedules here.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Maintenance;
