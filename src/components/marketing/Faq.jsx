import { Accordion, AccordionItem } from '@heroui/react';

export default function Faq() {
    const accordionItems = [
        {
            title: 'I already use Trello, Notion, Monday, etc. How is Weekfuse different?',
            content: (
                <div className="text-muted-foreground py-1">
                    <p className="mb-6">
                        Those apps are great for teams and managing projects. But Weekfuse is built
                        for you, the individual who juggles lots of projects.
                    </p>

                    <ul className="list-disc list-inside space-y-6">
                        <li>
                            <strong>One Place for Everything:</strong>
                            <p>
                                Instead of making you switch apps, Weekfuse pulls in your tasks from
                                where they already live (Jira, Trello, GitHub, ClickUp, and more).
                                Now you see all your work in one spot. Less app-hopping, more doing.
                            </p>
                        </li>
                        <li>
                            <strong>Built for You, Not a Team:</strong>
                            <p>
                                Most other tools are team-focused, which can feel noisy for one
                                person. Weekfuse is designed to help you personally get organized
                                and stay balanced, without all the extra team stuff you don't need.
                            </p>
                        </li>
                        <li>
                            <strong>Smart Planning & Reflection:</strong>
                            <p>
                                We use AI to help you plan your week and look back at what worked.
                                It's about getting smarter, not just tracking tasks.
                            </p>
                        </li>
                    </ul>
                </div>
            ),
        },
        {
            title: 'Is Weekfuse a fit for me?',
            content: (
                <div className="text-muted-foreground py-1">
                    <p className="mb-6">Weekfuse is perfect for you if you:</p>

                    <ul className="list-disc list-inside space-y-6">
                        <li>
                            <strong>Juggle multiple projects: </strong>
                            This means a full-time job plus side gigs, freelance work, or even
                            personal passion projects.
                        </li>
                        <li>
                            <strong>Feel overwhelmed by scattered tasks: </strong>
                            <p>
                                Your to-dos are all over the place across different apps, and you
                                need one clear view.
                            </p>
                        </li>
                        <li>
                            <strong>Aim to make work-life balance a reality: </strong>
                            <p>You aim to get things done without getting burnt out.</p>
                        </li>
                        <li>
                            <strong>Like to plan ahead: </strong>
                            <p>
                                You prefer to set up your week strategically, instead of just
                                reacting to tasks.
                            </p>
                        </li>
                        <li>
                            <strong>Want to practice self-reflection: </strong>
                            <p>You&#39;re open to reflecting on your work to get better</p>
                        </li>
                        <li>
                            <strong>Appreciate intentionality: </strong>
                            <p>
                                Every feature is designed to help you focus on what matters most,
                                without getting distracted.
                            </p>
                        </li>
                    </ul>
                </div>
            ),
        },
        {
            title: 'What integrations do you support?',
            content: (
                <div className="text-muted-foreground">
                    Currently Jira, Trello, GitHub, ClickUp, with more planned.
                </div>
            ),
        },
        {
            title: 'How does the AI Auto-Planning work?',
            content: (
                <div className="text-muted-foreground">
                    <p>
                        Our AI is your smart planning assistant. When you're ready, it looks at your
                        pending tasks, due dates, and other factors to help you plan your week.
                    </p>
                    <p>
                        Then, it quickly suggests a daily plan for your week. It helps you get
                        started fast, cuts down on decision fatigue, and you can always tweak it to
                        fit your day perfectly.
                    </p>
                </div>
            ),
        },
        {
            title: 'How does the AI-Guided Reflections work?',
            content: (
                <div className="text-muted-foreground">
                    <p>
                        Our AI helps you learn from your week. Instead of just checking off tasks,
                        it asks you thoughtful questions to hlp you really think about your
                        progress, spot patterns, and get ideas on how to improve your planning and
                        work habits. It's all about helping you grow and work smarter, not just
                        harder.
                    </p>
                </div>
            ),
        },
        {
            title: 'Is there research that supports this way of working?',
            content: (
                <div className="text-muted-foreground">
                    <p className="mb-6">
                        Absolutely! The way Weekfuse helps you manage your work is built on
                        well-known productivity methods and research-backed principles. We combine
                        the best ideas from various frameworks:
                    </p>
                    <p className="mb-6">
                        <ul className="list-disc list-inside space-y-6">
                            <li>
                                Focused Daily Planning: Inspired by rules like the 1-3-5 method (one
                                big, three medium, five small tasks) and the Pareto Principle (80/20
                                Rule), we encourage you to focus on the most impactful tasks,
                                ensuring you get the most important work done first. This prevents
                                overload and boosts your sense of achievement.
                            </li>
                            <li>
                                The Power of Reflection: Our AI-guided reflections are based on
                                extensive research showing that taking time to review your work and
                                learn from your experiences significantly boosts performance,
                                continuous improvement, and overall well-being.
                            </li>
                            <li>
                                Sustainable Work Rhythms: Concepts like the Pomodoro Technique
                                (focused work sprints with breaks) and agile principles emphasize
                                creating a steady, productive rhythm that prevents burnout. Weekfuse
                                helps you build these sustainable habits.
                            </li>
                            <li>
                                Breaking Down Work: Whether it's "Today Focus" or the idea of
                                breaking bigger projects into smaller, manageable tasks, this
                                approach is proven to make work feel less overwhelming and more
                                achievable.
                            </li>
                        </ul>
                    </p>
                    <p className="mb-6">
                        Weekfuse combines these proven methods with smart AI to give you a modern,
                        effective system for personal productivity and work-life balance.
                    </p>
                </div>
            ),
        },
        {
            title: "Why don't you offer a free plan?",
            content: (
                <div className="text-muted-foreground">
                    <p className="mb-6">
                        We&#39;ve made a deliberate choice to focus entirely on delivering a
                        high-quality experience for users truly committed to mastering their
                        productivity and work-life balance.
                    </p>
                    <ul className="list-disc list-inside space-y-6 mb-6">
                        <li>
                            <strong>Focus on Value, Not Volume: </strong>Building and maintaining
                            powerful AI features, robust integrations, and continuous improvements
                            requires significant investment. This way, we can dedicate all our
                            resources to making Weekfuse the best tool possible for our users,
                            rather than splitting focus between free and paid tiers.
                        </li>
                        <li>
                            <strong>No Compromises: </strong> A free tier can sometimes lead to
                            compromises in development, features, or support. Our commitment is to
                            provide an uninterrupted, ad-free, and consistently evolving product
                            that deeply serves your productivity needs.
                        </li>
                        <li>
                            <strong>Serious About Your Success: </strong> Weekfuse is designed for
                            serious individuals who are ready to invest in tools that truly help
                            them achieve their goals. We want to attract users who are committed to
                            using the app to its full potential.
                        </li>
                    </ul>
                    <p>
                        <strong>We do offer a generous free trial for all our plans, </strong>
                        so you can fully experience everything Weekfuse has to offer and see if
                        it&#39;s the right fit for you before making any commitment.
                    </p>
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
                <Accordion fullWidth selectionMode="multiple" variant="shadow">
                    {accordionItems?.map((item, index) => (
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
