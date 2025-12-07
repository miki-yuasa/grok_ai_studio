import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <header className="flex items-center justify-between px-8 py-6">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-xl font-semibold text-foreground">studio</span>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Features
          </a>
          <a href="#about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            About
          </a>
          <a href="#contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Contact
          </a>
        </nav>
        <Link href="/dashboard">
          <Button variant="default" size="sm" className="rounded-full">
            Get Started
          </Button>
        </Link>
      </header>

      {/* Hero Section */}
      <main className="px-8 pb-px py-0 my-0">
        <div className="relative mx-auto overflow-hidden rounded-3xl bg-muted">
          <div 
            style={{
              backgroundImage: `url(/hero-bg.gif), linear-gradient(135deg, #667eea 0%, #764ba2 100%)`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }} 
            className="relative flex min-h-[70vh] flex-col items-center justify-center px-8 py-16"
          >
            {/* Overlay for better text readability */}
            <div className="absolute inset-0 bg-black/40" />
            
            <div className="relative z-10 text-center">
              <p className="mb-2 text-sm text-white/80">Introducing Studio</p>
              <h1 className="mb-4 text-4xl font-medium text-white md:text-5xl lg:text-6xl">
                The future of marketing.
              </h1>
              <p className="mb-8 text-lg text-white/70 max-w-2xl mx-auto">
                AI-powered ad campaigns for X (Twitter). Generate viral content with Grok & Veo.
              </p>
              
              <div className="gap-4 items-center justify-center flex flex-row">
                <a href="#features">
                  <Button variant="outline" className="rounded-full border-white/20 bg-white/10 text-white hover:bg-white/20">
                    Learn More
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </a>
                <Link href="/dashboard">
                  <Button className="rounded-full bg-white text-black hover:bg-white/90">
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Features Section */}
      <section id="features" className="px-8 py-24">
        <div className="mx-auto max-w-6xl">
          <h2 className="text-3xl font-medium text-center mb-16">Powerful Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-muted">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium mb-2">AI-Generated Content</h3>
              <p className="text-sm text-muted-foreground">
                Leverage Grok AI to create viral marketing strategies and engaging tweet content.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-muted">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Video Generation</h3>
              <p className="text-sm text-muted-foreground">
                Create stunning video ads with Google Veo AI for maximum engagement.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-muted">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                <svg className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium mb-2">Scheduled Posting</h3>
              <p className="text-sm text-muted-foreground">
                Schedule your campaigns and let our system post automatically at optimal times.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="px-8 py-24 bg-muted">
        <div className="mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-medium mb-6">About Studio</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Studio is an AI-powered marketing platform that helps you create viral ad campaigns for X (Twitter). 
            Using cutting-edge AI from Grok for strategy and content, plus Google Veo for video generation, 
            you can launch professional marketing campaigns in minutes.
          </p>
          <Link href="/dashboard">
            <Button size="lg" className="rounded-full">
              Start Creating
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-foreground px-8 py-16 text-primary-foreground">
        <div className="mx-auto grid max-w-6xl grid-cols-1 gap-12 md:grid-cols-3">
          {/* Contact Section */}
          <div>
            <p className="mb-2 text-sm text-primary-foreground/60">Contact</p>
            <h2 className="text-4xl font-medium leading-tight md:text-5xl">
              Let's start<br />creating<br />together
            </h2>
            <Link href="/dashboard">
              <Button variant="outline" className="mt-8 rounded-full border-primary-foreground/20 bg-primary-foreground text-foreground hover:bg-primary-foreground/90">
                Let's talk
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="flex flex-col gap-3">
            <Link href="/" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Home
            </Link>
            <a href="#features" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Features
            </a>
            <a href="#about" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              About
            </a>
            <Link href="/dashboard/create" className="text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Create
            </Link>
          </div>

          {/* Social Links */}
          <div className="flex flex-col gap-3">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              Twitter / X
              <ArrowRight className="h-4 w-4 -rotate-45" />
            </a>
            <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="flex items-center justify-between text-sm text-primary-foreground/80 hover:text-primary-foreground transition-colors">
              GitHub
              <ArrowRight className="h-4 w-4 -rotate-45" />
            </a>
          </div>
        </div>
        
        <div className="mx-auto max-w-6xl mt-12 pt-8 border-t border-primary-foreground/10">
          <p className="text-sm text-primary-foreground/60 text-center">
            Built with Next.js, Grok API, and Google Gemini
          </p>
        </div>
      </footer>
    </div>
  );
}
