import { writeFileSync } from "bun:fs";

const files = ["./source/142623.js", "./source/144550.js"];

const sources = files.map(async (path) => {
	const module = await import(path);
	return {
		urls: module.url,
		params: module.params,
		template: module.template,
		filter: module.filter,
		output: module.output,
	};
});

Promise.all(sources)
	.then(async (source) => {
		for (const { urls, params, template, filter, output } of source) {
			const fetchPromises = urls.map((url) =>
				fetch(url, params).then((response) => response.json()),
			);
			const results = await Promise.all(fetchPromises);
			const mergedData = results
				.flatMap((obj) => obj.data)
				.filter(filter)
				.map(template);
			const formattedData = {
				cached_at: new Date().toISOString(),
				data: mergedData,
			};
			writeFileSync(output, JSON.stringify(formattedData), "utf-8");
			console.log(`Data saved to ${output}`);
		}
	})
	.catch((error) => {
		console.error("Error importing modules:", error);
	});
