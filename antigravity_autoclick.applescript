use AppleScript version "2.4"
use scripting additions

-- Тільки критичні фрази безпеки, щоб не клікати зайвого
set securityPhrases to {"Allow this Conversation", "Allow Once", "Allow All", "Always Allow"}

repeat
	try
		tell application "System Events"
			-- Отримуємо всі процеси, що не є фоновими
			set activeProcs to every process whose background only is false
			
			repeat with theProc in activeProcs
				set pName to name of theProc
				
				-- Цілеспрямовано шукаємо тільки в редакторі
				if (pName contains "Antigravity") or (pName contains "Electron") or (pName contains "Cursor") then
					tell theProc
						-- Перевіряємо тільки верхні вікна (діалоги)
						repeat with theWindow in every window
							try
								-- Шукаємо кнопки тільки першого та другого рівня (не рекурсивно на всю глибину)
								set targetButtons to (every UI element of theWindow whose role is "AXButton" and (name is in securityPhrases or description is in securityPhrases))
								
								-- Додатково перевіряємо групи
								set allGroups to every UI element of theWindow whose role is "AXGroup"
								repeat with aGroup in allGroups
									set targetButtons to targetButtons & (every UI element of aGroup whose role is "AXButton" and (name is in securityPhrases or description is in securityPhrases))
								end repeat
								
								repeat with btn in targetButtons
									try
										perform action "AXPress" of btn
										-- log "✓ Security Prompt Allowed"
									end try
								end repeat
							end try
						end tell
					end tell
				end if
			end repeat
		end tell
	on error
		-- мовчки ігноруємо помилки
	end try
	delay 1.0 -- Збільшуємо паузу до 1 секунди, щоб не навантажувати систему
end repeat
