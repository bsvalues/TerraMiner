"use client";

import { useState, useEffect, createContext, useContext, type ReactNode } from "react";
import { X, ChevronRight, ChevronLeft, Sparkles, Home, BarChart3, Users, Settings, Scale } from "lucide-react";
import { cn } from "@/lib/utils";

interface TourStep {
  id: string;
  title: string;
  description: string;
  icon: ReactNode;
  highlightSelector?: string;
  position?: "center" | "top" | "bottom" | "left" | "right";
}

const TOUR_STEPS: TourStep[] = [
  {
    id: "welcome",
    title: "Welcome to TerraFusion",
    description: "Your IAAO-compliant mass appraisal intelligence platform for Benton County. Let's take a quick tour of the key features.",
    icon: <Sparkles className="h-6 w-6" />,
    position: "center",
  },
  {
    id: "dashboard",
    title: "Mission Control Dashboard",
    description: "Monitor system health, IAAO compliance metrics, agent activity, and real-time assessment statistics all in one place.",
    icon: <Home className="h-6 w-6" />,
    highlightSelector: "[href='/']",
    position: "right",
  },
  {
    id: "properties",
    title: "Property Explorer",
    description: "Search, filter, and analyze properties. Use quick filters for assessment queries, batch selection for review, and compare up to 5 properties side by side.",
    icon: <Home className="h-6 w-6" />,
    highlightSelector: "[href='/properties']",
    position: "right",
  },
  {
    id: "assessment",
    title: "Assessment Ratio Study",
    description: "View IAAO-compliant ratio studies with COD, PRD, and PRB metrics. Analyze neighborhood equity and identify assessment outliers.",
    icon: <Scale className="h-6 w-6" />,
    highlightSelector: "[href='/assessment']",
    position: "right",
  },
  {
    id: "analytics",
    title: "Analytics & Insights",
    description: "Interactive charts showing market trends, price distributions, and assessment patterns across Kennewick, Richland, and Pasco.",
    icon: <BarChart3 className="h-6 w-6" />,
    highlightSelector: "[href='/analytics']",
    position: "right",
  },
  {
    id: "agents",
    title: "AI Agent Swarm",
    description: "Monitor and manage AI agents that handle data ingestion, valuation analysis, and compliance checking. View agent performance and task history.",
    icon: <Users className="h-6 w-6" />,
    highlightSelector: "[href='/agents']",
    position: "right",
  },
  {
    id: "settings",
    title: "System Settings",
    description: "Configure your profile, notification preferences, and system settings. Access admin controls and data source management.",
    icon: <Settings className="h-6 w-6" />,
    highlightSelector: "[href='/settings']",
    position: "right",
  },
  {
    id: "keyboard",
    title: "Keyboard Shortcuts",
    description: "Press ? at any time to see all available keyboard shortcuts. Use Cmd+K for quick command palette access.",
    icon: <Sparkles className="h-6 w-6" />,
    position: "center",
  },
];

interface TourContextValue {
  startTour: () => void;
  isActive: boolean;
}

const TourContext = createContext<TourContextValue | null>(null);

export function useTour() {
  const context = useContext(TourContext);
  if (!context) {
    throw new Error("useTour must be used within FeatureTourProvider");
  }
  return context;
}

export function FeatureTourProvider({ children }: { children: ReactNode }) {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(true); // Start as true to prevent flash

  // Check if user has seen the tour
  useEffect(() => {
    const seen = localStorage.getItem("terra-tour-completed");
    if (!seen) {
      setHasSeenTour(false);
      // Auto-start tour for new users after a delay
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const startTour = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  const completeTour = () => {
    setIsActive(false);
    setHasSeenTour(true);
    localStorage.setItem("terra-tour-completed", "true");
  };

  const nextStep = () => {
    if (currentStep < TOUR_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skipTour = () => {
    completeTour();
  };

  const step = TOUR_STEPS[currentStep];
  const isLastStep = currentStep === TOUR_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <TourContext.Provider value={{ startTour, isActive }}>
      {children}

      {/* Tour Overlay */}
      {isActive && (
        <div className="fixed inset-0 z-[100]">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-background/90 backdrop-blur-sm" />

          {/* Tour Card */}
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl animate-in fade-in-0 zoom-in-95">
              {/* Close button */}
              <button
                onClick={skipTour}
                className="absolute right-4 top-4 rounded-md p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                aria-label="Skip tour"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Progress indicator */}
              <div className="mb-4 flex gap-1">
                {TOUR_STEPS.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors",
                      index === currentStep
                        ? "bg-primary"
                        : index < currentStep
                        ? "bg-primary/50"
                        : "bg-border"
                    )}
                  />
                ))}
              </div>

              {/* Icon */}
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                {step.icon}
              </div>

              {/* Content */}
              <div className="text-center">
                <h2 className="text-xl font-semibold text-foreground">
                  {step.title}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>

              {/* Step counter */}
              <p className="mt-4 text-center text-xs text-muted-foreground">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </p>

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between gap-3">
                <button
                  onClick={skipTour}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  Skip tour
                </button>

                <div className="flex gap-2">
                  {!isFirstStep && (
                    <button
                      onClick={prevStep}
                      className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Back
                    </button>
                  )}
                  <button
                    onClick={nextStep}
                    className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
                  >
                    {isLastStep ? (
                      "Get Started"
                    ) : (
                      <>
                        Next
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </TourContext.Provider>
  );
}

// Optional: Tour trigger button for Settings page
export function TourTriggerButton() {
  const { startTour } = useTour();

  return (
    <button
      onClick={startTour}
      className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
    >
      <Sparkles className="h-4 w-4 text-primary" />
      Replay Feature Tour
    </button>
  );
}
