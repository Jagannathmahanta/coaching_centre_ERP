import type { StudentFiltersState } from "../types/students.types";

const cardStyle = {
background: "#fff",
borderRadius: 16,
padding: 20,
boxShadow: "0 10px 30px rgba(15, 23, 42, 0.06)",
border: "1px solid #e5e7eb",
};

const inputStyle = {
width: "90%",
padding: "12px 14px",
borderRadius: 10,
border: "1px solid #d1d5db",
outline: "none",
};

export function StudentFilters({
search,
setSearch,
filters,
setFilters,
classOptions,
boardOptions,
yearOptions,
}: {
search: string;
setSearch: (value: string) => void;
filters: StudentFiltersState;
setFilters: React.Dispatch<React.SetStateAction<StudentFiltersState>>;
classOptions: string[];
boardOptions: string[];
yearOptions: string[];
}) {
return (
<div style={{ ...cardStyle, marginBottom: 20 }}>
<div
style={{
display: "grid",
gap: 12,
gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
}}
>
{/* Search (takes more space on larger screens) */}
<input
value={search}
onChange={(event) => setSearch(event.target.value)}
placeholder="Search by name, admission no, class, or phone"
style={{
...inputStyle,
gridColumn: "span 1", // expands on larger screens
}}
/>

    <select
      value={filters.className}
      onChange={(event) =>
        setFilters((current) => ({
          ...current,
          className: event.target.value,
        }))
      }
      style={inputStyle}
    >
      <option value="">All classes</option>
      {classOptions.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>

    {/* Board Filter */}
    <select
      value={filters.board}
      onChange={(event) =>
        setFilters((current) => ({
          ...current,
          board: event.target.value,
        }))
      }
      style={inputStyle}
    >
      <option value="">All boards</option>
      {boardOptions.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>

    {/* Academic Year Filter */}
    <select
      value={filters.academicYear}
      onChange={(event) =>
        setFilters((current) => ({
          ...current,
          academicYear: event.target.value,
        }))
      }
      style={inputStyle}
    >
      <option value="">All years</option>
      {yearOptions.map((item) => (
        <option key={item} value={item}>
          {item}
        </option>
      ))}
    </select>

    <select
      value={filters.status}
      onChange={(event) =>
        setFilters((current) => ({
          ...current,
          status: event.target.value,
        }))
      }
      style={inputStyle}
    >
      <option value="all">All students</option>
      <option value="active">Active only</option>
      <option value="left">Left students</option>
      <option value="inactive">Inactive students</option>
    </select>
  </div>
</div>
);
}
