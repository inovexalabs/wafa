import Navbar from "@/components/navbar";
import Hero from "@/components/hero";
import About from "@/components/about";
import Services from "@/components/services";
import HowItWorks from "@/components/how-it-works";
import Testimonials from "@/components/testimonials";
import Cta from "@/components/cta";
import Footer from "@/components/footer";
import { getLandingContent } from "@/lib/content";

export default async function Home() {
  const content = await getLandingContent();

  return (
    <>
      <Navbar />
      <main className="flex-1">
        <Hero content={content.hero} />
        <About content={content.about} />
        <Services services={content.services} />
        <HowItWorks steps={content.steps} />
        <Testimonials testimonials={content.testimonials} />
        <Cta content={content.cta} />
      </main>
      <Footer contact={content.contact} />
    </>
  );
}
