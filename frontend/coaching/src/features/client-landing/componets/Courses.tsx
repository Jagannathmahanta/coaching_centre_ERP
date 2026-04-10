import { ArrowRight, BookOpen, Clock3, GraduationCap } from "lucide-react";

const courses = [
  {
    title: "Class VI-VIII Foundation",
    level: "Class 6-8",
    duration: "1 Year",
    board: "CBSE, State Boards",
    image: "https://images.pexels.com/photos/301926/pexels-photo-301926.jpeg?auto=compress&cs=tinysrgb&w=600",
    desc: "Build strong learning habits with concept-led teaching in Maths, Science, and English.",
    accent: "Foundation Track",
  },
  {
    title: "Class IX-X Board Prep",
    level: "Class 9-10",
    duration: "1 Year",
    board: "CBSE, State Boards",
    image: "https://images.pexels.com/photos/2280571/pexels-photo-2280571.jpeg?auto=compress&cs=tinysrgb&w=600",
    desc: "Board-focused strategy with regular mock tests and deeper concept reinforcement.",
    accent: "Board Focus",
  },
];

export default function Courses() {
  return (
    <section id="courses" className="client-section">
      <div className="client-shell">
        <div className="client-sectionIntro">
          <div className="client-chip">Our Programs</div>
          <h2>Courses Designed for Academic Growth</h2>
          <p>
            Tailored coaching tracks for students from Class VI to X with regular assessment,Monthly tests,
            doubt resolution, and experienced faculty support.
          </p>
        </div>

        <div className="client-grid client-grid--compact">
          {courses.map((course) => (
            <article key={course.title} className="client-card client-courseCard">
              <img src={course.image} alt={course.title} className="client-courseCard__image" />
              <div className="client-courseCard__body">
                <span className="client-badge client-badge--soft">{course.accent}</span>
                <h3>{course.title}</h3>
                <p>{course.desc}</p>

                <div className="client-courseCard__meta">
                  <span>
                    <GraduationCap size={15} />
                    {course.level}
                  </span>
                  <span>
                    <Clock3 size={15} />
                    {course.duration}
                  </span>
                  <span>
                    <BookOpen size={15} />
                    {course.board}
                  </span>
                </div>

                <button type="button" className="client-button client-button--secondary">
                  View Details <ArrowRight size={16} />
                </button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
