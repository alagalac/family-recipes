// Register service worker for PWA support
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => {
        console.log('Service Worker registration failed:', err);
    });
}

// Haptic feedback helper
function hapticFeedback(pattern = 'light') {
    if ('vibrate' in navigator) {
        if (pattern === 'light') {
            navigator.vibrate(10);
        } else if (pattern === 'medium') {
            navigator.vibrate(20);
        } else if (pattern === 'strong') {
            navigator.vibrate([30, 20, 30]);
        }
    }
}

// Wake Lock management
let wakeLock = null;

async function requestWakeLock() {
    try {
        if ('wakeLock' in navigator) {
            wakeLock = await navigator.wakeLock.request('screen');
            wakeLock.addEventListener('release', () => {
                wakeLock = null;
            });
        }
    } catch (err) {
        console.log('Wake Lock request failed:', err);
    }
}

async function releaseWakeLock() {
    if (wakeLock) {
        await wakeLock.release();
        wakeLock = null;
    }
}

const { useState, useEffect, useRef } = React;

// Recipe List Component
function RecipeList({ recipes, onSelectRecipe, searchQuery, setSearchQuery, listRef }) {
    const filteredRecipes = recipes.filter(recipe => {
        const query = searchQuery.toLowerCase();
        const titleMatch = String(recipe.title || '').toLowerCase().includes(query);
        const ingredientMatch = JSON.stringify(recipe.ingredients).toLowerCase().includes(query);
        return titleMatch || ingredientMatch;
    });

    // Group by section
    const grouped = {};
    filteredRecipes.forEach(recipe => {
        if (!grouped[recipe.section]) {
            grouped[recipe.section] = [];
        }
        grouped[recipe.section].push(recipe);
    });

    return React.createElement('div', { className: 'recipe-list', ref: listRef },
        Object.entries(grouped).map(([section, items]) =>
            React.createElement('div', { key: section, className: 'section' },
                searchQuery === '' ? React.createElement('h2', null, section) : null,
                items.map(recipe =>
                    React.createElement('button', {
                        key: recipe.id,
                        type: 'button',
                        className: 'recipe-list-item',
                        onClick: () => {
                            hapticFeedback('light');
                            onSelectRecipe(recipe.id);
                        }
                    },
                    React.createElement('h3', null, recipe.title),
                    (recipe.prep_time || recipe.cook_time) ? React.createElement('p', { className: 'recipe-meta' },
                        recipe.prep_time ? React.createElement('span', null, '⏱ ' + recipe.prep_time) : null,
                        recipe.cook_time ? React.createElement('span', null, ' 🍳 ' + recipe.cook_time) : null
                    ) : null
                    )
                )
            )
        ),
        filteredRecipes.length === 0 ? React.createElement('p', { className: 'no-results' }, `No recipes found matching "${searchQuery}"`) : null
    );
}

// Recipe Detail Component
function RecipeDetail({ recipe, onBack, keepScreenOn, setKeepScreenOn }) {
    const renderIngredients = (ingredients) => {
        if (Array.isArray(ingredients)) {
            return React.createElement('ul', null,
                ingredients.map((ing, idx) =>
                    ing ? React.createElement('li', { key: idx }, ing) : null
                )
            );
        } else if (ingredients && typeof ingredients === 'object') {
            return React.createElement('div', null,
                Object.entries(ingredients).map(([subheading, items]) =>
                    React.createElement('div', { key: subheading },
                        React.createElement('h4', null, subheading),
                        React.createElement('ul', null,
                            Array.isArray(items) ? items.map((ing, idx) =>
                                ing ? React.createElement('li', { key: idx }, ing) : null
                            )
                            : null
                        )
                    )
                )
            );
        }
        return null;
    };

    const renderInstructions = (instructions) => {
        if (Array.isArray(instructions)) {
            return React.createElement('ol', null,
                instructions.map((step, idx) =>
                    step ? React.createElement('li', { key: idx }, step) : null
                )
            );
        } else if (instructions && typeof instructions === 'object') {
            return React.createElement('div', null,
                Object.entries(instructions).map(([subheading, steps]) =>
                    React.createElement('div', { key: subheading },
                        React.createElement('h4', null, subheading),
                        React.createElement('ol', null,
                            Array.isArray(steps) ? steps.map((step, idx) =>
                                step ? React.createElement('li', { key: idx }, step) : null
                            )
                            : null
                        )
                    )
                )
            );
        }
        return null;
    };

    const hasNotes = recipe.notes && (
        (typeof recipe.notes === 'string' && recipe.notes.trim() !== '') ||
        (Array.isArray(recipe.notes) && recipe.notes.some(note => typeof note === 'string' && note.trim() !== ''))
    );

    return React.createElement('div', { 
        className: 'recipe-detail'
    },
        React.createElement('div', { className: 'app-header recipe-header' },
            React.createElement('button', {
                className: 'back-btn',
                onClick: () => {
                    hapticFeedback('light');
                    onBack();
                },
                'aria-label': 'Back to recipes'
            }, '← Back'),
            React.createElement('button', {
                className: `keep-screen-on-btn ${keepScreenOn ? 'active' : ''}`,
                onClick: () => {
                    hapticFeedback('light');
                    if (!keepScreenOn) {
                        requestWakeLock();
                        setKeepScreenOn(true);
                    } else {
                        releaseWakeLock();
                        setKeepScreenOn(false);
                    }
                },
                'aria-label': keepScreenOn ? 'Turn off keep screen on' : 'Keep screen on',
                'aria-pressed': keepScreenOn
            }, keepScreenOn ? '💡' : '⚪')
        ),
        React.createElement('div', { className: 'recipe-content' },
            React.createElement('h1', null, recipe.title),
            recipe.commentary ? React.createElement('blockquote', { className: 'commentary' }, recipe.commentary) : null,
            React.createElement('div', { className: 'meta' },
                React.createElement('strong', null, 'Prep Time:'),
                ' ' + (recipe.prep_time || 'N/A') + ' | ',
                React.createElement('strong', null, 'Cook Time:'),
                ' ' + (recipe.cook_time || 'N/A') + ' | ',
                React.createElement('strong', null, 'Servings:'),
                ' ' + (recipe.servings || 'N/A')
            ),
            React.createElement('div', { className: 'recipe-columns' },
                React.createElement('div', { className: 'ingredients' },
                    React.createElement('h3', null, 'Ingredients'),
                    renderIngredients(recipe.ingredients)
                ),
                React.createElement('div', { className: 'instructions' },
                    React.createElement('h3', null, 'Instructions'),
                    renderInstructions(recipe.instructions)
                )
            ),
            hasNotes ? React.createElement('div', { className: 'notes' },
                React.createElement('h4', null, 'Notes'),
                typeof recipe.notes === 'string' ?
                    React.createElement('p', null, recipe.notes) :
                    Array.isArray(recipe.notes) ?
                    React.createElement('ul', null,
                        recipe.notes.filter(note => typeof note === 'string' && note.trim() !== '').map((note, idx) =>
                            React.createElement('li', { key: idx }, note)
                        )
                    ) : null
            ) : null,
            recipe.attribution && recipe.attribution.trim() !== '' ? React.createElement('div', { className: 'attribution' },
                React.createElement('strong', null, 'Attribution: '),
                recipe.attribution
            ) : null
        )
    );
}

// Main App Component
function App() {
    const [recipes, setRecipes] = useState([]);
    const [selectedRecipeId, setSelectedRecipeId] = useState(() => window.location.hash.slice(1) || null);
    const [searchQuery, setSearchQuery] = useState('');
    const [keepScreenOn, setKeepScreenOn] = useState(localStorage.getItem('keepScreenOn') === 'true');
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState(null);
    const [loadAttempt, setLoadAttempt] = useState(0);
    const listRef = useRef(null);

    useEffect(() => {
        let cancelled = false;
        setLoading(true);
        setLoadError(null);

        fetch('recipes.json', { cache: 'no-cache' })
            .then(res => {
                if (!res.ok) {
                    throw new Error(`Recipe data request failed (${res.status})`);
                }
                return res.json();
            })
            .then(data => {
                if (cancelled) {
                    return;
                }
                if (!Array.isArray(data)) {
                    throw new Error('Recipe data is not an array');
                }
                setRecipes(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading recipes:', err);
                if (!cancelled) {
                    setLoadError('The recipes could not be loaded. Check your connection and try again.');
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [loadAttempt]);

    useEffect(() => {
        const handleHistoryChange = () => {
            setSelectedRecipeId(window.location.hash.slice(1) || null);
        };
        window.addEventListener('popstate', handleHistoryChange);
        return () => window.removeEventListener('popstate', handleHistoryChange);
    }, []);

    useEffect(() => {
        localStorage.setItem('keepScreenOn', keepScreenOn);
        if (selectedRecipeId) {
            if (keepScreenOn) {
                requestWakeLock();
            } else {
                releaseWakeLock();
            }
        } else {
            releaseWakeLock();
        }
    }, [keepScreenOn, selectedRecipeId]);

    useEffect(() => {
        const reacquireWakeLock = () => {
            if (keepScreenOn && selectedRecipeId && document.visibilityState === 'visible') {
                requestWakeLock();
            }
        };
        document.addEventListener('visibilitychange', reacquireWakeLock);
        return () => document.removeEventListener('visibilitychange', reacquireWakeLock);
    }, [keepScreenOn, selectedRecipeId]);

    const handleSelectRecipe = (recipeId) => {
        // Save current scroll position before navigating
        if (listRef.current) {
            localStorage.setItem('recipeListScrollY', listRef.current.scrollTop);
        }
        window.history.pushState({ recipeId }, '', `#${recipeId}`);
        setSelectedRecipeId(recipeId);
    };

    const handleBackFromRecipe = () => {
        if (window.history.state && window.history.state.recipeId) {
            window.history.back();
            return;
        }
        window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}`);
        setSelectedRecipeId(null);
        // Restore scroll position when returning to list
        setTimeout(() => {
            if (listRef.current) {
                const savedScrollY = localStorage.getItem('recipeListScrollY');
                if (savedScrollY) {
                    listRef.current.scrollTop = parseInt(savedScrollY);
                }
            }
        }, 0);
    };

    const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);

    if (loading) {
        return React.createElement('div', { className: 'loading' }, 'Loading recipes...');
    }

    if (loadError) {
        return React.createElement('div', { className: 'load-error', role: 'alert' },
            React.createElement('h1', null, 'Cookbook unavailable'),
            React.createElement('p', null, loadError),
            React.createElement('button', {
                type: 'button',
                className: 'retry-btn',
                onClick: () => setLoadAttempt(attempt => attempt + 1)
            }, 'Try again')
        );
    }

    if (selectedRecipeId && selectedRecipe) {
        return React.createElement(RecipeDetail, {
            recipe: selectedRecipe,
            onBack: handleBackFromRecipe,
            keepScreenOn: keepScreenOn,
            setKeepScreenOn: setKeepScreenOn
        });
    }

    return React.createElement('div', { className: 'app' },
        React.createElement('header', { className: 'app-header' },
            React.createElement('h1', null, 'Cookbook'),
            React.createElement('div', { className: 'header-controls' },
                React.createElement('div', { className: 'search-container' },
                    React.createElement('input', {
                        type: 'text',
                        className: 'search-input',
                        placeholder: 'Search recipes...',
                        inputMode: 'search',
                        enterKeyHint: 'search',
                        value: searchQuery,
                        onChange: (e) => setSearchQuery(e.target.value),
                        'aria-label': 'Search recipes'
                    }),
                    searchQuery ? React.createElement('button', {
                        className: 'search-clear-btn',
                        onClick: () => setSearchQuery(''),
                        'aria-label': 'Clear search'
                    }, '✕') : null
                ),
                React.createElement('button', {
                    className: `keep-screen-on-btn ${keepScreenOn ? 'active' : ''}`,
                    onClick: () => {
                        hapticFeedback('light');
                        if (!keepScreenOn) {
                            requestWakeLock();
                            setKeepScreenOn(true);
                        } else {
                            releaseWakeLock();
                            setKeepScreenOn(false);
                        }
                    },
                        'aria-label': keepScreenOn ? 'Turn off keep screen on' : 'Keep screen on',
                        'aria-pressed': keepScreenOn
                }, keepScreenOn ? '💡' : '⚪')
            )
        ),
        React.createElement(RecipeList, {
            recipes: recipes,
            onSelectRecipe: handleSelectRecipe,
            searchQuery: searchQuery,
            setSearchQuery: setSearchQuery,
            listRef: listRef
        })
    );
}

// Render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
