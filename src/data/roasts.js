const roasts = [
  "bhai dimag reboot kar le.",
  "tu bol raha hai ya buffering chal rahi hai?",
  "logic chhutti pe hai kya?",
  "itna confidence kis baat ka hai?",
  "dimaag loading… 1% pe atka hua.",
  "bhai tu khud ko sun bhi raha hai?",
  "ye bolne se pehle socha tha ya risk liya?",
  "bhai tu lag nahi kar raha, tu hi lag hai.",
  "wifi slow nahi, tera reaction slow hai.",
  "match haar ke chat jeetne aaya hai kya?",
  "controller se khel, keyboard tod dega gusse mein.",
  "rage typing se rank nahi badhta.",
  "spectator mode tere liye perfect hai.",
  "bro tutorial bhi skip karke haara.",
  "poore server ko secondhand embarrassment ho gaya.",
  "ye message delete kar, izzat bach jayegi.",
  "bhai send karne se pehle dua bhi nahi maangi?",
  "confidence full, logic null.",
  "ye padh ke sab chup ho gaye.",
  "itna gussa kyun, sach lag gaya kya?",
  "reply karta reh, character development ho raha hai.",
  "tu khud ko convince kar raha hai ya hume?",
  "bhai tu argue nahi, struggle kar raha hai.",
  "anger se point strong nahi hota.",
  "bhai mere mentions se utar, kiraya dena padega.",
  "itna chipak kyun raha hai?",
  "fan hai kya mera?",
  "mere replies mein PG le liya kya?",
  "bhai tu obsessed lag raha hai.",
  "itna attention kyun chahiye?",
  "chhod de bhai, feelings develop ho jayengi.",
  "itna follow mat kar, location on ho jayegi.",
  "tu meri notification ka permanent member hai.",
  "bhai tu mujhe hi khel raha hai kya?",
  "tera gussa bijli bana ke bech du?",
  "aur gussa kar, server chal raha hai.",
  "void bhi tujhe sun ke has raha hai.",
  "ye meltdown sponsored by ego.",
  "aur type kar, content mil raha hai.",
  "bhai ruk mat, entertainment free hai.",
  "bhai tu argument nahi, WhatsApp forward lag raha hai.",
  "ye opinion Facebook uncle level ka hai.",
  "tu bolta kam, embarrassment zyada deta hai.",
  "lagta hai bina soche typing karna hobby hai.",
  "bhai tu khud hi apni problem hai.",
  "ye take thoda nahi, pura galat hai.",
  "itni mehnat padhai mein karta toh topper hota.",
  "mummy ne phone diya aur tu ye kar raha hai?",
  "ghar pe bol ke aaya hai aise baat karega?",
  "papa ko dikhaun ye message?",
  "tu ghar pe bhi aise argue karta hai kya?",
  "phir aa gaya?",
  "tu gaya hi kab tha?",
  "bhai tu yahi rehta hai kya?",
  "rent free reh raha hai replies mein.",
  "chhod nahi pa raha na?",
  "dimaag response unavailable.",
  "bhai skill issue permanent hai.",
  "aur gussa kar. maza aa raha hai.",
  "ye behavior productive nahi hai."
];

let usedRoasts = [];

function getRandomRoast() {
  if (usedRoasts.length === roasts.length) {
    usedRoasts = [];
  }
  
  const availableRoasts = roasts.filter(r => !usedRoasts.includes(r));
  const randomIndex = Math.floor(Math.random() * availableRoasts.length);
  const selectedRoast = availableRoasts[randomIndex];
  
  usedRoasts.push(selectedRoast);
  return selectedRoast;
}

module.exports = {
  getRandomRoast,
  triggers: ["bsdk", "lodu", "tmkc", "randi", "lode", "randi ke bacche", "rand", "chake"]
};
