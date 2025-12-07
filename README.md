# Pulse - Grok Ads Studio

An AI-powered automated ad agency that generates high-CTR marketing strategies, static images (via Grok Imagine), and video concepts (via Google Veo) for X (formerly Twitter).

## Features

- **AI Strategy Generation**: Uses Grok to analyze trends and generate data-driven marketing campaigns
- **Image Generation**: Creates stunning visuals with Grok Imagine API (high quality)
- **Video Concepts**: Generates video scripts and concepts using Google Gemini/Veo
- **Predictive Analytics**: Each post includes predicted CTR based on market analysis
- **Reasoning Chain**: Detailed rationale for why each ad will perform well
- **Native Ad Format**: Optimized for X's platform with helpful, non-intrusive copy

## Tech Stack

- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS with Shadcn/UI components
- **AI/Backend**:
  - Grok API (Text & Image generation)
  - Google Generative AI SDK (Video concepts)

## Getting Started

### Prerequisites

- Node.js 18+ installed
- X.AI API key ([Get one here](https://console.x.ai/))
- Google AI API key ([Get one here](https://makersuite.google.com/app/apikey))

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/grok-ads-studio.git
cd grok-ads-studio
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:
```bash
cp .env.local.template .env.local
```

4. Edit `.env.local` and add your API keys:
```env
XAI_API_KEY=xai-your-key-here
GOOGLE_API_KEY=your-google-key-here
```

5. Run the development server:
```bash
yarn dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

1. **Enter Product Details**: Provide your product/company URL
2. **Add Context** (Optional): Include competitor handles and trending topics
3. **Generate Strategy**: Click to generate a complete viral ad campaign
4. **Generate Assets**: For each post, click to generate images or video concepts
5. **Review & Deploy**: Analyze the predicted CTR and rationale for each post

## Project Structure

```
/app
  /api
    /generate-strategy  # Grok-powered strategy generation
    /generate-image     # Grok Imagine API wrapper
    /generate-video     # Google Veo wrapper
  /components
    /dashboard
      StrategyGrid.tsx  # Main campaign grid view
      InputForm.tsx     # Input form for campaign parameters
      AdCard.tsx        # Individual ad preview card
    /ui                 # Shadcn UI components
  /lib
    types.ts            # TypeScript interfaces
    grok.ts             # Grok API utilities
    google-veo.ts       # Google Veo utilities
```

## API Endpoints

### POST `/api/generate-strategy`
Generates a complete ad campaign strategy.

**Request:**
```json
{
  "productUrl": "https://example.com",
  "competitorHandles": "@competitor1, @competitor2",
  "trendContext": "Current trends..."
}
```

**Response:** `AdStrategy` object with posts array

### POST `/api/generate-image`
Generates an image using Grok Imagine.

**Request:**
```json
{
  "prompt": "A modern tech product...",
  "quality": "high"
}
```

**Response:**
```json
{
  "url": "https://...",
  "revisedPrompt": "..."
}
```

### POST `/api/generate-video`
Generates a video concept using Google Gemini.

**Request:**
```json
{
  "prompt": "Video showing..."
}
```

**Response:**
```json
{
  "videoUrl": "...",
  "concept": "Detailed video script..."
}
```

## Key Implementation Details

- **High Quality Images**: All images use `quality: "high"` for best ad results
- **Native Feel**: Ad copy is optimized to be helpful and non-intrusive
- **Reasoning**: Every post includes detailed rationale connecting to viral trends
- **Error Handling**: Graceful fallbacks if competitor discovery fails

## Building for Production

```bash
yarn build
yarn start
```

## Deployment

Deploy easily to Vercel:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/grok-ads-studio)

Don't forget to add your environment variables in the Vercel dashboard!

## License

MIT

## Acknowledgments

- Built for the Grok Ads Studio Hackathon
- Powered by X.AI's Grok and Google's Gemini
- UI components from [Shadcn/UI](https://ui.shadcn.com/)
