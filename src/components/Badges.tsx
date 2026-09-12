// Small presentational components shared by the form and the list.
// No "use client" needed: they have no state or event handlers.

import { CATEGORY_LABELS, PRIORITY_LABELS, type Category, type Priority } from "@/lib/types";

export function PriorityBadge({ priority }: { priority: Priority }) {
  const styles =
    priority === "urgent"
      ? "bg-red-100 text-red-800 ring-red-200"
      : "bg-gray-100 text-gray-700 ring-gray-200";
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${styles}`}>
      {PRIORITY_LABELS[priority]}
    </span>
  );
}

export function CategoryBadge({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-800 ring-1 ring-blue-200">
      {CATEGORY_LABELS[category]}
    </span>
  );
}
