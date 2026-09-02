import React from "react";
import ReactDOM from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";

import App from "./pages/public/App.jsx";
import TrackingPage from "./pages/public/TrackingPage.jsx";
import StaffApp from "./pages/staff/StaffApp.jsx";
import "./styles.css";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/staff",
    element: <StaffApp />,
  },
  {
    path: "/tracking",
    element: <TrackingPage />,
  },
]);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>,
);
