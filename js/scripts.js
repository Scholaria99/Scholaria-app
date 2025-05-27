/*!
* Start Bootstrap - Agency v7.0.12 (https://startbootstrap.com/theme/agency)
* Copyright 2013-2023 Start Bootstrap
* Licensed under MIT (https://github.com/StartBootstrap/startbootstrap-agency/blob/master/LICENSE)
*/
//
// Scripts
// 

window.addEventListener('DOMContentLoaded', event => {

    // Navbar shrink function
    var navbarShrink = function () {
        const navbarCollapsible = document.body.querySelector('#mainNav');
        if (!navbarCollapsible) {
            return;
        }
        if (window.scrollY === 0) {
            navbarCollapsible.classList.remove('navbar-shrink')
        } else {
            navbarCollapsible.classList.add('navbar-shrink')
        }

    };

    // Shrink the navbar 
    navbarShrink();

    // Shrink the navbar when page is scrolled
    document.addEventListener('scroll', navbarShrink);

    //  Activate Bootstrap scrollspy on the main nav element
    const mainNav = document.body.querySelector('#mainNav');
    if (mainNav) {
        new bootstrap.ScrollSpy(document.body, {
            target: '#mainNav',
            rootMargin: '0px 0px -40%',
        });
    };

    // Collapse responsive navbar when toggler is visible
    const navbarToggler = document.body.querySelector('.navbar-toggler');
    const responsiveNavItems = [].slice.call(
        document.querySelectorAll('#navbarResponsive .nav-link')
    );
    responsiveNavItems.map(function (responsiveNavItem) {
        responsiveNavItem.addEventListener('click', () => {
            if (window.getComputedStyle(navbarToggler).display !== 'none') {
                navbarToggler.click();
            }
        });
    });

});

// Animasi fade-in saat elemen terlihat
const faders = document.querySelectorAll(".fade-in");

const appearOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px"
};

const appearOnScroll = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("appear");
        observer.unobserve(entry.target);
    });
}, appearOptions);

faders.forEach(fader => {
    appearOnScroll.observe(fader);
});


//typing text
const typingText = document.querySelector(".typing-text");
const texts = ["Scholaria", "Website Belajar Mahasiswa", "Sahabat untuk Belajar"];
let index = 0;
let charIndex = 0;
let isDeleting = false;

function type() {
  const currentText = texts[index];

  typingText.textContent = currentText.substring(0, charIndex);

  if (!isDeleting) {
    charIndex++;
    if (charIndex > currentText.length) {
      isDeleting = true;
      setTimeout(type, 1000); // delay setelah teks selesai diketik
      return;
    }
  } else {
    charIndex--;
    if (charIndex === 0) {
      isDeleting = false;
      index = (index + 1) % texts.length;
    }
  }

  setTimeout(type, isDeleting ? 50 : 100); // kecepatan ketik / hapus
}

type(); // mulai animasi

document.addEventListener("DOMContentLoaded", () => {
  const userId = localStorage.getItem("userId");
  const username = localStorage.getItem("username");
  const authButton = document.getElementById("auth-button");

  if (userId && username && authButton) {
    authButton.innerHTML = `
      <div class="dropdown">
        <a class="btn btn-primary dropdown-toggle text-uppercase" href="#" id="navbarUsername" role="button" data-bs-toggle="dropdown" aria-expanded="false">
          <i class="fas fa-user-circle me-1"></i> <span id="usernameText">${username}</span>
        </a>
        <ul class="dropdown-menu dropdown-menu-end" id="dropdownMenu">
          <li><a class="dropdown-item" href="#" id="btnLogout">Logout</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item text-danger" href="#" id="btnDeleteAccount">Hapus Akun</a></li>
        </ul>
      </div>
    `;

    document.getElementById("btnLogout").addEventListener("click", () => logout());

    document.getElementById("btnDeleteAccount").addEventListener("click", async () => {
      const konfirmasi = confirm("Yakin ingin menghapus akunmu secara permanen?");
      if (!konfirmasi) return;

      try {
        const res = await fetch(`https://scholaria-backend.onrender.com/hapus-akun/${userId}`, {
          method: "DELETE"
        });
        const data = await res.json();

        alertbox.render({
          alertIcon: 'success',
          title: 'Akun Terhapus',
          message: data.message || 'Akun berhasil dihapus',
          btnTitle: 'OK',
          border: true
        });

        localStorage.clear();

        const okBtn = document.querySelector(".alert-btn");
        if (okBtn) {
          okBtn.addEventListener("click", () => {
            window.location.href = "./loginregister/login.html";
          });
        }
      } catch (err) {
        console.error("❌ Gagal hapus akun:", err);
        alert("Terjadi kesalahan saat menghapus akun.");
      }
    });
  } else {
    // Jika belum login
    authButton.innerHTML = `
      <a class="btn btn-login ms-3 text-uppercase" href="./loginregister/login.html">Login/Register</a>
    `;
  }
});



// Proteksi akses ke halaman fitur
document.addEventListener("DOMContentLoaded", () => {
    const username = localStorage.getItem("username");

    const featureButtons = document.querySelectorAll(".btn-feature-protected, .link-feature-protected");

    featureButtons.forEach(button => {
        button.addEventListener("click", function (event) {
            if (!username) {
                event.preventDefault();
                alertbox.render({
  alertIcon: 'info',
  title: 'Tidak dapat mengakses Fitur ini.',
  message: 'Silakan login terlebih dahulu untuk mengakses fitur ini.',
  btnTitle: 'Ok',
  border:true
});
            }
        });
    });
});

