import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { queryClient } from './lib/queryClient';
import { Toaster } from "@/components/ui/toaster";

console.log("[APP DEBUG] Main entry point hit. Start time:", new Date().toLocaleTimeString());
if (performance.navigation.type === 1) {
  console.warn("[APP DEBUG] Page was reloaded.");
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ErrorBoundary>
          <TooltipProvider>
            <App />
            <Toaster />
          </TooltipProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
