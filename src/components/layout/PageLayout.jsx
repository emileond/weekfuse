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
    startElements,
    customElements,
    isLanding = false,
}) {
    const navigate = useNavigate();

    function handleOnclick() {
        if (onClick) {
            return onClick();
        }
    }

    return (
        <div
            className={`min-h-screen h-full bg-background px-6 py-6 grow flex justify-center overflow-y-auto relative`}
        >
            <div className={`w-full max-w-${maxW} flex flex-col gap-3`}>
                <div>
                    <div className="w-full flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            {backBtn && (
                                <Button isIconOnly variant="light" onPress={() => navigate(-1)}>
                                    <RiArrowLeftLine fontSize="1.2rem" />
                                </Button>
                            )}
                            {title && <h1 className="font-semibold text-2xl">{title}</h1>}
                            {startElements}
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
                <div className={isLanding && 'py-16'}>{children}</div>
            </div>
        </div>
    );
}

export default PageLayout;
