// Central config driving the generic CRUD API route (/api/crud/[collection])
// and the generic admin CrudManager UI component. Add a new manageable
// content type here rather than writing a bespoke route + page for it.

export const COLLECTIONS = {
  services: {
    model: 'service' as const,
    label: 'Services',
    titleField: 'title',
    fields: [
      { key: 'icon', label: 'Icon', type: 'select', options: ['film', 'camera', 'ai', 'pen', 'share', 'chart', 'code', 'badge'] },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'desc', label: 'Short description', type: 'textarea' },
      { key: 'items', label: 'Included items (comma-separated)', type: 'list' },
    ],
  },
  portfolio: {
    model: 'portfolioItem' as const,
    label: 'Portfolio',
    titleField: 'title',
    fields: [
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'tag', label: 'Tag', type: 'text' },
      { key: 'title', label: 'Project title', type: 'text' },
      { key: 'client', label: 'Client name', type: 'text' },
      { key: 'completedAt', label: 'Completion date', type: 'text' },
      { key: 'videoUrl', label: 'Video link (YouTube, Vimeo or a direct .mp4/.webm link — plays muted on the card)', type: 'text' },
      { key: 'thumbnailUrl', label: 'Thumbnail image URL', type: 'text' },
    ],
  },
  packages: {
    model: 'package' as const,
    label: 'Packages',
    titleField: 'name',
    fields: [
      { key: 'name', label: 'Package name', type: 'text' },
      { key: 'desc', label: 'Description', type: 'textarea' },
      { key: 'features', label: 'Features (comma-separated)', type: 'list' },
      { key: 'popular', label: 'Mark as Popular', type: 'checkbox' },
    ],
  },
  testimonials: {
    model: 'testimonial' as const,
    label: 'Testimonials',
    titleField: 'name',
    fields: [
      { key: 'quote', label: 'Quote', type: 'textarea' },
      { key: 'name', label: 'Client name', type: 'text' },
      { key: 'role', label: 'Role / company', type: 'text' },
    ],
  },
  faqs: {
    model: 'faq' as const,
    label: 'FAQ',
    titleField: 'question',
    fields: [
      { key: 'question', label: 'Question', type: 'text' },
      { key: 'answer', label: 'Answer', type: 'textarea' },
    ],
  },
  eventTypes: {
    model: 'eventType' as const,
    label: 'Event Types',
    titleField: 'name',
    fields: [{ key: 'name', label: 'Event type name', type: 'text' }],
  },
} as const;

export type CollectionKey = keyof typeof COLLECTIONS;
