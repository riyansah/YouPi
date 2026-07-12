import type { ActivityCategory } from "@/lib/types";
import { activityCategories } from "@/lib/types";

export type ActivityCategoryFilter = "Semua" | ActivityCategory;

export function getActivityCategoryFilterParam(value: string | null): ActivityCategoryFilter | null {
  if (value === "Semua" || activityCategories.includes(value as ActivityCategory)) {
    return value as ActivityCategoryFilter;
  }

  return null;
}

export function matchesActivityCategoryFilter(category: ActivityCategory, filter: ActivityCategoryFilter) {
  if (filter === "Semua") {
    return true;
  }

  return category === filter;
}
