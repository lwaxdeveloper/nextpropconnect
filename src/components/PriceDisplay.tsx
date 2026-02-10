"use client";

const formatter = new Intl.NumberFormat("en-ZA", {
  style: "currency",
  currency: "ZAR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatPrice(price: number): string {
  return formatter.format(price);
}

export default function PriceDisplay({
  price,
  listingType,
  className = "",
}: {
  price: number;
  listingType?: string;
  className?: string;
}) {
  return (
    <span className={className}>
      {formatPrice(price)}
      {listingType === "rent" && (
        <span className="text-sm font-normal text-gray-500"> /month</span>
      )}
    </span>
  );
}
