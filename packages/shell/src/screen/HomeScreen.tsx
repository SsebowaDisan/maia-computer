import { useState } from 'react'

import { Input } from '../component/ui/Input'

interface HomeScreenProps {
  onSubmitTask: (description: string) => Promise<void>
}

export function HomeScreen({ onSubmitTask }: HomeScreenProps) {
  const [description, setDescription] = useState('')

  return (
    <div className="flex h-full w-full items-center justify-center px-8 pb-24">
      <form
        className="w-full max-w-[560px]"
        onSubmit={(event) => {
          event.preventDefault()
          const nextDescription = description.trim()
          if (!nextDescription) {
            return
          }

          void onSubmitTask(nextDescription)
          setDescription('')
        }}
      >
        <Input
          className="h-12 rounded-xl text-base"
          onChange={(event) => {
            setDescription(event.target.value)
          }}
          placeholder="Tell Maia what to do..."
          value={description}
        />
      </form>
    </div>
  )
}
