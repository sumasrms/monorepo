import { GalleryVerticalEnd } from "lucide-react";

import { LoginForm } from "@/components/login-form";
import { LoadingCarousel } from "@workspace/ui/components/loading-carousel";
import Image from "next/image";

export default function LoginPage() {
  const defaultTips = [
    {
      text: "Backend snippets. Shadcn style headless components.. but for your backend.",
      image: "/auth.jpg",
      url: "https://www.newcult.co/backend",
    },
    {
      text: "Create your first directory app today. AI batch scripts to process 100s of urls in seconds.",
      image: "/auth.jpg",
      url: "https://www.newcult.co/templates/cult-seo",
    },
    {
      text: "Cult landing page template. Framer motion, shadcn, and tailwind.",
      image: "/placeholders/cult-rune.png",
      url: "https://www.newcult.co/templates/cult-landing-page",
    },
    {
      text: "Vector embeddings, semantic search, and chat based vector retrieval on easy mode.",
      image: "/placeholders/cult-manifest.png",
      url: "https://www.newcult.co/templates/manifest",
    },
    {
      text: "SEO analysis app. Scraping, analysis, insights, and AI recommendations.",
      image: "/placeholders/cult-seo.png",
      url: "https://www.newcult.co/templates/cult-seo",
    },
  ];
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Sumas
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="bg-musted relative hidden lg:block m-6">
        <LoadingCarousel />
      </div>
    </div>
  );
}
