# Unified UI Standards

## Global Layout
*   **Header Height**: `h-16` (64px). `module-header` class.
*   **Footer Height**: `h-10` (40px). Fixed global footer in `OpsApp.tsx`.
*   **Content Padding**: `p-8` (32px). `module-body` class.

## Internal Page Structure
Every module must follow this structure:
```tsx
<div className="module-container bg-transparent flex flex-col h-full overflow-hidden">
    {/* Header: Submenu Area */}
    <header className="module-header glass-panel border-b border-zinc-800 justify-between">
        {/* Left: Navigation Tabs */}
        <div className="flex items-center">
            <div className="flex bg-zinc-900/50 p-1 rounded-xl ...">
                {/* Tabs Buttons */}
            </div>
        </div>

        {/* Right: Search & Actions */}
        <div className="flex items-center gap-4">
            {/* Search Input */}
            <div className="relative block">...</div>

            {/* Reports Button (Always Last/Second to Last if other tools exist) */}
            <button ...>Reports</button>
            
            {/* Other Context Tools (e.g. Oracle, Settings) */}
        </div>
    </header>

    {/* Main Content: Single Scrollable Area */}
    <main className="module-body">
        {renderContent()}
    </main>
</div>
```

## Styling Rules
*   **Backgrounds**: Use `bg-zinc-950` or `glass-panel` (backdrop-blur).
*   **Borders**: `border-zinc-800`.
*   **Text**: `text-zinc-200` (primary), `text-zinc-500` (secondary/labels).
*   **Accent Colors**:
    *   Front Office: Violet
    *   Housekeeping: Teal
    *   POS: Orange/Amber
    *   Engineering: Cyan
    *   Finance: Emerald
    *   HR: Rose/Pink

## Scrolling Behavior
*   **Never** use nested `overflow-y-auto` inside the main content unless absolutely necessary for a specific widget (e.g., a small list).
*   The `module-body` handles the page scroll.
*   Ensure all content containers have `min-h-0` or `flex-1` to respect the flex layout.
