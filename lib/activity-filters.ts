import type { ActivityCategory } from "@/lib/types";
import { activityCategories } from "@/lib/types";

export type ActivityCategoryFilter = "Semua" | "Preferensi" | ActivityCategory;

export function getActivityCategoryFilterParam(value: string | null): ActivityCategoryFilter | null {
  if (value === "Semua" || value === "Preferensi" || activityCategories.includes(value as ActivityCategory)) {
    return value as ActivityCategoryFilter;
  }

  return null;
}

export function matchesActivityCategoryFilter(
  category: ActivityCategory,
  filter: ActivityCategoryFilter,
  preferredCategories: ActivityCategory[]
) {
  if (filter === "Semua") {
    return true;
  }

  if (filter === "Preferensi") {
    return preferredCategories.includes(category);
  }

  return category === filter;
}
