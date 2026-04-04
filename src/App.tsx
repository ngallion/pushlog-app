import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { BottomNav } from "./components/BottomNav";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { Today } from "./pages/Today";
import { ProgramEditor } from "./pages/ProgramEditor";
import { History } from "./pages/History";
import { Settings } from "./pages/Settings";

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-zinc-900 text-zinc-100">
            <Routes>
              <Route path="/" element={<Today />} />
              <Route path="/program" element={<ProgramEditor />} />
              <Route path="/history" element={<History />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
            <BottomNav />
            <PWAInstallPrompt />
          </div>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
