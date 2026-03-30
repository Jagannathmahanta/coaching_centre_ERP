type PendingFeeItem = {
  fee_id: number;
  student_name: string;
  class: string;
  roll_number?: string | null;
  installment_label: string;
  due_date: string;
  balance: number | string;
  status: string;
};

type Props = {
  fees?: PendingFeeItem[];
  shortDate: (date: string) => string;
  currency: (value: number | string) => string;
};

export const PendingFeeTable = ({ fees, shortDate, currency }: Props) => {
  return (
    <div className="dashboard-tableWrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Installment</th>
            <th>Due</th>
            <th>Balance</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {fees?.length ? (
            fees.map((item) => (
              <tr key={item.fee_id}>
                <td>
                  <strong>{item.student_name}</strong>
                  <div className="dashboard-listMeta">
                    {item.class}
                    {item.roll_number ? ` | ${item.roll_number}` : ""}
                  </div>
                </td>

                <td>{item.installment_label}</td>
                <td>{shortDate(item.due_date)}</td>
                <td>{currency(item.balance)}</td>

                <td>
                  <span className={`dashboard-badge ${item.status}`}>
                    {item.status}
                  </span>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={5} className="dashboard-empty">
                No pending fees right now.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};