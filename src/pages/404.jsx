import emptyLight from '/empty-states/light/empty.svg'
import emptyDark from '/empty-states/dark/empty.svg'
import { Link } from 'react-router-dom'
import { Button, Image } from "@heroui/react"
import Logo from '../components/Logo'
import { useDarkMode } from '../hooks/theme/useDarkMode'

function NotFoundPage() {
  const [darkMode] = useDarkMode()
  const empty = darkMode ? emptyDark : emptyLight
  return (
    <div className="w-screen h-screen py-12 flex flex-col gap-9 justify-center items-center">
      <div className="mb-9">
        <Logo size="12" />
      </div>
      <Image isBlurred width={300} alt="NextUI hero Image" src={empty} />
      <div className="flex flex-col justify-center items-center gap-3">
        <h1 className="text-4xl font-bold">Page Not Found</h1>
        <p className="text-xl">
          Uh-oh, this page doesn&apos;t seem to exist. Let&apos;s get you back
          on track!
        </p>
        <Button
          as={Link}
          to="/"
          color="primary"
          variant="shadow"
          className="mt-4"
        >
          Go back home
        </Button>
      </div>
    </div>
  )
}

export default NotFoundPage
