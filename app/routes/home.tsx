import { useEffect } from "react";
import { useNavigate } from "react-router";

export function meta() {
  return [
    { title: "DESEO DIGITAL | CRM" },
    { name: "description", content: "CRM Agencia" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  useEffect(() => { navigate("/dashboard", { replace: true }); }, [navigate]);
  return null;
}
