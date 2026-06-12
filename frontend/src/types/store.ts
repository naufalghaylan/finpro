export interface StoreAdmin {
  id: number;
  name: string;
  email: string;
  createdAt?: string;
}

export interface Store {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  cityId?: string;
  province: string;
  provinceId?: string;
  postalCode?: string;
  phone?: string;
  serviceRadius: number;
  status: boolean;
  createdAt: string;
  updatedAt: string;
  admins?: StoreAdmin[];
  _count?: {
    admins: number;
  };
}

export interface StoreInput {
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  cityId?: string;
  province: string;
  provinceId?: string;
  postalCode?: string;
  phone?: string;
  serviceRadius?: number;
  status?: boolean;
}

export interface StoreAdminInput {
  name: string;
  email: string;
  password?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
