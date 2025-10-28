import { palRecords } from './pals.js';
class BreedingFormula {
    child;
    lhs;
    rhs;
    constructor(child, lhs, rhs) {
        const [p1, p2] = lhs <= rhs ? [lhs, rhs] : [rhs, lhs];
        this.child = child;
        this.lhs = p1;
        this.rhs = p2;
    }
    hasParent(parent) {
        return (parent === this.lhs || parent === this.rhs);
    }
    hasAnyParent(parents) {
        return parents.has(this.lhs) || parents.has(this.rhs);
    }
    hasBothParent(parent1, parent2) {
        const [p1, p2] = parent1 <= parent2 ? [parent1, parent2] : [parent2, parent1];
        return (p1 === this.lhs && p2 === this.rhs);
    }
    static allFormulas = function () {
        const pals = Object.entries(palRecords);
        const formulas = new Map(pals.map(([name, _]) => [name, []]));
        // Exception formulas are predefined.
        const exceptionSet = new Set();
        for (const [palName, breedingInfo] of pals) {
            const addExceptionFormula = function (lhs, rhs) {
                const key = [lhs, rhs].sort().join('+');
                exceptionSet.add(key);
                formulas.get(palName).push(new BreedingFormula(palName, lhs, rhs));
            };
            if (breedingInfo.exception !== null) {
                if (typeof breedingInfo.exception[0] === "string") {
                    const [lhs, rhs] = breedingInfo.exception;
                    addExceptionFormula(lhs, rhs);
                }
                else {
                    for (const [lhs, rhs] of breedingInfo.exception) {
                        addExceptionFormula(lhs, rhs);
                    }
                }
            }
        }
        // Regular formula follows the breeding power rule.
        // Each pal has a breeding power value. When two pals breed, the child's breeding power
        // is determined by the average of the parents' breeding power (rounded up).
        // The child pal is the one whose breeding power is closest to the computed value and doesn't follow exception rules.
        const palBreedingPowers = pals.flatMap(([name, data]) => {
            if (data.onlyHimself || data.exception !== null) {
                return [];
            }
            else {
                return [{ name: name, value: data.value }];
            }
        }).sort((a, b) => a.value - b.value);
        for (const [lhsPalName, lhsPalData] of pals) {
            for (const [rhsPalName, rhsPalData] of pals) {
                if (lhsPalName >= rhsPalName || exceptionSet.has([lhsPalName, rhsPalName].sort().join('+'))) {
                    continue;
                }
                const combinedBreedingPower = Math.floor((lhsPalData.value + rhsPalData.value + 1) / 2);
                // Binary search for the lower bound of matching breeding power.
                let low = 0;
                let high = palBreedingPowers.length - 1;
                let resultIndex = -1;
                while (low <= high) {
                    const mid = Math.floor(low + (high - low) / 2);
                    if (palBreedingPowers[mid].value < combinedBreedingPower) {
                        resultIndex = mid;
                        low = mid + 1;
                    }
                    else {
                        high = mid - 1;
                    }
                }
                var childName;
                if (resultIndex === -1) {
                    childName = palBreedingPowers[0].name;
                }
                else {
                    let lowerBoundPal = palBreedingPowers[resultIndex];
                    let upperBoundPal = palBreedingPowers[resultIndex + 1] || null;
                    if (upperBoundPal === null || combinedBreedingPower - lowerBoundPal.value <= upperBoundPal.value - combinedBreedingPower) {
                        childName = lowerBoundPal.name;
                    }
                    else {
                        childName = upperBoundPal.name;
                    }
                }
                // We only care about formula that produces a different child pal than the parents.
                if (childName !== lhsPalName && childName !== rhsPalName) {
                    formulas.get(childName).push(new BreedingFormula(childName, lhsPalName, rhsPalName));
                }
            }
        }
        return formulas;
    }();
    static findFormula(child) {
        return BreedingFormula.allFormulas.get(child) || [];
    }
}
export class BreedingTreeNode {
    formula;
    left;
    right;
    constructor(formula, left = null, right = null) {
        this.formula = formula;
        this.left = left;
        this.right = right;
    }
    cloneReplacingLeft(newLeft) {
        return new BreedingTreeNode(this.formula, newLeft, this.right);
    }
    cloneReplacingRight(newRight) {
        return new BreedingTreeNode(this.formula, this.left, newRight);
    }
    dump() {
        function dumpAux(self, indent) {
            console.log(`${indent}${self.formula.lhs} + ${self.formula.rhs} = ${self.formula.child}`);
            if (self.left !== null) {
                dumpAux(self.left, indent + '  ');
            }
            if (self.right !== null) {
                dumpAux(self.right, indent + '  ');
            }
        }
        dumpAux(this, '');
    }
}
class BreedingSearchContext {
    reachableParents = new Map();
    // Despite the name, when `nFormula` is less than 1, the child itself is also included.
    getReachableParents(childName, nFormula) {
        const key = `${childName}_${nFormula}`;
        if (this.reachableParents.has(key)) {
            return this.reachableParents.get(key);
        }
        const result = new Set();
        if (nFormula < 1) {
            result.add(childName);
        }
        else if (nFormula == 1) {
            for (const formula of BreedingFormula.findFormula(childName)) {
                result.add(formula.lhs);
                result.add(formula.rhs);
            }
        }
        else {
            for (const formula of BreedingFormula.findFormula(childName)) {
                // one formula quota is used by `formula`.
                for (let nLhsFormula = 0; nLhsFormula < nFormula; nLhsFormula++) {
                    const nRhsFormula = nFormula - 1 - nLhsFormula;
                    if (nLhsFormula > 0) {
                        for (const p of this.getReachableParents(formula.lhs, nLhsFormula)) {
                            result.add(p);
                        }
                    }
                    if (nRhsFormula > 0) {
                        for (const p of this.getReachableParents(formula.rhs, nRhsFormula)) {
                            result.add(p);
                        }
                    }
                }
            }
        }
        this.reachableParents.set(key, result);
        return result;
    }
    splitSharedRequiredParents(data) {
        if (data.length == 0) {
            return [[[], []]];
        }
        else if (data.length == 1) {
            return [[[data[0]], []], [[], [data[0]]]];
        }
        else if (data.length == 2) {
            return [
                [[data[0], data[1]], []],
                [[data[0]], [data[1]]],
                [[data[1]], [data[0]]],
                [[], [data[0], data[1]]]
            ];
        }
        else {
            // For performance reason, only return the two extreme cases.
            return [[data, []], [[], data]];
        }
    }
    // FIXME: for performance reason, this function is not a complete search and may skip some valid breeding trees
    expandBreedingTree(rootFormula, requiredParents, excludingPals, nFormula) {
        if (nFormula < 1) {
            return [];
        }
        else if (nFormula === 1) {
            if (excludingPals.has(rootFormula.lhs) || excludingPals.has(rootFormula.rhs)) {
                return [];
            }
            else if (requiredParents.size === 0) {
                return [new BreedingTreeNode(rootFormula)];
            }
            else if (requiredParents.size === 1) {
                const [parent] = Array.from(requiredParents);
                return rootFormula.hasParent(parent) ? [new BreedingTreeNode(rootFormula)] : [];
            }
            else if (requiredParents.size === 2) {
                const [parent1, parent2] = Array.from(requiredParents);
                return rootFormula.hasBothParent(parent1, parent2) ? [new BreedingTreeNode(rootFormula)] : [];
            }
            else {
                return [];
            }
        }
        const reachableParents = this.getReachableParents(rootFormula.child, nFormula);
        if (!Array.from(requiredParents).every(p => reachableParents.has(p))) {
            return [];
        }
        const results = [];
        for (let nLhsFormula = 0; nLhsFormula < nFormula; nLhsFormula++) {
            const nRhsFormula = nFormula - 1 - nLhsFormula;
            const lhsReachableParents = this.getReachableParents(rootFormula.lhs, nLhsFormula);
            const rhsReachableParents = this.getReachableParents(rootFormula.rhs, nRhsFormula);
            const lhsRequiredParents = Array.from(requiredParents).filter(p => lhsReachableParents.has(p) && !rhsReachableParents.has(p));
            const rhsRequiredParents = Array.from(requiredParents).filter(p => rhsReachableParents.has(p) && !lhsReachableParents.has(p));
            const sharedRequiredParents = Array.from(requiredParents).filter(p => lhsReachableParents.has(p) && rhsReachableParents.has(p));
            // This formula composition may not be able to cover all required parents.
            // Quit early if that's the case.
            if (lhsRequiredParents.length + rhsRequiredParents.length + sharedRequiredParents.length !== requiredParents.size) {
                continue;
            }
            for (const [lhsSharedRequiredParents, rhsSharedRequiredParents] of this.splitSharedRequiredParents(sharedRequiredParents)) {
                const lhsSubtrees = [];
                if (nLhsFormula >= 1) {
                    const lhsRequiredSet = new Set([...lhsRequiredParents, ...lhsSharedRequiredParents]);
                    const lhsExcludingSet = new Set([...excludingPals, ...rhsSharedRequiredParents, rootFormula.lhs]);
                    for (const formula of BreedingFormula.findFormula(rootFormula.lhs)) {
                        if (!lhsExcludingSet.has(formula.lhs) && !lhsExcludingSet.has(formula.rhs)) {
                            lhsSubtrees.push(...this.expandBreedingTree(formula, lhsRequiredSet, lhsExcludingSet, nLhsFormula));
                        }
                    }
                }
                else {
                    lhsSubtrees.push(null);
                }
                const rhsSubtrees = [];
                if (nRhsFormula >= 1) {
                    const rhsRequiredSet = new Set([...rhsRequiredParents, ...rhsSharedRequiredParents]);
                    const rhsExcludingSet = new Set([...excludingPals, ...lhsSharedRequiredParents, rootFormula.rhs]);
                    for (const formula of BreedingFormula.findFormula(rootFormula.rhs)) {
                        if (!rhsExcludingSet.has(formula.lhs) && !rhsExcludingSet.has(formula.rhs)) {
                            rhsSubtrees.push(...this.expandBreedingTree(formula, rhsRequiredSet, rhsExcludingSet, nRhsFormula));
                        }
                    }
                }
                else {
                    rhsSubtrees.push(null);
                }
                for (const lhsSubtree of lhsSubtrees) {
                    for (const rhsSubtree of rhsSubtrees) {
                        results.push(new BreedingTreeNode(rootFormula, lhsSubtree, rhsSubtree));
                    }
                }
            }
        }
        return results;
    }
    findBreedingTree(child, requiredParents, maxFormulaBudget, minFormulaBudget) {
        if (maxFormulaBudget < 1) {
            return [];
        }
        const childFormulas = BreedingFormula.findFormula(child);
        for (let usedFormulaNum = Math.max(minFormulaBudget, requiredParents.size - 1); usedFormulaNum <= maxFormulaBudget; usedFormulaNum++) {
            const reachableParents = this.getReachableParents(child, usedFormulaNum);
            if (!Array.from(requiredParents).every(p => reachableParents.has(p))) {
                // Not all required parents are reachable within the formula limit.
                continue;
            }
            console.log(`Searching breeding tree for ${child} with ${usedFormulaNum} formulas...`);
            const result = childFormulas.flatMap(formula => this.expandBreedingTree(formula, requiredParents, new Set([child]), usedFormulaNum));
            if (result.length > 0) {
                console.log(`Found ${result.length} breeding tree for ${child} with ${usedFormulaNum} formulas.`);
                return result;
            }
        }
        return [];
    }
    static instance = new BreedingSearchContext();
}
const allPalBreedingPower = Object.fromEntries(Object.entries(palRecords).map(([name, data]) => [name, data.value]));
function calculateBreedingSortKey(tree, nullPalPower, requiredParents) {
    if (tree === null) {
        return { dist: 0, breedingPower: requiredParents.has(nullPalPower) ? 9999 : allPalBreedingPower[nullPalPower] };
    }
    else {
        const { dist: lhsDist, breedingPower: lhsBreedingPower } = calculateBreedingSortKey(tree.left, tree.formula.lhs, requiredParents);
        const { dist: rhsDist, breedingPower: rhsBreedingPower } = calculateBreedingSortKey(tree.right, tree.formula.rhs, requiredParents);
        return {
            dist: lhsDist + rhsDist + ((requiredParents.has(tree.formula.lhs) && requiredParents.has(tree.formula.rhs)) ? 0 : 1),
            breedingPower: Math.min(lhsBreedingPower, rhsBreedingPower)
        };
    }
}
export function findBreedingTree(child, requiredParents, maxFormulaBudget, minFormulaBudget) {
    const context = BreedingSearchContext.instance;
    const results = context.findBreedingTree(child, requiredParents, maxFormulaBudget, minFormulaBudget);
    results.sort((a, b) => {
        const { dist: distA, breedingPower: breedingPowerA } = calculateBreedingSortKey(a, child, requiredParents);
        const { dist: distB, breedingPower: breedingPowerB } = calculateBreedingSortKey(b, child, requiredParents);
        return (distB - distA) || (breedingPowerB - breedingPowerA);
    });
    return results;
}
//# sourceMappingURL=calculator.js.map