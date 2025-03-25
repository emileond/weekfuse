import { Button, ButtonGroup, Chip } from "@heroui/react"
import PricingCard from './PricingCard'
import { useState } from 'react'

function PricingPlans() {
  const [isYearly, setIsYearly] = useState(true)

  const plans = [
    {
      name: 'Basic',
      price: 19,
      yearlyPrice: 152,
      features: ['500 GB Storage', '2 Users Allowed', 'Send up to 3 GB'],
    },
    {
      name: 'Pro',
      price: 19,
      yearlyPrice: 249,
      features: ['500 GB Storage', '2 Users Allowed', 'Send up to 3 GB'],
      highlight: true,
    },
    {
      name: 'Business',
      price: 19,
      yearlyPrice: 499,
      features: ['500 GB Storage', '2 Users Allowed', 'Send up to 3 GB'],
    },
  ]

  return (
    <>
      <ButtonGroup size="sm" className="mb-3">
        <Button
          color={isYearly ? 'primary' : 'default'}
          variant={isYearly ? 'flat' : 'faded'}
          endContent={
            <Chip size="sm" color="primary">
              Save 20%
            </Chip>
          }
          onClick={() => setIsYearly(true)}
        >
          Yearly
        </Button>
        <Button
          color={isYearly ? 'default' : 'primary'}
          variant={isYearly ? 'faded' : 'flat'}
          onClick={() => setIsYearly(false)}
        >
          Monthly
        </Button>
      </ButtonGroup>
      <div className="w-full flex flex-wrap gap-6">
        {plans.map((plan, index) => (
          <PricingCard
            key={index}
            name={plan?.name}
            price={plan?.price}
            yearlyPrice={plan?.yearlyPrice}
            isYearly={isYearly}
            features={plan?.features}
            highlight={plan?.highlight}
          />
        ))}
      </div>
    </>
  )
}

export default PricingPlans
