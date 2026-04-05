import subprocess

SCRIPT = r'''
tell application "Google Chrome"
    activate
    set URL of active tab of front window to "javascript:(function(){const selectors=['div[role=\"button\"][data-tooltip^=\"Send\"]','div[role=\"button\"][aria-label^=\"Send\"]','div[role=\"button\"][aria-label*=\"Send\"]','[role=\"button\"][data-tooltip*=\"Send\"]'];let clicked=false;for(const sel of selectors){const el=document.querySelector(sel);if(el){el.click();clicked=true;break;}}document.title=clicked?'CodexSendClicked':'CodexSendNotFound';})();"
end tell
delay 4
tell application "Google Chrome"
    set tabTitle to title of active tab of front window
    set tabUrl to URL of active tab of front window
end tell
return tabTitle & "\n" & tabUrl
'''

result = subprocess.run(
    ["osascript", "-e", SCRIPT],
    capture_output=True,
    text=True,
)

print(result.stdout.strip())
if result.returncode != 0:
    print(result.stderr.strip())
    raise SystemExit(result.returncode)
