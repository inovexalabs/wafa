import type { Metadata } from "next";
import type { LandingContent, LandingFaq } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

// Stable @ids let every page's JSON-LD point at the same organization and
// website entities instead of redeclaring them.
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

export type JsonLdNode = Record<string, unknown>;

// Served by app/opengraph-image.tsx. The root layout gets it automatically,
// but a child segment that defines its own openGraph object drops the
// inherited file-based image, so pageMetadata points at it explicitly.
export const OG_IMAGE = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "WAFA Group — We Are For All",
};

// Child pages must set their own canonical and Open Graph URL; otherwise they
// inherit the root layout's "/" and read as duplicates of the homepage.
export function pageMetadata({
  title,
  description,
  path,
  image,
  article,
}: {
  title: string;
  description?: string;
  path: string;
  /** Page-specific share image (e.g. a blog cover); defaults to the site OG image. */
  image?: string | null;
  /** Marks the page as an article for Open Graph (blog posts). */
  article?: { publishedTime: string; modifiedTime?: string; authors?: string[]; tags?: string[] };
}): Metadata {
  const fullTitle = `${title} | WAFA Group`;
  const shareImage = image ? { url: image, alt: title } : OG_IMAGE;
  return {
    title,
    ...(description ? { description } : {}),
    alternates: { canonical: path },
    openGraph: {
      ...(article ? { type: "article" as const, ...article } : { type: "website" as const }),
      url: path,
      siteName: "WAFA Group",
      title: fullTitle,
      ...(description ? { description } : {}),
      images: [shareImage],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      ...(description ? { description } : {}),
      images: [shareImage.url],
    },
  };
}

export function absoluteUrl(path: string) {
  return new URL(path, SITE_URL).toString();
}

function isHttpUrl(value: string) {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

// The contact phone field holds local mobile numbers separated by "/", e.g.
// "981-0088578 / 981-8939377"; schema.org expects international format.
function toInternationalPhones(phone: string) {
  return phone
    .split("/")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => (part.startsWith("+") ? part : `+977-${part.replace(/^0+/, "")}`));
}

export function organizationSchema(content: LandingContent): JsonLdNode {
  const { contact, socialLinks } = content;
  const sameAs = socialLinks.map((link) => link.url).filter(isHttpUrl);

  return {
    "@type": "FinancialService",
    "@id": ORGANIZATION_ID,
    name: "WAFA Group",
    alternateName: "WAFA",
    slogan: "We Are For All",
    description:
      "A member-owned savings and credit cooperative in Nepal built on trust, discipline and shared growth.",
    url: SITE_URL,
    logo: absoluteUrl("/icon-512.png"),
    image: absoluteUrl("/icon-512.png"),
    email: contact.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: contact.address,
      addressCountry: "NP",
    },
    areaServed: { "@type": "Country", name: "Nepal" },
    contactPoint: toInternationalPhones(contact.phone).map((telephone) => ({
      "@type": "ContactPoint",
      telephone,
      email: contact.email,
      contactType: "customer service",
      areaServed: "NP",
    })),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

export function websiteSchema(): JsonLdNode {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    name: "WAFA Group",
    url: SITE_URL,
    inLanguage: "en",
    publisher: { "@id": ORGANIZATION_ID },
  };
}

export function publishableFaqs(faqs: LandingFaq[]) {
  return faqs.filter((faq) => faq.question.trim() && faq.answer.trim());
}

export function faqSchema(faqs: LandingFaq[], pageUrl: string): JsonLdNode | null {
  const items = publishableFaqs(faqs);
  if (items.length === 0) return null;
  return {
    "@type": "FAQPage",
    "@id": `${pageUrl}#faq`,
    mainEntity: items.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };
}

export type Breadcrumb = { name: string; path: string };

export function breadcrumbSchema(crumbs: Breadcrumb[], pageUrl: string): JsonLdNode {
  return {
    "@type": "BreadcrumbList",
    "@id": `${pageUrl}#breadcrumb`,
    itemListElement: crumbs.map((crumb, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

export function graph(nodes: (JsonLdNode | null)[]) {
  return {
    "@context": "https://schema.org",
    "@graph": nodes.filter((node): node is JsonLdNode => node !== null),
  };
}

export function webPageSchema({
  type = "WebPage",
  path,
  name,
  description,
  extra = {},
}: {
  type?: string;
  path: string;
  name: string;
  description: string;
  extra?: JsonLdNode;
}): JsonLdNode {
  const url = absoluteUrl(path);
  return {
    "@type": type,
    "@id": url,
    url,
    name,
    description,
    inLanguage: "en",
    isPartOf: { "@id": WEBSITE_ID },
    about: { "@id": ORGANIZATION_ID },
    breadcrumb: { "@id": `${url}#breadcrumb` },
    ...extra,
  };
}
