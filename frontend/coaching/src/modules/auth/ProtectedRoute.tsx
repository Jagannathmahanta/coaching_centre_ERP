import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { isAuthenticated } from "../../shared/services/auth";


type Props = {
    children: ReactNode;
};

export default function ProtectedRoute({ children }: Props) {
    return isAuthenticated() ? children : <Navigate to="/login" replace />;
}
