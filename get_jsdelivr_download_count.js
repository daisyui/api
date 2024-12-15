import fs from "fs/promises";
import path from "path";

async function fetchJsDelivrDownloadsCount() {
  const response = await fetch(
    "https://data.jsdelivr.com/v1/package/npm/daisyui/stats?period=week",
  );
  if (!response.ok) {
    throw new Error("Failed to fetch jsDelivr downloads count");
  }
  const data = await response.json();
  return data.total;
}

async function readStatsFile(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, "utf-8");
    return JSON.parse(fileContent);
  } catch (error) {
    if (error.code === "ENOENT") {
      return {};
    }
    throw error;
  }
}

async function writeStatsFile(filePath, data) {
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
}

async function updateJsDelivrDownloadsCount() {
  const filePath = path.resolve("docs", "stats.json");

  try {
    const downloadsCount = await fetchJsDelivrDownloadsCount();
    const fileData = await readStatsFile(filePath);

    if (fileData.jsdelivr_downloads_count_weekly !== downloadsCount) {
      fileData.jsdelivr_downloads_count_weekly = downloadsCount;
      await writeStatsFile(filePath, fileData);
      console.log("jsDelivr downloads count updated.");
    } else {
      console.log("jsDelivr downloads count has not changed.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

updateJsDelivrDownloadsCount();
