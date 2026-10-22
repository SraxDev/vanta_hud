-- T('English text', ...) returns the text in Config.Locale; unknown texts stay in English.
local dict = Locales and Locales[Config.Locale]

function T(text, ...)
    text = dict and dict[text] or text
    if select('#', ...) > 0 then return text:format(...) end
    return text
end
