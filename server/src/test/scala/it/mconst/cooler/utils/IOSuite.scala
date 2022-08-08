package it.mconst.cooler.utils

import cats.effect.IO
import cats.effect.kernel.Resource
import cats.effect.SyncIO
import cats.effect.unsafe.IORuntime
import cats.syntax.all.none
import munit.Assertions
import munit.Fixture
import munit.FunSuite
import scala.concurrent.ExecutionContext
import scala.concurrent.Future
import mongo4cats.client.MongoClient

abstract class IOSuite extends FunSuite {
  val name: String = s"cooler-test-${this.getClass.getSimpleName.toLowerCase}"

  given Assertions = this
  given ioRuntime: IORuntime = IORuntime.global
  given executionContext: ExecutionContext = ioRuntime.compute
  given DatabaseName = DatabaseName.unsafe(name)

  private val ioTransform: ValueTransform =
    new ValueTransform(
      "IO",
      { case io: IO[_] => io.unsafeToFuture() }
    )

  private val syncIOTransform: ValueTransform =
    new ValueTransform(
      "SyncIO",
      { case syncIo: SyncIO[_] =>
        Future(syncIo.unsafeRunSync())(munitExecutionContext)
      }
    )

  override def munitValueTransforms: List[ValueTransform] =
    super.munitValueTransforms ++ List(ioTransform, syncIOTransform)

  final class FixtureNotInstantiatedException(name: String)
      extends Exception(
        s"The fixture `$name` was not instantiated. Override `munitFixtures` and include a reference to this fixture."
      )

  override def afterAll(): Unit = {
    super.afterAll()

    MongoClient
      .fromConnectionString[IO](Config.database.uri)
      .use(
        _.getDatabase(name)
          .map(_.drop)
          .unsafeRunSync()
      )
      .unsafeRunSync()
  }

  object IOFixture {
    def apply[T](
        name: String,
        resource: Resource[IO, T]
    ): Fixture[T] =
      new Fixture[T](name) {
        var value: Option[(T, IO[Unit])] = none[(T, IO[Unit])]

        def apply(): T = value match
          case Some(value) => value._1
          case None        => throw new FixtureNotInstantiatedException(name)

        override def beforeAll(): Unit = {
          val (result, cleanUp) = resource.allocated.unsafeRunSync()
          value = Some(result -> cleanUp)
        }

        override def afterAll(): Unit = {
          value.get._2.unsafeRunSync()
        }
      }
  }
}
