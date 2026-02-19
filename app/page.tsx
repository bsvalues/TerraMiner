import dynamic from "next/dynamic";

const CloudCoachDashboard = dynamic(
  () => import("@/components/cloud-coach-dashboard"),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="relative h-12 w-12">
            <div className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
            <div className="absolute inset-2 animate-pulse rounded-full bg-primary/40" />
            <div className="absolute inset-4 rounded-full bg-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-foreground">
              Initializing Cloud Coach
            </p>
            <p className="text-xs text-muted-foreground">
              Booting agent swarm...
            </p>
          </div>
        </div>
      </div>
    ),
  }
);

export default function Page() {
  return <CloudCoachDashboard />;
}
