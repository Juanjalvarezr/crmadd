import { useEffect } from "react";
import { useNavigate } from "react-router";

export function meta() {
  return [{ title: "Inicio | CRM DESEO DIGITAL" }];
}

export default function Index() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/proyectos", { replace: true }); }, [navigate]);
  return null;
}
