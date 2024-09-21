import { writeFileSync } from "bun:fs";
import { config } from "./config.js";

const sources = config.logFiles.map(async (path) => {
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
  .then(async (sources) => {
    const allFetchPromises = sources.flatMap(({ urls, params }) =>
      urls.map((url) => fetch(url, params).then((response) => response.json()))
    );

    const allResults = await Promise.all(allFetchPromises);

    let resultIndex = 0;
    for (const { urls, template, filter, output } of sources) {
      const results = allResults.slice(resultIndex, resultIndex + urls.length);
      resultIndex += urls.length;

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
