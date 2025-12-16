# Tappark Database ERD (Entity Relationship Diagram)

## Complete Database Schema

```mermaid
erDiagram
    users ||--o{ vehicles : "owns"
    users ||--o{ reservations : "makes"
    users ||--o{ favorites : "has"
    users ||--o{ subscriptions : "purchases"
    users ||--o{ payments : "makes"
    users ||--o{ transactions : "has"
    users ||--o{ feedback : "submits"
    users ||--o{ notifications : "receives"
    users ||--o{ user_logs : "has"
    users ||--o{ qr_scan_tracking : "attendant_scans"
    reservations ||--o{ qr_scan_tracking : "tracked_in"
    users }o--|| types : "has_type"
    users }o--o| parking_area : "assigned_to"
    
    types ||--o{ type_privileges : "has"
    privileges ||--o{ type_privileges : "granted_to"
    
    parking_area ||--o{ parking_layout : "has"
    parking_area ||--o{ parking_section : "contains"
    
    parking_section ||--o{ parking_spot : "contains"
    parking_section }o--|| vehicle_types : "for"
    
    parking_spot ||--o{ favorites : "favorited_by"
    parking_spot ||--o{ reservations : "reserved"
    parking_spot ||--o{ sensors : "monitored_by"
    parking_spot ||--o{ qr_scan_tracking : "tracked_spot"
    parking_area ||--o{ qr_scan_tracking : "tracked_area"
    
    vehicles ||--o{ reservations : "used_in"
    
    plans ||--o{ subscriptions : "subscribed_to"
    penalty ||--o{ subscriptions : "applied_to"
    
    subscriptions ||--o{ payments : "paid_for"
    subscriptions ||--o{ transactions : "related_to"
    
    reservations ||--o{ transactions : "related_to"
    
    payment_method ||--o{ payments : "used_in"
    
    sensors ||--o{ sensor_readings : "generates"
    
    users {
        bigint user_id PK
        varchar external_user_id
        varchar profile_picture
        varchar email
        varchar last_name
        varchar first_name
        varchar password
        int hour_balance
        bigint user_type_id FK
        timestamp created_at
        timestamp updated_at
        bigint assigned_area_id FK
        tinyint is_online
        timestamp last_activity_at
        enum status
    }
    
    types {
        bigint type_id PK
        varchar account_type_name
    }
    
    type_privileges {
        bigint type_id PK,FK
        bigint privilege_id PK,FK
    }
    
    privileges {
        bigint privilege_id PK
        varchar privileges_name
        text privileges_description
    }
    
    parking_area {
        bigint parking_area_id PK
        varchar parking_area_name
        varchar location
        int num_of_floors
        int total_capacity
        int grid_rows
        int grid_cols
        longtext layout_data
        timestamp created_at
        timestamp updated_at
        int floor_number
        varchar status
    }
    
    parking_layout {
        bigint parking_layout_id PK
        bigint parking_area_id FK
        int floor
        longtext layout_data
        datetime created_at
        datetime updated_at
    }
    
    parking_section {
        bigint parking_section_id PK
        bigint parking_area_id FK
        varchar section_name
        enum section_type
        varchar status
        int floor
        int rows
        int columns
        int start_row
        int start_col
        bigint vehicle_type_id FK
        tinyint is_rotated
        timestamp created_at
        enum vehicle_type
    }
    
    parking_spot {
        bigint parking_spot_id PK
        bigint parking_section_id FK
        varchar spot_number
        varchar status
        varchar spot_type
        int grid_row
        int grid_col
        tinyint is_occupied
        varchar occupied_by
        timestamp occupied_at
        timestamp created_at
    }
    
    vehicle_types {
        bigint vehicle_type_id PK
        varchar vehicle_type_name
        varchar vehicle_icon
        timestamp created_at
    }
    
    vehicles {
        bigint vehicle_id PK
        bigint user_id FK
        varchar vehicle_type
        varchar color
        varchar brand
        varchar plate_number
    }
    
    reservations {
        bigint reservation_id PK
        bigint user_id FK
        bigint vehicle_id FK
        bigint parking_spots_id FK
        timestamp time_stamp
        timestamp start_time
        timestamp end_time
        varchar booking_status
        longtext QR
        timestamp created_at
        timestamp updated_at
    }
    
    favorites {
        bigint favorites_id PK
        bigint parking_spot_id FK
        bigint user_id FK
        timestamp created_at
    }
    
    subscriptions {
        bigint subscription_id PK
        bigint user_id FK
        bigint plan_id FK
        bigint penalty_id FK
        timestamp purchase_date
        varchar status
        int hours_remaining
        int hours_used
    }
    
    plans {
        bigint plan_id PK
        varchar plan_name
        decimal cost
        int number_of_hours
        text description
    }
    
    penalty {
        bigint penalty_id PK
        decimal rate
    }
    
    payments {
        bigint payment_id PK
        bigint user_id FK
        decimal amount
        varchar status
        varchar description
        varchar reference_number
        timestamp payment_date
        timestamp created_at
        timestamp updated_at
        bigint payment_method_id FK
        bigint subscription_id FK
    }
    
    payment_method {
        bigint id PK
        varchar method_name
    }
    
    transactions {
        bigint transaction_id PK
        bigint user_id FK
        enum transaction_type
        decimal hours
        decimal balance_before
        decimal balance_after
        bigint reservation_id FK
        bigint subscription_id FK
        varchar description
        timestamp transaction_date
        timestamp created_at
    }
    
    sensors {
        bigint sensor_id PK
        timestamp installed_at
        varchar location_desc
        bigint parking_spot_id FK
    }
    
    sensor_readings {
        bigint reading_id PK
        bigint sensor_id FK
        varchar reading_value
        timestamp reading_time
    }
    
    feedback {
        bigint feedback_id PK
        bigint user_id FK
        text content
        tinyint rating
        varchar status
        timestamp created_at
    }
    
    notifications {
        int id PK
        bigint user_id FK
        varchar title
        text message
        enum type
        tinyint is_read
        longtext data
        timestamp created_at
    }
    
    user_logs {
        bigint logs_id PK
        bigint user_id FK
        bigint target_id
        varchar action_type
        varchar change_field
        text description
        timestamp timestamp
    }
    
    qr_scan_tracking {
        int qr_id PK
        bigint reservation_id FK
        bigint attendant_user_id FK
        varchar vehicle_plate
        bigint parking_area_id FK
        bigint parking_spot_id FK
        varchar parking_area_name
        varchar spot_number
        enum scan_type
        datetime scan_timestamp
        varchar status_at_scan
    }
```

## Table Summary

### Core Entities (22 tables total)

1. **users** - User accounts with authentication and profile information
2. **types** - User account types (Subscriber, Attendant, Admin)
3. **type_privileges** - Junction table linking user types to privileges
4. **privileges** - Available system privileges/permissions
5. **vehicles** - User vehicles
6. **vehicle_types** - Vehicle type definitions (Car, Motorcycle, Bicycle)

### Parking Infrastructure

7. **parking_area** - Parking lots/areas
8. **parking_layout** - Layout configurations for parking areas
9. **parking_section** - Sections within parking areas
10. **parking_spot** - Individual parking spots
11. **sensors** - IoT sensors monitoring parking spots
12. **sensor_readings** - Sensor data readings

### Reservations & Bookings

13. **reservations** - Parking spot reservations
14. **favorites** - User favorite parking spots

### Subscriptions & Payments

15. **plans** - Subscription plans (hour packages)
16. **subscriptions** - User subscriptions to plans
17. **penalty** - Penalty rates
18. **payments** - Payment records
19. **payment_method** - Payment method types (Cash, GCash, Credit Card)
20. **transactions** - Hour balance transactions

### System & Logging

21. **notifications** - User notifications
22. **feedback** - User feedback/reviews
23. **user_logs** - User activity logs
24. **qr_scan_tracking** - QR code scan tracking logs (with FK to parking_spot and parking_area)

## Key Relationships

- **users** is central, connecting to most entities
- **parking_area** → **parking_section** → **parking_spot** (hierarchical structure)
- **reservations** link users, vehicles, and parking spots
- **subscriptions** connect users to plans and generate payments/transactions
- **types** and **privileges** control user permissions via **type_privileges**

