# Parking Layout SVG Implementation Guide

## Overview
This implementation allows the system to dynamically display the correct parking layout SVG based on the parking area where the user reserves a spot.

## Files Created/Modified

### 1. Database Migration
- **File**: `tapparkuser-backend/scripts/add-parking-layout.sql`
- **Purpose**: Adds `layout_svg` and `layout_name` columns to `parking_area` table

### 2. SVG Loader Script
- **File**: `tapparkuser-backend/scripts/load-parking-layouts.js`
- **Purpose**: Loads SVG content from files into the database

### 3. Backend API Endpoint
- **File**: `tapparkuser-backend/routes/parking-areas.js`
- **Endpoint**: `GET /parking-areas/area/:areaId/layout`
- **Purpose**: Serves parking layout data to frontend

### 4. Frontend API Service
- **File**: `tapparkuser/services/api.ts`
- **Method**: `getParkingAreaLayout(areaId)`
- **Purpose**: Calls backend to fetch layout data

## Implementation Steps

### Step 1: Run Database Migration
```bash
# Connect to your MySQL database and run:
mysql -u your_username -p your_database < tapparkuser-backend/scripts/add-parking-layout.sql
```

### Step 2: Load SVG Content
```bash
# Navigate to backend directory
cd tapparkuser-backend

# Run the SVG loader script
node scripts/load-parking-layouts.js
```

### Step 3: Update Parking Area Mappings
Edit `tapparkuser-backend/scripts/load-parking-layouts.js` and update the `layoutMappings` array:

```javascript
const layoutMappings = [
  {
    parkingAreaId: 1, // Your actual parking area ID
    layoutName: 'FPAParking',
    svgFilePath: path.join(__dirname, '../../PARKINGLAYOUT-1,PARKINGLAYOUT-2/FPAParking.svg')
  },
  {
    parkingAreaId: 2, // Your actual parking area ID
    layoutName: 'FUMainParking', 
    svgFilePath: path.join(__dirname, '../../PARKINGLAYOUT-1,PARKINGLAYOUT-2/FUMainParking.svg')
  }
];
```

### Step 4: Frontend Integration
Use the new API in your React Native components:

```typescript
import { ApiService } from '../services/api';

// Fetch layout for a specific parking area
const fetchParkingLayout = async (areaId: number) => {
  try {
    const response = await ApiService.getParkingAreaLayout(areaId);
    if (response.success && response.data.hasLayout) {
      // Display the SVG layout
      setLayoutSvg(response.data.layoutSvg);
      setAreaName(response.data.areaName);
    }
  } catch (error) {
    console.error('Error fetching parking layout:', error);
  }
};
```

## Database Schema Changes

### New Columns Added to `parking_area` table:
- `layout_svg` (LONGTEXT): Stores the complete SVG content
- `layout_name` (VARCHAR(100)): Human-readable layout identifier
- Index on `layout_name` for better query performance

## API Response Format

```json
{
  "success": true,
  "data": {
    "areaId": 1,
    "areaName": "Main Lot",
    "location": "North Wing",
    "layoutName": "FPAParking",
    "layoutSvg": "<svg>...</svg>",
    "hasLayout": true
  }
}
```

## Benefits

1. **Dynamic Layouts**: Different parking areas can have different layouts
2. **Scalable**: Easy to add new parking areas with their own layouts
3. **Centralized**: All layout data stored in database
4. **Performance**: SVG content cached in database
5. **Flexible**: Can easily update layouts without code changes

## Next Steps

1. **Frontend Component**: Create a React Native component to render the SVG layouts
2. **Spot Highlighting**: Add functionality to highlight available/occupied spots
3. **Interactive Features**: Allow users to tap on spots to see details
4. **Real-time Updates**: Update spot status in real-time on the layout

## Testing

1. Verify database columns were added:
```sql
DESCRIBE parking_area;
```

2. Check if layouts were loaded:
```sql
SELECT parking_area_id, parking_area_name, layout_name, 
       CASE WHEN layout_svg IS NOT NULL THEN 'Loaded' ELSE 'Empty' END as status
FROM parking_area;
```

3. Test API endpoint:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/parking-areas/area/1/layout
```














