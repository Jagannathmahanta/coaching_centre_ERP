import { useNavigate } from "react-router-dom";
import { useAuth } from "../shared/hooks/AuthContext";
import Logo from "../assets/companylogo.png"

type Props = {
    mobileMenuOpen: boolean;
    onMenuToggle: () => void;
};

export default function Topbar({ mobileMenuOpen, onMenuToggle }: Props) {
    const navigate = useNavigate();
    const { profile: user, signOut } = useAuth();
    void mobileMenuOpen;

    const handleLogout = () => {
        signOut();
        navigate("/login", { replace: true });
    };

   return (
  <div className="appTopbar">
    {/* LEFT */}
    <div className="appTopbar__left">
      <button
        type="button"
        className="appTopbar__menuButton"
        onClick={onMenuToggle}
      >
        ☰
      </button>

      <img src={Logo} alt="Logo" className="appTopbar__logo" />
    </div>

    {/* CENTER */}
    <div className="appTopbar__center">
      <strong className="appTopbar__title">
        Odisha Coaching System
      </strong>
    </div>

    {/* RIGHT */}
    <div className="appTopbar__actions appTopbar__actions--desktop">
      <span className="appTopbar__welcome">
        {user ? `Welcome, ${user.name || user.email}` : "Guest"}
      </span>
      <button onClick={handleLogout} className="appTopbar__logout">
        Logout
      </button>
    </div>
  </div>
);
}
