let allData = [];
let chart;

async function fetchStatistikMingguan() {
  const userId = localStorage.getItem("userId");
  const res = await fetch(`https://scholaria-backend.onrender.com/statistik-mingguan?userId=${userId}`);
  return await res.json();
}

async function fetchSaranPerMatkul(matkul) {
  const userId = localStorage.getItem("userId");
  const res = await fetch(`https://scholaria-backend.onrender.com/saran-terakhir?matkul=${encodeURIComponent(matkul)}&userId=${userId}`);
  return await res.json();
}

function groupByMinggu(data) {
  const grouped = {};
  data.forEach(item => {
    const key = item.minggu_ke;
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(item);
  });
  return grouped;
}

function renderChart(mingguData) {
  const labels = mingguData.map(d => d.matkul);
  const data = mingguData.map(d => d.nilai);
  const ctx = document.getElementById("mingguChart").getContext("2d");

  if (chart) chart.destroy();

  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Nilai Mingguan per Matkul',
        data,
        backgroundColor: 'lightblue',
        borderColor: 'blue',
        borderWidth: 1
      }]
    },
    options: {
    animation: {
      delay: function(ctx) {
        return ctx.dataIndex * 200;
      },
      duration: 800,
      easing: 'easeOutBack'
    },
    scales: {
      y: { beginAtZero: true }
    }
  }
});
}

function renderBulanHistoryChart(records, bulan) {
  const mingguMap = {};
  records.forEach(r => {
    if (!mingguMap[r.minggu_ke]) mingguMap[r.minggu_ke] = [];
    mingguMap[r.minggu_ke].push(r.nilai);
  });

  const mingguLabels = Object.keys(mingguMap).sort((a, b) => a - b);
  const avgPerMinggu = mingguLabels.map(m => {
    const list = mingguMap[m];
    return list.reduce((a, b) => a + b, 0) / list.length;
  });

  const ctx = document.getElementById("mingguChart").getContext("2d");
  if (chart) chart.destroy();
  chart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: mingguLabels.map(m => `Minggu ${m}`),
      datasets: [{
        label: `Rata-rata Nilai Bulan ${bulan}`,
        data: avgPerMinggu,
        backgroundColor: '#ffd966',
        borderColor: '#c29d0b',
        borderWidth: 1
      }]
    },
    options: {
    animation: {
      delay: function(ctx) {
        return ctx.dataIndex * 200;
      },
      duration: 800,
      easing: 'easeOutBack'
    },
    scales: {
      y: { beginAtZero: true }
    }
  }
});
}

async function getCurrentBulan() {
  const userId = localStorage.getItem("userId");
  const res = await fetch(`https://scholaria-backend.onrender.com/bulan-terbaru?userId=${userId}`);
  const data = await res.json();
  return data.bulan_terbaru || 1;
}

async function fetchAwalKuisFromDB() {
  const userId = localStorage.getItem("userId");
  const res = await fetch(`https://scholaria-backend.onrender.com/awal-kuis?userId=${userId}`);
  const data = await res.json();
  return new Date(data.awal_kuis);
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

document.addEventListener('DOMContentLoaded', async () => {
  const mingguSelect = document.getElementById("mingguSelect");
  allData = await fetchStatistikMingguan();
  const currentBulan = await getCurrentBulan();

  if (!allData || allData.length === 0) {
    document.querySelector("h1").style.display = "none"; // Judul "Statistik Nilai per Minggu"
    document.getElementById("mingguSelect").style.display = "none";
    document.getElementById("historyBtn").style.display = "none";
    document.getElementById("backBtn").style.display = "none";
    document.querySelector("label[for='mingguSelect']").style.display = "none";


  document.getElementById("chartContainer").innerHTML = `
    <div style="text-align: center; margin-top: 100px;">
      <h2>Belum ada data nilai</h2>
      <p>Silakan kerjakan kuis terlebih dahulu untuk melihat statistik kemajuan belajar Anda.</p>
    </div>
  `;
  return; 
}

  if (currentBulan < 2) {
    document.getElementById("historyBtn").disabled = true;
  }

  const grouped = groupByMinggu(allData);
  const mingguKeys = Object.keys(grouped).sort((a,b) => a - b);

  mingguKeys.forEach(minggu => {
    const opt = document.createElement("option");
    opt.value = minggu;
    opt.textContent = `Minggu ${minggu}`;
    mingguSelect.appendChild(opt);
  });

  async function updateView(mingguKe) {
    const mingguData = grouped[mingguKe];
    renderChart(mingguData);

    const saranHTML = await Promise.all(mingguData.map(async (item, index) => {
      const saranRes = await fetchSaranPerMatkul(item.matkul);
      const id = `saran-${index}`;
      return `
  <div class="saran-card">
    <strong>${item.matkul}</strong>
    <button onclick="document.getElementById('${id}').classList.toggle('hidden'); document.getElementById('${id}').style.display = document.getElementById('${id}').style.display === 'none' ? 'block' : 'none';">Lihat Saran</button>
    <button style="margin-left:10px; color:red;" onclick="hapusNilai('${item.matkul}', ${item.minggu_ke})">Hapus Nilai</button>
    <div id="${id}" class="saran-content" style="display: none;">
      <p>${saranRes.saran.replace(/\n/g, '<br>')}</p>
    </div>
  </div>
`;
    }));

    document.getElementById("saranMinggu").innerHTML = `
      <h3>Saran Belajar per Matkul</h3>
      ${saranHTML.join('')}
    `;

    if (window.MathJax) {
      MathJax.typesetPromise().catch(err => {
        console.error("Gagal render MathJax di saran:", err);
      });
    }
  }

  mingguSelect.addEventListener('change', () => {
    updateView(mingguSelect.value);
  });

  if (mingguKeys.length > 0) {
    mingguSelect.value = mingguKeys[0];
    updateView(mingguKeys[0]);
  }

  document.getElementById("historyBtn").addEventListener("click", async () => {
    const userId = localStorage.getItem("userId");
    const res = await fetch(`https://scholaria-backend.onrender.com/history-bulanan?userId=${userId}`);
    const data = await res.json();

    const groupedByBulan = {};
    data.forEach(item => {
      if (!item.bulan_ke) return;
      if (!groupedByBulan[item.bulan_ke]) groupedByBulan[item.bulan_ke] = [];
      groupedByBulan[item.bulan_ke].push(item);
    });

    const bulanSelect = document.getElementById("bulanSelect");
    bulanSelect.innerHTML = '';
    const currentBulan = await getCurrentBulan();

    const bulanTersedia = Object.keys(groupedByBulan)
      .map(b => parseInt(b))
      .filter(b => b < currentBulan)
      .sort((a, b) => a - b);

    if (bulanTersedia.length === 0) {
      alert("Belum ada data bulan yang selesai untuk ditampilkan.");
      return;
    }

    bulanTersedia.forEach(bulan => {
      const opt = document.createElement("option");
      opt.value = bulan;
      opt.textContent = `Bulan ${bulan}`;
      bulanSelect.appendChild(opt);
    });

    bulanSelect.style.display = "inline";
    document.getElementById("historyBtn").style.display = "none";
    document.getElementById("mingguSelect").style.display = "none";
    document.getElementById("backBtn").style.display = "inline";
    document.getElementById("saranMinggu").innerHTML = "";

    const defaultBulan = bulanSelect.value;
    renderBulanHistoryChart(groupedByBulan[defaultBulan], defaultBulan);

    bulanSelect.addEventListener("change", () => {
      const selected = bulanSelect.value;
      renderBulanHistoryChart(groupedByBulan[selected], selected);
    });
  });

  document.getElementById("backBtn").addEventListener("click", () => {
    document.getElementById("historyBtn").style.display = "inline";
    document.getElementById("mingguSelect").style.display = "inline";
    document.getElementById("backBtn").style.display = "none";
    if (mingguKeys.length > 0) {
      mingguSelect.value = mingguKeys[0];
      updateView(mingguKeys[0]);
    }
    document.getElementById("bulanSelect").style.display = "none";
  });
});

function logout() {
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
 
 alertbox.render({
  alertIcon: 'success',
  title: 'Sampai jumpa!',
  message: 'Anda Telah logout',
  btnTitle: 'Ok',
  border:true
});

    const okBtn = document.querySelector(".alert-btn"); // tombol OK
    if (okBtn) {
      okBtn.addEventListener("click", () => {
        window.location.href = "../../login.html";
      });
    }
 
}


async function hapusNilai(matkul, mingguKe) {
  const userId = localStorage.getItem("userId");
  if (!confirm(`Yakin ingin menghapus nilai untuk ${matkul} di Minggu ${mingguKe}?`)) return;

  try {
    const res = await fetch(`https://scholaria-backend.onrender.com/hapus-nilai?userId=${userId}&matkul=${encodeURIComponent(matkul)}&minggu_ke=${mingguKe}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    alert(data.message || "Berhasil dihapus");
    location.reload(); // refresh halaman
  } catch (err) {
    console.error("Gagal menghapus nilai:", err);
    alert("Terjadi kesalahan saat menghapus nilai.");
  }
}

