'use strict';

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const universities = [
   {
    name:        'BRAC University',
    website:     'https://www.bracu.ac.bd',
    location:    'Dhaka',
    type:        'PRIVATE',
    scrapeable:  true,
    description: 'Leading private university known for research and innovation.',
    scrapeUrls: [
      'https://www.bracu.ac.bd/admissions/tuition-and-fees',
      'https://www.bracu.ac.bd/admissions/undergraduate',
      'https://www.bracu.ac.bd/admissions/scholarships-and-financial-aid',
    ],
  },
  {
    name:        'North South University (NSU)',
    website:     'https://admissions.northsouth.edu',
    location:    'Dhaka',
    type:        'PRIVATE',
    scrapeable:  true,
    description: 'First private university in Bangladesh, established in 1992.',
    scrapeUrls: [
      'https://admissions.northsouth.edu/tuition',
      'https://www.northsouth.edu/resources/fao.html',
      'https://admissions.northsouth.edu/apply',
      'https://admissions.northsouth.edu/program',
    ],
  },
  {
    name:        'Independent University, Bangladesh (IUB)',
    website:     'https://iub.ac.bd',
    location:    'Dhaka',
    type:        'PRIVATE',
    scrapeable:  true,
    description: 'Private university focused on liberal arts, business and technology.',
    scrapeUrls: [
      'https://iub.ac.bd/admissions/undergraduate-admissions',
      'https://iub.ac.bd/admissions/graduate-admissions',
      'https://iub.ac.bd/admissions/tuition-fees-and-charges',
      'https://iub.ac.bd/admissions/scholarships-and-financial-aid',
      'https://iub.ac.bd/admissions/undergrad-fa-2020-22',
      'https://iub.ac.bd/admissions/graduate-financial-aid-policy-2020-22',
    ],
  }
];

// Default scrape configs with retry policy
const defaultScrapeConfig = (strategy) => ({
  strategy,
  retryPolicy: {
    enabled:     true,
    maxAttempts: 3,
    backoffMs:   3000,
  },
  accuracyThreshold: 50,
  selectors:         {},
});

async function main() {
  console.log('\n Seeding universities...\n');

  for (const uni of universities) {
    const created = await prisma.university.upsert({
      where:  { website: uni.website },
      update: {
        name:        uni.name,
        location:    uni.location,
        type:        uni.type,
        scrapeable:  uni.scrapeable,
        description: uni.description,
        scrapeUrls:  uni.scrapeUrls,
      },
      create: uni,
    });

    // Seed default scrape config
    const strategy = uni.website.includes('bracu') ? 'zenrows'
                   : uni.website.includes('northsouth') || uni.website.includes('iub') ? 'puppeteer'
                   : 'axios';

    await prisma.universityScrapeConfig.upsert({
      where:  { universityId: created.id },
      update: {},
      create: {
        universityId: created.id,
        config:       defaultScrapeConfig(strategy),
      },
    });

    console.log(`${uni.name} [${strategy}]`);
  }

  console.log('\n Seed complete.\n');
}

main()
  .catch(err => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
