/*
 * Toy script that randomly populates a horoscope in a way I think is humorous.
 * See horoscope.html.
 */

let horoscopeDo = [
    "Rust",
    "WebAssembly",
    "Hard bop",
    "Questionable satire",
    "Impish attitude",
    "Low-brow television",
    "Hairties",
    "Clicky keyboards",
    "Dental hygiene",
];

let horoscopeDont = [
    "Tabs",
    "Sweatpants",
    "White-collar crime",
    "Freudian psychology",
    "Oatmeal",
    "English national identity",
    "Food delivery",
    "Waterfall development",
    "High school yearbooks"
];

/**
 * Fisher-Yates Shuffle. Taken from https://bost.ocks.org/mike/shuffle/
 * @param {Array} array 
 * @returns Shuffled array.
 */
function shuffle(array) {
    var m = array.length, t, i;

    // While there remain elements to shuffle…
    while (m) {

        // Pick a remaining element…
        i = Math.floor(Math.random() * m--);

        // And swap it with the current element.
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }

    return array;
}


// wait for dom to be ready
document.addEventListener('DOMContentLoaded', (_e) => {
    const doList = document.getElementById("horoscope-do");
    const dontList = document.getElementById("horoscope-dont");

    // shuffle horoscope do and don't
    shuffle(horoscopeDo);
    shuffle(horoscopeDont);

    // populate the horoscope do and don't
    // append the "do" items
    horoscopeDo.slice(0, 3).forEach((doText) => {
        const li = document.createElement("li");
        const p = document.createElement("p");
        const text = document.createTextNode(doText);
        p.appendChild(text);
        li.appendChild(p);
        doList.appendChild(li);
    });

    // append the "don't" items
    horoscopeDont.slice(0, 3).forEach((dontText) => {
        const li = document.createElement("li");
        const p = document.createElement("p");
        const text = document.createTextNode(dontText);
        p.appendChild(text);
        li.appendChild(p);
        dontList.appendChild(li);
    });
});