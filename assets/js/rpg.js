let xp = 0;
let health = 100;
let gold = 5000000;
let pLevel = 1;
let currentWeapon = 0;
let currentArmour = 0;
let fighting;
let monsterHealth;
let inventory = ["stick"];
let aInventory = ["T-Shirt"];

const button1 = document.querySelector("#button1");
const buttonOne = document.querySelector("#buttonOne");
const button2 = document.querySelector("#button2");
const buttonTwo = document.querySelector("#buttonTwo");
const button3 = document.querySelector("#button3");
const buttonThree = document.querySelector("#buttonThree");
const button4 = document.querySelector("#button4");
const buttonFour = document.querySelector("#buttonFour");
const pLevelText = document.querySelector("#pLevel");
const text = document.querySelector("#text");
const xpText = document.querySelector("#xpText");
const healthText = document.querySelector("#healthText");
const goldText = document.querySelector("#goldText");
const monsterStats = document.querySelector("#monsterStats");
const monsterName = document.querySelector("#monsterName");
const monsterHealthText = document.querySelector("#monsterHealth");
const weapons = 
[
    {
        name: "stick",
        power: 5
    },
    {
        name: "dagger",
        power: 30
    },
    {
        name: "claw hammer",
        power: 50
    },
    {
        name: "sword",
        power: 100
    }
];
const armours = 
[
    {
        name: "T-Shirt",
        power: 0
    },
    {
        name: "leather armour",
        power: 30
    },
    {
        name: "iron armour",
        power: 50
    }
];
const monsters = 
[
    {
        name: "slime",
        level: 2,
        health: 15,
        xp: 5
    },
    {
        name: "fanged beast",
        level: 8,
        health: 60,
        xp: 15
    },
    {
        name: "David",
        level: 12,
        health: 100,
        xp: 18,
    },
    {
        name: "David 2",
        level: 20,
        health: 135,
        xp: 20
    },
    {
        name: "David 3",
        level: 28,
        health: 146,
        xp: 45
    },
    {
        name: "dragon",
        level: 50,
        health: 800,
        xp: 500
    }
];
const locations = 
[
    {
        name: "town square",
        "button text": ["Go to store", "Go to cave", "Fight dragon", "Go to armoury(BETA)"],
        "button functions": [goStore, goCave, fightDragon, goArmoury],
        text: "You are in the town square. You see a sign that says \"Store\"."
    },
    {
        name: "store",
        "button text": ["Buy 10 health (10 gold)", "Upgrade weapon (30 gold)", "Go to town square"],
        "button functions": [buyHealth, buyWeapon, goTown],
        text: "You enter the store."
    },
    {
        name: "cave",
        "button text": ["Fight monster", "Go to town square"],
        "button functions": [fightMonster, goTown],
        text: "You enter the cave. You see some monsters."
    },
    {
        name: "fight",
        "button text": ["Attack", "Dodge", "Run"],
        "button functions": [attack, dodge, goTown],
        text: "You are fighting a monster."
    },
    {
        name: "kill monster",
        "button text": ["Fight again", "Go to town square", "Go to town square"],
        "button functions": [goFight, goTown, easterEgg],
        text: 'The monster screams "Arg!"" as it dies. You gain experience points and find gold.'
    },
    {
        name: "lose",
        "button text": ["REPLAY?", "REPLAY?", "REPLAY?"],
        "button functions": [restart, restart, restart],
        text: "You die. ☠️"
    },
    {
        name: "win",
        "button text": ["REPLAY?", "REPLAY?", "REPLAY?"],
        "button functions": [restart, restart, restart],
        text: "You defeat the dragon! YOU WIN THE GAME! 🎉"
    },
    {
        name: "easter egg",
        "button text": ["2", "8", "Go to town square?"],
        "button functions": [pickTwo, pickEight, goTown],
        text: "You find a secret game. Pick a number above. Ten numbers will be randomly chosen between 0 and 10. If the number you choose matches one of the random numbers, you win!"
    },
    {
        name: "armoury",
        "button text": ["Upgrade armour (50 gold)", "Repair armour(25 gold)", "Go to town square"],
        "button functions": [buyArmour, repairArmour, goTown],
        text: "You enter the armoury."
    }
];

//initialize buttons
buttonOne.onclick = goStore;
buttonTwo.onclick = goCave;
buttonThree.onclick = fightDragon;
buttonFour.onclick = goArmoury;

function update(location) {
    monsterStats.style.display = "none";
    buttonFour.style.display = "none";
    buttonTwo.style.display = "inline";
    buttonThree.style.display = "inline";
    button1.innerText = location["button text"][0];
    button2.innerText = location["button text"][1];
    button3.innerText = location["button text"][2];
    button4.innerText = location["button text"][3];

    buttonOne.onclick = location["button functions"][0];
    buttonTwo.onclick = location["button functions"][1];
    buttonThree.onclick = location["button functions"][2];
    buttonFour.onclick = location["button functions"][3];

    text.innerText = location.text;
}

function goTown() {
   update(locations[0]);
   buttonFour.style.display = "block";
}

function goStore() {
  update(locations[1]);
}

function goArmoury() {
    update(locations[8]);
    buttonTwo.style.display = "none";
}

function buyHealth() {
if (gold >=10)
{
    gold -= 10;
    health += 10;
    goldText.innerText = gold;
    healthText.innerText = health;
} else {
    text.innerText = "You do not have enough gold to buy health.";
}
}

function buyWeapon() {
    if (currentWeapon < weapons.length - 1)
    {
            if(gold >= 30)
        {
            gold -= 30;
            currentWeapon++;
            goldText.innerText = gold;
            let newWeapon = weapons[currentWeapon].name;
            text.innerText = "You now have a " + newWeapon + ".";
            inventory.push(newWeapon);
            text.innerText += " In your inventory you have: " + inventory;
        } else {
            text.innerText = "You do not have enough gold to buy a weapon.";
          }
    } else {
        text.innerText = "You already have the most powerful weapon!";
        button2.innerText = "Sell weapon for 15 gold";
        buttonTwo.onclick = sellWeapon;
      }
}

function buyArmour() {
    if (currentArmour < armours.length - 1)
    {
            if(gold >= 50)
        {
            gold -= 50;
            currentArmour++;
            goldText.innerText = gold;
            let newArmour = armours[currentArmour].name;
            text.innerText = "You now have a " + newArmour + ".";
            aInventory.push(newArmour);
            text.innerText += " In your inventory you have: " + aInventory;
        } else {
            text.innerText = "You do not have enough gold to buy armour.";
          }
    } else {
        text.innerText = "You already have the most powerful armour!";
        button1.innerText = "Sell armour for 25 gold";
        buttonOne.onclick = sellArmour;
      }
}

function repairArmour() {

}

function sellWeapon() {
    if(inventory.length > 1)
    {
        gold += 15;
        goldText.innerText = gold;
        let currentWeapon = inventory.shift();
        text.innerText = "You sold a " + currentWeapon + ".";
        text.innerText += " In your inventory you have: " + inventory;
    } else {
        text.innerText = "Don't sell your only weapon!";
    }

}

function sellArmour() {
    if(aInventory.length > 1)
    {
        gold += 25;
        goldText.innerText = gold;
        let currentArmour = aInventory.shift();
        text.innerText = "You sold a " + currentArmour + ".";
        text.innerText += " In your inventory you have: " + aInventory;
    } else {
        text.innerText = "Don't sell your only armour!";
    }

}

function goFight() {
    monsterHealth = monsters[fighting].health;
    update(locations[3]);
    monsterStats.style.display = "block";
    monsterName.innerText = monsters[fighting].name;
    monsterHealthText.innerText = monsterHealth;
}

function goCave() {
    update(locations[2]);
    buttonThree.style.display = "none"
}


function fightSlime() {
    fighting = 0;
    goFight();
}

function fightBeast() {
    fighting = 1;
    goFight();
}

function fightMonster() {
    if(pLevel >= 1)
    {
        fighting = Math.floor(Math.random() * 2);
        console.log("Fighting index is: " + fighting);
        goFight();
    } else if(pLevel >= 3)
    {
        fighting = Math.floor(Math.random() * 4);
        console.log("Fighting index is: " + fighting);
        goFight();
    }
}

function fightDragon() {
    fighting = 5;
    goFight();
}

function attack() {
    text.innerText = "The " + monsters[fighting].name + " attacks.";
    text.innerText += " You attack it with your " + weapons[currentWeapon].name + ".";
    health -= getMonsterAttackValue(monsters[fighting].level);
    if (isMonsterHit())
    {
        monsterHealth -= weapons[currentWeapon].power + Math.floor(Math.random() * xp) + 1;
    } else 
    {
        text.innerText += " You miss.";
    }
    healthText.innerText = health;
    monsterHealthText.innerText = monsterHealth;
    if(health <= 0)
    {
        lose();
    } else if (monsterHealth <= 0)
    {
        fighting === 2 ? winGame() : defeatMonster();
    }
    if(Math.random() * 100 <= .1 && currentWeapon !== 0)
    {
        text.innerText += " Your " + inventory.pop() + " breaks.";
        currentWeapon--;
    }
    if(Math.random() * 100<= .1 && currentArmour !== 0)
    {
        text.innerText += " Your " + aInventory.pop() + " breaks.";
        currentArmour--;
    }
} 

function getMonsterAttackValue(level) {
    const hit = (level * 5) - armours[currentArmour].power;
    console.log(hit);
    return hit > 0 ? hit : 0;
}

function isMonsterHit() {
    return Math.random() > .2 || health < 20;
}

function dodge() {
    text.innerText = "You dodge the attack from the " + monsters[fighting].name;
}

function defeatMonster() {
    gold += Math.floor(monsters[fighting].level * 6.7);
    xp += monsters[fighting].xp;
    if(xp >= getXpReq(pLevel))
    {
        pLevel += 1;
    }
    goldText.innerText = gold;
    xpText.innerText = xp;
    pLevelText.innerText = pLevel;
    update(locations[4]);
}

function getXpReq() {
    let xpReq = Math.ceil(Math.pow(1.4, pLevel - 1) * 100);
    console.log("XP Req: " + xpReq + "|| Player Level: " + pLevel);
    return xpReq;
}

function lose() {
    update(locations[5]);
}

function winGame() {
    update(locations[6]);
}

function restart() {
    xp = 0;
    health = 100;
    gold = 50;
    currentWeapon = 0;
    inventory = ["stick"];
    goldText.innerText = gold;
    healthText.innerText = health;
    xpText.innerText = xp;
    goTown();
}

function easterEgg() {
    update(locations[7]);
}

function pickTwo() {
    pick(2);
}

function pickEight() {
    pick(8);
}

function pick(guess) {
    let numbers = [];

    while (numbers.length < 10)
    {
        numbers.push(Math.floor(Math.random() * 11));
    }
    text.innerText = "You picked " + guess + ". Here are the random numbers:\n";
    for (let i = 0; i < 10; i++)
    {
        text.innerText += numbers[i] + "\n";
    }
    if (numbers.indexOf(guess) !== -1)
    {
        text.innerText += "Right! You win 20 gold!";
        gold += 20;
        goldText.innerText = gold;
    } else 
    {
        text.innerText += "Wrong! You lose 10 health!";
        health -= 10;
        healthText.innerText = health;
        if (health <= 0)
        {
            lose();
        }
    }
}

