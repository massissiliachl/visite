// Données des activités (utilisées par les deux pages)
const activitiesCatalog = [
    { id: "visite", name: "Visite Guidée", basePrice: 6000, category: "culture", icon: "fa-landmark", desc: "Découvrez Béjaïa historique : Gouraya, Casbah, cascade.", hasChild: false },
    { id: "parapente", name: "Parapente", basePrice: 6000, category: "terre", icon: "fa-parachute-box", desc: "Baptême parapente, atterrissage plage, sensations uniques.", hasChild: false },
    { id: "quad", name: "Randonnée Quad", basePrice: 3000, category: "terre", icon: "fa-motorcycle", desc: "Circuit sur les hauteurs de Boulimat.", hasChild: true, childPrice: 1000, options: [{label:"30 min", price:3000},{label:"45 min", price:4000}] },
    { id: "cheval", name: "Randonnée à Cheval", basePrice: 2500, category: "terre", icon: "fa-horse", desc: "Entre mer et montagne dans le parc de Gouraya.", hasChild: false },
    { id: "parasailing", name: "Parasailing", basePrice: 10000, category: "mer", icon: "fa-parachute-box", desc: "Envolez-vous au-dessus de la mer.", hasChild: false },
    { id: "bouee", name: "Bouée Tractée", basePrice: 3000, category: "mer", icon: "fa-water", desc: "Adrénaline et fous rires garantis.", hasChild: false },
    { id: "jetski", name: "Jet Ski", basePrice: 30000, category: "mer", icon: "fa-jet-fighter", desc: "Sensations fortes en liberté (1h).", hasChild: false },
    { id: "bateau", name: "Excursion Bateau", basePrice: 20000, category: "mer", icon: "fa-ship", desc: "Découvrez île de Nizla, grotte des pirates.", hasChild: false }
];