const axios = require("axios");
const cheerio = require("cheerio");

const API_KEY = "AIzaSyBdrgAC97Jxuvr5DuSWKrbkir9-W62iUZM";

module.exports = async (req, res) => {

const url = req.query.url;

// ================= URL VALIDATION =================

if (!url) {

return res.status(400).json({
error: "URL is required"
});

}

if (!url.startsWith("http")) {

return res.status(400).json({
error: "Invalid URL format"
});

}

try {

// ================= WEBSITE FETCH =================

const response = await axios.get(url, {

headers: {
"User-Agent":
"Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
},

timeout: 10000,
maxRedirects: 5

});

const html = response.data;

const $ = cheerio.load(html);

// ================= PAGE SPEED =================

let performance = null;
let accessibility = null;
let bestPractices = null;
let seoAudit = null;
let coreWebVitals = {};

try {

const pageSpeed =
await axios.get(
`https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${API_KEY}`,
{
timeout: 15000
}
);

const lighthouse =
pageSpeed.data.lighthouseResult;

performance =
Math.round(
(lighthouse.categories.performance.score || 0) * 100
);

accessibility =
Math.round(
(lighthouse.categories.accessibility.score || 0) * 100
);

bestPractices =
Math.round(
(lighthouse.categories["best-practices"].score || 0) * 100
);

seoAudit =
Math.round(
(lighthouse.categories.seo.score || 0) * 100
);

coreWebVitals =
pageSpeed.data.loadingExperience || {};

} catch (e) {

console.log("PageSpeed API failed");

}

// ================= DOMAIN =================

const domain = new URL(url).hostname;

// ================= BASIC SEO =================

const title =
$("title").first().text().trim() || "";

const metaDescription =
$('meta[name="description"]').attr("content") || "";

const h1 =
$("h1").first().text().trim() || "";

const h2Count =
$("h2").length;

const h3Count =
$("h3").length;

// ================= LINKS =================

const links =
$("a").length;

let internalLinks = 0;
let externalLinks = 0;
let socialLinks = 0;

$("a").each((i, el) => {

const href =
$(el).attr("href") || "";

if (href) {

if (
href.startsWith("/") ||
href.includes(domain)
) {

internalLinks++;

} else {

externalLinks++;

}

if (
href.includes("facebook") ||
href.includes("twitter") ||
href.includes("instagram") ||
href.includes("linkedin") ||
href.includes("youtube")
) {

socialLinks++;

}

}

});

// ================= IMAGES =================

const images =
$("img").length;

let missingAlt = 0;

$("img").each((i, el) => {

if (!$(el).attr("alt")) {

missingAlt++;

}

});

// ================= TECHNICAL SEO =================

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

const robotsTxt =
url.replace(/\/$/, "") + "/robots.txt";

const sitemap =
url.replace(/\/$/, "") + "/sitemap.xml";

// ================= CONTENT =================

const text =
$("body")
.text()
.toLowerCase()
.replace(/[^\w\s]/gi, " ");

const words =
text.split(/\s+/).filter(Boolean);

const wordCount =
words.length;

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

// ================= TITLE STATUS =================

const titleLength =
title.length;

const metaLength =
metaDescription.length;

const titleStatus =
titleLength < 30
? "Too Short"
: titleLength > 60
? "Too Long"
: "Good";

const metaStatus =
metaLength < 70
? "Too Short"
: metaLength > 160
? "Too Long"
: "Good";

// ================= EXTRA =================

const ssl =
url.startsWith("https")
? "Yes"
: "No";

const www =
domain.startsWith("www")
? "Yes"
: "No";

const redirect =
url.includes("http://")
? "Yes"
: "No";

// ================= CMS DETECTION =================

const cms =
generator.includes("WordPress")
? "WordPress"
: generator.includes("Shopify")
? "Shopify"
: generator.includes("Blogger")
? "Blogger"
: generator || "Unknown";

// ================= SEO SCORE =================

let seoScore = 100;

const suggestions = [];

if (!title) {

seoScore -= 10;
suggestions.push("Add title tag");

}

if (!metaDescription) {

seoScore -= 10;
suggestions.push("Add meta description");

}

if (!h1) {

seoScore -= 10;
suggestions.push("Add H1 heading");

}

if (missingAlt > 0) {

seoScore -= 10;
suggestions.push("Fix image alt tags");

}

if (!canonical) {

seoScore -= 5;
suggestions.push("Add canonical tag");

}

if (wordCount < 300) {

seoScore -= 5;
suggestions.push("Increase content length");

}

if (schema === 0) {

seoScore -= 5;
suggestions.push("Add schema markup");

}

if (openGraph === 0) {

seoScore -= 5;
suggestions.push("Add OpenGraph tags");

}

// ================= OUTPUT =================

res.status(200).json({

success: true,

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

openGraph,
twitterCard,
schema,

// FILES
robotsTxt,
sitemap,

// STATUS
ssl,
www,
redirect,

// CONTENT
wordCount,
topKeywords,

// SCORE
seoScore,
suggestions,

// PAGE SPEED
performance,
accessibility,
bestPractices,
seoAudit,
coreWebVitals

});

} catch (error) {

console.log(error);

// ================= TIMEOUT =================

if (error.code === "ECONNABORTED") {

return res.status(408).json({

success: false,

error:
"Website took too long to respond"

});

}

// ================= INVALID URL =================

if (error.code === "ERR_INVALID_URL") {

return res.status(400).json({

success: false,

error:
"Invalid website URL"

});

}

// ================= GENERAL ERROR =================

return res.status(500).json({

success: false,

error:
"Website blocked requests or temporarily unavailable"

});

}

};
