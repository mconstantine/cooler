package it.mconst.cooler.models.user

import cats.effect.IO
import com.osinka.i18n.Lang
import io.circe.generic.auto.deriveDecoder
import io.circe.generic.auto.deriveEncoder
import io.circe.parser.decode
import io.circe.syntax.EncoderOps
import it.mconst.cooler.utils.__
import it.mconst.cooler.utils.Config
import it.mconst.cooler.utils.Error
import it.mconst.cooler.utils.Result.*
import java.time.Instant
import mongo4cats.bson.ObjectId
import mongo4cats.collection.operations.Filter
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

  case class UnknownTokenType(name: String) extends TokenType
  case class AuthTokens(val accessToken: String, val refreshToken: String)

  given EntityEncoder[IO, AuthTokens] = jsonEncoderOf[IO, AuthTokens]
  given EntityDecoder[IO, AuthTokens] = jsonOf[IO, AuthTokens]

  private val issuer = "cooler"
  private val encryptionKey = Config.database.encryptionKey
  private val algorithm = JwtAlgorithm.HS256

  private case class TokenContent(_id: String)

  private def generateUserToken(tokenType: TokenType, user: User): String =
    JwtCirce.encode(
      new JwtClaim(
        content = TokenContent(user._id.toString).asJson.noSpaces,
        issuer = Some(issuer),
        subject = Some(tokenType.name),
        audience = None,
        expiration = tokenType match
          case UserAccess =>
            Some(Instant.now.plusSeconds(1209600).getEpochSecond)
          case UserRefresh => None
          // Unknown tokens expire instantly LOL
          case UnknownTokenType(_) => Some(Instant.now.getEpochSecond)
        ,
        notBefore = None,
        issuedAt = Some(Instant.now.getEpochSecond),
        jwtId = None
      ),
      encryptionKey,
      algorithm
    )

  def generateAuthTokens(user: User) = AuthTokens(
    generateUserToken(UserAccess, user),
    generateUserToken(UserRefresh, user)
  )

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
      Lang
  ): IO[Result[User]] = {
    val userId: Result[ObjectId] =
      for
        claimResult <- JwtCirce
          .decode(token, encryptionKey, Seq(algorithm))
          .toEither
          .left
          .map(_ => Error(Forbidden, __.ErrorInvalidAccessToken))
        claimValidation <- Either.cond(
          validateClaim(claimResult, tokenType),
          claimResult,
          Error(Forbidden, __.ErrorInvalidAccessToken)
        )
        content <- decode[TokenContent](claimValidation.content).left.map(_ =>
          Error(Forbidden, __.ErrorInvalidAccessToken)
        )
        _id <- ObjectId
          .from(content._id)
          .left
          .map(_ => Error(Forbidden, __.ErrorInvalidAccessToken))
      yield _id

    userId.lift(_id =>
      Users.collection
        .use(_.find(Filter.eq("_id", _id)).first)
        .map(_.toRight(Error(Forbidden, __.ErrorInvalidAccessToken)))
    )
  }
}
