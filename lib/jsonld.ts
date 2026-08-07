import { BRAND } from "@/lib/constants";
import type { Service, BlogPost, Event } from "@/types";

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: BRAND.site.name,
    url: BRAND.site.url,
    description: BRAND.site.tagline,
    sameAs: [BRAND.site.instagram],
    contactPoint: {
      "@type": "ContactPoint",
      email: BRAND.site.email,
      contactType: "customer service",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Barcelona",
      addressCountry: "ES",
    },
  };
}

export function serviceJsonLd(service: Service) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: service.name,
    description: service.short_description || service.description || "",
    ...(service.image_url && { image: service.image_url }),
    provider: {
      "@type": "Organization",
      name: BRAND.site.name,
      url: BRAND.site.url,
    },
    ...(service.price != null && {
      offers: {
        "@type": "Offer",
        price: service.price,
        priceCurrency: "EUR",
        availability: "https://schema.org/InStock",
      },
    }),
    areaServed: "Worldwide",
  };
}

export function articleJsonLd(post: BlogPost) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.meta_title || post.title,
    description: post.meta_description || post.excerpt || "",
    datePublished: post.published_at || post.created_at,
    dateModified: post.updated_at,
    author: {
      "@type": "Person",
      name: "Gabs",
      url: `${BRAND.site.url}/about`,
    },
    publisher: {
      "@type": "Organization",
      name: BRAND.site.name,
      url: BRAND.site.url,
    },
    mainEntityOfPage: `${BRAND.site.url}/blog/${post.slug}`,
    ...(post.featured_image_url && { image: post.featured_image_url }),
  };
}

export function eventJsonLd(event: Event) {
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.date,
    description: event.description || "",
    location: {
      "@type": "Place",
      name: event.location || "Barcelona, Spain",
      address: event.location || "Barcelona, Spain",
    },
    offers: {
      "@type": "Offer",
      price: event.price ?? 0,
      priceCurrency: "EUR",
      ...(event.eventbrite_url && { url: event.eventbrite_url }),
      availability: "https://schema.org/InStock",
    },
    organizer: {
      "@type": "Organization",
      name: BRAND.site.name,
      url: BRAND.site.url,
    },
  };
}
