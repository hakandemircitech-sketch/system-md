import LandingClient from '@/components/landing/LandingClient'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'SystemMD',
  url: 'https://system-md.com',
  description:
    'AI-powered blueprint generator for developers and indie hackers. Turn any app idea into a production-ready architecture blueprint — tech stack, database schema, API design, file structure and revenue model. Free, no sign-up required.',
  applicationCategory: 'DeveloperApplication',
  operatingSystem: 'Web',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
    availability: 'https://schema.org/InStock',
    description: 'Free to use, no sign-up required',
  },
  featureList: [
    'AI-generated software architecture',
    'Tech stack recommendations',
    'Database schema generation',
    'API design blueprint',
    'File structure output',
    'Revenue model suggestions',
    'ZIP download',
    'No sign-up required',
  ],
  aggregateRating: {
    '@type': 'AggregateRating',
    ratingValue: '5',
    ratingCount: '1',
  },
}

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingClient />
    </>
  )
}
