import { buildOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/ogImage";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function TwitterImage() {
  return buildOgImage({
    title: "Bridge Coach",
    subtitle: "Learn contract bridge the modern way — from first trick to tournament play",
  });
}
