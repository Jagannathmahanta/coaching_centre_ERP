import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createStudentAdmission,
  getAdmissionBootstrap,
  getHostelRooms,
  updateStudentAdmission,
  updateStudentFeePlan,
} from "../services/students.service";
import type {
  CatalogBatch,
  CatalogClass,
  CatalogCourse,
  FeeDefinition,
  FeePreview,
  HostelOption,
  HostelRoomOption,
  StudentAdmissionForm,
  StudentDetail,
} from "../types/students.types";
import { cycleLabels, initialStudentAdmissionForm } from "../types/students.types";

function monthDiffInclusive(start: Date, end: Date) {
  return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth()) + 1;
}

function startOfMonth(dateString: string) {
  const date = new Date(dateString);
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

export function currency(value: number) {
  return `₹${value.toFixed(2)}`;
}

export function useStudentAdmission() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  const [form, setForm] = useState<StudentAdmissionForm>(initialStudentAdmissionForm);
  const [definitions, setDefinitions] = useState<FeeDefinition[]>([]);
  const [hostels, setHostels] = useState<HostelOption[]>([]);
  const [classes, setClasses] = useState<CatalogClass[]>([]);
  const [courses, setCourses] = useState<CatalogCourse[]>([]);
  const [batches, setBatches] = useState<CatalogBatch[]>([]);
  const [rooms, setRooms] = useState<HostelRoomOption[]>([]);
  const [initialStudent, setInitialStudent] = useState<StudentDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [bootLoading, setBootLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const { definitions, hostels, classes, courses, batches, student } = await getAdmissionBootstrap(id);
        setDefinitions(definitions);
        setHostels(hostels);
        setClasses(classes);
        setCourses(courses);
        setBatches(batches);

        if (student) {
          setInitialStudent(student);
          setForm({
            name: student.name || "",
            phone: student.phone || "",
            email: student.email || "",
            gender: student.gender || "male",
            status: student.status || "active",
            left_date: student.left_date ? String(student.left_date).slice(0, 10) : "",
            left_reason: student.left_reason || "",
            parent_name: student.parent_name || "",
            parent_phone: student.parent_phone || "",
            parent_email: student.parent_email || "",
            program_type: student.program_type || (student.course_id ? "non_academic" : "academic"),
            board: student.board || "CBSE",
            class_id: student.class_id ? String(student.class_id) : "",
            course_id: student.course_id ? String(student.course_id) : "",
            batch_id: student.batch_id ? String(student.batch_id) : "",
            admission_year: String(student.admission_year || new Date(student.join_date || new Date()).getFullYear()),
            join_date: student.join_date ? String(student.join_date).slice(0, 10) : new Date().toISOString().slice(0, 10),
            fee_structure_id: student.fee_structure_id ? String(student.fee_structure_id) : "",
            class: student.class || "",
            billing_cycle: student.billing_cycle || "monthly",
            academic_year: student.academic_year || "2026-2027",
            due_day: String(student.due_day || 5),
            include_hostel: Boolean(student.include_hostel),
            hostel_id: student.hostel_id ? String(student.hostel_id) : "",
            room_id: student.room_id ? String(student.room_id) : "",
            include_transport: Boolean(student.include_transport),
            notes: student.notes || "",
          });
        }
      } catch (loadError) {
        console.error("Failed to load admission data:", loadError);
        setError("Failed to load admission form data.");
      } finally {
        setBootLoading(false);
      }
    };

    loadData();
  }, [id]);

  useEffect(() => {
    const loadRooms = async () => {
      if (!form.include_hostel || !form.hostel_id) {
        setRooms([]);
        return;
      }

      try {
        setRooms(await getHostelRooms(form.hostel_id));
      } catch (loadError) {
        console.error("Failed to load hostel rooms:", loadError);
        setRooms([]);
      }
    };

    loadRooms();
  }, [form.include_hostel, form.hostel_id]);

  const selectedDefinition = useMemo(
    () => definitions.find((item) => String(item.id) === form.fee_structure_id),
    [definitions, form.fee_structure_id]
  );

  const availableClasses = useMemo(
    () => classes.filter((item) => item.status === "active" || String(item.id) === form.class_id),
    [classes, form.class_id]
  );

  const availableCourses = useMemo(
    () => courses.filter((item) => item.status === "active" || String(item.id) === form.course_id),
    [courses, form.course_id]
  );

  const availableBatches = useMemo(() => {
    return batches.filter((batch) => {
      if (!(batch.status === "active" || String(batch.id) === form.batch_id)) return false;
      if (batch.program_type !== form.program_type) return false;
      if (form.program_type === "academic") {
        return String(batch.class_id || "") === form.class_id && (!form.board || !batch.board || batch.board === form.board);
      }
      return String(batch.course_id || "") === form.course_id;
    });
  }, [batches, form.batch_id, form.class_id, form.course_id, form.program_type, form.board]);

  const filteredDefinitions = useMemo(() => {
    return definitions.filter((definition) => {
      if (definition.program_type !== form.program_type) return false;
      if (form.program_type === "academic") {
        if (form.board && definition.board && definition.board !== form.board) return false;
        if (form.class_id && String(definition.class_id || "") !== form.class_id) return false;
      } else if (form.course_id && String(definition.course_id || "") !== form.course_id) {
        return false;
      }

      if (form.batch_id && String(definition.batch_id || "") !== form.batch_id) return false;
      return true;
    });
  }, [definitions, form.program_type, form.board, form.class_id, form.course_id, form.batch_id]);

  const filteredHostels = useMemo(() => {
    const targetGender = form.gender === "female" ? "girls" : "boys";
    return hostels.filter((hostel) => hostel.status === "active" && hostel.gender_type === targetGender);
  }, [form.gender, hostels]);

  const availableRooms = useMemo(
    () =>
      rooms.filter(
        (room) => room.status === "active" && (Number(room.vacant_seats || 0) > 0 || String(room.id) === form.room_id)
      ),
    [rooms, form.room_id]
  );

  const feePreview = useMemo<FeePreview | null>(() => {
    if (!selectedDefinition || !form.join_date) return null;

    const joinMonth = startOfMonth(form.join_date);
    let applicableMonths = selectedDefinition.duration_months;

    if (selectedDefinition.program_type === "academic" && selectedDefinition.academic_year) {
      const [startYear, endYear] = selectedDefinition.academic_year.split("-").map(Number);
      const sessionStart = new Date(startYear, Number(selectedDefinition.session_start_month || 3) - 1, 1);
      const sessionEnd = endOfMonth(new Date(endYear, Number(selectedDefinition.session_end_month || 2) - 1, 1));
      const effectiveStart = joinMonth > sessionStart ? joinMonth : sessionStart;
      applicableMonths = effectiveStart > sessionEnd ? 0 : monthDiffInclusive(effectiveStart, sessionEnd);
    }

    if (applicableMonths <= 0) return null;

    const tuitionMonthly = Number(selectedDefinition.tuition_total) / Number(selectedDefinition.duration_months);
    const hostelMonthly = form.include_hostel
      ? Number(selectedDefinition.hostel_total) / Number(selectedDefinition.duration_months)
      : 0;
    const transportMonthly = form.include_transport
      ? Number(selectedDefinition.transport_total) / Number(selectedDefinition.duration_months)
      : 0;

    const cycleSize =
      form.billing_cycle === "full_package"
        ? applicableMonths
        : { monthly: 1, quarterly: 3, half_yearly: 6, yearly: 12 }[form.billing_cycle] || 1;

    const firstInstallmentMonths = Math.min(cycleSize, applicableMonths);
    const installmentCount = Math.ceil(applicableMonths / cycleSize);
    const tuitionTotal = tuitionMonthly * applicableMonths;
    const hostelTotal = hostelMonthly * applicableMonths;
    const transportTotal = transportMonthly * applicableMonths;

    return {
      applicableMonths,
      installmentCount,
      firstInstallmentMonths,
      tuitionTotal,
      hostelTotal,
      transportTotal,
      grandTotal: tuitionTotal + hostelTotal + transportTotal,
      firstInstallmentTotal: (tuitionMonthly + hostelMonthly + transportMonthly) * firstInstallmentMonths,
    };
  }, [selectedDefinition, form.join_date, form.include_hostel, form.include_transport, form.billing_cycle]);

  const handleChange = (key: keyof StudentAdmissionForm, value: string | boolean) => {
    setForm((current) => {
      const next = { ...current, [key]: value };

      if (key === "program_type") {
        next.program_type = String(value) as StudentAdmissionForm["program_type"];
        next.class_id = "";
        next.course_id = "";
        next.batch_id = "";
        next.fee_structure_id = "";
        next.class = "";
        next.billing_cycle = "monthly";
      }

      if (key === "join_date" && typeof value === "string") {
        next.admission_year = String(new Date(value || new Date().toISOString().slice(0, 10)).getFullYear());
      }

      if (key === "status" && value === "active") {
        next.left_date = "";
        next.left_reason = "";
      }

      if (key === "board") {
        next.batch_id = "";
        next.fee_structure_id = "";
      }

      if (key === "class_id") {
        next.batch_id = "";
        next.fee_structure_id = "";
        const classRow = classes.find((item) => String(item.id) === String(value));
        next.class = classRow?.class_name || "";
      }

      if (key === "course_id") {
        next.batch_id = "";
        next.fee_structure_id = "";
        const courseRow = courses.find((item) => String(item.id) === String(value));
        next.class = courseRow?.course_name || "";
      }

      if (key === "batch_id") {
        next.fee_structure_id = "";
      }

      if (key === "fee_structure_id") {
        const definition = definitions.find((item) => String(item.id) === String(value));
        if (definition) {
          next.class = definition.class_label || definition.class_name || definition.course_label || definition.course_name || definition.name;
          next.academic_year = definition.academic_year || current.academic_year;
        }
      }

      if (key === "include_hostel" && !value) {
        next.hostel_id = "";
        next.room_id = "";
      }

      if (key === "gender") {
        next.hostel_id = "";
        next.room_id = "";
      }

      if (key === "hostel_id") {
        next.room_id = "";
      }

      return next;
    });
  };

  useEffect(() => {
    if (!form.fee_structure_id) return;
    const stillValid = filteredDefinitions.some((item) => String(item.id) === form.fee_structure_id);
    if (!stillValid) {
      setForm((current) => ({ ...current, fee_structure_id: "" }));
    }
  }, [filteredDefinitions, form.fee_structure_id]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (isEditMode && id) {
        const payload = await updateStudentAdmission(id, form);
        const feePlanChanged = Boolean(
          payload.fee_structure_id &&
            initialStudent &&
            (Number(payload.fee_structure_id) !== Number(initialStudent.fee_structure_id || 0) ||
              payload.billing_cycle !== (initialStudent.billing_cycle || "monthly") ||
              payload.academic_year !== (initialStudent.academic_year || "2026-2027") ||
              Number(payload.due_day) !== Number(initialStudent.due_day || 5) ||
              payload.include_transport !== Boolean(initialStudent.include_transport) ||
              (payload.notes || "") !== (initialStudent.notes || ""))
        );

        if (feePlanChanged) {
          await updateStudentFeePlan(id, payload);
        }

        setSuccess(feePlanChanged ? "Admission and fee plan updated successfully." : "Admission updated successfully.");
        setTimeout(() => navigate("/students"), 1200);
      } else {
        const response = await createStudentAdmission(form);
        const createdStudentId = response.data?.student?.id ?? response.student?.id;
        const admissionNumber = response.data?.student?.roll_number ?? response.student?.roll_number;

        setSuccess(`Admission completed. Student ID ${createdStudentId} created with admission no ${admissionNumber}.`);
        setForm(initialStudentAdmissionForm);
        setTimeout(() => navigate("/fees"), 1200);
      }
    } catch (submitError: any) {
      setError(submitError.response?.data?.error || `Failed to ${isEditMode ? "update" : "create"} admission.`);
    } finally {
      setLoading(false);
    }
  };

  return {
    id,
    isEditMode,
    form,
    definitions,
    classes,
    courses,
    batches,
    hostels,
    rooms,
    loading,
    bootLoading,
    error,
    success,
    availableClasses,
    availableCourses,
    availableBatches,
    filteredDefinitions,
    selectedDefinition,
    filteredHostels,
    availableRooms,
    feePreview,
    handleChange,
    handleSubmit,
    navigate,
    cycleLabels,
    currency,
  };
}
