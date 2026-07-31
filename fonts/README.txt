Drop self-hosted font files here (optional).

The site currently uses Archivo with a system-ui fallback and loads NO external
font files, so it has zero third-party requests.

To self-host Archivo:
1. Download the .woff2 files (e.g. from https://fonts.google.com/specimen/Archivo).
2. Place them in this folder.
3. Add to the top of css/style.css:

   @font-face {
     font-family: "Archivo";
     src: url("../fonts/Archivo-Regular.woff2") format("woff2");
     font-weight: 400;
     font-display: swap;
   }
   @font-face {
     font-family: "Archivo";
     src: url("../fonts/Archivo-Bold.woff2") format("woff2");
     font-weight: 700 800;
     font-display: swap;
   }
