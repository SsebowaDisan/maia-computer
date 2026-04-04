import { useEffect } from 'react'

import { useIPC } from './useIPC'
import { useSpotlightStore } from '../store/spotlightStore'

export function useSpotlight() {
  const { invoke } = useIPC()
  const isOpen = useSpotlightStore((state) => state.isOpen)
  const query = useSpotlightStore((state) => state.query)
  const results = useSpotlightStore((state) => state.results)
  const setOpen = useSpotlightStore((state) => state.setOpen)
  const setQuery = useSpotlightStore((state) => state.setQuery)
  const setResults = useSpotlightStore((state) => state.setResults)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey && event.code === 'Space') {
        event.preventDefault()
        setOpen(!isOpen)
      }

      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, setOpen])

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      if (!query.trim()) {
        setResults([])
        return
      }

      void invoke('spotlight:search', { query }).then((result) => {
        setResults(result.results)
      })
    }, 300)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [invoke, query, setResults])

  return {
    isOpen,
    query,
    results,
    closeSpotlight: () => {
      setOpen(false)
    },
    openSpotlight: () => {
      setOpen(true)
    },
    setQuery,
  }
}
