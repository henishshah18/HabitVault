import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RefreshCw, Server, CheckCircle2 } from "lucide-react";
import { apiClient, type HelloResponse } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

export function ApiResponseCard() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: helloData, isLoading, error } = useQuery<HelloResponse>({
    queryKey: ['/api/hello'],
    queryFn: () => apiClient.getHello(),
    refetchInterval: false,
    retry: 1,
  });

  const refreshMutation = useMutation({
    mutationFn: () => apiClient.getHello(),
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/hello'], data);
      toast({
        title: "Message refreshed",
        description: "Successfully fetched new message from Flask backend",
      });
    },
    onError: (error) => {
      toast({
        title: "Refresh failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRefresh = () => {
    refreshMutation.mutate();
  };

  return (
    <Card className="bg-white rounded-2xl shadow-lg border border-slate-200 animate-slide-up">
      <CardContent className="p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-semibold text-slate-800">API Response</h3>
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span className="text-sm text-slate-500">
              {error ? 'Disconnected' : 'Connected'}
            </span>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 mb-6">
          <div className="flex items-center space-x-3 mb-4">
            <Server className="w-5 h-5 text-emerald-600" />
            <span className="font-medium text-slate-700">Flask Backend Response</span>
          </div>
          <div className="bg-white rounded-lg p-4 font-mono text-sm">
            {isLoading ? (
              <div className="text-slate-500 animate-pulse">Loading...</div>
            ) : error ? (
              <div className="text-red-600">
                Error: {error.message}
              </div>
            ) : (
              <div className="text-emerald-600">
                "{helloData?.message || 'Hello from Flask!'}"
              </div>
            )}
          </div>
          
          {helloData && !error && (
            <div className="mt-4 grid grid-cols-2 gap-4 text-xs text-slate-600">
              <div>
                <span className="font-medium">Backend:</span> {helloData.backend}
              </div>
              <div>
                <span className="font-medium">Database:</span> {helloData.database}
              </div>
            </div>
          )}
        </div>

        <Button 
          onClick={handleRefresh}
          disabled={refreshMutation.isPending}
          className="w-full bg-gradient-to-r from-blue-500 to-emerald-500 text-white font-medium py-3 px-6 rounded-xl hover:from-blue-600 hover:to-emerald-600 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {refreshMutation.isPending ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Refresh Message
        </Button>
      </CardContent>
    </Card>
  );
}
