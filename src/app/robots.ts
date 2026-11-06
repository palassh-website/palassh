import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const aiAndSearchAgents = [
    "*",
    "Googlebot",
    "Google-Extended",      // Google Gemini & AI Overviews
    "GPTBot",               // OpenAI / ChatGPT Model Training & Knowledge
    "OAI-SearchBot",        // ChatGPT Live Web Search
    "ChatGPT-User",         // ChatGPT User Browsing Action
    "PerplexityBot",        // Perplexity AI Search
    "Perplexity-User",      // Perplexity Live User Query
    "ClaudeBot",            // Anthropic Claude AI
    "Claude-Web",           // Claude Web Search
    "anthropic-ai",         // Anthropic AI Crawler
    "CCBot",                // Common Crawl (used by many LLMs)
    "Applebot",             // Apple Siri & Spotlight
    "Applebot-Extended",    // Apple Intelligence
    "meta-externalagent",   // Meta AI (WhatsApp / Instagram AI)
    "Bingbot",              // Microsoft Copilot & Bing Search
  ];

  return {
    rules: aiAndSearchAgents.map((agent) => ({
      userAgent: agent,
      allow: ["/", "/llms.txt", "/lms.txt"],
      disallow: ["/admin", "/api/"],
    })),
    sitemap: "https://palassh.com/sitemap.xml",
    host: "https://palassh.com",
  };
}