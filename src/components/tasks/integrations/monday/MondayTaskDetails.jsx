import useCurrentWorkspace from '../../../../hooks/useCurrentWorkspace.js';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Chip, Link } from '@heroui/react';
import { RiExternalLinkLine, RiKanbanView2, RiListUnordered } from 'react-icons/ri';
import { colorContrast } from '../../../../utils/colorContrast.js';

const MondayTaskDetails = ({ external_data }) => {
    const [currentWorkspace] = useCurrentWorkspace();
    const queryClient = useQueryClient();
    const [isLoading, setIsLoading] = useState(false);

    // Function to convert Monday.com colors to hex
    function mondayColorToHex(color) {
        // Monday.com uses color names like "dark_blue", "light_green", etc.
        // This is a simplified mapping - you might need to adjust based on actual Monday.com colors
        const colorMap = {
            dark_blue: '#0073ea',
            light_blue: '#66ccff',
            blue: '#00a9ff',
            turquoise: '#00d1c1',
            green: '#00c875',
            light_green: '#a9e4a3',
            yellow: '#ffcb00',
            orange: '#ff9d48',
            red: '#e2445c',
            pink: '#ff5ac4',
            purple: '#a25ddc',
            dark_purple: '#784bd1',
            gray: '#808080',
            black: '#333333',
            // Add more colors as needed
        };

        return colorMap[color] || '#90a1b9'; // Default fallback color
    }

    // Helper to get a readable label for a column
    const getColumnLabel = (column) => {
        if (!column) return null;
        
        // Try to parse the value if it exists
        if (column.value) {
            try {
                const valueObj = JSON.parse(column.value);
                // Different column types have different value structures
                if (valueObj.label) return valueObj.label;
                if (valueObj.text) return valueObj.text;
            } catch (e) {
                // If parsing fails, fall back to text or title
            }
        }
        
        return column.text || column.title || null;
    };

    // Get board information
    const boardInfo = external_data?.board_name ? (
        <div className="flex flex-col gap-1">
            <label className="text-sm">Board</label>
            <Chip
                color="default"
                className="text-default-700"
                size="sm"
                variant="bordered"
                startContent={<RiKanbanView2 fontSize=".9rem" />}
                endContent={<RiExternalLinkLine fontSize=".9rem" />}
            >
                <Link
                    className="text-sm text-default-700"
                    isExternal
                    href={`https://monday.com/boards/${external_data.board_id}`}
                >
                    {external_data.board_name}
                </Link>
            </Chip>
        </div>
    ) : null;

    // Get status information
    const statusColumn = external_data?.column_values?.find(
        col => col.type === 'status' || col.title.toLowerCase().includes('status')
    );
    
    const statusInfo = statusColumn ? (
        <div className="flex flex-col gap-1">
            <label className="text-sm">Status</label>
            {(() => {
                try {
                    const statusValue = JSON.parse(statusColumn.value || '{}');
                    const statusLabel = statusValue.label || 'Unknown';
                    const statusColor = statusValue.color ? mondayColorToHex(statusValue.color) : '#90a1b9';
                    
                    return (
                        <Chip
                            size="sm"
                            style={{
                                background: statusColor,
                                color: colorContrast(statusColor, 'y'),
                            }}
                        >
                            {statusLabel}
                        </Chip>
                    );
                } catch (e) {
                    return (
                        <Chip
                            color="default"
                            className="text-default-700"
                            size="sm"
                            variant="bordered"
                        >
                            {getColumnLabel(statusColumn) || 'Unknown'}
                        </Chip>
                    );
                }
            })()}
        </div>
    ) : null;

    // Get priority information
    const priorityColumn = external_data?.column_values?.find(
        col => col.title.toLowerCase().includes('priority')
    );
    
    const priorityInfo = priorityColumn ? (
        <div className="flex flex-col gap-1">
            <label className="text-sm">Priority</label>
            <Chip
                color="default"
                className="text-default-700"
                size="sm"
                variant="bordered"
            >
                {getColumnLabel(priorityColumn) || 'Not set'}
            </Chip>
        </div>
    ) : null;

    // Get due date information
    const dueDateColumn = external_data?.column_values?.find(
        col => col.title.toLowerCase().includes('due') || col.title.toLowerCase().includes('date')
    );
    
    const dueDateInfo = dueDateColumn ? (
        <div className="flex flex-col gap-1">
            <label className="text-sm">Due date</label>
            <div className="text-sm">
                {getColumnLabel(dueDateColumn) || 'Not set'}
            </div>
        </div>
    ) : null;

    // Get assignees information
    const peopleColumn = external_data?.column_values?.find(
        col => col.title.toLowerCase().includes('person') || col.title.toLowerCase().includes('assignee')
    );
    
    const peopleInfo = peopleColumn ? (
        <div className="flex flex-col gap-1">
            <label className="text-sm">Assignees</label>
            <div className="text-sm">
                {getColumnLabel(peopleColumn) || 'Not assigned'}
            </div>
        </div>
    ) : null;

    // Get tags/labels information
    const tagsColumn = external_data?.column_values?.find(
        col => col.title.toLowerCase().includes('tag') || col.title.toLowerCase().includes('label')
    );
    
    const tagsInfo = tagsColumn ? (
        <div className="flex flex-col gap-1">
            <label className="text-sm">Tags</label>
            <div className="flex flex-wrap gap-1">
                {(() => {
                    try {
                        const tagsValue = JSON.parse(tagsColumn.value || '{}');
                        if (tagsValue.labels && Array.isArray(tagsValue.labels)) {
                            return tagsValue.labels.map((label, index) => (
                                <Chip key={index} size="sm">
                                    {label}
                                </Chip>
                            ));
                        }
                        return <span className="text-sm">No tags</span>;
                    } catch (e) {
                        return <span className="text-sm">{getColumnLabel(tagsColumn) || 'No tags'}</span>;
                    }
                })()}
            </div>
        </div>
    ) : null;

    return (
        <>
            {boardInfo}
            {statusInfo}
            {priorityInfo}
            {dueDateInfo}
            {peopleInfo}
            {tagsInfo}
        </>
    );
};

export default MondayTaskDetails;