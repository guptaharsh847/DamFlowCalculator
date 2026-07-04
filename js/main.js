"use strict";

document.addEventListener("DOMContentLoaded", () => {
  // PWA Service Worker Registration
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker
        .register("/service-worker.js")
        .then((registration) => {
          console.log(
            "ServiceWorker registration successful with scope: ",
            registration.scope,
          );
        })
        .catch((err) => {
          console.log("ServiceWorker registration failed: ", err);
        });
    });
  }

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

  // PWA Install Prompt
  let deferredPrompt;
  const installPopup = document.getElementById("installPopup");
  const installConfirmBtn = document.getElementById("installConfirmBtn");
  const installCancelBtn = document.getElementById("installCancelBtn");

  window.addEventListener("beforeinstallprompt", (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Show the install popup
    if (installPopup) {
      installPopup.classList.remove("hidden");
    }
  });

  if (installConfirmBtn) {
    installConfirmBtn.addEventListener("click", async () => {
      if (deferredPrompt) {
        // Show the browser's install prompt
        deferredPrompt.prompt();
        // We can't know the result, so we'll assume it was accepted and hide the popup
        deferredPrompt = null;
        installPopup.classList.add("hidden");
      }
    });
  }

  if (installCancelBtn) {
    installCancelBtn.addEventListener("click", () => {
      installPopup.classList.add("hidden");
    });
  }
});