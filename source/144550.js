import { url, params, template } from "./default/orders.js";
export { url, params, template };
const products = [144550, 208203, 284327, 426780];
export const filter = (order) => {
  return products.includes(order?.attributes?.first_order_item?.product_id);
};
export const output = "docs/api/144550.json";
