"use client";

import { useRef, useState, type FormEvent } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, Send } from "lucide-react";
import { API_URL, TURNSTILE_SITE_KEY } from "@/lib/site";

type Turnstile = {
  render: (
    container: HTMLElement,
    options: {
      sitekey: string;
      callback: (token: string) => void;
      "expired-callback": () => void;
      "error-callback": () => void;
    },
  ) => string;
  reset: (widgetId: string) => void;
};
declare global {
  interface Window {
    turnstile?: Turnstile;
  }
}

type Field = "name" | "email" | "phone" | "message";
type Values = Record<Field, string>;
type Errors = Partial<Record<Field, string>>;

// Mirrors the API's checks so most mistakes are caught before a round trip.
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_MESSAGE_LENGTH = 10;
const MAX_MESSAGE_LENGTH = 5000;

function validate(values: Values): Errors {
  const errors: Errors = {};
  if (!values.name.trim()) errors.name = "Please enter your name.";
  if (!values.email.trim()) errors.email = "Please enter your email so we can reply.";
  else if (!EMAIL_PATTERN.test(values.email.trim()))
    errors.email = "Please enter a valid email address.";
  const message = values.message.trim();
  if (message.length < MIN_MESSAGE_LENGTH)
    errors.message = `Please write at least ${MIN_MESSAGE_LENGTH} characters.`;
  else if (message.length > MAX_MESSAGE_LENGTH)
    errors.message = `Please keep your message under ${MAX_MESSAGE_LENGTH} characters.`;
  return errors;
}

const inputBase =
  "w-full rounded-xl border bg-cream-soft px-4 py-3 text-sm text-ink outline-none transition-colors";

function inputClass(hasError: boolean) {
  return `${inputBase} ${hasError ? "border-coral focus:border-coral" : "border-line focus:border-brand"}`;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-xs font-medium text-coral">
      {message}
    </p>
  );
}

export default function ContactForm({ email }: { email: string }) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({ name: "", email: "", phone: "", message: "" });
  const [honeypot, setHoneypot] = useState("");
  const [errors, setErrors] = useState<Errors>({});
  const [attempted, setAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState("");
  const captchaRef = useRef<HTMLDivElement>(null);
  const captchaWidgetId = useRef<string | null>(null);

  function renderCaptcha() {
    if (!window.turnstile || !captchaRef.current || captchaWidgetId.current) return;
    captchaWidgetId.current = window.turnstile.render(captchaRef.current, {
      sitekey: TURNSTILE_SITE_KEY,
      callback: setCaptchaToken,
      "expired-callback": () => setCaptchaToken(""),
      "error-callback": () => setCaptchaToken(""),
    });
  }

  // Tokens are single-use, so every attempt that reaches the API needs a new one.
  function resetCaptcha() {
    setCaptchaToken("");
    if (window.turnstile && captchaWidgetId.current) window.turnstile.reset(captchaWidgetId.current);
  }

  function update(field: Field, value: string) {
    const next = { ...values, [field]: value };
    setValues(next);
    // Only re-validate live once the visitor has tried to submit.
    if (attempted) setErrors(validate(next));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAttempted(true);
    setFormError(null);

    const clientErrors = validate(values);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length) {
      const first = (["name", "email", "message"] as const).find((f) => clientErrors[f]);
      if (first) document.getElementById(`contact-${first}`)?.focus();
      return;
    }
    if (TURNSTILE_SITE_KEY && !captchaToken) {
      setFormError("Please complete the verification check below.");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...values, website: honeypot, captchaToken }),
      });
      if (response.ok) {
        router.push("/thank-you");
        return;
      }
      resetCaptcha();
      const body = (await response.json().catch(() => null)) as
        | { message?: string | string[]; fields?: Errors }
        | null;
      if (body?.fields) setErrors(body.fields);
      if (response.status === 429) {
        setFormError("You've sent several messages recently. Please wait a few minutes and try again.");
      } else {
        const message = Array.isArray(body?.message) ? body.message[0] : body?.message;
        setFormError(message ?? "Your message could not be sent. Please try again.");
      }
    } catch {
      resetCaptcha();
      setFormError("We couldn't reach the server. Check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  const mailto = `mailto:${email}?subject=${encodeURIComponent("Message from the WAFA website")}&body=${encodeURIComponent(values.message)}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {formError && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-xl border border-coral/30 bg-coral/5 px-4 py-3 text-sm text-ink"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-coral" />
          <p>
            {formError}{" "}
            <a href={mailto} className="font-semibold text-brand underline underline-offset-2">
              Email us instead
            </a>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="sr-only">Your name</label>
          <input
            id="contact-name"
            type="text"
            autoComplete="name"
            placeholder="Your name *"
            maxLength={100}
            value={values.name}
            onChange={(event) => update("name", event.target.value)}
            aria-invalid={!!errors.name}
            aria-describedby={errors.name ? "contact-name-error" : undefined}
            className={inputClass(!!errors.name)}
          />
          <FieldError id="contact-name-error" message={errors.name} />
        </div>
        <div>
          <label htmlFor="contact-email" className="sr-only">Your email</label>
          <input
            id="contact-email"
            type="email"
            autoComplete="email"
            placeholder="Your email *"
            maxLength={200}
            value={values.email}
            onChange={(event) => update("email", event.target.value)}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "contact-email-error" : undefined}
            className={inputClass(!!errors.email)}
          />
          <FieldError id="contact-email-error" message={errors.email} />
        </div>
      </div>

      <div>
        <label htmlFor="contact-phone" className="sr-only">Phone (optional)</label>
        <input
          id="contact-phone"
          type="tel"
          autoComplete="tel"
          placeholder="Phone (optional)"
          maxLength={40}
          value={values.phone}
          onChange={(event) => update("phone", event.target.value)}
          aria-invalid={!!errors.phone}
          aria-describedby={errors.phone ? "contact-phone-error" : undefined}
          className={inputClass(!!errors.phone)}
        />
        <FieldError id="contact-phone-error" message={errors.phone} />
      </div>

      <div>
        <label htmlFor="contact-message" className="sr-only">Your message</label>
        <textarea
          id="contact-message"
          placeholder="Your message *"
          rows={5}
          maxLength={MAX_MESSAGE_LENGTH}
          value={values.message}
          onChange={(event) => update("message", event.target.value)}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "contact-message-error" : undefined}
          className={inputClass(!!errors.message)}
        />
        <FieldError id="contact-message-error" message={errors.message} />
      </div>

      {/* Honeypot: off-screen and skipped by keyboard and screen readers. */}
      <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Website</label>
        <input
          id="contact-website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
        />
      </div>

      {TURNSTILE_SITE_KEY && (
        <>
          <Script
            src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit"
            strategy="afterInteractive"
            onReady={renderCaptcha}
          />
          <div ref={captchaRef} />
        </>
      )}

      <button
        type="submit"
        disabled={submitting}
        className="group inline-flex w-fit items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white shadow-[0_10px_25px_-10px_rgba(31,103,82,0.65)] transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-dark disabled:pointer-events-none disabled:opacity-70"
      >
        {submitting ? (
          <>
            Sending…
            <Loader2 className="h-4 w-4 animate-spin" />
          </>
        ) : (
          <>
            Send us a message
            <Send className="h-4 w-4" />
          </>
        )}
      </button>
    </form>
  );
}
