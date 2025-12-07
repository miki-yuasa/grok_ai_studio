import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-6">
        <button 
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>
        <span className="text-xl font-semibold text-foreground">pearl</span>
        <div className="w-16" />
      </header>

      {/* Content */}
      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-xl text-center animate-fade-in">
          <h1 className="mb-4 text-4xl font-medium tracking-tight text-foreground md:text-5xl">
            Share your <span className="text-muted-foreground">product link</span> to begin your first campaign
          </h1>
          
          <p className="mb-8 text-muted-foreground">
            We support multiple platforms:
          </p>

          <div className="mb-6 flex items-center gap-2 rounded-full border border-border bg-secondary px-5 py-3">
            <input 
              type="text" 
              placeholder="https://www.yourproduct.com/product-link..." 
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm" 
            />
            <button className="text-muted-foreground text-sm hover:text-foreground transition-colors">
              Try some links?
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <Button 
              variant="secondary" 
              size="lg" 
              className="w-full rounded-full"
            >
              Choose existing product
            </Button>
            <Button 
              variant="default" 
              size="lg" 
              className="w-full rounded-full" 
              onClick={() => navigate("/connect")}
            >
              Begin Campaign
            </Button>
          </div>

          <p className="mt-6 text-sm text-muted-foreground">
            You can also <button className="text-foreground hover:underline">add product manually</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Welcome;
