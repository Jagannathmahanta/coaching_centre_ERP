import type { ReactNode } from "react";

type Props = {
  title: string;
  subtitle: string;
  children: ReactNode;
};

export const Panel = ({ title, subtitle, children }: Props) => {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-cardHeader">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
};
