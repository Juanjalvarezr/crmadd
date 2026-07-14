import { useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import Dashboard from "./dashboard";

export function meta() {
  return [
    { title: "DESEO DIGITAL | CRM" },
    { name: "description", content: "CRM Agencia" },
  ];
}

export default function Home() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname === "/") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate, pathname]);

  if (pathname === "/") {
    return <Dashboard />;
  }

  return null;
}
