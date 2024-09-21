import { url, params, template } from "./default/orders.js";
export { url, params, template };
const products = [351127];
export const filter = (order) => {
  return products.includes(order?.attributes?.first_order_item?.product_id);
};
export const output = "docs/api/351127.json";
