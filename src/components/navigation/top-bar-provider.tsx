'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { usePathname } from 'next/navigation'

import MixGrid from '@/components/mix/mix-grid'
import TopBar from '@/components/navigation/top-bar'
import type { MixRecord, TracklistsBySlug } from '@/types/mix'

type TopBarSearchContextValue = {
  searchValue: string
  setSearchValue: (value: string) => void
  isSearchActive: boolean
  tracklistsBySlug: TracklistsBySlug
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
  tracklistsBySlug = {},
}: {
  children: React.ReactNode
  searchMixes?: MixRecord[]
  tracklistsBySlug?: TracklistsBySlug
}) {
  const pathname = usePathname()
  const [searchValue, setSearchValue] = useState('')
  const [isGlobalSearchActive, setIsGlobalSearchActive] = useState(false)
  const searchResultsRef = useRef<HTMLElement | null>(null)
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

    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0 })
    })
  }, [isGlobalSearchActive, pathname])

  const handleSearchValueChange = useCallback((value: string) => {
    setSearchValue(value)
  }, [])

  useEffect(() => {
    if (!isGlobalSearchActive) {
      return
    }

    if (returnStateRef.current?.pathname !== pathname) {
      window.requestAnimationFrame(() => {
        returnStateRef.current = null
        setIsGlobalSearchActive(false)
        setSearchValue('')
      })
    }
  }, [isGlobalSearchActive, pathname])

  return (
    <TopBarSearchContext.Provider
      value={{
        searchValue,
        setSearchValue: handleSearchValueChange,
        isSearchActive: isGlobalSearchActive,
        tracklistsBySlug,
      }}
    >
      <TopBar
        key={pathname}
        searchValue={searchValue}
        onSearchValueChange={handleSearchValueChange}
        onSearchOpen={handleSearchOpen}
        onSearchClose={closeGlobalSearch}
        searchContentRef={searchResultsRef}
      />
      {isGlobalSearchActive ? (
        <main ref={searchResultsRef} className="flex-1 pb-12">
          <MixGrid mixes={searchMixes} />
        </main>
      ) : (
        children
      )}
    </TopBarSearchContext.Provider>
  )
}
