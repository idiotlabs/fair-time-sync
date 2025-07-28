import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { I18nProvider } from "@/contexts/I18nContext";
import Landing from "./pages/Landing";
import Demo from "./pages/Demo";
import PreviewCard from "./pages/PreviewCard";
import Health from "./pages/Health";
import HealthI18n from "./pages/HealthI18n";
import DebugMeta from "./pages/DebugMeta";
import E2ETest from "./pages/E2ETest";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import TeamDetail from "./pages/TeamDetail";
import Settings from "./pages/Settings";
import ShareView from "./pages/ShareView";
import NotFound from "./pages/NotFound";
import LanguageBanner from "./components/LanguageBanner";

const queryClient = new QueryClient();

// Component to handle route-based locale detection
const RouteHandler = () => {
  const location = useLocation();
  const pathname = location.pathname;
  
  // Determine locale from URL
  const isKoreanRoute = pathname.startsWith('/ko');
  const locale = isKoreanRoute ? 'ko' : 'en';
  
  // Remove /ko prefix for route matching
  const cleanPath = isKoreanRoute ? pathname.slice(3) || '/' : pathname;
  
  return (
    <I18nProvider initialLocale={locale}>
      <LanguageBanner />
      <Routes>
        {/* Main routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/demo" element={<Demo />} />
        <Route path="/debug/preview-card" element={<PreviewCard />} />
        <Route path="/debug/meta" element={<DebugMeta />} />
        <Route path="/debug/e2e" element={<E2ETest />} />
        <Route path="/health" element={<Health />} />
        <Route path="/health-i18n" element={<HealthI18n />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/app" element={<Dashboard />} />
        <Route path="/app/teams/:slug" element={<TeamDetail />} />
        <Route path="/app/settings" element={<Settings />} />
        <Route path="/s/:token" element={<ShareView />} />
        
        {/* Korean routes */}
        <Route path="/ko" element={<Landing />} />
        <Route path="/ko/demo" element={<Demo />} />
        <Route path="/ko/debug/preview-card" element={<PreviewCard />} />
        <Route path="/ko/debug/meta" element={<DebugMeta />} />
        <Route path="/ko/debug/e2e" element={<E2ETest />} />
        <Route path="/ko/health" element={<Health />} />
        <Route path="/ko/health-i18n" element={<HealthI18n />} />
        <Route path="/ko/auth" element={<Auth />} />
        <Route path="/ko/app" element={<Dashboard />} />
        <Route path="/ko/app/teams/:slug" element={<TeamDetail />} />
        <Route path="/ko/app/settings" element={<Settings />} />
        
        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </I18nProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <RouteHandler />
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
