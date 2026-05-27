const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {

const url = req.query.url;

try {

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

// ================= STATUS =================
const titleStatus =
titleLength < 30 ? "Too Short" :
titleLength > 60 ? "Too Long" : "Good";

const metaStatus =
metaLength < 70 ? "Too Short" :
metaLength > 160 ? "Too Long" : "Good";

// ================= ADVANCED FREE CHECKS =================

// SSL
const ssl = url.startsWith("https") ? "Yes" : "No";

// WWW CHECK
const www = domain.startsWith("www") ? "Yes" : "No";

// INDEXABILITY (basic)
const indexable = metaDescription.includes("noindex") ? "No" : "Yes";

// REDIRECT (basic guess)
const redirect = url.includes("http://") ? "Yes" : "No";

// SOCIAL LINKS
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

// CMS DETECTION (basic)
const cms =
generator.includes("WordPress") ? "WordPress" :
generator.includes("Shopify") ? "Shopify" :
generator ? generator : "Unknown";

// ================= OUTPUT =================
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

// SEO
seoScore,
suggestions

});

} catch (error) {

res.status(500).json({
error: "SEO analysis failed"
});

}

};
