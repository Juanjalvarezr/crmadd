import { Outlet } from "react-router";

export default function Root() {
  return (
    <div style={{ padding: 24 }}>
      <h1>CRM DESEO DIGITAL - TEST</h1>
      <p>Si ves esto, la hidratación funciona.</p>
      <Outlet />
    </div>
  );
}
