// Topic cluster for search: one pillar page (/services) linking to focused
// cluster pages (/services/[slug]), each of which links back to the pillar
// and across to related clusters. Copy deliberately avoids rates, amounts and
// eligibility rules that WAFA has not published — those point to Contact.

export type ClusterFaq = { question: string; answer: string };

export type ClusterSection = {
  heading: string;
  body: string[];
  points?: string[];
};

export type Cluster = {
  slug: string;
  navLabel: string;
  eyebrow: string;
  title: string;
  metaTitle: string;
  description: string;
  summary: string;
  sections: ClusterSection[];
  faqs: ClusterFaq[];
  related: string[];
};

export const PILLAR = {
  path: "/services",
  navLabel: "Services guide",
  eyebrow: "Services guide",
  title: "Savings and credit cooperative services at WAFA Group",
  metaTitle: "Savings & Credit Cooperative Services",
  description:
    "A guide to WAFA Group's cooperative services in Nepal: membership, monthly savings, member loans, dividends and share certificates, and the secure online member workspace.",
  intro: [
    "WAFA Group is a member-owned savings and credit cooperative in Nepal. Everything we offer comes back to one cycle: members pool disciplined savings, the cooperative turns those savings into fair loans, and the growth is shared with every member.",
    "This guide walks through each part of that cycle — what it is, how it works at WAFA, and what you can see for yourself in the member workspace.",
  ],
  sections: [
    {
      heading: "How the pieces fit together",
      body: [
        "Membership comes first: it makes you a part-owner of the cooperative rather than a customer of it. From there, regular savings and share contributions build the pool that member loans are drawn from. Repayments return to that pool, and when the cooperative does well, dividends return a share of the surplus to members.",
        "Every step leaves a record. Deposits, receipts, installments and certificates all live in one secure workspace, so members never have to take the cooperative's word for where their money stands.",
      ],
    },
  ] satisfies ClusterSection[],
};

export const CLUSTERS: Cluster[] = [
  {
    slug: "membership",
    navLabel: "Membership",
    eyebrow: "Membership",
    title: "Becoming a member of WAFA Group",
    metaTitle: "Cooperative Membership",
    description:
      "How to join WAFA Group, a member-owned savings and credit cooperative in Nepal — the application, document verification, and what you get as a member.",
    summary:
      "What it means to own a share of the cooperative, how to apply, and what you get from day one.",
    sections: [
      {
        heading: "What membership means",
        body: [
          "Joining WAFA makes you a part-owner of the cooperative. Members contribute savings and share capital, take part in cooperative meetings, and benefit from the cooperative's growth through dividends.",
          "That ownership is the reason the cooperative works: every member has a stake in the savings being safe, the loans being fair, and the records being honest.",
        ],
      },
      {
        heading: "How to join",
        body: ["Becoming a member takes four steps:"],
        points: [
          "Get in touch with the WAFA team by phone or email.",
          "Submit your details along with your identity documents, such as your citizenship certificate.",
          "The team verifies your documents and activates your membership.",
          "You receive your own secure login to the WAFA member workspace.",
        ],
      },
      {
        heading: "What you get from day one",
        body: [
          "As soon as your membership is active you can sign in to see your savings ledger, upload receipts for your deposits, view your membership certificate, and receive notifications for meetings, payment due dates and dividends.",
        ],
      },
    ],
    faqs: [
      {
        question: "What documents do I need to join WAFA Group?",
        answer:
          "You need a valid identity document, such as your citizenship certificate. The WAFA team will let you know when you apply if anything else is required.",
      },
      {
        question: "Do I receive a membership certificate?",
        answer:
          "Yes. Membership and share certificates are issued digitally and stored in your member workspace, where you can view them at any time.",
      },
      {
        question: "How do I start my application?",
        answer:
          "Contact the WAFA team by phone or email using the details on our contact section, and we will guide you through the next steps.",
      },
    ],
    related: ["savings", "member-workspace"],
  },
  {
    slug: "savings",
    navLabel: "Savings",
    eyebrow: "Savings",
    title: "Saving with a cooperative",
    metaTitle: "Cooperative Savings & Monthly Deposits",
    description:
      "How savings work at WAFA Group: regular monthly deposits, share contributions, receipts verified by an accountant, and a ledger you can check any time.",
    summary:
      "Monthly deposits, share contributions, and how every payment is verified before it reaches your ledger.",
    sections: [
      {
        heading: "Regular monthly deposits",
        body: [
          "Saving at WAFA is built around consistency. Members make regular monthly deposits, and every deposit is recorded against their name in the cooperative ledger.",
          "Small amounts saved on schedule add up — and together they form the pool the cooperative lends from, so your savings also make fair credit possible for other members.",
        ],
      },
      {
        heading: "Share contributions",
        body: [
          "Alongside savings, members contribute share capital. Your shares represent your ownership stake in the cooperative and are the basis for dividends when they are declared.",
        ],
      },
      {
        heading: "Every deposit, verified",
        body: [
          "When you make a payment, you upload its receipt in your member workspace. An accountant reviews it against the payment, and once approved it appears in your ledger. If something doesn't match, the receipt is returned with a reason so it can be corrected.",
          "Nothing depends on paper slips or someone's memory — every contribution has a verified, timestamped record.",
        ],
      },
      {
        heading: "Check your balance any time",
        body: [
          "Your savings ledger is available around the clock in the member workspace, along with your full receipt history and upcoming payment schedule.",
        ],
      },
    ],
    faqs: [
      {
        question: "How much do I need to save each month?",
        answer:
          "Monthly deposit amounts are set by the cooperative. Contact us for the current amount, or check the payment schedule in your member workspace.",
      },
      {
        question: "What happens after I upload a receipt?",
        answer:
          "An accountant reviews it. Once approved it is added to your savings ledger; if it is rejected, you see the reason and can upload a corrected receipt.",
      },
      {
        question: "What is the difference between savings and share capital?",
        answer:
          "Savings are your regular deposits with the cooperative. Share capital is your ownership stake in it, and it is what dividends are based on.",
      },
    ],
    related: ["loans", "dividends-and-certificates"],
  },
  {
    slug: "loans",
    navLabel: "Loans",
    eyebrow: "Loans",
    title: "Borrowing from the cooperative",
    metaTitle: "Cooperative Loans for Members",
    description:
      "How member loans work at WAFA Group — requests reviewed against your savings and repayment history, a clear installment schedule, and reminders before each payment is due.",
    summary:
      "How loan requests are reviewed, and how installments and reminders work once a loan is approved.",
    sections: [
      {
        heading: "Loans funded by members, for members",
        body: [
          "WAFA's loans come from the savings members pool together. That is what makes cooperative credit different from a bank loan: the money you borrow belongs to the community, and repaying it on time keeps it available for the next member who needs it.",
        ],
      },
      {
        heading: "How loan requests are reviewed",
        body: [
          "Loan requests are reviewed transparently, with your savings and repayment history in the cooperative taken into account. A steady record of deposits is the strongest case you can make.",
          "Loan terms, including interest rates, are set by the cooperative. Contact us for the current terms before you apply.",
        ],
      },
      {
        heading: "Repaying on schedule",
        body: [
          "Once a loan is approved, your installment schedule appears in your member workspace. You are notified when a payment is due, and every repayment is receipted and verified the same way as a deposit.",
        ],
      },
    ],
    faqs: [
      {
        question: "Do I need to be a member to borrow from WAFA?",
        answer:
          "Yes. Loans are a member service, available to members of the cooperative.",
      },
      {
        question: "What interest rate does WAFA charge on loans?",
        answer:
          "Loan terms, including interest rates, are set by the cooperative and can change. Contact us for the current rates before you apply.",
      },
      {
        question: "How will I know when an installment is due?",
        answer:
          "Your installment schedule is in your member workspace, and you receive a notification when a loan payment is due.",
      },
    ],
    related: ["savings", "member-workspace"],
  },
  {
    slug: "dividends-and-certificates",
    navLabel: "Dividends & certificates",
    eyebrow: "Dividends & certificates",
    title: "Dividends and share certificates",
    metaTitle: "Dividends & Share Certificates",
    description:
      "How WAFA Group members share in the cooperative's growth — dividends on share capital, and membership and share certificates issued and stored digitally.",
    summary:
      "How the cooperative shares its surplus with members, and where your certificates live.",
    sections: [
      {
        heading: "Sharing in the cooperative's growth",
        body: [
          "When the cooperative does well, its members do well. Dividends are how WAFA shares its surplus with members, based on the share capital they hold.",
          "When a dividend is declared, members are notified in the workspace, so nobody has to ask around to find out.",
        ],
      },
      {
        heading: "Certificates, issued digitally",
        body: [
          "Membership and share certificates are issued by the WAFA team and stored securely in your member workspace. You can view them whenever you need proof of membership or ownership — no paper copy to lose.",
        ],
      },
      {
        heading: "Watching your share grow",
        body: [
          "Because every share contribution is recorded in your ledger, you can see your stake in the cooperative build up year over year.",
        ],
      },
    ],
    faqs: [
      {
        question: "When are dividends paid?",
        answer:
          "Dividends are declared by the cooperative, and members are notified in the workspace as soon as one is announced.",
      },
      {
        question: "Where can I find my share certificate?",
        answer:
          "In the Certificates section of your member workspace.",
      },
      {
        question: "What if a certificate is missing or incorrect?",
        answer:
          "Contact the WAFA team, and an administrator will review it and issue a corrected certificate.",
      },
    ],
    related: ["savings", "membership"],
  },
  {
    slug: "member-workspace",
    navLabel: "Member workspace",
    eyebrow: "Member workspace",
    title: "Your digital member workspace",
    metaTitle: "Online Member Workspace",
    description:
      "WAFA Group's secure online member workspace: your savings ledger, verified receipts, payment schedule, certificates, meetings and notifications in one place.",
    summary:
      "The secure online space where members see their ledger, receipts, certificates and meetings.",
    sections: [
      {
        heading: "Everything in one place",
        body: ["Every member gets a secure workspace with:"],
        points: [
          "A savings ledger showing every verified deposit and share contribution.",
          "Receipt uploads, with the review status of each one.",
          "Your payment schedule, including loan installments.",
          "Membership and share certificates.",
          "Meeting notices, with the join link released right at start time.",
          "Notifications in the workspace and by email.",
          "Links the WAFA team shares with you.",
        ],
      },
      {
        heading: "Transparent by design",
        body: [
          "Every ledger entry, receipt and decision stays visible to the members it affects. That transparency is the point: members trust the cooperative because they can check its records themselves.",
        ],
      },
      {
        heading: "Secure by default",
        body: [
          "The workspace uses secure login and role-based access. Members see their own records, accountants manage financial entries, and administrators manage members, certificates and meetings. Activity is logged so every change can be traced.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I sign in to the member workspace?",
        answer:
          "Use the Member Login button at the top of this site with the credentials the WAFA team provided when your membership was activated.",
      },
      {
        question: "Can I use the member workspace on my phone?",
        answer:
          "Yes. The workspace works in any modern browser on a phone, tablet or computer.",
      },
      {
        question: "Who can see my financial records?",
        answer:
          "You can see your own records. Only authorized accountants and administrators can manage financial data, and their activity is logged.",
      },
    ],
    related: ["savings", "loans"],
  },
];

export function getCluster(slug: string) {
  return CLUSTERS.find((cluster) => cluster.slug === slug);
}

export function clusterPath(slug: string) {
  return `${PILLAR.path}/${slug}`;
}
