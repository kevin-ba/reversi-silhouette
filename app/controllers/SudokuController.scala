package controllers

import javax.inject._

import akka.actor.{ActorSystem, _}
import akka.stream.Materializer
import com.mohiva.play.silhouette.api.Silhouette
import com.mohiva.play.silhouette.api.actions.SecuredRequest
import de.htwg.se.sudoku.Sudoku
import de.htwg.se.sudoku.controller.controllerComponent.{CandidatesChanged, CellChanged, GameStatus, GridSizeChanged}
import org.webjars.play.WebJarsUtil
import play.api.i18n.I18nSupport
import play.api.libs.streams.ActorFlow
import play.api.mvc._
import utils.auth.DefaultEnv

import scala.concurrent.Future
import scala.swing.Reactor

@Singleton
class SudokuController @Inject() (
  components: ControllerComponents,
  silhouette: Silhouette[DefaultEnv]
)(
  implicit
  webJarsUtil: WebJarsUtil,
  assets: AssetsFinder,
  system: ActorSystem,
  mat: Materializer
) extends AbstractController(components) with I18nSupport {

  val gameController = Sudoku.controller
  def message = GameStatus.message(gameController.gameStatus)
  def sudokuAsText = gameController.gridToString + message

  /* def about = silhouette.UnsecuredAction { implicit request: Request[AnyContent] =>
    Ok(views.html.about())
  } */

  def sudoku = silhouette.SecuredAction.async { implicit request: SecuredRequest[DefaultEnv, AnyContent] =>
    Future.successful(Ok(views.html.sudoku(gameController, message, request.identity)))
  }

  def newGrid = silhouette.SecuredAction.async { implicit request: SecuredRequest[DefaultEnv, AnyContent] =>
    gameController.createNewGrid
    Future.successful(Ok(views.html.sudoku(gameController, message, request.identity)))
  }

  def solve = silhouette.SecuredAction.async { implicit request: SecuredRequest[DefaultEnv, AnyContent] =>
    gameController.solve
    Future.successful(Ok(views.html.sudoku(gameController, message, request.identity)))
  }

  def highlight(about: Int) = silhouette.SecuredAction.async { implicit request: SecuredRequest[DefaultEnv, AnyContent] =>
    gameController.highlight(about)
    Future.successful(Ok(views.html.sudoku(gameController, message, request.identity)))
  }

  def resize(size: Int) = silhouette.SecuredAction.async { implicit request: SecuredRequest[DefaultEnv, AnyContent] =>
    gameController.resize(size)
    Future.successful(Ok(views.html.sudoku(gameController, message, request.identity)))
  }

  def set(row: Int, col: Int, value: Int) = silhouette.SecuredAction.async { implicit request: SecuredRequest[DefaultEnv, AnyContent] =>
    gameController.set(row, col, value)
    Future.successful(Ok(views.html.sudoku(gameController, message, request.identity)))
  }

  def showCandidates(row: Int, col: Int) = silhouette.SecuredAction.async { implicit request: SecuredRequest[DefaultEnv, AnyContent] =>
    gameController.showCandidates(row, col)
    Future.successful(Ok(views.html.sudoku(gameController, message, request.identity)))
  }

  def gridToJson = silhouette.SecuredAction.async { implicit request: SecuredRequest[DefaultEnv, AnyContent] =>
    Future.successful(Ok(gameController.toJson))
  }

  def socket = WebSocket.accept[String, String] { request =>
    ActorFlow.actorRef { out =>
      println("Connect received")
      SudokuWebSocketActorFactory.create(out)
    }
  }

  object SudokuWebSocketActorFactory {
    def create(out: ActorRef) = {
      Props(new SudokuWebSocketActor(out))
    }
  }

  class SudokuWebSocketActor(out: ActorRef) extends Actor with Reactor {
    listenTo(gameController)

    def receive = {
      case msg: String =>
        out ! (gameController.toJson.toString)
        println("Sent Json to Client" + msg)
    }

    reactions += {
      case event: GridSizeChanged => sendJsonToClient
      case event: CellChanged => sendJsonToClient
      case event: CandidatesChanged => sendJsonToClient
    }

    def sendJsonToClient() = {
      println("Received event from Controller")
      out ! (gameController.toJson.toString)
    }
  }
}