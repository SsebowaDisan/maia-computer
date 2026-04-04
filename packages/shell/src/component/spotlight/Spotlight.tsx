import { AnimatePresence, motion } from 'framer-motion'

import type { SearchResultGroup } from '@maia/shared'

import { SpotlightInput } from './SpotlightInput'
import { SpotlightResults } from './SpotlightResults'

interface SpotlightProps {
  isOpen: boolean
  onClose: () => void
  onQueryChange: (query: string) => void
  onSelect: (appId: string) => void
  query: string
  results: SearchResultGroup[]
}

export function Spotlight({
  isOpen,
  onClose,
  onQueryChange,
  onSelect,
  query,
  results,
}: SpotlightProps) {
  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[60] bg-black/60 px-6 pt-24"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            animate={{ opacity: 1, scale: 1 }}
            className="mx-auto w-full max-w-[600px]"
            initial={{ opacity: 0, scale: 0.9 }}
            onClick={(event) => {
              event.stopPropagation()
            }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            <SpotlightInput onChange={onQueryChange} value={query} />
            <SpotlightResults onSelect={onSelect} results={results} />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
