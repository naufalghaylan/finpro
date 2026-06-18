# Shipping and Checkout Flow

## Overview
The shipping and checkout system calculates delivery costs from the nearest store to the user's selected address and processes the final payment using Midtrans. The shipping cost calculation relies on **Komerce RajaOngkir API** which uses Subdistrict IDs.

## System Components

### 1. Address Management
- **Database Schema**: `UserAddress` uses `cityId` to store the Komerce Destination ID (Subdistrict ID). 
- **Store Location**: Each `Store` also has a `cityId` representing its Komerce Destination ID.
- **Why Subdistrict IDs**: The Komerce Domestic Cost API requires subdistrict IDs (not just city IDs) for accurate origin and destination parameters.

### 2. Shipping Cost Calculation (Backend)
- **API File**: `src/services/rajaongkir.service.ts`
- **Endpoints**:
  - `GET /api/rajaongkir/destinations?search=<keyword>`: Searches for matching subdistricts using Komerce API. Returns ID, province, city, district, and subdistrict names.
  - `POST /api/rajaongkir/cost`: Calculates shipping cost given `origin` (Store's `cityId`), `destination` (User Address's `cityId`), `weight` (in grams), and `courier` (e.g., `jne`, `jnt`).
- **Logic**: During checkout preview, the system computes the distance, determines the total weight of cart items, and fetches available couriers and their respective service types and costs.

### 3. Checkout Process
- **API File**: `src/controllers/order.controller.ts` & `src/services/order.service.ts`
- **Flow**:
  1. **Preview (`GET /api/orders/checkout/preview`)**: Evaluates the user's cart, checks stock at the nearest store, computes total product prices, applies any applicable discounts, and retrieves shipping costs for the selected address.
  2. **Create Order (`POST /api/orders/checkout`)**: Validates the selected shipping method, reserves stock, creates an `Order` and `OrderItem` records in the database, and empties the user's cart.
  3. **Payment Gateway**: Initiates a Midtrans Snap transaction. The payload sent to Midtrans includes `item_details` (which lists all cart items + a distinct `SHIPPING` item + a `DISCOUNT` item if applicable) ensuring that the `gross_amount` matches the sum exactly.

### 4. Frontend Integration
- **State Management**: Uses Zustand (e.g., `useCheckoutStore`) and React Query to manage the active checkout session.
- **Pages**:
  - `CheckoutPage`: Displays order items, address selection, shipping method dropdown, and total price summary.
  - `Midtrans Snap`: Triggered automatically after successful order creation or manually via the "Muat Ulang Midtrans" button if the initial popup fails/closes.

## Important Notes & Troubleshooting
- **Data Integrity**: If a Store or User Address is mistakenly assigned an incorrect `cityId` (e.g., an ID belonging to a different province), the shipping cost will be incorrectly calculated. Ensure that `cityId` always corresponds to the valid Komerce Destination ID.
- **Midtrans Requirements**: Midtrans strictly requires `gross_amount` to equal the sum of `price * quantity` for all items in `item_details`. Shipping costs and discounts are modeled as pseudo-items to satisfy this requirement.
- **Error 502 on Payment**: Usually indicates a failure communicating with Midtrans (e.g., invalid Sandbox Server Key or `gross_amount` mismatch). Check backend server logs for detailed API responses.
