import fs from "fs/promises";
import path from "path";
import { exec } from "child_process";
import util from "util";
const execPromise = util.promisify(exec);

async function fetchDependentsCount() {
  const command = `curl -s "https://github.com/saadeghi/daisyui/network/dependents" | grep -B 1 '          Repositories' | head -1 | sed 's/ *//;s/,//'`;
  try {
    const { stdout } = await execPromise(command);
    const dependentsCount = parseInt(stdout.trim(), 10);
    if (isNaN(dependentsCount) || dependentsCount === 0) {
      throw new Error("Invalid dependents count");
    }
    return dependentsCount;
  } catch (error) {
    console.error(`Failed to fetch dependents count: ${error.message}`);
    return null;
  }
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

async function updateDependentsCount() {
  const filePath = path.resolve("docs", "stats.json");

  try {
    const dependentsCount = await fetchDependentsCount();
    if (dependentsCount === null || dependentsCount === undefined) {
      console.log("Skipping update due to invalid dependents count.");
      return;
    }

    const fileData = await readStatsFile(filePath);

    if (fileData.dependents_count !== dependentsCount) {
      fileData.dependents_count = dependentsCount;
      await writeStatsFile(filePath, fileData);
      console.log("Dependents count updated.");
    } else {
      console.log("Dependents count has not changed.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

updateDependentsCount();
