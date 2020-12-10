import { boolean, option } from 'fp-ts'
import { constNull, pipe } from 'fp-ts/function'
import { Option } from 'fp-ts/Option'
import { FC } from 'react'
import { Color, LocalizedString } from '../../globalDomain'
import { composeClassName } from '../../misc/composeClassName'
import { Icon } from '../Icon/Icon'
import { Label } from '../Label/Label'
import './List.scss'

interface ReadonlyItem {
  label: Option<LocalizedString>
  content: LocalizedString
  description: Option<LocalizedString>
}

interface ItemWithIcon {
  label: Option<LocalizedString>
  content: LocalizedString
  description: Option<LocalizedString>
  icon: string
  iconColor?: Color
}

type Item = ReadonlyItem | ItemWithIcon

function foldItem<T>(
  listType: 'readonly' | 'withIcons',
  whenReadonly: (item: ReadonlyItem) => T,
  whenWithIcon: (item: ItemWithIcon) => T
): (item: Item) => T {
  return item => {
    switch (listType) {
      case 'readonly':
        return whenReadonly(item as ReadonlyItem)
      case 'withIcons':
        return whenWithIcon(item as ItemWithIcon)
    }
  }
}

type Props = {
  heading: Option<LocalizedString>
  unwrapDescriptions?: boolean
} & (
  | {
      type: 'readonly'
      items: ReadonlyItem[]
    }
  | {
      type: 'withIcons'
      iconsPosition: 'start' | 'end'
      items: ItemWithIcon[]
    }
)

export const List: FC<Props> = ({
  heading,
  unwrapDescriptions = false,
  items,
  ...props
}) => {
  const unwrap = pipe(
    unwrapDescriptions,
    boolean.fold(
      () => '',
      () => 'unwrap'
    )
  )

  const iconsAtTheEndClassName =
    props.type === 'withIcons' && props.iconsPosition === 'end'
      ? 'iconsAtTheEnd'
      : ''

  return (
    <div className={composeClassName('List', unwrap, iconsAtTheEndClassName)}>
      {pipe(
        heading,
        option.map(heading => <h5 className="heading">{heading}</h5>),
        option.toNullable
      )}
      <ul>
        {(items as Item[]).map((item: Item) => (
          <li>
            <div className="itemContentWrapper">
              {pipe(
                item,
                foldItem(
                  props.type,
                  constNull,
                  ({ icon, iconColor = 'default' }) => (
                    <Icon color={iconColor} src={icon} />
                  )
                )
              )}
              <div className="itemContent">
                {pipe(
                  item.label,
                  option.map(label => <Label content={label} />),
                  option.toNullable
                )}
                <h6 className="content">{item.content}</h6>
                {pipe(
                  item.description,
                  option.map(description => (
                    <p className="description">{description}</p>
                  )),
                  option.toNullable
                )}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
