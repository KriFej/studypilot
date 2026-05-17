import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/login", "/signup", "/auth/", "/success"],
      },
    ],
    sitemap: "https://locpilote.com/sitemap.xml",
  };
}
