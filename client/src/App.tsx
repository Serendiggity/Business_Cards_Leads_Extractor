import {
  ClerkProvider,
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

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
            <UserButton afterSignOutUrl="/"/>
          </SignedIn>
          <SignedOut>
            <SignInButton />
          </SignedOut>
        </header>
        <main>
          <SignedIn>
            <Dashboard />
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
