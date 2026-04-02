
export const currency = (value: number | string) => {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
};

export const shortDate = (value: string) => {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export const isNewBatch = (value?: string | null) => {
  if (!value) return false;
  const updatedAt = new Date(value).getTime();
  return Date.now() - updatedAt <= 7 * 24 * 60 * 60 * 1000;
};
