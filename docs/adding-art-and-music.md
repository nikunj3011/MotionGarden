# Adding artwork and music

## Does a new artwork react automatically?

The audio connection is automatic, but its artistic mapping is not. The host sends the current music's smoothed bass, mid and treble energy to every artwork. Each artwork must implement `setAudio(bands)` and use those values in its drawing or animation. If it omits that optional method, it still runs but does not react. Both bundled demo artworks already implement it.

Inside your artwork's existing `create()` function, keep the latest signal:

```js
let audio = { bass: 0, mid: 0, treble: 0 };

// Include this method in the instance you return:
setAudio(next) { audio = next; }

// In your drawing loop, derive effects from the original parameters:
const liveSpeed = parameters.speed * (1 + audio.bass * 0.8);
const lineWidth = 1 + audio.treble * 0.6;
```

This is an integration fragment, not a complete artwork. Use the existing flow-field or orbit-sculpture module as a working template. Choose a mapping that suits the work: scale, curl, particle motion, brightness, geometry, or shader uniforms. Never overwrite the user's base parameters with the audio signal. Values are finite and normalized to 0–1. Turning reaction off, muting/stopping music or reduced-motion preference supplies zero energy; that should reproduce your normal rendering behavior. Honor pause and dispose just as the demo adapters do.

Add metadata and a thumbnail, register the manifest in `content/catalog/v1/index.json`, and compute its SHA-256 checksum. Run content validation, the build and browser checks. Only unpublished development versions may be regenerated in place; published packages need a new version and compatible contract support.

## Does new music drive all reactive artwork automatically?

Yes, when it uses the shared music engine: it passes through the same analyser, so every compatible artwork can react without new audio wiring.

For a new piece using Ambient, Polyrhythm or Arpeggio, add a recipe to `content/music/v1/index.json`. For example:

```json
{
  "id": "amber-rain",
  "title": "Amber rain",
  "style": "Ambient",
  "description": "Slow pentatonic tones in a warm mathematical drift.",
  "bpm": 72,
  "root": 50,
  "scale": [0, 2, 5, 7, 9],
  "steps": 16,
  "pulses": 5
}
```

Rebuild the website: this release bundles the validated music catalog at build time. The new piece appears in Works → Music and the shuffle pool.

A completely new synthesis style needs a style entry in the music schema and an implementation in the shared scheduler in `packages/generative-music/index.ts`. Route its voices through the existing compressor/master/analyser path. Imported audio files, external streams and microphone input are not supported yet; they would need a new input adapter feeding that same analysis path. Audio from unrelated apps is not automatically available to the website.

Test real output, bounded polyphony, stopping/muting, background suspension and mobile playback. The analyzer wiring can be automatic; musical quality and the visual mapping still need human review.
