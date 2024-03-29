import { option } from 'fp-ts'
import { PropsWithChildren, ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { composeClassName } from '../../misc/composeClassName'
import { Panel } from '../Panel/Panel'
import './Modal.scss'

interface Props {
  isOpen: boolean
  onClose: () => void
  framed?: boolean
  className?: string
}

export function Modal(props: PropsWithChildren<Props>) {
  const { isOpen, onClose } = props
  const openClassName = isOpen ? 'open' : ''

  useEffect(() => {
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keyup', onKeyUp)
    } else {
      document.removeEventListener('keyup', onKeyUp)
    }

    return () => {
      document.removeEventListener('keyup', onKeyUp)
    }
  }, [isOpen, onClose])

  return createPortal(
    <div
      className={composeClassName(
        'Modal',
        props.className || '',
        openClassName
      )}
      role="alertdialog"
    >
      <div className="dim" onClick={onClose} />

      <Panel framed={props.framed} actions={option.none}>
        {props.children}
      </Panel>
    </div>,
    document.body
  ) as ReactNode
}
