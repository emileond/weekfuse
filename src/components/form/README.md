# Form Components

## DatePicker

A component for selecting a single date with options for "Today", "Tomorrow", or adding to backlog.

### Usage

```jsx
import DatePicker from './components/form/DatePicker';

// Basic usage
<DatePicker onChange={(date) => console.log(date)} />

// With default value
<DatePicker defaultValue={new Date()} onChange={(date) => console.log(date)} />

// With custom trigger
<DatePicker 
  trigger={<button>Custom Trigger</button>}
  onChange={(date) => console.log(date)} 
/>
```

## RangeDatepicker

A component for selecting a date range with preset options for "last 7 days" and "last 2 weeks".

### Usage

```jsx
import RangeDatepicker from './components/form/RangeDatepicker';

// Basic usage
<RangeDatepicker onChange={(range) => console.log(range)} />

// With default value
const defaultRange = {
  from: new Date(2023, 0, 1),
  to: new Date(2023, 0, 7)
};
<RangeDatepicker defaultValue={defaultRange} onChange={(range) => console.log(range)} />

// With custom trigger
<RangeDatepicker 
  trigger={<button>Custom Trigger</button>}
  onChange={(range) => console.log(range)} 
/>
```

### Props

Both components accept the following props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| defaultValue | Date or {from: Date, to: Date} | undefined | The default selected date or date range |
| trigger | ReactNode | undefined | Custom trigger element |
| placement | string | 'bottom' | Popover placement ('top', 'bottom', 'left', 'right') |
| onChange | function | undefined | Callback function called when date/range changes |

### Date Range Format

The RangeDatepicker component uses the following format for date ranges:

```js
{
  from: Date, // Start date
  to: Date    // End date
}
```

When using the preset options:
- "Last 7 days" selects the range from 7 days ago to today
- "Last 2 weeks" selects the range from 14 days ago to today