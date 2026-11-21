# Letter Smash!

Download [letter-smash.html](letter-smash.html) using GitHub's **Download raw file** button, then double-click it to play. The file contains the game and its artwork; no server or install is needed. Speech depends on your browser and available voices. If your browser limits the microphone, settings storage, or fullscreen keyboard lock on local files, try the localhost version below.

## Play

- **Hear it:** Press a letter or digit to pop a tile onto the stage and hear its name. Enable **Grown-ups → Letter examples** for occasional prompts like “J as in jaguar” or “J wie Jaguar,” with a matching picture. Use **Show keys** for touch play.
- **Say it:** Press a key or choose **Surprise me**, then say the name of the tile. A correct answer earns one star and plays a coin sound. Use **Try again** if it didn't hear the answer.
- **Grown-ups:** Open **Language**, select **English** or **Deutsch**, and save. You can also change letter case, choose a theme, and add practice words. When words are set, **Surprise me** (or **Space** when the stage has focus) draws from their letters and digits 75% of the time and from the full keyboard the rest of the time. Settings are saved in this browser; stars last until reload.
- **Fullscreen:** Menus and buttons are hidden so only the stage and game keys remain. Press **Space** for a surprise or **Enter** to replay or retry a tile. Press **Ctrl+0** to get back to the controls. On-screen keys appear on touch devices or if **Show keys** was already on; tap **Ctrl**, then **0** to exit. In browsers that allow Keyboard Lock, tapping **Esc** won't exit native fullscreen. Holding **Esc** or using system controls can still leave native fullscreen; the app stays in the play view until **Ctrl+0**.

Hear it prefers a child or female voice in the selected language when available. Say it needs Web Speech recognition and microphone permission. The browser may process speech online; the app does not record or store audio.

## Develop and test

The source files run without a build. From this folder, start a local server and open <http://localhost:8000>:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

After editing the source, regenerate the standalone HTML and commit it alongside the changes:

```powershell
python scripts\build_standalone.py
python scripts\build_standalone.py --check
```

Run the browser checks at <http://localhost:8000/tests/> for the source or <http://localhost:8000/tests/?standalone> for the packaged version. The checks simulate speech, audio, and fullscreen APIs and don't request microphone permission.
