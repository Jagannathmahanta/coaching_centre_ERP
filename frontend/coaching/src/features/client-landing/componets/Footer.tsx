import Logo from "./assets/homeTutorial.png";
import { FaFacebookF, FaInstagram, FaLinkedinIn, FaXTwitter, FaYoutube } from "react-icons/fa6";

const footerLinks = {
  "Quick Links": [
    { label: "Home", href: "#home" },
    { label: "Upcoming Batch", href: "#upcoming" },
    { label: "Courses", href: "#courses" },
    { label: "Faculty", href: "#faculty" },
    { label: "Contact", href: "#contact" },
  ],
  Programs: [
    { label: "Class VI-VIII Foundation", href: "#courses" },
    { label: "Class IX-X Board Prep", href: "#courses" },
  ],
  Support: [
    { label: "Admission Enquiry", href: "#contact" },
    { label: "Fee Details", href: "#contact" },
    { label: "Batch Timing", href: "#contact" }
  ],
};

const socials = [
  { icon: FaFacebookF, href: "#", label: "Facebook" },
  { icon: FaXTwitter, href: "#", label: "Twitter" },
  { icon: FaInstagram, href: "#", label: "Instagram" },
  { icon: FaYoutube, href: "#", label: "YouTube" },
  { icon: FaLinkedinIn, href: "#", label: "LinkedIn" },
];

export default function Footer() {
  const scrollTo = (href: string) => {
    if (href === "#") {
      return;
    }

    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <footer className="client-footer">
      <div className="client-shell client-footer__grid">
        <div className="client-footer__brand">
          <div className="client-footer__logo">
            <span className="client-footer__logoMark">
              <img src={Logo} alt="Home Tutorial Logo" style={{height:64,width:64}} />
            </span>
            <strong>Home Tutorial Hub</strong>
          </div>
          <p>
            A focused coaching institute in Dhenkikote for Class VI to X students who need
            concept clarity, disciplined study support, and better exam performance.
          </p>
          <div className="client-footer__socials">
            {socials.map(({ icon: Icon, href, label }) => (
              <a key={label} href={href} aria-label={label} className="client-footer__social">
                <Icon size={14} />
              </a>
            ))}
          </div>
        </div>

        {Object.entries(footerLinks).map(([category, links]) => (
          <div key={category}>
            <h3>{category}</h3>
            <div className="client-footer__links">
              {links.map((link) => (
                <button key={link.label} type="button" onClick={() => scrollTo(link.href)}>
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="client-shell client-footer__bottom">
        <p>&copy; {new Date().getFullYear()} Home Tutorial Hub. All rights reserved.</p>
        <p className="client-footer__powered">
    Powered By:  
    <a 
      href="https://tutorialhub.co.in" 
      target="_blank" 
      rel="noopener noreferrer"
      style={{marginLeft:5}}
    >
      tutorialhub.co.in
    </a>, Keonjhar, Odisha
  </p>
      </div>
    </footer>
  );
}
