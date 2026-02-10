const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  active: { label: "For Sale", bg: "bg-green-100", text: "text-green-700" },
  sale: { label: "For Sale", bg: "bg-green-100", text: "text-green-700" },
  rent: { label: "To Rent", bg: "bg-blue-100", text: "text-blue-700" },
  sold: { label: "Sold", bg: "bg-red-100", text: "text-red-700" },
  rented: { label: "Rented", bg: "bg-orange-100", text: "text-orange-700" },
  draft: { label: "Draft", bg: "bg-gray-100", text: "text-gray-600" },
  deleted: { label: "Deleted", bg: "bg-red-100", text: "text-red-500" },
};

export default function StatusBadge({
  status,
  listingType,
  size = "sm",
}: {
  status: string;
  listingType?: string;
  size?: "sm" | "md";
}) {
  // For active listings, show the listing type instead
  const key =
    status === "active" && listingType ? listingType : status;
  const config = statusConfig[key] || statusConfig.draft;

  const sizeClass =
    size === "md"
      ? "px-3 py-1 text-sm"
      : "px-2 py-0.5 text-xs";

  return (
    <span
      className={`inline-flex items-center rounded-full font-semibold ${config.bg} ${config.text} ${sizeClass}`}
    >
      {config.label}
    </span>
  );
}
