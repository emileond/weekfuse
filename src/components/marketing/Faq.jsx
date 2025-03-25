import { Accordion, AccordionItem } from '@heroui/accordion';

export default function Faq() {
    const accordionItems = [
        {
            title: 'What is the purpose of an email verifier?',
            content: (
                <div className="text-muted-foreground">
                    An email verifier helps ensure that the email addresses on your list are real
                    and active. This improves your email deliverability, protects your sender
                    reputation, and reduces bounces.
                </div>
            ),
        },
        {
            title: 'How do you validate email addresses?',
            content: (
                <div className="text-muted-foreground">
                    We validate each email without sending a message by doing critical checks like
                    spotting typos, filtering out disposable addresses, and confirming domain
                    records. Plus, other background checks to ensure the email is deliverable.
                </div>
            ),
        },
        {
            title: 'Can an email sent to a "verified" address bounce?',
            content: (
                <div className="text-muted-foreground">
                    Yes, it’s still possible, but the chances are much lower compared to sending
                    emails without verification. Our service minimizes bounces to help keep your
                    sender reputation healthy.
                </div>
            ),
        },
        {
            title: 'Can I validate a list of email addresses?',
            content: (
                <div className="text-muted-foreground">
                    Absolutely! You can upload your entire email list and get it validated in bulk,
                    making it quick and easy to clean up your contacts.
                </div>
            ),
        },
        {
            title: 'Do I need to use an API?',
            content: (
                <div className="text-muted-foreground">
                    Nope! You can upload your lists directly through our portal or use our
                    integrations to connect with your email marketing platform. The API is optional,
                    and it’s only necessary if you want to validate email addresses in real time on
                    your website or app.
                </div>
            ),
        },
        {
            title: 'Is the Email Verifier free?',
            content: (
                <div className="text-muted-foreground">
                    You get 1,000 credits for free. After that, it’s just $0.002 per credit, and
                    your credits never expire.
                </div>
            ),
        },
    ];

    return (
        <div id="faq" className="mx-auto max-w-3xl py-32">
            <div className="flex flex-col gap-3 justify-center items-center">
                <h4 className="text-2xl font-bold sm:text-3xl mb-9">Frequently Asked Questions</h4>
            </div>
            <div className="w-full">
                <Accordion fullWidth selectionMode="multiple" variant="light">
                    {accordionItems.map((item, index) => (
                        <AccordionItem
                            key={index}
                            aria-label={item.title}
                            title={item.title}
                            className="font-medium "
                        >
                            <p className="font-normal text-default-700 text-md text-pretty pt-3 pb-6">
                                {item.content}
                            </p>
                        </AccordionItem>
                    ))}
                </Accordion>
            </div>
        </div>
    );
}
