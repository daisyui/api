export const getRandomItemOfArray = (arr) => {
	const randomIndex = Math.floor(Math.random() * arr.length);
	return arr[randomIndex];
};

export const getRandomValueWithChance = (obj) => {
	const cumulativeChances = [];
	let cumulativeSum = 0;

	// Calculate cumulative chances
	for (const item of obj) {
		cumulativeSum += item.chance;
		cumulativeChances.push({ value: item.value, cumulative: cumulativeSum });
	}

	// Generate a random number between 0 and the sum of all chances
	const randomNum = Math.random() * cumulativeSum;

	// Determine which value corresponds to the generated random number
	for (const item of cumulativeChances) {
		if (randomNum <= item.cumulative) {
			return item.value;
		}
	}
};

export const generateDiscountCode = (length) => {
	const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
};

export const getISODateTime = (hoursFromNow) => {
	const date = new Date();
	date.setHours(date.getHours() + hoursFromNow);
	return date.toISOString();
};
