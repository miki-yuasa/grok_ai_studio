import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Lock, Check, Star, ArrowLeft } from "lucide-react";
const ConnectX = () => {
  const navigate = useNavigate();
  return <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <button onClick={() => navigate("/welcome")} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-xl font-semibold text-foreground">studio</span>
        <div className="w-16" />
      </header>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-md text-center animate-fade-in">
          {/* Icons connection visual */}
          <div className="mb-8 flex items-center justify-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-secondary">
              <span className="text-2xl font-bold text-foreground">𝕏</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-0.5 w-2 rounded-full bg-border" />
              <div className="h-0.5 w-2 rounded-full bg-border" />
              <div className="h-0.5 w-2 rounded-full bg-border" />
              <div className="h-0.5 w-2 rounded-full bg-border" />
            </div>
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-secondary">
              <span className="text-xl font-semibold text-foreground">p</span>
            </div>
          </div>

          <h1 className="mb-3 text-2xl font-medium text-foreground">
            Connect an X AI account to unlock your first creative insights
          </h1>
          
          <p className="mb-8 text-muted-foreground">
            Instantly see your winning creatives — and identify what's working and why
          </p>

          <div className="flex flex-col gap-3">
            <Button variant="default" size="lg" className="w-full rounded-full" onClick={() => navigate("/dashboard")}>
              Connect to X
            </Button>
            <Button variant="outline" size="lg" className="w-full rounded-full" onClick={() => navigate("/dashboard")}>
              No insights for now
            </Button>
          </div>

          {/* Trust badges */}
          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Lock className="h-4 w-4" />
              <span>Secure</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>We won't edit or post ads</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              <span>Trusted by 1000+ brands</span>
            </div>
          </div>
        </div>
      </div>
    </div>;
};
export default ConnectX;