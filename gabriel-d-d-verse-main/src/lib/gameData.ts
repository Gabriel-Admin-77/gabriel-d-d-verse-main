import { Character, Monster, CraftingRecipe, MoralDilemma, InventoryItem } from "./gameTypes";

export const SAMPLE_CHARACTER: Character = {
  name: "אלדריק צל-חרב",
  class: "לוחם",
  level: 5,
  hp: { current: 45, max: 52 },
  ac: 17,
  stats: { str: 16, dex: 13, con: 14, int: 10, wis: 12, cha: 8 },
  moralScore: 65,
};

export const BESTIARY: Monster[] = [
  { id: "goblin", name: "גובלין", hp: 7, maxHp: 7, ac: 15, attack: "סימיטר (+4 לפגיעה)", cr: "1/4" },
  { id: "skeleton", name: "שלד", hp: 13, maxHp: 13, ac: 13, attack: "חרב קצרה (+4 לפגיעה)", cr: "1/4" },
  { id: "dire_wolf", name: "זאב אימה", hp: 37, maxHp: 37, ac: 14, attack: "נשיכה (+5 לפגיעה)", cr: "1" },
  { id: "ogre", name: "עוגר", hp: 59, maxHp: 59, ac: 11, attack: "אלת ענק (+6 לפגיעה)", cr: "2" },
  { id: "cult_fanatic", name: "קנאי כת", hp: 33, maxHp: 33, ac: 13, attack: "הכאת פצעים (+4 לפגיעה)", cr: "2" },
  { id: "young_red_dragon", name: "דרקון אדום צעיר (בוס)", hp: 178, maxHp: 178, ac: 18, attack: "נשימת אש", cr: "10" },
  { id: "mimic", name: "חקיין", hp: 58, maxHp: 58, ac: 12, attack: "פסאודופוד (+5 לפגיעה)", cr: "2" },
  { id: "ghost", name: "רוח רפאים", hp: 45, maxHp: 45, ac: 11, attack: "מגע מכמיש", cr: "4" },
  { id: "owlbear", name: "ינשוף-דוב", hp: 59, maxHp: 59, ac: 13, attack: "התקפה מרובה (+7 לפגיעה)", cr: "3" },
  { id: "gelatinous_cube", name: "קוביה ג'לטינית", hp: 84, maxHp: 84, ac: 6, attack: "בליעה", cr: "2" },
];

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  { id: "healing_potion", name: "שיקוי ריפוי", ingredients: ["עשב מרפא", "מים מזוקקים"], check: "ארקנה", dc: 10, resultIcon: "🧪" },
  { id: "poison_arrow", name: "חץ מורעל", ingredients: ["חץ", "ארס עכביש"], check: "טבע", dc: 12, resultIcon: "🏹" },
  { id: "reinforced_leather", name: "עור מחוזק", ingredients: ["עור גולמי", "גרוטאות ברזל"], check: "אתלטיקה", dc: 13, resultIcon: "🛡️" },
  { id: "smoke_bomb", name: "פצצת עשן", ingredients: ["אבק שריפה", "פחם"], check: "זריזות ידיים", dc: 14, resultIcon: "💨" },
  { id: "magic_amulet", name: "קמיע קסום", ingredients: ["אבן חן", "אפר שד"], check: "ארקנה", dc: 16, resultIcon: "🔮" },
];

export const MORAL_DILEMMAS: MoralDilemma[] = [
  {
    id: "refugees_bread",
    title: "לחם הפליטים",
    description: "משפחה רעבה גונבת לחם מהשוק. השומר מציע לך תגמול אם תמסור אותם.",
    choiceGood: "להגן על המשפחה ולחלוק מזון",
    choiceEvil: "למסור את המשפחה לשומרים",
    moralShift: 15,
  },
  {
    id: "only_cure",
    title: "התרופה היחידה",
    description: "יש לך מרקחת אחת בלבד. ראש העיר המושחת גוסס, אך גם יתום חולני.",
    choiceGood: "להציל את היתום",
    choiceEvil: "להציל את ראש העיר לטובת כוח פוליטי",
    moralShift: 20,
  },
  {
    id: "soul_blade",
    title: "להב הנשמות",
    description: "מצאת חרב מקוללת בעלת עוצמה אדירה. היא לוחשת לך להשתמש בה.",
    choiceGood: "להשמיד את החרב",
    choiceEvil: "להשתמש בכוחה",
    moralShift: 25,
  },
  {
    id: "internal_traitor",
    title: "הבוגד הפנימי",
    description: "חבר לקבוצה בגד בכם כדי להציל את משפחתו. הוא כורע בפניכם ומבקש סליחה.",
    choiceGood: "לסלוח ולקבלו בחזרה",
    choiceEvil: "להוציאו להורג כאזהרה",
    moralShift: 20,
  },
  {
    id: "dam_breach",
    title: "פרצת הסכר",
    description: "הסכר עומד להישבר. תוכלו להציל עיר שלמה אם תציפו חווה קטנה.",
    choiceGood: "להציף את החווה להצלת העיר",
    choiceEvil: "לא לעשות דבר ולשמור על החווה",
    moralShift: 10,
  },
];

export const STARTER_INVENTORY: InventoryItem[] = [
  { id: "longsword", name: "חרב ארוכה", quantity: 1, type: "נשק", icon: "⚔️" },
  { id: "shield", name: "מגן", quantity: 1, type: "שריון", icon: "🛡️" },
  { id: "health_potion", name: "שיקוי ריפוי", quantity: 3, type: "שיקוי", icon: "🧪" },
  { id: "torch", name: "לפיד", quantity: 5, type: "כלי", icon: "🔥" },
  { id: "rope", name: "חבל (15 מטר)", quantity: 1, type: "כלי", icon: "🪢" },
  { id: "herb", name: "עשב מרפא", quantity: 4, type: "חומר גלם", icon: "🌿" },
  { id: "distilled_water", name: "מים מזוקקים", quantity: 2, type: "חומר גלם", icon: "💧" },
  { id: "arrow", name: "חץ", quantity: 20, type: "תחמושת", icon: "➡️" },
  { id: "spider_venom", name: "ארס עכביש", quantity: 1, type: "חומר גלם", icon: "🕷️" },
  { id: "iron_scraps", name: "גרוטאות ברזל", quantity: 3, type: "חומר גלם", icon: "⛓️" },
];

export const CURRENCY = { gold: 47, silver: 12, copper: 85 };
