
// ✨ Github zápis
async function ulozZbytkyNaGitHub(noveData) {
  const token = "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"; // ← Vlož svůj GitHub personal access token sem
  const username = "KrMiro";
  const repo = "Zbytky";
  const path = "Zbytky/zbytky.json";

  // 1. Získání SHA poslední verze souboru
  const shaRes = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${path}`);
  const shaData = await shaRes.json();
  const sha = shaData.sha;

  // 2. Uložení aktualizovaných dat
  const res = await fetch(`https://api.github.com/repos/${username}/${repo}/contents/${path}`, {
    method: "PUT",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: "Aktualizace zbytků přes appku",
      content: btoa(unescape(encodeURIComponent(JSON.stringify(noveData, null, 2)))),
      sha: sha
    })
  });

  if (!res.ok) {
    const err = await res.json();
    console.error("❌ Chyba při ukládání na GitHub:", err);
  } else {
    console.log("✅ Data byla zapsána na GitHub.");
  }
}


// ↓↓↓ Zbytek původního kódu zůstává beze změn ↓↓↓

const form = document.getElementById("zbytek-form");
const seznam = document.getElementById("seznam-zbytku");

let aktualniFiltr = "vse";
let aktualniIndex = null;
let kreslenyIndex = null;
let pouzitIndex = null;



window.onload = async function () {
  const url = "https://raw.githubusercontent.com/krmiro/zbytky/main/Zbytky/zbytky.json";

  try {
    const res = await fetch(url);
    const data = await res.json();

    localStorage.setItem("zbytky", JSON.stringify(data));
    zobrazZbytky();
    zobrazPoctyNaMape?.();
  } catch (err) {
    console.error("❌ Nepodařilo se načíst data z GitHubu:", err);
    zobrazZbytky();
  }
};

form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const zbytek = {
    delka: document.getElementById("delka").value,
    sirka: document.getElementById("sirka").value,
    tloustka: document.getElementById("tloustka").value,
    material: document.getElementById("material").value,
    lokalita: document.getElementById("lokalita").value,
    poznamka: document.getElementById("poznamka").value,
    pouzite: false,
    pocet: parseInt(document.getElementById("pocet").value),
    datum: new Date().toISOString(),
    pouziteKusy: 0
  };

  let zbytky = JSON.parse(localStorage.getItem("zbytky")) || [];
  zbytky.push(zbytek);
  localStorage.setItem("zbytky", JSON.stringify(zbytky));

  await ulozZbytkyNaGitHub(zbytky);

  form.reset();
  zobrazZbytky();
});

function nastavFiltr(filtr) {
  aktualniFiltr = filtr;
  zobrazZbytky();
}

function zobrazZbytky() {
  seznam.innerHTML = "";
  const zbytky = JSON.parse(localStorage.getItem("zbytky")) || [];
  const vyhledavani = document.getElementById("vyhledavani")?.value.toLowerCase() || "";

  let pouziteZaznamy = 0;
  let nepouziteZaznamy = 0;

  zbytky.forEach((zbytek, index) => {
    const jePouzite = (zbytek.pouziteKusy || 0) >= zbytek.pocet;

    if (jePouzite) pouziteZaznamy++;
    else nepouziteZaznamy++;

    if ((aktualniFiltr === "pouzite" && !jePouzite) ||
        (aktualniFiltr === "nepouzite" && jePouzite)) return;

    const textHledani = `${zbytek.material} ${zbytek.lokalita} ${zbytek.poznamka} ${zbytek.delka} ${zbytek.sirka} ${zbytek.tloustka}`.toLowerCase();
    if (!textHledani.includes(vyhledavani)) return;

    const li = document.createElement("li");
    let text = `${zbytek.material} - ${zbytek.delka}×${zbytek.sirka} mm, ${zbytek.tloustka} mm`;
    text += ` | Počet: ${zbytek.pocet} (Použito: ${zbytek.pouziteKusy || 0} / Zbývá: ${zbytek.pocet - (zbytek.pouziteKusy || 0)})`;
    text += ` | Lokace: ${zbytek.lokalita}`;
    const hmotnost = vypocitejHmotnost(zbytek);
    text += ` | ⚖️ ${hmotnost} kg`;

    if (zbytek.poznamka) text += ` | Pozn.: ${zbytek.poznamka}`;
    if (jePouzite) li.classList.add("pouzite");

    const btnPouzit = document.createElement("button");
    btnPouzit.textContent = "➕ Použít kusy";
    btnPouzit.onclick = () => {
      pouzitIndex = index;
      document.getElementById("pouzit-kusy-pocet").value = "";
      document.getElementById("modal-pouzit-kusy").style.display = "block";
    };
    li.appendChild(btnPouzit);

    const btnPouzitJeden = document.createElement("button");
btnPouzitJeden.textContent = "✔️ Částečně použít 1";
btnPouzitJeden.onclick = () => {
  const zbytky = JSON.parse(localStorage.getItem("zbytky")) || [];
  const z = zbytky[index];
  const zbyva = z.pocet - (z.pouziteKusy || 0);

  if (zbyva <= 0) {
    alert("Všechny kusy už byly použity.");
    return;
  }

  z.pouziteKusy = (z.pouziteKusy || 0) + 1;
  localStorage.setItem("zbytky", JSON.stringify(zbytky));
  zobrazZbytky();
};
li.appendChild(btnPouzitJeden);


    const textNode = document.createElement("div");
    textNode.textContent = text;
    li.appendChild(textNode);

    

    const btnUpravit = document.createElement("button");
    btnUpravit.textContent = "✏️ Upravit";
    btnUpravit.onclick = () => zobrazEditForm(index);

    const btnNakres = document.createElement("button");
    btnNakres.textContent = "🖊️ Nákres";
    btnNakres.onclick = () => zobrazKresleni(index);

    const btnSmazat = document.createElement("button");
    btnSmazat.textContent = "🗑️ Smazat";
    btnSmazat.onclick = () => {
      if (confirm("Opravdu chceš smazat tento záznam?")) {
        zbytky.splice(index, 1);
        localStorage.setItem("zbytky", JSON.stringify(zbytky));
        zobrazZbytky();
      }
    };

    li.appendChild(btnUpravit);
    li.appendChild(btnNakres);
    li.appendChild(btnSmazat);

    if (zbytek.obrazek) {
      const zobraz = document.createElement("button");
      zobraz.textContent = "👁️ Náhled";
      zobraz.onclick = () => zobrazNahlad(zbytek.obrazek);
      li.appendChild(zobraz);
    }

    seznam.appendChild(li);
  });

  const pocitadlo = document.getElementById("pocitadlo-zbytku");
  const celkem = zbytky.length;
  const soucetKusu = zbytky.reduce((acc, z) => acc + (parseInt(z.pocet) || 1), 0);

  pocitadlo.textContent = `Celkem záznamů: ${celkem} (Použité: ${pouziteZaznamy} / Nepoužité: ${nepouziteZaznamy}) | Celkem kusů: ${soucetKusu}`;
}


function zobrazEditForm(index) {
  const zbytky = JSON.parse(localStorage.getItem("zbytky")) || [];
  const zbytek = zbytky[index];
  aktualniIndex = index;

  document.getElementById("edit-delka").value = zbytek.delka;
  document.getElementById("edit-sirka").value = zbytek.sirka;
  document.getElementById("edit-tloustka").value = zbytek.tloustka;
  document.getElementById("edit-material").value = zbytek.material;
  document.getElementById("edit-pocet").value = zbytek.pocet ?? 1;
  document.getElementById("edit-lokalita").value = zbytek.lokalita;
  document.getElementById("edit-poznamka").value = zbytek.poznamka;

  document.getElementById("edit-modal").style.display = "block";
}

function ulozUpravenyZbytek() {
  const zbytky = JSON.parse(localStorage.getItem("zbytky")) || [];

  zbytky[aktualniIndex] = {
    delka: document.getElementById("edit-delka").value,
    sirka: document.getElementById("edit-sirka").value,
    tloustka: document.getElementById("edit-tloustka").value,
    material: document.getElementById("edit-material").value,
    pocet: parseInt(document.getElementById("edit-pocet").value),
    lokalita: document.getElementById("edit-lokalita").value,
    poznamka: document.getElementById("edit-poznamka").value,
    pouzite: zbytky[aktualniIndex].pouzite,
    obrazek: zbytky[aktualniIndex].obrazek || null
  };

  localStorage.setItem("zbytky", JSON.stringify(zbytky));
  zrusEditaci();
  zobrazZbytky();
}

function zrusEditaci() {
  document.getElementById("edit-modal").style.display = "none";
  aktualniIndex = null;
}

function exportDoCSV() {
  const zbytky = JSON.parse(localStorage.getItem("zbytky")) || [];
  if (zbytky.length === 0) {
    alert("Nemáš žádná data k exportu.");
    return;
  }

  const data = zbytky.map(z => ({
    Delka: z.delka,
    Sirka: z.sirka,
    Tloustka: z.tloustka,
    Material: z.material,
    Lokalita: z.lokalita,
    Poznamka: z.poznamka || "",
    Pocet: z.pocet,
    Pouzito: z.pouziteKusy || 0,
    Zbyva: z.pocet - (z.pouziteKusy || 0)
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Zbytky");

  XLSX.writeFile(wb, "zbytky.xlsx");
}

  


function zobrazKresleni(index) {
  kreslenyIndex = index;
  document.getElementById("draw-modal").style.display = "block";
  clearCanvas();
}

function zavritNakres() {
  document.getElementById("draw-modal").style.display = "none";
  kreslenyIndex = null;
}

function ulozNakres() {
  const zbytky = JSON.parse(localStorage.getItem("zbytky")) || [];
  const canvas = document.getElementById("canvas");
  const obrazek = canvas.toDataURL("image/png");

  if (kreslenyIndex !== null) {
    zbytky[kreslenyIndex].obrazek = obrazek;
    localStorage.setItem("zbytky", JSON.stringify(zbytky));
    zavritNakres();
    zobrazZbytky();
  }
}

function zobrazNahlad(obrazekSrc) {
  const preview = document.getElementById("zbytek-preview");
  const img = document.getElementById("zbytek-img");
  img.src = obrazekSrc;
  preview.style.display = "block";
}

function zavritNahlad() {
  document.getElementById("zbytek-preview").style.display = "none";
}

// kreslení na canvas
const canvas = document.getElementById("canvas");
if (canvas) {
  const ctx = canvas.getContext("2d");
  let kresli = false;

  canvas.addEventListener("mousedown", () => kresli = true);
  canvas.addEventListener("mouseup", () => kresli = false);
  canvas.addEventListener("mouseout", () => kresli = false);
  canvas.addEventListener("mousemove", e => {
    if (!kresli) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(x, y, 2, 0, Math.PI * 2);
    ctx.fill();
  });

  function clearCanvas() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function zobrazSekci(sekce) {
  document.getElementById("evidence").style.display = sekce === "evidence" ? "block" : "none";
  document.getElementById("prehled").style.display = sekce === "prehled" ? "block" : "none";
  document.getElementById("mapa").style.display = sekce === "mapa" ? "block" : "none";
  if (sekce === "prehled") {
    vykresliPrehled();
  }
}

function vykresliPrehled() {
  const zbytky = JSON.parse(localStorage.getItem("zbytky")) || [];
  const panel = document.getElementById("panel-prehledu");

  let materialy = {};
  let plocha = 0;
  let soucetKusu = 0;
  let pouziteZaznamy = 0;
let castecnePouziteZaznamy = 0;
let nepouziteZaznamy = 0;

let hmotnostNepouzite = 0;
let cenaNepouzite = 0;

const hustoty = {
  "ALMG3 H111": 2660,
  "ALMG4.5": 2660,
  "DC01": 7850,
  "S355MC": 7850,
  "S235": 7850,
  "AISI": 8000,
  "ZINKOR": 7130,
  "ALMG3 H24": 2660,
  "ALMG3 H22": 2660
};

const ceny = {
  "ALMG3 H111": 120,
  "ALMG4.5": 120,
  "DC01": 25,
  "S355MC": 28,
  "S235": 22,
  "AISI": 60,
  "ZINKOR": 30,
  "ALMG3 H24": 120,
  "ALMG3 H22": 120
};


let celkovaHmotnost = 0;

zbytky.forEach(z => {
  const hmotnost = parseFloat(vypocitejHmotnost(z));
  if (!isNaN(hmotnost)) celkovaHmotnost += hmotnost;

  const pouzite = z.pouziteKusy || 0;
  const zb = z.pocet - pouzite;

  if (zb > 0) {
    const hustota = hustoty[z.material] || 0;
    const cenaKg = ceny[z.material] || 0;
    const objem = (z.delka * z.sirka * z.tloustka * zb) / 1_000_000_000;
    const hmotnost = objem * hustota;
    hmotnostNepouzite += hmotnost;
    cenaNepouzite += hmotnost * cenaKg;
  }

});


zbytky.forEach(z => {
  const pouzite = z.pouziteKusy || 0;
  const pocet = z.pocet || 0;

  if (pouzite >= pocet) pouziteZaznamy++;
  else if (pouzite > 0) castecnePouziteZaznamy++;
  else nepouziteZaznamy++;

    const mat = z.material || "Neznámý";
    materialy[mat] = (materialy[mat] || 0) + (parseInt(z.pocet) || 1);

    soucetKusu += parseInt(z.pocet) || 1;

    

    const kusy = parseInt(z.pocet) || 1;
const plochaZbytku = (parseFloat(z.delka) * parseFloat(z.sirka) * kusy) / 1_000_000;
plocha += plochaZbytku;

  });


  let html = `
    <p><strong>Celkem kusů:</strong> ${soucetKusu}</p>
    <p><strong>Celková plocha:</strong> ${plocha.toFixed(2)} m²</p>
    <p><strong>Celkem záznamů:</strong> ${zbytky.length}</p>
    <p><strong>Použité:</strong> ${pouziteZaznamy}</p>
  <p><strong>Částečně použité:</strong> ${castecnePouziteZaznamy}</p>
  <p><strong>Nepoužité:</strong> ${nepouziteZaznamy}</p>
  <p><strong>Celková hmotnost:</strong> ${celkovaHmotnost.toFixed(2)} kg</p>
  <p><strong>Hmotnost nepoužitých zbytků:</strong> ${hmotnostNepouzite.toFixed(2)} kg</p>
<p><strong>Odhadovaná cena nepoužitých zbytků:</strong> ${cenaNepouzite.toFixed(2)} Kč</p>




    <h4>Materiály:</h4>
    <ul>
      ${Object.entries(materialy).map(([mat, count]) => `<li>  ${mat} -- ${count} ks</li><br>`).join("")}
    </ul>
  `;
  panel.innerHTML = html;
}

function potvrditPouzitiKusu() {
  const pocet = parseInt(document.getElementById("pouzit-kusy-pocet").value);
  const zbytky = JSON.parse(localStorage.getItem("zbytky")) || [];

  if (pouzitIndex !== null && pocet > 0) {
    const z = zbytky[pouzitIndex];
    const zbyva = z.pocet - (z.pouziteKusy || 0);

    if (pocet > zbyva) {
      alert("Nelze použít více kusů než je k dispozici.");
      return;
    }

    z.pouziteKusy = (z.pouziteKusy || 0) + pocet;
    localStorage.setItem("zbytky", JSON.stringify(zbytky));
    zavritModalPouzit();
    zobrazZbytky();
  }
}

function zavritModalPouzit() {
  document.getElementById("modal-pouzit-kusy").style.display = "none";
  pouzitIndex = null;
}

async function exportDoPDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF();

  const zbytky = JSON.parse(localStorage.getItem("zbytky")) || [];

  if (zbytky.length === 0) {
    alert("Nemáš žádná data k exportu.");
    return;
  }

  doc.setFontSize(16);
  doc.text("Evidence zbytku plechu", 14, 20);
  doc.setFontSize(12);

  let y = 30;

  zbytky.forEach((z, i) => {
    const text = `${i + 1}) ${z.material} - ${z.delka}×${z.sirka}×${z.tloustka} mm | ${z.pocet} ks (Použito: ${z.pouziteKusy || 0}) | ${z.lokalita}${z.poznamka ? " | Pozn.: " + z.poznamka : ""}`;
    doc.text(text, 14, y);
    y += 10;
    if (y > 280) {
      doc.addPage();
      y = 20;
    }
  });

  doc.save("zbytky.pdf");
}

function vypocitejHmotnost(zbytek) {
  const hustoty = {
    "ALMG3 H111": 2660,
    "ALMG4.5": 2660,
    "DC01": 7850,
    "S355MC": 7850,
    "S235": 7850,
    "AISI": 8000,
    "ZINKOR": 7130,
    "ALMG3 H24": 2660,
    "ALMG3 H22": 2660,
    "S355" : 7850,
  };

  const hustota = hustoty[zbytek.material] || 0;
  const objem_m3 = (zbytek.delka * zbytek.sirka * zbytek.tloustka * zbytek.pocet) / 1e9;

  return (objem_m3 * hustota).toFixed(2); // v kg
}

function nastavFiltr(typ, hodnota) {
  if (typ === 'lokalita') {
    dokument.getElementById("vyhledavani").value = hodnota;
    aktualniFiltr = "vse";
    zobrazZbytky();
    zobrazSekci('evidence');
  }
}


function zobrazZbytkyZLokace(nazevLokace) {
  const vyhledavani = document.getElementById("vyhledavani");
  if (vyhledavani) {
    vyhledavani.value = nazevLokace;
    aktualniFiltr = "vse";
    zobrazSekci("evidence");
    zobrazZbytky();
  } else {
    console.error("Vyhledávací pole nebylo nalezeno.");
  }
}

function ziskejPoctyZbytkuPodleLokality() {
  const zbytky = JSON.parse(localStorage.getItem("zbytky")) || [];
  const pocty = {};

  zbytky.forEach(z => {
    if (!pocty[z.lokalita]) {
      pocty[z.lokalita] = 0;
    }
    pocty[z.lokalita] += 1;
  });

  return pocty;
}




