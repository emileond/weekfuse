import { useEffect, useState } from 'react'
import {Image} from '@heroui/react';
import { useDarkMode } from '../hooks/theme/useDarkMode'
import logo from '/logo.svg'
import icon from '/icon.svg'
import darkLogo from '/logo-dark.svg'

function Logo({ isIconOnly = false, size = "160px" }) {
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

  return <Image src={src} alt="logo" width={size} />
}

export default Logo
