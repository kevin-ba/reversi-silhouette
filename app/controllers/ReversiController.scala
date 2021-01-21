package controllers

import javax.inject._
import play.api.mvc._
import de.htwg.se.reversi.Reversi
import de.htwg.se.reversi.controller.controllerComponent.{CellChanged, GameStatus, GridSizeChanged}
import play.api.libs.json.{JsNumber, Json}
import play.api.libs.streams.ActorFlow
import akka.actor.ActorSystem
import akka.stream.Materializer
import akka.actor._
import com.mohiva.play.silhouette.api.Silhouette
import com.mohiva.play.silhouette.api.actions.SecuredRequest
import org.webjars.play.WebJarsUtil
import play.api.i18n.I18nSupport
import utils.auth.DefaultEnv

import scala.concurrent.Future
import scala.swing.Reactor

@Singleton
class ReversiController @Inject() (
     components: ControllerComponents,
     silhouette: Silhouette[DefaultEnv]
   )(
     implicit
     webJarsUtil: WebJarsUtil,
     assets: AssetsFinder,
     system: ActorSystem,
     mat: Materializer
   ) extends AbstractController(components) with I18nSupport {
  val gameController = Reversi.controller
  def message = GameStatus.message(gameController.gameStatus)
  def reversiAsText =  gameController.gridToString + message

  def reversi = silhouette.SecuredAction.async { implicit request: SecuredRequest[DefaultEnv, AnyContent] =>
    Future.successful(Ok(views.html.reversi(gameController, message, request.identity)))
  }

  def newGrid = silhouette.SecuredAction.async { implicit request: SecuredRequest[DefaultEnv, AnyContent] =>
    gameController.createNewGrid
    Future.successful(Ok(views.html.reversi(gameController, message, request.identity)))
  }

  def undo = silhouette.SecuredAction.async { implicit request: SecuredRequest[DefaultEnv, AnyContent] =>
    gameController.undo
    Future.successful(Ok(views.html.reversi(gameController, message, request.identity)))
  }

  def redo = silhouette.SecuredAction.async { implicit request: SecuredRequest[DefaultEnv, AnyContent] =>
    gameController.redo
    Future.successful(Ok(views.html.reversi(gameController, message, request.identity)))
  }

  def set(row: Int, col: Int) = silhouette.SecuredAction.async { implicit request: SecuredRequest[DefaultEnv, AnyContent] =>
    gameController.set(row, col, gameController.getActivePlayer())
    Future.successful(Ok(views.html.reversi(gameController, message, request.identity)))
  }

  def gridToJson = Action {
    Ok(toJson)
  }

  def toJson = {
    val size = gameController.gridSize;
    val activePlayer = gameController.getActivePlayer();
    Json.obj(
      "grid" -> Json.obj(
        "size" -> JsNumber(size),
        "activePlayer" -> JsNumber(activePlayer),
        "cells" -> Json.toJson(
          for {row <- 0 until size;
               col <- 0 until size} yield {
            Json.obj(
              "row" -> row,
              "col" -> col,
              "cell" -> Json.toJson(gameController.cell(row, col).value))
          }
        )
      )
    )
  }

  def socket = WebSocket.accept[String, String] { request =>
    ActorFlow.actorRef { out =>
      println("Connect received")
      ReversiWebSocketActorFactory.create(out)
    }
  }

  object ReversiWebSocketActorFactory {
    def create(out: ActorRef) = {
      Props(new ReversiWebSocketActor(out))
    }
  }

  class ReversiWebSocketActor(out: ActorRef) extends Actor with Reactor{
    listenTo(gameController)

    def receive = {
      case msg: String =>
        out ! (toJson.toString)
        println("Sent Json to Client"+ msg)
    }

    reactions += {
      case event: GridSizeChanged => sendJsonToClient
      case event: CellChanged     => sendJsonToClient
    }

    def sendJsonToClient = {
      println("Received event from Controller")
      out ! (toJson.toString)
    }

  }

}