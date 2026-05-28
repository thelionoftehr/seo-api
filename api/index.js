const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {

  const url = req.query.url;

  try {

    // ================= FETCH HTML =================
    const response = await axios.get(url, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const $ = cheerio.load(response.data);

    // ================= DOMAIN =================
    const domain = new URL(url).hostname;

    // ================= BASIC SEO =================
    const title = $("title").text() || "";
    const metaDescription =
      $('meta[name="description"]').attr("content") || "";

    const h1 = $("h1").first().text() || "";
    const h2Count = $("h2").length;
    const h3Count = $("h3").length;

    // ================= LINKS =================
    const links = $("a").length;
    let internalLinks = 0;
    let externalLinks = 0;

    $("a").each((i, el) => {
      const href = $(el).attr("href");

      if (href) {
        if (href.startsWith("/") || href.includes(domain)) {
          internalLinks++;
        } else {
          externalLinks++;
        }
      }
    });

    // ================= IMAGES =================
    const images = $("img").length;
    let missingAlt = 0;

    $("img").each((i, el) => {
      if (!$(el).attr("alt")) missingAlt++;
    });

    // ================= TECH CHECK =================
    const canonical =
      $('link[rel="canonical"]').attr("href") || "";

    const favicon =
      $('link[rel="icon"]').attr("href") ||
      $('link[rel="shortcut icon"]').attr("href") || "";

    const generator =
      $('meta[name="generator"]').attr("content") || "";

    const openGraph =
      $('meta[property^="og:"]').length;

    const twitterCard =
      $('meta[name^="twitter:"]').length;

    const schema =
      $('script[type="application/ld+json"]').length;

    // ================= FILE CHECKS =================
    const robotsTxt = url + "/robots.txt";
    const sitemap = url + "/sitemap.xml";

    // ================= CONTENT =================
    const text = $("body").text()
      .toLowerCase()
      .replace(/[^\w\s]/gi, " ");

    const words = text.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // ================= KEYWORDS =================
    const stopWords = [
      "the","is","and","of","to","a","in","for","on","with",
      "at","by","an","be","this","that","from","or","as","are","it"
    ];

    const keywordMap = {};

    words.forEach(word => {
      if (word.length > 3 && !stopWords.includes(word)) {
        keywordMap[word] = (keywordMap[word] || 0) + 1;
      }
    });

    const topKeywords =
      Object.entries(keywordMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

    // ================= SEO SCORE =================
    let seoScore = 100;
    const suggestions = [];

    if (!title) { seoScore -= 10; suggestions.push("Add title"); }
    if (!metaDescription) { seoScore -= 10; suggestions.push("Add meta description"); }
    if (!h1) { seoScore -= 10; suggestions.push("Add H1"); }
    if (missingAlt > 0) { seoScore -= 10; suggestions.push("Fix image alt tags"); }
    if (!canonical) { seoScore -= 5; suggestions.push("Add canonical tag"); }

    // ================= META LENGTH =================
    const titleLength = title.length;
    const metaLength = metaDescription.length;

    const titleStatus =
      titleLength < 30 ? "Too Short" :
      titleLength > 60 ? "Too Long" : "Good";

    const metaStatus =
      metaLength < 70 ? "Too Short" :
      metaLength > 160 ? "Too Long" : "Good";

    // ================= ADVANCED CHECKS =================

    const ssl = url.startsWith("https") ? "Yes" : "No";
    const www = domain.startsWith("www") ? "Yes" : "No";
    const indexable = metaDescription.includes("noindex") ? "No" : "Yes";
    const redirect = url.includes("http://") ? "Yes" : "No";

    let socialLinks = 0;
    $("a").each((i, el) => {
      const href = $(el).attr("href") || "";
      if (
        href.includes("facebook") ||
        href.includes("twitter") ||
        href.includes("instagram") ||
        href.includes("linkedin")
      ) {
        socialLinks++;
      }
    });

    const cms =
      generator.includes("WordPress") ? "WordPress" :
      generator.includes("Shopify") ? "Shopify" :
      generator ? generator : "Unknown";

    // ================= PAGE SPEED INSIGHTS (NEW 🔥) =================
    let pageSpeed = {};

    try {
      const apiKey = process.env.PAGESPEED_API_KEY;

      const pagespeedUrl =
        `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile`;

      const psResponse = await axios.get(pagespeedUrl);

      const data = psResponse.data;
      const lighthouse = data.lighthouseResult;

      pageSpeed = {
        performance: lighthouse.categories.performance.score * 100,
        accessibility: lighthouse.categories.accessibility.score * 100,
        bestPractices: lighthouse.categories["best-practices"].score * 100,
        seo: lighthouse.categories.seo.score * 100,

        firstContentfulPaint: lighthouse.audits["first-contentful-paint"].displayValue,
        speedIndex: lighthouse.audits["speed-index"].displayValue,
        largestContentfulPaint: lighthouse.audits["largest-contentful-paint"].displayValue,
        totalBlockingTime: lighthouse.audits["total-blocking-time"].displayValue,
        cumulativeLayoutShift: lighthouse.audits["cumulative-layout-shift"].displayValue
      };

    } catch (err) {
      pageSpeed = { error: "PageSpeed API failed" };
    }

    // ================= FINAL OUTPUT =================
    res.status(200).json({

      domain,

      // BASIC SEO
      title,
      titleLength,
      titleStatus,

      metaDescription,
      metaLength,
      metaStatus,

      h1,
      h2Count,
      h3Count,

      // LINKS
      links,
      internalLinks,
      externalLinks,
      socialLinks,

      // IMAGES
      images,
      missingAlt,

      // TECH
      canonical,
      favicon,
      generator,
      cms,
      schema,
      openGraph,
      twitterCard,

      // FILES
      robotsTxt,
      sitemap,

      // CONTENT
      wordCount,
      topKeywords,

      // STATUS
      ssl,
      www,
      indexable,
      redirect,

      // SEO SCORE
      seoScore,
      suggestions,

      // ⚡ PAGE SPEED (NEW)
      pageSpeed

    });

  } catch (error) {
    res.status(500).json({
      error: "SEO analysis failed"
    });
  }

};
