const puppeteer = require("puppeteer");
const fs = require("fs");
const zlib = require("zlib");

// AmazonScraper Class: This class defines methods to scrape laptop data from Amazon.in
class AmazonScraper {
  constructor() {
    this.baseURL = "https://www.amazon.in";
    this.userAgent =
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/97.0.4692.99 Safari/537.36";
  }

  async scrapeLaptops(pincode) {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    page.setUserAgent(this.userAgent);

    try {
      let currentPage = 1;
      let laptops = [];

      while (true) {
        // It navigates to the laptop search page on Amazon.in with the current page number.
        await page.goto(`${this.baseURL}/s?k=laptops&page=${currentPage}`, {
          waitUntil: "networkidle0",
          timeout: 60000,
        });

        const laptopNodes = await page.$$(
          'div[data-component-type="s-search-result"]'
        );

        for (const node of laptopNodes) {
          try {
            const productDetails = await this.extractProductDetails(node, page);
            laptops.push(productDetails);
          } catch (error) {
            console.error("Error during product extraction1:", error);
          }
        }

        if (currentPage == 20) {
          break;
        }
        currentPage++;
      }
      console.log("All scraped laptop", laptops, laptops.length);
      const scrappedLaptops = laptops
        .map((product) => {
          return JSON.stringify(product);
        })
        .join("\n");
      fs.writeFileSync("scrappedLaptops.ndjson", scrappedLaptops);

      const gzippedScrappedData = zlib.gzipSync(scrappedLaptops);
      fs.writeFileSync("gzippedScrappedData.gz", gzippedScrappedData);

      const gzippedFilePath = "gzippedScrappedData.gz";
      const gzippedData = fs.readFileSync(gzippedFilePath);
      const decompressedData = zlib.gunzipSync(gzippedData);
      const ndjsonString = decompressedData.toString();
      const jsonObjects = ndjsonString
        .split("\n")
        .map((line) => JSON.parse(line));

      return jsonObjects;
    } catch (error) {
      console.error("Error during scraping:", error);
    } finally {
      await browser.close();
    }
  }
  async extractProductDetails(node, page) {
    try {
      // It clicks on each laptop node to open its details page and waits for a short timeout to ensure the page loads.
      await node.click();

      await page.waitForTimeout(3000);

      const pages = await page.browser().pages();
      // console.log("Pages:", pages);

      const newPage = pages.find((current_page) => current_page !== page);
      // console.log("New Page:", newPage);

      //=======================Scrape product details here=============

      const productTitleElement = await newPage.$("#productTitle");
      const productTitle = productTitleElement
        ? await newPage.evaluate(
            (element) => element.textContent.trim(),
            productTitleElement
          )
        : "N/A";

      const productNameElement = await newPage.$(
        productTitle.includes("(Refurbished)")
          ? "#poExpander > div.a-expander-content.a-expander-partial-collapse-content > div > table > tbody > tr.a-spacing-small.po-model_name > td.a-span9"
          : "#poExpander > div.a-expander-content.a-expander-partial-collapse-content > div > table > tbody > tr.a-spacing-small.po-model_name > td.a-span9 > span"
      );
      const productName = productNameElement
        ? await newPage.evaluate(
            (element) => element.textContent.trim(),
            productNameElement
          )
        : "N/A";

      const productDescriptionElement = await newPage.$(
        "#feature-bullets > ul"
      );
      const productDescription = productDescriptionElement
        ? await newPage.evaluate(
            (element) => element.textContent.trim(),
            productDescriptionElement
          )
        : "N/A";

      const productCategoryElement = await newPage.$(
        "#productDetails_techSpec_section_1 > tbody > tr:nth-child(5) > td"
      );
      const productCategory = productCategoryElement
        ? await newPage.evaluate(
            (element) => element.textContent.trim(),
            productCategoryElement
          )
        : "N/A";

      const productMRPElement = await newPage.$(
        productTitle.includes("(Refurbished)")
          ? "#corePrice_desktop > div > table > tbody > tr:nth-child(1) > td.a-span12.a-color-secondary.a-size-base > span.a-price.a-text-price.a-size-base > span.a-offscreen"
          : "#corePriceDisplay_desktop_feature_div > div.a-section.a-spacing-small.aok-align-center > span > span.aok-relative > span > span > span.a-offscreen"
      );

      const productMRP = productMRPElement
        ? await newPage.evaluate(
            (element) => element.textContent.trim(),
            productMRPElement
          )
        : "N/A";

      const productSellingPriceElement = await newPage.$(
        productTitle.includes("(Refurbished)")
          ? "#corePrice_desktop > div > table > tbody > tr:nth-child(2) > td.a-span12 > span.a-price.a-text-price.a-size-medium.apexPriceToPay > span.a-offscreen"
          : "#corePriceDisplay_desktop_feature_div > div.a-section.a-spacing-none.aok-align-center > span.a-price.aok-align-center.reinventPricePriceToPayMargin.priceToPay > span:nth-child(2) > span.a-price-whole"
      );

      const productSellingPrice = productSellingPriceElement
        ? await newPage.evaluate(
            (element) => element.textContent.trim(),
            productSellingPriceElement
          )
        : "N/A";

      const isRefurbishedOrRenewed =
        productTitle.includes("(Refurbished)") ||
        productTitle.includes("(Renewed)");

      // Select the appropriate selector based on the condition
      const productDiscountElement = await newPage.$(
        isRefurbishedOrRenewed
          ? "#corePrice_desktop > div > table > tbody > tr:nth-child(3) > td.a-span12.a-color-price.a-size-base > span.a-color-price"
          : "#corePriceDisplay_desktop_feature_div > div.a-section.a-spacing-none.aok-align-center > span.a-size-large.a-color-price.savingPriceOverride.aok-align-center.reinventPriceSavingsPercentageMargin.savingsPercentage"
      );

      // Conditionally evaluate the discount
      const productDiscount = productDiscountElement
        ? await newPage.evaluate(
            (element, isRefurbishedOrRenewed) => {
              if (isRefurbishedOrRenewed) {
                const textContent = element.textContent.trim();
                const parts = textContent.split("(");
                if (parts.length > 1) {
                  const percentagePart = parts[1].split(")")[0];
                  return percentagePart.trim() || "N/A";
                } else {
                  return "N/A";
                }
              } else {
                return element.innerText.trim();
              }
            },
            productDiscountElement,
            isRefurbishedOrRenewed
          )
        : "N/A";

      const tbodyElement = await newPage.$(
        "#productDetails_techSpec_section_1 > tbody"
      );

      let productWeight = "N/A";

      if (tbodyElement) {
        // Find all th elements within the tbody
        const thElements = await tbodyElement.$$(
          "th.a-color-secondary.a-size-base.prodDetSectionEntry"
        );

        // Loop through each th element to find "Item Weight"
        for (const thElement of thElements) {
          const textContent = await newPage.evaluate(
            (element) => element.textContent.trim(),
            thElement
          );
          if (textContent === "Item Weight") {
            // If "Item Weight" is found, get the corresponding td element for the weight
            const tdElement = await thElement.evaluateHandle((th) => {
              const row = th.closest("tr"); //closest("tr") helps to find the nearest ancestor <tr> element of the <th> element.
              return row.querySelector("td.a-size-base.prodDetAttrValue");
            });

            productWeight = await newPage.evaluate(
              (element) => element.textContent.trim(),
              tdElement
            );
            break;
          }
        }
      }

      const productBrandNameElement = await newPage.$(
        "#productDetails_techSpec_section_1 > tbody > tr:nth-child(1) > td"
      );
      const productBrandName = productBrandNameElement
        ? await newPage.evaluate(
            (element) => element.textContent.trim(),
            productBrandNameElement
          )
        : "N/A";

      const productImageElement = await newPage.$("#landingImage");
      const productImage = productImageElement
        ? await newPage.evaluate((element) => element.src, productImageElement)
        : "N/A";

      const productSpecificationElement = await newPage.$(
        "#poExpander > div.a-expander-content.a-expander-partial-collapse-content > div"
      );
      const productSpecification = productSpecificationElement
        ? await newPage.evaluate(
            (element) => element.textContent.trim(),
            productSpecificationElement
          )
        : "N/A";

      await newPage.close();

      return {
        productName,
        productTitle,
        productDescription,
        productCategory,
        productMRP,
        productSellingPrice,
        productDiscount,
        productWeight,
        productBrandName,
        productImage,
        productSpecification,
      };
    } catch (error) {
      console.error("Error during product extraction:", error);
      throw error;
    }
  }
}

module.exports = AmazonScraper;
