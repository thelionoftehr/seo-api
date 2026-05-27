const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {

const url = req.query.url;

try {

const response = await axios.get(url);

const $ = cheerio.load(response.data);

const title = $("title").text();

const metaDescription =
$('meta[name="description"]').attr("content") || "";

const h1 = $("h1").first().text();

const h2Count = $("h2").length;

const images = $("img").length;

const links = $("a").length;

const canonical =
$('link[rel="canonical"]').attr("href");

let missingAlt = 0;

$("img").each((i, el) => {

if (!$(el).attr("alt")) {
missingAlt++;
}

});

let internalLinks = 0;
let externalLinks = 0;

$("a").each((i, el) => {

const href = $(el).attr("href");

if (href) {

if (href.startsWith("/") || href.includes(url)) {
internalLinks++;
} else {
externalLinks++;
}

}

});

const text = $("body").text()
.toLowerCase()
.replace(/[^\w\s]/gi, "");

const words = text.split(/\s+/);

const wordCount = words.length;

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

const sortedKeywords =
Object.entries(keywordMap)
.sort((a, b) => b[1] - a[1])
.slice(0, 10);

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
suggestions.push("Add alt text to images");
}

const titleLength = title.length;

const metaLength = metaDescription.length;

let titleStatus = "Good";

if (titleLength < 30) {
titleStatus = "Too Short";
}

if (titleLength > 60) {
titleStatus = "Too Long";
}

let metaStatus = "Good";

if (metaLength < 70) {
metaStatus = "Too Short";
}

if (metaLength > 160) {
metaStatus = "Too Long";
}

res.status(200).json({

title,
titleLength,
titleStatus,

metaDescription,
metaLength,
metaStatus,

h1,
h2Count,
images,
links,

internalLinks,
externalLinks,

missingAlt,
wordCount,

canonical,

seoScore,

suggestions,

topKeywords: sortedKeywords

});

} catch (error) {

res.status(500).json({
error: "Failed"
});

}

};
