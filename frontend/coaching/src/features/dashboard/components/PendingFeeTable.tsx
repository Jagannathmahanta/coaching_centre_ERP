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
  const { t } = useI18n();
  return (
    <div className="dashboard-tableWrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>{t("dashboard.student")}</th>
            <th>{t("dashboard.installment")}</th>
            <th>{t("dashboard.due")}</th>
            <th>{t("dashboard.balance")}</th>
            {showAction ? <th>{t("dashboard.action")}</th> : null}
          </tr>
        </thead>

        <tbody>
          {fees?.length ? (
            fees.map((item) => (
              <tr key={item.fee_id}>
                <td data-label={t("dashboard.student")}>
                  <strong>{item.student_name}</strong>
                  <div className="dashboard-listMeta">
                    {item.class}
                    {item.roll_number ? ` | ${item.roll_number}` : ""}
                  </div>
                </td>

                <td data-label={t("dashboard.installment")}>{item.installment_label}</td>
                <td data-label={t("dashboard.due")}>{shortDate(item.due_date)}</td>
                <td data-label={t("dashboard.balance")}>{currency(item.balance)}</td>

                {showAction ? (
                  <td data-label={t("dashboard.action")}>
                    <button
                      type="button"
                      className="dashboard-actionLink dashboard-actionLink--text dashboard-actionLink--reminder"
                      onClick={() => window.alert(t("dashboard.reminderQueued", { name: item.student_name }))}
                    >
                      {t("dashboard.sendReminder")}
                    </button>
                  </td>
                ) : null}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={showAction ? 5 : 4} className="dashboard-empty">
                {t("dashboard.noPendingFees")}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};
import { useI18n } from "../../../shared/i18n/I18nProvider";
