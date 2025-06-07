import { ApiResponseCard } from "@/components/api-response-card";
import { TechnicalSpecs } from "@/components/technical-specs";
import { ProjectStructure } from "@/components/project-structure";
import { QuickActions } from "@/components/quick-actions";
import { Code, Globe, ArrowUpDown, Plug, Smartphone, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

export default function Home() {
  const features = [
    {
      icon: ArrowUpDown,
      title: "CORS Enabled",
      description: "Cross-origin requests configured for seamless frontend-backend communication",
      gradient: "from-blue-50 to-indigo-50",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      icon: Plug,
      title: "RESTful API",
      description: "Clean API endpoints with JSON responses and proper HTTP methods",
      gradient: "from-emerald-50 to-green-50",
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
    },
    {
      icon: Smartphone,
      title: "Responsive Design",
      description: "Mobile-first approach with adaptive layouts for all device sizes",
      gradient: "from-purple-50 to-pink-50",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-xl flex items-center justify-center">
                <Code className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-slate-800">Flask + React App</h1>
                <p className="text-sm text-slate-500">Fullstack Development</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm">
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-slate-600">Backend</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                  <span className="text-slate-600">Frontend</span>
                </div>
              </div>
              <Link href="/auth">
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <UserPlus className="w-4 h-4" />
                  <span>Login</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6">
            Welcome to Your{" "}
            <span className="bg-gradient-to-r from-blue-600 to-emerald-600 bg-clip-text text-transparent">
              Fullstack Application
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">
            A modern web application built with Flask backend and React frontend, 
            featuring JWT authentication, secure user registration, and real-time API communication.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth">
              <Button size="lg" className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5" />
                <span>Try Authentication</span>
              </Button>
            </Link>
          </div>
        </div>

        {/* API Communication Demo */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <ApiResponseCard />
          <TechnicalSpecs />
        </div>

        {/* Development Features */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-16 animate-slide-up">
          <h3 className="text-2xl font-semibold text-slate-800 mb-8 text-center">Development Features</h3>
          
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className={`text-center p-6 rounded-xl bg-gradient-to-br ${feature.gradient}`}
                >
                  <div className={`w-16 h-16 ${feature.iconBg} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                    <Icon className={`${feature.iconColor} text-xl`} />
                  </div>
                  <h4 className="font-semibold text-slate-800 mb-2">{feature.title}</h4>
                  <p className="text-sm text-slate-600">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Development Status */}
        <div className="grid md:grid-cols-2 gap-8">
          <ProjectStructure />
          <QuickActions />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center space-x-4 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Code className="w-4 h-4 text-white" />
              </div>
              <span className="text-slate-600">Fullstack Development Template</span>
            </div>
            <div className="flex items-center space-x-6 text-sm text-slate-500">
              <span>Flask + React + PostgreSQL</span>
              <span>•</span>
              <span>Ready for Development</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
