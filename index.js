const express = require("express");
const app = express();

const AmazonScraper = require("./scraper");
const amazonScraper = new AmazonScraper();

app.get("/", (req, res) => {
  res.send("Basic Endpoint Working");
});

// Scraping for Bangalore pincode
app.get("/scrape/bangalore", async (req, res) => {
  try {
    const scrappedData = await amazonScraper.scrapeLaptops("560068");
    res.send({
      "Successfully scraped all laptops for Bangalore.": scrappedData,
    });
  } catch (error) {
    console.error("Error during scraping:", error);
  }
});

app.listen(6700, () => {
  console.log("Server is runnning at port 6700");
});
