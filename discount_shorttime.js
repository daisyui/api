import { readFileSync, writeFileSync } from "bun:fs";
import { postToDiscord } from "./post_to_discord.js";
import { config } from "./config.js";
import {
  getRandomValueWithChance,
  generateDiscountCode,
  addMinutesToIsoTime,
  expiresIn,
  resolveCreemApiBaseUrl,
  isNonEmptyArray,
  toStoredDiscountJson,
  buildPercentageDiscountPayload,
  fetchAllCreemProducts,
  selectRandomBundleProductIds,
  createCreemDiscount,
} from "./functions.js";

const creemApiKey = process.env.CREEM_API_KEY || "";
const creemApiBaseUrl = resolveCreemApiBaseUrl(creemApiKey);

const discountSpecialPath = "./docs/api/discount_special.json";
const buildShorttimeDiscountAttributes = () => ({
  name: "Limited time discount code!",
  code: `LTD${generateDiscountCode(9)}`,
  amount: getRandomValueWithChance(config.discountPercentages),
  expiresAt: addMinutesToIsoTime(
    getRandomValueWithChance(config.discountDuration),
  ),
});

const shouldRunDiscountRequest = () => Math.random() < config.chanceToRun;

const shouldShareDiscount = () => Math.random() < config.chanceToShare;

const getApplicableProductIds = (responseBody, fallbackProductIds) =>
  isNonEmptyArray(responseBody?.applies_to_products)
    ? responseBody.applies_to_products
    : fallbackProductIds;

const readDiscountJson = (filePath) =>
  JSON.parse(readFileSync(filePath, "utf-8"));

const isFutureDate = (isoDateString) => new Date(isoDateString) > new Date();

const hasActiveSpecialDiscount = () => {
  try {
    const discountSpecialData = readDiscountJson(discountSpecialPath);
    return isFutureDate(discountSpecialData.data.attributes.expires_at);
  } catch (error) {
    console.error("Error reading discount_special.json:", error);
    return false;
  }
};

const createDiscountMessage = (
  discountAttributes,
) => `🎁 daisyUI Store: short time discount
  Use code \`${discountAttributes.code}\` at checkout to get ${
    discountAttributes.amount
  }% discount on selected products
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

  if (hasActiveSpecialDiscount()) {
    console.log("Special discount exists. Skipping...");
    return;
  }

  if (!shouldRunDiscountRequest()) {
    console.log("skipped");
    return;
  }

  const discountAttributes = buildShorttimeDiscountAttributes();
  const products = await fetchAllCreemProducts({
    fetchImpl: fetch,
    apiBaseUrl: creemApiBaseUrl,
    apiKey: creemApiKey,
  });

  if (!isNonEmptyArray(products)) {
    throw new Error("No Creem products found to apply discount");
  }

  const productIds = selectRandomBundleProductIds(
    products,
    config.activeDiscounts,
  );

  console.log(
    `Fetched ${products.length} products, applying discount to ${productIds.length} product IDs across up to ${config.activeDiscounts} bundles`,
  );

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
    return;
  }

  const storedDiscount = toStoredDiscountJson({
    discountId: body.id,
    name: discountAttributes.name,
    code: discountAttributes.code,
    amount: discountAttributes.amount,
    expiresAt: discountAttributes.expiresAt,
    appliesToProducts: getApplicableProductIds(body, productIds),
  });

  writeFileSync(
    "docs/api/discount_shorttime.json",
    JSON.stringify(storedDiscount, null, 2),
  );
  console.log("Creem discount code created successfully");

  if (!shouldShareDiscount()) {
    console.log("skipped posting to Discord");
    return;
  }

  postToDiscord(config.channelId, createDiscountMessage(discountAttributes));
};

run().catch((error) => {
  console.error("Error:", error);
});
