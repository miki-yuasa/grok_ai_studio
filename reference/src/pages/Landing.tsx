import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import heroBg from "@/assets/hero-bg.gif";
const Landing = () => {
  const navigate = useNavigate();
  return <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="flex items-center justify-between px-8 py-6 my-0">
        <span className="text-xl font-semibold text-foreground">​studio
      </span>
        <nav className="flex items-center gap-8">
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Work
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            About
          </a>
          <a href="#" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </a>
        </nav>
        <Button variant="default" size="sm" className="rounded-full" onClick={() => navigate("/welcome")}>
          Get Started
        </Button>
      </header>

      {/* Hero Section */}
      <main className="px-8 pb-px py-0 my-0">
        <div className="relative mx-auto overflow-hidden rounded-3xl bg-muted">
          <div style={{
          backgroundImage: `url(${heroBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }} className="relative flex min-h-[70vh] flex-col items-center justify-center px-8 py-16 opacity-75">
            <p className="mb-2 text-sm text-foreground/70">Introducing Studio</p>
            <h1 className="mb-8 text-4xl font-medium text-foreground md:text-5xl lg:text-6xl">
              The future of marketing.
            </h1>
            
            <div className="gap-4 items-end justify-center flex flex-row">
              <Button variant="outline" className="rounded-full border-foreground/20 bg-foreground/10 text-foreground hover:bg-foreground/20">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="outline" className="rounded-full border-foreground/20 bg-foreground/10 text-foreground hover:bg-foreground/20" onClick={() => navigate("/welcome")}>
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto bg-foreground px-8 py-16 text-primary-foreground my-[40px]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-3">
          {/* Contact Section */}
          <div>
            <p className="mb-2 text-sm text-primary-foreground/60">Contact</p>
            <h2 className="text-4xl font-medium leading-tight md:text-5xl">
              Let's start<br />creating<br />together
            </h2>
            <Button variant="outline" className="mt-8 rounded-full border-primary-foreground/20 bg-primary-foreground text-foreground hover:bg-primary-foreground/90" onClick={() => navigate("/welcome")}>
              Let's talk
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-3">
            <a href="#" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Home
            </a>
            <a href="#" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Work
            </a>
            <a href="#" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              About
            </a>
            <a href="#" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Contact
            </a>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-3">
            <a href="#" className="flex items-center justify-between text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Twitter
              <ArrowRight className="h-4 w-4 -rotate-45" />
            </a>
            <a href="#" className="flex items-center justify-between text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Dribbble
              <ArrowRight className="h-4 w-4 -rotate-45" />
            </a>
            <a href="#" className="flex items-center justify-between text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Instagram
              <ArrowRight className="h-4 w-4 -rotate-45" />
            </a>
          </div>
        </div>
      </footer>
    </div>;
};
export default Landing;