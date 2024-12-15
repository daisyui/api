import fs from "fs/promises";
import path from "path";

async function fetchNpmDownloadsCountTotal() {
  const response = await fetch(
    "https://api.npmjs.org/downloads/point/2000-01-01:2100-01-01/daisyui",
  );
  if (!response.ok) {
    throw new Error("Failed to fetch total npm downloads count");
  }
  const data = await response.json();
  return data.downloads;
}

async function fetchNpmDownloadsCountWeekly() {
  const response = await fetch(
    "https://api.npmjs.org/downloads/point/last-week/daisyui",
  );
  if (!response.ok) {
    throw new Error("Failed to fetch weekly npm downloads count");
  }
  const data = await response.json();
  return data.downloads;
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

async function updateDownloadsCount() {
  const filePath = path.resolve("docs", "stats.json");

  try {
    const [totalDownloadsCount, weeklyDownloadsCount] = await Promise.all([
      fetchNpmDownloadsCountTotal(),
      fetchNpmDownloadsCountWeekly(),
    ]);
    const fileData = await readStatsFile(filePath);

    let updated = false;

    if (fileData.npm_downloads_count_total !== totalDownloadsCount) {
      fileData.npm_downloads_count_total = totalDownloadsCount;
      updated = true;
    }

    if (fileData.npm_downloads_count_weekly !== weeklyDownloadsCount) {
      fileData.npm_downloads_count_weekly = weeklyDownloadsCount;
      updated = true;
    }

    if (updated) {
      await writeStatsFile(filePath, fileData);
      console.log("Downloads count updated.");
    } else {
      console.log("Downloads count has not changed.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

updateDownloadsCount();
