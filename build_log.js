import { writeFileSync } from "bun:fs";

const files = ["./source/142623.js", "./source/144550.js"];

const sources = files.map(async (path) => {
	const module = await import(path);
	return {
		url: module.url,
		params: module.params,
		template: module.template,
		filter: module.filter,
		output: module.output,
	};
});

Promise.all(sources)
	.then((source) => {
		for (const { url, params, template, filter, output } of source) {
			fetch(url, params)
				.then((response) => response.json())
				.then((obj) => {
					const formattedData = {
						cached_at: new Date().toISOString(),
						data: obj.data.filter(filter).map(template),
					};
					writeFileSync(output, JSON.stringify(formattedData), "utf-8");
					console.log(`Data saved to ${output}`);
				})
				.catch((error) => {
					console.error("Error fetching data:", error);
				});
		}
	})
	.catch((error) => {
		console.error("Error importing modules:", error);
	});
