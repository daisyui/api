import fs from "fs/promises";
import path from "path";

const NPM_PACKAGE_NAME = "daisyui";
const NPM_DOWNLOADS_START_DATE = "2020-11-01";
const NPM_DOWNLOADS_MAX_RANGE_MONTHS = 18;

function formatUtcDate(date) {
  return date.toISOString().slice(0, 10);
}

function subtractUtcMonths(date, months) {
  const result = new Date(date);
  const dayOfMonth = result.getUTCDate();

  result.setUTCDate(1);
  result.setUTCMonth(result.getUTCMonth() - months);

  const lastDayOfMonth = new Date(
    Date.UTC(result.getUTCFullYear(), result.getUTCMonth() + 1, 0),
  ).getUTCDate();

  result.setUTCDate(Math.min(dayOfMonth, lastDayOfMonth));
  return result;
}

function subtractUtcDay(date) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() - 1);
  return result;
}

function getNpmDownloadsDateRanges() {
  const firstDate = new Date(`${NPM_DOWNLOADS_START_DATE}T00:00:00.000Z`);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const ranges = [];
  let rangeEnd = today;
  let rangeStart = subtractUtcMonths(
    rangeEnd,
    NPM_DOWNLOADS_MAX_RANGE_MONTHS,
  );

  while (rangeEnd >= firstDate) {
    if (rangeStart < firstDate) {
      rangeStart = firstDate;
    }

    ranges.push({
      start: formatUtcDate(rangeStart),
      end: formatUtcDate(rangeEnd),
    });

    rangeEnd = subtractUtcDay(rangeStart);
    rangeStart = subtractUtcMonths(
      rangeStart,
      NPM_DOWNLOADS_MAX_RANGE_MONTHS,
    );
  }

  return ranges;
}

async function fetchNpmDownloadsCount({ start, end }) {
  const response = await fetch(
    `https://api.npmjs.org/downloads/point/${start}:${end}/${NPM_PACKAGE_NAME}`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch npm downloads count for ${start} to ${end} (${response.status})`,
    );
  }

  const data = await response.json();

  if (data.start !== start || data.end !== end) {
    throw new Error(
      `npm returned ${data.start} to ${data.end} for the requested range ${start} to ${end}`,
    );
  }

  return data.downloads;
}

async function fetchNpmDownloadsCountTotal() {
  const downloadsCounts = await Promise.all(
    getNpmDownloadsDateRanges().map(fetchNpmDownloadsCount),
  );

  return downloadsCounts.reduce((total, downloads) => total + downloads, 0);
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
