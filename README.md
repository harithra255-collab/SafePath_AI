# SafePath AI

Design and build a premium Android mobile application called **SafePath AI – Intelligent Real-Time Travel Safety Assistant**. The application should look like a production-ready app available on the Google Play Store, with a clean, modern, AI-powered design inspired by Google Material 3. Use a professional Blue, Emerald Green, and White theme with rounded cards, soft shadows, smooth gradients, glassmorphism where appropriate, premium typography, micro-interactions, Lottie animations, and fluid page transitions. The app must support both Light Mode and Dark Mode with seamless switching and remember the user's preference.

The application should open with a beautiful animated splash screen displaying the SafePath AI logo, AI-inspired loading animation, and the tagline **"Smarter Routes. Safer Journeys."** After the animation, automatically navigate to the Home screen.

The Home screen should include a Google Maps-style interface occupying most of the screen, a destination search bar with autocomplete, voice search, a "Use Current Location" button, floating action buttons for location and SOS, and a modern bottom navigation bar. Integrate Google Maps so users can search for locations and automatically place markers, zoom the map, and display routes. Use realistic dummy data to simulate AI behaviour while keeping the application fully interactive.

Create a comprehensive dummy database containing locations such as Chennai Railway Station, Chennai Airport, Marina Beach, Coimbatore Bus Stand, Erode Railway Station, Ooty Bus Stand, Bengaluru Majestic, Kongu Engineering College, and several other popular Indian landmarks. Each location should contain AI Safety Score, crime history, weather condition, crowd density, traffic congestion, street lighting quality, road condition, women safety rating, emergency reports, police presence, emergency response time, nearby police stations, hospitals, pharmacies, emergency shelters, petrol stations, and public transport availability.

Whenever the user searches for a destination, automatically move the map to that location, place a destination marker, draw multiple routes, calculate a simulated AI Safety Score using the dummy data, and display all related information throughout the application without requiring any backend.

Display a large animated AI Safety Score card with a circular progress indicator. Use Green for Safe, Yellow for Moderate Risk, and Red for High Risk. Animate the score calculation and make the card visually impressive.

Include an Explainable AI section showing exactly why the score was generated. Display beautiful cards with icons for Crime History, Weather, Traffic, Crowd Density, Street Lighting, Road Condition, Women Safety, Police Presence, Emergency Reports, Public Transport, Emergency Response Time, Night Visibility, Flood Risk, Construction Work, and Air Quality. Every factor should display a status, percentage impact, confidence score, and short explanation.

Generate a natural-language AI Travel Summary below the safety score. For example: "This destination is considered safe for daytime travel due to low crime, good lighting, active police patrols, and moderate traffic. Heavy rainfall may slightly reduce visibility. The safest recommended route avoids crowded intersections." Generate summaries dynamically using the dummy data.

Provide Route Comparison cards displaying both the Safest Route and the Fastest Route. Each route should include travel time, distance, safety score, traffic level, road quality, lighting condition, weather impact, crowd density, toll information, accident history, and estimated arrival time. Include buttons for View Route, Navigate, and Why This Route. Selecting "Why This Route" should display an Explainable AI explanation showing why that route was recommended based on multiple safety factors.

The Google Maps interface should support animated route drawing, coloured route lines, current location marker, destination marker, nearby emergency service markers, risk heatmap overlay, traffic layer, weather layer, incident markers, police markers, hospital markers, pharmacy markers, and shelter markers. Support pinch-to-zoom, map rotation, and smooth camera animations.

Include a Route Playback feature that simulates travelling from the source to the destination with an animated moving vehicle, current speed, distance remaining, estimated arrival time, voice guidance simulation, and live AI notifications.

Create a Nearby Emergency Services section displaying modern cards for Police Stations, Hospitals, Ambulance Services, Pharmacies, Fire Stations, Emergency Shelters, Petrol Stations, Public Toilets, and Help Centres. Selecting any service should highlight its marker on the map and simulate navigation.

Add a large floating SOS Emergency button visible throughout the application. When pressed, display an emergency countdown animation, simulate sharing the user's location with emergency contacts, notify the nearest police station, notify the nearest hospital, trigger a siren animation, and display confirmation messages. Since this is a prototype, simulate all emergency actions without actually contacting anyone.

Include a Report Incident page allowing users to report accidents, theft, harassment, suspicious activity, unsafe areas, roadblocks, floods, fires, broken streetlights, medical emergencies, or other hazards. Allow photo upload, GPS location, incident description, severity level, and category selection. Save all reports locally and immediately display them as community alerts on the map using dummy data.

Create a Community Alerts page showing recent incidents, crime alerts, accidents, roadblocks, floods, traffic congestion, heavy rain warnings, public events, and crowd alerts in a modern timeline layout with icons, timestamps, severity indicators, and map integration.

Add an AI Chat Assistant where users can ask travel safety questions such as "Is this area safe after 10 PM?", "Which route is safest?", "Are there any recent incidents nearby?", or "Where is the nearest hospital?". Generate intelligent responses using the dummy database to simulate AI reasoning.

Create a detailed User Profile page containing profile photo, name, emergency contacts, blood group, medical information, allergies, favourite places, travel history, downloaded offline maps, safety statistics, and achievements.

Include a Settings page with Light Mode, Dark Mode, Automatic Theme, Language Selection, Voice Navigation, Notification Preferences, Offline Maps, Privacy Controls, Emergency Contact Management, Accessibility Settings, Font Size, Location Permissions, and App Information.

Implement complete multilingual support with instant switching between English, Tamil, Hindi, Telugu, Kannada, and Malayalam without restarting the application. Every label, button, menu, and screen should update immediately.

Implement a fully functional Offline Mode. Display offline status, cached safety information, downloaded maps, recent searches, previously viewed routes, emergency contacts, and locally stored incident reports. The application should continue functioning using cached dummy data when offline.

Implement Voice Search allowing users to speak the destination name. Convert speech to text, search the dummy database, and automatically update the map and AI Safety Score.

Include an AI Notifications Centre displaying realistic alerts such as Heavy Rain Ahead, Accident Reported, High Crime Area, Festival Crowd, Road Closure, Flood Warning, Police Advisory, and Emergency Weather Alert. Use animated notification cards.

Create an Analytics Dashboard showing Total Trips, Safe Trips, Moderate Risk Trips, High Risk Trips, Average Safety Score, Community Reports Submitted, SOS Usage, Weekly Safety Trend, Monthly Travel Analytics, Risk Distribution, and AI Recommendation Accuracy using animated charts and graphs.

Add beautiful onboarding screens introducing the application's AI-powered travel safety features before first launch.

Include loading skeletons, shimmer effects, animated cards, ripple effects, hero animations, smooth scrolling, page transitions, floating action buttons, premium icons, Material motion animations, and subtle sound effects to create a highly polished experience.

Use realistic dummy JSON data throughout the application to simulate AI predictions, search results, route calculations, emergency services, community reports, safety analysis, and chatbot responses. Ensure that every button, screen, navigation item, card, search function, language switch, dark mode toggle, route selection, report submission, chatbot interaction, and settings option is fully interactive, even if powered entirely by dummy data.

The final result should be a complete, professional, production-quality Android application prototype with a premium UI/UX, fully functional navigation, realistic Google Maps integration, AI-inspired behaviour, multilingual support, dark mode, offline mode, voice search, interactive animations, responsive layouts, and polished user experience suitable for presenting at a national AI ideathon. The application should appear indistinguishable from a real commercial AI travel safety application ready for launch.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://safepath-ai-travel-assistant.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/91d0d426-1d2e-462e-8f78-c3338c5d2604).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
#   S a f e P a t h _ A I  
 