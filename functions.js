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

export const addMinutesToIsoTime = (minutesFromNow) => {
  const date = new Date();
  date.setMinutes(date.getMinutes() + minutesFromNow);
  return date.toISOString();
};
export const expiresIn = (timestamp) => {
  const now = new Date();
  const targetDate = new Date(timestamp);
  const diffMs = targetDate - now; // Difference in milliseconds

  if (diffMs < 0) {
    return ""; // The time has already passed
  }

  const diffMinutes = Math.floor(diffMs / 60000); // Convert milliseconds to minutes
  const diffHours = Math.floor(diffMinutes / 60); // Convert minutes to hours

  if (diffHours > 0) {
    return `expires in ${diffHours}${diffHours === 1 ? " hour" : " hours"}`;
  }
  if (diffMinutes > 0) {
    return `expires in ${diffMinutes}${diffMinutes === 1 ? " minute" : " minutes"}`;
  }
  return ""; // Less than a minute
};
