let pageSpeed = {};

try {
  const apiKey = process.env.PAGESPEED_API_KEY;

  if (!apiKey) {
    throw new Error("API key missing in env");
  }

  const pagespeedUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${apiKey}&strategy=mobile`;

  const psResponse = await axios.get(pagespeedUrl);

  const data = psResponse.data;

  if (!data.lighthouseResult) {
    throw new Error(JSON.stringify(data));
  }

  const lighthouse = data.lighthouseResult;

  pageSpeed = {
    performance: lighthouse?.categories?.performance?.score
      ? lighthouse.categories.performance.score * 100
      : null,

    accessibility: lighthouse?.categories?.accessibility?.score
      ? lighthouse.categories.accessibility.score * 100
      : null,

    bestPractices: lighthouse?.categories?.["best-practices"]?.score
      ? lighthouse.categories["best-practices"].score * 100
      : null,

    seo: lighthouse?.categories?.seo?.score
      ? lighthouse.categories.seo.score * 100
      : null,

    firstContentfulPaint: lighthouse?.audits?.["first-contentful-paint"]?.displayValue || null,
    speedIndex: lighthouse?.audits?.["speed-index"]?.displayValue || null,
    largestContentfulPaint: lighthouse?.audits?.["largest-contentful-paint"]?.displayValue || null,
    totalBlockingTime: lighthouse?.audits?.["total-blocking-time"]?.displayValue || null,
    cumulativeLayoutShift: lighthouse?.audits?.["cumulative-layout-shift"]?.displayValue || null
  };

} catch (err) {
  pageSpeed = {
    error: "PageSpeed failed",
    debug: err.message
  };
}
