import { url, params, template } from "./default/orders.js";
export { url, params, template };
const products = [142623, 185227, 244268];
export const filter = (order) => {
	return products.includes(order?.attributes?.first_order_item?.product_id);
};
export const output = "api/142623.json";