# Homepage Backend Documentation

This document describes the backend endpoints created to support the Homepage/Landing Page of the Online Grocery Web App. 

## Endpoints Overview

The homepage uses three primary endpoints to fetch data based on the user's location and active promotions.

### 1. Nearest Store

**Endpoint:** `GET /api/stores/nearest`

**Description:**
Determines the nearest active store based on the user's latitude and longitude. It uses the Haversine formula to calculate the straight-line distance in kilometers.

**Query Parameters:**
- `lat` (string, required): The user's latitude.
- `lng` (string, required): The user's longitude.

**Response (Success - 200 OK):**
```json
{
  "message": "Nearest store fetched successfully",
  "data": {
    "id": 1,
    "name": "Main Store",
    "slug": "main-store",
    "latitude": -6.200000,
    "longitude": 106.816666,
    "address": "Jl. Sudirman No. 1",
    "city": "Jakarta",
    "province": "DKI Jakarta",
    "serviceRadius": 50,
    "distance": 5.2,
    "isOutOfRange": false,
    "status": true,
    "createdAt": "2026-05-23T10:00:00.000Z",
    "updatedAt": "2026-05-23T10:00:00.000Z"
  }
}
```

**Notes:**
- The `distance` field represents the distance in km from the user to the store.
- The `isOutOfRange` boolean flag indicates if the user's distance exceeds the store's `serviceRadius`. The frontend should use this to show a warning message if it is `true`.

---

### 2. Product List

**Endpoint:** `GET /api/products`

**Description:**
Fetches a list of products. If a `storeId` is provided, it returns the stock specifically for that branch. It supports pagination, sorting, and name filtering.

**Query Parameters:**
- `storeId` (string, optional): The ID of the nearest store obtained from the `/api/stores/nearest` endpoint.
- `page` (string, optional): The page number for pagination. Default is `1`.
- `limit` (string, optional): The number of items per page. Default is `10`.
- `sort` (string, optional): Sorting criteria in the format `field:order` (e.g., `createdAt:desc`, `basePrice:asc`).
- `filter` (string, optional): A text filter for the product name.

**Response (Success - 200 OK):**
```json
{
  "message": "Products fetched successfully",
  "data": [
    {
      "id": 1,
      "name": "Fresh Apples",
      "slug": "fresh-apples",
      "description": "Sweet and crispy apples.",
      "image": "url-to-image",
      "categoryId": 2,
      "basePrice": 25000,
      "stock": 150,
      "category": {
        "id": 2,
        "name": "Fruits",
        "slug": "fruits"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

**Notes:**
- The `stock` field is mapped to represent the quantity available in the specified `storeId`. If `storeId` is omitted, it defaults to the first available stock record (or 0).

---

### 3. Promotions / Hero Banners

**Endpoint:** `GET /api/promotions`

**Description:**
Fetches active promotions (discounts) to be displayed in the hero section carousel on the homepage. It returns a maximum of 5 top active promotions based on their valid dates (`startDate` <= now <= `endDate`).

**Response (Success - 200 OK):**
```json
{
  "message": "Promotions fetched successfully",
  "data": [
    {
      "id": 1,
      "productId": 5,
      "name": "Weekend Sale",
      "description": "50% off on fresh vegetables!",
      "discountType": "PERCENTAGE",
      "discountValue": 50,
      "minPurchase": 0,
      "startDate": "2026-05-20T00:00:00.000Z",
      "endDate": "2026-05-25T23:59:59.000Z",
      "isActive": true,
      "product": {
        "id": 5,
        "name": "Organic Carrots",
        "slug": "organic-carrots",
        "image": "url-to-carrot-image",
        "basePrice": 15000
      }
    }
  ]
}
```

**Notes:**
- The response includes minimal details of the associated product, which can be used to construct a clickable banner that directs the user to the product's detail page.
