# Security Specification – Sarah's Wishlist ♡ Private Area

## 1. Data Invariants
1. **Default Deny**: Unmatched Firestore paths are denied by default (`/{document=**}`).
2. **PII Isolation (`private_delivery`)**: Delivery addresses, Amazon Locker details, and private notes reside exclusively in `/private_delivery/sarah_private`. Unauthenticated visitors and non-admin signed-in users are denied `get`, `list`, `create`, `update`, and `delete`.
3. **No Public PII in Settings (`wishlist_settings/public`)**: Only explicitly toggled public guidance (`showAmazonWishlist`, `showPublicDeliveryNote`, `hideReceivedFromVisitors`) is stored here; visitors can only `get` `wishlist_settings/public`, never `list` or write.
4. **Admin Privilege Integrity**:
   - Regular users cannot self-assign `admins/{uid}` unless their verified email (`email_verified == true`) matches an explicit server-side invite in `/admin_invites/primary_sarah`, or they are the verified bootstrapped owner.
   - `admins/{uid}` enforces `uid == adminUid` and immutable `createdAt`.
5. **Catalog Integrity (`wishlist_products`)**:
   - Visitors can read (`get`, `list`) products with zero `get()`/`exists()` cost amplification on `list`.
   - Only verified admins can `create`, `update`, or `delete` products, with strict key allowlists (`hasAll` + `hasOnly`), `affectedKeys().hasOnly(...)` on update, immutable `id` and `createdAt`, server-timestamp enforcement (`request.time`), and strict string length bounds.

## 2. Adversarial Test Vectors ("Dirty Dozen")
1. Unauthenticated visitor attempts `get` on `/private_delivery/sarah_private` -> `PERMISSION_DENIED`.
2. Non-admin signed-in user attempts `get` on `/private_delivery/sarah_private` -> `PERMISSION_DENIED`.
3. Any user attempts `list` on `/private_delivery` -> `PERMISSION_DENIED`.
4. Unverified email user (`email_verified: false`) attempts `create` on `/admins/{uid}` -> `PERMISSION_DENIED`.
5. Signed-in non-invited user attempts `create` on `/admins/{uid}` -> `PERMISSION_DENIED`.
6. Visitor attempts `create` or `update` on `/wishlist_products/1` -> `PERMISSION_DENIED`.
7. Admin attempts shadow field injection (`extraAdminField: true`) on `/wishlist_products/1` -> `PERMISSION_DENIED`.
8. Admin attempts to spoof `createdAt` with a client timestamp instead of `request.time` -> `PERMISSION_DENIED`.
9. Admin attempts to change `id` or `createdAt` during product `update` -> `PERMISSION_DENIED`.
10. Admin attempts oversized 20KB string in `name` or `streetAddress` -> `PERMISSION_DENIED`.
11. Attacker attempts path ID poisoning (`/wishlist_products/bad$id` with invalid chars or >128 chars) -> `PERMISSION_DENIED`.
12. Non-admin attempts `update` on `/wishlist_settings/public` -> `PERMISSION_DENIED`.
