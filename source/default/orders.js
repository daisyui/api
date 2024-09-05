export const url = [
  "https://api.lemonsqueezy.com/v1/orders?page[size]=100",
  "https://api.lemonsqueezy.com/v1/orders?page[size]=100&page[number]=2",
  "https://api.lemonsqueezy.com/v1/orders?page[size]=100&page[number]=3",
];
export const params = {
  headers: {
    Accept: "application/vnd.api+json",
    "Content-type": "application/vnd.api+json",
    Authorization: `Bearer ${process.env.LEMONSQUEEZY_API_KEY}`,
  },
};
export const template = (order) => ({
  attributes: {
    created_at: order?.attributes?.created_at,
    discount_total_usd: order?.attributes?.discount_total_usd,
    first_order_item: {
      product_name: order?.attributes?.first_order_item?.product_name,
      variant_name: order?.attributes?.first_order_item?.variant_name,
    },
    refunded: order?.attributes?.refunded,
    subtotal_usd: order?.attributes?.subtotal_usd,
  },
});
