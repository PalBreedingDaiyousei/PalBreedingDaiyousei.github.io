import { palRecords, PalName } from './pals.js';
import { findBreedingTree, BreedingTreeNode } from './calculator.js';
import { 
    getLanguageText, 
    LanguageCode, 
    UI_TEXT_TITLE,
    UI_TEXT_LANGUAGE,
    UI_TEXT_CURRENT_SELECTIONS,
    UI_TEXT_DESIRED_PAL,
    UI_TEXT_NONE,
    UI_TEXT_REQUIRED_PARENTS,
    UI_TEXT_MAX_FORMULA_BUDGET,
    UI_TEXT_MIN_FORMULA_TO_USE,
    UI_TEXT_BREEDING_TREES,
    UI_TEXT_SELECT_DESIRED_PAL,
    UI_TEXT_SEARCH_FOR_PAL,
    UI_TEXT_SEARCH_FOR_PARENTS,
    UI_TEXT_NO_VALID_TREE,
    UI_TEXT_TREE_NUMBER,
    UI_TEXT_MAX_4_PARENTS,
    UI_TEXT_CALCULATING,
    UI_TEXT_TOGGLE_THEME,
    UI_TEXT_SAVE_QUERY,
    UI_TEXT_PLEASE_SELECT_DESIRED_PAL,
    UI_TEXT_FAVORITE_QUERIES
} from './language.js';

interface BreedingQuery {
    child: PalName;
    requiredParents: PalName[];
    maxFormulas: number;
    minFormulas: number;
};

const FAVORITE_QUERIES_COOKIE = 'palBreedingQueries';

function getQueryKey(query: BreedingQuery): string {
    const parentsKey = [...query.requiredParents].sort().join(',');
    return `${query.child}|${parentsKey}|${query.maxFormulas}|${query.minFormulas}`;
}

function loadFavoriteQueriesFromCookie(): BreedingQuery[] {
    const cookieValue = document.cookie.split('; ').find(row => row.startsWith(FAVORITE_QUERIES_COOKIE + '='));
    if (!cookieValue) {
        return [];
    }

    try {
        const queries = JSON.parse(decodeURIComponent(cookieValue.split('=')[1])) as BreedingQuery[];
        return queries;
    } catch (error) {
        console.error('Error parsing cookie:', error);
        return [];
    }
};

function saveFavoriteQueriesToCookie(queries: BreedingQuery[]): void {
    if (queries.length > 100) {
        queries.length = 100; // Keep only the latest 100 entries
    }

    const expires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${FAVORITE_QUERIES_COOKIE}=${encodeURIComponent(JSON.stringify(queries))}; expires=${expires}; path=/; samesite=strict`;
}

function addFavoriteQueryToCookie(query: BreedingQuery): void {
    let queries = loadFavoriteQueriesFromCookie();

    const queryKey = getQueryKey(query);
    const queryExists = queries.findIndex(q => getQueryKey(q) === queryKey);

    if (queryExists > -1) {
        queries.splice(queryExists, 1);
    }

    queries.unshift(query);
    saveFavoriteQueriesToCookie(queries);
}

document.addEventListener('DOMContentLoaded', () => {
    const languageSelector = document.getElementById('language-selector') as HTMLSelectElement;
    const childSelector = document.getElementById('child-selector') as HTMLDivElement;
    const childSelectorValue = document.getElementById('child-selector-value') as HTMLInputElement;
    const childSearch = document.getElementById('child-search') as HTMLInputElement;
    const parentsSelector = document.getElementById('parents-selector') as HTMLDivElement;
    const parentSearch = document.getElementById('parent-search') as HTMLInputElement;
    const maxBudgetSelector = document.getElementById('max-budget-selector') as HTMLInputElement;
    const minBudgetSelector = document.getElementById('min-budget-selector') as HTMLInputElement;
    const treesContainer = document.getElementById('trees-container') as HTMLDivElement;
    const loadingIndicator = document.getElementById('loading-indicator') as HTMLDivElement;
    const selectedChildDisplay = document.getElementById('selected-child-display') as HTMLSpanElement;
    const selectedParentsDisplay = document.getElementById('selected-parents-display') as HTMLDivElement;
    const themeToggleButton = document.getElementById('theme-toggle') as HTMLButtonElement;
    const saveQueryButton = document.getElementById('save-query-button') as HTMLButtonElement;
    const favoriteQueriesContainer = document.getElementById('favorite-queries-container') as HTMLDivElement;

    let currentLanguage: LanguageCode = 'zh-CN';
    let currentQuery: BreedingQuery | null = null;
    let allTrees: BreedingTreeNode[] = [];
    let displayedTreesCount = 0;
    const treesPerLoad = 20;

    const parseCurrentQuery = (): BreedingQuery | null => {
        const child = childSelectorValue.value as PalName;
        if (!child) return null;

        const requiredParents = Array.from(parentsSelector.querySelectorAll<HTMLInputElement>('input:checked'))
                                     .map(cb => cb.value as PalName);
        const maxFormulas = parseInt(maxBudgetSelector.value, 10);
        const minFormulas = parseInt(minBudgetSelector.value, 10);

        return {
            child,
            requiredParents,
            maxFormulas,
            minFormulas
        };
    };


    const createPalIcon = (palName: PalName, size: number = 32): HTMLImageElement => {
        const icon = document.createElement('img');
        icon.src = `icons/${palName}.png`;
        icon.alt = palName;
        icon.style.width = `${size}px`;
        icon.style.height = `${size}px`;
        icon.style.verticalAlign = 'middle';
        icon.style.marginRight = '5px';
        icon.onerror = () => { icon.style.display = 'none'; };
        return icon;
    };

    const createPalSpan = (palName: PalName, bold: boolean = false): HTMLSpanElement => {
        const span = document.createElement('span');
        span.style.whiteSpace = 'nowrap';
        span.style.display = 'inline-flex';
        span.style.alignItems = 'center';
        span.style.margin = '2px 0';
        if (bold) {
            span.style.fontWeight = 'bold';
        }

        span.appendChild(createPalIcon(palName));
        span.append(getLanguageText(currentLanguage, palName));
        return span;
    };

    const palNames = Object.keys(palRecords).sort() as PalName[];

    const updateDisabledStates = () => {
        const selectedChild = childSelectorValue.value as PalName;
        const selectedParents = new Set<PalName>(
            Array.from(parentsSelector.querySelectorAll<HTMLInputElement>('input:checked'))
                 .map(cb => cb.value as PalName)
        );

        // Disable parent checkbox if it's the selected child
        palNames.forEach(name => {
            const parentCheckbox = document.getElementById(`parent-${name}`) as HTMLInputElement;
            if (parentCheckbox) {
                parentCheckbox.disabled = (name === selectedChild);
                if (name === selectedChild && parentCheckbox.checked) {
                    parentCheckbox.checked = false;
                }
            }

            // Disable child radio if it's a selected parent
            const childRadio = document.getElementById(`child-${name}`) as HTMLInputElement;
            if (childRadio) {
                childRadio.disabled = selectedParents.has(name);
                if (selectedParents.has(name) && childRadio.checked) {
                    childRadio.checked = false;
                    childSelectorValue.value = '';
                }
            }
        });
    };

    const populatePalLists = () => {
        childSelector.innerHTML = '';
        parentsSelector.innerHTML = '';

        palNames.forEach(name => {
            // Child list
            const childLabel = document.createElement('label');
            childLabel.className = 'parent-item';
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'child-pal';
            radio.value = name;
            radio.id = `child-${name}`;
            radio.addEventListener('change', () => {
                childSelectorValue.value = name;
                updateDisabledStates();
                updateTrees();
                updateSelectionSummary();
                updateSelectedStyles();
            });

            childLabel.appendChild(radio);
            childLabel.appendChild(createPalIcon(name));
            const childNameSpan = document.createElement('span');
            childNameSpan.textContent = getLanguageText(currentLanguage, name);
            childLabel.appendChild(childNameSpan);
            childSelector.appendChild(childLabel);

            // Parents checklist
            const parentLabel = document.createElement('label');
            parentLabel.className = 'parent-item';
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.value = name;
            checkbox.id = `parent-${name}`;

            parentLabel.appendChild(checkbox);
            parentLabel.appendChild(createPalIcon(name));
            const parentNameSpan = document.createElement('span');
            parentNameSpan.textContent = getLanguageText(currentLanguage, name);
            parentLabel.appendChild(parentNameSpan);
            parentsSelector.appendChild(parentLabel);
        });
    }

    const updateTrees = async () => {
        updateSelectionSummary();
        currentQuery = parseCurrentQuery();

        if (!currentQuery) {
            treesContainer.innerHTML = `<p>${getLanguageText(currentLanguage, UI_TEXT_SELECT_DESIRED_PAL)}</p>`;
            return;
        }

        loadingIndicator.style.display = 'block';
        treesContainer.style.display = 'none';

        await new Promise(resolve => setTimeout(resolve, 0));

        const trees = findBreedingTree(currentQuery.child, new Set(currentQuery.requiredParents), currentQuery.maxFormulas, currentQuery.minFormulas);
        
        loadingIndicator.style.display = 'none';
        treesContainer.style.display = 'block';
        allTrees = trees;
        displayedTreesCount = 0;
        treesContainer.innerHTML = '';
        renderTrees();
    };

    const renderTrees = () => {
        const toRender = allTrees.slice(displayedTreesCount, displayedTreesCount + treesPerLoad);

        if (toRender.length === 0 && displayedTreesCount === 0) {
            treesContainer.innerHTML = `<p>${getLanguageText(currentLanguage, UI_TEXT_NO_VALID_TREE)}</p>`;
            return;
        }

        toRender.forEach((tree, index) => {
            const treeDiv = document.createElement('div');
            treeDiv.className = 'tree';
            treeDiv.innerHTML = `<h4>${getLanguageText(currentLanguage, UI_TEXT_TREE_NUMBER)}${displayedTreesCount + index + 1}</h4>`;
            const list = document.createElement('ul');
            renderNode(tree, list);
            treeDiv.appendChild(list);
            treesContainer.appendChild(treeDiv);

            // Staggered animation
            setTimeout(() => {
                treeDiv.classList.add('show');
            }, index * 100); // 100ms delay between each tree
        });

        displayedTreesCount += toRender.length;
    };

    const renderNode = (node: BreedingTreeNode, parentElement: HTMLElement) => {
        const li = document.createElement('li');
        
        const formulaContainer = document.createElement('div');
        formulaContainer.style.display = 'flex';
        formulaContainer.style.alignItems = 'center';
        formulaContainer.style.gap = '0.5rem';
        formulaContainer.style.flexWrap = 'wrap';

        formulaContainer.appendChild(createPalSpan(node.formula.lhs, currentQuery?.requiredParents.includes(node.formula.lhs) || false));
        formulaContainer.append('+');
        formulaContainer.appendChild(createPalSpan(node.formula.rhs, currentQuery?.requiredParents.includes(node.formula.rhs) || false));
        formulaContainer.append('=');
        formulaContainer.appendChild(createPalSpan(node.formula.child));
        
        li.appendChild(formulaContainer);

        if (node.left || node.right) {
            const ul = document.createElement('ul');
            if (node.left) {
                renderNode(node.left, ul);
            }
            if (node.right) {
                renderNode(node.right, ul);
            }
            li.appendChild(ul);
        }
        parentElement.appendChild(li);
    };
    
    const filterPals = (input: HTMLInputElement, list: HTMLDivElement) => {
        const searchTerm = input.value.toLowerCase();
        const items = list.getElementsByClassName('parent-item');
        Array.from(items).forEach(item => {
            const label = item as HTMLLabelElement;
            const name = label.textContent?.trim().toLowerCase() || '';
            const inputElement = label.querySelector('input');
            const isChecked = inputElement ? (inputElement as HTMLInputElement).checked : false;

            if (name.includes(searchTerm) || isChecked) {
                label.style.display = 'flex';
            } else {
                label.style.display = 'none';
            }
        });
    };

    const handleParentSelectionChange = (event: Event) => {
        const target = event.target as HTMLInputElement;
        if (target.type === 'checkbox' && target.checked) {
            const checkedCheckboxes = parentsSelector.querySelectorAll<HTMLInputElement>('input:checked');
            if (checkedCheckboxes.length > 4) {
                target.checked = false;
                alert(getLanguageText(currentLanguage, UI_TEXT_MAX_4_PARENTS));
                return;
            }
        }
        updateDisabledStates();
        updateTrees();
        updateSelectedStyles();
    };

    const updateSelectedStyles = () => {
        // For child list (radios)
        const childItems = childSelector.querySelectorAll('.parent-item');
        childItems.forEach(item => {
            const radio = item.querySelector('input[type="radio"]') as HTMLInputElement;
            if (radio.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });

        // For parent list (checkboxes)
        const parentItems = parentsSelector.querySelectorAll('.parent-item');
        parentItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
            if (checkbox.checked) {
                item.classList.add('selected');
            } else {
                item.classList.remove('selected');
            }
        });
    };

    const updateSelectionSummary = () => {
        const child = childSelectorValue.value as PalName;
        selectedChildDisplay.innerHTML = '';
        if (child) {
            selectedChildDisplay.appendChild(createPalIcon(child));
            selectedChildDisplay.append(getLanguageText(currentLanguage, child));
        } else {
            selectedChildDisplay.textContent = getLanguageText(currentLanguage, UI_TEXT_NONE);
        }

        const requiredParents = Array.from(parentsSelector.querySelectorAll<HTMLInputElement>('input:checked'))
                                     .map(cb => cb.value as PalName);

        selectedParentsDisplay.innerHTML = '';
        if (requiredParents.length > 0) {
            requiredParents.forEach(palName => {
                const palSpan = createPalSpan(palName);
                palSpan.style.marginRight = '10px';
                selectedParentsDisplay.appendChild(palSpan);
            });
        } else {
            selectedParentsDisplay.textContent = getLanguageText(currentLanguage, UI_TEXT_NONE);
        }
    };

    const buildFavoriteQueryElement = (query: BreedingQuery): HTMLDivElement => {
        const queryDiv = document.createElement('div');
        queryDiv.className = 'favorite-query';
        queryDiv.dataset.queryKey = getQueryKey(query);

        const childDiv = document.createElement('div');
        childDiv.className = 'favorite-query-child';
        childDiv.appendChild(createPalIcon(query.child, 24));
        childDiv.append(getLanguageText(currentLanguage, query.child));
        queryDiv.appendChild(childDiv);

        const parentsDiv = document.createElement('div');
        parentsDiv.className = 'favorite-query-parents';
        if (query.requiredParents.length > 0) {
            query.requiredParents.forEach(parent => {
                const parentSpan = createPalSpan(parent);
                parentsDiv.appendChild(parentSpan);
            });
        } else {
            const noneSpan = document.createElement('span');
            noneSpan.textContent = getLanguageText(currentLanguage, UI_TEXT_NONE);
            parentsDiv.appendChild(noneSpan);
        }
        queryDiv.appendChild(parentsDiv);

        queryDiv.addEventListener('click', () => loadQuery(query));
        queryDiv.addEventListener('animationend', () => {
            queryDiv.classList.remove('pop-in', 'slide-down');
        });

        return queryDiv;
    };

    const renderFavoriteQueries = (animateQueryKey?: string) => {
        const queries = loadFavoriteQueriesFromCookie();
        favoriteQueriesContainer.innerHTML = '';

        queries.forEach(query => {
            const queryDiv = buildFavoriteQueryElement(query);
            if (animateQueryKey) {
                const currentKey = getQueryKey(query);
                if (currentKey === animateQueryKey) {
                    queryDiv.classList.add('pop-in');
                } else {
                    queryDiv.classList.add('slide-down');
                }
            }
            favoriteQueriesContainer.appendChild(queryDiv);
        });
    };

    function loadQuery(query: BreedingQuery): void {
        childSelectorValue.value = query.child;
        const childRadio = document.getElementById(`child-${query.child}`) as HTMLInputElement;
        if (childRadio) childRadio.checked = true;

        parentsSelector.querySelectorAll<HTMLInputElement>('input[type="checkbox"]').forEach(cb => {
            cb.checked = query.requiredParents.includes(cb.value as PalName);
        });

        maxBudgetSelector.value = query.maxFormulas.toString();
        minBudgetSelector.value = query.minFormulas.toString();

        updateDisabledStates();
        updateTrees();
        updateSelectionSummary();
        updateSelectedStyles();
    }

    const updateUIText = () => {
        document.title = getLanguageText(currentLanguage, UI_TEXT_TITLE);
        document.getElementById('title')!.textContent = getLanguageText(currentLanguage, UI_TEXT_TITLE);
        document.getElementById('language-label')!.textContent = getLanguageText(currentLanguage, UI_TEXT_LANGUAGE);
        document.getElementById('current-selections-title')!.textContent = getLanguageText(currentLanguage, UI_TEXT_CURRENT_SELECTIONS);
        document.getElementById('desired-pal-label')!.textContent = getLanguageText(currentLanguage, UI_TEXT_DESIRED_PAL);
        document.getElementById('required-parents-label')!.textContent = getLanguageText(currentLanguage, UI_TEXT_REQUIRED_PARENTS);
        document.getElementById('child-search-label')!.textContent = getLanguageText(currentLanguage, UI_TEXT_DESIRED_PAL);
        childSearch.placeholder = getLanguageText(currentLanguage, UI_TEXT_SEARCH_FOR_PAL);
        document.getElementById('parents-selector-label')!.textContent = getLanguageText(currentLanguage, UI_TEXT_REQUIRED_PARENTS);
        parentSearch.placeholder = getLanguageText(currentLanguage, UI_TEXT_SEARCH_FOR_PARENTS);
        document.getElementById('max-budget-selector-label')!.textContent = getLanguageText(currentLanguage, UI_TEXT_MAX_FORMULA_BUDGET);
        document.getElementById('min-budget-selector-label')!.textContent = getLanguageText(currentLanguage, UI_TEXT_MIN_FORMULA_TO_USE);
        document.getElementById('breeding-trees-title')!.textContent = getLanguageText(currentLanguage, UI_TEXT_BREEDING_TREES);
        document.getElementById('favorite-queries-title')!.textContent = getLanguageText(currentLanguage, UI_TEXT_FAVORITE_QUERIES);
        document.getElementById('loading-text')!.textContent = getLanguageText(currentLanguage, UI_TEXT_CALCULATING);
        themeToggleButton.textContent = getLanguageText(currentLanguage, UI_TEXT_TOGGLE_THEME);
        saveQueryButton.textContent = getLanguageText(currentLanguage, UI_TEXT_SAVE_QUERY);
    };

    const handleLanguageChange = () => {
        currentLanguage = languageSelector.value as LanguageCode;
        updateUIText();
        populatePalLists();
        updateTrees();
        updateSelectionSummary();
        renderFavoriteQueries();
    };

    const applyTheme = (theme: string) => {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
        } else {
            document.body.classList.remove('light-mode');
        }
    };

    const handleThemeToggle = () => {
        const currentTheme = localStorage.getItem('theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', newTheme);
        applyTheme(newTheme);
    };

    // Event Listeners
    languageSelector.addEventListener('change', handleLanguageChange);
    parentsSelector.addEventListener('change', handleParentSelectionChange);
    maxBudgetSelector.addEventListener('change', updateTrees);
    minBudgetSelector.addEventListener('change', updateTrees);
    parentSearch.addEventListener('input', () => filterPals(parentSearch, parentsSelector));
    childSearch.addEventListener('input', () => filterPals(childSearch, childSelector));
    themeToggleButton.addEventListener('click', handleThemeToggle);

    saveQueryButton.addEventListener('click', () => {
        const query = parseCurrentQuery();
        if (!query) {
            alert(getLanguageText(currentLanguage, UI_TEXT_PLEASE_SELECT_DESIRED_PAL));
            return;
        }

        addFavoriteQueryToCookie(query);
        renderFavoriteQueries(getQueryKey(query));
    });

    window.addEventListener('scroll', () => {
        if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 500) {
            if (displayedTreesCount < allTrees.length) {
                renderTrees();
            }
        }
    });

    // Initial call
    const savedTheme = localStorage.getItem('theme') || 'dark';
    applyTheme(savedTheme);
    updateUIText();
    populatePalLists();
    updateTrees();
    renderFavoriteQueries();
    findBreedingTree("Azurmane", new Set(["Beegarde"]), 3, 1);
});
