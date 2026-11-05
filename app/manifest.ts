import type { MetadataRoute } from "next";
import { BRAND_DESCRIPTION, BRAND_NAME } from "@/lib/brand";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: BRAND_NAME,
    short_name: "JS Fisio",
    description: BRAND_DESCRIPTION,
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#F7F6FB",
    theme_color: "#6C7D61",
    lang: "pt-BR",
    icons: [
      {
        src: "/brand/js-icon.svg",
        type: "image/svg+xml",
        sizes: "any",
        purpose: "any",
      },
    ],
  };
}
