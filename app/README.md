# К-47 — Android-приложение

Обёртка [Capacitor](https://capacitorjs.com) над финальной версией игры
(`../К-47. Нормы расхода плоти. Цикл-48 (финал).html`). Сама игра не
переписывается: сборка копирует её в `www/`, кладёт three.js и шрифты
локально (работает без интернета) и подключает `src/media.js` — слой
настоящих звуков и картинок.

## Как добавить звуки и изображения

1. Положите файлы в `media/audio/sfx`, `media/audio/ambient`, `media/img/bg`
   (лучше `.ogg`/`.mp3` для звука, `.jpg`/`.webp` для картинок).
2. Пропишите их в `media/manifest.json` (пример — `manifest.example.json`).

| раздел        | ключ                                   | что заменяет                     |
|---------------|----------------------------------------|----------------------------------|
| `sfx`         | `click`, `shot`, `page`, `step`, …     | синтезированный эффект `Audio47.sfx.<ключ>` |
| `ambient`     | `contract`, `office`, `room`, `psych`, `reader`, `clicks`, `ending` | фоновый гул сцены (зациклен) |
| `backgrounds` | `contract`, `room`, `awake`, `psych`, `read` | фон секции `#act-<ключ>`       |

Все ключи эффектов: alarm barrage beep book breath buzz chime click crack
creak crunch drawer drip error glitch gunfire heartbeat hiss key mumble nail
page pop radio shot sign slash squelch stamp step steps success system tear
thud tick type whisper whoosh.

Параметры записи: `volume`, `rate` (скорость), `variants` (случайный из
списка), для фонов — `opacity`, `blend`. Чего нет в манифесте — звучит
как раньше. Кнопка «звук выкл» и пауза работают и для файлов.

## Сборка

```bash
npm install
npm run serve          # проверить в браузере: http://localhost:8080
npm run android:init   # один раз: создать android/
npm run apk            # android/app/build/outputs/apk/debug/app-debug.apk
```

Нужны JDK 21 и Android SDK (проще всего — Android Studio: `npm run android:open`).
Без них APK собирает GitHub Actions (`.github/workflows/android.yml`) —
файл появится в артефактах запуска.
