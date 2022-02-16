import { Eq } from 'fp-ts/Eq'
import { IO } from 'fp-ts/IO'
import { Compactable2C } from 'fp-ts/Compactable'
import {
  constFalse,
  constTrue,
  flow,
  identity,
  Lazy,
  pipe,
} from 'fp-ts/function'
import { Monoid } from 'fp-ts/Monoid'
import { Semigroup } from 'fp-ts/Semigroup'
import { Separated } from 'fp-ts/Separated'
import { Reader } from 'fp-ts/Reader'
import { Show } from 'fp-ts/Show'
import { Filterable2C } from 'fp-ts/Filterable'
import { Predicate } from 'fp-ts/Predicate'
import { Monad2 } from 'fp-ts/Monad'
import {
  boolean,
  either,
  option,
  separated,
  readonlyArray,
  readonlyNonEmptyArray,
} from 'fp-ts'
import { Option } from 'fp-ts/Option'
import { Either } from 'fp-ts/Either'
import { Pointed2 } from 'fp-ts/Pointed'
import {
  apFirst as apFirst_,
  Apply2,
  apS as apS_,
  apSecond as apSecond_,
} from 'fp-ts/Apply'
import {
  Applicative as ApplicativeHKT,
  Applicative2,
  Applicative2C,
} from 'fp-ts/Applicative'
import { bind as bind_, Chain2, chainFirst as chainFirst_ } from 'fp-ts/Chain'
import { Foldable2 } from 'fp-ts/Foldable'
import { PipeableTraverse2, Traversable2 } from 'fp-ts/Traversable'
import { HKT } from 'fp-ts/HKT'
import { Alt2, Alt2C } from 'fp-ts/Alt'
import { Extend2 } from 'fp-ts/Extend'
import { MonadThrow2 } from 'fp-ts/MonadThrow'
import {
  chainOptionK as chainOptionK_,
  filterOrElse as filterOrElse_,
  FromEither2,
  fromOption as fromOption_,
  fromOptionK as fromOptionK_,
  fromPredicate as fromPredicate_,
} from 'fp-ts/FromEither'
import { flap as flap_, bindTo as bindTo_, Functor2 } from 'fp-ts/Functor'
import { Refinement } from 'fp-ts/Refinement'
import { ReadonlyNonEmptyArray } from 'fp-ts/ReadonlyNonEmptyArray'
import { NonEmptyArray } from 'fp-ts/NonEmptyArray'
import { wiltDefault, Witherable2C, witherDefault } from 'fp-ts/Witherable'

export interface Loading {
  readonly _tag: 'Loading'
}

export interface Right<A> {
  readonly _tag: 'Right'
  readonly right: A
}

export interface Left<E> {
  readonly _tag: 'Left'
  readonly left: E
}

export type Query<E, A> = Loading | Right<A> | Left<E>

export const loading = <E = never, A = never>(): Query<E, A> => ({
  _tag: 'Loading',
})

export const left = <E = never, A = never>(left: E): Query<E, A> => ({
  _tag: 'Left',
  left,
})

export const right = <E = never, A = never>(right: A): Query<E, A> => ({
  _tag: 'Right',
  right,
})

export const URI = 'Query'
export type URI = typeof URI

declare module 'fp-ts/HKT' {
  interface URItoKind2<E, A> {
    readonly [URI]: Query<E, A>
  }
}

const _map: Monad2<URI>['map'] = (fa, f) => pipe(fa, map(f))
const _ap: Monad2<URI>['ap'] = (fab, fa) => pipe(fab, ap(fa))
const _chain: Monad2<URI>['chain'] = (ma, f) => pipe(ma, chain(f))
const _reduce: Foldable2<URI>['reduce'] = (fa, b, f) => pipe(fa, reduce(b, f))

const _foldMap: Foldable2<URI>['foldMap'] = M => (fa, f) => {
  const foldMapM = foldMap(M)
  return pipe(fa, foldMapM(f))
}

const _reduceRight: Foldable2<URI>['reduceRight'] = (fa, b, f) =>
  pipe(fa, reduceRight(b, f))

const _traverse = <F>(
  F: ApplicativeHKT<F>,
): (<E, A, B>(
  ta: Query<E, A>,
  f: (a: A) => HKT<F, B>,
) => HKT<F, Query<E, B>>) => {
  const traverseF = traverse(F)
  return (ta, f) => pipe(ta, traverseF(f))
}

const _alt: Alt2<URI>['alt'] = (fa, that) => pipe(fa, alt(that))
const _extend: Extend2<URI>['extend'] = (wa, f) => pipe(wa, extend(f))

export const getShow = <E, A>(SE: Show<E>, SA: Show<A>): Show<Query<E, A>> => ({
  show: fold(
    () => 'loading',
    left => `left(${SE.show(left)})`,
    right => `right(${SA.show(right)})`,
  ),
})

export const getEq = <E, A>(EL: Eq<E>, EA: Eq<A>): Eq<Query<E, A>> => ({
  equals: (x, y) =>
    pipe(
      x,
      fold(
        () => pipe(y, fold(constTrue, constFalse, constFalse)),
        ex =>
          pipe(
            y,
            fold(constFalse, ey => EL.equals(ex, ey), constFalse),
          ),
        ax =>
          pipe(
            y,
            fold(constFalse, constFalse, ay => EA.equals(ax, ay)),
          ),
      ),
    ),
})

export const getSemigroup = <E, A>(
  S: Semigroup<A>,
): Semigroup<Query<E, A>> => ({
  concat: (x, y) =>
    pipe(
      x,
      chain(ax =>
        pipe(
          y,
          chain(ay => right(S.concat(ax, ay))),
          orElse(() => x),
        ),
      ),
      orElse(() => y),
    ),
})

export const getCompactable = <E>(M: Monoid<E>): Compactable2C<URI, E> => {
  const empty = left(M.empty)

  return {
    URI,
    _E: undefined as any,
    compact: <A>(ma: Query<E, Option<A>>): Query<E, A> =>
      pipe(
        ma,
        chain(
          option.fold(
            () => empty,
            a => right(a),
          ),
        ),
      ),
    separate: <A, B>(ma: Query<any, Either<A, B>>) =>
      pipe(
        ma,
        foldF(
          () => separated.separated(empty, empty),
          q => separated.separated(q, q),
          ({ right: a }) =>
            pipe(
              a,
              either.fold<A, B, Separated<Query<E, A>, Query<E, B>>>(
                e => separated.separated(right(e), empty as Query<E, B>),
                a => separated.separated(empty as Query<E, A>, right(a)),
              ),
            ),
        ),
      ),
  }
}

export const getFilterable = <E>(M: Monoid<E>): Filterable2C<URI, E> => {
  const empty = left(M.empty)

  const { compact, separate } = getCompactable(M)

  const filter = <A>(ma: Query<E, A>, predicate: Predicate<A>): Query<E, A> =>
    pipe(
      ma,
      chain(
        flow(
          predicate,
          boolean.fold(
            () => empty,
            () => ma,
          ),
        ),
      ),
    )

  const partition = <A>(
    ma: Query<E, A>,
    predicate: Predicate<A>,
  ): Separated<Query<E, A>, Query<E, A>> => {
    return pipe(
      ma,
      map(a =>
        pipe(
          predicate(a),
          boolean.fold<Separated<Query<E, A>, Query<E, A>>>(
            () => separated.separated(right(a), empty),
            () => separated.separated(empty, right(a)),
          ),
        ),
      ),
      getOrElse(() => separated.separated(ma, ma)),
    )
  }

  return {
    URI,
    _E: undefined as any,
    map: _map,
    compact,
    separate,
    filter,
    filterMap: <E, A, B>(ma: Query<E, A>, f: Reader<A, Option<B>>) =>
      pipe(
        ma,
        chain(
          flow(
            f,
            option.fold(() => empty as Query<E, B>, right),
          ),
        ),
        orElse(() => ma as Query<E, B>),
      ),
    partition,
    partitionMap: <E, A, B, C>(ma: Query<E, A>, f: Reader<A, Either<B, C>>) =>
      pipe(
        ma,
        foldF(
          ma => separated.separated(ma, ma),
          ma => separated.separated(ma, ma),
          ({ right: a }) =>
            pipe(
              f(a),
              either.fold(
                e => separated.separated(right(e), empty as Query<E, C>),
                a => separated.separated(empty as Query<E, B>, right(a)),
              ),
            ),
        ),
      ),
  }
}

export const getWitherable = <E>(M: Monoid<E>): Witherable2C<URI, E> => {
  const F_ = getFilterable(M)
  const C = getCompactable(M)
  return {
    URI,
    _E: undefined as any,
    map: _map,
    compact: F_.compact,
    separate: F_.separate,
    filter: F_.filter,
    filterMap: F_.filterMap,
    partition: F_.partition,
    partitionMap: F_.partitionMap,
    traverse: _traverse,
    sequence,
    reduce: _reduce,
    foldMap: _foldMap,
    reduceRight: _reduceRight,
    wither: witherDefault(Traversable, C),
    wilt: wiltDefault(Traversable, C),
  }
}

export const getApplicativeValidation = <E>(
  SE: Semigroup<E>,
): Applicative2C<URI, E> => ({
  URI,
  _E: undefined as any,
  map: _map,
  ap: <A, B>(fab: Query<E, Reader<A, B>>, fa: Query<E, A>): Query<E, B> =>
    pipe(
      fab,
      foldF(
        identity,
        fab =>
          pipe(
            fa,
            foldF(
              identity,
              fa => left(SE.concat(fab.left, fa.left)),
              () => fab,
            ),
          ),
        fab =>
          pipe(
            fa,
            foldF(
              identity,
              fa => left(fa.left),
              fa => right(fab.right(fa.right)),
            ),
          ),
      ),
    ),
  of,
})

export const getAltValidation = <E>(SE: Semigroup<E>): Alt2C<URI, E> => ({
  URI,
  _E: undefined as any,
  map: _map,
  alt: <A>(me: Query<E, A>, that: Lazy<Query<E, A>>): Query<E, A> =>
    pipe(
      me,
      foldF(
        identity,
        me => {
          const ea = that()

          return pipe(
            ea,
            foldF<E, A, Query<E, A>>(
              identity,
              ea => left(SE.concat(me.left, ea.left)),
              identity,
            ),
          )
        },
        identity,
      ),
    ),
})

export const map =
  <A, B>(f: Reader<A, B>) =>
  <E>(fa: Query<E, A>): Query<E, B> =>
    pipe(fa, chain<E, A, B>(flow(f, right)))

export const Functor: Functor2<URI> = {
  URI,
  map: _map,
}

export const of: <E = never, A = never>(a: A) => Query<E, A> = right

export const Pointed: Pointed2<URI> = {
  URI,
  of,
}

export const apW =
  <E2, A>(fa: Query<E2, A>) =>
  <E1, B>(fab: Query<E1, Reader<A, B>>): Query<E1 | E2, B> =>
    pipe(
      fab,
      chain<E1 | E2, Reader<A, B>, B>(f =>
        pipe(fa, chain<E2, A, B>(flow(f, right))),
      ),
    )

export const ap: <E, A>(
  fa: Query<E, A>,
) => <B>(fab: Query<E, Reader<A, B>>) => Query<E, B> = apW

export const Apply: Apply2<URI> = {
  URI,
  map: _map,
  ap: _ap,
}

export const Applicative: Applicative2<URI> = {
  URI,
  map: _map,
  ap: _ap,
  of,
}

export const chainW =
  <E2, A, B>(f: Reader<A, Query<E2, B>>) =>
  <E1>(ma: Query<E1, A>): Query<E1 | E2, B> =>
    pipe(ma, fold<E1, A, Query<E1 | E2, B>>(loading, left, f))

export const chain: <E, A, B>(
  f: Reader<A, Query<E, B>>,
) => Reader<Query<E, A>, Query<E, B>> = chainW

export const Chain: Chain2<URI> = {
  URI,
  map: _map,
  ap: _ap,
  chain: _chain,
}

export const Monad: Monad2<URI> = {
  URI,
  map: _map,
  ap: _ap,
  of,
  chain: _chain,
}

export const reduce: <A, B>(
  b: B,
  f: (b: B, a: A) => B,
) => <E>(fa: Query<E, A>) => B = (b, f) => fa =>
  pipe(
    fa,
    map(a => f(b, a)),
    getOrElse(() => b),
  )

export const foldMap: <M>(
  M: Monoid<M>,
) => <A>(f: Reader<A, M>) => <E>(fa: Query<E, A>) => M = M => f => fa =>
  pipe(
    fa,
    map(f),
    getOrElse(() => M.empty),
  )

export const reduceRight: <A, B>(
  b: B,
  f: (a: A, b: B) => B,
) => <E>(fa: Query<E, A>) => B = (b, f) => fa =>
  pipe(
    fa,
    map(a => f(a, b)),
    getOrElse(() => b),
  )

export const Foldable: Foldable2<URI> = {
  URI,
  reduce: _reduce,
  foldMap: _foldMap,
  reduceRight: _reduceRight,
}

export const traverse: PipeableTraverse2<URI> =
  <F>(F: ApplicativeHKT<F>) =>
  <A, B>(f: Reader<A, HKT<F, B>>) =>
  <E>(ta: Query<E, A>): HKT<F, Query<E, B>> =>
    pipe(
      ta,
      fold(
        () => F.of(loading()),
        flow(left, F.of),
        a => F.map(f(a), right),
      ),
    )

export const sequence: Traversable2<URI>['sequence'] =
  <F>(F: ApplicativeHKT<F>) =>
  <E, A>(ma: Query<E, HKT<F, A>>): HKT<F, Query<E, A>> =>
    pipe(
      ma,
      fold(
        () => F.of(loading()),
        flow(left, F.of),
        a => F.map(a, right),
      ),
    )

export const Traversable: Traversable2<URI> = {
  URI,
  map: _map,
  reduce: _reduce,
  foldMap: _foldMap,
  reduceRight: _reduceRight,
  traverse: _traverse,
  sequence,
}

export const altW =
  <E2, B>(that: Lazy<Query<E2, B>>) =>
  <E1, A>(fa: Query<E1, A>): Query<E2, A | B> =>
    pipe(fa, orElse<E1, A | B, E2>(that))

export const alt: <E, A>(
  that: Lazy<Query<E, A>>,
) => (fa: Query<E, A>) => Query<E, A> = altW

export const Alt: Alt2<URI> = {
  URI,
  map: _map,
  alt: _alt,
}

export const extend =
  <E, A, B>(f: Reader<Query<E, A>, B>) =>
  (wa: Query<E, A>): Query<E, B> =>
    pipe(wa, chain<E, A, B>(flow(right, f, right)))

export const Extend: Extend2<URI> = {
  URI,
  map: _map,
  extend: _extend,
}

export const throwError: MonadThrow2<URI>['throwError'] = left

export const MonadThrow: MonadThrow2<URI> = {
  URI,
  map: _map,
  ap: _ap,
  of,
  chain: _chain,
  throwError,
}

export const FromEither: FromEither2<URI> = {
  URI,
  fromEither: identity,
}

export const fromPredicate = fromPredicate_(FromEither)
export const fromOption = fromOption_(FromEither)

export const isLeft = <E>(ma: Query<E, unknown>): ma is Left<E> =>
  ma._tag === 'Left'

export const isRight = <A>(ma: Query<unknown, A>): ma is Right<A> =>
  ma._tag === 'Right'

export const isLoading = (ma: Query<unknown, unknown>): ma is Loading =>
  ma._tag === 'Loading'

export const matchFW: <E, A, B, C>(
  onLoading: Reader<Loading, B | C>,
  onLeft: Reader<Left<E>, B>,
  onRight: Reader<Right<A>, C>,
) => Reader<Query<E, A>, B | C> = (onLoading, onLeft, onRight) => ma => {
  switch (ma._tag) {
    case 'Loading':
      return onLoading(ma)
    case 'Left':
      return onLeft(ma)
    case 'Right':
      return onRight(ma)
  }
}

export const matchW: <E, B, A, C>(
  onLoading: IO<B | C>,
  onLeft: Reader<E, B>,
  onRight: Reader<A, C>,
) => Reader<Query<E, A>, B | C> = (onLoading, onLeft, onRight) =>
  matchFW(
    onLoading,
    ({ left }) => onLeft(left),
    ({ right }) => onRight(right),
  )

export const matchF: <E, A, B>(
  onLoading: Reader<Loading, B>,
  onLeft: Reader<Left<E>, B>,
  onRight: Reader<Right<A>, B>,
) => Reader<Query<E, A>, B> = matchFW

export const match: <E, A, B>(
  onLoading: IO<B>,
  onLeft: Reader<E, B>,
  onRight: Reader<A, B>,
) => Reader<Query<E, A>, B> = matchW

export const foldF: <E, A, B>(
  onLoading: Reader<Loading, B>,
  onLeft: Reader<Left<E>, B>,
  onRight: Reader<Right<A>, B>,
) => Reader<Query<E, A>, B> = matchF

export const foldW = matchW

export const fold: <E, A, B>(
  onLoading: IO<B>,
  onLeft: Reader<E, B>,
  onRight: Reader<A, B>,
) => Reader<Query<E, A>, B> = match

export const getOrElseW =
  <E, B>(onLeft: IO<B>) =>
  <A>(ma: Query<E, A>): A | B =>
    pipe(ma, fold<E, A, A | B>(onLeft, onLeft, identity))

export const getOrElse: <E, A>(onLeft: IO<A>) => Reader<Query<E, A>, A> =
  getOrElseW

export const flap = flap_(Functor)
export const apFirst = apFirst_(Apply)
export const apSecond = apSecond_(Apply)

export const chainFirst: <E, A, B>(
  f: Reader<A, Query<E, B>>,
) => Reader<Query<E, A>, Query<E, A>> = chainFirst_(Chain)

export const chainFirstW: <E2, A, B>(
  f: Reader<A, Query<E2, B>>,
) => <E1>(ma: Query<E1, A>) => Query<E1 | E2, A> = chainFirst as any

export const flattenW: <E1, E2, A>(
  mma: Query<E1, Either<E2, A>>,
) => Query<E1 | E2, A> = chainW(identity)

export const flatten: <E, A>(mma: Query<E, Either<E, A>>) => Query<E, A> =
  flattenW

export const duplicate: <E, A>(ma: Query<E, A>) => Query<E, Query<E, A>> =
  extend(identity)

export const fromOptionK = fromOptionK_(FromEither)
export const chainOptionK = chainOptionK_(FromEither, Chain)
export const filterOrElse = filterOrElse_(FromEither, Chain)

export const filterOrElseW: {
  <A, B extends A, E2>(refinement: Refinement<A, B>, onFalse: Reader<A, E2>): <
    E1,
  >(
    ma: Query<E1, A>,
  ) => Query<E1 | E2, B>
  <A, E2>(predicate: Predicate<A>, onFalse: Reader<A, E2>): <E1, B extends A>(
    mb: Query<E1, B>,
  ) => Query<E1 | E2, B>
  <A, E2>(predicate: Predicate<A>, onFalse: Reader<A, E2>): <E1>(
    ma: Query<E1, A>,
  ) => Query<E1 | E2, A>
} = filterOrElse

export const swap = <E, A>(ma: Query<E, A>): Query<A, E> =>
  pipe(ma, fold<E, A, Query<A, E>>(loading, right, left))

export const orElseW =
  <E1, E2, B>(onLeft: Reader<E1, Query<E2, B>>) =>
  <A>(ma: Query<E1, A>): Query<E2, A | B> =>
    pipe(ma, fold<E1, A, Query<E2, A | B>>(loading, onLeft, right))

export const orElse: <E1, A, E2>(
  onLeft: Reader<E1, Query<E2, A>>,
) => Reader<Query<E1, A>, Query<E2, A>> = orElseW

export const fromNullable =
  <E>(e: E) =>
  <A>(a: A): Query<E, NonNullable<A>> =>
    a == null ? left(e) : right(a!)

export const tryCatch = <E, A>(
  f: Lazy<A>,
  onThrow: Reader<unknown, E>,
): Query<E, A> => {
  try {
    return right(f())
  } catch (e) {
    return left(onThrow(e))
  }
}

export const tryCatchK =
  <A extends ReadonlyArray<unknown>, B, E>(
    f: (...a: A) => B,
    onThrow: (error: unknown) => E,
  ): ((...a: A) => Query<E, B>) =>
  (...a) =>
    tryCatch(() => f(...a), onThrow)

export const fromNullableK =
  <E>(
    e: E,
  ): (<A extends ReadonlyArray<unknown>, B>(
    f: (...a: A) => B | null | undefined,
  ) => (...a: A) => Query<E, NonNullable<B>>) =>
  f =>
    flow(f, fromNullable(e))

export const chainNullableK =
  <E>(
    e: E,
  ): (<A, B>(
    f: Reader<A, B | null | undefined>,
  ) => Reader<Query<E, A>, Query<E, NonNullable<B>>>) =>
  f =>
    chain(pipe(f, fromNullableK(e)))

export function toError(e: unknown): Error {
  return e instanceof Error ? e : new Error(String(e))
}

export function elem<A>(E: Eq<A>): {
  (a: A): <E>(ma: Query<E, A>) => boolean
  <E>(a: A, ma: Query<E, A>): boolean
}
export function elem<A>(
  E: Eq<A>,
): <E>(a: A, ma?: Query<E, A>) => boolean | ((ma: Query<E, A>) => boolean) {
  return (a, ma?) => {
    if (ma === undefined) {
      const elemE = elem(E)
      return ma => elemE(a, ma)
    }

    return pipe(
      ma,
      map(b => E.equals(a, b)),
      getOrElse(constFalse),
    )
  }
}

export const exists =
  <A>(predicate: Predicate<A>) =>
  <E>(ma: Query<E, A>): boolean =>
    pipe(ma, map(predicate), getOrElse(constFalse))

export const Do: Query<never, {}> = of({})
export const bindTo = bindTo_(Functor)
export const bind = bind_(Chain)

export const bindW: <N extends string, A, E2, B>(
  name: Exclude<N, keyof A>,
  f: Reader<A, Query<E2, B>>,
) => <E1>(
  fa: Query<E1, A>,
) => Query<
  E1 | E2,
  { readonly [K in keyof A | N]: K extends keyof A ? A[K] : B }
> = bind as any

export const apS = apS_(Apply)

export const apSW: <A, N extends string, E2, B>(
  name: Exclude<N, keyof A>,
  fb: Query<E2, B>,
) => <E1>(
  fa: Query<E1, A>,
) => Query<
  E1 | E2,
  { readonly [K in keyof A | N]: K extends keyof A ? A[K] : B }
> = apS as any

export const ApT: Query<never, readonly []> = of([])

export const traverseReadonlyNonEmptyArrayWithIndex =
  <A, E, B>(
    f: (index: number, a: A) => Query<E, B>,
  ): Reader<ReadonlyNonEmptyArray<A>, Query<E, ReadonlyNonEmptyArray<B>>> =>
  as =>
    pipe(
      f(0, readonlyNonEmptyArray.head(as)),
      chain(b => {
        const res: NonEmptyArray<B> = [b]

        for (let i = 1; i < as.length; i++) {
          const e = f(i, as[i])

          switch (e._tag) {
            case 'Loading':
              return loading()
            case 'Left':
              return left(e.left)
            case 'Right':
              res.push(e.right)
          }
        }

        return right(res)
      }),
    )

export const traverseReadonlyArrayWithIndex = <A, E, B>(
  f: (index: number, a: A) => Query<E, B>,
): Reader<ReadonlyArray<A>, Query<E, ReadonlyArray<B>>> => {
  const g = traverseReadonlyNonEmptyArrayWithIndex(f)

  return a =>
    readonlyArray.isEmpty(a) ? ApT : g(a as ReadonlyNonEmptyArray<A>)
}

export const traverseArrayWithIndex: <E, A, B>(
  f: (index: number, a: A) => Query<E, B>,
) => Reader<ReadonlyArray<A>, Query<E, ReadonlyArray<B>>> =
  traverseReadonlyArrayWithIndex

export const traverseArray = <E, A, B>(
  f: Reader<A, Query<E, B>>,
): Reader<ReadonlyArray<A>, Query<E, ReadonlyArray<B>>> =>
  traverseReadonlyArrayWithIndex((_, a) => f(a))

export const sequenceArray: <E, A>(
  as: ReadonlyArray<Query<E, A>>,
) => Query<E, ReadonlyArray<A>> = traverseArray(identity)

export const query: Monad2<URI> &
  Foldable2<URI> &
  Traversable2<URI> &
  Alt2<URI> &
  Extend2<URI> &
  MonadThrow2<URI> = {
  URI,
  map: _map,
  of,
  ap: _ap,
  chain: _chain,
  reduce: _reduce,
  foldMap: _foldMap,
  reduceRight: _reduceRight,
  traverse: _traverse,
  sequence,
  alt: _alt,
  extend: _extend,
  throwError: throwError,
}
