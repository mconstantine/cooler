package it.mconst.cooler.models.user

import cats.effect.IO
import com.osinka.i18n.Lang
import io.circe.generic.auto.{deriveDecoder, deriveEncoder}
import io.circe.parser.decode
import io.circe.syntax.EncoderOps
import it.mconst.cooler.utils.{Config, Error, Translations}
import java.time.Instant
import mongo4cats.bson.ObjectId
import mongo4cats.collection.operations.Filter
import org.http4s.Status
import pdi.jwt.{JwtCirce, JwtAlgorithm, JwtClaim, JwtOptions}

object JWT {
  sealed trait TokenType:
    def name: String

  case object UserAccess extends TokenType:
    val name = "user_access"

  case object UserRefresh extends TokenType:
    val name = "user_refresh"

  case class UnknownTokenType(name: String) extends TokenType
  case class AuthTokens(val accessToken: String, val refreshToken: String)

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
  ): IO[Either[Error, User]] = {
    val users = Users()

    val userId =
      for
        claimResult <- JwtCirce
          .decode(token, encryptionKey, Seq(algorithm))
          .toEither
        claimValidation <-
          if validateClaim(claimResult, tokenType)
          then Right[Error, JwtClaim](claimResult)
          else
            Left[Error, JwtClaim](
              Error(Status.Forbidden, Translations.Key.ErrorInvalidAccessToken)
            )
        content <- decode[TokenContent](claimValidation.content)
        _id <- ObjectId.from(content._id)
      yield _id

    userId match
      case Left(_) =>
        IO(
          Left(
            Error(Status.Forbidden, Translations.Key.ErrorInvalidAccessToken)
          )
        )
      case Right(userId) =>
        users.collection
          .use(_.find(Filter.eq("_id", userId)).first)
          .map(_ match
            case Some(user) => Right(user)
            case None =>
              Left(
                Error(
                  Status.Forbidden,
                  Translations.Key.ErrorInvalidAccessToken
                )
              )
          )
  }
}
