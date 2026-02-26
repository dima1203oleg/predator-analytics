
use AppleScript version "2.4"
use scripting additions

-- Список ключових слів для кнопок, які потрібно натискати
set positiveKeywords to {"Allow", "Approve", "Confirm", "Accept", "Yes", "Proceed", "Authorize", "Run", "Apply", "Trust"}

repeat
	try
		tell application "System Events"
			-- Отримуємо всі видимі процеси (крім системних)
			set allProcesses to (name of every process whose background only is false)
			
			repeat with procName in allProcesses
				if procName is not in {"Finder", "System Settings", "Notes", "ChatGPT", "Music"} then
					try
						tell process procName
							-- Шукаємо ВСІ кнопки у ВСІХ вікнах
							set allButtons to (buttons of every window)
							
							repeat with btnList in allButtons
								repeat with targetButton in btnList
									set btnName to name of targetButton
									set btnDesc to description of targetButton
									
									-- Перевіряємо, чи містить назва або опис хоча б одне ключове слово
									set shouldClick to false
									repeat with kw in positiveKeywords
										if (btnName contains kw) or (btnDesc contains kw) then
											set shouldClick to true
											exit repeat
										end if
									end repeat
									
									if shouldClick then
										perform action "AXPress" of targetButton
										log "🚀 AUTO-APPROVED: [" & btnName & "] in " & procName
									end if
								end repeat
							end repeat
						end tell
					end try
				end if
			end repeat
		end tell
	on error
		-- Продовжуємо роботу навіть при помилках
	end try
	delay 0.5 -- Перевіряємо два рази на секунду для максимальної реакції
end repeat
