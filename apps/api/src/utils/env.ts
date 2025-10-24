import "dotenv/config";

export const weights = {
  time: parseFloat(process.env.TIME_RULE_WEIGHT || "0.0"),
  demand: parseFloat(process.env.DEMAND_RULE_WEIGHT || "0.0"),
  inventory: parseFloat(process.env.INVENTORY_RULE_WEIGHT || "0.0"),
};
