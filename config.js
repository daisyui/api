export const config = {
  chanceToRun: 90 / 100,
  chanceToShare: 20 / 100,
  discountPercentages: [
    { value: 10, chance: 20 },
    { value: 20, chance: 50 },
    { value: 25, chance: 20 },
    { value: 30, chance: 9 },
    { value: 50, chance: 1 },
  ],
  discountDuration: [
    { value: 3 * 60, chance: 5 },
    { value: 4 * 60, chance: 10 },
    { value: 5 * 60, chance: 35 },
    { value: 6 * 60, chance: 50 },
  ],
  activeDiscounts: 5,
  logFiles: ["./source/142623.js", "./source/144550.js", "./source/351127.js"],
  serverId: "1204154732978118716",
  channelId: "1307311967526191195",
  storeId: "10640",
};
