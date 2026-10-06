import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // --- Admin user ---
  const adminUsername = process.env.SEED_ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD || 'medwin2026';
  const existingAdmin = await prisma.adminUser.findUnique({ where: { username: adminUsername } });
  if (!existingAdmin) {
    await prisma.adminUser.create({
      data: {
        username: adminUsername,
        passwordHash: await bcrypt.hash(adminPassword, 10),
        role: 'SUPER_ADMIN',
      },
    });
    console.log(`Seeded admin user "${adminUsername}" — change this password after first login.`);
  }

  // --- Services ---
  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    await prisma.service.createMany({
      data: [
        { icon: 'film', title: 'Video Editing', desc: 'Reels, YouTube, ads and wedding films cut with pace, colour and sound that keep people watching.', items: ['Instagram Reels & Shorts', 'YouTube videos', 'Wedding highlights', 'Corporate & ad videos', 'Motion graphics & titles', 'Colour grading', 'Subtitles & captions', 'AI-assisted editing'], order: 0 },
        { icon: 'camera', title: 'Videography', desc: 'On-site shoots for events, products, real estate and brands — handled start to finish.', items: ['Event coverage', 'Product shoots', 'Real estate & drone', 'Fashion & jewellery shoots', 'Restaurant & hospitality shoots', 'Testimonial & interview filming'], order: 1 },
        { icon: 'ai', title: 'AI Services', desc: 'AI avatars, voiceovers, upscaling and script generation to move faster without losing quality.', items: ['AI promo videos', 'AI avatar & voice', 'AI posters & ads', 'Background replacement', 'Video upscaling', 'Script generation'], order: 2 },
        { icon: 'pen', title: 'Graphic Design', desc: 'Posters, brochures, packaging and brand kits designed to match how your brand actually sounds.', items: ['Social media posts', 'Posters & flyers', 'Brochures & banners', 'Logo & brand kit', 'Packaging design', 'YouTube thumbnails'], order: 3 },
        { icon: 'share', title: 'Social Media Management', desc: 'Content calendars, daily posting and community management so your feed never goes quiet.', items: ['Content calendar', 'Daily posting', 'Captions & hashtags', 'Community management', 'Analytics & reporting', 'Competitor analysis'], order: 4 },
        { icon: 'chart', title: 'Digital Marketing', desc: 'SEO, paid ads and lead generation built around what your business sells, not vanity metrics.', items: ['SEO & local SEO', 'Google & Meta ads', 'Lead generation', 'WhatsApp & email marketing', 'Landing pages', 'Performance marketing'], order: 5 },
        { icon: 'code', title: 'Website Services', desc: 'Fast, mobile-first websites with booking built in — from landing page to full e-commerce.', items: ['Business/portfolio website', 'Landing pages', 'E-commerce site', 'Website redesign', 'Speed optimisation', 'Booking integration'], order: 6 },
        { icon: 'badge', title: 'Branding', desc: 'Identity, guidelines, colour and type systems that hold together across every touchpoint.', items: ['Brand identity & guidelines', 'Logo design', 'Colour palette & type system', 'Social media branding'], order: 7 },
      ],
    });
  }

  // --- Portfolio ---
  if ((await prisma.portfolioItem.count()) === 0) {
    await prisma.portfolioItem.createMany({
      data: [
        { category: 'Video Editing', tag: 'Wedding Highlights', title: 'A Kaveri-side wedding film', order: 0 },
        { category: 'Videography', tag: 'Real Estate', title: 'Villa walkthrough & drone reel', order: 1 },
        { category: 'Digital Marketing', tag: 'Product Launch', title: 'D2C skincare launch campaign', order: 2 },
        { category: 'Video Editing', tag: 'Reels Series', title: '12-part reel series for a café', order: 3 },
        { category: 'Branding', tag: 'Brand Film', title: 'Identity film for a jewellery house', order: 4 },
        { category: 'Videography', tag: 'Corporate Event', title: 'Annual conference coverage', order: 5 },
      ],
    });
  }

  // --- Packages ---
  if ((await prisma.package.count()) === 0) {
    await prisma.package.createMany({
      data: [
        { name: 'Video Editing', desc: 'Ongoing edits for a steady stream of Reels, YouTube and ad content.', features: ['Monthly edit quota', 'Fast turnaround', 'Revisions included'], order: 0 },
        { name: 'Videography + Editing', desc: 'Shoot and edit handled together for events, products or brand shoots.', features: ['On-site crew', 'Same-team editing', 'One point of contact'], popular: true, order: 1 },
        { name: 'Social Media', desc: 'Full management of your feed, from planning to posting.', features: ['Content calendar', 'Daily posting', 'Monthly analytics'], order: 2 },
        { name: 'Digital Marketing', desc: 'Paid ads, SEO and lead generation working toward one goal.', features: ['Ad management', 'SEO & landing pages', 'Monthly reporting'], order: 3 },
        { name: 'Business Growth', desc: 'Editing, social and marketing bundled for brands scaling fast.', features: ['Cross-channel strategy', 'Dedicated support', 'Priority scheduling'], popular: true, order: 4 },
        { name: 'Website + SEO', desc: 'A fast, booking-ready website with search visibility built in.', features: ['Custom design', 'On-page SEO', 'Ongoing maintenance'], order: 5 },
      ],
    });
  }

  // --- Testimonials ---
  if ((await prisma.testimonial.count()) === 0) {
    await prisma.testimonial.createMany({
      data: [
        { quote: 'They turned three days of raw wedding footage into a film our whole family still rewatches.', name: 'Divya R.', role: 'Wedding client, Thanjavur', order: 0 },
        { quote: 'Our Reels went from ignored to actually driving bookings within a month of working with them.', name: 'Arun K.', role: 'Restaurant owner', order: 1 },
        { quote: 'Fast, clear communication, and the final videos looked far more premium than what we paid for.', name: 'Meera S.', role: 'D2C brand founder', order: 2 },
      ],
    });
  }

  // --- FAQs ---
  if ((await prisma.faq.count()) === 0) {
    await prisma.faq.createMany({
      data: [
        { question: 'How long does editing usually take?', answer: 'Most Reels and short-form edits are delivered within 48–72 hours. Full wedding films typically take 7–10 days.', order: 0 },
        { question: 'How does a booking get confirmed?', answer: 'After you submit the booking form, our team calls to confirm details. The booking only moves to Confirmed after that call.', order: 1 },
        { question: 'Is a deposit required to lock in a date?', answer: 'For event bookings, a deposit secures your date once confirmed. The amount is set out clearly in your quotation first.', order: 2 },
      ],
    });
  }

  // --- Event types ---
  if ((await prisma.eventType.count()) === 0) {
    const names = ['Wedding Highlights', 'Engagement', 'Reception', 'Birthday', 'School Events', 'College Events', 'Political Campaign', 'Corporate Event', 'Bike/Car Delivery', 'Motorshow', 'Real Estate', 'Product Launch', 'Temple Events', 'Personal Event', 'Custom Event'];
    await prisma.eventType.createMany({ data: names.map((name, order) => ({ name, order })) });
  }

  // --- Offer ---
  if ((await prisma.offer.count()) === 0) {
    await prisma.offer.create({
      data: {
        enabled: true,
        text: '🔥 Festival Special — Up to 20% off Video Editing & Branding packages',
        endAt: new Date(Date.now() + 12 * 24 * 3600 * 1000),
      },
    });
  }

  // --- Site content singleton ---
  const content = await prisma.siteContent.findUnique({ where: { id: 'singleton' } });
  if (!content) {
    await prisma.siteContent.create({
      data: {
        id: 'singleton',
        heroEyebrow: 'Video Editing · Videography · AI Content · Digital Marketing',
        heroHeadline: 'We Create Powerful Videos That Grow Your Brand.',
        heroSub: 'Professional video editing, videography, AI content creation and digital marketing for businesses, creators and brands — one team, start to finish.',
        heroStats: [
          { value: '250+', label: 'Projects delivered' },
          { value: '9', label: 'Service categories' },
          { value: '48hr', label: 'Avg. first-cut turnaround' },
          { value: '4.9/5', label: 'Client rating' },
        ],
        whoHeadline: 'Meet Medwin Levay E — Founder, Medwin Montage.',
        whoText: [
          'I am Medwin Levay E, a 16-year-old student currently pursuing my Senior Secondary Education in the Computer Science with Mathematics (CS Maths) group. I am passionate about technology, creativity, multimedia and building my own professional journey while continuing my education.',
          'I completed my Secondary Education at PM SHRI Kendriya Vidyalaya AFS Thanjavur in 2026. I then joined Bishop Devadoss Ambrose Vidyalaya, Thanjavur for my Senior Secondary Education. Alongside my studies, I started MEDWIN MONTAGE to provide multimedia services with a simple goal — low price, high quality and on-time delivery. My services are available across Tamil Nadu and Kerala.',
          'Today, while continuing my Senior Secondary Education, I run MEDWIN MONTAGE as a part-time freelancing service, balancing education with real-world creative work and continuously developing my skills for the future.',
        ].join('\n\n'),
        contactAddress: 'Thanjavur, Tamil Nadu, India',
        contactPhone: '+91 90000 00000',
        whatsappNumber: '+91 94878 97160',
        contactEmail: 'hello@medwinmontage.com',
        contactHours: 'Mon–Sat, 10am–7pm',
        privacyText: 'Add your privacy policy here.',
        termsText: 'Add your terms & conditions here.',
        refundText: 'Add your refund policy here.',
      },
    });
  }

  // --- SEO settings singleton (edit in Admin → SEO Settings) ---
  if (!(await prisma.seoSettings.findUnique({ where: { id: 'singleton' } }))) {
    await prisma.seoSettings.create({
      data: {
        id: 'singleton',
        siteTitle: 'Medwin Montage',
        seoTitle: 'Medwin Montage — Freelancing Creative & Digital Services',
        titleTemplate: '%s | Medwin Montage',
        metaDescription: 'Video editing, videography, graphic design, AI video creation, websites and digital marketing from one freelance team in Thanjavur, Tamil Nadu.',
        primaryKeywords: ['video editing', 'videography', 'digital marketing', 'website development'],
        secondaryKeywords: ['graphic design', 'AI video creation', 'event shoot and edit', 'social media management'],
        businessName: 'Medwin Montage',
        businessDescription: 'Video editing, videography, photography, AI content, design, websites and digital marketing — from one freelance team.',
        primaryLocation: 'Thanjavur, Tamil Nadu', city: 'Thanjavur', district: 'Thanjavur', state: 'Tamil Nadu', country: 'India',
        serviceAreas: ['Tamil Nadu', 'Kerala'],
        mainServices: ['Video editing', 'Videography', 'Graphic design', 'AI video creation', 'Website development', 'Digital marketing', 'Event shoot & edit'],
      },
    });
  }

  console.log('Seed complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
