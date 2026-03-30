import { CheckboxCard, Field, FormSection, inputStyle } from "./StudentForm";
import type { FeeDefinition, HostelOption, HostelRoomOption, StudentAdmissionForm } from "../types/students.types";

export function HostelSection({
  form,
  selectedDefinition,
  filteredHostels,
  availableRooms,
  onChange,
}: {
  form: StudentAdmissionForm;
  selectedDefinition?: FeeDefinition;
  filteredHostels: HostelOption[];
  availableRooms: HostelRoomOption[];
  onChange: (key: keyof StudentAdmissionForm, value: string | boolean) => void;
}) {
  return (
    <FormSection title="Hostel And Transport">
      <p style={{ color: "#6b7280", marginTop: 8 }}>
        Use the checkboxes below if the student is taking hostel or transport.
      </p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16 }}>
        <CheckboxCard
          label="Hostel Required"
          checked={form.include_hostel}
          onChange={(checked) => onChange("include_hostel", checked)}
          helper={selectedDefinition ? `Hostel total ₹${Number(selectedDefinition.hostel_total).toFixed(2)}` : "Choose fee definition first"}
        />
        <CheckboxCard
          label="Transport Required"
          checked={form.include_transport}
          onChange={(checked) => onChange("include_transport", checked)}
          helper={
            selectedDefinition ? `Transport total ₹${Number(selectedDefinition.transport_total).toFixed(2)}` : "Choose fee definition first"
          }
        />
      </div>

      {form.include_hostel && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 16, marginTop: 16 }}>
          <Field label={form.gender === "female" ? "Girls Hostel" : "Boys Hostel"}>
            <select value={form.hostel_id} onChange={(e) => onChange("hostel_id", e.target.value)} style={inputStyle}>
              <option value="">Select hostel</option>
              {filteredHostels.map((hostel) => (
                <option key={hostel.id} value={hostel.id}>
                  {hostel.hostel_name} • Vacant beds {hostel.vacant_beds || 0}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Room">
            <select value={form.room_id} onChange={(e) => onChange("room_id", e.target.value)} style={inputStyle}>
              <option value="">Select room</option>
              {availableRooms.map((room) => (
                <option key={room.id} value={room.id}>
                  Room {room.room_number} • Vacant {room.vacant_seats || 0}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}
    </FormSection>
  );
}
