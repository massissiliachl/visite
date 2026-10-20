/**
 * Charge les activités publiées depuis l'API (fallback = catalogue local).
 * Expose: window.loadPublishedActivities(fallbackCatalog, apiBase)
 */
window.loadPublishedActivities = async function loadPublishedActivities(
  fallbackCatalog,
  apiBase
) {
  const fallback = prioritizeBateau(
    Array.isArray(fallbackCatalog) ? fallbackCatalog.slice() : []
  );
  if (!apiBase) return fallback;

  try {
    const res = await fetch(`${apiBase}/api/activities`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return fallback;
    const data = await res.json();
    if (!Array.isArray(data) || !data.length) return fallback;

    const list = data.map((a) => ({
      id: a.id || a.slug,
      name: a.name,
      basePrice: a.basePrice,
      category: a.category,
      icon: a.icon,
      image: a.image,
      desc: a.desc,
      hasChild: !!a.hasChild,
      childPrice: Number(a.childPrice) || 0,
      activityNote: Array.isArray(a.activityNote) ? a.activityNote : [],
      options: Array.isArray(a.options) ? a.options : [],
    }));
    return prioritizeBateau(list);
  } catch (err) {
    console.warn("[activities] API indisponible, fallback local", err);
    return prioritizeBateau(fallback);
  }
};

function prioritizeBateau(list) {
  if (!Array.isArray(list) || list.length < 2) return list;
  const isBateau = (a) => String(a.id || a.slug || "").toLowerCase() === "bateau";
  const boat = list.filter(isBateau);
  const rest = list.filter((a) => !isBateau(a));
  return boat.length ? [...boat, ...rest] : list;
}
