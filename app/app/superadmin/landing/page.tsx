"use client";

import { FormEvent, useEffect, useState } from "react";
import { ExternalLink, Plus, Trash2 } from "lucide-react";
import SuperadminLayout from "../../../components/superadmin-layout";
import {
  getLandingContent,
  LandingContent,
  updateLandingContent,
} from "../../../lib/auth";

const landingUrl = process.env.NEXT_PUBLIC_LANDING_URL ?? "http://localhost:3003";

const fieldInput =
  "block w-full h-[42px] mt-[7px] border border-line rounded-md px-[11px] outline-none text-[#2d4037] bg-white font-inherit text-xs";
const fieldTextarea =
  "block w-full mt-[7px] border border-line rounded-md px-[11px] py-[9px] outline-none text-[#2d4037] bg-white font-inherit text-xs leading-relaxed resize-y";
const label = "text-[#53665c] text-[11px] font-bold";
const card = "p-6 border border-[#e1e9e4] rounded-[10px] bg-white p-[24px] max-[500px]:px-4 max-[500px]:py-[16px]";
const sectionTitle = "m-0 font-display font-bold text-lg text-ink";
const sectionHint = "m-0 mt-1 text-[#8b9992] text-[11px]";

export default function SuperadminLandingPage() {
  const [content, setContent] = useState<LandingContent | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    getLandingContent()
      .then(setContent)
      .catch((error) => setLoadError(error instanceof Error ? error.message : "Unable to load the landing page content."))
      .finally(() => setIsLoading(false));
  }, []);

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content) return;
    setIsSaving(true);
    setSaveError("");
    setSaved(false);
    try {
      const updated = await updateLandingContent(content);
      setContent(updated);
      setSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Unable to save the landing page content.");
    } finally {
      setIsSaving(false);
    }
  }

  function patch(updater: (draft: LandingContent) => LandingContent) {
    setContent((current) => (current ? updater(current) : current));
    setSaved(false);
  }

  return (
    <SuperadminLayout active="landing">
      <main className="max-w-[1000px] mx-auto px-6 pt-20 pb-14 max-[650px]:px-4 max-[650px]:pt-[68px]">
        <div className="flex justify-between items-end gap-5 mb-[30px] max-[780px]:items-start max-[780px]:flex-col">
          <div>
            <p className="mb-[13px] text-[11px] font-bold tracking-[.18em] uppercase text-brand">Public site</p>
            <h1 className="m-0 font-display font-bold text-[clamp(28px,4vw,40px)] leading-[1.1]">Landing page</h1>
            <p className="mt-[9px] text-muted text-sm">Everything here controls what visitors see on the public WAFA website.</p>
          </div>
          <a
            href={landingUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 border border-line rounded-lg px-4 py-2.5 text-xs font-bold text-ink no-underline hover:border-brand hover:text-brand"
          >
            View live site <ExternalLink size={14} />
          </a>
        </div>

        {isLoading ? (
          <div className="h-[300px] rounded-[10px] bg-[#edf1ee] animate-pulse" />
        ) : loadError ? (
          <div className="p-5 rounded-2xl border border-[#f3d6d3] bg-[#fdf3f2] text-[#ae4d44] text-sm" role="alert">{loadError}</div>
        ) : content && (
          <form onSubmit={save} className="flex flex-col gap-6">
            <section className={card}>
              <h2 className={sectionTitle}>Hero</h2>
              <p className={sectionHint}>The first thing visitors see at the top of the page.</p>
              <div className="grid grid-cols-2 gap-[16px] mt-5 max-[650px]:grid-cols-1">
                <label className={label}>
                  Eyebrow badge text
                  <input className={fieldInput} value={content.hero.eyebrow} onChange={(e) => patch((d) => ({ ...d, hero: { ...d.hero, eyebrow: e.target.value } }))} />
                </label>
                <label className={label}>
                  Primary button label
                  <input className={fieldInput} value={content.hero.primaryCta} onChange={(e) => patch((d) => ({ ...d, hero: { ...d.hero, primaryCta: e.target.value } }))} />
                </label>
                <label className={label}>
                  Headline line 1
                  <input className={fieldInput} value={content.hero.headline[0]} onChange={(e) => patch((d) => ({ ...d, hero: { ...d.hero, headline: [e.target.value, d.hero.headline[1], d.hero.headline[2]] } }))} />
                </label>
                <label className={label}>
                  Headline line 2 (accent color)
                  <input className={fieldInput} value={content.hero.headline[1]} onChange={(e) => patch((d) => ({ ...d, hero: { ...d.hero, headline: [d.hero.headline[0], e.target.value, d.hero.headline[2]] } }))} />
                </label>
                <label className={label}>
                  Headline line 3
                  <input className={fieldInput} value={content.hero.headline[2]} onChange={(e) => patch((d) => ({ ...d, hero: { ...d.hero, headline: [d.hero.headline[0], d.hero.headline[1], e.target.value] } }))} />
                </label>
                <label className={label}>
                  Secondary button label
                  <input className={fieldInput} value={content.hero.secondaryCta} onChange={(e) => patch((d) => ({ ...d, hero: { ...d.hero, secondaryCta: e.target.value } }))} />
                </label>
              </div>
              <label className={label + " block mt-4"}>
                Subtext
                <textarea rows={3} className={fieldTextarea} value={content.hero.subtext} onChange={(e) => patch((d) => ({ ...d, hero: { ...d.hero, subtext: e.target.value } }))} />
              </label>
            </section>

            <section className={card}>
              <h2 className={sectionTitle}>About</h2>
              <div className="grid grid-cols-2 gap-[16px] mt-5 max-[650px]:grid-cols-1">
                <label className={label}>
                  Eyebrow
                  <input className={fieldInput} value={content.about.eyebrow} onChange={(e) => patch((d) => ({ ...d, about: { ...d.about, eyebrow: e.target.value } }))} />
                </label>
                <label className={label}>
                  Quote
                  <input className={fieldInput} value={content.about.quote} onChange={(e) => patch((d) => ({ ...d, about: { ...d.about, quote: e.target.value } }))} />
                </label>
              </div>
              <label className={label + " block mt-4"}>
                Heading
                <input className={fieldInput} value={content.about.heading} onChange={(e) => patch((d) => ({ ...d, about: { ...d.about, heading: e.target.value } }))} />
              </label>
              <label className={label + " block mt-4"}>
                Body
                <textarea rows={4} className={fieldTextarea} value={content.about.body} onChange={(e) => patch((d) => ({ ...d, about: { ...d.about, body: e.target.value } }))} />
              </label>
              <label className={label + " block mt-4"}>
                Quote caption
                <input className={fieldInput} value={content.about.quoteCaption} onChange={(e) => patch((d) => ({ ...d, about: { ...d.about, quoteCaption: e.target.value } }))} />
              </label>
            </section>

            <ListEditor
              title="Services"
              hint="The feature grid — each card has a title and a short description."
              items={content.services}
              onChange={(items) => patch((d) => ({ ...d, services: items }))}
              addLabel="Add service"
              emptyItem={{ title: "New service", text: "" }}
            />

            <ListEditor
              title="How it works"
              hint="The numbered steps timeline."
              items={content.steps}
              onChange={(items) => patch((d) => ({ ...d, steps: items }))}
              addLabel="Add step"
              emptyItem={{ title: "New step", text: "" }}
            />

            <section className={card}>
              <h2 className={sectionTitle}>Testimonials</h2>
              <p className={sectionHint}>Rotating quotes on the impact section.</p>
              <div className="flex flex-col gap-4 mt-4">
                {content.testimonials.map((t, i) => (
                  <div key={i} className="p-4 border border-[#edf1ee] rounded-lg">
                    <label className={label}>
                      Quote
                      <textarea rows={2} className={fieldTextarea} value={t.quote} onChange={(e) => patch((d) => ({ ...d, testimonials: d.testimonials.map((x, idx) => (idx === i ? { ...x, quote: e.target.value } : x)) }))} />
                    </label>
                    <div className="grid grid-cols-[1fr_1fr_auto] gap-[10px] items-end mt-3 max-[650px]:grid-cols-1">
                      <label className={label}>
                        Name
                        <input className={fieldInput} value={t.name} onChange={(e) => patch((d) => ({ ...d, testimonials: d.testimonials.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)) }))} />
                      </label>
                      <label className={label}>
                        Role
                        <input className={fieldInput} value={t.role} onChange={(e) => patch((d) => ({ ...d, testimonials: d.testimonials.map((x, idx) => (idx === i ? { ...x, role: e.target.value } : x)) }))} />
                      </label>
                      <button type="button" onClick={() => patch((d) => ({ ...d, testimonials: d.testimonials.filter((_, idx) => idx !== i) }))} className="h-[42px] w-[42px] grid place-items-center rounded-md border border-[#f3d6d3] text-[#ae4d44] bg-transparent cursor-pointer">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button type="button" onClick={() => patch((d) => ({ ...d, testimonials: [...d.testimonials, { quote: "", name: "A member", role: "" }] }))} className="inline-flex items-center gap-1.5 mt-4 text-[11px] font-bold text-brand bg-transparent border-0 cursor-pointer">
                <Plus size={14} /> Add testimonial
              </button>
            </section>

            <section className={card}>
              <h2 className={sectionTitle}>Closing call-to-action</h2>
              <label className={label + " block mt-4"}>
                Heading
                <input className={fieldInput} value={content.cta.heading} onChange={(e) => patch((d) => ({ ...d, cta: { ...d.cta, heading: e.target.value } }))} />
              </label>
              <label className={label + " block mt-4"}>
                Body
                <textarea rows={2} className={fieldTextarea} value={content.cta.body} onChange={(e) => patch((d) => ({ ...d, cta: { ...d.cta, body: e.target.value } }))} />
              </label>
            </section>

            <section className={card}>
              <h2 className={sectionTitle}>Contact details</h2>
              <p className={sectionHint}>Shown in the footer.</p>
              <div className="grid grid-cols-2 gap-[16px] mt-5 max-[650px]:grid-cols-1">
                <label className={label}>
                  Email
                  <input className={fieldInput} value={content.contact.email} onChange={(e) => patch((d) => ({ ...d, contact: { ...d.contact, email: e.target.value } }))} />
                </label>
                <label className={label}>
                  Phone
                  <input className={fieldInput} value={content.contact.phone} onChange={(e) => patch((d) => ({ ...d, contact: { ...d.contact, phone: e.target.value } }))} />
                </label>
                <label className={label}>
                  Address
                  <input className={fieldInput} value={content.contact.address} onChange={(e) => patch((d) => ({ ...d, contact: { ...d.contact, address: e.target.value } }))} />
                </label>
                <label className={label}>
                  Website label
                  <input className={fieldInput} value={content.contact.website} onChange={(e) => patch((d) => ({ ...d, contact: { ...d.contact, website: e.target.value } }))} />
                </label>
              </div>
            </section>

            {saveError && <p className="m-0 text-[11px] text-[#ae4d44]" role="alert">{saveError}</p>}
            {saved && !saveError && <p className="m-0 text-[11px] text-[#38805d]">Landing page saved. Changes appear on the live site within a minute.</p>}

            <div className="sticky bottom-0 flex justify-end gap-[15px] py-4 bg-cream/95 backdrop-blur">
              <button type="submit" disabled={isSaving} className="border-0 rounded-[7px] px-[22px] py-3 text-white bg-brand cursor-pointer text-xs font-bold min-w-[140px] disabled:opacity-60 disabled:cursor-not-allowed">
                {isSaving ? "Saving…" : "Save landing page"}
              </button>
            </div>
          </form>
        )}
      </main>
    </SuperadminLayout>
  );
}

function ListEditor({
  title,
  hint,
  items,
  onChange,
  addLabel,
  emptyItem,
}: {
  title: string;
  hint: string;
  items: { title: string; text: string }[];
  onChange: (items: { title: string; text: string }[]) => void;
  addLabel: string;
  emptyItem: { title: string; text: string };
}) {
  return (
    <section className={card}>
      <h2 className={sectionTitle}>{title}</h2>
      <p className={sectionHint}>{hint}</p>
      <div className="flex flex-col gap-4 mt-4">
        {items.map((item, i) => (
          <div key={i} className="p-4 border border-[#edf1ee] rounded-lg">
            <div className="flex items-end gap-[10px]">
              <label className={label + " flex-1"}>
                Title
                <input className={fieldInput} value={item.title} onChange={(e) => onChange(items.map((x, idx) => (idx === i ? { ...x, title: e.target.value } : x)))} />
              </label>
              <button type="button" onClick={() => onChange(items.filter((_, idx) => idx !== i))} className="h-[42px] w-[42px] grid place-items-center rounded-md border border-[#f3d6d3] text-[#ae4d44] bg-transparent cursor-pointer">
                <Trash2 size={15} />
              </button>
            </div>
            <label className={label + " block mt-3"}>
              Description
              <textarea rows={2} className={fieldTextarea} value={item.text} onChange={(e) => onChange(items.map((x, idx) => (idx === i ? { ...x, text: e.target.value } : x)))} />
            </label>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => onChange([...items, emptyItem])} className="inline-flex items-center gap-1.5 mt-4 text-[11px] font-bold text-brand bg-transparent border-0 cursor-pointer">
        <Plus size={14} /> {addLabel}
      </button>
    </section>
  );
}
