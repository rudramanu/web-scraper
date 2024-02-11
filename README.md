# Amazon Laptop Details Scraper

## Overview

This Node.js application is designed to scrape laptop information from Amazon.in, focusing on the Bangalore pincode (560068). The scraped data includes details such as product name, title, description, category, MRP, selling price, discount, weight, brand name, image, and specifications. The data is stored in both NDJSON and gzipped formats.

## Prerequisites

- Node.js
- Puppeteer
- zlib

## Installation

1. Clone this repository.
2. Navigate to the project directory using the terminal.
3. Install the required dependencies:
   ```bash
   npm install
   ```

## Usage

1. Run the application:
   ```bash
   node index.js
   ```
2. Access the basic endpoint at [http://localhost:6700/](http://localhost:6700/) to check if the server is running.
3. To scrape laptop information for the Bangalore pincode, visit [http://localhost:6700/scrape/bangalore](http://localhost:6700/scrape/bangalore).

## Project Structure

- `index.js`: Entry point of the application, sets up an Express server and defines the scraping endpoint.
- `scraper.js`: Contains the `AmazonScraper` class responsible for launching Puppeteer, navigating Amazon pages, and extracting laptop details.

## Notes

- The scraped data is stored in two files: `scrappedLaptops.ndjson` (NDJSON format) and `gzippedScrappedData.gz` (gzipped format).
- Puppeteer is used for headless browsing, and the user agent is set to emulate a Chrome browser.
