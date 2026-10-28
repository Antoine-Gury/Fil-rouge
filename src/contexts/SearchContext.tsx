import { createContext, useContext, useState, type ReactNode } from 'react'

const SearchContext = createContext<{ query: string; setQuery: (query: string) => void } | null>(null)

export function SearchProvider({ children }: { children: ReactNode }) {
  const [query, setQuery] = useState('')
  return <SearchContext.Provider value={{ query, setQuery }}>{children}</SearchContext.Provider>
}

export function useSearch() {
  const context = useContext(SearchContext)
  if (!context) throw new Error('useSearch doit être utilisé dans SearchProvider.')
  return context
}

export function matchesSearch(query: string, ...values: Array<string | number | undefined>) {
  const normalizedQuery = normalize(query)
  return !normalizedQuery || values.some((value) => normalize(String(value ?? '')).includes(normalizedQuery))
}

function normalize(value: string) {
  return value.trim().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase()
}
