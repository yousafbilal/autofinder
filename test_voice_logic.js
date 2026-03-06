
// Mock logic from VoiceNavigationLogic.js
const ROUTES_MAP = [
    // --- TOOLS & UTILITIES ---
    {
        path: '/price-calculator',
        keywords: [
            'calculator', 'price', 'qimat', 'valuation', 'rate', 'worth', 'estimate', 'hisab', 'check price',
            'gari ki qimat', 'car price'
        ]
    },
    {
        path: '/compare-cars',
        keywords: [
            'compare', 'muqabla', 'comparison', 'vs', 'versus', 'fark', 'difference', 'better',
            'konsi behtar', 'compare cars'
        ]
    },
    {
        path: '/videos',
        keywords: [
            'video', 'videos', 'review', 'youtube', 'watch', 'dekhna', 'test drive', 'walkaround',
            'car reviews', 'gari ki video'
        ]
    },
    {
        path: '/inspection',
        keywords: [
            'inspection', 'checkup', 'check', 'moaina', 'report', 'rating', 'condition', 'mechanic',
            'check karwani', 'inspect', 'car check'
        ]
    },
    {
        path: '/blog',
        keywords: [
            'blog', 'news', 'khabrain', 'article', 'updates', 'latest news', 'auto news', 'information',
            'knowledge', 'news page'
        ]
    },

    // --- MARKETPLACE SECTIONS ---
    {
        path: '/auto-store',
        keywords: [
            'auto store', 'store', 'shop', 'dukan', 'parts', 'spare parts', 'saman', 'accessories',
            'oil', 'filter', 'tyre', 'battery', 'brakes', 'lights', 'bumper', 'gari ka saman'
        ]
    },
    {
        path: '/latest-cars',
        keywords: [
            'new car', 'new cars', 'nayi gari', 'latest', 'upcoming', 'zero meter', 'brand new',
            'launch', '2024', '2025', 'new model'
        ]
    },
    {
        path: '/used-cars',
        keywords: [
            'used car', 'used cars', 'old car', 'purani gari', 'second hand', 'used', 'sasti',
            'budget', 'kam qimat', 'for sale'
        ]
    },
    {
        path: '/bikes',
        keywords: [
            'bike', 'bikes', 'motorcycle', 'motor', 'cycle', 'honda 125', 'cd 70', 'yamaha',
            'scooter', '2 wheeler', 'do pahiya'
        ]
    },
    {
        path: '/new-bikes',
        keywords: [
            'new bike', 'nayi bike', 'new motorcycle', 'zero meter bike'
        ]
    },

    // --- BUYING & SELLING ---
    {
        path: '/sell-car',
        keywords: [
            'sell car', 'car bechni', 'gari bechni', 'sell my car', 'post ad', 'advertisement',
            'add lagana', 'sale', 'bechna'
        ]
    },
    {
        path: '/sell-bike',
        keywords: [
            'sell bike', 'bike bechni', 'motorcycle bechni'
        ]
    },
    {
        path: '/sell-car-parts',
        keywords: [
            'sell parts', 'parts bechnay', 'saman bechna'
        ]
    },
    {
        path: '/rent-car',
        keywords: [
            'rent', 'rental', 'kiraya', 'book car', 'hire', 'booking'
        ]
    },
    {
        path: '/post-rent-car',
        keywords: [
            'rent out', 'kiraye par deni', 'rent offer'
        ]
    },
    {
        path: '/buy-car-for-me',
        keywords: [
            'buy for me', 'manage', 'assistant', 'madad', 'help me buy', 'finance', 'loan', 'installment'
        ]
    },
    {
        path: '/list-it-for-you',
        keywords: [
            'list it for me', 'manage selling', 'premium sell', 'vip'
        ]
    },

    // --- USER DASHBOARD ---
    {
        path: '/profile',
        keywords: [
            'profile', 'account', 'login', 'signup', 'register', 'dashboard', 'my account', 'setting', 'id'
        ]
    },
    {
        path: '/my-ads',
        keywords: [
            'my ads', 'my listings', 'meray ads', 'manage ads', 'active ads'
        ]
    },
    {
        path: '/dealer-packages',
        keywords: [
            'packages', 'plans', 'pricing', 'dealer', 'membership', 'credits', 'coins', 'boost'
        ]
    },

    // --- COMPANY & STATIC ---
    {
        path: '/contact',
        keywords: [
            'contact', 'rabta', 'phone', 'number', 'email', 'address', 'location', 'support', 'call', 'help line'
        ]
    },
    {
        path: '/about',
        keywords: [
            'about', 'company', 'who are we', 'mission', 'team', 'hum kon'
        ]
    },
    {
        path: '/faq',
        keywords: [
            'faq', 'help', 'question', 'answer', 'sawal', 'jawab', 'support center'
        ]
    },
    {
        path: '/privacy-policy',
        keywords: [
            'policy', 'privacy', 'terms', 'conditions', 'rules', 'qanoon', 'legal'
        ]
    },

    // --- GENERAL ---
    {
        path: '/',
        keywords: [
            'home', 'main', 'start', 'shuru', 'wapis', 'back'
        ]
    }
];

const analyzeVoiceCommand = (text) => {
    if (!text || typeof text !== 'string') return { action: 'NONE', path: null };

    const cleanText = text.toLowerCase().trim();

    // Stop words to ignore
    const stopWords = ['open', 'kholo', 'show', 'dikhao', 'page', 'mujhay', 'i', 'want', 'to', 'go', 'hai', 'ka', 'ki', 'wala'];

    const tokens = cleanText.split(/\s+/).filter(t => !stopWords.includes(t));

    if (tokens.length === 0) return { action: 'NONE', path: null };

    let bestMatch = null;
    let maxScore = 0;

    ROUTES_MAP.forEach(route => {
        let score = 0;

        route.keywords.forEach(keyword => {
            if (cleanText.includes(keyword)) {
                score += 10 + (keyword.length * 0.5);
            }

            const keywordTokens = keyword.split(' ');
            keywordTokens.forEach(kt => {
                if (tokens.includes(kt)) {
                    score += 3;
                }
            });
        });

        if (score > maxScore) {
            maxScore = score;
            bestMatch = route;
        }
    });

    if (maxScore >= 3 && bestMatch) {
        return { action: 'NAVIGATE', path: bestMatch.path, score: maxScore };
    }

    return { action: 'SEARCH', path: null, score: maxScore };
};

// TESTS
const tests = [
    "New Car",
    "Auto Store",
    "Blog",
    "Calculator",
    "Page ni open kr aha na autostore",
    "autostore kholo",
    "blog wala page kholo",
    "calculator kholo"
];

tests.forEach(t => {
    console.log(`"${t}" ->`, analyzeVoiceCommand(t));
});
