import { useEffect, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { ToastProvider } from './components/Toast';
import { DialogProvider } from './components/CustomDialogContext';
import { lazyWithRetry } from './utils/lazyWithRetry';
import { OrbiBootSplash, PwaExperience } from './components/PwaExperience';

const ClientApp = lazyWithRetry(() => import('./pages/ClientApp/index.tsx'));
const AdminApp = lazyWithRetry(() => import('./pages/AdminApp/index.tsx'));
const WakalaApp = lazyWithRetry(() => import('./pages/WakalaApp/index.tsx'));

export default function App() {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on route change
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <ToastProvider>
      <DialogProvider>
        <div className="relative min-h-screen">
          <PwaExperience />
          <Suspense fallback={<OrbiBootSplash />}>
            <Routes>
              {/* Seller Routes: separated from admin URLs for clean merchant indexing and sharing */}
              <Route path="/sellers" element={<AdminApp />} />
              <Route path="/sellers/login" element={<AdminApp />} />
              <Route path="/sellers/signup" element={<AdminApp />} />
              <Route path="/sellers/dashboard" element={<AdminApp />} />
              
              {/* Wakala Routes */}
              <Route path="/wakalas/*" element={<WakalaApp />} />
              <Route path="/wakalas" element={<WakalaApp />} />

              {/* Admin Routes */}
              <Route path="/admin/*" element={<AdminApp />} />
              
              {/* Client Routes (Catch-all to prevent remounting across paths) */}
              <Route path="*" element={<ClientApp />} />
            </Routes>
          </Suspense>
        </div>
      </DialogProvider>
    </ToastProvider>
  );
}
