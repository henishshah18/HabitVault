import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Server, Globe } from "lucide-react";
import { apiClient, type StatusResponse } from "@/lib/api";

export function TechnicalSpecs() {
  const { data: statusData, isLoading, error } = useQuery<StatusResponse>({
    queryKey: ['/api/status'],
    queryFn: () => apiClient.getStatus(),
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
  });

  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 animate-slide-up">
      <CardContent className="p-8">
        <h3 className="text-2xl font-semibold text-slate-800 mb-6">Technical Stack</h3>
        
        <div className="space-y-4">
          {/* Flask Backend */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Server className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-medium text-slate-800">Flask Backend</h4>
                <p className="text-sm text-slate-500">
                  Port {statusData?.backend.port || 5000}
                </p>
              </div>
            </div>
            <Badge 
              variant={statusData?.backend.status === 'running' ? 'default' : 'secondary'}
              className={statusData?.backend.status === 'running' ? 'bg-emerald-600' : ''}
            >
              {isLoading ? 'Checking...' : statusData?.backend.status || 'Unknown'}
            </Badge>
          </div>

          {/* React Frontend */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Globe className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium text-slate-800">React Frontend</h4>
                <p className="text-sm text-slate-500">Port 5000 (Production)</p>
              </div>
            </div>
            <Badge variant="default" className="bg-blue-600">
              Active
            </Badge>
          </div>

          {/* Database */}
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center">
                <Database className="w-5 h-5 text-slate-600" />
              </div>
              <div>
                <h4 className="font-medium text-slate-800">
                  {statusData?.database.orm || 'SQLAlchemy'} + {statusData?.database.type || 'PostgreSQL'}
                </h4>
                <p className="text-sm text-slate-500">Database Layer</p>
              </div>
            </div>
            <Badge 
              variant={statusData?.database.status === 'connected' ? 'default' : 'destructive'}
              className={statusData?.database.status === 'connected' ? 'bg-slate-600' : ''}
            >
              {isLoading ? 'Checking...' : statusData?.database.status || 'Unknown'}
            </Badge>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">
              Failed to fetch status: {error.message}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
