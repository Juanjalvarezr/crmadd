import { Outlet } from "react-router";

export default function Root() {
  return (
    <div style={{ padding: 24 }}>
      <h1>CRM DESEO DIGITAL</h1>
      <p>Root OK</p>
      <Outlet />
    </div>
  );
}
