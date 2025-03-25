import {
  Button,
  Card,
  CardBody,
  CardFooter,
  CardHeader,
  Divider,
} from "@heroui/react"
import { RiCheckFill } from 'react-icons/ri'

function PricingCard({
  name = 'Free',
  price = 0,
  yearlyPrice = 0,
  isYearly = true,
  features,
  highlight = false,
}) {
  return (
    <Card
      className={`basis-[200px] grow ${highlight && 'border-2 border-primary'}`}
    >
      <CardHeader>
        <div className="flex flex-col gap-1 p-3">
          <h4 className="font-medium">{name}</h4>
          <div className="flex items-center gap-3">
            <h3 className="text-3xl font-bold">
              {Intl.NumberFormat('en-US', {
                style: 'currency',
                currency: 'USD',
              }).format(isYearly ? yearlyPrice / 12 : price)}
            </h3>
            <p className="text-small text-default-500"> / month</p>
          </div>
          <p className="text-small text-default-400">
            Billed {isYearly ? 'yearly' : 'monthly'}
          </p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody>
        <div className="flex flex-col gap-2 py-3">
          {features?.map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-xl text-success">{<RiCheckFill />}</span>
              <p className="font-medium text-default-500">{feature}</p>
            </div>
          ))}
        </div>
      </CardBody>
      <CardFooter>
        <Button
          className="w-full"
          color="primary"
          variant={highlight ? 'shadow' : 'ghost'}
        >
          Get started
        </Button>
      </CardFooter>
    </Card>
  )
}

export default PricingCard
