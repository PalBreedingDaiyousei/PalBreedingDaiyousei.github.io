import { GachaSystem } from "./gacha.js";
import { CharacterRarity } from "./data.js";
const gacha = new GachaSystem();
const pullBtn = document.getElementById('pull-btn');
const pull10Btn = document.getElementById('pull-10-btn');
const pullSpecialBtn = document.getElementById('pull-special-btn');
const resetBtn = document.getElementById('reset-btn');
const resultDiv = document.getElementById('result');
const drawCountSpan = document.getElementById('draw-count');
const pityCountSpan = document.getElementById('pity-count');
const upCountSpan = document.getElementById('up-count');
const r6CountSpan = document.getElementById('r6-count');
function handleGachaPulled(characters) {
    let createCharacterCard = (character) => {
        return `
        <div class="character-card rarity-${CharacterRarity[character.rarity]}">
            <h3>${character.name}</h3>
            <p>Rarity: ${CharacterRarity[character.rarity]}</p>
        </div>
    `;
    };
    pullSpecialBtn.disabled = !gacha.hasSpecialPull;
    drawCountSpan.innerText = gacha.totalPullCounter.toString();
    pityCountSpan.innerText = gacha.r6OverrideCounter.toString();
    upCountSpan.innerText = gacha.numUpPulled.toString();
    r6CountSpan.innerText = gacha.numR6Pulled.toString();
    resultDiv.innerHTML = `<div class="pull-grid">${characters.map(createCharacterCard).join('')}</div>`;
}
pullBtn.addEventListener('click', () => {
    console.log("Pull x1 clicked");
    const result = gacha.pull();
    handleGachaPulled([result]);
});
pull10Btn.addEventListener('click', () => {
    console.log("Pull x10 clicked");
    const results = gacha.pullTen();
    handleGachaPulled(results);
});
pullSpecialBtn.addEventListener('click', () => {
    console.log("Special Pull clicked");
    const results = gacha.pullSpecial();
    handleGachaPulled(results);
});
resetBtn.addEventListener('click', () => {
    console.log("Reset clicked");
    gacha.reset();
    handleGachaPulled([]);
});
handleGachaPulled([]);
//# sourceMappingURL=main.js.map