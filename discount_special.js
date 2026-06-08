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

const discountAttributes = {
  name: args[2],
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
  }% discount on all products
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

  const productIds = await fetchAllCreemProductIds({
    fetchImpl: fetch,
    apiBaseUrl: creemApiBaseUrl,
    apiKey: creemApiKey,
  });

  if (!isNonEmptyArray(productIds)) {
    throw new Error("No Creem products found to apply discount");
  }

  console.log(`Fetched ${productIds.length} product IDs from Creem API`);

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
    "docs/api/discount_special.json",
    JSON.stringify(storedDiscount, null, 2),
  );
  console.log("Creem discount code created successfully");

  postToDiscord(config.channelId, createDiscountMessage(discountAttributes));
};

run().catch((error) => {
  console.error("Error:", error);
});
