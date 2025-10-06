// src/components/RequireAuth.jsx
import { Navigate, useLocation } from "react-router-dom";
import { getToken, isExpired, hasAnyRole } from '../utils/auth';

export default function RequireAuth({ children, roles }) {
  const location = useLocation();
  const token = getToken();

  if (!token || isExpired(token)) {
    // ยังไม่ล็อกอิน → 401 → ไปหน้า login
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  if (!hasAnyRole(token, roles)) {
    // ล็อกอินแล้วแต่ role ไม่ถูก → 403 → ไปหน้า Forbidden
    return <Navigate to="/403" replace state={{ from: location }} />;
  }
  return children;
}
