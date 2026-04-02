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
  showAction?: boolean;
};

export const PendingFeeTable = ({ fees, shortDate, currency, showAction = true }: Props) => {
  return (
    <div className="dashboard-tableWrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Student</th>
            <th>Installment</th>
            <th>Due</th>
            <th>Balance</th>
            {showAction ? <th>Action</th> : null}
          </tr>
        </thead>

        <tbody>
          {fees?.length ? (
            fees.map((item) => (
              <tr key={item.fee_id}>
                <td data-label="Student">
                  <strong>{item.student_name}</strong>
                  <div className="dashboard-listMeta">
                    {item.class}
                    {item.roll_number ? ` | ${item.roll_number}` : ""}
                  </div>
                </td>

                <td data-label="Installment">{item.installment_label}</td>
                <td data-label="Due">{shortDate(item.due_date)}</td>
                <td data-label="Balance">{currency(item.balance)}</td>

                {showAction ? (
                  <td data-label="Action">
                    <button
                      type="button"
                      className="dashboard-actionLink dashboard-actionLink--text dashboard-actionLink--reminder"
                      onClick={() => window.alert(`Reminder queued for ${item.student_name}.`)}
                    >
                      Send Reminder
                    </button>
                  </td>
                ) : null}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={showAction ? 5 : 4} className="dashboard-empty">
                No pending fees right now.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
