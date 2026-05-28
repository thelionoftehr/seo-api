const axios = require("axios");
const cheerio = require("cheerio");

const API_KEY = "AIzaSyBdrgAC97Jxuvr5DuSWKrbkir9-W62iUZM";

module.exports = async (req, res) => {

const url = req.query.url;

try {

const response = await axios.get(url, {
headers: { "User-Agent": "Mozilla/5.0" }
});

const $ = cheerio.load(response.data);

// ================= PAGE SPEED =================

const pageSpeed =
await axios.get(
`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${url}&key=${API_KEY}`
);

const lighthouse =
pageSpeed.data.lighthouseResult;

const performance =
lighthouse.categories.performance.score * 100;

const accessibility =
lighthouse.categories.accessibility.score * 100;

const bestPractices =
lighthouse.categories["best-practices"].score * 100;

const seoAudit =
lighthouse.categories.seo.score * 100;

const coreWebVitals =
pageSpeed.data.loadingExperience || {};

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

if (!$(el).attr("alt")) {
missingAlt++;
}

});

// ================= TECH =================

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

// ================= ROBOTS & SITEMAP =================

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
"the","is","and","of","to","a","in","for",
"on","with","at","by","an","be","this",
"that","from","or","as","are","it"
];

const keywordMap = {};

words.forEach(word => {

if (
word.length > 3 &&
!stopWords.includes(word)
) {

keywordMap[word] =
(keywordMap[word] || 0) + 1;

}

});

const topKeywords =
Object.entries(keywordMap)
.sort((a, b) => b[1] - a[1])
.slice(0, 10);

// ================= SEO SCORE =================

let seoScore = 100;

const suggestions = [];

if (!title) {
seoScore -= 10;
suggestions.push("Add title");
}

if (!metaDescription) {
seoScore -= 10;
suggestions.push("Add meta description");
}

if (!h1) {
seoScore -= 10;
suggestions.push("Add H1");
}

if (missingAlt > 0) {
seoScore -= 10;
suggestions.push("Fix image alt tags");
}

if (!canonical) {
seoScore -= 5;
suggestions.push("Add canonical tag");
}

// ================= META STATUS =================

const titleLength = title.length;

const metaLength = metaDescription.length;

const titleStatus =
titleLength < 30 ? "Too Short" :
titleLength > 60 ? "Too Long" : "Good";

const metaStatus =
metaLength < 70 ? "Too Short" :
metaLength > 160 ? "Too Long" : "Good";

// ================= EXTRA =================

const ssl =
url.startsWith("https") ? "Yes" : "No";

const www =
domain.startsWith("www") ? "Yes" : "No";

const redirect =
url.includes("http://") ? "Yes" : "No";

// ================= OUTPUT =================

res.status(200).json({

domain,

title,
titleLength,
titleStatus,

metaDescription,
metaLength,
metaStatus,

h1,
h2Count,
h3Count,

links,
internalLinks,
externalLinks,

images,
missingAlt,

canonical,
favicon,
generator,

robotsTxt,
sitemap,

openGraph,
twitterCard,
schema,

ssl,
www,
redirect,

wordCount,

topKeywords,

seoScore,
suggestions,

performance,
accessibility,
bestPractices,
seoAudit,
coreWebVitals

});

} catch (error) {

res.status(500).json({
error: "SEO analysis failed"
});

}

};
