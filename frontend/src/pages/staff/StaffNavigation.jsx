import { NavLink } from "react-router-dom";

const staffMenus = [
  ["/staff", "Dynamic Dashboard", true],
  ["/staff/quick", "รายการลงทะเบียนสำหรับแก้เร็ว", false],
  ["/staff/requests", "ตารางข้อมูลเต็ม", false],
];

export default function StaffNavigation() {
  return (
    <nav aria-label="เมนูพนักงาน" className="staff-nav">
      {staffMenus.map(([to, label, end]) => (
        <NavLink
          className={({ isActive }) =>
            `staff-nav-link${isActive ? " staff-nav-link-active" : ""}`
          }
          end={end}
          key={to}
          to={to}
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
