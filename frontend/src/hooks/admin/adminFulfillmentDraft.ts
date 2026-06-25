import type { FulfillmentRequirement } from '../../types/order'

export type FulfillmentDraft = {
  sourceStoreId: number | ''
  quantity: number
  notes: string
}

export const createRequestDrafts = (requirements: FulfillmentRequirement[]) => Object.fromEntries(
  requirements
    .filter((requirement) => requirement.remainingQuantity > 0)
    .map((requirement) => [
      requirement.productId,
      {
        sourceStoreId: '' as const,
        quantity: requirement.remainingQuantity,
        notes: '',
      },
    ]),
) as Record<number, FulfillmentDraft>

export const getFulfillmentRequestQuantityLimit = (
  requirement: FulfillmentRequirement,
  draft?: FulfillmentDraft,
) => {
  const selectedSource = requirement.sources.find(
    (source) => source.storeId === draft?.sourceStoreId,
  )

  return Math.min(
    requirement.remainingQuantity,
    selectedSource?.availableQuantity ?? requirement.remainingQuantity,
  )
}

export const isFulfillmentDraftValid = (
  requirement: FulfillmentRequirement,
  draft?: FulfillmentDraft,
) => {
  if (!draft || !draft.sourceStoreId || draft.quantity < 1) return false

  const source = requirement.sources.find((option) => option.storeId === draft.sourceStoreId)
  return Boolean(
    source &&
    draft.quantity <= requirement.remainingQuantity &&
    draft.quantity <= source.availableQuantity,
  )
}

export const createFulfillmentRequests = (
  requirements: FulfillmentRequirement[],
  drafts: Record<number, FulfillmentDraft>,
) => requirements.map((requirement) => {
  const draft = drafts[requirement.productId]

  return {
    sourceStoreId: Number(draft.sourceStoreId),
    productId: requirement.productId,
    quantity: Math.floor(draft.quantity),
    notes: draft.notes.trim() || undefined,
  }
})
