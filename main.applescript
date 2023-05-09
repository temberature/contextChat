set theURL to ""
set commandList to {"总结"}

-- 获取屏幕尺寸
tell application "Finder"
	set screenResolution to bounds of window of desktop
end tell
set screenWidth to item 3 of screenResolution
set screenHeight to item 4 of screenResolution

-- 创建命令列表对话框
set commandListText to ""
repeat with i from 1 to count of commandList
	set commandListText to commandListText & i & ". " & item i of commandList & return
end repeat

set inputText to display dialog "请输入命令数字：" & return & commandListText default answer "" buttons {"取消", "确定"} default button 2 with icon note giving up after 60
set commandNumber to text returned of inputText

-- 检查用户输入的命令
if (commandNumber is "1") and (item 1 of commandList is "总结") then
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
	set virtualEnvPath to "/Users/tong/SDD/contextChat/venv/bin/python"
	
	set markdownResult to do shell script virtualEnvPath & " " & pythonScriptPath & " " & theURL
	
	-- 显示结果
	display dialog "Markdown 结果：" & return & return & markdownResult buttons {"关闭"} default button 1 with icon note
end if
