import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";
import "./DashboardPage.css";

type DashboardStatBlock = {
  total_students: number | string;
  active_students: number | string;
  collected_this_month: number | string;
  pending_this_month: number | string;
  pending_fee_count: number | string;
  upcoming_exam_count: number | string;
  recent_result_count: number | string;
  active_notice_count: number | string;
  holiday_notice_count: number | string;
};

type NoticeItem = {
  id: number;
  title: string;
  content: string;
  priority?: string | null;
  target_audience?: string | null;
  expires_at?: string | null;
  created_at: string;
};

type HolidayItem = {
  id: number;
  title: string;
  content: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at: string;
};

type ExamItem = {
  id: number;
  exam_name: string;
  subject: string;
  class: string;
  board?: string | null;
  academic_year?: string | null;
  exam_date: string;
  time?: string | null;
  results_count?: number | string;
};

type RecentResultItem = {
  exam_id: number;
  exam_name: string;
  subject: string;
  class: string;
  exam_date: string;
  result_count?: number | string;
  last_result_at?: string | null;
};

type PendingFeeItem = {
  fee_id: number;
  student_name: string;
  class: string;
  roll_number?: string | null;
  installment_label: string;
  due_date: string;
  balance: number | string;
  total_amount: number | string;
  status: string;
};

type DashboardResponse = {
  stats: DashboardStatBlock;
  recent_notices: NoticeItem[];
  upcoming_exams: ExamItem[];
  recent_results: RecentResultItem[];
  upcoming_holidays: HolidayItem[];
  pending_fees: PendingFeeItem[];
};

function currency(value: number | string | null | undefined) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

function shortDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function isNewBatch(value: string | null | undefined) {
  if (!value) return false;
  const updatedAt = new Date(value).getTime();
  return Date.now() - updatedAt <= 1000 * 60 * 60 * 24 * 3;
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const [showAllPendingFees, setShowAllPendingFees] = useState(false);
  const dashboardQuery = useQuery({
    queryKey: ["dashboard-command-center"],
    queryFn: async () => {
      const response = await api.get("/dashboard");
      return response.data as DashboardResponse;
    },
  });

  const data = dashboardQuery.data;
  const stats = data?.stats;
  const pendingFees = data?.pending_fees || [];
  const pendingFeesPreview = pendingFees.slice(0, 5);

  const downloadResultBatch = async (examId: number) => {
    const [examRes, resultRes] = await Promise.all([
      api.get(`/exams/${examId}/roster`),
      api.get(`/exams/${examId}/results`),
    ]);

    const exam = examRes.data?.exam;
    const roster = examRes.data?.students || [];
    const results = resultRes.data || [];
    const resultMap = new Map(results.map((item: any) => [String(item.student_id), item]));

    const lines = [
      ["Exam Name", exam?.exam_name || ""],
      ["Subject", exam?.subject || ""],
      ["Class", exam?.class || ""],
      ["Date", exam?.exam_date || ""],
      [],
      ["Admission No", "Student", "Status", "Marks", "Grade", "Rank"],
      ...roster.map((student: any) => {
        const result = resultMap.get(String(student.student_id)) || student;
        return [
          student.roll_number || "",
          student.student_name || "",
          result.status || "present",
          result.marks_obtained ?? "",
          result.grade || "",
          result.rank ?? "",
        ];
      }),
    ];

    const csv = lines
      .map((row) => row.map((cell: string | number) => `"${String(cell ?? "").replaceAll('"', '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${exam?.exam_name || "result-batch"}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-page">
      <div className="dashboard-hero">
        <div>
          <h1>Command Center</h1>
          <p>Track notices, upcoming exams, recent results, holidays, and pending fee collections from one dashboard.</p>
        </div>
        <span className="dashboard-chip">Attendance block will come after attendance module</span>
      </div>

      {dashboardQuery.isLoading ? (
        <div className="dashboard-panel dashboard-empty">Loading dashboard...</div>
      ) : (
        <>
          <section className="dashboard-stats">
            <StatCard accent="#2563eb" label="Total Students" value={stats?.total_students || 0} subvalue={`${stats?.active_students || 0} active`} />
            <StatCard accent="#059669" label="Fees Collected" value={currency(stats?.collected_this_month)} subvalue="Current month" />
            <StatCard accent="#d97706" label="Pending Fees" value={currency(stats?.pending_this_month)} subvalue={`${stats?.pending_fee_count || 0} installments due`} />
            <StatCard accent="#7c3aed" label="Upcoming Exams" value={stats?.upcoming_exam_count || 0} subvalue="Next 30 days" />
            <StatCard accent="#dc2626" label="Active Notices" value={stats?.active_notice_count || 0} subvalue={`${stats?.holiday_notice_count || 0} holiday notices`} />
          </section>

          <section className="dashboard-grid">
            <div className="dashboard-stack">
              <Panel title="Notice Board" subtitle="Recent updates for students and parents">
                <div className="dashboard-list">
                  {data?.recent_notices?.length ? data.recent_notices.map((notice) => (
                    <div className="dashboard-listItem" key={notice.id}>
                      <div>
                        <div className="dashboard-listTitle">{notice.title}</div>
                        <div className="dashboard-listMeta">{notice.content}</div>
                        <div className="dashboard-listMeta">Posted {shortDate(notice.created_at)}</div>
                      </div>
                      <span className={`dashboard-priority ${(notice.priority || "medium").toLowerCase()}`}>
                        {notice.priority || "medium"}
                      </span>
                    </div>
                  )) : <div className="dashboard-empty">No notices posted yet.</div>}
                </div>
              </Panel>

              <Panel title="Upcoming Exams" subtitle="Exam schedule coming up soon">
                <div className="dashboard-list">
                  {data?.upcoming_exams?.length ? data.upcoming_exams.map((exam) => (
                    <div className="dashboard-listItem" key={exam.id}>
                      <div>
                        <div className="dashboard-listTitle">{exam.exam_name}</div>
                        <div className="dashboard-listMeta">{exam.subject} | {exam.class} | {exam.board || "No board"}</div>
                      </div>
                      <div className="dashboard-listMeta">
                        {shortDate(exam.exam_date)}
                        {exam.time ? `, ${exam.time.slice(0, 5)}` : ""}
                      </div>
                    </div>
                  )) : <div className="dashboard-empty">No upcoming exams.</div>}
                </div>
              </Panel>

              <Panel title="Upcoming Holidays" subtitle="Upcoming center holidays from the holiday module">
                <div className="dashboard-list">
                  {data?.upcoming_holidays?.length ? data.upcoming_holidays.map((notice) => (
                    <div className="dashboard-listItem" key={notice.id}>
                      <div>
                        <div className="dashboard-listTitle">{notice.title}</div>
                        <div className="dashboard-listMeta">{notice.content}</div>
                      </div>
                      <div className="dashboard-listMeta">{`${shortDate(notice.start_date)} to ${shortDate(notice.end_date)}`}</div>
                    </div>
                  )) : <div className="dashboard-empty">No holidays added yet.</div>}
                </div>
              </Panel>
            </div>

            <div className="dashboard-stack">
              <Panel title="Recent Results" subtitle="Latest saved student result entries">
                <div className="dashboard-list">
                  {data?.recent_results?.length ? data.recent_results.map((item, index) => (
                    <div className="dashboard-listItem" key={`${item.exam_id}-${index}`}>
                      <div>
                        <div className="dashboard-listTitle">{item.exam_name}</div>
                        <div className="dashboard-listMeta">{item.class} | {item.subject}</div>
                      </div>
                      <div className="dashboard-resultActions">
                        {isNewBatch(item.last_result_at) && <span className="dashboard-badge new">New</span>}
                        <button className="dashboard-actionLink" type="button" onClick={() => downloadResultBatch(item.exam_id)}>
                          Download Result
                        </button>
                        <button className="dashboard-actionLink secondary" type="button" onClick={() => navigate("/exams")}>
                          Open
                        </button>
                      </div>
                    </div>
                  )) : <div className="dashboard-empty">No recent result batches yet.</div>}
                </div>
              </Panel>

              <Panel title="Pending Fee List" subtitle="Top dues needing follow-up">
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
                      {pendingFeesPreview.length ? pendingFeesPreview.map((item) => (
                        <tr key={item.fee_id}>
                          <td>
                            <strong>{item.student_name}</strong>
                            <div className="dashboard-listMeta">{item.class}{item.roll_number ? ` | ${item.roll_number}` : ""}</div>
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
                      )) : (
                        <tr>
                          <td colSpan={5} className="dashboard-empty">No pending fees right now.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                {pendingFees.length > 5 ? (
                  <div className="dashboard-tableFooter">
                    <button
                      className="dashboard-actionLink secondary"
                      type="button"
                      onClick={() => setShowAllPendingFees(true)}
                    >
                      View All
                    </button>
                  </div>
                ) : null}
              </Panel>
            </div>
          </section>
        </>
      )}

      {showAllPendingFees ? (
        <div
          className="dashboard-modalOverlay"
          onClick={() => setShowAllPendingFees(false)}
          role="presentation"
        >
          <div
            className="dashboard-modal"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="All pending fees"
          >
            <div className="dashboard-cardHeader">
              <div>
                <h2>All Pending Fees</h2>
                <p>Full pending student fee list for the current month.</p>
              </div>
              <button
                className="dashboard-actionLink secondary"
                type="button"
                onClick={() => setShowAllPendingFees(false)}
              >
                Close
              </button>
            </div>

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
                  {pendingFees.map((item) => (
                    <tr key={item.fee_id}>
                      <td>
                        <strong>{item.student_name}</strong>
                        <div className="dashboard-listMeta">{item.class}{item.roll_number ? ` | ${item.roll_number}` : ""}</div>
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
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ accent, label, subvalue, value }: { accent: string; label: string; subvalue: string; value: number | string }) {
  return (
    <article className="dashboard-statCard" style={{ ["--accent-color" as string]: accent }}>
      <div className="dashboard-statLabel">{label}</div>
      <div className="dashboard-statValue">{value}</div>
      <div className="dashboard-statSubvalue">{subvalue}</div>
    </article>
  );
}

function Panel({ children, subtitle, title }: { children: ReactNode; subtitle: string; title: string }) {
  return (
    <section className="dashboard-panel">
      <div className="dashboard-cardHeader">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}
