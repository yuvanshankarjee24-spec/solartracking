# SolarTrack Live ☀️

**SolarTrack Live** is a presentation dashboard built for an Arduino dual-LDR single-axis solar tracker project. Designed specifically for live projector presentation (1920×1080), it provides high-contrast, crystal-clear typography, smooth 60fps telemetry waveforms, and an offline physics simulator.

---

## ⚡ Tech Stack & Architecture

- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS v4
- **Icons**: Lucide React
- **Serial Protocol**: Browser Web Serial API (Chrome, Edge, Opera) at **9600 baud**
- **Charts**: Custom lightweight SVG telemetry engine with rolling 60s / 5min memory window
- **Offline Ready**: Runs 100% offline without any backend server
- **Unit Tests**: Vitest suite for the Arduino serial line parser

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run unit tests
npm test

# 3. Start local development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in Google Chrome or Microsoft Edge.

---

## 🖥️ Projector & Presentation Tips

When presenting this project to an audience, panel, or class on a projector:

1. **Activate Fullscreen Presentation View**:
   - Click the **"Projector View"** button in the top navigation bar (or press `F11`). This scales typography and visual dials for effortless viewing from 15+ feet away.
2. **Offline Hardware-Free Demonstration**:
   - If the physical Arduino is not connected, click **"Use Simulator"** (or **"Launch Simulator Demo"**).
   - Click **"Simulate Cloud"** to demonstrate how the tracker maintains deadband equilibrium when irradiance drops suddenly.
   - Click **"Simulate Sunrise Reset"** to show how the solar panel slews from Sunset (150° West) back to Sunrise (30° East).
3. **Explaining the Key Metrics**:
   - **Lambert Cosine Law & Solar Gain (+% Energy)**: Emphasize that while a fixed horizontal or 90° panel suffers from angular incidence losses, the tracker maintains near $0^\circ$ optical incidence angle, increasing cumulative energy harvest by +25% to +45%.
   - **Dual-LDR Balance Meter**: Explain the shaded green deadband zone ($\pm 10$). Point out that when $\Delta\text{Diff} = \text{East} - \text{West}$ stays within the deadband, the servo holds position, preventing motor hunting and saving servo gear wear.
   - **Reversal Counter**: Shows motor direction changes; low reversal counts confirm that the hysteresis deadband is properly tuned.

---

## 🔌 Arduino Serial Protocol Reference

### Telemetry Line Formats (9600 Baud)

- **Demo Mode Line**:
  ```text
  [t=12s]  [DEMO] Sun: 72  East: 592  West: 609  Diff: -17  Target: 72  Servo: 70
  ```
- **Live Mode Line**:
  ```text
  [t=12s]  East: 592  West: 609  Diff: -17  Target: 72  Servo: 70
  ```

### Interactive Serial Commands (terminated with `\n`)

| Command | Description | Example Response |
| :--- | :--- | :--- |
| `pause` | Freezes servo at current position, stops tracking loop | `OK: tracking paused` |
| `resume` | Resumes active dual-LDR sun tracking | `OK: tracking resumed` |
| `home` | Moves servo to home position (40°) and pauses tracking | `OK: going home (40°), tracking paused` |
| `angle <30-150>` | Manually slews servo to a specific degree | `OK: moving to 110, tracking paused` |
| `threshold <0-1023>` | Updates optical deadband threshold | `OK: threshold = 15` |
| `print <ms>` | Sets serial telemetry output rate in milliseconds | `OK: printing every 1000 ms` |
| `demo` | Starts simulated sun sweep (default 20 seconds) | `OK: DEMO ON - sun crosses in 20 s` |
| `demo <sec>` | Starts demo with custom sweep duration (5 to 600s) | `OK: DEMO ON - sun crosses in 60 s` |
| `demo off` | Exits demo mode and switches back to physical LDRs | `OK: DEMO OFF - using real LDRs` |
| `status` | Queries tracker operational parameters | `Mode: LIVE  Tracking: ON  Threshold: 10  Print every: 1000 ms  Target: 90  Servo: 90` |
| `help` | Prints supported commands list | `Available commands: pause, resume, ...` |

---

## 📁 Project Structure

```text
solar-tracker/
├── src/
│   ├── components/
│   │   ├── Header.tsx                 # Top bar with status pill, uptime, session tools
│   │   ├── HeroSunArc.tsx             # 30°-150° sky arc, animated sun, rotating PV array
│   │   ├── ServoGaugeCard.tsx         # Circular dial with needle, target marker, lag badge
│   │   ├── LDRComparisonCard.tsx      # East/West bars, horizontal balance deadband meter
│   │   ├── LiveCharts.tsx             # 3 synchronized real-time SVG waveform charts
│   │   ├── SmartMetricsRow.tsx        # Lock quality ring, light classifier, cosine gain
│   │   ├── ControlPanel.tsx           # Actuator control deck, sliders, rate chips
│   │   ├── EventLogTerminal.tsx       # Color-coded serial terminal & interactive console
│   │   ├── SimulatorControlsBanner.tsx# Cloud injection and sunrise reset controls
│   │   └── EmptyState.tsx             # Friendly connection onboarding illustration
│   ├── hooks/
│   │   ├── useSerial.ts               # Web Serial API manager at 9600 baud
│   │   ├── useSimulator.ts            # High-fidelity Arduino physics & tracking simulation
│   │   └── useTelemetry.ts            # Telemetry buffering, smart metrics, and CSV export
│   ├── utils/
│   │   ├── parser.ts                  # Regex line parser & chunk LineBuffer
│   │   ├── parser.test.ts             # Parser unit test suite
│   │   └── telemetry.ts               # Cosine law math, odometer, and rolling statistics
│   ├── types/
│   │   └── index.ts                   # Comprehensive TypeScript definitions
│   ├── App.tsx                        # Master layout and state integration
│   ├── index.css                      # Tailwind v4 theme, fonts, projector styles
│   └── main.tsx                       # React root entrypoint
├── package.json
└── vite.config.ts
```

---

## 📄 License

MIT. Built with Google Antigravity.
