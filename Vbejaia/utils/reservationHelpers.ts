export const BOAT_PRICE_BY_MINUTES: Record<string, number> = {
  '30': 8000,
  '60': 16000,
  '90': 20000,
  '120': 20000,
  '150': 25000,
  '180': 35000,
  '210': 40000,
};

export type PaymentStatus = 'paye' | 'verse' | 'non_paye';

export function derivePaymentStatus(
  total: number,
  versement: number,
  reste?: number
): PaymentStatus {
  const t = parseFloat(String(total)) || 0;
  const v = parseFloat(String(versement)) || 0;
  const r = reste != null ? (parseFloat(String(reste)) || 0) : Math.max(0, t - v);
  if (t > 0 && (v >= t || r <= 0)) return 'paye';
  if (v > 0) return 'verse';
  return 'non_paye';
}

export function normalizeReservation(raw: Record<string, unknown> | null | undefined) {
  if (!raw) return raw;
  const total = parseFloat(String(raw.totalAPayer ?? raw.totalapayer ?? 0)) || 0;
  const versement = parseFloat(String(raw.versement ?? 0)) || 0;
  const reste =
    raw.resteAPayer != null || raw.resteapayer != null
      ? parseFloat(String(raw.resteAPayer ?? raw.resteapayer ?? 0)) || 0
      : Math.max(0, total - versement);
  const note = (raw.note && String(raw.note).trim()) || 'Aucune note';

  return {
    ...raw,
    totalAPayer: total,
    versement,
    resteAPayer: reste,
    note,
    paymentStatus: derivePaymentStatus(total, versement, reste),
  };
}

export function mergeSavedReservation(
  sent: Record<string, unknown>,
  saved: Record<string, unknown> | null | undefined
) {
  return normalizeReservation({ ...sent, ...(saved || {}) });
}

export function buildApiPayload(data: Record<string, unknown>) {
  const totalAPayer = parseFloat(String(data.totalAPayer ?? data.totalapayer ?? 0)) || 0;
  const versement = parseFloat(String(data.versement ?? 0)) || 0;
  const resteAPayer =
    data.resteAPayer != null || data.resteapayer != null
      ? parseFloat(String(data.resteAPayer ?? data.resteapayer ?? 0)) || 0
      : Math.max(0, totalAPayer - versement);

  return {
    nom: data.nom,
    prenom: data.prenom,
    tel: data.tel || null,
    activite: data.activite,
    heure: data.heure || null,
    date: data.date,
    personnes: parseInt(String(data.personnes ?? 1), 10) || 1,
    slot: data.slot || null,
    subslot: data.subslot || null,
    bateau: data.bateau || null,
    duree: data.duree || null,
    totalAPayer,
    versement,
    resteAPayer,
    note: (data.note && String(data.note).trim()) || 'Aucune note',
  };
}
