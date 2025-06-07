import { Card, CardContent } from "@/components/ui/card";
import { Folder, FileText, FileCode } from "lucide-react";

export function ProjectStructure() {
  const structureItems = [
    { type: 'folder', name: 'backend/', level: 0, icon: Folder, color: 'text-amber-500' },
    { type: 'file', name: 'app.py', level: 1, icon: FileCode, color: 'text-emerald-500' },
    { type: 'file', name: 'models.py', level: 1, icon: FileCode, color: 'text-emerald-500' },
    { type: 'file', name: 'config.py', level: 1, icon: FileCode, color: 'text-emerald-500' },
    { type: 'folder', name: 'frontend/', level: 0, icon: Folder, color: 'text-amber-500' },
    { type: 'folder', name: 'public/', level: 1, icon: Folder, color: 'text-amber-500' },
    { type: 'file', name: 'index.html', level: 2, icon: FileCode, color: 'text-blue-500' },
    { type: 'folder', name: 'src/', level: 1, icon: Folder, color: 'text-amber-500' },
    { type: 'file', name: 'App.tsx', level: 2, icon: FileCode, color: 'text-blue-500' },
    { type: 'file', name: 'main.tsx', level: 2, icon: FileCode, color: 'text-blue-500' },
    { type: 'file', name: 'requirements.txt', level: 0, icon: FileText, color: 'text-slate-500' },
  ];

  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 animate-slide-up">
      <CardContent className="p-8">
        <h3 className="text-xl font-semibold text-slate-800 mb-6">Project Structure</h3>
        <div className="font-mono text-sm space-y-2">
          {structureItems.map((item, index) => {
            const Icon = item.icon;
            const marginLeft = item.level * 16;
            
            return (
              <div 
                key={index}
                className="flex items-center space-x-2"
                style={{ marginLeft: `${marginLeft}px` }}
              >
                <Icon className={`w-4 h-4 ${item.color}`} />
                <span className={item.type === 'folder' ? 'text-slate-700 font-medium' : 'text-slate-600'}>
                  {item.name}
                </span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
