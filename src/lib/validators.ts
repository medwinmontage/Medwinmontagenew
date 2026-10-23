import { z } from 'zod';
import { WORK_STATUSES, QUOTE_STATUSES, CREW_STATUSES, FEEDBACK_STATUSES } from './status';
import { isSafeExternalUrl, isSafeInternalPath } from './links';

export const bookingSchema = z.object({
  eventType: z.string().min(1),
  eventDate: z.string().min(1),
  eventTime: z.string().optional(),
  location: z.string().min(1),
  budget: z.string().optional(),
  notes: z.string().optional(),
  name: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email(),
});

export const leadSchema = z.object({
  mode: z.enum(['service', 'offer']).default('service'),
  categories: z.array(z.string()).min(1),
  itemsJson: z.record(z.array(z.string())).default({}),
  detailsJson: z.record(z.any()).default({}),
  name: z.string().min(1),
  phone: z.string().min(6),
  email: z.string().email(),
  location: z.string().min(1),
  company: z.string().optional(),
  gst: z.string().optional(),
});

export const quoteSchema = z.object({
  name: z.string().trim().min(1).max(100),
  company: z.string().trim().max(150).optional(),
  email: z.string().trim().email().max(150),
  phone: z.string().trim().min(6).max(20),
  whatsapp: z.string().trim().min(6).max(20),
});

export const customerRegisterSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().min(6),
  password: z.string().min(8),
  company: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
});

export const customerLoginSchema = z.object({
  identifier: z.string().min(1), // email or phone
  password: z.string().min(1),
});

export const adminLoginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export function refCode(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase().slice(-6)}`;
}

// ---------------------------------------------------------------------------
// Added with the customer portal / banners / SEO / crew upgrade
// ---------------------------------------------------------------------------

const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => text(max).optional().or(z.literal('').transform(() => undefined));
const phone = z.string().trim().regex(/^\+?[0-9][0-9\s\-()]{6,17}$/, 'Please enter a valid phone number.');

/** The ONLY fields a customer may change. `.strict()` rejects email, phone, status, id, etc. */
export const customerProfileSchema = z.object({
  name: text(100).min(1, 'Please enter your name.'),
  company: text(120).optional(),
  city: text(80).optional(),
  state: text(80).optional(),
}).strict();

export const workStatusUpdateSchema = z.object({
  status: z.enum(WORK_STATUSES).optional(),
  adminNotes: text(2000).optional(),
}).strict();

export const quoteUpdateSchema = z.object({
  status: z.enum(QUOTE_STATUSES).optional(),
  adminNotes: text(2000).optional(),
}).strict();

export const feedbackSchema = z.object({
  rating: z.coerce.number().int().min(1, 'Please choose a rating.').max(5),
  text: text(2000).min(5, 'Please write a few words about your experience.'),
  relatedRef: text(40).optional(),
  allowPublic: z.boolean().default(true),
}).strict();

export const feedbackAdminSchema = z.object({
  status: z.enum(FEEDBACK_STATUSES).optional(),
  text: text(2000).min(1).optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
}).strict();

const dateOrNull = z.union([z.string().datetime({ offset: true }), z.null(), z.literal('')])
  .transform((v) => (v ? new Date(v) : null));

export const bannerSchema = z.object({
  name: text(120).optional(),
  imageUrl: z.string().trim().max(1000).refine((v) => v.startsWith('/uploads/') || isSafeExternalUrl(v), 'Invalid image URL.').optional(),
  mobileImageUrl: z.string().trim().max(1000).refine((v) => v === '' || v.startsWith('/uploads/') || isSafeExternalUrl(v), 'Invalid mobile image URL.').optional(),
  altText: text(200).optional(),
  enabled: z.boolean().optional(),
  order: z.number().int().min(0).max(10000).optional(),
  linkType: z.enum(['none', 'internal', 'external']).optional(),
  linkUrl: z.string().trim().max(1000).optional(),
  startAt: dateOrNull.optional(),
  endAt: dateOrNull.optional(),
  timerEnabled: z.boolean().optional(),
}).strict().superRefine((b, ctx) => {
  if (b.linkType === 'internal' && !isSafeInternalPath(b.linkUrl || '')) {
    ctx.addIssue({ code: 'custom', path: ['linkUrl'], message: 'Internal links must be a path on this site, for example /join-as-crew or /#packages.' });
  }
  if (b.linkType === 'external' && !isSafeExternalUrl(b.linkUrl || '')) {
    ctx.addIssue({ code: 'custom', path: ['linkUrl'], message: 'External links must start with https:// (or http://).' });
  }
  if (b.startAt && b.endAt && b.endAt.getTime() <= b.startAt.getTime()) {
    ctx.addIssue({ code: 'custom', path: ['endAt'], message: 'The end date must be after the start date.' });
  }
  if (b.timerEnabled && b.endAt === null) {
    ctx.addIssue({ code: 'custom', path: ['endAt'], message: 'A timer needs an end date to count down to.' });
  }
});

export const CREW_ROLES = [
  'Account/Project Manager', 'Digital Marketing Manager', 'Copywriter', 'Graphic Designer', 'Video Producer',
  'SEO Specialist', 'PPC Manager', 'Social Media Manager', 'Web Developer', 'Data Analyst', 'Videographer',
  'Photographer', 'Ads Manager',
] as const;

const yesNo = z.enum(['Yes', 'No']);

/** Server-side rules for the crew form — the conditional fields are enforced here, not only in the browser. */
export const crewApplicationSchema = z.object({
  fullName: text(100).min(2, 'Please enter your full name.'),
  phone,
  age: z.coerce.number({ invalid_type_error: 'Please enter your age.' }).int('Please enter your age in whole years.').min(16, 'Applicants must be at least 16.').max(70, 'Please enter a valid age.'),
  role: z.enum(CREW_ROLES, { errorMap: () => ({ message: 'Please choose a role.' }) }),
  experienceType: z.enum(['Fresher', 'Experienced'], { errorMap: () => ({ message: 'Please choose Fresher or Experienced.' }) }),
  experienceYears: z.union([z.coerce.number().min(0.5, 'Please enter your years of experience.').max(50), z.literal('').transform(() => undefined)]).optional(),
  workedInOrganization: yesNo,
  organizationName: optionalText(150),
  educationStatus: z.enum(['Studying', 'Studied', 'Neither'], { errorMap: () => ({ message: 'Please tell us whether you are studying or have studied.' }) }),
  studiedWhat: optionalText(300),
  studyingWhatWhere: optionalText(300),
  previousWorkUrl: optionalText(1000),
}).superRefine((a, ctx) => {
  if (a.experienceType === 'Experienced' && a.experienceYears === undefined) {
    ctx.addIssue({ code: 'custom', path: ['experienceYears'], message: 'Please enter how many years of experience you have.' });
  }
  if (a.educationStatus === 'Studying' && !a.studyingWhatWhere) {
    ctx.addIssue({ code: 'custom', path: ['studyingWhatWhere'], message: 'Please tell us what and where you are studying.' });
  }
  if (a.previousWorkUrl && !(a.previousWorkUrl.startsWith('https://') && isSafeExternalUrl(a.previousWorkUrl))) {
    ctx.addIssue({ code: 'custom', path: ['previousWorkUrl'], message: 'Please paste a full link starting with https://' });
  }
}).transform((a) => ({
  ...a,
  // A fresher never has years; "No" never has an organisation — whatever the browser sent.
  experienceYears: a.experienceType === 'Experienced' ? a.experienceYears : undefined,
  workedInOrganization: a.workedInOrganization === 'Yes',
  organizationName: a.workedInOrganization === 'Yes' ? a.organizationName : undefined,
  studiedWhat: a.educationStatus === 'Neither' ? undefined : a.studiedWhat,
  studyingWhatWhere: a.educationStatus === 'Studying' ? a.studyingWhatWhere : undefined,
}));

export const crewAdminSchema = z.object({
  status: z.enum(CREW_STATUSES).optional(),
  adminNotes: text(2000).optional(),
}).strict();

const list = z.array(text(80).min(1)).max(40);
const urlOrEmpty = z.string().trim().max(500).refine((v) => v === '' || isSafeExternalUrl(v) || v.startsWith('/uploads/'), 'Please enter a full URL starting with https://');

export const seoSchema = z.object({
  siteTitle: text(70), seoTitle: text(70), titleTemplate: text(80).refine((v) => v === '' || v.includes('%s'), 'The title template must contain %s (the page name).'),
  metaDescription: text(200), primaryKeywords: list, secondaryKeywords: list,
  businessName: text(100), businessDescription: text(600), canonicalUrl: urlOrEmpty,
  ogTitle: text(90), ogDescription: text(200), ogImage: urlOrEmpty,
  twitterTitle: text(90), twitterDescription: text(200), twitterImage: urlOrEmpty,
  primaryLocation: text(120), city: text(80), district: text(80), state: text(80), country: text(80),
  serviceAreas: list, nearbyLocations: list, mainServices: list, serviceKeywords: list, localDescription: text(600),
  robotsIndex: z.boolean(), robotsFollow: z.boolean(), sitemapEnabled: z.boolean(), structuredData: z.boolean(),
}).partial(); // unknown keys are dropped, never written

const policyMode = z.enum(['text', 'url']);
/** Admin-editable site content. Unknown keys are rejected rather than written to the database. */
export const siteContentSchema = z.object({
  heroEyebrow: text(200), heroHeadline: text(200), heroSub: text(600),
  heroStats: z.array(z.object({ value: text(20), label: text(60) })).max(8),
  whoHeadline: text(200), whoText: text(6000),
  contactAddress: text(300), contactPhone: text(40), contactEmail: text(120), contactHours: text(120),
  whatsappNumber: z.string().trim().max(20).regex(/^$|^\+?[0-9][0-9\s\-()]{8,18}$/, 'Please enter the WhatsApp number with country code, for example +91 94878 97160.'),
  logoUrl: urlOrEmpty,
  socialInstagram: urlOrEmpty, socialFacebook: urlOrEmpty, socialYoutube: urlOrEmpty, socialLinkedin: urlOrEmpty, socialTwitter: urlOrEmpty,
  privacyMode: policyMode, privacyText: text(20000), privacyUrl: urlOrEmpty,
  termsMode: policyMode, termsText: text(20000), termsUrl: urlOrEmpty,
  refundMode: policyMode, refundText: text(20000), refundUrl: urlOrEmpty,
  bookOfferEnabled: z.boolean(), themeMode: z.enum(['light', 'dark', 'system']),
}).partial();

export const offerSchema = z.object({
  enabled: z.boolean(), text: text(300), url: urlOrEmpty, endAt: z.string().datetime({ offset: true }).transform((v) => new Date(v)),
}).partial().strict();

// ---------- Crew accounts, notifications, videos ----------

export const crewRegisterSchema = z.object({
  name: text(100).min(2, 'Please enter your full name.'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address.').max(160),
  phone,
  password: z.string().min(8, 'Password must be at least 8 characters.').max(200),
}).strict();

export const crewLoginSchema = z.object({
  identifier: z.string().trim().min(1).max(160), // email or phone
  password: z.string().min(1).max(200),
}).strict();

/** A person writing to the admin (customer or crew). Sender comes from the session, never from here. */
export const userMessageSchema = z.object({
  title: text(120).optional(),
  body: text(1500).min(2, 'Please write your message.'),
}).strict();

/** Admin → customer / crew. */
export const adminNotificationSchema = z.object({
  audience: z.enum(['customer', 'crew', 'all-customers', 'all-crew']),
  recipientId: z.string().trim().max(60).optional(),
  title: text(140).min(2, 'Please add a title.'),
  body: text(1500).optional(),
  link: z.string().trim().max(300).optional(),
}).strict().superRefine((n, ctx) => {
  if ((n.audience === 'customer' || n.audience === 'crew') && !n.recipientId) {
    ctx.addIssue({ code: 'custom', path: ['recipientId'], message: 'Please choose who to send this to.' });
  }
  if (n.link && !isSafeInternalPath(n.link)) {
    ctx.addIssue({ code: 'custom', path: ['link'], message: 'The link must be a page on this site, for example /account or /crew.' });
  }
});

export const notificationActionSchema = z.object({
  kind: z.enum(['admin', 'customer', 'crew']),
  action: z.enum(['read', 'readAll']),
  id: z.string().trim().max(60).optional(),
}).strict();

export const videoSchema = z.object({
  title: text(120).min(1, 'Please add a title.'),
  caption: text(300).optional(),
  source: z.enum(['upload', 'youtube', 'vimeo', 'url']),
  url: z.string().trim().max(1000),
  posterUrl: z.string().trim().max(1000).refine((v) => v === '' || v.startsWith('/uploads/') || isSafeExternalUrl(v), 'Invalid poster image URL.').optional(),
  enabled: z.boolean().optional(),
  order: z.number().int().min(0).max(10000).optional(),
}).strict();
export const videoUpdateSchema = videoSchema.partial().strict();

export function firstError(error: z.ZodError): string {
  return error.issues[0]?.message || 'Invalid request';
}
