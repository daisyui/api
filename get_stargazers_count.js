import fs from "fs/promises";
import path from "path";

async function fetchStargazersCount() {
  const response = await fetch("https://api.github.com/repos/saadeghi/daisyui");
  if (!response.ok) {
    throw new Error("Failed to fetch GitHub stargazers count");
  }
  const data = await response.json();
  return data.stargazers_count;
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

async function updateStargazersCount() {
  const filePath = path.resolve("docs", "stats.json");

  try {
    const stargazersCount = await fetchStargazersCount();
    const fileData = await readStatsFile(filePath);

    if (fileData.stargazers_count !== stargazersCount) {
      fileData.stargazers_count = stargazersCount;
      await writeStatsFile(filePath, fileData);
      console.log("Stargazers count updated.");
    } else {
      console.log("Stargazers count has not changed.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

updateStargazersCount();
