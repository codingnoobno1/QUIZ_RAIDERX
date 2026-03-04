# Live Event Admin: Next.js Documentation

This document describes how to manage Live Event modes through the Admin Panel and API.

## 1. API Endpoints

### `PUT /api/events/[id]`
Used to toggle the `activeMode` and configure `modes` for an event.

**Request Body:**
```json
{
  "activeMode": "quiz",
  "modes": [
    {
      "type": "quiz",
      "config": {
        "subModes": [
          {"id": "rapid-fire", "name": "Rapid Fire", "description": "10s per question"}
        ]
      }
    }
  ]
}
```

## 2. Admin Dashboard Integration

The `/admin_dashboard` route includes a "Live Event" tab with the following features:
- **Event List**: Shows all upcoming and current events.
- **Mode Toggle**: A dropdown or radio buttons to select the `activeMode` (Quiz, Voting, etc.) or "None" (to deactivate).
- **Configuration**: Basic JSON editor or form to set mode-specific parameters.

## 3. Real-time Reflection

When `activeMode` is changed via the Admin Panel, the Flutter app will detect the change during its next refresh or when the user navigates to the "Live Event" tab. 

To ensure immediate updates, the Flutter app's Live Mode tab includes a "REFRESH" button that re-scans the user's registrations.
