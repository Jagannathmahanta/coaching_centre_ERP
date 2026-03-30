UPDATE teacher_salary_slips
SET paid_amount = net_salary
WHERE status = 'paid'
  AND COALESCE(paid_amount, 0) = 0;
