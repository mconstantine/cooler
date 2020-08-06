import { merge } from './merge'

describe('merge', () => {
  it('should work', () => {
    const first = {
      first: 'first',
      level1: 1,
      level2: 2,
      level3: 3,
      level4: {
        first: 'first',
        level41: 41,
        level42: 42,
        level43: 43,
        level44: {
          first: 'first',
          level441: 441,
          level442: 442,
          level443: 443,
        }
      }
    }

    const second = {
      second: 'second',
      level2: 22,
      level4: {
        second: 'second',
        level42: 242,
        level44: {
          second: 'second',
          level442: 2442
        }
      }
    }

    const third = {
      third: 'third',
      level3: 33,
      level4: {
        third: 'third',
        level43: 343,
        level44: {
          level443: 3443,
          third: 'third'
        }
      }
    }

    expect(merge(first, second, third)).toEqual({
      first: 'first',
      second: 'second',
      third: 'third',
      level1: 1,
      level2: 22,
      level3: 33,
      level4: {
        first: 'first',
        second: 'second',
        third: 'third',
        level41: 41,
        level42: 242,
        level43: 343,
        level44: {
          first: 'first',
          second: 'second',
          third: 'third',
          level441: 441,
          level442: 2442,
          level443: 3443
        }
      }
    })
  })
})
