// Variables globales partagées
let currentAct = { id: '', name: '', pricePerAdult: 0, hasChild: false, childPrice: 0 };

// Fonction pour afficher les cartes (utilisée par les deux pages)
function renderCards(filter = "all") {
    const grid = document.getElementById("activitiesGrid");
    if (!grid) return;
    
    const filtered = filter === "all" ? activitiesCatalog : activitiesCatalog.filter(a => a.category === filter);
    
    grid.innerHTML = filtered.map((act, idx) => {
        let optsHtml = "";
        if (act.id === "quad") {
            optsHtml = `<div class="options-group" style="padding:0 1.5rem; margin:1rem 0; background:#f8fafc; border-radius:1rem; margin-left:1.8rem; margin-right:1.8rem;">
                <div class="option-item" style="display:flex; justify-content:space-between; padding:0.7rem 0; border-bottom:1px solid #e2e8f0;">
                    <label><input type="radio" name="quadOpt_${idx}" value="3000" checked> 🏍️ 30 minutes - 3000 DA</label>
                </div>
                <div class="option-item" style="display:flex; justify-content:space-between; padding:0.7rem 0;">
                    <label><input type="radio" name="quadOpt_${idx}" value="4000"> 🏍️ 45 minutes - 4000 DA</label>
                </div>
                <div class="child-extra" style="display:flex; align-items:center; gap:0.8rem; padding:0.7rem 0;">
                    <input type="checkbox" class="childQuadCheck" data-idx="${idx}"> <label>👶 Enfant derrière (+1000 DA)</label>
                </div>
            </div>`;
        }
        return `<div class="activity-card">
            <div class="card-header"><div class="icon-circle"><i class="fas ${act.icon}"></i></div><div class="price-badge">${act.id === "quad" ? "Dès 3000 DA" : act.basePrice.toLocaleString('fr-DZ') + " DA"}</div></div>
            <h3 class="card-title">${act.name}</h3>
            <p class="card-desc">${act.desc}</p>
            ${optsHtml}
            <button class="btn-book" data-id="${act.id}" data-name="${act.name}" data-price="${act.basePrice}" data-idx="${idx}"><i class="fas fa-calendar-check"></i> Réserver</button>
        </div>`;
    }).join('');

    document.querySelectorAll('.btn-book').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = btn.dataset.id;
            const name = btn.dataset.name;
            let price = parseInt(btn.dataset.price);
            let hasChild = false;
            let childPrice = 0;
            if (id === 'quad') {
                const idx = btn.dataset.idx;
                const card = btn.closest('.activity-card');
                const selected = card.querySelector(`input[name="quadOpt_${idx}"]:checked`);
                price = selected ? parseInt(selected.value) : 3000;
                const childCheck = card.querySelector('.childQuadCheck');
                hasChild = childCheck ? childCheck.checked : false;
                childPrice = 1000;
            }
            openModal(id, name, price, hasChild, childPrice);
        });
    });
}

function openModal(id, name, price, hasChild, childPrice) {
    currentAct = { id, name, pricePerAdult: price, hasChild, childPrice };
    document.getElementById("modalTitle").innerHTML = `📅 Réserver · ${name}`;
    const childGroup = document.getElementById("childGroup");
    if (hasChild) {
        childGroup.style.display = "block";
        document.getElementById("childExtraLabel").innerHTML = `(+${childPrice} DA/enfant)`;
    } else childGroup.style.display = "none";
    document.getElementById("adults").value = 1;
    document.getElementById("children").value = 0;
    document.getElementById("fullName").value = "";
    document.getElementById("fullName").classList.remove("error");
    document.getElementById("fullNameError").classList.remove("show");
    updateTotal();
    document.getElementById("modalOverlay").classList.add("active");
}

function updateTotal() {
    let adults = parseInt(document.getElementById("adults").value) || 1;
    let children = parseInt(document.getElementById("children").value) || 0;
    let total = currentAct.pricePerAdult * adults;
    if (currentAct.hasChild) total += children * currentAct.childPrice;
    const deposit = Math.round(total * 0.3);
    document.getElementById("totalPriceDisplay").innerHTML = total.toLocaleString('fr-DZ') + " DA";
    document.getElementById("depositAmount").innerHTML = deposit.toLocaleString('fr-DZ') + " DA";
}

function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = msg;
    toast.className = `toast-notification ${type}`;
    toast.classList.add("show");
    setTimeout(() => toast.classList.remove("show"), 4000);
}

function setLoading(show) {
    const loader = document.getElementById("loading");
    if (show) loader.classList.add("active");
    else loader.classList.remove("active");
}

function validateFullName(fullName) {
    const trimmed = fullName.trim();
    const parts = trimmed.split(/\s+/);
    return parts.length >= 2 && parts[0].length > 0 && parts[1].length > 0;
}

async function sendReservation(payload) {
    const API_URL = 'https://visitebougi.onrender.com/api/reservations';
    console.log("Envoi à l'API:", payload);
    
    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await response.json();
        console.log("Réponse API:", response.status, data);
        
        if (!response.ok) {
            throw new Error(data.message || data.error || `Erreur ${response.status}`);
        }
        
        return { success: true, data: data, apiResponse: true };
        
    } catch (error) {
        console.error("Erreur API:", error);
        const localReservations = JSON.parse(localStorage.getItem('bejaia_reservations') || '[]');
        const newReservation = {
            ...payload,
            id: Date.now(),
            created_at: new Date().toISOString(),
            saved_locally: true
        };
        localReservations.push(newReservation);
        localStorage.setItem('bejaia_reservations', JSON.stringify(localReservations));
        return { success: true, local: true, data: newReservation };
    }
}

function closeModal() {
    document.getElementById("modalOverlay").classList.remove("active");
}

// Initialiser les événements du formulaire (appeler sur chaque page)
function initFormEvents() {
    document.getElementById("fullName").addEventListener("input", function(e) {
        const isValid = validateFullName(e.target.value);
        const group = document.getElementById("fullNameGroup");
        const errorDiv = document.getElementById("fullNameError");
        
        if (!isValid && e.target.value.trim().length > 0) {
            group.classList.add("error");
            errorDiv.classList.add("show");
        } else {
            group.classList.remove("error");
            errorDiv.classList.remove("show");
        }
    });

    document.getElementById("reservationForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        
        const fullName = document.getElementById("fullName").value.trim();
        const email = document.getElementById("email").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const date = document.getElementById("date").value;
        const adults = parseInt(document.getElementById("adults").value);
        const children = parseInt(document.getElementById("children").value) || 0;
        const payment = document.getElementById("paymentMethod").value;
        const transRef = document.getElementById("transactionRef").value.trim();
        const special = document.getElementById("specialRequests").value;

        if (!validateFullName(fullName)) {
            showToast("⚠️ Veuillez entrer votre NOM et PRÉNOM complets", "warning");
            return;
        }

        if (!email || !phone || !date || !adults) {
            showToast("Veuillez remplir tous les champs obligatoires", "error");
            return;
        }

        let total = currentAct.pricePerAdult * adults;
        if (currentAct.hasChild) total += children * currentAct.childPrice;
        const deposit = Math.round(total * 0.3);
        
        const nameParts = fullName.split(/\s+/);
        const nom = nameParts[0];
        const prenom = nameParts.slice(1).join(" ");

        if (payment === "PayPal") {
            const message = `🏖️ *NOUVELLE RÉSERVATION PAYPAL - VISIT BEJAIA* 🏖️

👤 *Client:* ${nom} ${prenom}
📧 *Email:* ${email}
📱 *Téléphone:* ${phone}

🎯 *Activité:* ${currentAct.name}
📅 *Date souhaitée:* ${date}
👥 *Personnes:* ${adults + children} (${adults} adultes${children > 0 ? `, ${children} enfants` : ''})

💰 *Montant total:* ${total.toLocaleString('fr-DZ')} DA
💵 *Acompte 30%:* ${deposit.toLocaleString('fr-DZ')} DA

💳 *Mode de paiement:* PAYPAL

📝 *Demandes spéciales:* ${special || 'Aucune'}

⏰ *Réservation faite le:* ${new Date().toLocaleString('fr-FR')}

🔔 *Action:* Client va effectuer le paiement PayPal. Veuillez confirmer la réservation.`;

            const encodedMessage = encodeURIComponent(message);
            const whatsappNumber = "33619501708";
            window.location.href = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;
            closeModal();
            document.getElementById("reservationForm").reset();
            document.getElementById("adults").value = 1;
            document.getElementById("children").value = 0;
            updateTotal();
            return;
        }

        setLoading(true);

        const payload = {
            nom: nom,
            prenom: prenom,
            email: email,
            telephone: phone,
            date_depart: date,
            nb_personnes: adults + children,
            nom_item: currentAct.name,
            type_reservation: "activite",
            prix_total: total,
            acompte_30pct: deposit,
            mode_paiement: payment,
            transaction_ref: transRef || null,
            demandes_speciales: special || null,
            status: "en_attente",
            paiement_statut: transRef ? "attente_validation" : "non_saisi"
        };

        try {
            const result = await sendReservation(payload);
            setLoading(false);
            
            if (result.success) {
                const message = result.local ? 
                    "✅ Réservation sauvegardée localement" :
                    "✅ Réservation confirmée !";
                showToast(`${message} - Total: ${total.toLocaleString('fr-DZ')} DA`, "success");
                
                setTimeout(() => {
                    closeModal();
                    document.getElementById("reservationForm").reset();
                    document.getElementById("adults").value = 1;
                    document.getElementById("children").value = 0;
                    updateTotal();
                }, 2000);
            } else {
                showToast("❌ Erreur lors de la réservation", "error");
            }
        } catch (error) {
            console.error("Erreur:", error);
            setLoading(false);
            showToast("❌ Erreur: " + error.message, "error");
        }
    });

    document.getElementById("closeModalBtn").addEventListener("click", closeModal);
    document.getElementById("modalOverlay").addEventListener("click", (e) => { 
        if (e.target === document.getElementById("modalOverlay")) closeModal(); 
    });
    document.getElementById("adults").addEventListener("input", updateTotal);
    document.getElementById("children").addEventListener("input", updateTotal);
    document.getElementById("date").min = new Date().toISOString().split('T')[0];
}