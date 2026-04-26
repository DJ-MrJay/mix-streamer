'use client'

import { createContext, useContext, useState } from 'react'

import TopBar from '@/components/navigation/top-bar'

type TopBarSearchContextValue = {
  searchValue: string
  setSearchValue: (value: string) => void
}

const TopBarSearchContext = createContext<TopBarSearchContextValue | null>(null)

export function useTopBarSearch() {
  const context = useContext(TopBarSearchContext)

  if (!context) {
    throw new Error('useTopBarSearch must be used within TopBarProvider')
  }

  return context
}

export default function TopBarProvider({
  children,
}: {
  children: React.ReactNode
}) {
  const [searchValue, setSearchValue] = useState('')

  return (
    <TopBarSearchContext.Provider value={{ searchValue, setSearchValue }}>
      <TopBar
        searchValue={searchValue}
        onSearchValueChange={setSearchValue}
      />
      {children}
    </TopBarSearchContext.Provider>
  )
}
