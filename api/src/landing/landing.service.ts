import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { SupabaseService } from '../supabase.service';
import { AuditService } from '../audit/audit.service';

type Profile = { id: string; role: string };

type LeaderMessage = { photoUrl: string; name: string; role: string; message: string };

export type LandingContent = {
  hero: {
    eyebrow: string;
    headline: [string, string, string];
    subtext: string;
    primaryCta: string;
    secondaryCta: string;
  };
  stats: { value: number; suffix: string; label: string }[];
  about: {
    eyebrow: string;
    heading: string;
    body: string;
    quote: string;
    quoteCaption: string;
    vision: string;
    mission: string;
    values: { title: string; text: string }[];
    leaderMessages: LeaderMessage[];
  };
  services: { title: string; text: string }[];
  steps: { title: string; text: string }[];
  testimonials: { quote: string; name: string; role: string }[];
  faqs: { question: string; answer: string }[];
  cta: { heading: string; body: string };
  contact: { email: string; phone: string; address: string; website: string };
  socialLinks: { platform: string; url: string }[];
  legal: { privacyPolicy: string; termsOfService: string };
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
    vision:
      'To become a trusted, member-owned cooperative group that turns the collective savings of ordinary people into lasting prosperity — through fair finance, responsible investment, and community-led enterprise across Nepal.',
    mission:
      'To help every member save with discipline, borrow fairly, and share in the returns of carefully chosen projects and businesses — while running the cooperative with complete transparency, sound governance, and a commitment to the communities we serve.',
    values: [
      { title: 'Integrity', text: 'We act honestly, keep our promises, and put members’ interests first.' },
      { title: 'Transparency', text: 'Every ledger, receipt, and decision stays visible to the members it affects.' },
      { title: 'Trust', text: 'We grow only as fast as the trust between members allows.' },
      { title: 'Partnership', text: 'We grow together through teamwork, respect, and strong relationships.' },
      { title: 'Sustainable Growth', text: 'We choose responsible investments that create value for years, not months.' },
      { title: 'Community Commitment', text: 'We are for all — we invest in the people and places our members call home.' },
    ],
    leaderMessages: [
      {
        photoUrl: '',
        name: 'Chairman’s name',
        role: 'Chairman, WAFA Group',
        message:
          'Welcome to WAFA Group. Our cooperative was founded on a simple promise — We Are For All. Every member who saves with us is an owner, and every rupee we hold is held in trust. We are building a cooperative that is transparent in its books, fair in its lending, and careful in every investment it makes. I sincerely thank our members, board, and staff for their continued trust. Together, we will build a stronger and brighter future for every family that is part of WAFA.',
      },
      {
        photoUrl: '',
        name: 'CEO’s name',
        role: 'Chief Executive Officer, WAFA Group',
        message:
          'At WAFA Group, we believe real success is built on discipline, integrity, and service. Our team works every day to make saving simple, lending fair, and every transaction visible to the members it belongs to. As we grow into new projects and opportunities, we will keep professionalism and accountability at the heart of every decision. Thank you to our members and partners for walking this journey with us — your trust is what moves WAFA forward.',
      },
    ],
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
  faqs: [
    {
      question: 'What is WAFA Group?',
      answer:
        'WAFA Group ("We Are For All") is a member-owned savings and credit cooperative in Nepal, established in 2080 B.S. Members save together, borrow responsibly from the pooled savings, and share in the cooperative’s growth.',
    },
    {
      question: 'How do I become a member?',
      answer:
        'Get in touch with us by phone or email to start your application. Once your identity documents, such as your citizenship certificate, are verified, you receive your own secure login to the WAFA member workspace.',
    },
    {
      question: 'How are my deposits recorded?',
      answer:
        'Upload the receipt for each monthly deposit, share contribution or loan payment in your member workspace. An accountant reviews it, and once approved it appears in your savings ledger.',
    },
    {
      question: 'Can I take a loan from WAFA?',
      answer:
        'Yes. Loans are a member service, reviewed transparently against your savings and repayment history. Contact us for current loan terms before you apply.',
    },
    {
      question: 'How do I check my savings balance?',
      answer:
        'Sign in to the member workspace at any time to see your savings ledger, verified receipts, payment schedule and certificates.',
    },
    {
      question: 'Is my information kept private?',
      answer:
        'Yes. The member workspace uses secure login and role-based access: members see their own records, only authorized accountants and administrators manage financial data, and activity is logged for accountability.',
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
  socialLinks: [],
  legal: {
    privacyPolicy:
      'This is placeholder privacy policy text. Replace this with your reviewed privacy policy before publishing the site — it should explain what member data WAFA collects, how it is stored, who can access it, and how members can request their data be corrected or removed.',
    termsOfService:
      'This is placeholder terms of service text. Replace this with your reviewed terms before publishing the site — it should explain membership eligibility, savings and loan obligations, and the rules members agree to by using the WAFA workspace.',
  },
};

// Content saved before leaderMessages existed holds a single chairmanMessage;
// carry it over as the first leader so an existing chairman entry isn't lost.
function mergeLeaderMessages(
  leaderMessages: LeaderMessage[] | undefined,
  chairmanMessage: Partial<LeaderMessage> | undefined,
): LeaderMessage[] {
  const defaults = DEFAULT_LANDING_CONTENT.about.leaderMessages;
  if (Array.isArray(leaderMessages)) return leaderMessages;
  if (chairmanMessage) return [{ ...defaults[0], ...chairmanMessage }, ...defaults.slice(1)];
  return defaults;
}

function mergeContent(partial: Partial<LandingContent> | null | undefined): LandingContent {
  const source = partial ?? {};
  const { chairmanMessage, ...about } = (source.about ?? {}) as Partial<LandingContent['about']> & {
    chairmanMessage?: Partial<LeaderMessage>;
  };
  return {
    hero: { ...DEFAULT_LANDING_CONTENT.hero, ...source.hero },
    stats: source.stats?.length ? source.stats : DEFAULT_LANDING_CONTENT.stats,
    about: {
      ...DEFAULT_LANDING_CONTENT.about,
      ...about,
      values: about.values?.length ? about.values : DEFAULT_LANDING_CONTENT.about.values,
      leaderMessages: mergeLeaderMessages(about.leaderMessages, chairmanMessage),
    },
    services: source.services?.length ? source.services : DEFAULT_LANDING_CONTENT.services,
    steps: source.steps?.length ? source.steps : DEFAULT_LANDING_CONTENT.steps,
    testimonials: source.testimonials?.length
      ? source.testimonials
      : DEFAULT_LANDING_CONTENT.testimonials,
    // Unlike the other lists, an empty FAQ list is kept so the section can be hidden.
    faqs: Array.isArray(source.faqs) ? source.faqs : DEFAULT_LANDING_CONTENT.faqs,
    cta: { ...DEFAULT_LANDING_CONTENT.cta, ...source.cta },
    contact: { ...DEFAULT_LANDING_CONTENT.contact, ...source.contact },
    socialLinks: source.socialLinks?.length ? source.socialLinks : DEFAULT_LANDING_CONTENT.socialLinks,
    legal: { ...DEFAULT_LANDING_CONTENT.legal, ...source.legal },
  };
}

@Injectable()
export class LandingService {
  constructor(
    private readonly supabase: SupabaseService,
    private readonly audit: AuditService,
  ) {}

  async get(): Promise<LandingContent> {
    const { data, error } = await this.supabase
      .getAdminClient()
      .from('landing_content')
      .select('content')
      .eq('id', 1)
      .maybeSingle();
    if (error)
      throw new InternalServerErrorException(
        'Unable to load the landing page content.',
      );
    return mergeContent(data?.content as Partial<LandingContent> | undefined);
  }

  async update(profile: Profile, content: Partial<LandingContent>) {
    if (!content || typeof content !== 'object')
      throw new BadRequestException('Invalid landing page content.');

    const merged = mergeContent(content);
    const { error } = await this.supabase
      .getAdminClient()
      .from('landing_content')
      .upsert({
        id: 1,
        content: merged,
        updated_at: new Date().toISOString(),
        updated_by: profile.id,
      });
    if (error) throw new BadRequestException(error.message);

    await this.audit.log({
      actor: { userId: profile.id },
      action: 'landing.updated',
      entityType: 'landing_content',
      entityId: '1',
    });

    return merged;
  }
}
