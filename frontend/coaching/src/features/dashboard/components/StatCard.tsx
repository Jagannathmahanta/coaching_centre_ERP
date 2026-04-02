import type { LucideIcon } from "lucide-react";

type Props = {
  accent: string;
  label: string;
  value: number | string;
  subvalue: string;
  icon?: LucideIcon;
};

export const StatCard = ({ accent, label, value, subvalue, icon: Icon }: Props) => {
  return (
    <article className="dashboard-statCard" style={{ ["--accent-color" as string]: accent }}>
      <div className="dashboard-statHeader">
        <div className="dashboard-statLabel">{label}</div>
        {Icon ? (
          <div className="dashboard-statIcon" style={{ ["--accent-soft" as string]: `${accent}18`, color: accent }}>
            <Icon size={18} />
          </div>
        ) : null}
      </div>
      <div className="dashboard-statValue">{value}</div>
      <div className="dashboard-statSubvalue">{subvalue}</div>
    </article>
  );
};
