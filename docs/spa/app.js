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
function RecipeList({ recipes, onSelectRecipe, searchQuery, setSearchQuery }) {
    const filteredRecipes = recipes.filter(recipe => {
        const query = searchQuery.toLowerCase();
        const titleMatch = recipe.title.toLowerCase().includes(query);
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

    return React.createElement('div', { className: 'recipe-list' },
        Object.entries(grouped).map(([section, items]) =>
            React.createElement('div', { key: section, className: 'section' },
                searchQuery === '' ? React.createElement('h2', null, section) : null,
                items.map(recipe =>
                    React.createElement('div', {
                        key: recipe.id,
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
                    React.createElement('li', { key: idx }, ing)
                )
            );
        } else if (typeof ingredients === 'object') {
            return React.createElement('div', null,
                Object.entries(ingredients).map(([subheading, items]) =>
                    React.createElement('div', { key: subheading },
                        React.createElement('h4', null, subheading),
                        React.createElement('ul', null,
                            items.map((ing, idx) =>
                                React.createElement('li', { key: idx }, ing)
                            )
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
                    React.createElement('li', { key: idx }, step)
                )
            );
        } else if (typeof instructions === 'object') {
            return React.createElement('div', null,
                Object.entries(instructions).map(([subheading, steps]) =>
                    React.createElement('div', { key: subheading },
                        React.createElement('h4', null, subheading),
                        React.createElement('ol', null,
                            steps.map((step, idx) =>
                                React.createElement('li', { key: idx }, step)
                            )
                        )
                    )
                )
            );
        }
        return null;
    };

    return React.createElement('div', { className: 'recipe-detail' },
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
                'aria-label': 'Keep screen on'
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
            recipe.notes ? React.createElement('div', { className: 'notes' },
                React.createElement('h4', null, 'Notes'),
                typeof recipe.notes === 'string' ?
                    React.createElement('p', null, recipe.notes) :
                    Array.isArray(recipe.notes) && recipe.notes.length > 0 ?
                    React.createElement('ul', null,
                        recipe.notes.map((note, idx) =>
                            React.createElement('li', { key: idx }, note)
                        )
                    ) : null
            ) : null,
            recipe.attribution ? React.createElement('div', { className: 'attribution' },
                React.createElement('strong', null, 'Attribution: '),
                recipe.attribution
            ) : null
        )
    );
}

// Main App Component
function App() {
    const [recipes, setRecipes] = useState([]);
    const [selectedRecipeId, setSelectedRecipeId] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [keepScreenOn, setKeepScreenOn] = useState(localStorage.getItem('keepScreenOn') === 'true');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Load recipes from JSON
        fetch('recipes.json')
            .then(res => res.json())
            .then(data => {
                setRecipes(data);
                setLoading(false);
            })
            .catch(err => {
                console.error('Error loading recipes:', err);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        localStorage.setItem('keepScreenOn', keepScreenOn);
        if (selectedRecipeId) {
            if (keepScreenOn) {
                requestWakeLock();
            } else {
                releaseWakeLock();
            }
        }
    }, [keepScreenOn, selectedRecipeId]);

    const selectedRecipe = recipes.find(r => r.id === selectedRecipeId);

    if (loading) {
        return React.createElement('div', { className: 'loading' }, 'Loading recipes...');
    }

    if (selectedRecipeId && selectedRecipe) {
        return React.createElement(RecipeDetail, {
            recipe: selectedRecipe,
            onBack: () => setSelectedRecipeId(null),
            keepScreenOn: keepScreenOn,
            setKeepScreenOn: setKeepScreenOn
        });
    }

    return React.createElement('div', { className: 'app' },
        React.createElement('header', { className: 'app-header' },
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
                    'aria-label': 'Keep screen on'
                }, keepScreenOn ? '💡' : '⚪')
            )
        ),
        React.createElement(RecipeList, {
            recipes: recipes,
            onSelectRecipe: setSelectedRecipeId,
            searchQuery: searchQuery,
            setSearchQuery: setSearchQuery
        })
    );
}

// Render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(React.createElement(App));
