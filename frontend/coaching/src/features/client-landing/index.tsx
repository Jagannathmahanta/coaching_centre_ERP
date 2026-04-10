import "./landing.css";
import Navbar from "./componets/Navbar";
import Hero from "./componets/Hero";
import UpcomingBatch from "./componets/upcomingBatch";
import Courses from "./componets/Courses";
import Faculty from "./componets/Faculity";
import Contact from "./componets/Contact";
import Footer from "./componets/Footer";

export default function LandingPage() {
  return (
    <div className="client-landing">
      <Navbar />
      <Hero />
      <UpcomingBatch />
      <Courses />
      <Faculty />
      <Contact />
      <Footer />
    </div>
  );
}
