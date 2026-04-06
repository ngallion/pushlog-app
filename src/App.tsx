import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { PebbsProvider } from "./context/PebbsContext";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { BottomNav } from "./components/BottomNav";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";
import { Today } from "./pages/Today";
import { ProgramEditor } from "./pages/ProgramEditor";
import { History } from "./pages/History";
import { Options } from "./pages/Options.tsx";

export default function App() {
  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <PebbsProvider>
            <div className="min-h-screen bg-zinc-900 text-zinc-100">
              <Routes>
                <Route path="/" element={<Today />} />
                <Route path="/program" element={<ProgramEditor />} />
                <Route path="/history" element={<History />} />
                <Route path="/options" element={<Options />} />
              </Routes>
              <BottomNav />
              <PWAInstallPrompt />
            </div>
          </PebbsProvider>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
