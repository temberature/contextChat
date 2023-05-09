import tkinter as tk
from tkinter import messagebox
import subprocess
import os

def get_current_url():
    applescript = '''
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
            return "error"
        end if
    end tell
    return theURL
    '''
    return subprocess.check_output(["osascript", "-e", applescript]).decode("utf-8").strip()

def html_to_markdown(url):
    python_script_path = "/Users/tong/SDD/contextChat/html_to_markdown.py"
    virtual_env_path = "/Users/tong/SDD/contextChat/venv/bin/python"
    result = subprocess.check_output([virtual_env_path, python_script_path, url]).decode("utf-8")
    return result

def on_key(event):
    if event.char == '1':
        root.destroy()
        url = get_current_url()
        if url == "error":
            messagebox.showerror("错误", "Safari 或 Google Chrome 必须处于打开状态。")
        else:
            markdown_result = html_to_markdown(url)
            messagebox.showinfo("Markdown 结果", markdown_result)
    elif event.char == 'q' or event.char == 'Q':
        root.destroy()

root = tk.Tk()
root.title('命令选择')
root.geometry('200x100')

label = tk.Label(root, text="请输入命令数字：\n1. 总结\n按 Q 退出")
label.pack()

root.bind('<Key>', on_key)

root.mainloop()
