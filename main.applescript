set theURL to ""
tell application "System Events"
	set processList to name of every process
	if "Safari" is in processList then
		tell application "Safari"
			set theURL to URL of current tab of window 1
		end tell
	else if "Google Chrome" is in processList then
		tell application "Google Chrome"
			set theURL to URL of active tab of window 1
		end tell
	else
		display dialog "Safari 或 Google Chrome 必须处于打开状态。"
	end if
end tell

set pythonScriptPath to "/Users/tong/SDD/contextChat/html_to_markdown.py"
set virtualEnvPath to "/Users/tong/SDD/contextChat/venv/bin/python3"

set markdownResult to do shell script virtualEnvPath & " " & pythonScriptPath & " " & theURL

return markdownResult
