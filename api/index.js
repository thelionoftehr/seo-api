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

res.status(200).json({
title,
metaDescription
});

} catch (error) {

res.status(500).json({
error: "Failed"
});

}

};
