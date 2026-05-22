import type { StoreMe } from '@/lib/schemas/store'

// Form state shape for the DRAFT setup wizard. All values are strings (not
// nullable) so RHF inputs can bind cleanly. Conversion from StoreMe (where
// optional scalar fields are nullable) happens via storeToFormValues below.

export interface WizardFormValues {
  companyName: string
  displayName: string
  description: string
  story: string
  websiteUrl: string
  logoUrl: string
  contactEmail: string
  contactPhone: string
  businessRegNo: string
  vatNumber: string
  bankName: string
  bankAccountNo: string
  bankBranchCode: string
  bankAccountType: string
}

export function storeToFormValues(store: StoreMe): WizardFormValues {
  return {
    companyName: store.companyName ?? '',
    displayName: store.displayName ?? '',
    description: store.description ?? '',
    story: store.story ?? '',
    websiteUrl: store.websiteUrl ?? '',
    logoUrl: store.logoUrl ?? '',
    contactEmail: store.contactEmail ?? '',
    contactPhone: store.contactPhone ?? '',
    businessRegNo: store.businessRegNo ?? '',
    vatNumber: store.vatNumber ?? '',
    bankName: store.bankName ?? '',
    bankAccountNo: store.bankAccountNo ?? '',
    bankBranchCode: store.bankBranchCode ?? '',
    bankAccountType: store.bankAccountType ?? '',
  }
}
