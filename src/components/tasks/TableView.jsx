import { useMemo, useState, useCallback, memo } from 'react';
import { Spinner, useDisclosure, Chip } from '@heroui/react';
import { createColumnHelper } from '@tanstack/react-table';
import dayjs from 'dayjs';
import DataGrid from '../common/DataGrid';
import EntityChip from '../common/EntityChip';
import TaskDetailModalWrapper from './TaskDetailModalWrapper';
import useCurrentWorkspace from '../../hooks/useCurrentWorkspace';
import { useTasks } from '../../hooks/react-query/tasks/useTasks';

// Memoized cell components for better performance
const EmptyCell = memo(() => <span className="text-default-400">—</span>);
EmptyCell.displayName = 'EmptyCell';

const DateCell = memo(({ date, isCompleted }) => {
    if (!date) return <EmptyCell />;

    const taskDate = dayjs(date);
    const today = dayjs().startOf('day');
    const isOverdue = taskDate.isBefore(today);

    return (
        <span className={isOverdue && !isCompleted ? 'text-danger' : ''}>
            {Intl.DateTimeFormat(navigator.language, {
                dateStyle: 'medium',
            }).format(new Date(date))}
        </span>
    );
});
DateCell.displayName = 'DateCell';

const TaskNameCell = memo(({ name, isCompleted }) => (
    <span className={`${isCompleted ? 'line-through text-default-400' : ''}`}>{name}</span>
));
TaskNameCell.displayName = 'TaskNameCell';

// Main TableView component
const TableView = ({ items }) => {
    const [taskStatus, setTaskStatus] = useState({});
    const [selectedTask, setSelectedTask] = useState(null);
    const [pagination, setPagination] = useState({
        pageIndex: 0,
        pageSize: 15,
    });
    const [sorting, setSorting] = useState([{ id: 'status', desc: false }]);
    const {
        isOpen: isDetailModalOpen,
        onOpen: onDetailModalOpen,
        onClose: onDetailModalClose,
    } = useDisclosure();

    // Memoized row click handler
    const handleRowClick = useCallback(
        (task) => {
            setSelectedTask(task);
            onDetailModalOpen();
        },
        [onDetailModalOpen],
    );

    // Memoized modal close handler
    const handleModalOpenChange = useCallback(
        (isOpen) => {
            if (!isOpen) {
                onDetailModalClose();
            }
        },
        [onDetailModalClose],
    );

    // Memoized column helper
    const columnHelper = useMemo(() => createColumnHelper(), []);

    // Memoized columns with proper dependency array
    const columns = useMemo(
        () => [
            columnHelper.accessor('name', {
                header: 'Task',
                cell: ({ row }) => {
                    const task = row.original;
                    const status = taskStatus[task.id] !== undefined
                        ? (taskStatus[task.id] ? 'completed' : 'pending')
                        : task.status;
                    const isCompleted = status === 'completed';

                    return <TaskNameCell name={task.name} isCompleted={isCompleted} />;
                },
            }),
            columnHelper.accessor('status', {
                header: 'Status',
                cell: ({ row }) => {
                    const task = row.original;
                    const status = taskStatus[task.id] !== undefined
                        ? (taskStatus[task.id] ? 'completed' : 'pending')
                        : task.status;

                    // Determine color based on status
                    let chipColor;
                    let statusText;

                    if (status === 'completed') {
                        chipColor = 'success';
                        statusText = 'Completed';
                    } else if (status === 'in progress') {
                        chipColor = 'primary';
                        statusText = 'In Progress';
                    } else {
                        chipColor = 'default';
                        statusText = 'Pending';
                    }

                    return (
                        <div onClick={(e) => e.stopPropagation()}>
                            <Chip
                                size="sm"
                                variant="flat"
                                color={chipColor}
                            >
                                {statusText}
                            </Chip>
                        </div>
                    );
                },
                size: 120,
            }),
            columnHelper.accessor('date', {
                header: 'Date',
                cell: ({ getValue, row }) => {
                    const task = row.original;
                    const status = taskStatus[task.id] !== undefined
                        ? (taskStatus[task.id] ? 'completed' : 'pending')
                        : task.status;
                    const isCompleted = status === 'completed';

                    return <DateCell date={getValue()} isCompleted={isCompleted} />;
                },
            }),
            columnHelper.accessor('project_id', {
                header: 'Project',
                cell: ({ getValue }) => {
                    const projectId = getValue();
                    if (!projectId) return <EmptyCell />;
                    return (
                        <EntityChip type="project" entityId={projectId} size="sm" variant="light" />
                    );
                },
            }),
            columnHelper.accessor('milestone_id', {
                header: 'Milestone',
                cell: ({ getValue }) => {
                    const milestoneId = getValue();
                    if (!milestoneId) return <EmptyCell />;
                    return (
                        <EntityChip
                            type="milestone"
                            entityId={milestoneId}
                            size="sm"
                            variant="light"
                        />
                    );
                },
            }),
            columnHelper.accessor('tags', {
                header: 'Tags',
                cell: ({ row }) => {
                    const task = row.original;
                    const tags = task.tags || task.tag_id;

                    if (!tags || (Array.isArray(tags) && tags.length === 0)) {
                        return <EmptyCell />;
                    }

                    return <EntityChip type="tag" entityId={tags} size="sm" variant="light" />;
                },
            }),
            columnHelper.accessor('priority', {
                header: 'Priority',
                cell: ({ getValue }) => {
                    const priority = getValue();
                    if (priority === null || priority === undefined) {
                        return <EmptyCell />;
                    }

                    return (
                        <EntityChip type="priority" entityId={priority} size="sm" variant="light" />
                    );
                },
            }),
        ],
        [columnHelper, taskStatus],
    );

    // Handle pagination state changes
    const handlePaginationChange = useCallback((updatedPagination) => {
        setPagination(updatedPagination);
    }, []);

    // Handle sorting state changes
    const handleSortingChange = useCallback((updatedSorting) => {
        setSorting(updatedSorting);
    }, []);

    // Memoized options for DataGrid - moved above conditional returns to maintain hook order
    const gridOptions = useMemo(
        () => ({
            initialState: {
                sorting: sorting,
                pagination: pagination,
            },
            state: {
                sorting: sorting,
                pagination: pagination,
            },
            onSortingChange: handleSortingChange,
            onPaginationChange: handlePaginationChange,
            manualPagination: false, // Let the table handle pagination internally
        }),
        [sorting, pagination, handleSortingChange, handlePaginationChange],
    );

    return (
        <div className="border-1 border-content3 rounded-xl bg-content1">
            {selectedTask && (
                <TaskDetailModalWrapper
                    isOpen={isDetailModalOpen}
                    onOpenChange={handleModalOpenChange}
                    task={selectedTask}
                />
            )}
            <DataGrid
                data={items || []}
                columns={columns}
                options={gridOptions}
                onRowClick={handleRowClick}
                pageSize={pagination.pageSize}
            />
        </div>
    );
};

// Add displayName for better debugging
TableView.displayName = 'TableView';

export default TableView;
