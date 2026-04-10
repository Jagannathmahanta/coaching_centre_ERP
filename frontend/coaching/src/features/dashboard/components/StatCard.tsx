import type { LucideIcon } from "lucide-react";
import { useI18n } from "../../../shared/i18n/I18nProvider";

type Props = {
  accent: string;
  label: string;
  value: number | string;
  subvalue: string;
  icon?: LucideIcon;
};

export const StatCard = ({ accent, label, value, subvalue, icon: Icon }: Props) => {
  const { t } = useI18n();
  return (
    <article className="dashboard-statCard" style={{ ["--accent-color" as string]: accent }}>
      <div className="dashboard-statHeader">
        <div className="dashboard-statLabel">{t(label)}</div>
        {Icon ? (
          <div className="dashboard-statIcon" style={{ ["--accent-soft" as string]: `${accent}18`, color: accent }}>
            <Icon size={18} />
          </div>
        ) : null}
      </div>
      <div className="dashboard-statValue">{value}</div>
      <div className="dashboard-statSubvalue">{t(subvalue)}</div>
    </article>
  );
};
