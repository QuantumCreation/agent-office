// Runs in the app window before the page. Tells the page's CSS it's inside the Mac app
// (room for the window buttons, a strip to drag the window by, no stray text selection).
// See "Mac app" in src/style.css.

const mark = () => document.documentElement.classList.add("app-shell");
if (document.documentElement) mark();
else document.addEventListener("DOMContentLoaded", mark, { once: true });
