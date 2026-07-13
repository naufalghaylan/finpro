import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

type AdminModalProps = {
  onClose: () => void
  children: ReactNode | ((closeModal: () => void) => ReactNode)
  busy?: boolean
  requestClose?: boolean
  closeOnBackdrop?: boolean
  labelledBy?: string
  maxWidthClassName?: string
  cardClassName?: string
}

const getFocusableElements = (container: HTMLElement) => Array.from(
  container.querySelectorAll<HTMLElement>(
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
  ),
).filter((element) => !element.hasAttribute('hidden'))

export function AdminModal({
  onClose,
  children,
  busy = false,
  requestClose = false,
  closeOnBackdrop = true,
  labelledBy,
  maxWidthClassName = 'max-w-lg',
  cardClassName = '',
}: AdminModalProps) {
  const [visible, setVisible] = useState(false)
  const [closing, setClosing] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    window.dispatchEvent(new Event('admin-modal-open'))
    return () => {
      window.dispatchEvent(new Event('admin-modal-close'))
    }
  }, [])

  const closeModal = useCallback(() => {
    if (busy || closing) return

    setClosing(true)
    setVisible(false)
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.setTimeout(onClose, reduceMotion ? 0 : 200)
  }, [busy, closing, onClose])

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null
    const body = document.body
    const html = document.documentElement
    const previousBodyOverflow = body.style.overflow
    const previousBodyPaddingRight = body.style.paddingRight
    const previousHtmlOverflow = html.style.overflow
    const scrollbarWidth = window.innerWidth - html.clientWidth

    body.style.overflow = 'hidden'
    html.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      body.style.paddingRight = `${scrollbarWidth}px`
      html.style.setProperty('--scrollbar-width', `${scrollbarWidth}px`)
    }

    const frameId = window.requestAnimationFrame(() => {
      setVisible(true)
      window.requestAnimationFrame(() => cardRef.current?.focus())
    })

    return () => {
      window.cancelAnimationFrame(frameId)
      body.style.overflow = previousBodyOverflow
      body.style.paddingRight = previousBodyPaddingRight
      html.style.overflow = previousHtmlOverflow
      html.style.removeProperty('--scrollbar-width')
      previousFocusRef.current?.focus()
    }
  }, [])

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeModal()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [closeModal])

  useEffect(() => {
    if (!requestClose) return
    const timeoutId = window.setTimeout(closeModal, 0)
    return () => window.clearTimeout(timeoutId)
  }, [closeModal, requestClose])

  const handleDialogKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key !== 'Tab' || !cardRef.current) return

    const focusableElements = getFocusableElements(cardRef.current)
    if (focusableElements.length === 0) {
      event.preventDefault()
      cardRef.current.focus()
      return
    }

    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]
    if (event.shiftKey && document.activeElement === firstElement) {
      event.preventDefault()
      lastElement.focus()
    } else if (!event.shiftKey && document.activeElement === lastElement) {
      event.preventDefault()
      firstElement.focus()
    }
  }

  const content = typeof children === 'function' ? children(closeModal) : children

  return createPortal(
    <>
      <div
        aria-hidden="true"
        onMouseDown={closeOnBackdrop ? closeModal : undefined}
        className={`admin-modal-viewport fixed z-[40] bg-black/45 backdrop-blur-[2px]
                    transition-opacity duration-200 ease-out motion-reduce:transition-none
                    ${visible ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        className="admin-modal-viewport admin-modal-frame fixed pointer-events-none z-[45] flex items-center justify-center overflow-hidden p-4 md:p-8 md:py-10"
      >
        <div
          ref={cardRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          onKeyDown={handleDialogKeyDown}
          className={`admin-modal-card pointer-events-auto flex max-h-full w-full flex-col overflow-hidden
                      rounded-2xl border border-admin-line-soft bg-admin-surface shadow-2xl outline-none
                      transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none
                      ${maxWidthClassName} ${cardClassName}
                      ${visible ? 'scale-100 opacity-100' : 'scale-95 opacity-0'}`}
        >
          {content}
        </div>
      </div>
    </>,
    document.body,
  )
}
