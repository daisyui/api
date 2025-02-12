import { writeFileSync } from "bun:fs";
import { postToDiscord } from "./post_to_discord.js";
import { config } from "./config.js";
import {
  generateDiscountCode,
  addMinutesToIsoTime,
  expiresIn,
} from "./functions.js";

const args = process.argv.slice(2);

const data = {
  data: {
    type: "discounts",
    attributes: {
      name: args[2],
      code: args[3] || `SPC${generateDiscountCode(9)}`,
      amount: Number.parseInt(args[0]),
      amount_type: "percent",
      expires_at: addMinutesToIsoTime(Number.parseInt(args[1]) * 60 * 24),
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
      writeFileSync("docs/api/discount_special.json", JSON.stringify(json, null, 2));
      console.log("Discount code created successfully");
      postToDiscord(
        config.channelId,
        `🎁 daisyUI Store: ${args[2]}
Use code \`${json.data.attributes.code}\` at checkout to get ${json.data.attributes.amount}% discount on all products
${expiresIn(json.data.attributes.expires_at)}
https://daisyui.com/store`,
      );
    } else {
      console.error("Failed to create discount code:", json);
    }
  })
  .catch((error) => {
    console.error("Error:", error);
  });
