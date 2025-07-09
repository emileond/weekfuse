import Faq from '../components/marketing/Faq';
import Feature from '../components/marketing/Feature';
import FeaturesGrid from '../components/marketing/FeaturesGrid';
import Footer from '../components/marketing/Footer';
import Hero from '../components/marketing/Hero';
import NavBar from '../components/marketing/Nav';
import Pricing from '../components/marketing/Pricing';
import { ContainerScroll } from '../components/marketing/ContainerScroll.jsx';
import UseCases from '../components/marketing/UseCases.jsx';
import { OrbitingCircles } from '../components/marketing/OrbitCircles.jsx';
import BentoFeatures from '../components/marketing/BentoFeatures.jsx';

function LandingPage() {
    return (
        <div className="w-screen bg-content1">
            <NavBar />
            <ContainerScroll>
                <img src="/ui-main.png" alt="UI" />
            </ContainerScroll>
            {/*<Hero />*/}
            <Feature
                id="features"
                chip="Integrations"
                childComponent={<OrbitingCircles />}
                heading="All Your Work, One Central Hub."
                description="Weekfuse seamlessly pulls in your tasks from where they already live to manage workload in one unified space."
            />

            <Feature
                reverse
                imageUrl="/planner.svg"
                chip="Weekly Planning"
                heading="Plan Smarter, Not Harder."
                description="Take control of your week with our intuitive planning tools. Weekfuse AI can suggest a weekly plan for you, considering your tasks and priorities."
            />
            <Feature
                imageUrl="/integrations.png"
                chip="AI-Guided Reflections"
                heading="Unlock Insights. Grow Continuously."
                description="Be intentional about your work with Weekfuse's AI-guided reflections."
            />
            <BentoFeatures />
            {/*<FeaturesGrid />*/}
            {/*<UseCases />*/}
            <Pricing isLanding />
            <Faq />
            <Footer />
        </div>
    );
}

export default LandingPage;
