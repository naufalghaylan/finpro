type NoProofCopy = {
  title: string
  description: string
  Icon: React.ElementType
}

type NoProofRequiredStateProps = {
  noProofCopy: NoProofCopy
  isCancelled: boolean
}

export function NoProofRequiredState({
  noProofCopy,
  isCancelled,
}: NoProofRequiredStateProps) {
  const Icon = noProofCopy.Icon

  return (
    <div className={`payment-proof-result ${isCancelled ? 'payment-proof-result--cancelled' : ''}`}>
      <Icon aria-hidden="true" />
      <div className="payment-proof-result-content">
        <h3>{noProofCopy.title}</h3>
        <p>{noProofCopy.description}</p>
      </div>
    </div>
  )
}
