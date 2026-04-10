import { ArrowRight, Calendar, Clock, GraduationCap } from "lucide-react";

const upcomingBatches = [
  {
    id: 1,
    course: "Class VI-VIII Foundation",
    category: "School Program",
    startDate: "April 8, 2025",
    duration: "1 Year",
    level: "Class 6-8",
    faculty: "Dibyalochan Naik",
    seats: "20 Seats",
    badge: "20% Early Bird",
  },

  {
    id: 2,
    course: "Class IX-X Board Prep",
    category: "School Program",
    startDate: "April 01, 2026",
    duration: "1 Year",
    level: "Class 9-10",
    faculty: "Asst.Prof. Amarjyoti Mahanta &    Dibyalochan Naik",
    seats: "20 Seats",
    badge: "Limited Seats",
  },
 
];

export default function UpcomingBatch() {
  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section id="upcoming" className="client-section client-section--muted">
      <div className="client-shell">
        <div className="client-sectionIntro">
          <div className="client-chip">Registrations Open</div>
          <h2>Upcoming Batches for the New Academic Session</h2>
          <p>
            Reserve your seat early for our limited-size school batches. Focused mentoring,
            monthly tests, and close classroom support for every student.
          </p>
        </div>

        <div className="client-grid client-grid--compact">
          {upcomingBatches.map((batch) => (
            <article key={batch.id} className="client-card client-batchCard">
              <div className="client-batchCard__top">
                <div>
                  <span className="client-batchCard__category">{batch.category}</span>
                  <h3>{batch.course}</h3>
                </div>
                <span className="client-badge">{batch.badge}</span>
              </div>

              <div className="client-batchCard__meta">
                <div>
                  <Calendar size={16} />
                  <span>{batch.startDate}</span>
                </div>
                <div>
                  <Clock size={16} />
                  <span>{batch.duration}</span>
                </div>
                <div>
                  <GraduationCap size={16} />
                  <span>{batch.level}</span>
                </div>
                {/* <div>
                  <IndianRupee size={16} />
                  <span>{batch.price}</span>
                </div> */}
              </div>

              <p className="client-batchCard__faculty">Mentored by {batch.faculty}</p>
              <div className="client-batchCard__footer">
                <span className="client-batchCard__seats">{batch.seats}</span>
                <button type="button" className="client-button client-button--primary" onClick={() => scrollTo("#contact")}>
                  Enroll Now <ArrowRight size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
