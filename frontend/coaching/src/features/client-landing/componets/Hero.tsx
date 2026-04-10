import { ArrowRight, Award, BookOpen, Bus, House, ShieldCheck, TrendingUp, Users } from "lucide-react";

const stats = [
  { icon: Users, value: "100+", label: "Students Enrolled" },
  { icon: BookOpen, value: "10+", label: "Courses Available" },
  { icon: Award, value: "100%", label: "Success Rate" },
  { icon: TrendingUp, value: "2+", label: "Years of Excellence" },
];

const facilities = [
  {
    icon: House,
    title: "Secured Hostel",
    text: "Safe stay with quality and hygienic breakfast, lunch, and dinner.",
  },
  {
    icon: Bus,
    title: "Transport Facility",
    text: "Reliable pickup and drop support for nearby students.",
  },
  {
    icon: ShieldCheck,
    title: "Parent Confidence",
    text: "Regular monitoring, discipline, and parent-teacher communication.",
  },
];

export default function Hero() {
  const scrollTo = (id: string) => {
    const el = document.querySelector(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <section id="home" className="client-hero">
      <div className="client-hero__backdrop" />
      <div className="client-shell client-hero__content">
        <div className="client-hero__copy">
          <div className="client-chip client-chip--light">Admissions Open for 2026-2027</div>
          <h1 className="client-hero__title">
            Stronger Basics. Better Marks. <span>Confident Students.</span>
          </h1>
          <p className="client-hero__text">
            Home Tutorial Hub helps students from Class VI to X with focused classroom teaching,
            regular tests, concept clarity, and close teacher attention in a disciplined learning environment.
          </p>

          <div className="client-hero__actions">
            <button type="button" className="client-button client-button--light" onClick={() => scrollTo("#courses")}>
              Explore Courses <ArrowRight size={16} />
            </button>
            {/* <button type="button" className="client-button client-button--outlineLight" onClick={() => scrollTo("#upcoming")}>
              <Play size={16} /> Watch Demo
            </button> */}
          </div>

          <div className="client-hero__stats">
            {stats.map(({ icon: Icon, value, label }) => (
              <article key={label} className="client-statCard">
                <Icon size={18} />
                <strong>{value}</strong>
                <span>{label}</span>
              </article>
            ))}
          </div>

          <div className="client-hero__facilityRibbon">
            <span>Secured Hostel & Transport Facilities</span>
          </div>

          <div className="client-hero__facilities">
            {facilities.map(({ icon: Icon, title, text }) => (
              <article key={title} className="client-heroFacility">
                <span className="client-heroFacility__icon">
                  <Icon size={18} />
                </span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="client-hero__visual">
          <div className="client-hero__imageWrap">
            <img
              src="https://images.pexels.com/photos/5212345/pexels-photo-5212345.jpeg?auto=compress&cs=tinysrgb&w=900"
              alt="Students learning in classroom"
              className="client-hero__image"
            />
            <div className="client-hero__floating client-hero__floating--left">
              <strong>Small Batches</strong>
              <span>Personal attention for every student</span>
            </div>
            <div className="client-hero__floating client-hero__floating--right">
              <strong>Monthly Tests</strong>
              <span>Consistent progress tracking</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
