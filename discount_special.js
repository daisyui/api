import { writeFileSync } from "bun:fs";
import { postToDiscord } from "./post_to_discord.js";
import { config } from "./config.js";
import {
  generateDiscountCode,
  addMinutesToIsoTime,
  expiresIn,
  resolveCreemApiBaseUrl,
  isNonEmptyArray,
  toStoredDiscountJson,
  buildPercentageDiscountPayload,
  fetchAllCreemProductIds,
  createCreemDiscount,
} from "./functions.js";

const creemApiKey = process.env.CREEM_API_KEY || "";
const creemApiBaseUrl = resolveCreemApiBaseUrl(creemApiKey);

const args = process.argv.slice(2);
const requestedProductIds = [...new Set((args[4] || "").split(/[\s,]+/).filter(Boolean))];

const discountAttributes = {
  name: args[2],
  bannerText: args[5] || "",
  bannerUrl: args[6] || "/store/",
  productScope: requestedProductIds.length ? "selected products" : "all products",
  code: args[3] || `SPC${generateDiscountCode(9)}`,
  amount: Number.parseInt(args[0]),
  expiresAt: addMinutesToIsoTime(Number.parseInt(args[1]) * 60 * 24),
};

const getApplicableProductIds = (responseBody, fallbackProductIds) =>
  isNonEmptyArray(responseBody?.applies_to_products)
    ? responseBody.applies_to_products
    : fallbackProductIds;

const createDiscountMessage = (discountAttributes) =>
  `🎁 daisyUI Store: ${discountAttributes.name}
Use code \`${discountAttributes.code}\` at checkout to get ${
    discountAttributes.amount
  }% discount on ${discountAttributes.productScope}
${expiresIn(discountAttributes.expiresAt)}
https://daisyui.com/store`;

const assertCreemApiKeyFormat = () => {
  if (!creemApiBaseUrl) {
    throw new Error(
      "Invalid CREEM_API_KEY prefix. Expected creem_ or creem_test_",
    );
  }
};

const run = async () => {
  assertCreemApiKeyFormat();

  if (requestedProductIds.some((id) => !/^prod_[A-Za-z0-9]+$/.test(id))) {
    throw new Error("Invalid product ID. Use Creem product IDs that start with prod_.");
  }

  const productIds = requestedProductIds.length
    ? requestedProductIds
    : await fetchAllCreemProductIds({
        fetchImpl: fetch,
        apiBaseUrl: creemApiBaseUrl,
        apiKey: creemApiKey,
      });

  if (!isNonEmptyArray(productIds)) {
    throw new Error("No Creem products found to apply discount");
  }

  console.log(`Using ${productIds.length} Creem product IDs`);

  const payload = buildPercentageDiscountPayload({
    name: discountAttributes.name,
    code: discountAttributes.code,
    amount: discountAttributes.amount,
    expiresAt: discountAttributes.expiresAt,
    appliesToProducts: productIds,
  });

  const { response, body } = await createCreemDiscount({
    fetchImpl: fetch,
    apiBaseUrl: creemApiBaseUrl,
    apiKey: creemApiKey,
    payload,
  });

  if (!response.ok || !body.id) {
    console.error("Failed to create Creem discount:", body);
    if (response.status === 403) {
      console.error("403 Forbidden - Check:");
      console.error("- CREEM_API_KEY format is valid:", !!creemApiBaseUrl);
    }
    throw new Error("Creem discount creation failed");
  }

  const storedDiscount = toStoredDiscountJson({
    discountId: body.id,
    name: discountAttributes.name,
    code: discountAttributes.code,
    amount: discountAttributes.amount,
    expiresAt: discountAttributes.expiresAt,
    appliesToProducts: getApplicableProductIds(body, productIds),
  });

  storedDiscount.data.attributes.banner_text = discountAttributes.bannerText;
  storedDiscount.data.attributes.banner_url = discountAttributes.bannerUrl;

  writeFileSync(
    "docs/api/discount_special.json",
    JSON.stringify(storedDiscount, null, 2),
  );
  console.log("Creem discount code created successfully");

  postToDiscord(config.channelId, createDiscountMessage(discountAttributes));
};

run().catch((error) => {
  console.error("Error:", error);
  process.exitCode = 1;
});
