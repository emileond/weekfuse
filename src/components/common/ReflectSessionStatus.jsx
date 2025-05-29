import { Chip } from '@heroui/react';
import { RiTimeLine, RiPlayLine, RiCheckLine } from 'react-icons/ri';

/**
 * Component to display a Reflect session status with appropriate color and icon
 * @param {Object} props - Component props
 * @param {string} props.status - The status of the reflect session ('pending', 'in progress', 'completed')
 * @param {string} props.size - Size of the chip ('sm', 'md', 'lg')
 * @param {string} props.variant - Variant of the chip ('solid', 'bordered', 'light', 'flat', 'dot')
 * @param {string} props.className - Additional CSS classes
 */
const ReflectSessionStatus = ({ status, size = 'sm', variant = 'dot', className = '' }) => {
    // Define status configurations
    const statusConfig = {
        pending: {
            color: 'warning',
            icon: <RiTimeLine fontSize="1rem" />,
            label: 'Pending',
        },
        'in progress': {
            color: 'primary',
            icon: <RiPlayLine fontSize="1rem" />,
            label: 'In Progress',
        },
        completed: {
            color: 'success',
            icon: <RiCheckLine fontSize="1rem" />,
            label: 'Completed',
        },
    };

    // Get configuration for the current status (default to pending if not found)
    const config = statusConfig[status?.toLowerCase()] || statusConfig.pending;

    return (
        <Chip
            size={size}
            variant={variant}
            color={config.color}
            // startContent={config.icon}
            className={className}
        >
            {status || config.label}
        </Chip>
    );
};

export default ReflectSessionStatus;
