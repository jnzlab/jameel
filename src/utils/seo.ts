/*
 * JSON-LD builders. Every page refers to the same Person entity by @id, so
 * Google (and AI search) can reconcile the site, the blog and the external
 * profiles into one "Jameel Ahmad" entity.
 */
import { SITE } from "@/config";

const site = SITE.website.replace(/\/$/, "");

export const PERSON_ID = `${site}/#person`;
export const WEBSITE_ID = `${site}/#website`;

/** Profiles that link back to jnzlab.io. Keep in sync with those profiles. */
export const SAME_AS = [
  "https://github.com/jnzlab",
  "https://linkedin.com/in/jnzlab",
  "https://x.com/jnzlab",
];

export const LOCATION = {
  city: "Gujranwala",
  region: "Punjab",
  country: "Pakistan",
  countryCode: "PK",
} as const;

type JsonLd = Record<string, unknown>;

export function personSchema(): JsonLd {
  return {
    "@type": "Person",
    "@id": PERSON_ID,
    name: SITE.author,
    alternateName: "jnzlab",
    url: `${site}/about/`,
    email: "mailto:jameel@jnzlab.io",
    jobTitle: "Full-Stack Software Engineer",
    description:
      "Freelance full-stack software engineer in Gujranwala, Pakistan, building Next.js, TypeScript and AI-powered web apps for clients worldwide.",
    address: {
      "@type": "PostalAddress",
      addressLocality: LOCATION.city,
      addressRegion: LOCATION.region,
      addressCountry: LOCATION.countryCode,
    },
    homeLocation: {
      "@type": "City",
      name: `${LOCATION.city}, ${LOCATION.region}, ${LOCATION.country}`,
    },
    worksFor: {
      "@type": "Organization",
      name: "Innovorus",
      url: "https://www.innovorus.com/",
    },
    alumniOf: {
      "@type": "CollegeOrUniversity",
      name: "GIFT University",
      address: { "@type": "PostalAddress", addressLocality: LOCATION.city, addressCountry: "PK" },
    },
    knowsAbout: [
      "Software engineering",
      "Full-stack web development",
      "Next.js",
      "React",
      "TypeScript",
      "Node.js",
      "PostgreSQL",
      "Supabase",
      "Cloudflare Workers",
      "AI integration",
      "Fedora Linux",
    ],
    knowsLanguage: ["en", "ur", "pa"],
    sameAs: SAME_AS,
  };
}

export function websiteSchema(): JsonLd {
  return {
    "@type": "WebSite",
    "@id": WEBSITE_ID,
    url: `${site}/`,
    name: SITE.title,
    alternateName: ["jnzlab", "jnzlab.io"],
    description: SITE.desc,
    inLanguage: SITE.lang || "en",
    publisher: { "@id": PERSON_ID },
    author: { "@id": PERSON_ID },
  };
}

export function profilePageSchema(url: string, dateModified?: Date): JsonLd {
  return {
    "@type": "ProfilePage",
    "@id": `${url}#profile`,
    url,
    name: `About ${SITE.author}`,
    isPartOf: { "@id": WEBSITE_ID },
    ...(dateModified && { dateModified: dateModified.toISOString() }),
    mainEntity: { "@id": PERSON_ID },
  };
}

/** A professional service offered by the Person, scoped to where it's offered. */
export function serviceSchema(opts: {
  url: string;
  name: string;
  description: string;
  serviceTypes: string[];
  areaServed: JsonLd[];
}): JsonLd {
  return {
    "@type": "Service",
    "@id": `${opts.url}#service`,
    url: opts.url,
    name: opts.name,
    description: opts.description,
    serviceType: opts.serviceTypes,
    provider: { "@id": PERSON_ID },
    areaServed: opts.areaServed,
  };
}

export const AREA = {
  gujranwala: {
    "@type": "City",
    name: "Gujranwala",
    containedInPlace: { "@type": "AdministrativeArea", name: "Punjab, Pakistan" },
  },
  pakistan: { "@type": "Country", name: "Pakistan" },
  worldwide: { "@type": "Place", name: "Worldwide (remote)" },
} as const;

export function breadcrumbSchema(items: Array<{ name: string; url: string }>): JsonLd {
  return {
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function blogPostingSchema(opts: {
  url: string;
  headline: string;
  description: string;
  image: string;
  datePublished: Date;
  dateModified?: Date | null;
  tags: string[];
}): JsonLd {
  return {
    "@type": "BlogPosting",
    "@id": `${opts.url}#article`,
    mainEntityOfPage: opts.url,
    url: opts.url,
    headline: opts.headline,
    description: opts.description,
    image: opts.image,
    datePublished: opts.datePublished.toISOString(),
    dateModified: (opts.dateModified ?? opts.datePublished).toISOString(),
    keywords: opts.tags.join(", "),
    inLanguage: SITE.lang || "en",
    author: { "@id": PERSON_ID, "@type": "Person", name: SITE.author, url: `${site}/about/` },
    publisher: { "@id": PERSON_ID },
    isPartOf: { "@id": WEBSITE_ID },
  };
}

/** Wraps nodes in one @graph document. */
export function graph(nodes: JsonLd[]): JsonLd {
  return { "@context": "https://schema.org", "@graph": nodes };
}
