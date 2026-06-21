// Modifier la fonction normalizeReservation pour mieux gérer les données
function normalizeReservation(raw) {
  if (!raw) return raw;
  
  console.log("🔍 Normalisation de la réservation:", raw.id);
  
  // Récupérer les valeurs avec des valeurs par défaut
  const total = raw.totalAPayer !== undefined && raw.totalAPayer !== null 
      ? parseFloat(raw.totalAPayer) 
      : 0;
      
  const versement = raw.versement !== undefined && raw.versement !== null 
      ? parseFloat(raw.versement) 
      : 0;
      
  const reste = raw.resteAPayer !== undefined && raw.resteAPayer !== null 
      ? parseFloat(raw.resteAPayer) 
      : Math.max(0, total - versement);
  
  const note = raw.note && String(raw.note).trim() 
      ? raw.note.trim() 
      : "Aucune note";
  
  // Créer un objet normalisé avec toutes les valeurs
  const normalized = {
      ...raw,
      totalAPayer: total,
      versement: versement,
      resteAPayer: reste,
      note: note,
      // S'assurer que les valeurs sont des nombres pour l'affichage
      totalAPayerDisplay: `${total} DA`,
      versementDisplay: `${versement} DA`,
      resteAPayerDisplay: `${reste} DA`
  };
  
  console.log("✅ Réservation normalisée:", {
      id: normalized.id,
      nom: normalized.nom,
      totalAPayer: normalized.totalAPayer,
      versement: normalized.versement,
      resteAPayer: normalized.resteAPayer,
      note: normalized.note
  });
  
  return normalized;
}

// Modifier la fonction loadReservations pour mieux gérer les erreurs
async function loadReservations() {
  try {
      console.log("🔄 Chargement des réservations...");
      let res = await fetch(API_BASE_URL);
      if(res.ok) {
          const data = await res.json();
          console.log(`✅ ${data.length} réservations reçues du serveur`);
          allReservationsData = data.map(normalizeReservation);
      } else {
          console.warn("⚠️ Erreur serveur, chargement local");
          allReservationsData = (JSON.parse(localStorage.getItem("reservationsData")) || []).map(normalizeReservation);
      }
  } catch(e) {
      console.warn("⚠️ Erreur réseau, chargement local:", e);
      allReservationsData = (JSON.parse(localStorage.getItem("reservationsData")) || []).map(normalizeReservation);
  }
  
  console.log(`📊 ${allReservationsData.length} réservations chargées au total`);
  reservationsData = [...allReservationsData];
  renderReservationsTable();
  renderBoatTable();
  buildCalendar();
}