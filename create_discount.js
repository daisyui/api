import { writeFileSync } from "bun:fs";
import {
	getRandomValueWithChance,
	generateDiscountCode,
	addMinutesToIsoTime,
} from "./functions.js";

const chanceToRun = 100 / 100;
const discountPercentages = [
	{ value: 5, chance: 25 },
	{ value: 10, chance: 20 },
	{ value: 15, chance: 18 },
	{ value: 20, chance: 15 },
	{ value: 25, chance: 12 },
	{ value: 30, chance: 10 },
];
const discountDuration = [
	{ value: 1 * 60, chance: 20 },
	{ value: 2 * 60, chance: 18 },
	{ value: 3 * 60, chance: 15 },
	{ value: 4 * 60, chance: 12 },
	{ value: 5 * 60, chance: 10 },
	{ value: 5.5 * 60, chance: 10 },
];
const apiKey = process.env.LEMONSQUEEZY_API_KEY;
const url = "https://api.lemonsqueezy.com/v1/discounts";

const data = {
	data: {
		type: "discounts",
		attributes: {
			name: "Limited time discount code!",
			code: `LTD${generateDiscountCode(9)}`,
			amount: getRandomValueWithChance(discountPercentages),
			amount_type: "percent",
			expires_at: addMinutesToIsoTime(
				getRandomValueWithChance(discountDuration),
			),
		},
		relationships: {
			store: {
				data: {
					type: "stores",
					id: "10640",
				},
			},
		},
	},
};

if (Math.random() < chanceToRun) {
	fetch(url, {
		method: "POST",
		headers: {
			Accept: "application/vnd.api+json",
			"Content-Type": "application/vnd.api+json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify(data),
	})
		.then((response) => response.json())
		.then((json) => {
			if (json.data?.id) {
				writeFileSync("api/discount.json", JSON.stringify(json, null, 2));
				console.log("Discount code created successfully JSON");
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
