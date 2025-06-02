# Station Assignment Scheduler

A Next.js application for fair distribution of personnel across multiple station locations throughout a weekly schedule (Monday evening through Saturday evening).

## Features

✅ **German CSV Import** - Import personnel data with German CSV format (Vorname;Nachname)  
✅ **Station Management** - Configure 1-10 stations with CRUD operations  
✅ **2-Person Staffing** - Each station requires exactly 2 persons per time slot  
✅ **Fair Scheduling** - Constraint-based algorithm ensuring ±1 assignment per person  
✅ **Multiple Views** - Calendar, person, and station-based schedule displays  
✅ **CSV Export** - German format export with GDPR-compliant data cleanup  
✅ **Privacy Compliant** - Session-only storage, automatic cleanup  
✅ **German Localization** - Full German interface with responsive design  

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) to start the application.

## Workflow

1. **Import** (`/import`) - Add personnel via CSV upload or manual entry
2. **Configure** (`/configuration`) - Set up station locations and constraints  
3. **Generate** (`/schedule`) - Create fair schedule using constraint-based algorithm
4. **Display** (`/display`) - View schedule in multiple formats (calendar/person/station)
5. **Export** - Download German CSV with automatic data cleanup

## Technical Details

- **Framework**: Next.js 15.3.2 with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Storage**: Session-only (GDPR compliant)
- **Algorithm**: Fair distribution with constraint handling (2 persons per station)
- **Format**: German CSV support (semicolon separators)

## Privacy & Compliance

- All data stored in browser session only
- Automatic cleanup on tab close or export
- No server-side data storage
- GDPR-compliant privacy notices

---

*Production-ready build - All SRS requirements implemented*

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
