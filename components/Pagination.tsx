"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppLanguage } from "@/lib/types";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  startItem: number;
  endItem: number;
  onPageChange: (page: number) => void;
  language?: AppLanguage;
}

export function Pagination({
  currentPage,
  totalPages,
  totalItems,
  startItem,
  endItem,
  onPageChange,
  language = "en"
}: PaginationProps) {
  if (totalItems === 0) {
    return null;
  }

  const pages = Array.from({ length: totalPages }, (_, index) => index + 1);
  const canGoPrevious = currentPage > 1;
  const canGoNext = currentPage < totalPages;

  return (
    <nav
      className="flex flex-col gap-3 rounded border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm sm:flex-row sm:items-center sm:justify-between"
      aria-label={language === "id" ? "Navigasi halaman" : "Page navigation"}
    >
      <p className="text-slate-600">
        {language === "id" ? "Menampilkan" : "Showing"} <span className="font-semibold text-slate-900">{startItem}-{endItem}</span> {language === "id" ? "dari" : "of"}{" "}
        <span className="font-semibold text-slate-900">{totalItems}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={!canGoPrevious}
          className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={language === "id" ? "Halaman sebelumnya" : "Previous page"}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        {pages.map((page) => (
          <button
            key={page}
            type="button"
            onClick={() => onPageChange(page)}
            aria-current={page === currentPage ? "page" : undefined}
            className={cn(
              "inline-flex h-9 min-w-9 items-center justify-center rounded border px-3 text-sm font-semibold",
              page === currentPage
                ? "border-teal-700 bg-teal-700 text-white"
                : "border-slate-200 text-slate-700 hover:bg-slate-100"
            )}
          >
            {page}
          </button>
        ))}

        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={!canGoNext}
          className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label={language === "id" ? "Halaman berikutnya" : "Next page"}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  );
}
