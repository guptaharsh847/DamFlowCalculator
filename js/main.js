"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const sidebar = document.querySelector(".sidebar");
  const sidebarToggle = document.querySelector(".sidebar-toggle");
  const mobileNavToggle = document.querySelector(".mobile-nav-toggle");

  // Desktop sidebar toggle
  if (sidebarToggle && sidebar) {
    sidebarToggle.addEventListener("click", () => {
      sidebar.classList.toggle("collapsed");
      document.body.classList.toggle("sidebar-collapsed");
    });
  }

  // Mobile sidebar toggle
  if (mobileNavToggle && sidebar) {
    mobileNavToggle.addEventListener("click", () => {
      sidebar.classList.add("open");
      document.body.classList.add("sidebar-open");
    });
  }

  // Close mobile sidebar when clicking outside of it
  document.addEventListener("click", (e) => {
    if (sidebar && sidebar.classList.contains("open")) {
      if (!sidebar.contains(e.target) && !mobileNavToggle.contains(e.target)) {
        sidebar.classList.remove("open");
        document.body.classList.remove("sidebar-open");
      }
    }
  });
});