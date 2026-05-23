# Homepage and Landing Page Notes

## Overview

The homepage is a standalone Feature 1 UI with mock data. It is designed to be
plugged into the backend once endpoints are ready. The location flow requests
permission on first load, selects the nearest store, and falls back to the main
store when location is denied or unavailable.

Mock data lives in:
- src/data/home/homeData.ts

Types live in:
- src/types/home/home.ts

Location and geo utilities:
- src/hooks/home/useLocationSelection.ts
- src/utils/home/geo.ts

## Page Structure

1. Navigation bar with search and primary CTA
2. Hero carousel for promo messaging
3. Category chips for quick browsing
4. Location panel for nearest-store status
5. Value strip explaining service highlights
6. Product grid filtered by active store
7. Store showcase cards
8. Help section and footer

## Location Flow

- On first load, `useLocationSelection` calls `navigator.geolocation`.
- If granted, the UI expects the nearest store and distance to be returned.
- If denied or unavailable, the UI falls back to the main store.
- If the nearest store is out of range, the UI shows a warning and suggests
  switching store or location.

## Suggested API Contracts

### GET /api/stores/nearest?lat={lat}&lng={lng}
Response
```
{
  "store": {
    "id": "store-north",
    "name": "PanenMart Utara",
    "city": "Jakarta",
    "address": "Jl. Pluit Raya No. 12",
    "lat": -6.1218,
    "lng": 106.7915,
    "isMain": false
  },
  "distanceKm": 4.2,
  "maxServiceKm": 12,
  "inRange": true
}
```

### GET /api/stores/main
Response
```
{
  "store": {
    "id": "store-main",
    "name": "PanenMart Pusat",
    "city": "Jakarta",
    "address": "Jl. Sudirman No. 45",
    "lat": -6.2002,
    "lng": 106.8167,
    "isMain": true
  }
}
```

### GET /api/promos?storeId={storeId}
Response
```
{
  "slides": [
    {
      "id": "slide-harvest",
      "kicker": "Panen Minggu Ini",
      "title": "Sayur segar tiba pagi ini.",
      "description": "Pilih paket siap masak dari mitra lokal.",
      "ctaLabel": "Mulai belanja",
      "note": "Gratis kirim untuk pesanan di atas Rp 150.000",
      "highlight": "Dipilih tim quality control"
    }
  ]
}
```

### GET /api/products?storeId={storeId}&page=1&limit=10&sort=createdAt&filter=category:sayur
Response
```
{
  "items": [
    {
      "id": "prod-001",
      "name": "Paket Sayur Harian",
      "category": "Sayur",
      "price": 28000,
      "unit": "paket",
      "tag": "Best seller",
      "rating": 4.8,
      "reviews": 324,
      "stock": 120
    }
  ],
  "page": 1,
  "limit": 10,
  "total": 120
}
```

### GET /api/categories?storeId={storeId}
Response
```
{
  "items": [
    { "id": "sayur", "label": "Sayur" },
    { "id": "buah", "label": "Buah" }
  ]
}
```

## Mapping to Frontend

- `PromoSlide` maps to the promos endpoint.
- `Product` maps to product list items. `stock` should come from the active store.
- `StoreLocation` maps to store endpoints.
- `SERVICE_RANGE_KM` can be replaced with `maxServiceKm` from the nearest-store response.

## Error Handling

- If nearest-store lookup fails, show the error message in the location panel
  and use the main store response instead.
- If products fail, show an empty state for the product grid.
- Keep loading states short and explicit for the hero and product list.
