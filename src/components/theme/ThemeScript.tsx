export const THEME_STORAGE_KEY = 'algoviz-theme';
export const SIDEBAR_STORAGE_KEY = 'algoviz-sidebar';

/**
 * Applies the persisted theme and sidebar state before first paint.
 *
 * Has to be an inline, synchronous `<script>` in `<head>`: anything that waits
 * for React hydration paints the default theme first, and the resulting
 * white-then-black flash is the single most obvious "this is a toy" tell in an
 * otherwise polished app. Reading `localStorage` synchronously is exactly the
 * blocking behaviour we want here.
 *
 * Wrapped in try/catch because Safari private mode throws on `localStorage`.
 */
const SCRIPT = `(function(){try{
var s=localStorage.getItem('${THEME_STORAGE_KEY}');
var d=s==='dark'||(s!=='light'&&window.matchMedia('(prefers-color-scheme:dark)').matches);
var e=document.documentElement;
e.classList.toggle('dark',d);
e.style.colorScheme=d?'dark':'light';
if(localStorage.getItem('${SIDEBAR_STORAGE_KEY}')==='collapsed'){e.setAttribute('data-sidebar','collapsed');}
}catch(_){}})();`;

export function ThemeScript() {
  return <script dangerouslySetInnerHTML={{ __html: SCRIPT }} />;
}
