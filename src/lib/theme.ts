export type AppTheme = 'dark' | 'light'

export const DEFAULT_THEME: AppTheme = 'dark'
export const THEME_STORAGE_KEY = 'mix-streamer-theme'

export const resolveStoredTheme = (storedTheme: string | null): AppTheme =>
  storedTheme === 'light' ? 'light' : DEFAULT_THEME

export const applyThemeToDocument = (theme: AppTheme) => {
  if (typeof document === 'undefined') {
    return
  }

  const root = document.documentElement
  root.classList.toggle('dark', theme === 'dark')
  root.dataset.theme = theme
  root.style.colorScheme = theme
}

export const getResolvedTheme = (): AppTheme => {
  if (typeof window === 'undefined') {
    return DEFAULT_THEME
  }

  return resolveStoredTheme(window.localStorage.getItem(THEME_STORAGE_KEY))
}

export const persistTheme = (theme: AppTheme) => {
  if (typeof window === 'undefined') {
    return
  }

  window.localStorage.setItem(THEME_STORAGE_KEY, theme)
}

export const getThemeScript = () =>
  `(() => {
    try {
      const key = '${THEME_STORAGE_KEY}';
      const theme = localStorage.getItem(key) === 'light' ? 'light' : '${DEFAULT_THEME}';
      const root = document.documentElement;
      root.classList.toggle('dark', theme === 'dark');
      root.dataset.theme = theme;
      root.style.colorScheme = theme;
    } catch (error) {
      const root = document.documentElement;
      root.classList.add('dark');
      root.dataset.theme = '${DEFAULT_THEME}';
      root.style.colorScheme = '${DEFAULT_THEME}';
    }
  })();`
