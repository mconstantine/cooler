package it.mconst.cooler.models.user

import cats.data.EitherT
import cats.effect.IO
import cats.syntax.all.none
import com.osinka.i18n.Lang
import io.circe.generic.auto.deriveDecoder
import io.circe.generic.auto.deriveEncoder
import io.circe.parser.decode
import io.circe.syntax.EncoderOps
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Config
import it.mconst.cooler.utils.DatabaseName
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.given
import java.time.Instant
import mongo4cats.bson.ObjectId
import mongo4cats.circe.*
import mongo4cats.collection.operations.Filter
import org.bson.BsonDateTime
import org.http4s.circe.*
import org.http4s.dsl.io.*
import org.http4s.EntityDecoder
import org.http4s.EntityEncoder
import pdi.jwt.JwtAlgorithm
import pdi.jwt.JwtCirce
import pdi.jwt.JwtClaim
import pdi.jwt.JwtOptions

object JWT {
  sealed trait TokenType:
    def name: String
  case object UserAccess extends TokenType:
    val name = "user_access"
  case object UserRefresh extends TokenType:
    val name = "user_refresh"

  sealed trait AuthToken {
    def tokenType: TokenType
    def token: String
  }
  final case class AccessToken(token: String, expiration: BsonDateTime)
      extends AuthToken {
    override def tokenType: TokenType = UserAccess
  }
  final case class RefreshToken(token: String) extends AuthToken {
    override def tokenType: TokenType = UserRefresh
  }

  final case class UnknownTokenType(name: String) extends TokenType

  final case class AuthTokens(
      val accessToken: String,
      val refreshToken: String,
      expiration: BsonDateTime
  )

  given EntityEncoder[IO, AuthTokens] = jsonEncoderOf[IO, AuthTokens]
  given EntityDecoder[IO, AuthTokens] = jsonOf[IO, AuthTokens]

  private val issuer = "cooler"
  private val encryptionKey = Config.database.encryptionKey
  private val algorithm = JwtAlgorithm.HS256

  private case class TokenContent(_id: String)

  private def generateUserToken(
      tokenType: TokenType,
      user: User,
      expiration: Option[Long]
  ): String =
    JwtCirce.encode(
      new JwtClaim(
        content = TokenContent(user._id.toString).asJson.noSpaces,
        issuer = Some(issuer),
        subject = Some(tokenType.name),
        audience = none[Set[String]],
        expiration = expiration,
        notBefore = none[Long],
        issuedAt = Some(Instant.now.getEpochSecond),
        jwtId = none[String]
      ),
      encryptionKey,
      algorithm
    )

  private def generateUserAccessToken(user: User): AccessToken = {
    val expirationSeconds = Instant.now.plusSeconds(1209600).getEpochSecond
    val token = generateUserToken(UserAccess, user, Some(expirationSeconds))

    AccessToken(token, BsonDateTime(expirationSeconds * 1000L))
  }

  private def generateUserRefreshToken(user: User): RefreshToken = RefreshToken(
    generateUserToken(UserRefresh, user, none[Long])
  )

  def generateAuthTokens(user: User) = {
    val accessToken = generateUserAccessToken(user)
    val refreshToken = generateUserRefreshToken(user)

    AuthTokens(accessToken.token, refreshToken.token, accessToken.expiration)
  }

  private def validateClaim(claim: JwtClaim, tokenType: TokenType): Boolean =
    claim.issuer.map(_.equals(issuer)).getOrElse(false) &&
      claim.subject
        .map(_ match
          case UserAccess.name  => tokenType.name == UserAccess.name
          case UserRefresh.name => tokenType.name == UserRefresh.name
          case _                => false
        )
        .getOrElse(false)

  def decodeToken(token: String, tokenType: TokenType)(using
      Lang,
      DatabaseName
  ): EitherT[IO, Error, User] = {
    val error = Error(Forbidden, __.ErrorInvalidAccessToken)

    EitherT
      .fromEither[IO](
        JwtCirce
          .decode(token, encryptionKey, Seq(algorithm))
          .toEither
          .left
          .map(_ => Error(Forbidden, __.ErrorInvalidAccessToken))
          .flatMap(claim =>
            Either.cond(
              validateClaim(claim, tokenType),
              claim,
              Error(Forbidden, __.ErrorInvalidAccessToken)
            )
          )
          .flatMap(claim =>
            decode[TokenContent](claim.content).left
              .map(_ => Error(Forbidden, __.ErrorInvalidAccessToken))
          )
          .flatMap(content =>
            ObjectId
              .from(content._id)
              .left
              .map(_ => Error(Forbidden, __.ErrorInvalidAccessToken))
          )
      )
      .flatMap(_id =>
        Users.collection
          .use(_.findOne[User](Filter.eq("_id", _id)))
          .leftMap(_ => Error(Forbidden, __.ErrorInvalidAccessToken))
      )
  }
}
