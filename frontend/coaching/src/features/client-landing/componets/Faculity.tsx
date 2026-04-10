import { BookOpen } from "lucide-react";
import Amar from "./assets/amar.jpeg";
import Dibyalocha from "./assets/sagar.jpeg";
const faculty = [
  {
    name: "Dibyalochan Naik",
    subject: "Science & Foundation",
    experience: "5+ Years",
    qualification: "Senior Faculty",
    image: Dibyalocha,
    specialization: "Concept building, discipline, and exam-focused practice",
  },
  {
    name: "Asst. Prof. Amarjyoti Mahanta",
    subject: "Board Preparation",
    experience: "5+ Years",
    qualification: "Assistant Professor",
    image: Amar,
    specialization: "Structured board prep, revision strategy, and scoring methods",
  },
];

export default function Faculty() {
  return (
    <section id="faculty" className="client-section client-section--muted">
      <div className="client-shell">
        <div className="client-sectionIntro">
          <div className="client-chip">Meet Our Faculty</div>
          <h2>Experienced Teachers with Proven Classroom Impact</h2>
          <p>
            Learn from subject specialists who combine strong academic expertise with a practical,
            student-focused teaching approach.
          </p>
        </div>

        <div className="client-grid client-grid--compact">
          {faculty.map((member) => (
            <article key={member.name} className="client-card client-facultyCard">
              <img src={member.image} alt={member.name} className="client-facultyCard__image" />
              <div className="client-facultyCard__body">
                <span className="client-badge client-badge--soft">{member.subject}</span>
                <h3>{member.name}</h3>
                <strong>{member.qualification}</strong>
                <p>{member.specialization}</p>
                <div className="client-facultyCard__meta">
                  <span>
                    <BookOpen size={15} />
                    {member.experience}
                  </span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
