import type { MetadataRoute } from "next";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://bridgecoach.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  const staticRoutes: Array<{ path: string; priority: number; changeFrequency: "daily" | "weekly" | "monthly" | "yearly" }> = [
    { path: "", priority: 1, changeFrequency: "weekly" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" },
    { path: "/catalog", priority: 0.8, changeFrequency: "weekly" },
    { path: "/learning-path", priority: 0.7, changeFrequency: "weekly" },
    { path: "/practice", priority: 0.9, changeFrequency: "daily" },
    { path: "/tactical", priority: 0.9, changeFrequency: "daily" },
    { path: "/play", priority: 0.7, changeFrequency: "weekly" },
    { path: "/quiz", priority: 0.6, changeFrequency: "weekly" },
    { path: "/flashcards", priority: 0.5, changeFrequency: "weekly" },
    { path: "/challenges", priority: 0.6, changeFrequency: "daily" },
    { path: "/missions", priority: 0.5, changeFrequency: "weekly" },
    { path: "/leaderboard", priority: 0.5, changeFrequency: "weekly" },
    { path: "/community", priority: 0.6, changeFrequency: "daily" },
    { path: "/achievements", priority: 0.4, changeFrequency: "monthly" },
    { path: "/search", priority: 0.4, changeFrequency: "monthly" },
    { path: "/pricing", priority: 0.6, changeFrequency: "monthly" },
    { path: "/faq", priority: 0.5, changeFrequency: "monthly" },
    { path: "/contact", priority: 0.4, changeFrequency: "yearly" },
  ];

  return staticRoutes.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));
}
