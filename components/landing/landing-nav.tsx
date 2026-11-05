import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { BRAND_LOGO, BRAND_NAME } from "@/lib/brand";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label={BRAND_NAME} className="flex items-center">
          <Image
            src={BRAND_LOGO}
            alt={BRAND_NAME}
            width={280}
            height={72}
            priority
            unoptimized
            className="h-9 w-auto sm:h-10"
          />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="#features"
            className="hidden text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            Recursos
          </Link>
          <Link href="/login">
            <Button size="sm">Entrar</Button>
          </Link>
        </div>
      </nav>
    </header>
  );
}
