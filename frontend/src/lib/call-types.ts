import { useCallback, useEffect, useState } from "react"

import { createCallType, listCallTypes } from "@/api/sdk.gen"
import type { CallType } from "@/api/types.gen"

export type CallTypeDraft = {
  id: string
  name: string
  description: string
  durationMinutes: number
}

type UseCallTypes = {
  items: CallType[]
  error?: string
  create: (draft: CallTypeDraft) => Promise<boolean>
}

type ListResult = Awaited<ReturnType<typeof listCallTypes>>

// useCallTypes — список и создание Типов звонков через сгенерированный
// hey-api клиент. Ошибки сервера (409/422 + ErrorBody) показываются
// владельцу как есть.
export function useCallTypes(): UseCallTypes {
  const [items, setItems] = useState<CallType[]>([])
  const [error, setError] = useState<string | undefined>(undefined)

  const applyLoaded = useCallback((result: ListResult) => {
    if (result.error) {
      setError("Не удалось загрузить список типов звонков")
      return
    }
    setError(undefined)
    setItems(result.data.items ?? [])
  }, [])

  useEffect(() => {
    let cancelled = false
    listCallTypes().then((result) => {
      if (!cancelled) {
        applyLoaded(result)
      }
    })
    return () => {
      cancelled = true
    }
  }, [applyLoaded])

  const create = useCallback(
    async (draft: CallTypeDraft) => {
      const { error } = await createCallType({ body: draft })
      if (error) {
        setError(error.message)
        return false
      }
      applyLoaded(await listCallTypes())
      return true
    },
    [applyLoaded],
  )

  return { items, error, create }
}
