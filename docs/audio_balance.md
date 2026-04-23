# Audio Balance Spec

This project has three audio groups:

- File BGM: `assets/audio/*.mp3`, played through `src/audio_bgm.js`.
- Generated BGM / ambience: Web Audio loops in `src/se.js`.
- SE: short effects, either `assets/audio/se/*.mp3` or generated in `src/se.js`.

## Targets

- File BGM should sit around `-16 dB mean_volume` by `ffmpeg volumedetect`.
- Loud BGM with peaks near `0 dB` should be scaled down in `sourceVolumeScale`.
- Quiet BGM should be scaled up in `sourceVolumeScale`, but avoid clipping after scaling.
- SE should feel present over BGM without jumping forward. Short impact SE may be louder than UI SE.
- Generated BGM should use `generatedBgmLevel(...)`.
- Generated ambience should use `ambientBgmLevel(...)`.
- Generated one-shot SE should use `generatedSeLevel(...)`.
- File SE should be played through `play(name, vol)` so `SAMPLE_SE_MASTER` and `SAMPLE_SE_SCALE` are applied.

## Adding File BGM

1. Put the mp3 in `assets/audio/`.
2. Check volume:

```sh
ffmpeg -hide_banner -nostats -i assets/audio/YOUR_FILE.mp3 -af volumedetect -f null -
```

3. Add it to `sourceVolumeScale` in `src/audio_bgm.js`.
4. Use this as a first-pass scale:

```txt
scale = 10 ^ ((-16 - mean_volume) / 20)
```

Examples:

- `mean_volume = -13`: scale about `0.71`
- `mean_volume = -16`: scale `1.0`
- `mean_volume = -19`: scale about `1.41`

Keep the final `volume * scale` under `1.0`.

## Adding Generated BGM

Use a master gain and route all parts into it:

```js
const master = ctx.createGain();
master.gain.value = generatedBgmLevel(0.3);
master.connect(ctx.destination);
```

For ambience, use:

```js
master.gain.value = ambientBgmLevel(0.5);
```

Do not connect several loud oscillators directly to `ctx.destination`; connect them to the master first.

## Adding File SE

Put the mp3 in `assets/audio/se/`, then use:

```js
play("your_se.mp3", 1.0);
```

If it is too loud or quiet after the master, add a key to `SAMPLE_SE_SCALE` in `src/se.js`.

Typical scale values:

- UI click/confirm: `0.7` to `1.0`
- Soft notification: `0.8` to `1.2`
- Hit/impact: `1.2` to `1.8`
- Very quiet source file: `2.0` to `2.8`
- Peaky source file: `0.3` to `0.7`

## Adding Generated SE

Wrap all audible gain values:

```js
g.gain.setValueAtTime(generatedSeLevel(0.16), t);
```

For ramps:

```js
g.gain.linearRampToValueAtTime(generatedSeLevel(0.07), t + 0.01);
```

Do not use raw values like `0.9` for one-shot generated SE unless there is a deliberate reason.

## Current Mix Constants

Defined in `src/se.js`:

- `SAMPLE_SE_MASTER`
- `SAMPLE_SE_SCALE`
- `GENERATED_SE_MASTER`
- `GENERATED_BGM_MASTER`
- `AMBIENT_BGM_MASTER`

Defined in `src/audio_bgm.js`:

- `sourceVolumeScale`

When the mix feels wrong, change these constants first. Avoid fixing balance by scattering unrelated one-off gain changes across gameplay code.
