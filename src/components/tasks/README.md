# Tasks Components

## NewTaskModal

A modal component for creating new tasks. It can be triggered from anywhere in the application.

### Usage

```jsx
import { NewTaskModal } from '../components/tasks';
import { Button, useDisclosure } from '@heroui/react';

// Basic usage with default triggerv0 button
function MyComponent() {
    return (
        <div>
            <h1>My Tasks Page</h1>
            <NewTaskModal />
        </div>
    );
}

// Custom triggerv0
function MyComponentWithCustomTrigger() {
    return (
        <div>
            <h1>My Tasks Page</h1>
            <NewTaskModal
                trigger={<Button color="secondary">Add New Task</Button>}
            />
        </div>
    );
}

// Controlled from outside (recommended)
function MyControlledComponent() {
    const { isOpen, onOpenChange } = useDisclosure();

    return (
        <div>
            <h1>My Tasks Page</h1>
            <Button color="primary" onPress={() => onOpenChange(true)}>
                Open Task Modal
            </Button>
            <NewTaskModal
                isOpen={isOpen}
                onOpenChange={onOpenChange}
            />
        </div>
    );
}
```

### Props

| Prop         | Type         | Description                                                                                                 |
|--------------|--------------|-------------------------------------------------------------------------------------------------------------|
| trigger      | ReactElement | Optional. A custom element to trigger the modal. If not provided, a default "New Task" button will be used. |
| isOpen       | boolean      | Optional. Controls whether the modal is open. If provided, the component will be controlled from outside.   |
| onOpenChange | function     | Optional. Callback fired when the open state of the modal changes. Required when using `isOpen`.            |

### Features

- Form with title and description fields
- Form validation using react-hook-form
- Integration with useCreateTask hook for creating tasks
- Success and error notifications using toast
- Reset form on close or submit
