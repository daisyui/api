import { readFileSync, writeFileSync } from "bun:fs";
import { postToDiscord } from "./post_to_discord.js";
import { config } from "./config.js";
import {
  getRandomValueWithChance,
  generateDiscountCode,
  addMinutesToIsoTime,
  expiresIn,
} from "./functions.js";

// Function to fetch all product IDs from Creem API
async function getAllCreemProductIds() {
  try {
    let allProductIds = [];
    let currentPage = 1;
    let hasMorePages = true;

    while (hasMorePages) {
      const response = await fetch(
        `https://api.creem.io/v1/products/search?page_number=${currentPage}&page_size=50`,
        {
          method: "GET",
          headers: {
            "x-api-key": process.env.CREEM_API_KEY,
          },
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to fetch products: ${response.status} ${response.statusText}`
        );
      }

      const data = await response.json();

      // Extract product IDs from the current page
      const productIds = data.items.map((product) => product.id);
      allProductIds.push(...productIds);

      // Check if there are more pages
      hasMorePages = data.pagination.next_page !== null;
      currentPage = data.pagination.next_page || currentPage + 1;
    }

    console.log(`Fetched ${allProductIds.length} product IDs from Creem API`);
    return allProductIds;
  } catch (error) {
    console.error("Error fetching Creem products:", error);
  }
}

const discountSpecialPath = "./docs/api/discount_special.json";
let skipRequest = false;

try {
  const discountSpecialData = JSON.parse(
    readFileSync(discountSpecialPath, "utf-8")
  );
  const expiresAt = new Date(discountSpecialData.data.attributes.expires_at);
  const now = new Date();

  if (expiresAt > now) {
    console.log("Special discount exists. Skipping...");
    skipRequest = true;
  }
} catch (error) {
  console.error("Error reading discount_special.json:", error);
}

const data = {
  data: {
    type: "discounts",
    attributes: {
      name: "Limited time discount code!",
      code: `LTD${generateDiscountCode(9)}`,
      amount: getRandomValueWithChance(config.discountPercentages),
      amount_type: "percent",
      expires_at: addMinutesToIsoTime(
        getRandomValueWithChance(config.discountDuration)
      ),
    },
    relationships: {
      store: {
        data: {
          type: "stores",
          id: config.storeId,
        },
      },
    },
  },
};

if (!skipRequest && Math.random() < config.chanceToRun) {
  fetch("https://api.lemonsqueezy.com/v1/discounts", {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
    },
    body: JSON.stringify(data),
  })
    .then((response) => response.json())
    .then(async (json) => {
      if (json.data?.id) {
        writeFileSync(
          "docs/api/discount_shorttime.json",
          JSON.stringify(json, null, 2)
        );
        console.log("LemonSqueezy discount code created successfully");

        // Fetch all product IDs from Creem API
        const productIds = await getAllCreemProductIds();

        // Create the same discount on Creem
        const creemData = {
          name: json.data.attributes.name,
          code: json.data.attributes.code,
          type: "percentage",
          percentage: json.data.attributes.amount,
          expiry_date: json.data.attributes.expires_at,
          duration: "once",
          applies_to_products: productIds,
        };

        fetch("https://api.creem.io/v1/discounts", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.CREEM_API_KEY,
          },
          body: JSON.stringify(creemData),
        })
          .then((response) => {
            return response.json();
          })
          .then((creemResult) => {
            if (creemResult.id) {
              console.log("Creem discount code created successfully");
            } else {
              console.error("Failed to create Creem discount:", creemResult);
              if (creemResult.status === 403) {
                console.error("403 Forbidden - Check:");
                console.error(
                  "- CREEM_API_KEY is set:",
                  !!process.env.CREEM_API_KEY
                );
                console.error("- Product IDs count:", productIds.length);
                console.error(
                  "- Try test endpoint: https://test-api.creem.io/v1/discounts"
                );
              }
            }
          })
          .catch((error) => {
            console.error("Error creating Creem discount:", error);
          });

        if (Math.random() < config.chanceToShare) {
          postToDiscord(
            config.channelId,
            `🎁 daisyUI Store: short time discount
  Use code \`${json.data.attributes.code}\` at checkout to get ${
              json.data.attributes.amount
            }% discount on all products
  ${expiresIn(json.data.attributes.expires_at)}
  https://daisyui.com/store`
          );
        } else {
          console.log("skipped posting to Discord");
        }
      } else {
        console.error("Failed to create LemonSqueezy discount code:", json);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
} else {
  console.log("skipped");
}
