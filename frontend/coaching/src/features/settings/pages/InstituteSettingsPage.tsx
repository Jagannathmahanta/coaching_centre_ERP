import { Copy, ExternalLink } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel } from "../../dashboard/components/Panel";
import { useDashboardQuery } from "../../dashboard/hooks/useDashboardQuery";
import "../../dashboard/styles/dashboard.css";

function buildInstituteLoginUrl(slug: string) {
  if (typeof window === "undefined")
    return `/login?center=${encodeURIComponent(slug)}`;

  const { protocol, hostname } = window.location;

  if (
    hostname === "localhost" ||
    hostname === "127.0.0.1" ||
    hostname.endsWith(".localhost")
  ) {
    return `${protocol}//${hostname}/login?center=${encodeURIComponent(slug)}`;
  }

  // Always extract the base domain (last 3 parts for co.in, or last 2 for .com)
  const parts = hostname.split(".");
    console.log("[buildInstituteLoginUrl]", {
    slug,
    hostname,
    parts,
    partsLength: parts.length,
    sliceMinus3: parts.slice(-3).join("."),
    sliceMinus2: parts.slice(-2).join("."),
  });
  
  // Handle country-code TLDs like co.in, co.uk, com.au (take last 3 parts)
  // vs simple TLDs like .com, .net (take last 2 parts)
  const secondLevelShort = ["co", "com", "net", "org", "gov", "edu"];
  const baseDomain =
    parts.length >= 4 && secondLevelShort.includes(parts[parts.length - 2])
      ? parts.slice(-3).join(".")   // e.g. tutorialhub.co.in
      : parts.slice(-2).join(".");  // e.g. tutorialhub.com

  return `${protocol}//${slug}.${baseDomain}/login`;
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
