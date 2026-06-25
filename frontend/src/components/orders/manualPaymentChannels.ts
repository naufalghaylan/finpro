import { Landmark, type LucideIcon } from 'lucide-react'

export type ManualPaymentChannel = {
  code: string
  label: string
  destinationLabel: string
  destinationValue: string
  destinationDisplayValue?: string
  accountHolder: string
  proofHint: string
  Icon: LucideIcon
}

export const MANUAL_PAYMENT_CHANNELS: ManualPaymentChannel[] = [
  {
    code: 'bank-bca',
    label: 'BCA',
    destinationLabel: 'No. Rekening',
    destinationValue: '3930101234',
    destinationDisplayValue: '39301 01234',
    accountHolder: 'PT PanenMart Bersama',
    proofHint: 'Unggah screenshot mobile banking, internet banking, atau struk ATM.',
    Icon: Landmark,
  },
  {
    code: 'bank-bri',
    label: 'BRI',
    destinationLabel: 'No. Rekening',
    destinationValue: '002601012345678',
    destinationDisplayValue: '00260 10123 45678',
    accountHolder: 'PT PanenMart Bersama',
    proofHint: 'Unggah screenshot mobile banking, internet banking, atau struk ATM.',
    Icon: Landmark,
  },
  {
    code: 'bank-bni',
    label: 'BNI',
    destinationLabel: 'No. Rekening',
    destinationValue: '0094567890',
    destinationDisplayValue: '00945 67890',
    accountHolder: 'PT PanenMart Bersama',
    proofHint: 'Unggah screenshot mobile banking, internet banking, atau struk ATM.',
    Icon: Landmark,
  },
  {
    code: 'bank-mandiri',
    label: 'Mandiri',
    destinationLabel: 'No. Rekening',
    destinationValue: '1300012345678',
    destinationDisplayValue: '13000 12345 678',
    accountHolder: 'PT PanenMart Bersama',
    proofHint: 'Unggah screenshot mobile banking, internet banking, atau struk ATM.',
    Icon: Landmark,
  },
  {
    code: 'bank-cimb',
    label: 'CIMB Niaga',
    destinationLabel: 'No. Rekening',
    destinationValue: '8000123456789',
    destinationDisplayValue: '80001 23456 789',
    accountHolder: 'PT PanenMart Bersama',
    proofHint: 'Unggah screenshot mobile banking, internet banking, atau struk ATM.',
    Icon: Landmark,
  },
  {
    code: 'bank-permata',
    label: 'Permata',
    destinationLabel: 'No. Rekening',
    destinationValue: '9001234567',
    destinationDisplayValue: '90012 34567',
    accountHolder: 'PT PanenMart Bersama',
    proofHint: 'Unggah screenshot mobile banking, internet banking, atau struk ATM.',
    Icon: Landmark,
  },
]
