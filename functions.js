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

export const resolveCreemApiBaseUrl = (apiKey) => {
  if (apiKey.startsWith("creem_test_")) {
    return "https://test-api.creem.io";
  }
  if (apiKey.startsWith("creem_")) {
    return "https://api.creem.io";
  }
  return null;
};

export const isNonEmptyArray = (value) =>
  Array.isArray(value) && value.length > 0;

export const mapProductIds = (productsResponse) =>
  Array.isArray(productsResponse?.items)
    ? productsResponse.items.map((product) => product.id)
    : [];

export const getNextPage = (pagination, currentPage) => {
  const nextPage = pagination?.next_page;
  return nextPage === null || nextPage === undefined
    ? null
    : nextPage || currentPage + 1;
};

export const toStoredDiscountJson = ({
  discountId,
  name,
  code,
  amount,
  expiresAt,
  appliesToProducts,
}) => ({
  data: {
    id: discountId ? String(discountId) : "",
    attributes: {
      name,
      code,
      amount,
      expires_at: expiresAt,
      applies_to_products: appliesToProducts,
    },
  },
});

export const buildPercentageDiscountPayload = ({
  name,
  code,
  amount,
  expiresAt,
  appliesToProducts,
}) => ({
  name,
  code,
  type: "percentage",
  percentage: amount,
  expiry_date: expiresAt,
  duration: "once",
  applies_to_products: appliesToProducts,
});

const buildAuthHeaders = (apiKey) => ({
  "x-api-key": apiKey,
});

const readJsonResponse = async (response) => {
  const body = await response.json();
  return { response, body };
};

export const fetchAllCreemProductIds = async ({
  fetchImpl,
  apiBaseUrl,
  apiKey,
}) => {
  let allProductIds = [];
  let currentPage = 1;

  while (currentPage !== null) {
    const response = await fetchImpl(
      `${apiBaseUrl}/v1/products/search?page_number=${currentPage}&page_size=50`,
      {
        method: "GET",
        headers: buildAuthHeaders(apiKey),
      },
    );

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Failed to fetch products: ${response.status} ${response.statusText} ${errorBody}`,
      );
    }

    const data = await response.json();
    allProductIds.push(...mapProductIds(data));
    currentPage = getNextPage(data.pagination, currentPage);
  }

  return allProductIds;
};

export const createCreemDiscount = async ({
  fetchImpl,
  apiBaseUrl,
  apiKey,
  payload,
}) => {
  const response = await fetchImpl(`${apiBaseUrl}/v1/discounts`, {
    method: "POST",
    headers: {
      ...buildAuthHeaders(apiKey),
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  return readJsonResponse(response);
};
