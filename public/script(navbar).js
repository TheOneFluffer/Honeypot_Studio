// ====== Navigation Activation ======
// Highlights the navigation link for the current page
function activateNavLink() {
  const currentUrl = window.location.href;
  const navLinks = document.querySelectorAll('.navbar a');

  navLinks.forEach(link => {
      if (link.href === currentUrl) {
          link.classList.add('active');

          // Highlight parent dropdown if it exists
          const parentDropdown = link.closest('.dropdown');
          if (parentDropdown) {
              const parentLink = parentDropdown.querySelector('a');
              parentLink.classList.add('active');
          }
      }
  });
}
window.onload = activateNavLink;

