import { option, taskEither } from 'fp-ts'
import { constVoid, pipe } from 'fp-ts/function'
import * as t from 'io-ts'
import { optionFromNullable } from 'io-ts-types'
import { WithId } from 'mongodb'
import { testTaskEither } from '../test/util'
import { unsafeLocalizedString } from './a18n'
import {
  dbGet,
  dbGetAll,
  deleteMany,
  deleteOne,
  insertMany,
  insertOne,
  updateMany,
  updateOne
} from './dbUtils'
import { makeCollection } from './Entity'
import { coolerError } from './Types'
import { withDatabase } from './withDatabase'
import { date } from 'io-ts-types'
import { sleep } from '../test/sleep'

const TestCollectionProps = {
  key: t.string,
  value: t.number,
  optional: optionFromNullable(t.string),
  createdAt: date,
  updatedAt: date
}

const TestCollection = t.type(TestCollectionProps, 'TestCollectionType')
type TestCollection = t.TypeOf<typeof TestCollection>

const testCollection = makeCollection(
  'testCollection',
  TestCollectionProps,
  TestCollection
)

describe('dbUtils', () => {
  afterAll(
    async () =>
      await pipe(
        withDatabase(db =>
          taskEither.tryCatch(
            () => db.dropCollection(testCollection.name),
            error => {
              console.log(error)
              return coolerError(
                'COOLER_500',
                unsafeLocalizedString('Unable to drop collection after tests.')
              )
            }
          )
        ),
        testTaskEither(constVoid)
      )
  )

  describe('dbGet', () => {
    beforeAll(
      async () =>
        await pipe(
          withDatabase(db =>
            taskEither.tryCatch(
              () =>
                db.collection(testCollection.name).insertMany([
                  {
                    key: 'first',
                    value: 1,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  },
                  {
                    key: 'second',
                    value: 2,
                    createdAt: new Date(),
                    updatedAt: new Date()
                  }
                ]),
              error => {
                console.log(error)
                return coolerError(
                  'COOLER_500',
                  unsafeLocalizedString('Error while inserting before tests.')
                )
              }
            )
          ),
          testTaskEither(constVoid)
        )
    )

    it('should work (using match to find)', async () =>
      await pipe(
        dbGet(testCollection, { key: 'first' }),
        taskEither.chain(
          taskEither.fromOption(() =>
            coolerError(
              'COOLER_404',
              unsafeLocalizedString('Could not find test document.')
            )
          )
        ),
        testTaskEither(document => expect(document.key).toBe('first'))
      ))

    it('should work (using collection to find)', async () =>
      await pipe(
        dbGet(testCollection, collection =>
          collection.findOne({ key: { $ne: 'second' } })
        ),
        taskEither.chain(
          taskEither.fromOption(() =>
            coolerError(
              'COOLER_404',
              unsafeLocalizedString('Could not find test document.')
            )
          )
        ),
        testTaskEither(document => expect(document.key).toBe('first'))
      ))
  })

  describe('dbGetAll', () => {
    it('should work (match)', async () =>
      await pipe(
        dbGetAll(testCollection, { value: 2 }),
        testTaskEither(res => expect(res.length).toBeGreaterThan(0))
      ))

    it('should work (useCollection)', async () =>
      await pipe(
        dbGetAll(testCollection, collection =>
          collection.find({ value: { $gt: 0 } }).toArray()
        ),
        testTaskEither(res => expect(res.length).toBeGreaterThan(0))
      ))
  })

  describe('insertOne', () => {
    it('should work and set createdAt (using _id to find)', async () =>
      await pipe(
        insertOne(testCollection, {
          key: 'insertOne test',
          value: 42
        }),
        taskEither.chain(result =>
          pipe(
            dbGet(testCollection, { _id: result.insertedId }),
            taskEither.chain(
              taskEither.fromOption(() =>
                coolerError(
                  'COOLER_404',
                  unsafeLocalizedString(
                    'Could not find inserted test document.'
                  )
                )
              )
            ),
            taskEither.map(doc => ({ insertedId: result.insertedId, doc }))
          )
        ),
        testTaskEither(({ insertedId, doc }) => {
          expect(insertedId).toEqual(doc._id)
          expect(doc.createdAt).toBeDefined()
        })
      ))

    it('should work (using optional to find)', async () =>
      await pipe(
        insertOne(testCollection, {
          key: 'insertOne test',
          value: 42,
          optional: option.some('insertOne')
        }),
        taskEither.chain(result =>
          pipe(
            dbGet(testCollection, { optional: option.some('insertOne') }),
            taskEither.chain(
              taskEither.fromOption(() =>
                coolerError(
                  'COOLER_404',
                  unsafeLocalizedString(
                    'Could not find inserted test document.'
                  )
                )
              )
            ),
            taskEither.map(doc => [result.insertedId, doc._id])
          )
        ),
        testTaskEither(([expected, received]) =>
          expect(expected).toEqual(received)
        )
      ))
  })

  describe('insertMany', () => {
    it('should work and set createdAt (using _ids to find)', async () =>
      await pipe(
        insertMany(testCollection, [
          {
            key: 'insertMany test',
            value: 66
          },
          {
            key: 'insertMany test',
            value: 69
          }
        ]),
        taskEither.chain(result =>
          pipe(
            dbGetAll(testCollection, collection =>
              collection
                .find({ _id: { $in: Object.values(result.insertedIds) } })
                .toArray()
            ),
            taskEither.map(docs => ({
              insertedIds: Object.values(result.insertedIds).sort(),
              docs: docs.sort((a, b) => {
                if (a._id.toHexString() < b._id.toHexString()) {
                  return -1
                } else {
                  return 1
                }
              })
            }))
          )
        ),
        testTaskEither(({ insertedIds, docs }) => {
          expect(insertedIds).toEqual(docs.map(doc => doc._id))
          expect(docs.every(doc => !!doc.createdAt)).toBe(true)
        })
      ))

    it('should work (using optional to find)', async () =>
      await pipe(
        insertMany(testCollection, [
          {
            key: 'insertMany test',
            value: 66,
            optional: option.some('insertMany')
          },
          {
            key: 'insertMany test',
            value: 69,
            optional: option.some('insertMany')
          }
        ]),
        taskEither.chain(result =>
          pipe(
            dbGetAll(testCollection, { optional: option.some('insertMany') }),
            taskEither.map(docs => [
              Object.values(result.insertedIds).sort(),
              docs.map(doc => doc._id).sort()
            ])
          )
        ),
        testTaskEither(([expected, received]) =>
          expect(expected).toEqual(received)
        )
      ))
  })

  describe('updateOne', () => {
    let target: WithId<TestCollection>

    beforeAll(
      async () =>
        await pipe(
          insertOne(testCollection, {
            key: 'updateOne test',
            value: 96,
            optional: option.some('updateOne')
          }),
          taskEither.chain(result =>
            dbGet(testCollection, { _id: result.insertedId })
          ),
          taskEither.chain(
            taskEither.fromOption(() =>
              coolerError(
                'COOLER_404',
                unsafeLocalizedString(
                  'Could not find inserted test document for testing updateOne.'
                )
              )
            )
          ),
          testTaskEither(result => {
            target = result
          })
        )
    )

    it('should work and update updatedAt (using _id to find)', async () => {
      const fetchDocument = () =>
        pipe(
          dbGet(testCollection, { _id: target._id }),
          taskEither.chain(
            taskEither.fromOption(() =>
              coolerError(
                'COOLER_404',
                unsafeLocalizedString(
                  'Unable to find document after updateOne.'
                )
              )
            )
          )
        )

      let initialUpdatedAt: Date

      await pipe(
        fetchDocument(),
        testTaskEither(doc => {
          initialUpdatedAt = doc.updatedAt
        })
      )

      await pipe(
        sleep(50, null),
        taskEither.fromTask,
        taskEither.chain(() =>
          updateOne(testCollection, { _id: target._id }, { value: 99 })
        ),
        taskEither.chain(fetchDocument),
        testTaskEither(doc => {
          expect(doc.value).toBe(99)
          expect(doc.updatedAt.getTime()).toBeGreaterThan(
            initialUpdatedAt.getTime()
          )
        })
      )
    })

    it('should work (using optional to find)', async () =>
      await pipe(
        updateOne(testCollection, { _id: target._id }, { value: 99 }),
        taskEither.chain(() =>
          dbGet(testCollection, { optional: option.some('updateOne') })
        ),
        taskEither.chain(
          taskEither.fromOption(() =>
            coolerError(
              'COOLER_404',
              unsafeLocalizedString('Unable to find document after updateOne.')
            )
          )
        ),
        testTaskEither(doc => expect(doc.value).toBe(99))
      ))
  })

  describe('updateMany', () => {
    let currentDocuments: WithId<TestCollection>[]

    beforeAll(
      async () =>
        await pipe(
          insertMany(testCollection, [
            {
              key: 'updateMany test',
              value: 21,
              optional: option.some('updateMany')
            },
            {
              key: 'updateMany test',
              value: 22,
              optional: option.some('updateMany')
            },
            {
              key: 'updateMany test',
              value: 23,
              optional: option.some('updateMany')
            }
          ]),
          taskEither.chain(result =>
            dbGetAll(testCollection, collection =>
              collection
                .find({ _id: { $in: Object.values(result.insertedIds) } })
                .toArray()
            )
          ),
          testTaskEither(docs => {
            expect(docs.length).toBe(3)
            currentDocuments = docs
          })
        )
    )

    it('should work (using optional to find)', async () =>
      await pipe(
        updateMany(
          testCollection,
          { optional: option.some('updateMany') },
          { value: 0 }
        ),
        taskEither.chain(() =>
          dbGetAll(testCollection, { optional: option.some('updateMany') })
        ),
        testTaskEither(docs => docs.map(doc => expect(doc.value).toBe(0)))
      ))

    it('should work and update updatedAt (using filter to find)', async () => {
      const fetchDocuments = () =>
        dbGetAll(testCollection, { optional: option.some('updateMany') })

      // Keys here are ObjectIds turned into strings
      const initialUpdatedAtDates: Record<string, Date> = {}

      await pipe(
        fetchDocuments(),
        testTaskEither(docs => {
          docs.forEach(doc => {
            initialUpdatedAtDates[doc._id.toHexString()] = doc.updatedAt
          })
        })
      )

      await pipe(
        updateMany(
          testCollection,
          () => ({ _id: { $in: currentDocuments.map(doc => doc._id) } }),
          { value: 0 }
        ),
        taskEither.chain(fetchDocuments),
        testTaskEither(docs => {
          expect(docs.every(doc => doc.value === 0)).toBe(true)

          expect(
            docs.every(
              doc =>
                initialUpdatedAtDates[doc._id.toHexString()]?.getTime() ??
                Infinity < doc.updatedAt.getTime()
            )
          ).toBe(true)
        })
      )
    })
  })

  describe('deleteOne', () => {
    let currentDocument: WithId<TestCollection>

    beforeEach(
      async () =>
        await pipe(
          insertOne(testCollection, {
            key: 'deleteOne test',
            value: 17,
            optional: option.some('deleteOne')
          }),
          taskEither.chain(result =>
            dbGet(testCollection, { _id: result.insertedId })
          ),
          taskEither.chain(
            taskEither.fromOption(() =>
              coolerError(
                'COOLER_404',
                unsafeLocalizedString(
                  'Unable to find document after insertOne for testing deletion.'
                )
              )
            )
          ),
          testTaskEither(doc => {
            currentDocument = doc
          })
        )
    )

    it('should work (using _id to find)', async () =>
      await pipe(
        deleteOne(testCollection, { _id: currentDocument._id }),
        taskEither.chain(() =>
          dbGet(testCollection, { _id: currentDocument._id })
        ),
        testTaskEither(result => expect(option.isNone(result)).toBe(true))
      ))

    it('should work (using optional to find)', async () =>
      await pipe(
        deleteOne(testCollection, { optional: option.some('deleteOne') }),
        taskEither.chain(() =>
          dbGet(testCollection, { _id: currentDocument._id })
        ),
        testTaskEither(result => expect(option.isNone(result)).toBe(true))
      ))
  })

  describe('deleteMany', () => {
    let currentDocuments: Array<WithId<TestCollection>>

    beforeEach(
      async () =>
        await pipe(
          insertMany(testCollection, [
            {
              key: 'deleteMany test',
              value: 13,
              optional: option.some('deleteMany')
            },
            {
              key: 'deleteMany test',
              value: 14,
              optional: option.some('deleteMany')
            },
            {
              key: 'deleteMany test',
              value: 15,
              optional: option.some('deleteMany')
            }
          ]),
          taskEither.chain(() =>
            dbGetAll(testCollection, { optional: option.some('deleteMany') })
          ),
          testTaskEither(docs => {
            currentDocuments = docs
          })
        )
    )

    it('should work (using optional to find)', async () =>
      await pipe(
        deleteMany(testCollection, { optional: option.some('deleteMany') }),
        taskEither.chain(() =>
          dbGetAll(testCollection, collection =>
            collection
              .find({ _id: { $in: currentDocuments.map(doc => doc._id) } })
              .toArray()
          )
        ),
        testTaskEither(result => expect(result.length).toBe(0))
      ))

    it('should work (using filter to find)', async () =>
      await pipe(
        deleteMany(testCollection, () => ({
          _id: { $in: currentDocuments.map(doc => doc._id) }
        })),
        taskEither.chain(() =>
          dbGetAll(testCollection, collection =>
            collection
              .find({ _id: { $in: currentDocuments.map(doc => doc._id) } })
              .toArray()
          )
        ),
        testTaskEither(result => expect(result.length).toBe(0))
      ))
  })
})
