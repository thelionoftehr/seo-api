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

res.status(200).json({

title,
metaDescription,
h1,
h2Count,
images,
links,
canonical

});

} catch (error) {

res.status(500).json({
error: "Failed"
});

}

};
