const axios = require("axios");
const cheerio = require("cheerio");

module.exports = async (req, res) => {

const url = req.query.url;

try {

const response = await axios.get(url);

const $ = cheerio.load(response.data);

const title = $("title").text();

const metaDescription =
$('meta[name="description"]').attr("content");

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

const text = $("body").text();

const wordCount =
text.trim().split(/\s+/).length;

let seoScore = 100;

if (!title) seoScore -= 10;
if (!metaDescription) seoScore -= 10;
if (!h1) seoScore -= 10;
if (missingAlt > 0) seoScore -= 10;

res.status(200).json({

title,
metaDescription,
h1,
h2Count,
images,
links,
internalLinks,
externalLinks,
missingAlt,
wordCount,
canonical,
seoScore

});

} catch (error) {

res.status(500).json({
error: "Failed"
});

}

};
