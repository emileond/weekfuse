import { Button, Image } from '@heroui/react';
import { useDarkMode } from '../hooks/theme/useDarkMode';

function EmptyState({
    title = 'No items',
    description = 'Create a new item',
    img,
    primaryAction,
    customElements,
    onClick,
}) {
    const [isDarkMode] = useDarkMode();

    const imageSrc = isDarkMode ? '/empty-states/dark/empty.svg' : '/empty-states/light/empty.svg';

    const handleOnClick = () => {
        if (onClick) {
            onClick();
        }
    };
    return (
        <div className="h-full p-20 flex flex-col items-center justify-center gap-3">
            <Image src={img || imageSrc} width={260} height={260} alt="Empty" />
            <div className="text-center">
                <h2 className="text-xl font-semibold mb-1">{title}</h2>
                <p className="text-default-600">{description}</p>
            </div>
            <div className="flex gap-3">
                {customElements}
                {primaryAction && (
                    <Button onPress={handleOnClick} color="primary" variant="flat">
                        {primaryAction}
                    </Button>
                )}
            </div>
        </div>
    );
}

export default EmptyState;
