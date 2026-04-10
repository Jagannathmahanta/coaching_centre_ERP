import type { ReactNode } from "react";
import { useI18n } from "../../../shared/i18n/I18nProvider";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export const Panel = ({ title, subtitle, children }: Props) => {
  const { t } = useI18n();
  return (
    <section className="dashboard-panel">
      <div className="dashboard-cardHeader">
        <div>
          <h2>{t(title)}</h2>
          <p>{t(subtitle)}</p>
        </div>
      </div>
      {children}
    </section>
  );
};
