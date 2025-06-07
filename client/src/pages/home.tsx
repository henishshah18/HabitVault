import { useState, useEffect } from 'react';
import { LandingPage } from "@/components/LandingPage";
import { Login } from "@/components/Login";
import { Register } from "@/components/Register";
import { Dashboard } from "@/components/Dashboard";

type AuthView = 'landing' | 'login' | 'register' | 'dashboard';

export default function Home() {
  const [currentView, setCurrentView] = useState<AuthView>('landing');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('authToken');
    if (token) {
      setIsAuthenticated(true);
      setCurrentView('dashboard');
    }
  }, []);

  const handleGetStarted = () => {
    setCurrentView('login');
  };

  const handleLoginSuccess = (token: string, userId: number) => {
    setIsAuthenticated(true);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentView('landing');
  };

  const handleSwitchToRegister = () => {
    setCurrentView('register');
  };

  const handleSwitchToLogin = () => {
    setCurrentView('login');
  };

  const handleBackToHome = () => {
    setCurrentView('landing');
  };

  if (isAuthenticated && currentView === 'dashboard') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Dashboard onLogout={handleLogout} />
      </div>
    );
  }

  if (currentView === 'landing') {
    return <LandingPage onGetStarted={handleGetStarted} />;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      {currentView === 'login' ? (
        <Login 
          onSwitchToRegister={handleSwitchToRegister}
          onLoginSuccess={handleLoginSuccess}
          onBackToHome={handleBackToHome}
        />
      ) : (
        <Register 
          onSwitchToLogin={handleSwitchToLogin}
          onBackToHome={handleBackToHome}
        />
      )}
    </div>
  );
}
