package it.mconst.cooler.utils

import cats.Applicative
import cats.data.EitherT
import cats.effect.IO
import cats.Functor
import org.http4s.dsl.io.*
import org.http4s.EntityBody
import org.http4s.EntityEncoder
import org.http4s.Response

object Result {
  type Result[T] = Either[Error, T]

  extension [T](result: Result[T]) {

    /** Lifts a `Left` to the effect `F`, while you can `flatMap` and lift a
      * `Right`.
      */
    def lift[F[_], R](f: T => F[Result[R]])(using
        a: Applicative[F]
    ): F[Result[R]] =
      result match
        case Left(error) => a.pure(Left(error))
        case Right(r)    => f(r)

    def liftValidate[F[_]](f: T => F[Option[Error]])(using
        a: Applicative[F]
    ): F[Option[Error]] =
      result match
        case Left(error) => a.pure(Some(error))
        case Right(r)    => f(r)

    def toResponse[R](using
        we: EntityEncoder[IO, Error],
        wr: EntityEncoder[IO, T]
    ): IO[Response[IO]] = result match
      case Right(value) => Ok(wr.toEntity(value).body)
      case Left(error) =>
        IO.pure(Response(status = error.status, body = we.toEntity(error).body))
  }

  extension [T](option: Option[T]) {

    /** If `None`, it gets lifted to the effect `F`, if `Some` you deal with
      * `flatMap`ping and lifting.
      */
    def lift[F[_], R](whenSome: T => F[Option[R]])(using
        a: Applicative[F]
    ): F[Option[R]] =
      option match
        case None    => a.pure(None)
        case Some(r) => whenSome(r)

    /** If `Some`, it gets lifted to the effect `F`, if `None` you get to return
      * a lifted `Option`.
      */
    def liftNone[F[_]](whenNone: => F[Option[T]])(using
        a: Applicative[F]
    ): F[Option[T]] =
      option match
        case None    => whenNone
        case Some(r) => a.pure(Some(r))

    /** Swaps `Some` to a `None` lifted to the effect `F`, while you can return
      * a lifted `Option` in case of `None`.
      */
    def swapLift[F[_], R](whenNone: => F[Option[R]])(using
        a: Applicative[F]
    ): F[Option[R]] =
      option match
        case None    => whenNone
        case Some(_) => a.pure(None)

    /** Turns `None` into an error `E` lifted to the effect `F`, while you deal
      * with `flatMap`ping and lifting `Some`.
      */
    def toRightLift[F[_], E, R](e: E, whenSome: T => F[Either[E, R]])(using
        a: Applicative[F]
    ): F[Either[E, R]] =
      option match
        case None    => a.pure(Left(e))
        case Some(r) => whenSome(r)

    /** Turns `Some[E]` into `F[Left[E]]`, while you deal with lifting something
      * for `None`.
      */
    def toLeftLift[F[_], R](whenNone: => F[Either[T, R]])(using
        a: Applicative[F]
    ): F[Either[T, R]] =
      option match
        case None    => whenNone
        case Some(e) => a.pure(Left(e))
  }
}
