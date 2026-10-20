// Données fallback (si API indisponible) — le site charge /api/activities en priorité
const activitiesCatalog = [
    { id: "bateau", name: "Excursion Bateau", basePrice: "à partir de 15000", category: "mer", icon: "fa-ship", image: "assets/images/i.jpeg", desc: "Découvrez île de Nizla, grotte des pirates.", hasChild: false },
    { id: "visite", name: "Visite Guidée", basePrice: 7000, category: "culture", icon: "fa-landmark", image: "assets/images/casbah.jpg", desc: "Découvrez Béjaïa historique : Gouraya, Casbah, cascade.", hasChild: false },
    { id: "parapente", name: "Parapente", basePrice: 6000, category: "terre", icon: "fa-parachute-box", image: "assets/images/all.jpg", desc: "Baptême parapente, atterrissage plage, sensations uniques.", hasChild: false },
    { id: "quad", name: "Randonnée Quad", basePrice: 3000, category: "terre", icon: "fa-motorcycle", image: "assets/images/quad.jpeg", desc: "Circuit sur les hauteurs de Boulimat.", hasChild: true, childPrice: 1000, options: [{label:"30 min", price:3000},{label:"45 min", price:4000}] },
    { id: "cheval", name: "Randonnée à Cheval", basePrice: 2500, category: "terre", icon: "fa-horse", image: "assets/images/all.jpg", desc: "Entre mer et montagne dans le parc de Gouraya.", hasChild: false },
    { id: "bouee", name: "Bouée Tractée", basePrice: 4000, category: "mer", icon: "fa-water", image: "assets/images/all.jpg", desc: "Adrénaline et fous rires garantis.", hasChild: false },
    { id: "jetski", name: "Jet Ski", basePrice: 12000, category: "mer", icon: "fa-jet-fighter", image: "assets/images/jetski.jpeg", desc: "Yamaha VX 1100 ou circuit découverte.", hasChild: false }
];
