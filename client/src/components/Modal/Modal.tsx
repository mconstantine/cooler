import { FC, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { composeClassName } from '../../misc/composeClassName'
import { Panel } from '../Panel/Panel'
import './Modal.scss'

interface Props {
  isOpen: boolean
  onClose: () => void
  framed?: boolean
}

export const Modal: FC<Props> = ({ isOpen, onClose, framed, children }) => {
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
    <div className={composeClassName('Modal', openClassName)}>
      <div className="dim" onClick={onClose} />
      <Panel framed={framed}>{children}</Panel>
    </div>,
    document.body
  )
}
