import React from 'react';

const WORKSPACE_HEADER_TOOLS_ID = 'os-workspace-header-tools';

export const useWorkspaceHeaderTools = (enabled: boolean) => {
  const [target, setTarget] = React.useState<HTMLElement | null>(null);

  React.useEffect(() => {
    if (!enabled || typeof document === 'undefined') {
      setTarget(null);
      return;
    }

    const syncTarget = () => {
      setTarget(document.getElementById(WORKSPACE_HEADER_TOOLS_ID));
    };

    syncTarget();
    const frameId = window.requestAnimationFrame(syncTarget);

    return () => {
      window.cancelAnimationFrame(frameId);
      setTarget(null);
    };
  }, [enabled]);

  return target;
};
