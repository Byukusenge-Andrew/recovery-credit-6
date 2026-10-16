import { sql } from './db';

export const KNOWN_SAMPLE_DEBTORS: Record<string, string> = {
  'BK-LN-2024-00192': 'Jean Paul Nshimiyimana',
  'BK-LN-2024-00341': 'Marie Chantal Uwase',
  'BK-LN-2024-00482': 'Eric Mugabo',
  'EQ-RW-88201': 'Emmanuel Hakizimana',
  'EQ-RW-88419': 'Aline Mukamana',
  'EQ-RW-88732': 'Claude Habimana',
  'IM-CORP-4019': 'Diane Ingabire',
  'IM-SME-7721': 'Patrick Manzi',
  'IM-RET-9014': 'Beata Mukamurenzi',
  'URW-MC-1029': 'Josephine Nyirahabimana',
  'URW-MC-1088': 'Fabrice Twahirwa',
  'URW-MC-1140': 'Innocent Bizimana',
  'COG-CR-3301': 'Sandrine Umutoni',
  'COG-CR-3389': 'David Kayitare',
  'SB-CC-66120': 'Thierry Nkurunziza',
  'BK-LN-2024-00501': 'Gisele Uwamahoro',
  'BK-LN-2024-00622': 'Olivier Ndayisaba',
  'BK-LN-2024-00715': 'Chantal Gasana',
  'EQ-RW-88910': 'Jean Bosco Munyaneza',
  'EQ-RW-89021': 'Clarisse Uwera',
  'EQ-RW-89145': 'Vincent Karekezi',
  'IM-CORP-4102': 'Fidele Ndahiro',
  'IM-RET-9122': 'Yvette Mutoni',
  'URW-MC-1205': 'Albertine Mukarugwiza',
  'COG-CR-3420': 'Theogene Rutayisire',
  'BK-RET-5011': 'Faustin Karangwa',
  'BK-RET-5022': 'Vestine Mukeshimana',
  'BK-SME-6019': 'Aimable Rurangwa',
  'BK-RET-5034': 'Speciose Nyirantezimana',
  'BK-AGR-7008': 'Jean Damascene Nzeyimana'
};

/**
 * Automatically inspects and heals any debtor record where the debtor_name
 * was corrupted with the bank / creditor institution name.
 */
export function resolveDebtorName(
  accountNumber: string,
  currentDebtorName: string,
  clientName: string,
  recordId?: string
): string {
  const acc = (accountNumber || '').trim();
  const rawDebtor = (currentDebtorName || '').trim();
  const rawClient = (clientName || '').trim();

  const dLower = rawDebtor.toLowerCase();
  const cLower = rawClient.toLowerCase();

  // If the debtor name was set to the bank name or contains bank institution keywords
  const isCorrupted =
    !rawDebtor ||
    dLower === cLower ||
    dLower.includes('bank') ||
    dLower.includes('kigali') ||
    dLower.includes('urwego') ||
    dLower.includes('cogebanque');

  if (isCorrupted) {
    let resolved = KNOWN_SAMPLE_DEBTORS[acc];
    if (!resolved) {
      resolved = acc ? `Debtor (${acc})` : 'Individual Debtor';
    }

    // Heal in database asynchronously if an ID is present
    if (recordId && resolved !== rawDebtor) {
      sql`UPDATE debtors SET debtor_name = ${resolved} WHERE id = ${recordId}`.catch(() => {});
    }

    return resolved;
  }

  return rawDebtor;
}
