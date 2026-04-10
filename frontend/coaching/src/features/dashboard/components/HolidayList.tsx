import { useI18n } from "../../../shared/i18n/I18nProvider";

type HolidayItem = {
  id: number;
  title: string;
  content: string;
  start_date: string;
  end_date: string;
};

type Props = {
  holidays?: HolidayItem[];
  shortDate: (date: string) => string;
};

export const HolidayList = ({ holidays, shortDate }: Props) => {
  const { t } = useI18n();
  if (!holidays?.length) {
    return <div className="dashboard-empty">{t("dashboard.noHolidaysAdded")}</div>;
  }

  return (
    <div className="dashboard-list">
      {holidays.map((holiday) => (
        <div className="dashboard-listItem" key={holiday.id}>
          <div>
            <div className="dashboard-listTitle">{holiday.title}</div>
            <div className="dashboard-listMeta">{holiday.content}</div>
          </div>

          <div className="dashboard-listMeta">
            {shortDate(holiday.start_date)} {t("holiday.to")} {shortDate(holiday.end_date)}
          </div>
        </div>
      ))}
    </div>
  );
};
