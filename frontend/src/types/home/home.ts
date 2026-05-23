export type Coordinates = {
  lat: number
  lng: number
}

export type PromoSlide = {
  id: string
  kicker: string
  title: string
  description: string
  ctaLabel: string
  note: string
  highlight: string
}

export type NavLink = {
  id: string
  label: string
  href: string
}

export type ValueProp = {
  id: string
  title: string
  description: string
}

export type FooterLink = {
  label: string
  href: string
}

export type FooterSection = {
  id: string
  title: string
  links: FooterLink[]
}

export type StoreLocation = {
  id: string
  name: string
  city: string
  address: string
  lat: number
  lng: number
  isMain?: boolean
}

export type Product = {
  id: string
  name: string
  category: string
  price: number
  unit: string
  tag: string
  rating: number
  reviews: number
  swatch: string
  stocks: Record<string, number>
}

export type CategoryChip = {
  id: string
  label: string
}
