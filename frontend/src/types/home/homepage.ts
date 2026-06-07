export interface HomepageCategory {
  id: number;
  name: string;
  slug: string;
  icon: string;
}

export interface HomepageBanner {
  id: number;
  title: string;
  imageUrl: string;
  linkUrl: string;
  isActive: boolean;
  sortOrder: number;
}

export interface HomepageStoreInfo {
  id: number;
  name: string;
  distance: number;
  isOutOfRange: boolean;
}

export interface HomepageProduct {
  id: number;
  name: string;
  slug: string;
  price: number;
  categoryName: string;
  imageUrl: string;
  stock: number;
  storeId: number;
}

export interface HomepageStore {
  id: number;
  name: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface HomepageFooterContact {
  email: string;
  phone: string;
}

export interface HomepageFooterSocial {
  name: string;
  url: string;
}

export interface HomepageFooter {
  about: string;
  contact: HomepageFooterContact;
  socials: HomepageFooterSocial[];
}

export interface HomepageData {
  categories: HomepageCategory[];
  banners: HomepageBanner[];
  storeInfo: HomepageStoreInfo | null;
  products: HomepageProduct[];
  stores: HomepageStore[];
  footer: HomepageFooter;
}

export interface HomepageResponse {
  message: string;
  data: HomepageData;
}
