import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
} from "@heroui/react"
import { useState } from 'react'
import {
  RiMegaphoneLine,
  RiArrowRightLine,
  RiPaletteLine,
  RiCodeSSlashFill,
  RiBriefcaseLine,
  RiRestaurantFill,
  RiGraduationCapLine,
  RiBuildingLine,
} from 'react-icons/ri'

function UseCases() {
  const ICON_SIZE = 24
  const useCases = [
    {
      name: 'Sales & Marketing',
      heading: 'Reach Your Audience with Impact',
      description:
        'Easily test & share a variety of marketing materials for your audiences.',
      quote:
        '"I can upload & share content without a tech team." - Phil, Hapday group',
      startContent: <RiMegaphoneLine fontSize={ICON_SIZE} />,
    },
    {
      name: 'Designers & Artists',
      heading: 'Showcase Your Creativity',
      description:
        'Create stunning portfolios and share your work effortlessly.',
      quote: '"Finally, an easy way to share my art!" - Alex, Digital Artist',
      startContent: <RiPaletteLine fontSize={ICON_SIZE} />,
    },
    {
      name: 'Developers',
      heading: 'Automate Your Workflow',
      description:
        'Integrate Mailerfuse into your applications for seamless email automation.',
      quote:
        '"Mailerfuse has saved me hours of manual work." - John, Software Engineer',
      startContent: <RiCodeSSlashFill fontSize={ICON_SIZE} />,
    },
    {
      name: 'Hospitality',
      heading: 'Enhance Guest Experience',
      description:
        'Send personalized emails for reservations, updates, and promotions.',
      quote:
        '"Mailerfuse has improved our communication with guests." - Emily, Hotel Manager',
      startContent: <RiRestaurantFill fontSize={ICON_SIZE} />,
    },
    {
      name: 'Education',
      heading: 'Streamline Communication',
      description:
        'Send announcements, updates, and resources to students and faculty.',
      quote:
        '"Mailerfuse has made it easy to keep everyone informed." - Sarah, School Principal',
      startContent: <RiGraduationCapLine fontSize={ICON_SIZE} />,
    },
    {
      name: 'Recruitment',
      heading: 'Attract Top Talent',
      description:
        'Send job listings, interview invitations, and onboarding materials.',
      quote:
        '"Mailerfuse has helped us build stronger relationships with our clients." - Michael, Consultant',
      startContent: <RiBriefcaseLine fontSize={ICON_SIZE} />,
    },
    {
      name: 'Real Estate',
      heading: 'Attract Buyers and Tenants',
      description:
        'Send marketing materials, open house invitations, and leasing information.',
      quote:
        '"Mailerfuse has helped us reach more potential buyers and tenants." - Jessica, Real Estate Agent',
      startContent: <RiBuildingLine fontSize={ICON_SIZE} />,
    },
  ]

  // State to track the selected use case
  const [selectedUseCase, setSelectedUseCase] = useState(useCases[0])

  return (
    <div className="w-screen mx-auto flex justify-center py-32 px-6">
      <div className="w-full max-w-4xl">
        <h2 className="text-3xl font-bold">Yes, Mailerfuse is for you</h2>
        <div className="flex flex-wrap mt-8 gap-9">
          <div className="basis-[260px] shrink flex flex-col gap-3">
            {useCases.map((useCase, index) => (
              <Button
                key={index}
                size="lg"
                variant={
                  selectedUseCase?.name === useCase.name ? 'faded' : 'light'
                }
                color={
                  selectedUseCase?.name === useCase.name ? 'primary' : 'default'
                }
                startContent={useCase.startContent}
                endContent={<RiArrowRightLine />}
                className={`w-full justify-start ${
                  selectedUseCase?.name !== useCase.name &&
                  'text-foreground-500'
                }`}
                onClick={() => setSelectedUseCase(useCase)} // Update content on click
              >
                {useCase.name}
              </Button>
            ))}
          </div>

          <div className="basis-[50%] grow">
            <Card className="p-6 shadow-md h-full flex flex-col justify-between">
              <CardHeader>
                <h3 className="text-2xl font-semibold">
                  {selectedUseCase.heading}
                </h3>
              </CardHeader>
              <CardBody>
                <p>{selectedUseCase.description}</p>
                <div>
                  <Button color="primary">See examples here →</Button>
                </div>
              </CardBody>
              <CardFooter>
                <p className="mt-6 italic text-foreground-500">
                  {selectedUseCase.quote}
                </p>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default UseCases
