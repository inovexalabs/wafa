import MemberLayout from "../../../components/member-layout";

const payments = [
  { label: "Monthly deposit", period: "September 2026", amount: "Rs. 5,000", status: "Due Sep 10", state: "due" },
  { label: "Share contribution", period: "Additional share", amount: "Rs. 2,500", status: "Paid Aug 12", state: "paid" },
  { label: "Monthly deposit", period: "August 2026", amount: "Rs. 5,000", status: "Paid Aug 10", state: "paid" },
];

export default function PaymentsPage() {
  return <MemberLayout active="payments"><main className="member-content section-page"><div className="section-heading"><div><p className="eyebrow form-eyebrow">Financial overview</p><h1>Payments</h1><p>Track your contributions and payment schedule.</p></div><button className="primary-action">＋ Make a payment</button></div><div className="payment-summary"><article><small>Current balance</small><strong>Rs. 5,000</strong><span>Due this month</span></article><article><small>Total contributions</small><strong>Rs. 48,500</strong><span>Since joining</span></article><article><small>Payment status</small><strong className="paid-text">Up to date</strong><span>1 payment due</span></article></div><section className="member-card page-card"><div className="card-heading"><div><h2>Payment history</h2><p>Your recent contributions.</p></div><button className="text-action">Download statement ↓</button></div><div className="payment-list">{payments.map((payment) => <article className="payment-row" key={payment.label + payment.period}><span className="payment-icon">◈</span><div><strong>{payment.label}</strong><p>{payment.period}</p></div><b>{payment.amount}</b><span className={"payment-status " + payment.state}>{payment.status}</span></article>)}</div></section></main></MemberLayout>;
}
