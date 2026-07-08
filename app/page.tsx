import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ACCESS_TOKEN_COOKIE } from "@/lib/session-constants";
import { LandingNav } from "@/components/landing/landing-nav";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingFeatures } from "@/components/landing/landing-features";
import { LandingCta, LandingFooter } from "@/components/landing/landing-cta-footer";

export default async function Home() {
  const store = await cookies();
  if (store.get(ACCESS_TOKEN_COOKIE)?.value) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-col scroll-smooth bg-background text-foreground">
      <LandingNav />
      <main className="flex-1">
        <LandingHero />
        <LandingFeatures />
        <LandingCta />
      </main>
      <LandingFooter />
    </div>
  );
}
