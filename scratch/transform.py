import json, re, os, base64

ROOT = "/Users/tomywu/Projects/d2db"
SCRATCH = os.path.join(ROOT, "scratch")

def slugify(name):
    s = name.lower()
    s = re.sub(r"[''\"]", "", s)
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")

def write_data_uri_to_file(icon_data, path):
    if not icon_data:
        return False
    header, b64 = icon_data.split(",", 1)
    raw = base64.b64decode(b64)
    with open(path, "wb") as f:
        f.write(raw)
    return True

# ─────────────────────────── RUNES ───────────────────────────
runes_raw = json.load(open(os.path.join(SCRATCH, "runes.json")))
runes_raw.sort(key=lambda r: r["number"])

RUNE_ORDER = []
for r in runes_raw:
    name = r["name"]
    RUNE_ORDER.append(name)
    fname = f"{name.lower()}.webp"
    write_data_uri_to_file(r.get("icon_data"), os.path.join(ROOT, "assets/runes", fname))

print("Runes extracted:", len(RUNE_ORDER))

# ─────────────────────────── RUNEWORDS ───────────────────────────
ITEM_TYPE_MAP = {
    "Body Armor": "Body Armor",
    "Helmets": "Helm",
    "Swords": "Sword",
    "Axes": "Axe",
    "Missile Weapons": "Missile Weapon",
    "Shields": "Shield",
    "Weapons": "Weapon",
    "Polearms": "Polearm",
    "Hammers": "Hammer",
    "Melee Weapons": "Melee Weapon",
    "Scepters": "Scepter",
    "Maces": "Mace",
    "Staves": "Staff",
    "Claws": "Claw",
    "Spears": "Spear",
    "Daggers": "Dagger",
    "Auric Shields": "Auric Shield",
    "Clubs": "Club",
    "Grimoires": "Grimoire",
    "Voodoo Heads": "Voodoo Head",
    "Wands": "Wand",
}

CATEGORY_ORDER = [
    "Body Armor", "Helm", "Shield", "Auric Shield", "Grimoire", "Voodoo Head",
    "Sword", "Axe", "Mace", "Club", "Hammer", "Scepter", "Polearm", "Spear",
    "Dagger", "Claw", "Wand", "Staff", "Missile Weapon", "Melee Weapon", "Weapon",
]

# "(Based on Character Level)" stats collapse the per-level formula into a
# single flat max value, which loses the min-max range and per-level rate.
# Where a reference source confirmed the exact rate/range (cross-checked
# against maxroll.gg's own numbers — same max value, just floor-rounded in
# our flat scrape), rewrite in the more informative
# "+(N Per Character Level) LO-HI Stat" form instead. Left as flat text where
# the rate/range couldn't be independently confirmed.
#
# Dragon/Dream/Ice/Infinity/Pride: the reference source gave a min-max range
# but no explicit per-level rate. D2's per-level scaling is linear (value at
# level N = rate * N), so rate = lo (value at level 1) — verified exactly
# against every case above where the rate WAS given explicitly (rate * 99 ==
# hi with no rounding), then applied here since rate * 99 lands exactly on
# the given hi and floor(hi) matches our existing flat value in all 6 cases.
# Fortitude's own range is a literal "+X To Life" placeholder in the
# reference source (no numbers at all), so it's left unconverted.
RUNEWORD_STAT_OVERRIDES = {
    "Death": {
        "+49% Deadly Strike (Based on Character Level)":
            "+(0.5 Per Character Level) 0.5-49.5% Deadly Strike",
    },
    "Dragon": {
        "+37 to Strength (Based on Character Level)":
            "+(0.375 Per Character Level) 0.375-37.125 to Strength",
    },
    "Dream": {
        "+61 to Mana (Based on Character Level)":
            "+(0.625 Per Character Level) 0.625-61.875 to Mana",
    },
    "Enigma": {
        "+74 to Strength (Based on Character Level)":
            "+(0.75 Per Character Level) 0-74 to Strength",
        "99% Better Chance of Getting Magic Items (Based on Character Level)":
            "(1 Per Character Level) 1-99% Better Chance of Getting Magic Items",
    },
    # Unlike the others above, the source already shows a range (8-12) rather
    # than a single flat value, meaning the per-level rate itself varies
    # 8-12 instead of being a fixed number — confirmed by the user's read of
    # the item. Value at level 1 = 8*1 = 8, at level 99 = 12*99 = 1188.
    "Fortitude": {
        "8–12 to Life (Based on Character Level)":
            "+(8-12 Per Character Level) 8-1188 to Life",
    },
    "Grief": {
        "+185% Damage to Demons (Based on Character Level)":
            "+(1.875 Per Character Level) 1.875-185.625% Damage to Demons",
    },
    "Ice": {
        "309% Extra Gold from Monsters (Based on Character Level)":
            "(3.125 Per Character Level) 3.125-309.375% Extra Gold from Monsters",
    },
    "Infinity": {
        "+49 to Vitality (Based on Character Level)":
            "+(0.5 Per Character Level) 0.5-49.5 to Vitality",
    },
    "Leaf": {
        "+198 Defense (Based on Character Level)":
            "+(2 Per Character Level) 2-198 Defense",
    },
    "Plague": {
        "+37% Deadly Strike (Based on Character Level)":
            "+(0.375 Per Character Level) 0.375-37.125% Deadly Strike",
    },
    "Pride": {
        "+99% Damage to Demons (Based on Character Level)":
            "+(1 Per Character Level) 1-99% Damage to Demons",
        "185% Extra Gold from Monsters (Based on Character Level)":
            "(1.875 Per Character Level) 1.875-185.625% Extra Gold from Monsters",
    },
}

rw_raw = json.load(open(os.path.join(SCRATCH, "runewords.json")))

runewords = []
for i, r in enumerate(rw_raw, start=1):
    runes = [x.replace(" Rune", "").strip() for x in r["runes"]]
    item_types = [ITEM_TYPE_MAP.get(t.strip(), t.strip()) for t in r["item_types"].split(",")]
    ladder_note = r.get("ladder_note")
    ladder = ladder_note == "Ladder only"
    disabled_ladder = ladder_note == "Disabled in ladder"
    is_new = any("Warlock" in s or "Sigil:" in s or "Abyss" in s for s in r["stats"])
    overrides = RUNEWORD_STAT_OVERRIDES.get(r["name"], {})
    runewords.append({
        "id": i,
        "name": r["name"],
        "runes": runes,
        "sockets": len(runes),
        "itemTypes": item_types,
        "level": int(r["required_level"]),
        "ladder": ladder,
        "ladderDisabled": disabled_ladder,
        "isNew": is_new,
        "stats": [overrides.get(s, s) for s in r["stats"]],
        "url": r.get("url"),
    })

print("Runewords transformed:", len(runewords))

runewords_js = (
    "/* Generated from scrape data — do not hand-edit; see scratch/transform.py */\n"
    "'use strict';\n\n"
    "const RUNE_ORDER = " + json.dumps(RUNE_ORDER) + ";\n\n"
    "const CATEGORY_ORDER = " + json.dumps(CATEGORY_ORDER) + ";\n\n"
    "const RUNEWORDS_DATA = " + json.dumps(runewords, ensure_ascii=False) + ";\n"
)
with open(os.path.join(ROOT, "data/runewords-data.js"), "w") as f:
    f.write(runewords_js)

# ─────────────────────────── SET ITEMS ───────────────────────────
CLASS_NAMES = ["Amazon", "Assassin", "Barbarian", "Druid", "Necromancer", "Paladin", "Sorceress", "Warlock"]

# Same "(Based on Character Level)" -> "+(N Per Character Level) LO-HI Stat"
# rewrite as RUNEWORD_STAT_OVERRIDES above, keyed by (set name, piece name).
# Only covers cases independently confirmed against maxroll.gg's own numbers.
SET_STAT_OVERRIDES = {
    ("Angelic Raiment", "Angelic Halo"): {
        "+1188 to Attack Rating (Based on Character Level) (2 Items)":
            "+(12 Per Character Level) 144-1188 to Attack Rating (2 Items)",
    },
    ("Arcanna's Tricks", "Arcanna's Head"): {
        "+297 Defense (Based on Character Level) (2 Items)":
            "+(3 Per Character Level) 3-297 Defense (2 Items)",
    },
    ("Arctic Gear", "Arctic Furs"): {
        "+297 Defense (Based on Character Level) (2 Items)":
            "+(3 Per Character Level) 3-297 Defense (2 Items)",
    },
    ("Arctic Gear", "Arctic Horn"): {
        "+792 to Attack Rating (Based on Character Level) (2 Items)":
            "+(8 Per Character Level) 8-792 to Attack Rating (2 Items)",
    },
    ("Berserker's Arsenal", "Berserker's Hauberk"): {
        "+297 Defense (Based on Character Level) (2 Items)":
            "+(3 Per Character Level) 3-297 Defense (2 Items)",
    },
    ("Berserker's Arsenal", "Berserker's Headgear"): {
        "+792 to Attack Rating (Based on Character Level) (2 Items)":
            "+(8 Per Character Level) 48-792 to Attack Rating (2 Items)",
    },
    ("Cathan's Traps", "Cathan's Visage"): {
        "+198 Defense (Based on Character Level) (2 Items)":
            "+(2 Per Character Level) 2-198 Defense (2 Items)",
    },
    ("Civerb's Vestments", "Civerb's Cudgel"): {
        "+99 to Maximum Damage (Based on Character Level)":
            "+(1 Per Character Level) 1-99 to Maximum Damage",
    },
    ("Cleglaw's Brace", "Cleglaw's Pincers"): {
        "+990 to Attack Rating (Based on Character Level) (2 Items)":
            "+(10 Per Character Level) 10-990 to Attack Rating (2 Items)",
    },
    ("Cleglaw's Brace", "Cleglaw's Tooth"): {
        "+123 to Maximum Damage (Based on Character Level) (2 Items)":
            "+(1.25 Per Character Level) 1-123 to Maximum Damage (2 Items)",
    },
    ("Hsarus' Defense", "Hsarus' Iron Fist"): {
        "+247 Defense (Based on Character Level) (2 Items)":
            "+(2.5 Per Character Level) 2-247 Defense (2 Items)",
    },
    ("Hsarus' Defense", "Hsarus' Iron Heel"): {
        "+990 to Attack Rating (Based on Character Level) (2 Items)":
            "+(10 Per Character Level) 10-990 to Attack Rating (2 Items)",
    },
    ("Hsarus' Defense", "Hsarus' Iron Stay"): {
        "+247 Defense (Based on Character Level) (2 Items)":
            "+(2.5 Per Character Level) 2-247 Defense (2 Items)",
    },
    ("Infernal Tools", "Infernal Cranium"): {
        "+198 Defense (Based on Character Level) (2 Items)":
            "+(2 Per Character Level) 2-198 Defense (2 Items)",
    },
    ("Infernal Tools", "Infernal Torch"): {
        "+990 to Attack Rating (Based on Character Level) (2 Items)":
            "+(10 Per Character Level) 10-990 to Attack Rating (2 Items)",
    },
    ("Iratha's Finery", "Iratha's Coil"): {
        "+198 Defense (Based on Character Level) (2 Items)":
            "+(2 Per Character Level) 2-198 Defense (2 Items)",
    },
    ("Isenhart's Armory", "Isenhart's Lightbrand"): {
        "+495 to Attack Rating (Based on Character Level) (2 Items)":
            "+(5 Per Character Level) 5-495 to Attack Rating (2 Items)",
    },
    ("Vidala's Rig", "Vidala's Barb"): {
        "+792 to Attack Rating (Based on Character Level) (2 Items)":
            "+(8 Per Character Level) 8-792 to Attack Rating (2 Items)",
    },
}

SET_TIER_ORDER = ["Normal", "Exceptional", "Elite"]

# Set tier (Normal/Exceptional/Elite) isn't present in the scraped source —
# it's a fixed, curated classification based on each set's base item types.
SET_TIER = {
    "Aldur's Watchtower": "Exceptional",
    "Angelic Raiment": "Normal",
    "Arcanna's Tricks": "Normal",
    "Arctic Gear": "Normal",
    "Bane's Garments": "Elite",
    "Berserker's Arsenal": "Normal",
    "Bul-Kathos' Children": "Elite",
    "Cathan's Traps": "Normal",
    "Civerb's Vestments": "Normal",
    "Cleglaw's Brace": "Normal",
    "Cow King's Leathers": "Normal",
    "Death's Disguise": "Normal",
    "Griswold's Legacy": "Elite",
    "Heaven's Brethren": "Exceptional",
    "Horazon's Splendor": "Elite",
    "Hsarus' Defense": "Normal",
    "Hwanin's Majesty": "Exceptional",
    "Immortal King": "Elite",
    "Infernal Tools": "Normal",
    "Iratha's Finery": "Normal",
    "Isenhart's Armory": "Normal",
    "M'avina's Battle Hymn": "Elite",
    "Milabrega's Regalia": "Normal",
    "Naj's Ancient Vestige": "Exceptional",
    "Natalya's Odium": "Elite",
    "Orphan's Call": "Exceptional",
    "Sander's Folly": "Normal",
    "Sazabi's Grand Tribute": "Exceptional",
    "Sigon's Complete Steel": "Normal",
    "Tal Rasha's Wrappings": "Exceptional",
    "Tancred's Battlegear": "Normal",
    "The Disciple": "Exceptional",
    "Trang-Oul's Avatar": "Exceptional",
    "Vidala's Rig": "Normal",
    "Warlord's Glory": "Normal",
}

# Partial (2/3/4/5-item) set bonuses, scraped verbatim from each set's maxroll.gg
# page — the original setitems.json scrape captured only the item-level piece
# stats' "(N Items)" qualifiers, not the ones on the aggregate set-bonus block,
# so this had to be re-collected separately. fullBonuses (below) already
# reflects the correct cumulative/final value for stacking bonuses (e.g.
# Immortal King's "+450 to Attack Rating"), so these partial lines are kept as
# their own independent list rather than reconciled against it — for stacking
# stats they intentionally show the incremental per-threshold amount instead.
SET_PARTIAL_BONUSES = {
    "Aldur's Watchtower": ["150% Bonus to Attack Rating (2 Items)", "50% Better Chance of Getting Magic Items (3 Items)"],
    "Angelic Raiment": ["+10 to Dexterity (2 Items)", "+50 to Mana (3 Items)"],
    "Arcanna's Tricks": ["+50 to Mana (2 Items)", "+50 to Life (3 Items)", "Regenerate Mana 12% (3 Items)"],
    "Arctic Gear": ["+5 to Strength (2 Items)", "+50 to Life (3 Items)"],
    "Bane's Garments": ["+80% Enhanced Damage (2 Items)"],
    "Berserker's Arsenal": ["+50 to Life (2 Items)"],
    "Bul-Kathos' Children": [],
    "Cathan's Traps": ["Adds 15-20 fire damage (2 Items)", "Regenerate Mana 16% (2 Items)", "Lightning Resist +25% (3 Items)"],
    "Civerb's Vestments": ["Fire Resist +25% (2 Items)"],
    "Cleglaw's Brace": ["+50 Defense (2 Items)"],
    "Cow King's Leathers": ["+100 Defense (2 Items)", "Poison Resist +25% (2 Items)"],
    "Death's Disguise": ["8% Life stolen per hit (2 Items)"],
    "Griswold's Legacy": ["+20 to Strength (2 Items)", "+30 to Dexterity (3 Items)"],
    "Heaven's Brethren": ["10% Life stolen per hit (2 Items)", "+297 to Maximum Fire Damage (Based on Character Level) (3 Items)", "Replenish Life +30 (3 Items)"],
    "Horazon's Splendor": ["+20 to Dexterity (2 Items)", "+30 to Energy (3 Items)", "+300 Defense (4 Items)"],
    "Hsarus' Defense": ["Attacker Takes Damage of 5 (2 Items)"],
    "Hwanin's Majesty": ["+100 Defense (2 Items)", "+200 Defense (3 Items)"],
    "Immortal King": ["+50 to Attack Rating (2 Items)", "+75 to Attack Rating (3 Items)", "+125 to Attack Rating (4 Items)", "+200 to Attack Rating (5 Items)"],
    "Infernal Tools": ["+8 poison damage over 3 seconds (2 Items)"],
    "Iratha's Finery": ["+50 Defense (2 Items)", "+20% Faster Run/Walk (3 Items)", "+24% Piercing Attack (3 Items)"],
    "Isenhart's Armory": ["+10 to Strength (2 Items)", "+10 to Dexterity (3 Items)"],
    "M'avina's Battle Hymn": ["+20 to Strength (2 Items)", "+30 to Dexterity (3 Items)"],
    "Milabrega's Regalia": ["+75 to Attack Rating (2 Items)", "+198 to Maximum Lightning Damage (Based on Character Level) (2 Items)", "+125 to Attack Rating (3 Items)", "Cannot Be Frozen (3 Items)"],
    "Naj's Ancient Vestige": ["+175 Defense (2 Items)", "148% Better Chance of Getting Magic Items (Based on Character Level) (2 Items)"],
    "Natalya's Odium": ["Magic Damage Reduced by 15 (2 Items)", "+200 Defense (3 Items)"],
    "Orphan's Call": ["+35 to Life (2 Items)", "Attacker Takes Damage of 5 (3 Items)"],
    "Sander's Folly": ["+50 Defense (2 Items)", "+75 to Attack Rating (3 Items)"],
    "Sazabi's Grand Tribute": ["+40% Faster Run/Walk (2 Items)", "Poison Length Reduced by 75% (2 Items)"],
    "Sigon's Complete Steel": ["10% Life stolen per hit (2 Items)", "+100 Defense (3 Items)"],
    "Tal Rasha's Wrappings": ["Replenish Life +10 (2 Items)", "65% Better Chance of Getting Magic Items (3 Items)", "+25% Faster Hit Recovery (4 Items)"],
    "Tancred's Battlegear": ["+15 lightning damage (2 Items)", "5% Life stolen per hit (3 Items)"],
    "The Disciple": ["+150 Defense (2 Items)", "+22 poison damage over 3 seconds (3 Items)", "+10 to Strength (4 Items)"],
    "Trang-Oul's Avatar": ["+18 to Fire Ball (2 Items)", "Regenerate Mana 15% (2 Items)", "+13 to Fire Wall (3 Items)", "Regenerate Mana 15% (3 Items)", "+10 to Meteor (4 Items)", "Regenerate Mana 15% (4 Items)"],
    "Vidala's Rig": ["+75 to Attack Rating (2 Items)", "7% Mana stolen per hit (2 Items)", "+15 to Dexterity (3 Items)"],
    "Warlord's Glory": ["15% Life stolen per hit (2 Items)", "+150 Defense (3 Items)"],
}

PARTIAL_RE = re.compile(r"^(.*?)\s*\((\d+)\s*[Ii]tems?\)\s*$")

# broad slot category classifier for individual pieces
CATEGORY_KEYWORDS = [
    ("Amulet", ["amulet"]),
    ("Ring", ["ring"]),
    ("Belt", ["belt", "sash", "cord", "girdle"]),
    ("Boots", ["boot", "greaves", "sabot", "hobnail", "trek", "guard", "shoe"]),
    ("Gloves", ["glove", "gauntlet", "mitt", "bracer", "wrap", "hold", "clutch", "grip", "grasp"]),
    ("Helm", ["helm", "cap", "crown", "circlet", "mask", "coif", "guise", "casque", "basinet",
              "diadem", "visage", "corona", "war hat", "skull", "sallet", "armet", "shako",
              "totem", "countenance", "resolve", "demonhead", "swirling crystal", "cantor trophy"]),
    ("Shield", ["shield", "buckler", "kite", "tower", "aegis", "gothic shield", "spiked shield",
                "vortex", "dragon shield", "war ", "auric", "ward", "codex", "grimoire"]),
    ("Weapon", ["sword", "axe", "mace", "hammer", "spear", "polearm", "dagger", "claw", "bow",
                "crossbow", "staff", "wand", "scepter", "javelin", "knife", "pick", "flail",
                "club", "throw", "voulge", "blade", "kris", "katar", "star", "maul", "spike",
                "dart", "bill", "halberd", "yari", "totemic", "colossus", "fist", "cestus",
                "sabre", "caduceus", "suwayyah"]),
    ("Torso Armor", ["armor", "mail", "plate", "leather", "hide", "vest", "cuirass", "coat",
                      "brigandine", "wyrmhide", "scale mail", "chain", "hauberk", "shroud",
                      "coil", "shell", "skin", "russet"]),
]

def classify_category(item_type):
    t = item_type.lower()
    for cat, kws in CATEGORY_KEYWORDS:
        if any(kw in t for kw in kws):
            return cat
    return "Other"

si_raw = json.load(open(os.path.join(SCRATCH, "setitems.json")))

sets_by_name = {}
set_order = []
for it in si_raw:
    sname = it["set_name"]
    if sname not in sets_by_name:
        sets_by_name[sname] = []
        set_order.append(sname)
    sets_by_name[sname].append(it)

sets_out = []
missing_icons = 0
for sid, sname in enumerate(set_order, start=1):
    items = sets_by_name[sname]
    bonus_text = " ".join(items[0].get("set_bonuses") or [])
    found_class = next((c for c in CLASS_NAMES if c in bonus_text), "Any")
    is_new = found_class == "Warlock" or any(
        "Warlock" in " ".join(it.get("stats") or []) or "Sigil:" in " ".join(it.get("stats") or [])
        for it in items
    )

    pieces = []
    levels = []
    for it in items:
        meta = it.get("meta") or {}
        req_level = None
        if "Required Level" in meta:
            try:
                req_level = int(re.sub(r"\D", "", meta["Required Level"]) or 0)
            except ValueError:
                req_level = None
        if req_level:
            levels.append(req_level)

        icon_path = None
        if it.get("icon_data"):
            fname = f"{slugify(it['name'])}.webp"
            full_path = os.path.join(ROOT, "assets/sets", fname)
            if write_data_uri_to_file(it["icon_data"], full_path):
                icon_path = f"assets/sets/{fname}"
        if not icon_path:
            missing_icons += 1

        piece_overrides = SET_STAT_OVERRIDES.get((sname, it["name"]), {})
        pieces.append({
            "name": it["name"],
            "type": it["item_type"],
            "category": classify_category(it["item_type"]),
            "reqLevel": req_level,
            "stats": [piece_overrides.get(s, s) for s in (it.get("stats") or [])],
            "meta": meta,
            "icon": icon_path,
            "url": it.get("url"),
        })

    sets_out.append({
        "id": sid,
        "name": sname,
        "class": found_class,
        "tier": SET_TIER.get(sname, "Normal"),
        "isNew": is_new,
        "level": max(levels) if levels else None,
        "pieceCount": len(pieces),
        "fullBonuses": items[0].get("set_bonuses") or [],
        "partialBonuses": SET_PARTIAL_BONUSES.get(sname, []),
        "pieces": pieces,
    })

print("Sets transformed:", len(sets_out))
print("Set pieces missing icon:", missing_icons)

sets_js = (
    "/* Generated from scrape data — do not hand-edit; see scratch/transform.py */\n"
    "'use strict';\n\n"
    "const SET_CLASS_ORDER = " + json.dumps(["Any"] + CLASS_NAMES) + ";\n\n"
    "const SET_TIER_ORDER = " + json.dumps(SET_TIER_ORDER) + ";\n\n"
    "const SETS_DATA = " + json.dumps(sets_out, ensure_ascii=False) + ";\n"
)
with open(os.path.join(ROOT, "data/sets-data.js"), "w") as f:
    f.write(sets_js)

print("Done.")
