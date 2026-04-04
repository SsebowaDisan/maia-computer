import { useEffect } from 'react'

import { useIPC } from './useIPC'
import { useSpaceStore } from '../store/spaceStore'

export function useSpaces() {
  const { invoke } = useIPC()
  const spaces = useSpaceStore((state) => state.spaces)
  const activeSpaceId = useSpaceStore((state) => state.activeSpaceId)
  const setSpaces = useSpaceStore((state) => state.setSpaces)
  const setActiveSpaceId = useSpaceStore((state) => state.setActiveSpaceId)

  useEffect(() => {
    void invoke('spaces:list', {}).then((result) => {
      setSpaces(result.spaces)
      if (result.spaces[0] && !activeSpaceId) {
        setActiveSpaceId(result.spaces[0].id)
      }
    })
  }, [activeSpaceId, invoke, setActiveSpaceId, setSpaces])

  return {
    activeSpaceId,
    spaces,
    async switchSpace(spaceId: string) {
      await invoke('spaces:switch', { spaceId })
      setActiveSpaceId(spaceId)
    },
  }
}
