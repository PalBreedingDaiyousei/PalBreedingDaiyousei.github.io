
export enum CharacterRarity {
    R4,
    R5,
    R6,
};

export interface Character {
    name: string;
    rarity: CharacterRarity;
}

const RareCharacters = {
    "莱万汀": { rarity: CharacterRarity.R6 },
    "伊冯": { rarity: CharacterRarity.R6 },
    "洁尔佩塔": { rarity: CharacterRarity.R6 },
};

const RegularCharacters = {
    "余烬": { rarity: CharacterRarity.R6 },
    "黎风": { rarity: CharacterRarity.R6 },
    "艾尔黛拉": { rarity: CharacterRarity.R6 },
    "别礼": { rarity: CharacterRarity.R6 },
    "骏卫": { rarity: CharacterRarity.R6 },

    "佩丽卡": { rarity: CharacterRarity.R5 },
    "弧光": { rarity: CharacterRarity.R5 },
    "艾维文娜": { rarity: CharacterRarity.R5 },
    "大潘": { rarity: CharacterRarity.R5 },
    "陈千语": { rarity: CharacterRarity.R5 },
    "狼卫": { rarity: CharacterRarity.R5 },
    "赛希": { rarity: CharacterRarity.R5 },
    "昼雪": { rarity: CharacterRarity.R5 },
    "阿列什": { rarity: CharacterRarity.R5 },

    "秋栗": { rarity: CharacterRarity.R4 },
    "卡契尔": { rarity: CharacterRarity.R4 },
    "埃特拉": { rarity: CharacterRarity.R4 },
    "萤石": { rarity: CharacterRarity.R4 },
    "安塔尔": { rarity: CharacterRarity.R4 },
};

export type CharacterName = keyof typeof RegularCharacters | keyof typeof RareCharacters;

export const PromotedCharacter = { name: "莱万汀", ...RareCharacters["莱万汀"] };
export const RegularPool = [
    { name: "伊冯", ...RareCharacters["伊冯"] },
    { name: "洁尔佩塔", ...RareCharacters["洁尔佩塔"] },
].concat(Object.entries(RegularCharacters).map(([name, data]) => ({ name, ...data })));
