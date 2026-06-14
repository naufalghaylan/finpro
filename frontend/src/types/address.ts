export interface UserAddress {
  id: number;
  userId: number;
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  cityId?: string | null;
  province: string;
  provinceId?: string | null;
  district?: string | null;
  postalCode?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  isPrimary: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserAddressDTO {
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  cityId?: string;
  province: string;
  provinceId?: string;
  district?: string;
  postalCode?: string;
  latitude?: number;
  longitude?: number;
  isPrimary?: boolean;
}

export type UpdateUserAddressDTO = Partial<CreateUserAddressDTO>;
