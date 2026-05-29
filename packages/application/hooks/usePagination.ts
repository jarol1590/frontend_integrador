import { useState } from 'react'

export function usePagination(totalItems: number, pageSize: number) {
  const [currentPage, setCurrentPage] = useState(1)
  const totalPages = Math.ceil(totalItems / pageSize)

  return {
    currentPage,
    totalPages,
    nextPage: () => setCurrentPage(p => Math.min(p + 1, totalPages)),
    prevPage: () => setCurrentPage(p => Math.max(p - 1, 1)),
    goToPage: (page: number) => setCurrentPage(Math.min(Math.max(page, 1), totalPages)),
  }
}
