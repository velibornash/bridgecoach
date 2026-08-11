import { buildOgImage, OG_CONTENT_TYPE, OG_SIZE } from "@/lib/seo/ogImage";

export const size = OG_SIZE;
export const contentType = OG_CONTENT_TYPE;

export default function OpengraphImage() {
  return buildOgImage({
    title: "Bridge Coach",
    subtitle: "Master Contract Bridge — lessons, drills & a real AI coach",
  });
}
