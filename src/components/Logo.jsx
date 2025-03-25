import { useEffect, useState } from 'react'
import { useDarkMode } from '../hooks/theme/useDarkMode'
import logo from '/logo.svg'
import icon from '/icon.svg'
import darkLogo from '/logo-dark.svg'

function Logo({ isIconOnly = false, size = '6' }) {
  const [darkMode] = useDarkMode()
  const [src, setSrc] = useState(isIconOnly ? icon : logo)

  useEffect(() => {
    if (isIconOnly) {
      setSrc(icon) // Icon remains the same regardless of theme
    } else if (darkMode) {
      setSrc(darkLogo) // Use dark logo in dark mode
    } else {
      setSrc(logo) // Use light logo in light mode
    }
  }, [darkMode, isIconOnly])

  return <img src={src} alt="logo" className={`h-${size} w-auto`} />
}

export default Logo
