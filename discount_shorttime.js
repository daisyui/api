import { readFileSync, writeFileSync } from "bun:fs";
import { postToDiscord } from "./post_to_discord.js";
import { config } from "./config.js";
import {
  getRandomValueWithChance,
  generateDiscountCode,
  addMinutesToIsoTime,
  expiresIn,
} from "./functions.js";

const discountSpecialPath = "./docs/api/discount_special.json";
let skipRequest = false;

try {
  const discountSpecialData = JSON.parse(
    readFileSync(discountSpecialPath, "utf-8"),
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
        getRandomValueWithChance(config.discountDuration),
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
    .then((json) => {
      if (json.data?.id) {
        writeFileSync(
          "docs/api/discount_shorttime.json",
          JSON.stringify(json, null, 2),
        );
        console.log("Discount code created successfully");
        if (Math.random() < config.chanceToShare) {
          postToDiscord(
            config.channelId,
            `🎁 daisyUI Store: short time discount
  Use code \`${json.data.attributes.code}\` at checkout to get ${json.data.attributes.amount}% discount on all products
  ${expiresIn(json.data.attributes.expires_at)}
  https://daisyui.com/store`,
          );
        } else {
          console.log("skipped posting to Discord");
        }
      } else {
        console.error("Failed to create discount code:", json);
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
} else {
  console.log("skipped");
}
