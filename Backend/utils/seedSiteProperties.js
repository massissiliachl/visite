const SITE_PROPERTIES = [
  {
    id: "1",
    title: "Chalet au coeur de la ferme",
    location: "Tazeboucht, Bejaia",
    description: "Chalet authentique au coeur d'une ferme sur les hauteurs de Tazeboucht",
    longDescription:
      "Chalet authentique au coeur d'une ferme sur les hauteurs de Tazeboucht. 1 chambre en lit double, 1 chambre avec 2 lits, 1 clic clac, toilette et salle de bain, kitchenette, frigo, ventilateur, terrasse avec table de pique nique, vue dégagée sans vis à vis.",
    price: null,
    priceHaute: null,
    priceBasse: null,
    isDevis: true,
    type: "chalet",
    capacity: 5,
    rating: 4.9,
    popular: true,
    ambiance: ["Nature", "Calme", "Authentique"],
    features: [
      { icon: "fa-bed", text: "2 chambres" },
      { icon: "fa-users", text: "5 pers" },
      { icon: "fa-sun", text: "Terrasse aménagée" },
    ],
    images: [
      "assets/images/chalet/c5.jpeg",
      "assets/images/chalet/chal1.jpeg",
      "assets/images/chalet/chal2.jpeg",
      "assets/images/chalet/chal3.jpeg",
      "assets/images/chalet/chal4.jpeg",
      "assets/images/chalet/chal5.jpeg",
    ],
  },
  {
    id: "2",
    title: "Chalet prestige",
    location: "Tazeboucht, Bejaia",
    description: "Chalet avec vue panoramique sur les hauteurs",
    longDescription:
      "Chalet authentique au coeur d'une ferme sur les hauteurs de Tazeboucht avec vue panoramique exceptionnelle.",
    price: null,
    isDevis: true,
    type: "chalet",
    capacity: 7,
    rating: 4.7,
    popular: false,
    ambiance: ["Nature", "Vue", "Authentique"],
    features: [
      { icon: "fa-bed", text: "3 chambres" },
      { icon: "fa-tree", text: "Jardin" },
    ],
    images: [
      "assets/images/chalet/chalet2.jpeg",
      "assets/images/chalet/chal6.jpeg",
      "assets/images/chalet/chal7.jpeg",
      "assets/images/chalet/chal8.jpeg",
      "assets/images/chalet/chal9.jpeg",
    ],
  },
  {
    id: "3",
    title: "Chalet prestige",
    location: "Tazeboucht, Bejaia",
    description: "Chalet prestige avec prestations haut de gamme",
    longDescription:
      "Chalet authentique au coeur d'une ferme sur les hauteurs de Tazeboucht. Prestige et confort absolu.",
    price: null,
    isDevis: true,
    capacity: 10,
    rating: 5.0,
    popular: true,
    type: "chalet",
    ambiance: ["Nature", "Calme", "Authentique", "Luxe"],
    features: [
      { icon: "fa-eye", text: "Belle Vue" },
      { icon: "fa-bed", text: "4 chambres" },
      { icon: "fa-hot-tub", text: "Jacuzzi" },
    ],
    images: [
      "assets/images/chalet/chalet3.jpeg",
      "assets/images/chalet/z1.jpeg",
      "assets/images/chalet/z2.jpeg",
      "assets/images/chalet/z3.jpeg",
      "assets/images/chalet/z4.jpeg",
      "assets/images/chalet/z5.jpeg",
      "assets/images/chalet/z6.jpeg",
    ],
  },
  {
    id: "5",
    title: "Appartemnt f3 , ach lbaz",
    location: "ach lbaz, Béjaïa",
    description: "Magnifique appartement avec vue panoramique sur la mer,tout équipé",
    longDescription:
      "Magnifique logement tout équipé avec climatisation et une superbe vue sur mer. Idéal pour des vacances en famille ou entre amis dans un cadre calme et agréable. Situé à seulement 10 minutes en voiture des magnifiques plages de Saket et Boulimat, parfait pour profiter pleinement de la mer et du soleil.",
    priceHaute: 17000,
    priceBasse: 14000,
    price: 17000,
    isDevis: true,
    type: "appartement",
    capacity: 6,
    rating: 4.8,
    popular: true,
    ambiance: ["Mer", "Vue", "Moderne"],
    features: [
      { icon: "fa-bed", text: "3 chambres" },
      { icon: "fa-users", text: "6 pers" },
      { icon: "fa-wind", text: "Clim" },
    ],
    images: [
      "assets/images/appa/im1.jpeg",
      "assets/images/appa/im2.jpeg",
      "assets/images/appa/im3.jpeg",
      "assets/images/appa/im4.jpeg",
      "assets/images/appa/im5.jpeg",
      "assets/images/appa/im6.jpeg",
      "assets/images/appa/im7.jpeg",
    ],
  },
  {
    id: "6",
    title: "Appartemnt f2 , Sidi Ali Lbher ",
    location: "Sidi Ali Lbher , Béjaïa",
    description: "Magnifique appartement pas loin de l'aéroport ,tout équipé",
    longDescription:
      "Magnifique logement tout équipé avec climatisation et une superbe vue sur mer. Idéal pour des vacances en famille ou entre amis dans un cadre calme et agréable.",
    priceHaute: 13000,
    priceBasse: 13000,
    price: 13000,
    isDevis: true,
    type: "appartement",
    capacity: 6,
    rating: 4.8,
    popular: true,
    ambiance: ["Mer", "Vue", "Moderne"],
    features: [
      { icon: "fa-bed", text: "1 chambres +Salon" },
      { icon: "fa-wind", text: "Clim" },
    ],
    images: [
      "assets/images/appa/s3.jpeg",
      "assets/images/appa/s1.jpeg",
      "assets/images/appa/s4.jpeg",
      "assets/images/appa/s6.jpeg",
      "assets/images/appa/s5.jpeg",
      "assets/images/appa/s7.jpeg",
      "assets/images/appa/s2.jpeg",
    ],
  },
  {
    id: "4",
    title: "Appartemnt f2 ,  Résidence Emeraude ",
    location: "quartier Sghir , Béjaïa",
    description: "Bel appartement moderne et tout équipé",
    longDescription:
      "Magnifique logement tout équipé avec climatisation et une superbe vue, situé dans la résidence Émeraude à Bejaïa. Idéal pour des vacances en famille ou entre amis dans un cadre calme et agréable.",
    priceHaute: 17000,
    priceBasse: 15000,
    price: 17000,
    isDevis: true,
    type: "appartement",
    capacity: 6,
    rating: 4.8,
    popular: true,
    ambiance: ["Mer", "Vue", "Moderne"],
    features: [
      { icon: "fa-bed", text: "1 chambres +Salon" },
      { icon: "fa-wind", text: "Clim" },
    ],
    images: [
      "assets/images/appa/r1.jpeg",
      "assets/images/appa/r2.jpeg",
      "assets/images/appa/r3.jpeg",
      "assets/images/appa/r4.jpeg",
      "assets/images/appa/r5.jpeg",
    ],
  },
  {
    id: "7",
    title: "Appartemnt f2 ,  Cote ",
    location: " Béjaïa",
    description: "Bel appartement moderne et tout équipé",
    longDescription:
      "Magnifique logement tout équipé avec climatisation et une superbe vue. Idéal pour des vacances en famille ou entre amis dans un cadre calme et agréable.",
    priceHaute: 17000,
    priceBasse: 13000,
    price: 17000,
    isDevis: true,
    type: "appartement",
    capacity: 6,
    rating: 4.8,
    popular: true,
    ambiance: ["Mer", "Vue", "Moderne"],
    features: [
      { icon: "fa-bed", text: "1 chambres +Salon" },
      { icon: "fa-wind", text: "Clim" },
    ],
    images: [
      "assets/images/appa/c1.jpeg",
      "assets/images/appa/c2.jpeg",
      "assets/images/appa/c3.jpeg",
      "assets/images/appa/4.jpeg",
      "assets/images/appa/c5.jpeg",
      "assets/images/appa/c6.jpeg",
      "assets/images/appa/c7.jpeg",
    ],
  },
  {
    id: "8",
    title: "Villa Duplex - La Cabane Des Embruns",
    location: "Tazeboujt Plage, Béjaïa",
    description: "Villa duplex à 200m de la plage, calme et familiale",
    longDescription:
      "Magnifique villa duplex en RDC + 1 située à seulement 200 mètres de la plage de Tazeboujt sur la route de Boulimat, côte ouest de Béjaïa. Un cadre paisible et familial où la nature vous offre ses plus beaux atouts. La villa dispose de tout le confort nécessaire pour des vacances réussies : place de stationnement, 3 chambres, 2 salles de bain avec sanitaires, et peut accueillir jusqu'à 7 personnes.",
    priceHaute: 40000,
    priceBasse: 13000,
    price: 40000,
    isDevis: true,
    type: "villa",
    capacity: 7,
    rating: 4.8,
    popular: true,
    ambiance: ["Mer", "Plage", "Familial", "Calme"],
    features: [
      { icon: "fa-bed", text: "3 chambres" },
      { icon: "fa-bath", text: "2 salles de bain" },
      { icon: "fa-wind", text: "Climatisation" },
      { icon: "fa-utensils", text: "Cuisine équipée" },
      { icon: "fa-tv", text: "TV dans chaque chambre" },
      { icon: "fa-washing-machine", text: "Machine à laver" },
      { icon: "fa-parking", text: "Parking" },
    ],
    images: [
      "assets/images/appa/ca1.jpeg",
      "assets/images/appa/ca2.jpeg",
      "assets/images/appa/ca3.jpeg",
      "assets/images/appa/ca4.jpeg",
      "assets/images/appa/ca5.jpeg",
      "assets/images/appa/ca6.jpeg",
      "assets/images/appa/ca7.jpeg",
    ],
  },
  {
    id: "9",
    title: "Villa authentique - Pied dans l'eau",
    location: "Tazeboujt, Saket, Béjaïa",
    description:
      "Villa authentique en bord de mer avec piscine, vue panoramique sur le Cap Carbon, idéale pour les familles et les groupes jusqu'à 12 personnes.",
    longDescription:
      "Découvrez cette magnifique villa authentique située à Tazeboujt (Saket), en bord de mer et offrant une vue exceptionnelle sur le Cap Carbon. La villa peut accueillir jusqu'à 12 personnes et dispose de 5 pièces à vivre, d'une piscine privée de 4 × 7 m, de 2 salles de bain, d'une climatisation au rez-de-chaussée ainsi que d'un parking privé.",
    priceHaute: 40000,
    priceBasse: 25000,
    price: 40000,
    isDevis: true,
    type: "villa",
    capacity: 12,
    rating: 4.8,
    popular: true,
    ambiance: [
      "Pied dans l'eau",
      "Vue sur le Cap Carbon",
      "Familial",
      "Calme",
      "Piscine privée",
    ],
    features: [
      { icon: "fa-bed", text: "5 pièces à vivre" },
      { icon: "fa-users", text: "Jusqu'à 12 personnes" },
      { icon: "fa-water-ladder", text: "Piscine privée 4 × 7 m" },
      { icon: "fa-snowflake", text: "Climatisation au rez-de-chaussée" },
      { icon: "fa-car", text: "Parking privé" },
      { icon: "fa-water", text: "Pied dans l'eau" },
      { icon: "fa-mountain-sun", text: "Vue sur le Cap Carbon" },
    ],
    images: [
      "assets/images/heber/vil1.jpeg",
      "assets/images/heber/vil2.jpeg",
      "assets/images/heber/vil3.jpeg",
      "assets/images/heber/vil4.jpeg",
      "assets/images/heber/vil5.jpeg",
      "assets/images/heber/vil6.jpeg",
      "assets/images/heber/vil7.jpeg",
    ],
  },
  {
    id: "10",
    title: "Appartement F3",
    location: "Béjaïa",
    description: "Bel appartement moderne, confortable et entièrement équipé.",
    longDescription:
      "Magnifique appartement F3 entièrement équipé avec climatisation et une superbe vue. Idéal pour des vacances en famille ou entre amis, dans un cadre calme, agréable et proche des commodités.",
    priceHaute: 20000,
    priceBasse: 20000,
    price: 20000,
    isDevis: true,
    type: "appartement",
    capacity: 6,
    rating: 4.8,
    popular: true,
    ambiance: ["Mer", "Vue", "Moderne"],
    features: [
      { icon: "fa-bed", text: "1 chambre + salon" },
      { icon: "fa-users", text: "Jusqu'à 6 personnes" },
      { icon: "fa-wind", text: "Climatisation" },
    ],
    images: [
      "assets/images/appa/c1.jpeg",
      "assets/images/appa/c2.jpeg",
      "assets/images/appa/c3.jpeg",
      "assets/images/appa/c5.jpeg",
      "assets/images/appa/c6.jpeg",
      "assets/images/appa/c7.jpeg",
    ],
  },
  {
    id: "11",
    title: "Appartemnt f2 ,  saket piedsdans leau ",
    location: " Béjaïa",
    description: "Bel appartement moderne et tout équipé",
    longDescription:
      "Magnifique logement tout équipé avec climatisation et une superbe vue. Idéal pour des vacances en famille ou entre amis dans un cadre calme et agréable.",
    priceHaute: 17000,
    priceBasse: 15000,
    price: 17000,
    isDevis: true,
    type: "appartement",
    capacity: 6,
    rating: 4.8,
    popular: true,
    ambiance: ["Mer", "Vue", "Moderne"],
    features: [
      { icon: "fa-bed", text: "1 chambres +Salon" },
      { icon: "fa-wind", text: "Clim" },
    ],
    images: [
      "assets/images/appa/c1.jpeg",
      "assets/images/appa/c2.jpeg",
      "assets/images/appa/c3.jpeg",
      "assets/images/appa/4.jpeg",
      "assets/images/appa/c5.jpeg",
      "assets/images/appa/c6.jpeg",
      "assets/images/appa/c7.jpeg",
    ],
  },
];

function normalizeForDb(p) {
  const price =
    typeof p.price === "number"
      ? p.price
      : typeof p.priceHaute === "number"
        ? p.priceHaute
        : 0;

  return {
    id: String(p.id),
    title: p.title,
    location: p.location,
    description: p.description || "",
    longDescription: p.longDescription || p.description || "",
    price: price || 0,
    priceHaute: typeof p.priceHaute === "number" ? p.priceHaute : null,
    priceBasse: typeof p.priceBasse === "number" ? p.priceBasse : null,
    isDevis: p.isDevis !== false,
    type: p.type || "appartement",
    capacity: p.capacity || null,
    rating: p.rating || 0,
    popular: !!p.popular,
    ambiance: p.ambiance || [],
    features: p.features || [],
    images: p.images || [],
    approvalStatus: "approved",
  };
}

/**
 * Importe les appartements / villas / chalets du site dans la table properties.
 * - Crée les manquants (mêmes ids que hebergement.html)
 * - Met à jour titre/type/images des existants SANS écraser ownerId
 */
async function seedSiteProperties() {
  const Property = require("../models/Property");
  let created = 0;
  let updated = 0;

  for (const raw of SITE_PROPERTIES) {
    const data = normalizeForDb(raw);
    const existing = await Property.findByPk(data.id);

    if (!existing) {
      await Property.create(data);
      created += 1;
      continue;
    }

    await existing.update({
      title: data.title,
      location: data.location,
      description: data.description,
      longDescription: data.longDescription,
      price: data.price,
      priceHaute: data.priceHaute,
      priceBasse: data.priceBasse,
      isDevis: data.isDevis,
      type: data.type,
      capacity: data.capacity,
      rating: data.rating,
      popular: data.popular,
      ambiance: data.ambiance,
      features: data.features,
      images: data.images,
      // Ne pas écraser ownerId ; forcer approved pour les biens du catalogue site
      approvalStatus: existing.approvalStatus || "approved",
    });
    // Si pas encore de statut, s'assurer qu'il est approved
    if (!existing.approvalStatus) {
      await existing.update({ approvalStatus: "approved" });
    }
    updated += 1;
  }

  console.log(
    `✅ Biens du site synchronisés (${created} créés, ${updated} mis à jour)`
  );
  return { created, updated, total: SITE_PROPERTIES.length };
}

module.exports = {
  SITE_PROPERTIES,
  seedSiteProperties,
  normalizeForDb,
};
