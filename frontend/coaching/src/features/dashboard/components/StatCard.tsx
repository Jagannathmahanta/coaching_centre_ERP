type Props = {
  accent: string;
  label: string;
  value: number | string;
  subvalue: string;
};

export const StatCard = ({ accent, label, value, subvalue }: Props) => {
  return (
    <article className="dashboard-statCard" style={{ ["--accent-color" as string]: accent }}>
      <div className="dashboard-statLabel">{label}</div>
      <div className="dashboard-statValue">{value}</div>
      <div className="dashboard-statSubvalue">{subvalue}</div>
    </article>
  );
};