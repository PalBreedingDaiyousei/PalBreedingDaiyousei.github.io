import { palRecords } from './pals.js';
import { findBreedingTree } from './calculator.js';
import { getLanguageText } from './language.js';
document.addEventListener('DOMContentLoaded', () => {
    const languageSelector = document.getElementById('language-selector');
    const childSearch = document.getElementById('child-search');
    const childList = document.getElementById('child-list');
    const childSelectorValue = document.getElementById('child-selector-value');
    const parentsSelector = document.getElementById('parents-selector');
    const parentSearch = document.getElementById('parent-search');
    const maxBudgetSelector = document.getElementById('max-budget-selector');
    const minBudgetSelector = document.getElementById('min-budget-selector');
    const treesContainer = document.getElementById('trees-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const selectedChildDisplay = document.getElementById('selected-child-display');
    const selectedParentsDisplay = document.getElementById('selected-parents-display');
    const themeToggleButton = document.getElementById('theme-toggle');
    let currentLanguage = 'zh-CN';
    let allTrees = [];
    let displayedTreesCount = 0;
    const treesPerLoad = 100;
    const createPalIcon = (palName, size = 32) => {
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
    const createPalSpan = (palName) => {
        const span = document.createElement('span');
        span.style.whiteSpace = 'nowrap';
        span.style.display = 'inline-flex';
        span.style.alignItems = 'center';
        span.style.margin = '2px 0';
        span.appendChild(createPalIcon(palName));
        span.append(getLanguageText(currentLanguage, palName));
        return span;
    };
    const palNames = Object.keys(palRecords).sort();
    const updateDisabledStates = () => {
        const selectedChild = childSelectorValue.value;
        const selectedParents = new Set(Array.from(parentsSelector.querySelectorAll('input:checked'))
            .map(cb => cb.value));
        // Disable parent checkbox if it's the selected child
        palNames.forEach(name => {
            const parentCheckbox = document.getElementById(`parent-${name}`);
            if (parentCheckbox) {
                parentCheckbox.disabled = (name === selectedChild);
                if (name === selectedChild && parentCheckbox.checked) {
                    parentCheckbox.checked = false;
                }
            }
            // Disable child radio if it's a selected parent
            const childRadio = document.getElementById(`child-${name}`);
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
        childList.innerHTML = '';
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
            childList.appendChild(childLabel);
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
    };
    const updateTrees = async () => {
        const child = childSelectorValue.value;
        const requiredParents = new Set(Array.from(parentsSelector.querySelectorAll('input:checked'))
            .map(cb => cb.value));
        const maxFormulas = parseInt(maxBudgetSelector.value, 10);
        const minFormulas = parseInt(minBudgetSelector.value, 10);
        updateSelectionSummary();
        if (!child) {
            treesContainer.innerHTML = `<p>${getLanguageText(currentLanguage, "Select a desired pal.")}</p>`;
            return;
        }
        loadingIndicator.style.display = 'block';
        treesContainer.style.display = 'none';
        await new Promise(resolve => setTimeout(resolve, 0));
        const trees = findBreedingTree(child, requiredParents, maxFormulas, minFormulas);
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
            treesContainer.innerHTML = `<p>${getLanguageText(currentLanguage, "No valid breeding tree found within the specified steps.")}</p>`;
            return;
        }
        toRender.forEach((tree, index) => {
            const treeDiv = document.createElement('div');
            treeDiv.className = 'tree';
            treeDiv.innerHTML = `<h4>${getLanguageText(currentLanguage, "Tree #")}${displayedTreesCount + index + 1}</h4>`;
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
    const renderNode = (node, parentElement) => {
        const li = document.createElement('li');
        const formulaContainer = document.createElement('div');
        formulaContainer.style.display = 'flex';
        formulaContainer.style.alignItems = 'center';
        formulaContainer.style.gap = '0.5rem';
        formulaContainer.style.flexWrap = 'wrap';
        formulaContainer.appendChild(createPalSpan(node.formula.lhs));
        formulaContainer.append('+');
        formulaContainer.appendChild(createPalSpan(node.formula.rhs));
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
    const filterPals = (input, list) => {
        const searchTerm = input.value.toLowerCase();
        const items = list.getElementsByClassName('parent-item');
        Array.from(items).forEach(item => {
            const label = item;
            const name = label.textContent?.trim().toLowerCase() || '';
            const inputElement = label.querySelector('input');
            const isChecked = inputElement ? inputElement.checked : false;
            if (name.includes(searchTerm) || isChecked) {
                label.style.display = 'flex';
            }
            else {
                label.style.display = 'none';
            }
        });
    };
    const handleParentSelectionChange = (event) => {
        const target = event.target;
        if (target.type === 'checkbox' && target.checked) {
            const checkedCheckboxes = parentsSelector.querySelectorAll('input:checked');
            if (checkedCheckboxes.length > 4) {
                target.checked = false;
                alert(getLanguageText(currentLanguage, 'You can select a maximum of 4 parents.'));
                return;
            }
        }
        updateDisabledStates();
        updateTrees();
        updateSelectedStyles();
    };
    const updateSelectedStyles = () => {
        // For child list (radios)
        const childItems = childList.querySelectorAll('.parent-item');
        childItems.forEach(item => {
            const radio = item.querySelector('input[type="radio"]');
            if (radio.checked) {
                item.classList.add('selected');
            }
            else {
                item.classList.remove('selected');
            }
        });
        // For parent list (checkboxes)
        const parentItems = parentsSelector.querySelectorAll('.parent-item');
        parentItems.forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox.checked) {
                item.classList.add('selected');
            }
            else {
                item.classList.remove('selected');
            }
        });
    };
    const updateSelectionSummary = () => {
        const child = childSelectorValue.value;
        selectedChildDisplay.innerHTML = '';
        if (child) {
            selectedChildDisplay.appendChild(createPalIcon(child));
            selectedChildDisplay.append(getLanguageText(currentLanguage, child));
        }
        else {
            selectedChildDisplay.textContent = getLanguageText(currentLanguage, 'None');
        }
        const requiredParents = Array.from(parentsSelector.querySelectorAll('input:checked'))
            .map(cb => cb.value);
        selectedParentsDisplay.innerHTML = '';
        if (requiredParents.length > 0) {
            requiredParents.forEach(palName => {
                const palSpan = createPalSpan(palName);
                palSpan.style.marginRight = '10px';
                selectedParentsDisplay.appendChild(palSpan);
            });
        }
        else {
            selectedParentsDisplay.textContent = getLanguageText(currentLanguage, 'None');
        }
    };
    const updateUIText = () => {
        document.title = getLanguageText(currentLanguage, "Palworld Breeding Path Finder");
        document.getElementById('title').textContent = getLanguageText(currentLanguage, "Palworld Breeding Path Finder");
        document.getElementById('language-label').textContent = getLanguageText(currentLanguage, "Language:");
        document.getElementById('current-selections-title').textContent = getLanguageText(currentLanguage, "Current Selections:");
        document.getElementById('desired-pal-label').textContent = getLanguageText(currentLanguage, "Desired Pal:");
        document.getElementById('required-parents-label').textContent = getLanguageText(currentLanguage, "Required Parents:");
        document.getElementById('child-search-label').textContent = getLanguageText(currentLanguage, "Desired Pal:");
        childSearch.placeholder = getLanguageText(currentLanguage, "Search for a pal...");
        document.getElementById('parents-selector-label').textContent = getLanguageText(currentLanguage, "Required Parents:");
        parentSearch.placeholder = getLanguageText(currentLanguage, "Search for parents...");
        document.getElementById('max-budget-selector-label').textContent = getLanguageText(currentLanguage, "Max Formula Budget:");
        document.getElementById('min-budget-selector-label').textContent = getLanguageText(currentLanguage, "Min Formula to Use:");
        document.getElementById('breeding-trees-title').textContent = getLanguageText(currentLanguage, "Breeding Trees:");
        document.getElementById('loading-text').textContent = getLanguageText(currentLanguage, "Calculating...");
        themeToggleButton.textContent = getLanguageText(currentLanguage, "Toggle Theme");
    };
    const handleLanguageChange = () => {
        currentLanguage = languageSelector.value;
        updateUIText();
        populatePalLists();
        updateTrees();
        updateSelectionSummary();
    };
    const applyTheme = (theme) => {
        if (theme === 'light') {
            document.body.classList.add('light-mode');
        }
        else {
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
    childSearch.addEventListener('input', () => filterPals(childSearch, childList));
    themeToggleButton.addEventListener('click', handleThemeToggle);
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
});
//# sourceMappingURL=main.js.map