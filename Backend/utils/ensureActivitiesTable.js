const DEFAULT_ACTIVITIES = [
  {
    slug: "visite",
    name: "Visite guidée",
    basePrice: "7000",
    category: "culture",
    icon: "fa-landmark",
    image: "assets/images/casbah.jpg",
    description: "Partez à la découverte de Bejaïa entre histoire et nature. Visitez les plus beaux spots de Béjaïa, de Gouraya à la cascade, en passant par la Casbah. Profitez d'un tour guidé avec un guide passionné, amoureux de la ville et connaisseur de tous ses recoins et de ses histoires.",
    hasChild: false,
    childPrice: 0,
    activityNote: [
      "Le prix inclut uniquement la visite guidée et non le transport.",
      "Prix dégressif à partir de la deuxième personne.",
    ],
    options: [],
    published: true,
    sortOrder: 2,
  },
  {
    slug: "quad",
    name: "Randonnée Quad",
    basePrice: "3000",
    category: "terre",
    icon: "fa-motorcycle",
    image: "assets/images/quad.jpeg",
    description: "Randonnée en quad (pas de course) sur les hauteurs de Boulimat, à la découverte de paysages à couper le souffle. À partir de 13h30, sans réservation : premier arrivé, premier sorti.",
    hasChild: true,
    childPrice: 1000,
    activityNote: [
      "Baskets et lunettes recommandées",
      "Casque quad fourni",
      "1 adulte par quad, conduite à partir de 16 ans",
      "Le guide se réserve le droit de vous reprendre le quad si vous ne respectez pas ces consignes, sans remboursement.",
    ],
    options: [
      { label: "30 min", price: 3000 },
      { label: "45 min (Réservation & paiement exigés)", price: 4000 },
    ],
    published: true,
    sortOrder: 3,
  },
  {
    slug: "parapente",
    name: "Parapente",
    basePrice: "6000",
    category: "terre",
    icon: "fa-parachute-box",
    image:
      "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTB-wtfDF7acuk59DcDOMvBq2Lisou1gxmJwrQo0efOYigw73dBKKa3QpMrqztfMfGzQS-e7yp22Q9COzOQrBfhjtVhPgCZ3BL2AKhgrw&s=10",
    description: "Envoyez-vous en l'air avec un baptême en parapente sur le plus beau spot de vol en Algérie, avec un atterrissage sur la plage.",
    hasChild: false,
    childPrice: 0,
    activityNote: [
      "Moniteur diplômé et reconnu.",
      "Les vols se déroulent en toute sécurité.",
      "Équipement de sécurité fourni.",
      "Les vols peuvent être annulés à la dernière minute si les conditions changent.",
      "Les vols peuvent être annulés si vous n'écoutez pas le moniteur.",
    ],
    options: [
      { label: "avec vidéo GoPro 4K", price: 6000 },
      { label: "avec vidéo GoPro 5,3K", price: 7000 },
      { label: "avec vidéo Insta 360", price: 8000 },
    ],
    published: true,
    sortOrder: 4,
  },
  {
    slug: "cheval",
    name: "Randonnée à cheval",
    basePrice: "2500",
    category: "terre",
    icon: "fa-horse",
    image:
      "https://lh3.googleusercontent.com/proxy/t-jDVqxSyaxJLVPlW9C7MrfPFxt-eP54t0mdW6Gap4LhZoWe1oAnRp8cLnoeS_5_-lo3NzBExrXuKcBjtri2upJGYaUH8UBw4ojBsh7rGlpEUlKL79CIAWuRQp0k9ZyYhrTzczszzBo9KACEqEWtYX2Vg5bUTILI8ETVnNPWUwHi_5-hIA",
    description: "Entre le bleu de la Méditerranée et le vert du parc national de Gouraya, laissez-vous contempler les beaux paysages de la Kabylie à cheval pour une randonnée inoubliable d'environ 30 min.",
    hasChild: false,
    childPrice: 0,
    activityNote: [
      "Les randonnées se font sur une colline et un chemin forestier surplombant la mer, et non sur une plage.",
      "Les randonnées se déroulent le matin ou en fin d'après-midi par respect pour la santé de l'animal.",
      "Pique-nique interdit au sein de la ferme.",
      "1 personne par cheval.",
    ],
    options: [],
    published: true,
    sortOrder: 5,
  },
  {
    slug: "Kayak",
    name: "Kayak",
    basePrice: "2000",
    category: "mer",
    icon: "fa-water",
    image:
      "https://www.muchbetteradventures.com/magazine/content/images/2020/01/28152819/GettyImages-1176774484.jpg",
    description: "Découvrez l'île de Nizla et ses paysages à couper le souffle en kayak avec un guide confirmé. Une aventure de 2h30 à 3h00 sur une eau turquoise, idéale pour explorer les plus beaux coins de la côte de Béjaïa.",
    hasChild: false,
    childPrice: 0,
    activityNote: [
      "🦺 Gilet de sauvetage fourni.",
      "📱 Pochette étanche fournie.",
      "🧑‍✈️ Guide confirmé inclus.",
      "🎉 Ambiance conviviale garantie.",
      "⏱️ Durée de l'activité : 2h30 à 3h00.",
    ],
    options: [],
    published: true,
    sortOrder: 6,
  },
  {
    slug: "bouee",
    name: "Bouée tractée",
    basePrice: "4000",
    category: "mer",
    icon: "fa-water",
    image: "https://typaradise.com/wp-content/uploads/2023/11/Typaradise-1024x511.jpg",
    description: "Pour un moment plein de souvenirs et de fous rires, offrez-vous une activité riche en sensations et en adrénaline en famille ou entre amis.",
    hasChild: false,
    childPrice: 0,
    activityNote: [
      "Réservation confirmée avec paiement à l'avance.",
      "Gilet fourni et obligatoire.",
    ],
    options: [],
    published: true,
    sortOrder: 7,
  },
  {
    slug: "jetski",
    name: "Jet Ski",
    basePrice: "12000",
    category: "mer",
    icon: "fa-jet-fighter",
    image: "assets/images/jetski.jpeg",
    description: "Yamaha VX 1100 ou circuit découverte Île & Grotte avec baignade.",
    hasChild: false,
    childPrice: 0,
    activityNote: [
      "Gilet de sauvetage fourni, briefing sécurité et encadrement moniteur inclus.",
      "Carburant inclus.",
      "Pièce d'identité obligatoire en garantie.",
      "Activité interdite à toute personne alcoolisée.",
    ],
    options: [
      { label: "Yamaha VX 1100 — 30 min", price: 12000 },
      { label: "Yamaha VX 1100 — 60 min", price: 20000 },
      { label: "Circuit Découverte", price: 25000 },
    ],
    published: true,
    sortOrder: 8,
  },
  {
    slug: "bateau",
    name: "Excursion Bateau",
    basePrice: "à partir de 15000",
    category: "mer",
    icon: "fa-ship",
    image: "assets/images/i.jpeg",
    description: "Circuit classique : île de Nizla, grotte de la patte d'éléphant, grotte des pirates, pointe Sainte-Anne, cap Carbon avec un arrêt de 15/20 min pour nager.",
    hasChild: false,
    childPrice: 0,
    activityNote: [
      "Alcool interdit sur le bateau",
      "Circuit classique : île de Nizla, grotte de la patte d'éléphant, grotte des pirates, pointe Sainte-Anne, cap Carbon avec un arrêt de 15/20 min pour nager.",
      "Offre découverte : 1h30/2h - Circuit classique",
      "Offre évasion : 3h/3h30 - Circuit classique + grottes de Gouraya + Tamelaht + snorkelling + brunch",
      "Offre détente : 4h30/5h - Circuit complet + bouée tractée",
    ],
    options: [],
    published: true,
    sortOrder: 1,
  },
];

async function ensureActivitiesTable(sequelize) {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS public.activities (
      slug VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      "basePrice" TEXT NOT NULL DEFAULT '0',
      category VARCHAR(64) NOT NULL DEFAULT 'mer',
      icon VARCHAR(128) NOT NULL DEFAULT 'fa-star',
      image TEXT NOT NULL DEFAULT 'assets/images/all.jpg',
      description TEXT NOT NULL DEFAULT '',
      "hasChild" BOOLEAN DEFAULT false,
      "childPrice" INTEGER DEFAULT 0,
      "activityNote" TEXT DEFAULT '[]',
      options TEXT DEFAULT '[]',
      published BOOLEAN DEFAULT false,
      "sortOrder" INTEGER DEFAULT 0,
      "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    )
  `);

  const [rows] = await sequelize.query(
    `SELECT COUNT(*)::int AS count FROM public.activities`
  );
  const count = rows?.[0]?.count || 0;

  if (count === 0) {
    const Activity = require("../models/Activity");
    await Activity.bulkCreate(DEFAULT_ACTIVITIES);
    console.log(`✅ ${DEFAULT_ACTIVITIES.length} activités seedées`);
  } else {
    await sequelize.query(
      `UPDATE public.activities SET "sortOrder" = 1, "updatedAt" = NOW() WHERE slug = 'bateau'`
    );
    console.log("✅ Table activities déjà peuplée (bateau en premier)");
  }

  console.log("✅ Table activities vérifiée");
}

module.exports = {
  ensureActivitiesTable,
  DEFAULT_ACTIVITIES,
};
