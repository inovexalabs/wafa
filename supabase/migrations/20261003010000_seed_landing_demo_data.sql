-- Demo content for the landing page expansion (team/board, partners/investments/
-- gallery, news & notices, career openings) so the new public sections have
-- something to render before real content is entered through the admin UI.
-- public_documents is intentionally left empty: those rows need a real uploaded
-- file behind file_key, and a seeded row would produce a dead download link.

insert into public.landing_people (kind, name, title, bio, sort_order) values
  ('team', 'Sunita Rai', 'General Manager', 'Oversees day-to-day cooperative operations and member services.', 1),
  ('team', 'Bikash Thapa', 'Finance Officer', 'Manages savings ledgers, loan disbursement, and dividend tracking.', 2),
  ('team', 'Anita Gurung', 'Member Relations Officer', 'First point of contact for member onboarding and support.', 3),
  ('board', 'Ram Prasad Sharma', 'Chairman', 'Founding member and chairman of WAFA Group since 2080.', 1),
  ('board', 'Kamala Shrestha', 'Vice Chairperson', 'Leads governance and policy oversight for the cooperative.', 2),
  ('board', 'Dinesh Koirala', 'Treasurer', 'Responsible for financial oversight and audit coordination.', 3);

insert into public.landing_items (kind, title, description, link_url, sort_order) values
  ('partner', 'Nepal Cooperative Bank', 'Banking partner for member savings and settlement.', null, 1),
  ('partner', 'Himalayan Microfinance Alliance', 'Partner network supporting rural cooperative lending.', null, 2),
  ('investment', 'Community Housing Fund', 'Member-backed fund supporting affordable housing projects.', null, 1),
  ('investment', 'Agro-Cooperative Growth Fund', 'Investment supporting member-run agricultural ventures.', null, 2),
  ('gallery', 'Annual General Meeting 2081', 'Members gathered for the AGM to review the year''s performance.', null, 1),
  ('gallery', 'Dividend Distribution Day', 'Members receiving their annual dividend certificates.', null, 2),
  ('gallery', 'Community Outreach Program', 'WAFA volunteers at a local community savings awareness event.', null, 3);

insert into public.news_posts (category, title, slug, body, published_at) values
  ('news', 'WAFA Group crosses 1,000 members', 'wafa-group-crosses-1000-members',
   'WAFA Group is proud to announce that our member base has grown past 1,000 verified members, a milestone made possible by the trust and discipline of every saver in the cooperative.',
   now() - interval '10 days'),
  ('news', 'Annual dividends distributed for fiscal year 2080/81', 'annual-dividends-distributed-2080-81',
   'Following approval at the Annual General Meeting, dividend certificates for fiscal year 2080/81 have been issued to all eligible members through their member dashboards.',
   now() - interval '25 days'),
  ('notice', 'Office closed for Dashain holidays', 'office-closed-dashain-holidays',
   'Please note that WAFA Group offices will be closed during the Dashain holidays. Member services will resume on the next working day. The online member portal remains available throughout.',
   now() - interval '3 days'),
  ('notice', 'Scheduled maintenance on the member portal', 'scheduled-maintenance-member-portal',
   'The member portal will undergo scheduled maintenance this weekend. Savings ledgers and receipts may be briefly unavailable during the maintenance window.',
   now() - interval '1 days')
on conflict (slug) do nothing;

insert into public.career_openings (title, description, location, employment_type, apply_email, posted_at) values
  ('Accountant', 'Manage day-to-day bookkeeping, savings ledger reconciliation, and financial reporting for the cooperative.', 'Kathmandu, Nepal', 'Full-time', 'wafagroup10@outlook.com', now() - interval '5 days'),
  ('Member Services Officer', 'Support members with account queries, loan applications, and onboarding.', 'Kathmandu, Nepal', 'Full-time', 'wafagroup10@outlook.com', now() - interval '12 days'),
  ('IT Support Intern', 'Assist with maintaining the member portal and resolving day-to-day technical issues.', 'Remote', 'Internship', 'wafagroup10@outlook.com', now() - interval '2 days');
