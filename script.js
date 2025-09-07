
    const menu = document.getElementById('menu');
    const nav = document.getElementById('nav');
    const closeBtn = document.getElementById('closeMenu');
    const overlay = document.getElementById('overlay');

    function openMenu() {
      nav.classList.add('active');
      overlay.classList.add('active');
    }

    function closeMenuFn() {
      nav.classList.remove('active');
      overlay.classList.remove('active');
    }

    menu.addEventListener('click', openMenu);
    closeBtn.addEventListener('click', closeMenuFn);
    overlay.addEventListener('click', closeMenuFn);

    document.querySelectorAll('#nav a').forEach(link => {
      link.addEventListener('click', closeMenuFn);
    });

    // Load footer
    async function loadFooter() {
      const footerEl = document.getElementById("footer");
      let footerHTML = "";
      try {
        let response = await fetch("footer.html");
        if (!response.ok) throw new Error("Not found locally");
        footerHTML = await response.text();
      } catch (e1) {
        try {
          let response = await fetch("/footer.html");
          if (!response.ok) throw new Error("Not found in root");
          footerHTML = await response.text();
        } catch (e2) {
          console.error("Footer could not be loaded:", e2);
          footerHTML = "<p style='text-align:center;color:#fff;'>Footer not available</p>";
        }
      }
      footerEl.innerHTML = footerHTML;
    }
    loadFooter();

    // Register service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").then(() => {
        console.log("Service Worker Registered");
      });
    }
  
