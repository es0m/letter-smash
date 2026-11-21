const jaguar = { symbol: "example-jaguar" };
const quail = { symbol: "example-quail" };
const xylophone = { symbol: "example-xylophone" };
const yak = { symbol: "example-yak" };

const examples = {
  en: {
    a: [["ant", "🐜"], ["accordion", "🪗"]],
    b: [["bear", "🐻"], ["ball", "⚽"]],
    c: [["cat", "🐱"]],
    d: [["dog", "🐶"], ["drum", "🥁"]],
    e: [["elephant", "🐘"]],
    f: [["frog", "🐸"], ["fox", "🦊"]],
    g: [["giraffe", "🦒"], ["guitar", "🎸"]],
    h: [["hamster", "🐹"], ["horse", "🐴"]],
    i: [["iguana", "🦎"]],
    j: [["jaguar", jaguar]],
    k: [["kite", "🪁"], ["koala", "🐨"]],
    l: [["lion", "🦁"]],
    m: [["monkey", "🐒"], ["maracas", "🪇"]],
    n: [["newt", "🦎"]],
    o: [["owl", "🦉"], ["octopus", "🐙"]],
    p: [["piano", "🎹"], ["penguin", "🐧"]],
    q: [["quail", quail]],
    r: [["rabbit", "🐰"], ["robot", "🤖"]],
    s: [["snake", "🐍"], ["sheep", "🐑"]],
    t: [["trumpet", "🎺"], ["teddy bear", "🧸"], ["turtle", "🐢"]],
    u: [["unicorn", "🦄"]],
    v: [["violin", "🎻"]],
    w: [["whale", "🐋"]],
    x: [["xylophone", xylophone]],
    y: [["yo-yo", "🪀"], ["yak", yak]],
    z: [["zebra", "🦓"]],
  },
  de: {
    a: [["Affe", "🐒"], ["Akkordeon", "🪗"]],
    b: [["Bär", "🐻"], ["Ball", "⚽"]],
    c: [["Clownfisch", "🐠"]],
    d: [["Delfin", "🐬"], ["Drachen", "🪁"]],
    e: [["Elefant", "🐘"], ["Ente", "🦆"]],
    f: [["Frosch", "🐸"], ["Fuchs", "🦊"]],
    g: [["Giraffe", "🦒"], ["Gitarre", "🎸"]],
    h: [["Hund", "🐶"], ["Hamster", "🐹"]],
    i: [["Igel", "🦔"]],
    j: [["Jaguar", jaguar], ["Jo-Jo", "🪀"]],
    k: [["Katze", "🐱"], ["Klavier", "🎹"]],
    l: [["Löwe", "🦁"]],
    m: [["Maus", "🐭"], ["Maracas", "🪇"]],
    n: [["Nashorn", "🦏"]],
    o: [["Otter", "🦦"], ["Oktopus", "🐙"]],
    p: [["Pinguin", "🐧"], ["Papagei", "🦜"]],
    q: [["Qualle", "🪼"]],
    r: [["Roboter", "🤖"], ["Reh", "🦌"]],
    s: [["Schaf", "🐑"], ["Schlange", "🐍"]],
    t: [["Trommel", "🥁"], ["Teddy", "🧸"]],
    u: [["Uhu", "🦉"]],
    v: [["Vogel", "🐦"]],
    w: [["Wal", "🐋"]],
    x: [["Xylophon", xylophone]],
    y: [["Yak", yak]],
    z: [["Zebra", "🦓"]],
    ä: [["Äffchen", "🐒"]],
    ö: [["Ölkäfer", "🪲"]],
    ü: [["Überraschungsei", "🥚"]],
  },
};

export function randomLetterExample(key, language, random = Math.random) {
  const choices = examples[language][key];
  if (!choices || random() >= .4) return null;
  const [word, image] = choices[Math.floor(random() * choices.length)];
  return { word, image };
}
