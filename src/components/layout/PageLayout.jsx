import { Button } from '@heroui/react';
import { useNavigate } from 'react-router-dom';
import { RiArrowLeftLine } from 'react-icons/ri';

function PageLayout({
    children,
    maxW = '6xl',
    title,
    description,
    primaryAction,
    icon,
    onClick,
    backBtn,
    customElements,
}) {
    const navigate = useNavigate();

    function handleOnclick() {
        if (onClick) {
            return onClick();
        }
    }

    return (
        <div
            className={`min-h-screen h-full bg-background px-6 py-9 grow flex justify-center overflow-y-auto`}
        >
            <div className={`w-full max-w-${maxW} flex flex-col gap-6`}>
                <div>
                    <div className="w-full flex flex-wrap justify-between gap-3">
                        <div className="flex gap-3">
                            {backBtn && (
                                <Button isIconOnly variant="light" onPress={() => navigate(-1)}>
                                    <RiArrowLeftLine fontSize="1.2rem" />
                                </Button>
                            )}
                            {title && <h1 className="font-semibold mb-3">{title}</h1>}
                        </div>
                        <div className="flex gap-3">
                            {customElements}
                            {primaryAction && (
                                <Button
                                    onPress={handleOnclick}
                                    color="primary"
                                    className="font-medium"
                                    startContent={icon}
                                >
                                    {primaryAction}
                                </Button>
                            )}
                        </div>
                    </div>
                    {description && (
                        <p className="font-medium text-sm text-default-500 mt-2">{description}</p>
                    )}
                </div>
                <div>{children}</div>
            </div>
        </div>
    );
}

export default PageLayout;
