export type Holiday = {
  id: number;
  title: string;
  description?: string | null;
  start_date: string;
  end_date: string;
  status: string;
};

export type HolidayFormValues = {
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  status: string;
};
