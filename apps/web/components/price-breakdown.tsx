import { PriceBreakdown as PriceBreakdownType } from "../lib/types";

interface PriceBreakdownProps {
  breakdown: PriceBreakdownType;
}

export function PriceBreakdown({ breakdown }: PriceBreakdownProps) {
  const { basePrice, currentPrice, priceFloor, priceCeiling, adjustments } =
    breakdown;

  const adjustmentsList = [
    {
      label: adjustments.timeBased.description,
      amount: basePrice * adjustments.timeBased.contribution,
      isActive: adjustments.timeBased.multiplier > 0,
    },
    {
      label: adjustments.demandBased.description,
      amount: basePrice * adjustments.demandBased.contribution,
      isActive: adjustments.demandBased.multiplier > 0,
      extraInfo: `${adjustments.demandBased.bookingsLastHour} bookings in last hour`,
    },
    {
      label: adjustments.inventoryBased.description,
      amount: basePrice * adjustments.inventoryBased.contribution,
      isActive: adjustments.inventoryBased.multiplier > 0,
      extraInfo: `${adjustments.inventoryBased.remainingTickets} tickets remaining`,
    },
  ];

  return (
    <div className="border border-slate-200 rounded-lg bg-white overflow-hidden">
      <div className="p-6 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">
          Price Breakdown
        </h3>
        <p className="text-sm text-slate-600">How the price is calculated</p>
      </div>

      <div className="p-6 space-y-3">
        <div className="flex justify-between items-center pb-3 border-b border-slate-200">
          <span className="text-slate-600">Base Price</span>
          <span className="font-medium text-slate-900">
            ${basePrice.toFixed(2)}
          </span>
        </div>

        {adjustmentsList.map((item, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between items-center text-sm">
              <div className="flex-1">
                <span className="text-slate-600">{item.label}</span>
                {item.extraInfo && (
                  <p className="text-xs text-slate-500 mt-0.5">
                    {item.extraInfo}
                  </p>
                )}
              </div>
              <span
                className={
                  item.isActive ? "text-red-600 font-medium" : "text-slate-400"
                }
              >
                {item.isActive ? "+" : ""}${item.amount.toFixed(2)}
              </span>
            </div>
          </div>
        ))}

        <div className="flex justify-between items-center pt-3 border-t border-slate-200 font-semibold text-lg text-slate-900">
          <span>Current Price</span>
          <span>${currentPrice.toFixed(2)}</span>
        </div>

        <div className="pt-3 border-t border-slate-100 space-y-2">
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Price Floor</span>
            <span>${priceFloor.toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-xs text-slate-500">
            <span>Price Ceiling</span>
            <span>${priceCeiling.toFixed(2)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
