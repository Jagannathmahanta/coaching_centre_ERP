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
  if (!holidays?.length) {
    return <div className="dashboard-empty">No holidays added yet.</div>;
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
            {shortDate(holiday.start_date)} to {shortDate(holiday.end_date)}
          </div>
        </div>
      ))}
    </div>
  );
};