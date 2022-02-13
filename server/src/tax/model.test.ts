import { init } from '../init'
import { User } from '../user/interface'
import { getFakeUser } from '../test/getFakeUser'
import { getFakeTax } from '../test/getFakeTax'
import { createTax, getTax, listTaxes, updateTax, deleteTax } from './model'
import { Tax } from './interface'
import { constVoid, pipe } from 'fp-ts/function'
import { option, taskEither } from 'fp-ts'
import {
  pipeTestTaskEither,
  testError,
  testTaskEither,
  testTaskEitherError
} from '../test/util'
import { remove } from '../misc/dbUtils'
import { registerUser } from '../test/registerUser'
import { sequenceS } from 'fp-ts/Apply'
import { getTaxById, insertTax } from './database'
import { getConnectionNodes } from '../test/getConnectionNodes'

let user1: User
let user2: User
let tax1: Tax
let tax2: Tax

beforeAll(async () => {
  process.env.SECRET = 'shhhhh'

  await pipe(init(), testTaskEither(constVoid))

  await pipe(
    registerUser(getFakeUser()),
    pipeTestTaskEither(u => {
      user1 = u
    }),
    testTaskEither(constVoid)
  )

  await pipe(
    registerUser(getFakeUser(), user1),
    pipeTestTaskEither(u => {
      user2 = u
    }),
    testTaskEither(constVoid)
  )

  await pipe(
    sequenceS(taskEither.taskEither)({
      t1: pipe(
        insertTax(getFakeTax(user1.id)),
        taskEither.chain(getTaxById),
        taskEither.chain(taskEither.fromOption(testError))
      ),
      t2: pipe(
        insertTax(getFakeTax(user2.id)),
        taskEither.chain(getTaxById),
        taskEither.chain(taskEither.fromOption(testError))
      )
    }),
    pipeTestTaskEither(({ t1, t2 }) => {
      tax1 = t1
      tax2 = t2
    }),
    testTaskEither(constVoid)
  )
})

afterAll(async () => {
  delete process.env.SECRET
  await pipe(remove('user'), testTaskEither(constVoid))
})

describe('createTax', () => {
  it('should work', async () => {
    await pipe(
      createTax(getFakeTax(user1.id), user1),
      testTaskEither(tax => {
        expect(Tax.is(tax)).toBe(true)
      })
    )
  })

  it('should force the user from the request', async () => {
    await pipe(
      createTax(getFakeTax(user2.id), user1),
      testTaskEither(tax => {
        expect(tax.user).toBe(user1.id)
      })
    )
  })
})

describe('getTax', () => {
  it('should work', async () => {
    await pipe(
      getTax(tax1.id, user1),
      testTaskEither(tax => {
        expect(tax).toMatchObject(tax1)
      })
    )
  })

  it('should not allow users to see taxes of other users', async () => {
    await pipe(
      getTax(tax1.id, user2),
      testTaskEitherError(error => {
        expect(error.code).toBe('COOLER_403')
      })
    )
  })
})

describe('listTaxes', () => {
  it("should list all and only the user's taxes", async () => {
    await pipe(
      listTaxes({}, user1),
      testTaskEither(connection => {
        const taxes = getConnectionNodes(connection)
        expect(taxes).toContainEqual(tax1)
        expect(taxes).not.toContainEqual(tax2)
      })
    )
  })
})

describe('updateTax', () => {
  it('should work', async () => {
    const input = getFakeTax(user2.id)

    await pipe(
      updateTax(tax2.id, input, user2),
      testTaskEither(tax => {
        expect(Tax.is(tax)).toBe(true)
        expect(tax).toMatchObject(input)
        tax2 = tax
      })
    )
  })

  it('should not allow users to update taxes of other users', async () => {
    await pipe(
      updateTax(tax1.id, getFakeTax(user2.id), user2),
      testTaskEitherError(error => {
        expect(error.code).toBe('COOLER_403')
      })
    )
  })
})

describe('deleteTax', () => {
  it('should work', async () => {
    const input = getFakeTax(user1.id)

    await pipe(
      insertTax(input),
      taskEither.chain(taxId => deleteTax(taxId, user1)),
      pipeTestTaskEither(tax => {
        expect(tax).toMatchObject(input)
      }),
      taskEither.chain(tax => getTaxById(tax.id)),
      testTaskEither(tax => {
        expect(option.isNone(tax)).toBe(true)
      })
    )
  })

  it('should not allow users to delete taxes of other users', async () => {
    await pipe(
      insertTax(getFakeTax(user1.id)),
      taskEither.chain(taxId => deleteTax(taxId, user2)),
      testTaskEitherError(error => {
        expect(error.code).toBe('COOLER_403')
      })
    )
  })
})
