import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from '@clerk/clerk-react';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Dashboard from '@/pages/dashboard';
import NotFound from '@/pages/not-found';
import { Router, Route } from 'wouter';
import EventsPage from '@/pages/events';
import EventDetailPage from '@/pages/event-detail';
import ScanPage from '@/pages/scan';
import ContactsPage from '@/pages/contacts';
import EmailsPage from '@/pages/emails';

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <header className="header">
          <div>
            <h1>Business Cards Leads Extractor</h1>
          </div>
          <SignedIn>
            <UserButton afterSignOutUrl="/" />
          </SignedIn>
          <SignedOut>
            <SignInButton />
          </SignedOut>
        </header>
        <main>
          <SignedIn>
            <Router>
              <Route path="/" component={Dashboard} />
              <Route path="/dashboard" component={Dashboard} />
              <Route path="/events" component={EventsPage} />
              <Route path="/events/:id" component={EventDetailPage} />
              <Route path="/scan" component={ScanPage} />
              <Route path="/contacts" component={ContactsPage} />
              <Route path="/emails" component={EmailsPage} />
              <Route component={NotFound} />
            </Router>
          </SignedIn>
          <SignedOut>
            <div className="flex items-center justify-center h-full">
              <h2 className="text-2xl">Please sign in to continue</h2>
            </div>
          </SignedOut>
        </main>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
