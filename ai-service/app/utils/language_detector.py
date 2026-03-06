import re

def detect_language(text: str) -> str:
    """
    Detect Ethiopian language from text.
    Uses simple heuristics: Ge'ez script indicates Amharic/Tigrinya,
    common words indicate Oromo, etc.
    For production, consider using fastText or langdetect, but this works for MVP.
    """
    text_lower = text.lower()
    
    # Check for Ge'ez script (Unicode range: U+1200 to U+137F)
    geez_chars = re.compile(r'[\u1200-\u137F]')
    if geez_chars.search(text):
        # Could be Amharic or Tigrinya; we'll default to Amharic and let model handle
        # In future, you could add specific Ge'ez word lists to differentiate.
        return "am"
    
    # Common Oromo words (Latin script)
    oromo_indicators = [
        "akkam", "maal", "taate", "gaarii", "hamaa", "jira", "jirtu",
        "kana", "jaaladha", "barbaadu", "raakkisaa", "hubachuun"
    ]
    if any(word in text_lower for word in oromo_indicators):
        return "om"
    
    # Common Tigrinya words (Latin script)
    tigrinya_indicators = [
        "selam", "kemey", "ale", "ayyu", "yihan", "kamay", "mesale",
        "ayfellegine", "ayidelan", "deko", "alewu", "tsibuq"
    ]
    if any(word in text_lower for word in tigrinya_indicators):
        return "ti"
    
    # Default to English (will use fallback model)
    return "en"