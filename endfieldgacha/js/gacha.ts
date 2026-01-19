import { Character, CharacterRarity, PromotedCharacter, RegularPool } from "./data.js";

export class GachaSystem {
    r6OverrideCounter: number = 0;
    r5OverrideCounter: number = 0;
    totalPullCounter: number = 0;
    
    specialGachaPulled: boolean = false;
    numUpPulled: number = 0;
    numR6Pulled: number = 0;

    get hasSpecialPull() {
        return !this.specialGachaPulled && this.totalPullCounter >= 30;
    }

    private sampleRarity(): CharacterRarity {
        if (this.r6OverrideCounter >= 80) {
            return CharacterRarity.R6;
        }

        let bias = this.r6OverrideCounter > 65 ? 0.058 * (this.r6OverrideCounter - 65) : 0;
        let dist = {
            [CharacterRarity.R6]: 0.008 + bias, // 0.8% chance
            [CharacterRarity.R5]: 0.08,         // 8% chance
            [CharacterRarity.R4]: 0.912 - bias  // 91.2% chance
        }

        console.log("Pulling with distribution:", dist)
        const rand = Math.random();
        if (rand < dist[CharacterRarity.R6]) {
            return CharacterRarity.R6;
        } else if (rand < dist[CharacterRarity.R6] + dist[CharacterRarity.R5]) {
            return CharacterRarity.R5;
        } else if (this.r5OverrideCounter >= 10) {
            return CharacterRarity.R5;
        } else {
            return CharacterRarity.R4;
        }
    }

    private pullAux(): Character {
        this.r6OverrideCounter += 1;
        this.r5OverrideCounter += 1;
        this.totalPullCounter += 1;

        if (this.totalPullCounter == 120 && this.numUpPulled == 0) {
            // TODO: Should this reset r6 counter?
            return PromotedCharacter;
        }
        else {
            let rarity = this.sampleRarity();
            if (rarity === CharacterRarity.R6) {
                this.r6OverrideCounter = 0;

                // 50% chance to get promoted character on R6 pull
                if (Math.random() < 0.5) {
                    return PromotedCharacter;
                }
            }
            else if (rarity === CharacterRarity.R5) {
                this.r5OverrideCounter = 0;
            }

            const pool = RegularPool.filter(c => c.rarity === rarity);
            if (pool.length === 0) {
                // Fallback if pool is empty for that rarity
                return RegularPool[0];
            }

            return pool[Math.floor(Math.random() * pool.length)];
        }
    }

    pull(): Character {
        const character = this.pullAux();
        if (character === PromotedCharacter) {
            this.numUpPulled += 1;
        }
        else if (character.rarity === CharacterRarity.R6) {
            this.numR6Pulled += 1;
        }
        return character;
    }

    pullTen(): Character[] {
        return Array(10).fill(null).map(() => this.pull());
    }

    pullSpecial(): Character[] {
        const backupR6OverrideCounter = this.r6OverrideCounter;
        const backupR5OverrideCounter = this.r5OverrideCounter;
        const backupTotalPullCounter = this.totalPullCounter;
        const results = this.pullTen();
        this.r6OverrideCounter = backupR6OverrideCounter;
        this.r5OverrideCounter = backupR5OverrideCounter;
        this.totalPullCounter = backupTotalPullCounter;
        this.specialGachaPulled = true;
        return results;
    }

    reset() {
        this.r6OverrideCounter = 0;
        this.r5OverrideCounter = 0;
        this.totalPullCounter = 0;
        this.specialGachaPulled = false;
    }
}