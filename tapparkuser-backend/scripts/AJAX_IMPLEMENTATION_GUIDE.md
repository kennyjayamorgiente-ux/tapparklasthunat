# AJAX-Based Parking Layout Implementation Guide

## Overview
This implementation uses AJAX (fetch API) to dynamically load parking layout SVGs, providing better performance and caching benefits.

## Benefits of AJAX Approach

### ✅ **Performance Benefits:**
- **Faster initial load** - Database only stores file paths, not large SVG content
- **Better caching** - SVG files can be cached by browsers/CDN
- **Reduced database size** - No large LONGTEXT columns
- **Lazy loading** - SVGs loaded only when needed

### ✅ **Scalability Benefits:**
- **Easy updates** - Replace SVG files without database changes
- **Version control** - SVG files can be versioned separately
- **CDN support** - SVG files can be served from CDN
- **Bandwidth optimization** - Only load SVGs when viewing layouts

## Files Created/Modified

### 1. Database Migration (AJAX)
- **File**: `tapparkuser-backend/scripts/add-parking-layout-ajax.sql`
- **Changes**: Adds `layout_svg_path` and `layout_name` columns

### 2. AJAX Setup Script
- **File**: `tapparkuser-backend/scripts/load-parking-layouts-ajax.js`
- **Purpose**: Sets up database with SVG file paths

### 3. Backend API Endpoints
- **File**: `tapparkuser-backend/routes/parking-areas.js`
- **Endpoints**: 
  - `GET /parking-areas/area/:areaId/layout` - Get layout info
  - `GET /parking-areas/layout/:layoutName` - Serve SVG files

### 4. Frontend API Service
- **File**: `tapparkuser/services/api.ts`
- **Methods**: 
  - `getParkingAreaLayout(areaId)` - Get layout info
  - `loadLayoutSvg(layoutName)` - AJAX load SVG content

### 5. React Native Component
- **File**: `tapparkuser/components/ParkingLayoutViewer.tsx`
- **Purpose**: Complete component for displaying parking layouts

## Implementation Steps

### Step 1: Run AJAX Database Migration
```bash
mysql -u your_username -p your_database < tapparkuser-backend/scripts/add-parking-layout-ajax.sql
```

### Step 2: Setup AJAX Layouts
```bash
cd tapparkuser-backend
node scripts/load-parking-layouts-ajax.js
```

### Step 3: Update Layout Mappings
Edit `tapparkuser-backend/scripts/load-parking-layouts-ajax.js`:

```javascript
const layoutMappings = [
  {
    parkingAreaId: 1, // Your actual parking area ID
    layoutName: 'FPAParking',
    svgFilePath: '/assets/layouts/FPAParking.svg',
    localFilePath: path.join(__dirname, '../../PARKINGLAYOUT-1,PARKINGLAYOUT-2/FPAParking.svg')
  },
  {
    parkingAreaId: 2, // Your actual parking area ID
    layoutName: 'FUMainParking', 
    svgFilePath: '/assets/layouts/FUMainParking.svg',
    localFilePath: path.join(__dirname, '../../PARKINGLAYOUT-1,PARKINGLAYOUT-2/FUMainParking.svg')
  }
];
```

### Step 4: Use in React Native Components

```typescript
import ParkingLayoutViewer from '../components/ParkingLayoutViewer';

// In your screen component
<ParkingLayoutViewer 
  areaId={selectedAreaId}
  onLayoutLoaded={(layoutName) => {
    console.log(`Loaded layout: ${layoutName}`);
  }}
  onError={(error) => {
    Alert.alert('Error', error);
  }}
/>
```

## API Endpoints

### 1. Get Layout Info
```
GET /api/parking-areas/area/1/layout
Authorization: Bearer YOUR_TOKEN
```

**Response:**
```json
{
  "success": true,
  "data": {
    "areaId": 1,
    "areaName": "Main Lot",
    "location": "North Wing",
    "layoutName": "FPAParking",
    "layoutSvgPath": "/assets/layouts/FPAParking.svg",
    "hasLayout": true
  }
}
```

### 2. Load SVG Content (AJAX)
```
GET /api/parking-areas/layout/FPAParking
```

**Response:** Raw SVG content with proper headers:
```
Content-Type: image/svg+xml
Cache-Control: public, max-age=3600
```

## Database Schema (AJAX)

### New Columns in `parking_area` table:
- `layout_svg_path` (VARCHAR(255)): Path to SVG file
- `layout_name` (VARCHAR(100)): Layout identifier
- Index on `layout_name` for performance

## Caching Strategy

### Browser Caching:
- SVG files cached for 1 hour (`max-age=3600`)
- Automatic cache invalidation when files change
- Reduced server load for repeated requests

### CDN Support:
- SVG files can be served from CDN
- Global caching for better performance
- Reduced bandwidth costs

## Security Features

### File Access Control:
- Only allowed layout names can be accessed
- Path traversal protection
- File existence validation

### Allowed Layouts:
```javascript
const allowedLayouts = ['FPAParking', 'FUMainParking'];
```

## Performance Comparison

| Approach | Database Size | Initial Load | Caching | Updates |
|----------|---------------|--------------|---------|---------|
| **Database Storage** | Large (SVG content) | Slow | Limited | Database update |
| **AJAX Approach** | Small (file paths) | Fast | Excellent | File replacement |

## Testing

### 1. Test Layout Info API:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/parking-areas/area/1/layout
```

### 2. Test SVG Loading:
```bash
curl http://localhost:3000/api/parking-areas/layout/FPAParking
```

### 3. Verify Database:
```sql
SELECT parking_area_id, parking_area_name, layout_name, layout_svg_path
FROM parking_area 
WHERE layout_svg_path IS NOT NULL;
```

## Next Steps

1. **Interactive Features**: Add click handlers to parking spots
2. **Real-time Updates**: WebSocket integration for live spot status
3. **Mobile Optimization**: Responsive SVG scaling
4. **Offline Support**: Cache SVGs for offline viewing
5. **Analytics**: Track layout usage and performance

