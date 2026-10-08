import Hero from "@/components/hero";
import About from "@/components/about";
import Team from "@/components/team";
import Board from "@/components/board";
import Services from "@/components/services";
import HowItWorks from "@/components/how-it-works";
import Partners from "@/components/partners";
import Investments from "@/components/investments";
import Gallery from "@/components/gallery";
import Career from "@/components/career";
import News from "@/components/news";
import Documents from "@/components/documents";
import Testimonials from "@/components/testimonials";
import Faq from "@/components/faq";
import JsonLd from "@/components/json-ld";
import Contact from "@/components/contact";
import Cta from "@/components/cta";
import Footer from "@/components/footer";
import {
  getCareerOpenings,
  getLandingContent,
  getLandingItems,
  getLandingPeople,
  getNewsPosts,
  getPublicDocuments,
} from "@/lib/content";
import {
  absoluteUrl,
  faqSchema,
  graph,
  organizationSchema,
  publishableFaqs,
  websiteSchema,
} from "@/lib/seo";

export default async function Home() {
  const [content, team, board, partners, investments, gallery, news, career, documents] =
    await Promise.all([
      getLandingContent(),
      getLandingPeople("team"),
      getLandingPeople("board"),
      getLandingItems("partner"),
      getLandingItems("investment"),
      getLandingItems("gallery"),
      getNewsPosts(),
      getCareerOpenings(),
      getPublicDocuments(),
    ]);

  const faqs = publishableFaqs(content.faqs);

  return (
    <>
      <JsonLd
        data={graph([
          organizationSchema(content),
          websiteSchema(),
          faqSchema(faqs, absoluteUrl("/")),
        ])}
      />
      <main className="flex-1">
        <Hero content={content.hero} />
        <About content={content.about} />
        <Team people={team} />
        <Board people={board} />
        <Services services={content.services} />
        <HowItWorks steps={content.steps} />
        <Partners items={partners} />
        <Investments items={investments} />
        <Gallery items={gallery} />
        <Career openings={career} />
        <News posts={news} />
        <Documents documents={documents} />
        <Testimonials testimonials={content.testimonials} />
        <Faq faqs={faqs} />
        <Contact contact={content.contact} />
        <Cta content={content.cta} />
      </main>
      <Footer contact={content.contact} socialLinks={content.socialLinks} />
    </>
  );
}
