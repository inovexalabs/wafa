import Link from "next/link";

export default function NotFound() {
  return (
    <main className="not-found-page">
      <p className="eyebrow form-eyebrow">404 error</p>
      <h1>Page not found</h1>
      <p>The page you are looking for does not exist.</p>
      <Link className="not-found-link" href="/">Return to sign in</Link>
    </main>
  );
}
