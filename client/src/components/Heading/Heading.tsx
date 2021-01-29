import { FC } from 'react'
import './Heading.scss'
import * as t from 'io-ts'
import { Color, LocalizedString } from '../../globalDomain'
import { pipe } from 'fp-ts/function'
import { composeClassName } from '../../misc/composeClassName'

export const HeadingSize = t.keyof({
  40: true,
  36: true,
  32: true,
  27: true,
  24: true,
  21: true
})
export type HeadingSize = t.TypeOf<typeof HeadingSize>

function foldHeadingSize<T>(
  when40: () => T,
  when36: () => T,
  when32: () => T,
  when27: () => T,
  when24: () => T,
  when21: () => T
): (size: HeadingSize) => T {
  return size => {
    switch (size) {
      case 40:
        return when40()
      case 36:
        return when36()
      case 32:
        return when32()
      case 27:
        return when27()
      case 24:
        return when24()
      case 21:
        return when21()
    }
  }
}

interface Props {
  size: HeadingSize
  color?: Color
  className?: string
  children: LocalizedString
}

export const Heading: FC<Props> = props => {
  const color = props.color || 'default'

  return pipe(
    props.size,
    foldHeadingSize(
      () => (
        <h1
          className={composeClassName('Heading', color, props.className || '')}
        >
          {props.children}
        </h1>
      ),
      () => (
        <h2
          className={composeClassName('Heading', color, props.className || '')}
        >
          {props.children}
        </h2>
      ),
      () => (
        <h3
          className={composeClassName('Heading', color, props.className || '')}
        >
          {props.children}
        </h3>
      ),
      () => (
        <h4
          className={composeClassName('Heading', color, props.className || '')}
        >
          {props.children}
        </h4>
      ),
      () => (
        <h5
          className={composeClassName('Heading', color, props.className || '')}
        >
          {props.children}
        </h5>
      ),
      () => (
        <h6
          className={composeClassName('Heading', color, props.className || '')}
        >
          {props.children}
        </h6>
      )
    )
  )
}
