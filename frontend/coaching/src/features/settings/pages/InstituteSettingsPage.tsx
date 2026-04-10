import { Copy, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel } from "../../dashboard/components/Panel";
import { useDashboardQuery } from "../../dashboard/hooks/useDashboardQuery";
import "../../dashboard/styles/dashboard.css";

function buildInstituteLoginUrl(slug: string) {
  if (typeof window === "undefined") {
    return `/login?center=${encodeURIComponent(slug)}`;
  }

  const { origin, hostname, protocol } = window.location;
  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost")
  ) {
    return `${origin}/login?center=${encodeURIComponent(slug)}`;
  }

  const hostParts = hostname.split(".");
  if (hostParts.length >= 2) {
    return `${protocol}//${slug}.${hostParts.slice(-2).join(".")}/login`;
  }

  return `${origin}/login?center=${encodeURIComponent(slug)}`;
}

export default function InstituteSettingsPage() {
  const { data, isLoading } = useDashboardQuery();
  const [copied, setCopied] = useState(false);
  const tenant = data?.tenant;

  const instituteLoginUrl = useMemo(() => {
    if (!tenant?.slug) return "";
    return buildInstituteLoginUrl(tenant.slug);
  }, [tenant?.slug]);

  const handleCopyInstituteUrl = async () => {
    if (!instituteLoginUrl || typeof navigator === "undefined" || !navigator.clipboard) return;
    await navigator.clipboard.writeText(instituteLoginUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (isLoading) {
    return <div className="dashboard-panel">Loading...</div>;
  }

  if (!tenant) {
    return <div className="dashboard-panel">Institute details are not available.</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <div className="dashboard-hero-left">
          <h1 className="dashboard-greeting">Institute Settings</h1>
          <h2 className="dashboard-username">{tenant.name}</h2>
          <p className="dashboard-subtext">Your institute identity and public login information.</p>
          <p className="dashboard-description">
            Use this page to verify your slug, sharing URL, and current plan details.
          </p>
        </div>
      </div>

      <section className="dashboard-grid">
        <div className="dashboard-stack" style={{ gridColumn: "1 / -1" }}>
          <Panel title="nav.settings" subtitle="settings.instituteSubtitle">
            <div className="dashboard-tenantPanel">
              <div className="dashboard-tenantMeta">
                <div className="dashboard-tenantMetaItem">
                  <span className="dashboard-muted">Institute</span>
                  <strong>{tenant.name}</strong>
                </div>
                <div className="dashboard-tenantMetaItem">
                  <span className="dashboard-muted">Slug</span>
                  <strong>{tenant.slug}</strong>
                </div>
                <div className="dashboard-tenantMetaItem">
                  <span className="dashboard-muted">Plan</span>
                  <strong>{tenant.plan || "basic"}</strong>
                </div>
                <div className="dashboard-tenantMetaItem">
                  <span className="dashboard-muted">Status</span>
                  <strong>{tenant.status}</strong>
                </div>
              </div>

              <div className="dashboard-tenantUrlRow">
                <div className="dashboard-tenantUrlBox">
                  <span className="dashboard-muted">Login URL</span>
                  <a href={instituteLoginUrl} target="_blank" rel="noreferrer">
                    {instituteLoginUrl}
                  </a>
                </div>
                <div className="dashboard-tenantActions">
                  <button type="button" className="dashboard-admissionButton" onClick={handleCopyInstituteUrl}>
                    <Copy size={16} />
                    <span>{copied ? "Copied" : "Copy URL"}</span>
                  </button>
                  <a className="dashboard-admissionButton" href={instituteLoginUrl} target="_blank" rel="noreferrer">
                    <ExternalLink size={16} />
                    <span>Open login</span>
                  </a>
                </div>
              </div>
            </div>
          </Panel>
        </div>
      </section>
    </div>
  );
}
