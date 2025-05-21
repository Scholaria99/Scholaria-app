async function syncAwalKuis() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  try {
    const res = await fetch(`https://scholaria-backend.onrender.com/awal-kuis?userId=${userId}`);
    const data = await res.json();
    if (data.awal_kuis) {
      localStorage.setItem("awalKuis", new Date(data.awal_kuis).toISOString());
    }
  } catch (err) {
    console.error("Gagal sync awalKuis:", err);
  }
}

  const username = localStorage.getItem("username");
  if (username) {
    const usernameText = document.getElementById("usernameText");
    if (usernameText) {
      usernameText.textContent = username;
    }
  }


document.addEventListener('click', function (e) {
  const toggle = document.getElementById("navbarUsername");
  const menu = document.getElementById("dropdownMenu");

  if (toggle && toggle.contains(e.target)) {
    menu.classList.toggle("show");
  } else {
    if (menu) menu.classList.remove("show");
  }
});



document.getElementById('jadwalForm').addEventListener('submit', async function(e) {
  e.preventDefault();

  const formData = new FormData(this);
  const data = {
    userId: localStorage.getItem("userId"),
    hari: formData.get('hari'),
    jam_mulai: formData.get('jam_mulai'),
    jam_selesai: formData.get('jam_selesai'),
    matkul: formData.get('matkul')
  };

  // 🔍 Validasi bentrok jadwal
  const existing = await fetch(`https://scholaria-backend.onrender.com/list-jadwal?userId=${data.userId}`);
  const jadwalList = await existing.json();

  const bentrok = jadwalList.some(j => 
    j.hari === data.hari &&
    (
      (data.jam_mulai >= j.jam_mulai && data.jam_mulai < j.jam_selesai) ||
      (data.jam_selesai > j.jam_mulai && data.jam_selesai <= j.jam_selesai) ||
      (data.jam_mulai <= j.jam_mulai && data.jam_selesai >= j.jam_selesai) // seluruh rentang overlapped
    )
  );

  if (bentrok) {
    alertbox.render({
    alertIcon: 'warning',
    title: 'Perhatian!',
    message: 'Jadwal bentrok! Sudah ada kuliah lain di hari dan jam tersebut.',
    btnTitle: 'Ok',
    border:true
  });
    return;
  }

  try {
    const res = await fetch('https://scholaria-backend.onrender.com/input-jadwal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
     await res.json();
    alertbox.render({
  alertIcon: 'success',
  title: 'Berhasil!',
  message: 'menyimpan Jadwal kuliah',
  btnTitle: 'Ok',
  border:true
});
    fetchJadwal();
    this.reset();
    document.getElementById("jadwalModal").classList.remove("show");
  } catch (err) {
    console.error(err);
    document.getElementById('response').innerText = 'Terjadi kesalahan saat mengirim data.';
  }
  tampilkanQuizHariIni()
});


  async function fetchJadwal() {
  try {
    const userId = localStorage.getItem("userId");
    const res = await fetch(`https://scholaria-backend.onrender.com/list-jadwal?userId=${userId}`);
    const data = await res.json();
    const tbody = document.getElementById('tabelJadwal').querySelector("tbody");
    const tabel = document.getElementById('tabelJadwal');
    const heading = document.getElementById('jadwalHeading');

    tbody.innerHTML = '';

    if (data.length === 0) {
      tabel.style.display = "none";
      heading.style.display = "none";
      return;
    }

    tabel.style.display = "table";
    heading.style.display = "block";

    data.forEach(j => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td><span>${j.hari}</span><select style="display:none">
          <option>Senin</option><option>Selasa</option><option>Rabu</option>
          <option>Kamis</option><option>Jumat</option><option>Sabtu</option><option>Minggu</option>
        </select></td>
        <td><span>${j.jam_mulai}</span><input type="time" value="${j.jam_mulai}" style="display:none"></td>
        <td><span>${j.jam_selesai}</span><input type="time" value="${j.jam_selesai}" style="display:none"></td>
        <td>
  <span>${j.matkul}</span>
  <input type="text" value="${j.matkul}" style="display:none">
  <div class="action-buttons-inline">
    <button onclick="toggleEditRow(this, ${j.id})" title="Edit">
      <i class="fas fa-pen"></i>
    </button>
    <button onclick="hapusJadwal(${j.id})" title="Hapus">
      <i class="fas fa-trash"></i>
    </button>
  </div>
</td>


      `;
      tbody.appendChild(row);
    });
  } catch (err) {
    console.error("❌ Gagal ambil jadwal:", err);
  }
}


function toggleEditRow(button, id) {
  const row = button.closest("tr");
  const spans = row.querySelectorAll("td span");
  const inputs = row.querySelectorAll("td input, td select");

  const sedangEdit = button.textContent === "Simpan";

  if (sedangEdit) {
    // Simpan perubahan
    const hari = inputs[0].value;
    const jam_mulai = inputs[1].value;
    const jam_selesai = inputs[2].value;
    const matkul = inputs[3].value;

   fetch('https://scholaria-backend.onrender.com/update-jadwal', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, hari, jam_mulai, jam_selesai, matkul })
    })
    .then(res => res.json())
    .then(resp => {
      console.log(resp);
      fetchJadwal();
      tampilkanQuizHariIni()
    })
    .catch(err => {
      console.error("❌ Gagal update:", err);
    });
  } else {
    // Masuk ke mode edit
    spans.forEach(span => span.style.display = "none");
    inputs.forEach(input => input.style.display = "inline");
    inputs[0].value = spans[0].textContent; // isi select hari
    button.textContent = "Simpan";

    const batalBtn = document.createElement("button");
    batalBtn.textContent = "Batal";
    batalBtn.onclick = () => fetchJadwal();
    button.after(batalBtn);
  }
}

async function hapusJadwal(id) {
  if (!confirm("Yakin ingin menghapus jadwal ini?")) return;
  try {
    const res = await fetch(`https://scholaria-backend.onrender.com/hapus-jadwal/${id}`, {
      method: "DELETE"
    });
    const result = await res.json();
    alert(result.message || "Berhasil dihapus");
    fetchJadwal();
    tampilkanQuizHariIni()
  } catch (err) {
    console.error("❌ Gagal hapus jadwal:", err);
    alert("Gagal menghapus jadwal.");
  }
}


async function sudahKerjakanQuiz(matkul) {
  const userId = localStorage.getItem("userId");
  const awalTimestamp = new Date(localStorage.getItem("awalKuis") || "2025-02-26T00:00");
  const mingguKe = Math.floor((new Date() - awalTimestamp) / (1000 * 60 * 60 * 24 * 7)) + 1;

  try {
    const res = await fetch(`https://scholaria-backend.onrender.com/statistik-mingguan?userId=${userId}`);
    const data = await res.json();
    return data.some(item => item.minggu_ke == mingguKe && item.matkul.toLowerCase() === matkul.toLowerCase());
  } catch (err) {
    console.error("Gagal cek quiz mingguan:", err);
    return false;
  }
}





async function tampilkanQuizHariIni() {
  // Set awal kuis jika belum ada (sinkron dengan quiz.html)

  const userId = localStorage.getItem("userId");
  const res = await fetch(`https://scholaria-backend.onrender.com/jadwal-hari-ini?userId=${userId}`);
  const jadwalHariIni = await res.json();
  const quizForm = document.getElementById('quizFormContainer');
  quizForm.innerHTML = ''; // Reset form

 const waktuLokal = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);



  let adaQuiz = false;

  for (let i = 0; i < jadwalHariIni.length; i++) {
    const j = jadwalHariIni[i];
   const sudah = await sudahKerjakanQuiz(j.matkul);

if (sudah) continue;


    adaQuiz = true;
    const div = document.createElement('div');
    div.innerHTML = `
      <hr>
      <strong>${j.matkul}</strong><br>
      <input type="hidden" id="matkul_quiz_${i}" value="${j.matkul}">
      <label>Topik: <input type="text" id="topik_quiz_${i}" required></label><br>
      <input type="hidden" id="waktu_quiz_${i}" value="${waktuLokal}">
      <button onclick="kerjakanQuiz(event, ${i})">Mulai Quiz</button>
    `;
    quizForm.appendChild(div);
  }

  const heading = document.getElementById("quizHeading");

if (!adaQuiz) {
  heading.style.display = "none";
  quizForm.style.display = "none";
} else {
  heading.style.display = "block";
  quizForm.style.display = "block";
}

}

  function kerjakanQuiz(e, index) {
    e.preventDefault();
    const matkul = document.getElementById(`matkul_quiz_${index}`).value;
    const topik = document.getElementById(`topik_quiz_${index}`).value;
    const waktu = document.getElementById(`waktu_quiz_${index}`).value;

    if (!topik.trim()) {
      alertbox.render({
    alertIcon: 'warning',
    title: 'Perhatian!',
    message: 'Topik harus diisi terlebih dahulu',
    btnTitle: 'Ok',
    border:true
  });
      return;
    }

    const params = new URLSearchParams({ matkul, topik, waktu });
    window.location.href = `../quiz/quiz.html?${params.toString()}`;
  }

  function logout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
 
 alertbox.render({
  alertIcon: 'success',
  title: 'Sampai jumpa kembali!',
  message: 'Anda telah logout',
  btnTitle: 'Ok',
  border:true
});

    const okBtn = document.querySelector(".alert-btn"); // tombol OK
    if (okBtn) {
      okBtn.addEventListener("click", () => {
        window.location.href = "../../loginregister/login.html";
      });
    }
 
}

  document.addEventListener("DOMContentLoaded", async () => {
  await syncAwalKuis();
  fetchJadwal();
  tampilkanQuizHariIni();

  // Modal logika
  const modal = document.getElementById("jadwalModal");
  const openBtn = document.getElementById("openJadwalModal");
  const closeBtn = document.getElementById("closeJadwalModal");

  openBtn.addEventListener("click", () => {
    modal.classList.add("show");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
  });

  // Tutup modal saat klik luar konten
  window.addEventListener("click", function (e) {
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  });
});


  function toggleMenu() {
    const menu = document.getElementById("navbarMenu");
    menu.classList.toggle("show");
  }

  
