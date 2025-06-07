import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Terminal, Database, Settings, ArrowRight, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function QuickActions() {
  const { toast } = useToast();

  const actions = [
    {
      icon: Terminal,
      title: "View API Documentation",
      description: "Explore available endpoints and responses",
      onClick: () => {
        toast({
          title: "API Documentation",
          description: "Available endpoints: /api/hello, /api/status, /api/users",
        });
      },
    },
    {
      icon: Database,
      title: "Database Console",
      description: "View database status and connections",
      onClick: () => {
        toast({
          title: "Database Console",
          description: "PostgreSQL database with SQLAlchemy ORM is active",
        });
      },
    },
    {
      icon: Settings,
      title: "Development Settings",
      description: "Configure CORS, debug mode, and more",
      onClick: () => {
        toast({
          title: "Development Settings",
          description: "CORS enabled, Debug mode active, Hot reload configured",
        });
      },
    },
  ];

  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 animate-slide-up">
      <CardContent className="p-8">
        <h3 className="text-xl font-semibold text-slate-800 mb-6">Quick Actions</h3>
        <div className="space-y-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="ghost"
                onClick={action.onClick}
                className="w-full flex items-center justify-between p-4 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors duration-200 group h-auto"
              >
                <div className="flex items-center space-x-3 text-left">
                  <Icon className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
                  <div>
                    <div className="font-medium text-slate-700 group-hover:text-slate-900">
                      {action.title}
                    </div>
                    <div className="text-sm text-slate-500">
                      {action.description}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
