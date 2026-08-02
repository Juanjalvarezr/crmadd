import { Navigate } from "react-router";

export function meta() {
  return [{ title: "Redirigiendo..." }];
}

export default function Login() {
  return <Navigate to="/" replace />;
}
