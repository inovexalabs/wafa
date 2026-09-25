export type LandingHero = {
  eyebrow: string;
  headline: [string, string, string];
  subtext: string;
  primaryCta: string;
  secondaryCta: string;
};

export type LandingStat = { value: number; suffix: string; label: string };

export type LandingAbout = {
  eyebrow: string;
  heading: string;
  body: string;
  quote: string;
  quoteCaption: string;
};

export type LandingServiceItem = { title: string; text: string };
export type LandingStep = { title: string; text: string };
export type LandingTestimonial = { quote: string; name: string; role: string };
export type LandingCta = { heading: string; body: string };
export type LandingContact = {
  email: string;
  phone: string;
  address: string;
  website: string;
};

export type LandingContent = {
  hero: LandingHero;
  stats: LandingStat[];
  about: LandingAbout;
  services: LandingServiceItem[];
  steps: LandingStep[];
  testimonials: LandingTestimonial[];
  cta: LandingCta;
  contact: LandingContact;
};

export const DEFAULT_LANDING_CONTENT: LandingContent = {
  hero: {
    eyebrow: 'Estd. 2080 · A cooperative for everyone',
    headline: ['Save together.', 'Grow together.', 'Rise together.'],
    subtext:
      "WAFA Group is a member-owned savings and credit cooperative. We pool discipline into savings, turn savings into fair loans, and turn fair loans into opportunity — for every member, every time.",
    primaryCta: 'About WAFA',
    secondaryCta: 'Member login',
  },
  stats: [
    { value: 2080, suffix: '', label: 'Founded (B.S.)' },
    { value: 4, suffix: '', label: 'Governing roles working in sync' },
    { value: 100, suffix: '%', label: 'Transparent, member-visible ledgers' },
    { value: 24, suffix: '/7', label: 'Hour access to your savings & receipts' },
  ],
  about: {
    eyebrow: 'About WAFA Group',
    heading:
      'A cooperative that grows only as fast as the trust between its members.',
    body: "WAFA Group started with a simple belief: when people save and lend to each other honestly, everyone rises together. Today that belief runs through a digital workspace — savings ledgers, receipts, loan certificates, meetings and dividends — all visible to the members it serves.",
    quote: '"We Are For All"',
    quoteCaption: 'The idea our name was built on, since 2080.',
  },
  services: [
    {
      title: 'Savings & loans',
      text: 'Grow disciplined savings and access fair, transparent loans backed by your cooperative history.',
    },
    {
      title: 'Verified receipts',
      text: 'Every deposit and payment is logged and reviewed, so nothing is ever left to memory.',
    },
    {
      title: 'Open savings ledger',
      text: "See exactly where every member's contribution stands, updated in real time.",
    },
    {
      title: 'Certificates & dividends',
      text: 'Membership and share certificates, plus dividend payouts, issued and tracked digitally.',
    },
    {
      title: 'Meetings that respect your time',
      text: "Scheduled meetings notify members instantly, with the join link released right at start time.",
    },
    {
      title: 'One shared conversation',
      text: 'Members, accountants, admins and superadmins stay aligned in a single connected workspace.',
    },
  ],
  steps: [
    {
      title: 'Join the cooperative',
      text: 'Become a verified member and get access to your own secure member workspace.',
    },
    {
      title: 'Save consistently',
      text: 'Make regular contributions that are logged instantly to your personal savings ledger.',
    },
    {
      title: 'Borrow responsibly',
      text: 'Apply for loans reviewed transparently, backed by your savings and repayment history.',
    },
    {
      title: 'Grow with the group',
      text: 'Earn dividends, track certificates, and watch your share in WAFA grow year over year.',
    },
  ],
  testimonials: [
    {
      quote:
        'Every deposit I make shows up instantly. I no longer wonder where my savings stand.',
      name: 'A member since 2081',
      role: 'Savings account holder',
    },
    {
      quote:
        'Our meetings used to get lost in messages. Now everyone gets notified, and the join link arrives right on time.',
      name: 'A cooperative admin',
      role: 'Meetings coordinator',
    },
    {
      quote:
        'The ledger is transparent for everyone. That transparency is exactly why our members trust WAFA.',
      name: 'A cooperative accountant',
      role: 'Finance team',
    },
  ],
  cta: {
    heading: 'Want to know more about WAFA?',
    body: 'Reach out to learn how to join the cooperative, or sign in if you are already a member.',
  },
  contact: {
    email: 'wafagroup10@outlook.com',
    phone: '981-0088578 / 981-8939377',
    address: 'Nepal',
    website: 'wafagroup.com.np',
  },
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function getLandingContent(): Promise<LandingContent> {
  try {
    const response = await fetch(`${API_URL}/api/public/landing`, {
      next: { revalidate: 60 },
    });
    if (!response.ok) return DEFAULT_LANDING_CONTENT;
    const data = (await response.json()) as Partial<LandingContent>;
    return {
      hero: { ...DEFAULT_LANDING_CONTENT.hero, ...data.hero },
      stats: data.stats?.length ? data.stats : DEFAULT_LANDING_CONTENT.stats,
      about: { ...DEFAULT_LANDING_CONTENT.about, ...data.about },
      services: data.services?.length ? data.services : DEFAULT_LANDING_CONTENT.services,
      steps: data.steps?.length ? data.steps : DEFAULT_LANDING_CONTENT.steps,
      testimonials: data.testimonials?.length
        ? data.testimonials
        : DEFAULT_LANDING_CONTENT.testimonials,
      cta: { ...DEFAULT_LANDING_CONTENT.cta, ...data.cta },
      contact: { ...DEFAULT_LANDING_CONTENT.contact, ...data.contact },
    };
  } catch {
    return DEFAULT_LANDING_CONTENT;
  }
}
