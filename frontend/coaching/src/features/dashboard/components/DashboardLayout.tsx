// features/dashboard/components/DashboardLayout.tsx

import type { ReactNode } from "react";

type Props = {
  left: ReactNode;
  right: ReactNode;
};

export const DashboardLayout = ({ left, right }: Props) => {
  return (
    <section className="dashboard-grid">
      <div className="dashboard-stack">{left}</div>
      <div className="dashboard-stack">{right}</div>
    </section>
  );
};
