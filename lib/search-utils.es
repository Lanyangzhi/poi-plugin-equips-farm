// Search utility functions for multi-language support

/**
 * Normalize string for comparison (lowercase, remove spaces)
 */
export function normalizeString(str) {
    if (!str) return ''
    return String(str).toLowerCase().replace(/\s+/g, '')
}

/**
 * Check if query matches any of the provided name variants
 * @param {string} query - User search query
 * @param {Object} nameVariants - Object containing name, chinese_name, yomi, etc.
 * @returns {boolean}
 */
export function matchesSearch(query, nameVariants) {
    if (!query) return true
    
    const normalizedQuery = normalizeString(query)
    
    // Check all available name fields
    const fieldsToCheck = [
        nameVariants.api_name,           // Japanese name from game API
        nameVariants.name,                // Japanese name from WCTF
        nameVariants.chinese_name,        // Chinese name from WCTF
        nameVariants.api_yomi,            // Reading (hiragana) from game API
        nameVariants.yomi,                // Reading (hiragana) from WCTF Detail API
        nameVariants.wiki_id,             // Wiki ID
        nameVariants.filename,            // Filename (often romaji-based)
    ]
    
    // Check direct matches
    for (const field of fieldsToCheck) {
        if (field && normalizeString(field).includes(normalizedQuery)) {
            return true
        }
    }
    
    // Check if query might be romaji - convert Japanese reading to romaji
    // Try both api_yomi (from game) and yomi (from WCTF)
    const yomiField = nameVariants.yomi || nameVariants.api_yomi
    if (yomiField) {
        const romaji = hiraganaToRomaji(yomiField)
        if (normalizeString(romaji).includes(normalizedQuery)) {
            return true
        }
    }
    
    // Filename often contains romaji-like strings
    if (nameVariants.filename) {
        if (normalizeString(nameVariants.filename).includes(normalizedQuery)) {
            return true
        }
    }
    
    return false
}

/**
 * Simple Hiragana to Romaji conversion
 * Based on Hepburn romanization
 */
const HIRAGANA_TO_ROMAJI = {
    'あ': 'a', 'い': 'i', 'う': 'u', 'え': 'e', 'お': 'o',
    'か': 'ka', 'き': 'ki', 'く': 'ku', 'け': 'ke', 'こ': 'ko',
    'が': 'ga', 'ぎ': 'gi', 'ぐ': 'gu', 'げ': 'ge', 'ご': 'go',
    'さ': 'sa', 'し': 'shi', 'す': 'su', 'せ': 'se', 'そ': 'so',
    'ざ': 'za', 'じ': 'ji', 'ず': 'zu', 'ぜ': 'ze', 'ぞ': 'zo',
    'た': 'ta', 'ち': 'chi', 'つ': 'tsu', 'て': 'te', 'と': 'to',
    'だ': 'da', 'ぢ': 'ji', 'づ': 'zu', 'で': 'de', 'ど': 'do',
    'な': 'na', 'に': 'ni', 'ぬ': 'nu', 'ね': 'ne', 'の': 'no',
    'は': 'ha', 'ひ': 'hi', 'ふ': 'fu', 'へ': 'he', 'ほ': 'ho',
    'ば': 'ba', 'び': 'bi', 'ぶ': 'bu', 'べ': 'be', 'ぼ': 'bo',
    'ぱ': 'pa', 'ぴ': 'pi', 'ぷ': 'pu', 'ぺ': 'pe', 'ぽ': 'po',
    'ま': 'ma', 'み': 'mi', 'む': 'mu', 'め': 'me', 'も': 'mo',
    'や': 'ya', 'ゆ': 'yu', 'よ': 'yo',
    'ら': 'ra', 'り': 'ri', 'る': 'ru', 'れ': 're', 'ろ': 'ro',
    'わ': 'wa', 'ゐ': 'wi', 'ゑ': 'we', 'を': 'wo', 'ん': 'n',
    'きゃ': 'kya', 'きゅ': 'kyu', 'きょ': 'kyo',
    'しゃ': 'sha', 'しゅ': 'shu', 'しょ': 'sho',
    'ちゃ': 'cha', 'ちゅ': 'chu', 'ちょ': 'cho',
    'にゃ': 'nya', 'にゅ': 'nyu', 'にょ': 'nyo',
    'ひゃ': 'hya', 'ひゅ': 'hyu', 'ひょ': 'hyo',
    'みゃ': 'mya', 'みゅ': 'myu', 'みょ': 'myo',
    'りゃ': 'rya', 'りゅ': 'ryu', 'りょ': 'ryo',
    'ぎゃ': 'gya', 'ぎゅ': 'gyu', 'ぎょ': 'gyo',
    'じゃ': 'ja', 'じゅ': 'ju', 'じょ': 'jo',
    'びゃ': 'bya', 'びゅ': 'byu', 'びょ': 'byo',
    'ぴゃ': 'pya', 'ぴゅ': 'pyu', 'ぴょ': 'pyo',
    'っ': '',  // Small tsu (gemination)
    'ー': '',  // Long vowel mark
}

export function hiraganaToRomaji(hiragana) {
    if (!hiragana) return ''
    
    let result = ''
    let i = 0
    
    while (i < hiragana.length) {
        // Try 2-character combinations first
        const twoChar = hiragana.substring(i, i + 2)
        const twoMapped = HIRAGANA_TO_ROMAJI[twoChar]
        if (twoMapped !== undefined) {
            result += twoMapped
            i += 2
            continue
        }
        
        // Try single character
        // NOTE: mapped values may be '' (small tsu, long vowel mark),
        // which is falsy - must check for undefined instead.
        const oneChar = hiragana[i]
        const mapped = HIRAGANA_TO_ROMAJI[oneChar]
        if (mapped !== undefined) {
            result += mapped
        } else {
            result += oneChar  // Keep as-is if not found
        }
        i++
    }
    
    return result
}

/**
 * Get display name based on current language
 * @param {Object} item - Ship or equipment data
 * @param {string} language - Current language (zh-CN, en-US, ja-JP)
 * @returns {string}
 */
export function getDisplayName(item, language = 'zh-CN') {
    if (!item) return ''
    
    // Priority order based on language
    if (language === 'zh-CN' || language === 'zh-TW') {
        return item.chinese_name || item.api_name || item.name || ''
    } else if (language === 'ja-JP') {
        return item.api_name || item.name || item.chinese_name || ''
    } else {
        // English - try to use romaji or fallback
        return item.api_name || item.name || item.chinese_name || ''
    }
}
