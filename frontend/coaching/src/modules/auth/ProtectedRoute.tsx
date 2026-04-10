import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { getUser, isAuthenticated, isStaffTeacher } from "../../shared/services/auth";


type Props = {
    children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
    const location = useLocation();

    if (!isAuthenticated()) {
        return <Navigate to="/login" replace />;
    }

    const user = getUser();
    const staffAllowedPaths = new Set(["/dashboard", "/leaves", "/notices"]);

    if (isStaffTeacher(user) && !staffAllowedPaths.has(location.pathname)) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
