import { Clock, Mail, MapPin, Phone } from "lucide-react";

const contactInfo = [
  {
    icon: MapPin,
    title: "Visit Us",
    lines: ["Home Tution Hub, 1st Floor", "Tikira road, Dhenkikote, 758029 Odisha, India"],
  },
  {
    icon: Phone,
    title: "Call Us",
    lines: ["+91 8249668484", "+91 8249404220"],
  },
  {
    icon: Mail,
    title: "Email Us",
    lines: ["dibyalochan.naik1989@gmail.com", "tutorialhub.con.in@gmail.com"],
  },
  {
    icon: Clock,
    title: "Working Hours",
    lines: ["Mon - Sat: 7:00 AM - 9:00 PM", "Sun: 9:00 AM - 5:00 PM"],
  },
];

export default function Contact() {
  return (
    <section id="contact" className="client-section">
      <div className="client-shell">
        <div className="client-sectionIntro">
          <div className="client-chip">Get In Touch</div>
          <h2>Talk to Our Admission Team</h2>
          <p>
            Share your details and our counsellors will guide you to the right class and batch.
          </p>
        </div>

        <div className="client-contact">
          <div className="client-contact__details">
            {contactInfo.map(({ icon: Icon, title, lines }) => (
              <article key={title} className="client-contactInfo">
                <span className="client-contactInfo__icon">
                  <Icon size={18} />
                </span>
                <div>
                  <h3>{title}</h3>
                  {lines.map((line) => (
                    <p key={line}>{line}</p>
                  ))}
                </div>
              </article>
            ))}

            <div className="client-contact__map">
              <iframe
                title="Home Tutorial Location"
                src="https://www.google.com/maps?q=Dhenkikote,Odisha,India&z=14&output=embed"
                loading="lazy"
                allowFullScreen
              />
            </div>
          </div>

          <div className="client-contact__formCard client-contact__cta">
            <div className="client-chip">Admissions 2026-27</div>
            <h3>Visit, Call, or WhatsApp to Reserve a Seat</h3>
            <p>
              We are currently accepting enquiries for Class VI-VIII Foundation and Class IX-X
              Board Prep. Contact the institute directly for batch timing, fee details, and seat availability.
            </p>

            <div className="client-contact__ctaList">
              <div>
                <strong>Available Courses</strong>
                <span>Class VI-VIII Foundation</span>
                <span>Class IX-X Board Prep</span>
              </div>
              <div>
                <strong>Batch Size</strong>
                <span>Limited to 20 seats per batch</span>
              </div>
              <div>
                <strong>Support</strong>
                <span>Monthly tests, doubt clearing, and guided revision</span>
              </div>
            </div>

            <div className="client-contact__ctaActions">
              <a className="client-button client-button--primary client-button--block" href="tel:+918249668484">
                Call Now
              </a>
              <a className="client-button client-button--ghost client-button--block" href="mailto:admissions@hometutorial.in">
                Email Us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
