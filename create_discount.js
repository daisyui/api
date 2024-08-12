import { writeFileSync } from "bun:fs";

const chance_to_run = 40 / 100;
const discountPercentages = [5, 10, 15, 20, 25];
const discountHours = [1, 2, 3, 4];

const getRandomItemOfArray = (arr) => {
	const randomIndex = Math.floor(Math.random() * arr.length);
	return arr[randomIndex];
};

// Function to generate a random unique string
function generateDiscountCode(length) {
	const characters = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}
function getISODateTime(hoursFromNow) {
	const date = new Date();
	date.setHours(date.getHours() + hoursFromNow);
	return date.toISOString();
}

const discountCode = generateDiscountCode(10); // Generate a 10-character discount code

const apiKey = process.env.LEMONSQUEEZY_API_KEY;
const url = "https://api.lemonsqueezy.com/v1/discounts";
const data = {
	data: {
		type: "discounts",
		attributes: {
			name: "Limited time discount code!",
			code: discountCode,
			amount: getRandomItemOfArray(discountPercentages),
			amount_type: "percent",
			expires_at: getISODateTime(getRandomItemOfArray(discountHours)),
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

if (Math.random() < chance_to_run) {
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
				// Save the response in a JSON file
				writeFileSync("api/discount.json", JSON.stringify(json, null, 2));
				console.log(
					"Discount code created successfully and response saved to api/discount.json",
				);
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
