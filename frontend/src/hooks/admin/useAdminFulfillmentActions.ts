import type { Dispatch, SetStateAction } from 'react'
import { useToast } from '../../components/common/Toast'
import { getApiErrorMessage } from '../../utils/apiError'
import type { FulfillmentConfirmation } from './adminFulfillmentConfirmation'

type UseAdminFulfillmentActionsParams = {
  onClose: () => void
  onUpdated: () => Promise<void> | void
  setSubmittingKey: Dispatch<SetStateAction<string | null>>
  setIsClosingDisabled: Dispatch<SetStateAction<boolean>>
  setPendingConfirmation: Dispatch<SetStateAction<FulfillmentConfirmation | null>>
}

export function useAdminFulfillmentActions({
  onClose,
  onUpdated,
  setSubmittingKey,
  setIsClosingDisabled,
  setPendingConfirmation,
}: UseAdminFulfillmentActionsParams) {
  const { showToast } = useToast()

  const runAction = async (
    actionKey: string,
    action: () => Promise<unknown>,
    successMessage: string,
  ) => {
    try {
      setSubmittingKey(actionKey)
      setIsClosingDisabled(true)
      await action()
      showToast(successMessage, 'success')
      await onUpdated()
      onClose()
    } catch (error) {
      showToast(getApiErrorMessage(error, 'Gagal memproses mutasi stok'), 'error')
    } finally {
      setSubmittingKey(null)
      setIsClosingDisabled(false)
      setPendingConfirmation(null)
    }
  }

  return { runAction }
}
