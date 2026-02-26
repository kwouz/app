import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'hasSeenOnboarding';

interface TooltipStep {
    target: string;        // data-onboarding attribute value
    title: string;
    text: string;
    isLast?: boolean;
}

const STEPS: TooltipStep[] = [
    {
        target: 'mood-grid',
        title: 'Track how you feel.',
        text: 'Tap a state to record how you feel right now.\nOne tap — saved instantly.',
    },
    {
        target: 'mood-circle-0',
        title: 'It saves automatically.',
        text: 'Every tap is stored with time and date.\nYou can record multiple states per day.',
    },
    {
        target: 'nav-history',
        title: 'Your emotional timeline.',
        text: 'View daily entries and delete them anytime.',
    },
    {
        target: 'nav-insights',
        title: 'Understand your patterns.',
        text: 'The app analyzes frequency, time of day and trends.',
    },
    {
        target: 'nav-report',
        title: 'Personal report.',
        text: 'Export a structured PDF of your emotional data.',
        isLast: true,
    },
];

export default function OnboardingOverlay() {
    const [visible, setVisible] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [currentStep, setCurrentStep] = useState(-1); // -1 = intro
    const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
    const [spotlightStyle, setSpotlightStyle] = useState<React.CSSProperties>({});
    const [animating, setAnimating] = useState(false);
    const tooltipRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (localStorage.getItem(STORAGE_KEY) === 'true') return;
        setVisible(true);
    }, []);

    const finish = useCallback(() => {
        setAnimating(true);
        setTimeout(() => {
            localStorage.setItem(STORAGE_KEY, 'true');
            setVisible(false);
        }, 250);
    }, []);

    const positionTooltip = useCallback((stepIdx: number) => {
        const step = STEPS[stepIdx];
        if (!step) return;

        const el = document.querySelector(`[data-onboarding="${step.target}"]`);
        if (!el) return;

        const rect = el.getBoundingClientRect();
        const pad = 12;

        // Spotlight — position the highlight around the target element
        setSpotlightStyle({
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            borderRadius: 20,
        });

        // Tooltip positioning — below the element by default, above if near bottom
        const tooltipWidth = Math.min(320, window.innerWidth - 32);
        const isBottomNav = rect.top > window.innerHeight * 0.6;

        let top: number;
        let left: number;

        if (isBottomNav) {
            // Position above the element
            top = rect.top - pad - 12;
            left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16));
            setTooltipStyle({
                position: 'fixed',
                top: 'auto',
                bottom: window.innerHeight - top,
                left,
                width: tooltipWidth,
                transformOrigin: 'bottom center',
            });
        } else {
            // Position below the element
            top = rect.bottom + pad + 12;
            left = Math.max(16, Math.min(rect.left + rect.width / 2 - tooltipWidth / 2, window.innerWidth - tooltipWidth - 16));
            setTooltipStyle({
                position: 'fixed',
                top,
                bottom: 'auto',
                left,
                width: tooltipWidth,
                transformOrigin: 'top center',
            });
        }
    }, []);

    const goToStep = useCallback((idx: number) => {
        setAnimating(true);
        setTimeout(() => {
            setCurrentStep(idx);
            setShowIntro(false);
            setAnimating(false);
            positionTooltip(idx);
        }, 200);
    }, [positionTooltip]);

    // Reposition on resize
    useEffect(() => {
        if (currentStep < 0) return;
        const handler = () => positionTooltip(currentStep);
        window.addEventListener('resize', handler);
        return () => window.removeEventListener('resize', handler);
    }, [currentStep, positionTooltip]);

    // Position tooltip when step changes
    useEffect(() => {
        if (currentStep >= 0) {
            positionTooltip(currentStep);
        }
    }, [currentStep, positionTooltip]);

    if (!visible) return null;

    const step = STEPS[currentStep];

    // Intro screen
    if (showIntro && currentStep < 0) {
        return (
            <div
                className={`onboarding-overlay${animating ? ' onboarding--fading' : ''}`}
                style={{ background: 'rgba(0,0,0,0.85)' }}
            >
                <div className={`onboarding-intro${animating ? '' : ' onboarding-intro--visible'}`}>
                    <h1 className="onboarding-intro-title">Understand how you really feel.</h1>
                    <div className="onboarding-intro-subtitle">
                        <p>Track your emotional states.</p>
                        <p>Discover patterns.</p>
                        <p>Build awareness.</p>
                    </div>
                    <button className="onboarding-intro-btn" onClick={() => goToStep(0)}>
                        Start
                    </button>
                </div>
            </div>
        );
    }

    // Tooltip mode
    return (
        <div className={`onboarding-overlay${animating ? ' onboarding--fading' : ''}`}>
            {/* Dark scrim with spotlight cutout */}
            <div
                className="onboarding-scrim"
                onClick={finish}
            />

            {/* Spotlight highlight */}
            <div className="onboarding-spotlight" style={spotlightStyle} />

            {/* Tooltip card */}
            {step && (
                <div
                    ref={tooltipRef}
                    className={`onboarding-tooltip${animating ? '' : ' onboarding-tooltip--visible'}`}
                    style={tooltipStyle}
                >
                    <h3 className="onboarding-tooltip-title">{step.title}</h3>
                    <p className="onboarding-tooltip-text">
                        {step.text.split('\n').map((line, i) => (
                            <span key={i}>{line}{i < step.text.split('\n').length - 1 && <br />}</span>
                        ))}
                    </p>
                    <div className="onboarding-tooltip-actions">
                        {!step.isLast ? (
                            <>
                                <button className="onboarding-btn-skip" onClick={finish}>
                                    Skip
                                </button>
                                <button className="onboarding-btn-next" onClick={() => goToStep(currentStep + 1)}>
                                    Next
                                </button>
                            </>
                        ) : (
                            <button className="onboarding-btn-next" onClick={finish}>
                                Finish
                            </button>
                        )}
                    </div>

                    {/* Step indicators */}
                    <div className="onboarding-dots">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`onboarding-dot${i === currentStep ? ' onboarding-dot--active' : ''}`}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
