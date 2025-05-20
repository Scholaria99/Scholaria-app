
async function syncAwalKuis() {
  const userId = localStorage.getItem("userId");
  if (!userId) return;

  try {
    const res = await fetch('https://scholaria-backend.onrender.com/awal-kuis?userId=${userId}`);
    const data = await res.json();
    if (data.awal_kuis) {
      localStorage.setItem("awalKuis", new Date(data.awal_kuis).toISOString());
    }
  } catch (err) {
    console.error("Gagal sync awalKuis:", err);
  }
}

function decodeLatex(str) {
  return str.replace(/\\\\\(/g, '\\(').replace(/\\\\\)/g, '\\)');
}

document.addEventListener('DOMContentLoaded', async () => {
    await syncAwalKuis();
  const params = new URLSearchParams(window.location.search);
  const matkul = params.get('matkul');
  const topik = params.get('topik');
  const waktu = params.get('waktu');

  document.getElementById('quizInfo').innerHTML = `
    <p><strong>Mata Kuliah:</strong> ${matkul}</p>
    <p><strong>Topik:</strong> ${topik}</p>
    <p><strong>Waktu:</strong> ${new Date(waktu).toLocaleString('id-ID')}</p>
    <hr>
  `;

  try {
    const res = await fetch('https://scholaria-backend.onrender.com/generate-soal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ materi: topik })
    });

    const data = await res.json();
    const soalList = data.soalList || [];

    let currentIndex = 0;
    let score = 0;
    let jawabanUser = [];

   function renderSoal() {
  if (currentIndex >= soalList.length) {
    const totalBobot = soalList.reduce((sum, soal) => {
      if (soal.tingkat === "sulit") return sum + 3;
      if (soal.tingkat === "sedang") return sum + 2;
      return sum + 1;
    }, 0);

    const nilaiAkhir = Math.round((score / totalBobot) * 100);

    document.getElementById('quizContainer').innerHTML = `
      <h2>Kuis Selesai!</h2>
      <p>Skor kamu: ${nilaiAkhir} dari 100</p>
    `;
    document.getElementById('quizNavigation').innerHTML = '';

    const kesalahan = soalList.map((soal, i) => ({
      soal: soal.pertanyaan,
      pilihan: soal.pilihan,
      jawabanBenar: soal.jawaban,
      jawabanUser: jawabanUser[i],
      tingkat: soal.tingkat
    })).filter(item => item.jawabanBenar !== item.jawabanUser);

    if (kesalahan.length > 0) {
      document.getElementById('saranBelajar').innerHTML = "<p><em>Memuat saran belajar berdasarkan kesalahan kamu...</em></p>";
      fetch('https://scholaria-backend.onrender.com/analisis-kesalahan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topik, kesalahan })
      })
      .then(res => res.json())
      .then(data => {
        document.getElementById('saranBelajar').innerHTML = `
          <h3>Saran Belajar dari AI:</h3>
          <p>${data.saran.replace(/\n/g, '<br>')}</p>
          <a href="../akademik/akademik.html"><button id="backBtn" class="back-btn">Kembali</button></a>
        `;
        if (window.MathJax) {
  MathJax.typesetPromise();
}

        simpanNilai(nilaiAkhir, data.saran);
      })
      .catch(err => {
        console.error('Gagal ambil saran belajar:', err);
        document.getElementById('saranBelajar').innerHTML = "<p>Gagal mengambil saran belajar.</p>";
        simpanNilai(nilaiAkhir, null);
      });
    } else {
      document.getElementById('saranBelajar').innerHTML = "<p><strong>Selamat!</strong> Semua jawaban benar 🎉</p>";
      simpanNilai(nilaiAkhir, null);
    }

    return;
  }

  const soal = soalList[currentIndex];
  const container = document.getElementById('quizContainer');

  const pertanyaanHTML = `<div class="question-text">Soal ${currentIndex + 1}: ${soal.pertanyaan}</div>`;
    container.innerHTML = `
      ${pertanyaanHTML}
        <label class="option"><input type="radio" name="jawaban" value="A"> A. ${soal.pilihan.A}</label>
        <label class="option"><input type="radio" name="jawaban" value="B"> B. ${soal.pilihan.B}</label>
        <label class="option"><input type="radio" name="jawaban" value="C"> C. ${soal.pilihan.C}</label>
        <label class="option"><input type="radio" name="jawaban" value="D"> D. ${soal.pilihan.D}</label>
      `;

    document.getElementById('quizNavigation').innerHTML = `
        <button id="nextBtn" class="next-btn">Jawab & Lanjut</button>
     `;

  // Penting! Render ulang LaTeX
  if (window.MathJax) {
    MathJax.typesetPromise().catch(err => {
      console.error("MathJax render error:", err);
    });
  }

  document.getElementById('nextBtn').onclick = () => {
    const selected = document.querySelector('input[name="jawaban"]:checked');
    if (!selected) {
      alertbox.render({
    alertIcon: 'warning',
    title: 'Perhatian!',
    message: 'Pilih jawaban terlebih dahulu',
    btnTitle: 'Ok',
    border:true
  });
      return;
    }

    jawabanUser.push(selected.value);

    if (selected.value === soal.jawaban) {
      let bobot = 1;
      if (soal.tingkat === "sedang") bobot = 2;
      if (soal.tingkat === "sulit") bobot = 3;
      score += bobot;
    }

    currentIndex++;
    renderSoal();
  };
}

   function simpanNilai(nilai, saran) {
  const userId = localStorage.getItem("userId");
  const awalRaw = localStorage.getItem("awalKuis");

  if (!awalRaw || isNaN(new Date(awalRaw))) {
    alert("Tanggal awal kuis tidak tersedia atau invalid. Coba logout dan login ulang.");
    return;
  }

  const awal = new Date(awalRaw); // dari localStorage
  const waktuSekarang = new Date(waktu); // waktu dari URL param

  const mingguTotal = Math.floor((waktuSekarang - awal) / (1000 * 60 * 60 * 24 * 7));
  const bulanKe = Math.floor(mingguTotal / 4) + 1;
  const mingguKe = (mingguTotal % 4) + 1;

  console.log("📅 awal:", awal);
  console.log("📅 waktu quiz:", waktuSekarang);
  console.log("✅ mingguKe:", mingguKe, "bulanKe:", bulanKe);

  fetch('https://scholaria-backend.onrender.com/simpan-nilai', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      matkul,
      topik,
      waktu,
      nilai,
      saran,
      minggu_ke: mingguKe,
      bulan_ke: bulanKe
    })
  })
  .then(res => res.json())
  .then(resp => {
    console.log("✅ Nilai berhasil disimpan:", resp);
    localStorage.setItem(`quizDone_${matkul}_${mingguKe}`, "true");
  })
  .catch(err => {
    console.error("❌ Gagal simpan nilai:", err);
  });
}


    if (soalList.length > 0) {
      renderSoal();
    } else {
      document.getElementById('quizContainer').innerHTML = '<p>Tidak ada soal ditemukan dari AI.</p>';
    }

  } catch (err) {
    console.error(err);
    document.getElementById('quizContainer').innerHTML = 'Gagal memuat soal dari AI.';
  }
});
