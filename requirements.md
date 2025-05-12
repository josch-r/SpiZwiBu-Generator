# Software Requirements Specification (SRS): Station Assignment Scheduler Application

## Introduction

**Purpose**  
This document specifies the requirements for the Station Assignment Scheduler, a Next.js web application designed to automate the fair distribution of personnel across multiple station locations throughout a weekly schedule. The application will generate balanced schedules that respect individual availability constraints and provide exportable results.

**Scope**  
The Station Assignment Scheduler will enable users to import a list of names, configure station locations, generate schedules that distribute staff fairly across stations and time slots, and export the resulting schedules. The system will operate as a standalone web application requiring no server-side installation beyond the initial deployment.

**User Characteristics**  
The primary users will be supervisors or coordinators responsible for station assignments who need an efficient way to create fair schedules without manual effort. Users are expected to have basic computer skills but no programming knowledge.

---

## System Requirements

### Technical Requirements

- **Development Environment**:  
  - Node.js 18.18 or later  
  - Compatible with macOS, Windows (including WSL), and Linux  
  - Modern web browsers support (Chrome 64+, Edge 79+, Firefox 67+, Opera 51+, Safari 12+)

- **Framework Requirements**:  
  - Next.js (latest stable version)  
  - React (latest stable version)  
  - TypeScript implementation (recommended)
  - TailwindCSS 
  - Shadcn/ui

---

## Design

- The application shall use **Tailwind CSS** for styling with **shadcn/ui** components.
- The interface shall maintain a **greyscale color scheme** (#000-#FFF range).
- All interactive elements shall maintain AA accessibility contrast ratios.
- Minimalist design with clear visual hierarchy.
- Efficient use of screen space through grid layouts.
- Clean typography using system fonts (San Francisco/Helvetica Neue/Segoe UI).
- No decorative elements beyond functional UI components.
- Optimized layout for desktop (≥768px) and mobile (<768px) views.
- Adaptive component rendering for different viewport sizes.
- Touch-friendly controls for mobile devices.

---

## Memory and Privacy

- **No persistent storage**: The application shall not use databases or long-term storage.
- **Session-only retention**: Data persists only during active browser session using `sessionStorage`.
- **Automatic cleanup**: All user data clears when:
  - Browser tab closes
  - CSV export completes
  - Explicit user request via "New Session" button
- **Client-side processing**: All data processing occurs in the browser.
- **No tracking**: No analytics or user behavior monitoring.
- **GDPR compliance**: Explicit user consent for data processing through action-based consent model.
  - Data entry = consent to temporary processing
  - Export = consent to CSV generation

---

## Functional Requirements

### Core Features

#### 1. Name Import System

- The application shall provide an interface to import a table of names.
- The system shall support manual entry of names through a form interface.
- The system shall support CSV file upload for bulk name import.
- Each name record shall include fields for name and shift exclusions (morning/evening).
- **Data lifecycle**: Imported names exist only in memory until export or tab closure.
- **Session storage**: Temporary storage limited to `sessionStorage`.

#### 2. Station Configuration

- The application shall include four default stations: Pool, TT-Platten, Klettergerüst, and Spieletheke.
- Users shall be able to add, remove, or rename stations through a configuration interface.
- The system shall maintain a minimum of one station and support up to ten stations.
- Station data shall persist only during the session.

#### 3. Schedule Generation Engine

- The system shall generate schedules covering 11 time slots (Monday evening through Saturday evening).
- The system shall distribute two time slots per day: morning and evening.
- The schedule shall start from Monday evening and end on Saturday evening.
- The system shall distribute names across stations in a mathematically fair manner using constraint-based scheduling algorithms.
- The distribution algorithm shall ensure each person is assigned approximately the same number of shifts (±1).
- The system shall respect exclusion preferences, preventing specific names from being assigned to either morning or evening shifts.
- The algorithm shall provide fair distribution across different station types.

#### 4. Schedule Display

- The application shall display the generated schedule in a weekly calendar format.
- The interface shall clearly distinguish between morning and evening shifts.
- Users shall be able to view assignments by day, by station, or by person.
- The system shall provide visual indicators for fair distribution metrics.

#### 5. CSV Export Functionality

- The application shall include a function to export the generated schedule as a CSV file.
- The exported CSV shall include columns for day, time slot, station, and assigned person.
- The filename shall include the date of generation.
- The system shall provide immediate download through the browser's native download capability.
- **Export finalization**: Post-export cleanup removes all personal data.

#### 6. Manual Override System

- The application shall allow users to manually adjust automatically generated schedules.
- The system shall provide warnings when manual adjustments affect fairness metrics.
- The system shall preserve manual adjustments during regeneration of partial schedules.

#### 7. Workflow Structure

- **Linear progression**:
  1. Data input → 2. Configuration → 3. Generation → 4. Adjustment → 5. Export
- **No backtrack retention**: Returning to previous steps clears subsequent data.

---

## Non-functional Requirements

### Usability

- The user interface shall be intuitive and require minimal training.
- The application shall be responsive and usable on both desktop and mobile devices.
- All major functions shall be accessible within three clicks from the landing page.

### Performance

- Schedule generation shall complete within 5 seconds for up to 50 names.
- Page loads and UI interactions shall respond within 200ms.
- The application shall handle up to 200 names without performance degradation.

### Reliability

- **Session persistence**: Maintain state during single browsing session.
- **Data loss prevention**: Warn users before closing tab with unsaved changes.
- **Storage limits**: Cap stored data at 5MB per session.

### Security

- **Output encoding**: CSV exports use proper text encoding and escaping.
- **No PII retention**: No personal data remains after session ends.

### Maintainability

- The codebase shall follow Next.js best practices and component structure.
- The scheduling algorithm shall be implemented as a separate, testable module.
- Configuration parameters shall be centralized for easy modification.

---

## Data Models

### Person Model

interface Person {
id: string;
name: string;
excludeMorningShifts: boolean;
excludeEveningShifts: boolean;
}


### Station Model

interface Station {
id: string;
name: string;
active: boolean;
}


### Assignment Model

interface Assignment {
dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday';
timeSlot: 'Morning' | 'Evening';
stationId: string;
personId: string;
}


---

## User Interface Requirements

### Home Screen

- Navigation menu with access to all major functions.
- Quick status overview of current schedule.
- Action buttons for primary functions (Import, Generate, Export).
- **New session button**: Prominently displayed as entry point.
- **Session status indicator**: Shows active data lifetime.
- **Clearance controls**: Quick access to data purge functions.

### Name Management Screen

- Table display of all imported names.
- Checkboxes for morning/evening exclusions for each name.
- Bulk import/export controls.
- Search and filter functionality.

### Station Configuration Screen

- List of active stations with toggle controls.
- Interface to add new stations or rename existing ones.
- Drag-and-drop reordering capability.

### Schedule View Screen

- Calendar-style weekly view of all assignments.
- Toggle between day, station, and person-centric views.
- Visual fairness indicators showing distribution metrics.
- Export button prominently displayed.

### Export Screen

- **Post-export actions**:
  - "New session" button immediately clears data.
  - Auto-redirect to home screen after 60 seconds.
  - Visual confirmation of successful data deletion.

---

## Implementation Constraints

### Development Constraints

- The application must be implemented using the Next.js framework.
- The application must use Tailwind CSS with shadcn/ui components.
- Color scheme restricted to greyscale palette with opacity variations.
- Iconography limited to lucide-react icon set.
- Client-side state management should be implemented using React Context or Redux.
- The scheduling algorithm should use constraint satisfaction principles.

### Deployment Constraints

- The application must function as a static site or with minimal server-side requirements.
- All user data must be stored locally (session only).
- The application should support deployment on Vercel or similar Next.js-compatible platforms.

### Data Constraints

- No IndexedDB: Storage limited to `sessionStorage` API.
- Memory limits: Optimize for ≤100 names in memory.
- No server communication: All functionality must work offline after initial load.

---

## Conclusion

This specification outlines the requirements for a Next.js web application designed to fairly distribute personnel across multiple station locations throughout a weekly schedule. The application will support configurable stations, respect individual availability constraints, generate balanced schedules, and provide CSV export functionality.  
**All data is handled in-memory for privacy, and the application features a minimalist, greyscale design for clarity and efficiency.**  
When implemented according to these specifications, the system will significantly streamline the scheduling process while ensuring equitable distribution of responsibilities, and full compliance with data privacy standards.
