"use client";

import AdminLayout from "../../components/admin-layout";

export default function AdminOverviewPage() {
  return (
    <AdminLayout active="overview">
      <main className="member-content section-page">
        <div className="member-heading">
          <div>
            <p className="eyebrow form-eyebrow">Admin workspace</p>
            <h1>Welcome back.</h1>
            <p className="member-subtitle">Manage meetings and members from the sidebar.</p>
          </div>
        </div>
      </main>
    </AdminLayout>
  );
}
