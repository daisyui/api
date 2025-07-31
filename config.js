export const config = {
  chanceToRun: 85 / 100,
  chanceToShare: 15 / 100,
  discountPercentages: [
    { value: 5, chance: 40 },
    { value: 10, chance: 40 },
    { value: 15, chance: 10 },
    { value: 20, chance: 4 },
    { value: 50, chance: 1 },
  ],
  discountDuration: [
    { value: 3 * 60, chance: 40 },
    { value: 4 * 60, chance: 30 },
    { value: 5 * 60, chance: 20 },
    { value: 6 * 60, chance: 10 },
  ],
  logFiles: ["./source/142623.js", "./source/144550.js", "./source/351127.js"],
  serverId: "1204154732978118716",
  channelId: "1307311967526191195",
  storeId: "10640",
  creem: {
    productIds: ["prod_5xzyjeXXL2rE47EtvN4ea4"],
  },
};
