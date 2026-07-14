# Orbi Shop User Registration Guide

This guide outlines the registration process for different roles on the Orbi Shop platform.

## Supported User Roles

Orbi Shop supports multiple user roles, each with a tailored experience and dashboard access:

- **Buyer**: Standard shoppers.
- **Seller**: Retail merchants managing products and sales.
- **Producer**: Manufacturers and suppliers.
- **Industrial**: Industrial scale vendors.
- **Wakala**: Authorized agents/brokers on the platform.
- **Staff**: Internal marketplace administrators.

## Registration Flow

When a user initiates the registration process:

1. **Select Role**: The user selects their intended role (Buyer, Seller, Producer, Industrial, Wakala).
2. **Details Entry**: The user provides required information based on their role (Name, Email, TIN for merchants, etc.).
3. **Submission**:
   - For **Buyers**: Direct registration.
   - For **Merchants (Seller/Producer/Industrial/Wakala)**: A message is saved in the system, and a registration application is created for Administrator review.
4. **Approval**:
   - Merchants must be approved by an Administrator before they can access their dashboard.
   - Upon approval, their `registrationType` is set, which determines their specific dashboard routing.

## Login Flow

When a user logs in:

1. **Credentials**: User provides email and password.
2. **Identity Verification**:
   - The system checks if the user is registered in the appropriate roster based on the selected role.
   - For non-buyer roles, the system validates the `registrationType` against the role selected during login.
3. **Routing**: If authenticated and approved, the user is routed to their respective dashboard (e.g., Seller dashboard, Wakala dashboard).

## Administrator Approval

Administrator review is required for all merchant-type registrations to ensure platform standards are maintained. Once approved, the merchant account status is updated from "pending" to "active", allowing full portal access.
