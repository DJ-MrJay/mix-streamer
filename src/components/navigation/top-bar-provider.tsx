'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

import MixGrid from '@/components/mix/mix-grid'
import TopBar from '@/components/navigation/top-bar'
import type { MixRecord } from '@/types/mix'

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
  searchMixes = [],
}: {
  children: React.ReactNode
  searchMixes?: MixRecord[]
}) {
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState('')
  const [isGlobalSearchActive, setIsGlobalSearchActive] = useState(false)
  const [hasGlobalSearchQuery, setHasGlobalSearchQuery] = useState(false)
  const returnStateRef = useRef<{ pathname: string; scrollY: number } | null>(
    null
  )

  const restoreScroll = useCallback(() => {
    const returnState = returnStateRef.current

    if (!returnState) {
      return
    }

    returnStateRef.current = null

    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        if (window.location.pathname === returnState.pathname) {
          window.scrollTo({ top: returnState.scrollY })
        }
      })
    })
  }, [])

  const closeGlobalSearch = useCallback(() => {
    setIsGlobalSearchActive(false)
    setHasGlobalSearchQuery(false)
    restoreScroll()
  }, [restoreScroll])

  const handleSearchOpen = useCallback(() => {
    if (pathname === '/' || isGlobalSearchActive) {
      return
    }

    returnStateRef.current = {
      pathname,
      scrollY: window.scrollY,
    }
    setIsGlobalSearchActive(true)
    setHasGlobalSearchQuery(false)

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0 })
    })
  }, [isGlobalSearchActive, pathname])

  const handleSearchValueChange = useCallback(
    (value: string) => {
      setSearchValue(value)

      if (!isGlobalSearchActive) {
        return
      }

      if (value.trim()) {
        setHasGlobalSearchQuery(true)
        return
      }

      if (hasGlobalSearchQuery) {
        closeGlobalSearch()
      }
    },
    [closeGlobalSearch, hasGlobalSearchQuery, isGlobalSearchActive]
  )

  useEffect(() => {
    if (!isGlobalSearchActive) {
      return
    }

    if (returnStateRef.current?.pathname !== pathname) {
      window.requestAnimationFrame(() => {
        returnStateRef.current = null
        setIsGlobalSearchActive(false)
        setHasGlobalSearchQuery(false)
        setSearchValue('')
      })
    }
  }, [isGlobalSearchActive, pathname])

  return (
    <TopBarSearchContext.Provider
      value={{ searchValue, setSearchValue: handleSearchValueChange }}
    >
      <TopBar
        key={pathname}
        searchValue={searchValue}
        onSearchValueChange={handleSearchValueChange}
        onSearchOpen={handleSearchOpen}
        onSearchClose={closeGlobalSearch}
      />
      {isGlobalSearchActive ? (
        <main className="flex-1 pb-32">
          <MixGrid mixes={searchMixes} />
        </main>
      ) : (
        children
      )}
    </TopBarSearchContext.Provider>
  )
}
