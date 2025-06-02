# Station Assignment Scheduler - Import Page

## Overview
The `/import` page implements the first step in the linear workflow for the Station Assignment Scheduler application. It allows users to import personnel names and configure their shift availability constraints.

## Features Implemented

### Core Functionality
- ✅ **Manual name entry** - Add individual names through a form interface
- ✅ **CSV bulk import** - Upload CSV files with names and shift exclusions
- ✅ **Session-only storage** - Data stored only in `sessionStorage`, cleared on tab close
- ✅ **Shift exclusions** - Boolean flags for morning/evening shift restrictions
- ✅ **Search and filter** - Find specific names in the imported list
- ✅ **Edit capabilities** - Modify shift exclusions after import
- ✅ **Remove entries** - Delete individual entries before proceeding

### Privacy & Data Handling
- ✅ **Client-side processing** - All operations performed in browser
- ✅ **No persistent storage** - Uses only `sessionStorage`
- ✅ **GDPR compliance** - Clear privacy notice and session-based consent
- ✅ **Automatic cleanup** - Data cleared on tab close or export

### User Interface
- ✅ **Responsive design** - Works on desktop and mobile devices
- ✅ **Greyscale theme** - Minimalist design using #000-#FFF palette
- ✅ **shadcn/ui components** - Consistent, accessible UI components
- ✅ **AA accessibility** - Proper contrast ratios and touch targets

### Data Validation
- ✅ **Duplicate prevention** - Prevents importing duplicate names
- ✅ **CSV format validation** - Validates file type and content
- ✅ **Error reporting** - Clear feedback on import issues
- ✅ **Flexible parsing** - Handles various boolean formats (true/false, yes/no, 1/0)

## Components Used

### shadcn/ui Components
- `Card` - Content organization and visual hierarchy
- `Button` - Actions (Add, Export, Clear, Remove)
- `Input` - Text input and file upload
- `Table` - Data display with headers and sorting
- `Checkbox` - Shift exclusion toggles
- `Label` - Form field labels
- `Alert` - Privacy notices and error messages
- `Separator` - Visual content separation

### Icons (lucide-react)
- `Upload` - File import indication
- `Plus` - Add new entry
- `Search` - Search functionality
- `Trash2` - Delete actions
- `Download` - Export functionality
- `AlertCircle` - Error states
- `Info` - Information notices

## File Structure

```
app/import/page.tsx           # Main import page component
lib/types/person.ts           # Person and related type definitions
lib/utils/storage.ts          # Session storage utilities
lib/utils/csv.ts              # CSV parsing and generation
public/sample-import.csv      # Sample CSV file for users
```

## Usage Flow

1. **Access page** - Navigate to `/import` from home page
2. **Add names** - Use manual entry or CSV upload
3. **Configure exclusions** - Set morning/evening shift restrictions
4. **Review data** - Search, edit, or remove entries as needed
5. **Continue** - Proceed to configuration page when ready

## Technical Implementation

### Session Storage
- Uses `sessionStorage` API for temporary data persistence
- Automatic save on data changes
- Graceful handling of storage unavailability

### CSV Processing
- Supports headers and headerless files
- Flexible boolean parsing (true/false, yes/no, 1/0)
- Comprehensive error reporting
- UTF-8 encoding support

### Form Handling
- Real-time validation
- Enter key submission for manual entry
- File type validation for uploads
- Automatic form resets after successful operations

## Privacy Compliance

The implementation follows strict privacy guidelines:
- No server-side data storage
- Session-only data retention
- Clear user notifications about data lifecycle
- Explicit consent through action-based model
- Automatic cleanup mechanisms

## Next Steps

The import page integrates into the linear workflow:
- **Current**: Import → **Next**: Configuration → Generation → Adjustment → Export

Users can proceed to the configuration page once they have imported and reviewed their personnel data.
