package expo.modules.vlcplayer

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class VlcPlayerModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("VlcPlayer")

    View(VlcPlayerView::class) {
      Prop("source") { view: VlcPlayerView, source: Map<String, Any> ->
        view.setSource(source)
      }

      Prop("paused") { view: VlcPlayerView, paused: Boolean ->
        if (paused) {
          view.pause()
        } else {
          view.play()
        }
      }

      Events(
        "onPlaybackStateChanged",
        "onVideoStateChange",
        "onVideoLoadStart",
        "onVideoLoadEnd",
        "onVideoProgress",
        "onVideoError"
      )

      AsyncFunction("play") { view: VlcPlayerView ->
        view.play()
      }

      AsyncFunction("pause") { view: VlcPlayerView ->
        view.pause()
      }

      AsyncFunction("stop") { view: VlcPlayerView ->
        view.stop()
      }

      AsyncFunction("seekTo") { view: VlcPlayerView, time: Int ->
        view.seekTo(time)
      }

      AsyncFunction("setAudioTrack") { view: VlcPlayerView, trackIndex: Int ->
        view.setAudioTrack(trackIndex)
      }

      AsyncFunction("getAudioTracks") { view: VlcPlayerView ->
        view.getAudioTracks()
      }

      AsyncFunction("setSubtitleTrack") { view: VlcPlayerView, trackIndex: Int ->
        view.setSubtitleTrack(trackIndex)
      }

      AsyncFunction("getSubtitleTracks") { view: VlcPlayerView ->
        view.getSubtitleTracks()
      }

      AsyncFunction("setSubtitleURL") { view: VlcPlayerView, url: String, name: String ->
        view.setSubtitleURL(url, name)
      }
    }
  }
}