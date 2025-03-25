import Faq from '../components/marketing/Faq';
import Feature from '../components/marketing/Feature';
import FeaturesGrid from '../components/marketing/FeaturesGrid';
import Footer from '../components/marketing/Footer';
import Hero from '../components/marketing/Hero';
import NavBar from '../components/marketing/Nav';
import Pricing from '../components/marketing/Pricing';

function LandingPage() {
    return (
        <div className="w-screen bg-content1">
            <NavBar />
            <Hero />
            <Feature
                id="features"
                imageUrl="/UI.png"
                heading="Email List Validation Made Easy"
                description="Validate your entire email list in minutes to improve deliverability and maintain a healthy sender reputation. Reduce bounces and ensure your messages reach real, engaged recipients."
                ctaText="Get started"
            />
            <Feature
                reverse
                imageUrl="/codeimage.png"
                heading="Real-Time Verification API"
                description="Filter out invalid email addresses instantly on your website, landing pages, or application. Keep your lists clean from the start and protect your campaigns from wasted effort."
                ctaText="Get started"
            />
            <Feature
                imageUrl="/integrations.png"
                heading="Connect Mailerfuse with your favorite platforms"
                description="Connect seamlessly to your favorite email marketing platforms. Clean your mailing lists automatically and launch more effective campaigns that boost deliverability and safeguard your reputation."
                ctaText="Get started"
            />
            <FeaturesGrid />
            <Pricing volumePricing isLanding />
            <Faq />
            <Footer />
        </div>
    );
}

export default LandingPage;
