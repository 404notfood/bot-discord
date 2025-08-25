import AppLogoIcon from './app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <div className="flex aspect-square size-8 items-center justify-center rounded-md bg-gradient-to-br from-primary to-primary/50 shadow-lg">
                <img 
                    src="/img/logo.png" 
                    alt="Bot Discord" 
                    className="size-5 object-contain"
                    onError={(e) => {
                        // Fallback to icon if image fails to load
                        e.currentTarget.style.display = 'none';
                        e.currentTarget.parentElement.innerHTML = '<div class="size-5 bg-primary rounded text-white font-bold text-xs flex items-center justify-center">BD</div>';
                    }}
                />
            </div>
            <div className="ml-1 grid flex-1 text-left text-sm">
                <span className="mb-0.5 truncate leading-tight font-semibold holo-text">Bot Discord</span>
                <span className="text-xs text-muted-foreground font-mono">Control Panel</span>
            </div>
        </>
    );
}
