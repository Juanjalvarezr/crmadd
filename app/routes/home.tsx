import { useLocation } from "react-router";
import Dashboard from "./dashboard";

export function meta() {
  return [
    { title: "DESEO DIGITAL | CRM" },
    { name: "description", content: "CRM Agencia" },
  ];
}

export default function Home() {
  const { pathname } = useLocation();

  if (pathname === "/") {
    return <Dashboard />;
  }

  return null;
}
