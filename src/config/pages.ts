/**
 * STATIC PAGE METADATA.
 * Detail pages (one service, project or post) take SEO from their Markdown frontmatter instead.
 * Final title (with "| Company") should be 30–60 chars; description 70–160.
 */
import type { PageSeo } from '@lib/seo';

export const pages = {
  home: {
    title: 'Samyukta Technology — Software, Web & UI/UX Design',
    description:
      'Samyukta Technology builds MVPs, websites and IT solutions, with UI/UX design, DevOps automation, QA testing and 24/7 support.',
    absoluteTitle: true,
  },
  services: {
    title: 'MVP, DevOps, QA & Design Services',
    description:
      'MVP development, IT and digital solutions, DevOps and automation, software testing and QA, UI/UX design and website design.',
  },
  projects: {
    title: 'Projects & Case Studies',
    description:
      'Selected client work, including Medmax E-commerce, Khatamandu, MTEF-MIS, Alpine Voyagers and Texas Yeti Homes.',
  },
  about: {
    title: 'About Us — Our Mission & Values',
    description:
      'Samyukta Technology combines deep technical expertise with a customer-first mindset to deliver reliable, scalable IT solutions.',
  },
  contact: {
    title: 'Contact Us — Start Your Project',
    description:
      'Tell us about your project and book a free consultation. We build MVPs, websites and IT solutions, backed by 24/7 support.',
  },
  blog: {
    title: 'Blog — Software & Design Insights',
    description:
      'Articles from the Samyukta Technology team on software development, UI/UX design, DevOps, testing and digital products.',
  },
  notFound: {
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist or has moved. Head back to the homepage.',
    noindex: true,
  },
} satisfies Record<string, PageSeo>;
