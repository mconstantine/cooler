import { unsafeLocalizedString } from '../../a18n'
import { LocalizedString } from '../../globalDomain'

type Size = 'default' | 'small'

export interface DefaultArgs {
  heading: LocalizedString
  hasLabel: boolean
  hasDescription: boolean
  size: Size
  unwrapDescriptions: boolean
  itemsCount: number
}

export const defaultArgs = {
  heading: unsafeLocalizedString('List heading'),
  hasLabel: true,
  hasDescription: true,
  size: 'default' as const,
  unwrapDescriptions: false,
  itemsCount: 5
}

export const defaultArgTypes = {
  heading: {
    name: 'Heading',
    control: 'text'
  },
  hasLabel: {
    name: 'Use labels',
    control: 'boolean'
  },
  hasDescription: {
    name: 'Use descriptions',
    control: 'boolean'
  },
  size: {
    name: 'Size',
    control: {
      type: 'select',
      options: {
        Default: 'default',
        Small: 'small'
      } as Record<string, Size>
    }
  },
  unwrapDescriptions: {
    name: 'Unwrap descriptions',
    control: 'boolean'
  },
  itemsCount: {
    name: 'Items count',
    control: {
      type: 'range',
      min: 0,
      max: 10
    }
  }
}

export const labels = [
  'Qui magnam impedit sed cumque',
  'Et sapiente illo nihil nam',
  'Alias quos optio dolorem vitae',
  'Perferendis tempore inventore vero nam',
  'Voluptatem nam maxime similique expedita',
  'Suscipit cupiditate rerum nemo deleniti',
  'Expedita maxime saepe eos quibusdam',
  'Vel molestiae quia a numquam',
  'Assumenda maiores cumque eos qui',
  'Voluptatem dolorem aut maiores laboriosam'
] as LocalizedString[]

export const contents = [
  'Laudantium voluptatibus neque',
  'Sint sit ut',
  'Non ea dolore',
  'Est et perspiciatis',
  'Deserunt sed quia',
  'Totam sequi rem',
  'Fugit ullam voluptas',
  'Vel dolorum ducimus',
  'Atque consequatur impedit',
  'Rerum tempore nobis'
] as LocalizedString[]

export const description = unsafeLocalizedString(
  'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Corporis autem ex vel aliquid enim commodi laudantium esse eos eligendi ullam, ratione ipsam iste dolorem consectetur nesciunt at incidunt eveniet hic.'
) as LocalizedString
