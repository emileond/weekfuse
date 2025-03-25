import {
    Table,
    TableHeader,
    TableBody,
    TableColumn,
    TableRow,
    TableCell,
    Progress,
    Dropdown,
    DropdownTrigger,
    DropdownMenu,
    DropdownItem,
    Button,
    Chip,
    Modal,
    ModalContent,
    ModalBody,
    Image,
    ModalHeader,
    Tooltip,
    Input,
    Tabs,
    Tab,
    Card,
    CardHeader,
    CardBody,
    Divider,
} from '@heroui/react';
import AppLayout from '../components/layout/AppLayout';
import PageLayout from '../components/layout/PageLayout';
import DropzoneUpload from '../components/files/DropzoneUpload';
import {
    RiAddLine,
    RiMore2Fill,
    RiDeleteBin6Line,
    RiCheckboxCircleFill,
    RiErrorWarningFill,
} from 'react-icons/ri';
import { PiFileCsvDuotone } from 'react-icons/pi';
import useCurrentWorkspace from '../hooks/useCurrentWorkspace';
import Papa from 'papaparse';
import { useEmailLists, useDeleteEmailList } from '../hooks/react-query/email-lists/useEmailLists';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import ky from 'ky';
import { supabaseClient } from '../lib/supabase';
import toast from 'react-hot-toast';
import { useCallback, useEffect, useState } from 'react';
import { useDarkMode } from '../hooks/theme/useDarkMode';
import Paywall from '../components/marketing/Paywall';
import { useForm } from 'react-hook-form';
import ExportBtn from '../components/lists/ExportListBtn';

function DashboardPage() {
    const [currentWorkspace] = useCurrentWorkspace();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const [isFileUploading, setIsFileUploading] = useState(false);
    const [insufficientCredits, setInsufficientCredits] = useState(false);
    const [startNewList, setStartNewList] = useState(false);
    const [darkMode] = useDarkMode();
    const [listsInProcess, setListsInProcess] = useState(null);
    const [singleVerification, setSingleVerification] = useState(null);
    const [isSingleLoading, setIsSingleLoading] = useState(false);

    const { register, handleSubmit } = useForm();

    const { data: emailLists, isPending, isFetching } = useEmailLists(currentWorkspace);
    const { mutateAsync: deleteEmailList } = useDeleteEmailList(currentWorkspace);

    async function handleDelete(listId) {
        await deleteEmailList({ listId });
    }

    const onSubmit = async (data) => {
        setIsSingleLoading(true);
        try {
            const { data: session } = await supabaseClient.auth.getSession();
            const res = await ky
                .post('/api/validate-email', {
                    json: {
                        email: data.email,
                        session: session?.session,
                        workspace_id: currentWorkspace?.workspace_id,
                    },
                })
                .json();

            setSingleVerification(res);

            toast('Verification completed', {
                type: 'success',
                icon: '🚀',
            });
        } catch (error) {
            console.error(error);
            if (error.response) {
                try {
                    const errorData = await error.response.json();

                    // Check for insufficient credits error
                    if (errorData.error_code === 'INSUFFICIENT_CREDITS') {
                        toast('Not enough credits', {
                            type: 'error',
                            duration: 5000,
                        });
                        setInsufficientCredits(true);
                    }
                } catch (jsonError) {
                    console.error('Error parsing error response:', jsonError);
                }
            }
        } finally {
            setIsSingleLoading(false);
            await queryClient.invalidateQueries({
                queryKey: ['workspaceCredits', currentWorkspace?.workspace_id],
            });
        }
    };

    async function handleParse(data) {
        setStartNewList(false);
        setIsFileUploading(true);
        // save file name without extension
        const fileName = data?.fileName?.split('.')[0];

        // Parse the CSV
        Papa.parse(data?.fileContent, {
            header: true,
            complete: async (results) => {
                const data = results.data;
                const firstRow = results.data[0]; // Access the first row of parsed data

                // Use a regular expression to match email addresses
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                // Find the key that contains an email address
                let emailColumn = null;
                for (const key in firstRow) {
                    if (emailRegex.test(firstRow[key])) {
                        emailColumn = key;
                        break;
                    }
                }

                if (emailColumn) {
                    // filter to only rows with email
                    const filteredData = await data.filter((row) => row[emailColumn]);

                    try {
                        const { data: session } = await supabaseClient.auth.getSession();
                        const npm = await ky
                            .post('/api/save-list', {
                                json: {
                                    fileName,
                                    data: filteredData,
                                    emailColumn,
                                    workspace_id: currentWorkspace?.workspace_id,
                                    session: session?.session,
                                },
                            })
                            .json();

                        setListsInProcess((prev) => {
                            if (prev) {
                                return [...prev, res.list_id];
                            } else {
                                return [res.list_id];
                            }
                        });

                        toast('List validation started', {
                            icon: '🚀',
                        });
                    } catch (error) {
                        console.error(error);
                        if (error.response) {
                            // If you want to inspect the response details (e.g., status code)
                            const errorData = await error.response.json();

                            // Example: Check for custom error code
                            if (errorData.error_code === 'INSUFFICIENT_CREDITS') {
                                toast('Not enough credits', {
                                    type: 'error',
                                    duration: 5000,
                                });
                                setInsufficientCredits(true);
                            }
                        }
                    } finally {
                        setIsFileUploading(false);
                        await queryClient.invalidateQueries({
                            queryKey: ['emailLists', currentWorkspace?.workspace_id],
                        });
                        await queryClient.invalidateQueries({
                            queryKey: ['workspaceCredits', currentWorkspace?.workspace_id],
                        });
                    }
                } else {
                    toast('No email column found', {
                        type: 'error',
                        duration: 5000,
                    });
                }
            },
        });
    }

    // Helper function to get Tailwind color classes
    const getColorForKey = (key) => {
        const colorMapping = {
            deliverable: 'bg-green-500/90',
            risky: 'bg-yellow-400/90',
            undeliverable: 'bg-red-400/90',
            unknown: 'bg-gray-400/90',
        };
        return colorMapping[key] || 'bg-default-500'; // Fallback color if key is not found
    };

    const renderStackedBarChart = useCallback((summary) => {
        if (!summary) return null;

        const total = Object.values(summary).reduce((sum, value) => sum + value, 0);

        return (
            <div className="flex w-full h-2 bg-gray-200 rounded-lg overflow-hidden">
                {Object.keys(summary).map((key, index) => {
                    const proportion = (summary[key] / total) * 100;
                    return (
                        <Tooltip key={index} content={`${summary[key]} ${key}`}>
                            <div
                                className={`h-full ${getColorForKey(key)}`}
                                style={{ width: `${proportion}%` }} // Use inline style for dynamic width
                            />
                        </Tooltip>
                    );
                })}
            </div>
        );
    }, []);

    useEffect(() => {
        if (!listsInProcess || !currentWorkspace?.workspace_id) return;

        const subscriptions = listsInProcess?.map((list) =>
            supabaseClient
                .channel(list)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'lists',
                        filter: `id=eq.${list}`,
                    },
                    (payload) => {
                        if (payload?.new?.status !== 'processing') {
                            (async () => {
                                await queryClient.invalidateQueries({
                                    queryKey: ['emailLists', currentWorkspace?.workspace_id],
                                });
                                setListsInProcess((prev) => prev.filter((id) => id !== list));
                            })();
                        }
                    },
                )
                .subscribe(),
        );
        // Clean up on unmount or when listsInProcess changes
        // Updated cleanup logic
        return () => {
            subscriptions?.forEach((subscription) => {
                if (subscription) {
                    // Explicitly remove the channel
                    supabaseClient.removeChannel(subscription);
                }
            });
        };
    }, [currentWorkspace?.workspace_id, listsInProcess]);

    return (
        <DropzoneUpload fullScreen onUpload={handleParse}>
            <AppLayout>
                <Paywall
                    isOpen={insufficientCredits}
                    onOpenChange={(open) => {
                        if (!open) {
                            setInsufficientCredits(false);
                        }
                    }}
                    feature="more credits"
                />
                <Modal
                    placement="top-center"
                    isOpen={startNewList}
                    size="3xl"
                    onOpenChange={(open) => {
                        if (!open) {
                            setStartNewList(false);
                        }
                    }}
                >
                    <ModalContent>
                        <ModalHeader>
                            <h2 className="font-semibold text-2xl">Verify a new list</h2>
                        </ModalHeader>
                        <ModalBody className="py-6">
                            <div className="gap-3">
                                <DropzoneUpload onUpload={handleParse} />
                                <ol className="list-decimal text-sm flex flex-col gap-2 p-6">
                                    <span className="font-semibold">Instructions</span>
                                    <li>Upload your list as a CSV file.</li>
                                    <li>
                                        Ensure emails are in a single column (other columns are
                                        allowed and won’t be affected).
                                    </li>
                                    <li>
                                        We’ll notify you as soon as the verification process is
                                        finished.
                                    </li>
                                </ol>
                            </div>
                        </ModalBody>
                    </ModalContent>
                </Modal>
                <Modal
                    placement="top-center"
                    isDismissable={false}
                    backdrop="blur"
                    isOpen={isFileUploading}
                    hideCloseButton
                >
                    <ModalContent>
                        <ModalBody className="py-9 flex flex-col items-center">
                            <h2 className="font-semibold text-2xl text-center">
                                Getting things ready
                            </h2>
                            <p className="font-medium">This might take a moment, please wait...</p>
                            <Image
                                src={`/empty-states/${darkMode ? 'dark' : 'light'}/stack.svg`}
                                alt="uploading"
                                width={240}
                                height={240}
                            />
                            <Progress
                                size="sm"
                                isIndeterminate
                                aria-label="Processing..."
                                className="max-w-md w-full"
                            />
                            <p className="font-medium text-sm text-default-500 mt-3">
                                This alert will close automatically
                            </p>
                        </ModalBody>
                    </ModalContent>
                </Modal>
                <PageLayout
                    maxW="4xl"
                    title="Verify"
                    description="Verify a single email or a list"
                    primaryAction="New list"
                    icon={<RiAddLine fontSize="1.1rem" />}
                    onClick={() => setStartNewList(true)}
                >
                    <div className="flex flex-col gap-3">
                        <Tabs>
                            <Tab key="list" title="List">
                                <Table
                                    aria-label="Email lists"
                                    onRowAction={(key) => navigate(`/lists/${key}`)}
                                    selectionMode="single"
                                >
                                    <TableHeader>
                                        <TableColumn>NAME</TableColumn>
                                        <TableColumn>Emails</TableColumn>
                                        <TableColumn>Status</TableColumn>
                                        <TableColumn>Overview</TableColumn>
                                        <TableColumn>Date</TableColumn>
                                        <TableColumn hideHeader>Action</TableColumn>
                                    </TableHeader>
                                    <TableBody
                                        isLoading={isPending || isFetching}
                                        emptyContent={<DropzoneUpload onUpload={handleParse} />}
                                    >
                                        {emailLists?.map((list) => (
                                            <TableRow key={list.id} className="cursor-pointer">
                                                <TableCell className="font-medium min-w-[100px] max-w-[120px] whitespace-nowrap text-ellipsis overflow-hidden">
                                                    <div className="flex gap-2 items-center">
                                                        <PiFileCsvDuotone
                                                            fontSize="1.4rem"
                                                            className="text-default-600"
                                                        />
                                                        {list?.name}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {Intl.NumberFormat().format(list?.size)}
                                                </TableCell>
                                                <TableCell>
                                                    <Chip
                                                        size="sm"
                                                        variant="flat"
                                                        color={
                                                            (list?.status === 'pending' &&
                                                                'default') ||
                                                            (list?.status === 'processing' &&
                                                                'primary') ||
                                                            (list?.status === 'completed' &&
                                                                'success') ||
                                                            (list?.status === 'error' && 'danger')
                                                        }
                                                    >
                                                        {list?.status}
                                                    </Chip>
                                                </TableCell>
                                                <TableCell className="min-w-[140px]">
                                                    {list?.status !== 'processing' ? (
                                                        <div className="flex gap-2 items-center">
                                                            {renderStackedBarChart(list?.summary)}
                                                        </div>
                                                    ) : (
                                                        <Progress
                                                            size="sm"
                                                            isIndeterminate
                                                            aria-label="Processing..."
                                                            className="max-w-md w-full"
                                                        />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {Intl.DateTimeFormat(navigator.language, {
                                                        dateStyle: 'short',
                                                    }).format(new Date(list?.created_at))}
                                                </TableCell>
                                                <TableCell className="w-[56px]">
                                                    <div className="flex gap-3">
                                                        {list?.status === 'completed' && (
                                                            <ExportBtn list={list} />
                                                        )}
                                                        <Dropdown>
                                                            <DropdownTrigger>
                                                                <Button
                                                                    variant="bordered"
                                                                    isIconOnly
                                                                    size="sm"
                                                                >
                                                                    <RiMore2Fill fontSize="1.1rem" />
                                                                </Button>
                                                            </DropdownTrigger>
                                                            <DropdownMenu
                                                                aria-label="Static Actions"
                                                                disabledKeys={
                                                                    list.status === 'processing'
                                                                        ? ['delete']
                                                                        : []
                                                                }
                                                            >
                                                                <DropdownItem
                                                                    key="delete"
                                                                    className="text-danger"
                                                                    color="danger"
                                                                    startContent={
                                                                        <RiDeleteBin6Line fontSize="1.1rem" />
                                                                    }
                                                                    onClick={() =>
                                                                        handleDelete(list?.id)
                                                                    }
                                                                >
                                                                    Delete
                                                                </DropdownItem>
                                                            </DropdownMenu>
                                                        </Dropdown>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </Tab>
                            <Tab key="single" title="Single email">
                                <main className="max-w-xl flex flex-col gap-6 mx-auto py-3">
                                    <Card shadow="sm">
                                        <CardBody>
                                            <h5 className="text-sm font-medium text-default-500 mb-3">
                                                Email address
                                            </h5>
                                            <form
                                                onSubmit={handleSubmit(onSubmit)}
                                                className="w-full flex gap-3"
                                            >
                                                <Input
                                                    size="lg"
                                                    type="email"
                                                    isClearable
                                                    placeholder="Enter an email address"
                                                    {...register('email', {
                                                        required: 'Email is required',
                                                    })}
                                                />

                                                <Button
                                                    type="submit"
                                                    size="lg"
                                                    variant="bordered"
                                                    isLoading={isSingleLoading}
                                                >
                                                    Verify
                                                </Button>
                                            </form>
                                        </CardBody>
                                    </Card>
                                    {singleVerification && (
                                        <div>
                                            <h5 className="text-sm font-medium text-default-500 mb-3">
                                                Result
                                            </h5>
                                            <Card
                                                shadow="sm"
                                                className={`border 
        ${singleVerification?.status === 'deliverable' ? 'border-success bg-gradient-to-b from-content1 to-success-50/10' : ''}
        ${singleVerification?.status === 'risky' ? 'border-warning bg-gradient-to-b from-content1 to-warning-50/10' : ''}
        ${singleVerification?.status === 'undeliverable' ? 'border-danger bg-gradient-to-b from-content1 to-danger-50/10' : ''}
        ${singleVerification?.status === 'unknown' ? 'border-default' : ''}
    `}
                                            >
                                                <CardHeader>
                                                    <div className="w-full flex justify-between px-6">
                                                        <span className="font-medium">
                                                            {singleVerification?.email}
                                                        </span>
                                                        <Chip
                                                            size="sm"
                                                            variant="flat"
                                                            color={
                                                                (singleVerification?.status ===
                                                                    'unknown' &&
                                                                    'default') ||
                                                                (singleVerification?.status ===
                                                                    'risky' &&
                                                                    'warning') ||
                                                                (singleVerification?.status ===
                                                                    'undeliverable' &&
                                                                    'danger') ||
                                                                (singleVerification?.status ===
                                                                    'deliverable' &&
                                                                    'success')
                                                            }
                                                        >
                                                            {singleVerification?.status}
                                                        </Chip>
                                                    </div>
                                                </CardHeader>
                                                <Divider />
                                                <CardBody className="p-6">
                                                    <div className="flex gap-6 text-sm font-medium mx-auto">
                                                        <div className="flex flex-col items-end gap-3 text-default-500">
                                                            <span>Syntax error: </span>
                                                            <span>Disposable:</span>
                                                            <span>Gibberish:</span>
                                                            <span>Did you mean:</span>
                                                            <span>Role:</span>
                                                            <span>Domain status:</span>
                                                            <span>MX Record:</span>
                                                        </div>
                                                        <div className="flex flex-col gap-3">
                                                            <span>
                                                                {singleVerification?.syntax_error ? (
                                                                    <div className="flex gap-1">
                                                                        <RiErrorWarningFill
                                                                            fontSize="1.2rem"
                                                                            className="inline-block text-danger"
                                                                        />
                                                                        Yes
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex gap-1">
                                                                        <RiCheckboxCircleFill
                                                                            fontSize="1.2rem"
                                                                            className="inline-block text-success"
                                                                        />
                                                                        No
                                                                    </div>
                                                                )}
                                                            </span>
                                                            <span>
                                                                {singleVerification?.disposable ? (
                                                                    <div className="flex gap-1">
                                                                        <RiErrorWarningFill
                                                                            fontSize="1.2rem"
                                                                            className="inline-block text-danger"
                                                                        />
                                                                        Yes
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex gap-1">
                                                                        <RiCheckboxCircleFill
                                                                            fontSize="1.2rem"
                                                                            className="inline-block text-success"
                                                                        />
                                                                        No
                                                                    </div>
                                                                )}
                                                            </span>
                                                            <span>
                                                                {singleVerification?.gibberish ? (
                                                                    <div className="flex gap-1">
                                                                        <RiErrorWarningFill
                                                                            fontSize="1.2rem"
                                                                            className="inline-block text-danger"
                                                                        />
                                                                        Yes
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex gap-1">
                                                                        <RiCheckboxCircleFill
                                                                            fontSize="1.2rem"
                                                                            className="inline-block text-success"
                                                                        />
                                                                        No
                                                                    </div>
                                                                )}
                                                            </span>
                                                            <span>
                                                                {singleVerification?.did_you_mean
                                                                    ? singleVerification?.did_you_mean
                                                                    : '-'}
                                                            </span>
                                                            <span>
                                                                {singleVerification?.role ? (
                                                                    <div className="flex gap-1">
                                                                        <RiErrorWarningFill
                                                                            fontSize="1.2rem"
                                                                            className="inline-block text-danger"
                                                                        />
                                                                        Yes
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex gap-1">
                                                                        <RiCheckboxCircleFill
                                                                            fontSize="1.2rem"
                                                                            className="inline-block text-success"
                                                                        />
                                                                        No
                                                                    </div>
                                                                )}
                                                            </span>
                                                            <span>
                                                                {singleVerification?.domain_status ===
                                                                'active' ? (
                                                                    <div className="flex gap-1">
                                                                        <RiCheckboxCircleFill
                                                                            fontSize="1.2rem"
                                                                            className="inline-block text-success"
                                                                        />
                                                                        Active
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex gap-1">
                                                                        <RiErrorWarningFill
                                                                            fontSize="1.2rem"
                                                                            className="inline-block text-danger"
                                                                        />
                                                                        Inactive
                                                                    </div>
                                                                )}
                                                            </span>

                                                            <span>
                                                                {singleVerification?.mx_record ? (
                                                                    <div className="flex gap-1">
                                                                        <RiCheckboxCircleFill
                                                                            fontSize="1.2rem"
                                                                            className="inline-block text-success"
                                                                        />
                                                                        {
                                                                            singleVerification?.mx_record
                                                                        }
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex gap-1">
                                                                        <RiErrorWarningFill
                                                                            fontSize="1.2rem"
                                                                            className="inline-block text-danger"
                                                                        />
                                                                        No MX Record
                                                                    </div>
                                                                )}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </CardBody>
                                            </Card>
                                        </div>
                                    )}
                                </main>
                            </Tab>
                        </Tabs>
                    </div>
                </PageLayout>
            </AppLayout>
        </DropzoneUpload>
    );
}

export default DashboardPage;
