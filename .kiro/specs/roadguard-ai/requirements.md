# Requirements Document

## Introduction

RoadGuard-AI is a production-grade, research-paper-quality Android mobile application that performs
intelligent road hazard detection using on-device sensor fusion (accelerometer + camera), AI-powered
chat assistance (Claude API), real-time hazard mapping, weather-based driving advisories, and a
full admin management portal. The app targets two roles — regular users who monitor and report road
hazards, and admins who manage the platform, view analytics, and export reports.

The mobile frontend is built with Expo (React Native, TypeScript) targeting Android APK via EAS
Build. The backend is FastAPI running on a local network (phone + laptop on same WiFi), backed by
SQLite via SQLAlchemy. AI inference uses a 2-stage CNN (TensorFlow) for accelerometer data and
YOLOv8 for vision, fused into a multimodal prediction pipeline.

---

## Glossary

- **App**: The RoadGuard-AI Expo React Native Android application.
- **Backend**: The FastAPI server running on the local network at a configurable IP and port 8000.
- **Auth_Service**: The JWT-based authentication subsystem (signup, login, token validation).
- **Sensor_Service**: The on-device TypeScript module that samples the accelerometer at 100 Hz, applies SMA smoothing, detects spikes, and triggers multimodal prediction.
- **Fusion_Pipeline**: The backend module that combines accelerometer CNN output and YOLO vision output into a single hazard label and confidence score.
- **Hazard_Event**: A detected road hazard record stored in SQLite with label, GPS coordinates, confidence, and timestamp.
- **User**: An authenticated app user with role "user" who monitors hazards and uses the AI assistant.
- **Admin**: An authenticated app user with role "admin" who manages users, views analytics, and exports reports.
- **Claude_Service**: The frontend TypeScript module that communicates with the Anthropic Claude API to provide context-aware road safety chat responses.
- **Voice_Service**: The frontend module combining expo-av audio recording with backend Whisper transcription and Expo Speech TTS for voice interaction.
- **Map_Screen**: The LiveMapScreen component rendering react-native-maps with hazard markers, clustering, and heatmap overlay.
- **Monitor_Screen**: The MonitorScreen component that drives the Sensor_Service state machine and displays live accelerometer charts.
- **Weather_Service**: The frontend module that fetches OpenWeatherMap data and computes a road safety score from weather conditions.
- **Safety_Score**: A 0–100 integer computed from recent hazard density, weather conditions, and road quality index for a given location.
- **JWT**: JSON Web Token used for stateless authentication with a 7-day expiry.
- **EAS**: Expo Application Services used to build the Android APK.
- **SMA**: Simple Moving Average applied over a configurable window to smooth accelerometer magnitude.
- **Spike**: An accelerometer SMA value exceeding 2.5× the running mean, indicating a potential road hazard event.
- **RQI**: Road Quality Index — a derived metric (0–100) computed from recent Hazard_Event density in a geographic radius.
- **Admin_Dashboard**: The AdminDashboardScreen showing KPI cards, live hazard feed, and system health for Admin users.

---

## Requirements

### Requirement 1: User Authentication

**User Story:** As a new user, I want to create an account and log in securely, so that my hazard reports and preferences are associated with my identity and protected from unauthorized access.

#### Acceptance Criteria

1. WHEN a user submits a valid email, username, and password via the signup form, THE Auth_Service SHALL create a new User record with a bcrypt-hashed password and role "user", and return a JWT valid for 7 days.
2. WHEN a user submits a valid email and password via the login form, THE Auth_Service SHALL verify the bcrypt hash, update the User's last_login timestamp, and return a JWT valid for 7 days.
3. IF a signup request contains an email or username already present in the database, THEN THE Auth_Service SHALL return HTTP 409 with a descriptive error message identifying the duplicate field.
4. IF a login request contains an unrecognized email or an incorrect password, THEN THE Auth_Service SHALL return HTTP 401 with the message "Invalid credentials".
5. IF a request to a protected endpoint is made without a valid JWT in the Authorization header, THEN THE Auth_Service SHALL return HTTP 401 with the message "Not authenticated".
6. WHEN a User with is_banned=true attempts to log in, THE Auth_Service SHALL return HTTP 403 with the message "Account suspended".
7. THE Auth_Service SHALL expose GET /api/auth/me, which returns the authenticated User's id, email, username, role, is_active, and created_at fields.
8. THE App SHALL persist the JWT in AsyncStorage and restore the authenticated session on next launch without requiring re-login until the token expires.

---

### Requirement 2: Role-Based Navigation

**User Story:** As a user or admin, I want the app to route me to the correct interface after login, so that I only see screens and actions appropriate for my role.

#### Acceptance Criteria

1. WHEN a User with role "user" successfully authenticates, THE App SHALL navigate to the User bottom tab navigator containing Home, Live Map, Monitor, Assistant, and Profile tabs.
2. WHEN a User with role "admin" successfully authenticates, THE App SHALL navigate to the Admin bottom tab navigator containing Dashboard, Map, Users, Analytics, and Reports tabs.
3. WHILE a User is unauthenticated, THE App SHALL display only the Auth navigator (Splash, Login, Signup screens) and SHALL NOT render any user or admin screens.
4. WHEN a User logs out from the Profile screen, THE App SHALL clear the JWT from AsyncStorage and navigate back to the Login screen.
5. IF a deep-link or programmatic navigation attempts to access an Admin screen while the authenticated role is "user", THEN THE App SHALL redirect to the User Home screen.

---

### Requirement 3: Splash Screen and Onboarding

**User Story:** As a first-time user, I want to see a branded splash screen on launch, so that the app feels polished and professional while it initializes.

#### Acceptance Criteria

1. WHEN the App launches, THE App SHALL display the SplashScreen with the RoadGuard-AI logo and a pulsing animation for a minimum of 1500 ms while checking AsyncStorage for a persisted JWT.
2. WHEN the persisted JWT is valid and not expired, THE App SHALL transition from SplashScreen directly to the appropriate role-based navigator without showing the Login screen.
3. WHEN no valid JWT is found in AsyncStorage, THE App SHALL transition from SplashScreen to the LoginScreen.

---

### Requirement 4: Design System

**User Story:** As a developer, I want a consistent design system, so that all screens share a unified dark-theme visual language.

#### Acceptance Criteria

1. THE App SHALL apply the primary color #0F172A as the default background for all screens.
2. THE App SHALL apply the secondary color #3B82F6 as the primary interactive element color (buttons, active tab indicators).
3. THE App SHALL apply the accent color #06B6D4 (cyan) as the active tab tint and highlight color.
4. THE App SHALL render hazard markers and labels using the following color mapping: Normal → #3B82F6 (blue), SpeedBreaker → #F59E0B (amber), Pothole → #EF4444 (red).
5. THE App SHALL use a typography scale: xs=11, sm=13, md=15, lg=18, xl=22, xxl=28, xxxl=36 with weights regular=400, medium=500, semibold=600, bold=700.
6. THE App SHALL apply consistent spacing using an 8 dp base unit grid (8, 16, 24, 32 dp).

---

### Requirement 5: Sensor Fusion — On-Device Detection

**User Story:** As a user driving a vehicle, I want the app to automatically detect road hazards using my phone's accelerometer, so that I can contribute hazard data without manual interaction.

#### Acceptance Criteria

1. WHEN the Monitor screen is active and monitoring is started, THE Sensor_Service SHALL sample the device accelerometer at 100 Hz using expo-sensors.
2. WHILE collecting accelerometer data, THE Sensor_Service SHALL compute a Simple Moving Average over the most recent 10 samples of the 3-axis magnitude vector.
3. WHEN the SMA value exceeds 2.5 times the running mean of the SMA buffer, THE Sensor_Service SHALL transition to the SPIKE_DETECTED state and halt further spike detection until the current event is resolved.
4. WHEN a Spike is detected, THE App SHALL capture the most recent 100-sample accelerometer window, the current GPS coordinates, and POST the payload to /api/predict-multimodal on the Backend.
5. WHEN the Backend returns a prediction response, THE App SHALL display the hazard label and confidence on the Monitor screen and store the Hazard_Event in the local hazard store.
6. IF the Backend is unreachable when a Spike is detected, THEN THE Sensor_Service SHALL enqueue the payload in an offline sync queue stored in AsyncStorage and retry transmission when network connectivity is restored.
7. THE Monitor_Screen SHALL render a live SVG line chart of the accelerometer magnitude updated at 10 Hz during the COLLECTING state.
8. THE Sensor_Service SHALL expose a state machine with states: IDLE, INITIALIZING, COLLECTING, SPIKE_DETECTED, TRANSMITTING, and ERROR.

---

### Requirement 6: Backend Multimodal Prediction API

**User Story:** As a developer, I want the backend to fuse accelerometer and vision data into a single hazard prediction, so that detection accuracy exceeds either modality alone.

#### Acceptance Criteria

1. WHEN the Backend receives a POST /api/predict-multimodal request with sensor_data (shape 100×3), latitude, longitude, and timestamp, THE Fusion_Pipeline SHALL run the 2-stage TensorFlow CNN on sensor_data and return a fused prediction.
2. WHEN model outputs are available, THE Fusion_Pipeline SHALL compute a weighted fusion score (sensor weight 0.6, vision weight 0.4) and return the label (0=Normal, 1=SpeedBreaker, 2=Pothole), label_name, confidence, and individual model probabilities.
3. WHEN the fused label is not Normal (label ≠ 0), THE Backend SHALL persist a Hazard_Event record to SQLite with the provided GPS coordinates, label, confidence, and timestamp.
4. IF sensor_data contains NaN or Inf values, THEN THE Backend SHALL return HTTP 422 with the message "Invalid sensor data: contains NaN or Inf".
5. THE Backend SHALL load TensorFlow models exactly once at startup using singleton initialization and SHALL NOT reload models per request.
6. THE Backend SHALL expose GET /api/events returning all Hazard_Event records ordered by timestamp descending, with optional query parameters: label (int), start_date (ISO 8601), end_date (ISO 8601), limit (int, default 100).

---

### Requirement 7: Live Hazard Map

**User Story:** As a user, I want to see all nearby road hazards on an interactive map, so that I can plan my route to avoid dangerous road conditions.

#### Acceptance Criteria

1. WHEN the Live Map screen is opened, THE Map_Screen SHALL render a react-native-maps MapView with a dark custom map style and center on the user's current GPS location.
2. THE Map_Screen SHALL fetch Hazard_Event records from GET /api/events and render a color-coded marker for each event using the hazard color mapping defined in Requirement 4.
3. WHEN more than 5 hazard markers overlap within a 50 dp radius, THE Map_Screen SHALL cluster them into a single cluster marker showing the count using react-native-map-clustering.
4. WHEN a user taps a hazard marker, THE Map_Screen SHALL display a bottom sheet modal with the hazard label, confidence, timestamp, and GPS coordinates.
5. WHERE the heatmap toggle is enabled, THE Map_Screen SHALL render a heatmap overlay derived from Hazard_Event density in addition to individual markers.
6. THE Map_Screen SHALL provide filter controls (by hazard type and date range) in a bottom sheet panel that update the displayed markers without a full screen reload.
7. THE Map_Screen SHALL refresh hazard data every 30 seconds while the screen is active.

---

### Requirement 8: AI Chatbot Assistant

**User Story:** As a user, I want to ask road safety questions to an AI assistant using text or voice, so that I can get context-aware driving advice hands-free.

#### Acceptance Criteria

1. WHEN a user sends a text message in the Chatbot screen, THE Claude_Service SHALL POST the message with a road-safety system prompt to the Backend's /api/chat endpoint and display the response as a chat bubble within 10 seconds.
2. WHEN a user taps the voice input button, THE Voice_Service SHALL record audio using expo-av, POST the audio file to the Backend's /api/voice/transcribe endpoint, and populate the chat input field with the transcribed text.
3. WHEN a Claude_Service response is received, THE App SHALL read the response aloud using Expo Speech TTS at the user's configured speech rate.
4. THE Chatbot screen SHALL display a set of suggested prompt chips that pre-populate the input field when tapped.
5. IF the Backend returns an error or times out after 10 seconds, THEN THE Claude_Service SHALL display the message "Assistant unavailable. Please try again." in the chat.
6. THE Claude_Service SHALL include the 10 most recent Hazard_Event records and current weather conditions as context in every API request to enable location-aware responses.

---

### Requirement 9: Weather and Driving Advisories

**User Story:** As a user, I want to see current weather conditions and a road safety score based on weather, so that I can decide whether conditions are safe for driving.

#### Acceptance Criteria

1. WHEN the Weather screen is opened, THE Weather_Service SHALL fetch current conditions and a 5-day hourly forecast from the OpenWeatherMap API for the user's current GPS location.
2. THE Weather_Service SHALL compute a Safety_Score (0–100) from weather conditions: Clear=95, Cloudy=85, Light rain=60, Heavy rain=30, Fog=25, Storm=10.
3. THE Weather screen SHALL display the Safety_Score as a color-coded badge: ≥70 green, 40–69 amber, <40 red.
4. THE Weather screen SHALL display driving advisories as text recommendations derived from the active weather conditions.
5. IF the OpenWeatherMap API returns an error, THEN THE Weather_Service SHALL display the last cached weather data with a "Data may be outdated" notice.

---

### Requirement 10: Hazard History and Export

**User Story:** As a user, I want to browse my past hazard detections with filters and export them, so that I can review road conditions over time and share data.

#### Acceptance Criteria

1. THE Hazard History screen SHALL display a paginated list of Hazard_Event records fetched from GET /api/events, showing label, confidence, timestamp, and GPS coordinates per row.
2. THE Hazard History screen SHALL provide filter controls for hazard type, date range, and sort order (newest first, oldest first, highest confidence first).
3. WHEN a user taps the export button, THE App SHALL generate a CSV file containing all currently filtered Hazard_Event records and share it via the device share sheet using expo-sharing.
4. THE CSV export SHALL include columns: id, timestamp, latitude, longitude, label_name, confidence, p_sensor, p_vision.

---

### Requirement 11: Safe Route Planning

**User Story:** As a user, I want to see a route to my destination with hazard density overlaid on each segment, so that I can choose the safest path.

#### Acceptance Criteria

1. WHEN a user enters a destination in the Safe Route screen, THE App SHALL request route directions from the Google Maps Directions API between the user's current location and the destination.
2. THE App SHALL compute a hazard density score for each route segment based on Hazard_Event records within a 100-meter radius.
3. THE App SHALL render each route segment on the map with a color derived from its hazard density: density 0 → green, density 1–2 → amber, density ≥3 → red.
4. THE App SHALL display an overall route Safety_Score (0–100) in a summary card below the map.
5. IF the Google Maps Directions API returns an error, THEN THE App SHALL display "Route unavailable. Check your API key and network connection."

---

### Requirement 12: User Profile and Settings

**User Story:** As a user, I want to view my stats and configure app behavior, so that the app adapts to my preferences and driving patterns.

#### Acceptance Criteria

1. THE Profile screen SHALL display the authenticated User's username, email, role, account creation date, and total hazard detections.
2. THE Profile screen SHALL provide a settings panel with: sensor spike threshold (1.5–4.0, default 2.5), alert radius in meters (100–2000, default 500), and map style (dark, satellite, standard).
3. WHEN a user changes a setting, THE App SHALL persist the new value to AsyncStorage immediately and apply it to the relevant service without requiring an app restart.
4. WHEN a user taps the logout button, THE App SHALL clear the JWT and all user-specific cached data from AsyncStorage and navigate to the LoginScreen.

---

### Requirement 13: Admin Dashboard

**User Story:** As an admin, I want a real-time overview of system activity and KPIs, so that I can monitor platform health and hazard trends at a glance.

#### Acceptance Criteria

1. THE Admin_Dashboard SHALL display KPI cards: total Hazard_Events, events in the last 24 hours, total registered Users, and active Users in the last 7 days.
2. THE Admin_Dashboard SHALL display a live feed of the 20 most recent Hazard_Event records, auto-refreshing every 15 seconds.
3. THE Admin_Dashboard SHALL display a system health indicator showing Backend connectivity status, model load status, and database record count.
4. WHEN the Backend is unreachable, THE Admin_Dashboard SHALL display a "Backend Offline" banner in red (#EF4444).

---

### Requirement 14: Admin User Management

**User Story:** As an admin, I want to view, ban, and unban users, so that I can enforce community standards and remove bad actors from the platform.

#### Acceptance Criteria

1. WHEN an Admin accesses the Users screen, THE Backend SHALL return all User records via GET /api/admin/users including id, email, username, role, is_active, is_banned, created_at, and last_login.
2. WHEN an Admin taps "Ban" on a User, THE App SHALL call PUT /api/admin/users/{id}/ban and THE Backend SHALL set is_banned=true and return HTTP 200.
3. WHEN an Admin taps "Unban" on a User, THE App SHALL call PUT /api/admin/users/{id}/unban and THE Backend SHALL set is_banned=false and return HTTP 200.
4. IF an Admin attempts to ban another Admin account, THEN THE Backend SHALL return HTTP 403 with the message "Cannot ban admin accounts".
5. THE Admin Users screen SHALL provide a search field that filters the displayed user list by username or email in real time.

---

### Requirement 15: Admin Analytics

**User Story:** As an admin, I want to view charts and trends of hazard detection data, so that I can identify high-risk areas and time patterns.

#### Acceptance Criteria

1. THE Admin Analytics screen SHALL display a line chart of daily Hazard_Event counts over the past 30 days, broken down by label.
2. THE Admin Analytics screen SHALL display a bar chart of Hazard_Event counts grouped by hour of day (0–23).
3. THE Admin Analytics screen SHALL display a pie chart of the overall distribution of hazard labels.
4. THE Admin Analytics screen SHALL display a calendar heatmap of daily detection counts for the current month.
5. THE Backend SHALL expose GET /api/admin/stats returning: total_events, events_last_24h, total_users, active_users_7d, events_by_label, events_by_day, events_by_hour.

---

### Requirement 16: Admin Reports and Export

**User Story:** As an admin, I want to generate and download CSV and PDF reports of hazard data, so that I can share findings with stakeholders.

#### Acceptance Criteria

1. WHEN an Admin requests a CSV export via GET /api/admin/export/csv, THE Backend SHALL return a CSV file containing all Hazard_Event records with columns: id, timestamp, latitude, longitude, label_name, confidence, p_sensor, p_vision.
2. WHEN an Admin requests a PDF report via GET /api/admin/export/pdf, THE Backend SHALL generate a PDF using reportlab containing a title page, summary statistics table, and top-10 hazard locations table.
3. THE Admin Reports screen SHALL display a list of previously generated report files with filename, generation timestamp, and a download/share button.
4. WHEN a report file is shared, THE App SHALL invoke the device share sheet via expo-sharing with the report file URI.

---

### Requirement 17: Push Notifications and Proximity Alerts

**User Story:** As a user, I want to receive push notifications when I approach a known hazard zone, so that I can slow down and prepare in advance.

#### Acceptance Criteria

1. WHEN the App is granted notification permissions, THE App SHALL register the device with Expo Push Notification service and store the push token on the Backend via POST /api/users/push-token.
2. WHEN the user's GPS location comes within the configured alert radius of a Hazard_Event with confidence ≥ 0.7, THE App SHALL trigger a local notification with the hazard label and distance.
3. THE proximity check SHALL run as a background task using expo-task-manager at a minimum interval of 30 seconds while the App is in the background.
4. WHERE an Admin broadcasts a system-wide alert, THE Backend SHALL send a push notification to all registered device tokens via the Expo Push API.
5. THE App SHALL provide a toggle in the Profile settings to enable or disable proximity alerts without revoking the notification permission.

---

### Requirement 18: Offline Mode and Sync Queue

**User Story:** As a user driving in areas with poor connectivity, I want the app to queue hazard detections locally and sync them when connectivity is restored, so that no detection data is lost.

#### Acceptance Criteria

1. WHEN a Spike is detected and the Backend is unreachable, THE Sensor_Service SHALL serialize the detection payload and append it to an offline sync queue persisted in AsyncStorage.
2. WHEN network connectivity is restored (detected via @react-native-community/netinfo), THE App SHALL dequeue and POST each queued payload to /api/predict-multimodal in FIFO order.
3. WHILE the sync queue contains items, THE App SHALL display a sync status indicator on the Monitor screen showing the count of pending items.
4. IF a queued payload fails to sync after 3 retry attempts, THEN THE App SHALL mark it as failed and remove it from the active queue.
5. THE offline sync queue SHALL persist across app restarts and SHALL NOT exceed 500 queued items; IF the limit is reached, THE App SHALL discard the oldest item before enqueuing a new one.

---

### Requirement 19: EAS Build and Configuration

**User Story:** As a developer, I want a complete EAS build configuration, so that I can produce a signed Android APK for distribution and testing.

#### Acceptance Criteria

1. THE App SHALL include an eas.json with three build profiles: development (internal, debug), preview (APK output, release), and production (AAB output, release).
2. THE app.json SHALL declare Android permissions: ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION, ACCESS_BACKGROUND_LOCATION, CAMERA, RECORD_AUDIO, VIBRATE, RECEIVE_BOOT_COMPLETED.
3. THE App SHALL read the Backend base URL, OpenWeatherMap API key, and Google Maps API key from a constants.ts file.
4. THE Backend SHALL read JWT_SECRET, ANTHROPIC_API_KEY, OPENAI_API_KEY, and OPENWEATHER_API_KEY from a config.py module.
5. THE Backend requirements.txt SHALL include: python-jose[cryptography], bcrypt, reportlab, anthropic, openai, python-multipart, aiofiles.

---

### Requirement 20: Serialization Round-Trip Integrity

**User Story:** As a developer, I want all data serialized to JSON or CSV to be deserializable back to an equivalent in-memory representation, so that no data is corrupted during export or sync.

#### Acceptance Criteria

1. FOR ALL valid Hazard_Event objects, serializing to JSON and parsing back SHALL produce an equivalent object with no data loss or type coercion errors.
2. THE CSV export module SHALL serialize any list of Hazard_Event objects to a valid RFC 4180 CSV string.
3. FOR ALL valid lists of Hazard_Event objects, parsing the CSV output and re-serializing SHALL produce an identical CSV string (round-trip property).
4. WHEN the offline sync queue is serialized to AsyncStorage and deserialized on app restart, THE App SHALL recover all queued payloads with no data loss or type coercion errors.
