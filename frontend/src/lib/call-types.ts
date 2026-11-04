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

const LOAD_ERROR = "Не удалось загрузить список типов звонков"

// useCallTypes — список и создание Типов звонков через сгенерированный
// hey-api клиент. Ошибки создания (409/422 + ErrorBody) показываются
// владельцу как есть.
export function useCallTypes(): UseCallTypes {
  const [items, setItems] = useState<CallType[]>([])
  const [error, setError] = useState<string | undefined>(undefined)

  const load = useCallback(async () => {
    const { data } = await listCallTypes()
    if (!data) {
      setError(LOAD_ERROR)
      return
    }
    setError(undefined)
    setItems(data.items ?? [])
  }, [])

  // setState — только в .then/.catch-колбэках, не в теле эффекта
  // (react-hooks/set-state-in-effect).
  useEffect(() => {
    let cancelled = false
    listCallTypes().then(
      ({ data }) => {
        if (cancelled) {
          return
        }
        if (!data) {
          setError(LOAD_ERROR)
          return
        }
        setError(undefined)
        setItems(data.items ?? [])
      },
      () => {
        if (!cancelled) {
          setError(LOAD_ERROR)
        }
      },
    )
    return () => {
      cancelled = true
    }
  }, [])

  const create = useCallback(
    async (draft: CallTypeDraft) => {
      const { error } = await createCallType({ body: draft })
      if (error) {
        setError(error.message)
        return false
      }
      setError(undefined)
      await load()
      return true
    },
    [load],
  )

  return { items, error, create }
}
