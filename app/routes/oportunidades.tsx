import { Navigate } from "react-router";

export function meta() {
  return [{ title: "Oportunidades | CRM Agencia" }];
}

export default function OportunidadesRedirect() {
  return <Navigate to="/ventas" replace />;
}
