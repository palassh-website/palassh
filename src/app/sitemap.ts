import { MetadataRoute } from "next";

// Only indexable pages belong here. /checkout, /my-orders and /account are
// noindex, so listing them would contradict their robots meta.
// lastModified is intentionally omitted: a value that changes on every request
// teaches Google to ignore it. Add real per-page dates when they are tracked.
const BASE_URL = "https://palassh.com";

const PATHS = [
  "",
  "/products",
  "/about",
  "/legal/privacy-policy",
  "/legal/terms-and-conditions",
  "/legal/refund-policy",
  "/legal/shipping-policy",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return PATHS.map((path) => ({ url: `${BASE_URL}${path}` }));
}
