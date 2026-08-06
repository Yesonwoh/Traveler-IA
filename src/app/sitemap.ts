import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const ahora = new Date();

  return [
    { url: SITE_URL, lastModified: ahora, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/premium`, lastModified: ahora, changeFrequency: "monthly", priority: 0.8 },
    { url: `${SITE_URL}/registro`, lastModified: ahora, changeFrequency: "yearly", priority: 0.6 },
    { url: `${SITE_URL}/login`, lastModified: ahora, changeFrequency: "yearly", priority: 0.4 },
    { url: `${SITE_URL}/terminos`, lastModified: ahora, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privacidad`, lastModified: ahora, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/cookies`, lastModified: ahora, changeFrequency: "yearly", priority: 0.3 },
  ];
}
