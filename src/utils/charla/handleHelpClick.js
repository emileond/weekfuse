export const handleHelpClick = () => {
    // Check if the widget is already appended to avoid duplicates
    if (!document.querySelector('charla-widget')) {
        let widgetElement = document.createElement('charla-widget');
        widgetElement.setAttribute('p', '697d2e90-edae-4ece-8645-84c5cc5140bc');
        document.body.appendChild(widgetElement);
    }

    if (!document.querySelector('script[src="https://app.getcharla.com/widget/widget.js"]')) {
        let widgetCode = document.createElement('script');
        widgetCode.src = 'https://app.getcharla.com/widget/widget.js';
        document.body.appendChild(widgetCode);
    }
};
