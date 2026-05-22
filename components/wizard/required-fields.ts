// 11-field completion tracking for the DRAFT setup wizard.
//
// The submit endpoint (POST /stores/:id/submit) validates 9 fields server-side
// because companyName + displayName are required at POST /stores. The wizard
// surfaces all 11 because the merchant can edit the first two in the wizard
// and they remain required for the submission state to make sense.
//
// Section completion drives the side-nav indicator (e.g. "Brand identity 3/4").
// All-complete drives the "Submit for review" button's enabled state.

export const REQUIRED_FIELDS_BY_SECTION = {
  brandIdentity: ['companyName', 'displayName', 'description', 'logoUrl'],
  contact: ['contactEmail', 'contactPhone'],
  business: ['businessRegNo'],
  payout: ['bankName', 'bankAccountNo', 'bankBranchCode', 'bankAccountType'],
} as const

export type SectionId = keyof typeof REQUIRED_FIELDS_BY_SECTION

export const SECTION_ORDER: SectionId[] = ['brandIdentity', 'contact', 'business', 'payout']

export const SECTION_LABELS: Record<SectionId, string> = {
  brandIdentity: 'Brand identity',
  contact: 'Contact',
  business: 'Business registration',
  payout: 'Payout',
}

export type RequiredFieldName =
  | (typeof REQUIRED_FIELDS_BY_SECTION)['brandIdentity'][number]
  | (typeof REQUIRED_FIELDS_BY_SECTION)['contact'][number]
  | (typeof REQUIRED_FIELDS_BY_SECTION)['business'][number]
  | (typeof REQUIRED_FIELDS_BY_SECTION)['payout'][number]

export const ALL_REQUIRED_FIELDS: readonly RequiredFieldName[] = [
  ...REQUIRED_FIELDS_BY_SECTION.brandIdentity,
  ...REQUIRED_FIELDS_BY_SECTION.contact,
  ...REQUIRED_FIELDS_BY_SECTION.business,
  ...REQUIRED_FIELDS_BY_SECTION.payout,
]

export function isFieldComplete(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function getSectionCompletion(
  sectionId: SectionId,
  values: Partial<Record<RequiredFieldName, string | null | undefined>>,
): { completed: number; total: number } {
  const fields = REQUIRED_FIELDS_BY_SECTION[sectionId]
  let completed = 0
  for (const field of fields) {
    if (isFieldComplete(values[field as RequiredFieldName])) completed++
  }
  return { completed, total: fields.length }
}

export function getTotalCompletion(
  values: Partial<Record<RequiredFieldName, string | null | undefined>>,
): { completed: number; total: number } {
  let completed = 0
  for (const field of ALL_REQUIRED_FIELDS) {
    if (isFieldComplete(values[field])) completed++
  }
  return { completed, total: ALL_REQUIRED_FIELDS.length }
}

export function isAllComplete(
  values: Partial<Record<RequiredFieldName, string | null | undefined>>,
): boolean {
  return ALL_REQUIRED_FIELDS.every((f) => isFieldComplete(values[f]))
}
