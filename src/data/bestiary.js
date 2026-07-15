// ─── Codex: Bestiary - deep lore for every enemy encountered across the story ──
// Keyed by imageKey (the stable per-creature identity shared across ENEMY_GROUPS
// entries - the same imageKey reappears in multiple stages/chapters at scaled
// stats but is always the same named creature/character).
// Combat stats/skills/names stay single-sourced in enemies.js - this file is
// prose only. Tier is derived from the imageKey prefix, never duplicated here.

import { ENEMY_GROUPS } from './enemies';
import { STAGE_ORDER } from './story';

export const BESTIARY = {
  // ── CHAPTER 1: SHATTERED VEIL ──────────────────────────────────────────────
  mob_001: {
    epithet: 'Rift-Born Scout',
    lore: "Flame Scouts are the first thing that ever crosses a freshly torn dimensional rift - disposable, fast, and utterly without the discipline of what follows them. Lysha the Glacial Empress never trained these creatures; they simply congeal out of the raw energy bleeding through a breach and go wherever the strongest pull of hostility points them. Killing one tells you almost nothing about what's coming. Killing dozens tells you the rift is still widening.",
  },
  mob_002: {
    epithet: 'Ember Wraith',
    lore: "Fire Specters have no true bodies - they're combustion given enough will to hate. They form wherever a rift's heat-bleed meets desperation on the other side, which is why they always outnumber every other early invader. A Fire Specter can be struck a hundred times and simply reignite from its own embers unless the strike lands with enough force to scatter the core flame entirely.",
  },
  mob_003: {
    epithet: 'Void Hound',
    lore: "Shadow Hounds hunt in the space between one heartbeat and the next, tracking prey by the fear it generates rather than scent or sound. They were the first creatures the settlement's frontier watch ever reported - pack animals loyal to whichever void-aligned commander currently holds the rift, discarded and reabsorbed into the dark the instant that loyalty changes hands.",
  },
  'mini-boss_001': {
    epithet: 'The Frost Commander',
    lore: "Before Lysha herself ever set foot beyond the rift, she sent a commander to test whether the world on the other side was worth ruling. He marched with real military discipline - formations, supply lines, a chain of command - because Lysha does not waste her ice on chaos. His defeat at the settlement's gates was the first proof the heroes had that whatever waited beyond the breach was organized, patient, and ancient enough to plan centuries ahead.",
  },
  boss_001: {
    epithet: 'The Glacial Empress',
    lore: "Lysha ruled the frozen void long before Aetheria had a name for itself, sealed away in dimensional ice that even she could not remember the reason for. When the barrier shattered, she didn't invade - she simply resumed the reign that had been interrupted mid-sentence for longer than any mortal record could measure. Her cold isn't weather; it's the natural temperature of the void she calls home, and every scout, hound, and commander she sent through the rift was simply testing how much of that cold the new world could survive before she arrived to make it permanent. She was Aetheria's first true glimpse of how much older the multiverse's threats could be than anything it had ever prepared for - a lesson the heroes would keep relearning, at greater and greater scale, for the next twenty-nine chapters.",
  },

  // ── CHAPTER 2: ASHEN INFERNO ───────────────────────────────────────────────
  mob_004: {
    epithet: 'Wraith of the Caldera',
    lore: "Shadow Wraiths formed in the ash-choked air above Pyrevex's caldera long before the drake himself ever stirred - condensations of grief and smoke where entire volcanic settlements had once stood. They don't serve Pyrevex out of loyalty; they simply orbit the largest source of destructive heat in any given radius, the way moths orbit flame, and right now that happens to be him.",
  },
  mob_008: {
    epithet: 'Emberhorn Brute',
    lore: "Emberhorn Brutes are what happens when a creature spends generations too close to a caldera that never fully cools - thick ash-hide, magma-cracked horns, and a temperament permanently soured by heat that never lets up. They don't need Pyrevex's command to be dangerous; they simply become considerably more dangerous once something as large as a drake starts actively directing their rage.",
  },
  'mini-boss_002': {
    epithet: 'The Inferno Warden',
    lore: "The Warden's title isn't decorative - he was quite literally built by Pyrevex's forces to seal a battlefield shut, walling enemies inside rings of fire until there was nowhere left to retreat. He fought at the caldera's mouth not because he wanted glory, but because Pyrevex trusted no one else to guarantee that whatever entered the caldera never chose to leave on its own terms.",
  },
  boss_002: {
    epithet: 'The Ashen Drake',
    lore: "Pyrevex was never native to Aetheria - Zimara identified the wrongness in his signature the instant the caldera erupted, and she was right to be alarmed. He is a drake forged from volcanic rock and dimensional heat that has nothing to do with any world's natural geology, which means somewhere else, in some other reality, an entire ecosystem of magma-forged predators like him may still exist. His arrival in Aetheria's second chapter - right on the heels of Lysha's rift-born invasion - was the first sign that the shattered barrier wasn't a single wound. It was a door, and more than one thing on the other side had already noticed it was open.",
  },

  // ── CHAPTER 3: DAWN OF RADIANCE ────────────────────────────────────────────
  mob_005: {
    epithet: 'Forsaken Warden',
    lore: "Forest Wardens were sworn protectors of Sunspire's sacred light shrines for generations before the corruption reached them - their devotion never wavered, only its target did. Zimara put it plainly: their loyalty was simply redirected to a new master. They still fight with every technique they were trained to use in defense of the light. They just no longer remember what the light was originally for.",
  },
  mob_006: {
    epithet: 'Golem of False Radiance',
    lore: "Light Golems were carved from consecrated stone meant to channel Sunspire's holy energy into the shrines that needed it most. When the corruption inverted that energy, the golems didn't break - they simply began channeling the wrong thing with the same unwavering purpose, radiating a light that blinds and burns instead of heals.",
  },
  'mini-boss_003': {
    epithet: 'The Fallen Forest Knight',
    lore: "Aisling Doyle recognized him instantly as one of the greatest defenders the old shrines had ever produced - a knight whose celestial armor had cracked but never truly shattered. Maeve Boyle's read was the more painful one: he still fights with real forest technique, real discipline, real skill. Every parry and counter is exactly as masterful as it would have been before the corruption. Only the cause he's defending has changed.",
  },
  boss_003: {
    epithet: 'The Light Maiden',
    lore: "Aurariel doesn't believe she's committing an atrocity. Zimara understood her better than anyone: Aurariel believes she is performing a mercy, ending all suffering by ending everything that could ever suffer again. She is Aetheria's first true lesson in a kind of enemy the heroes would face again and again in the chapters ahead - not malice, but conviction bent so far past reason that it becomes catastrophic. Valentina Ardente's answer was the only one that ever works against her kind: show her something worth preserving, and let her believe in it instead.",
  },

  // ── CHAPTER 4: THORNWALL ───────────────────────────────────────────────────
  mob_007: {
    epithet: 'Abyss-Bound Ravager',
    lore: "Carmen Vidal identified these creatures immediately as former nature spirits - guardians who once tended the ancient forest's roots with total devotion. The abyss corruption didn't kill them or replace them; it simply turned that devotion inside out, so that the same spirits who once protected the World Tree now strangle it from within, believing they're still serving it.",
  },
  'mini-boss_009': {
    epithet: 'The Crimson Widow Queen',
    lore: "Long before she ever served an empire, the Crimson Widow Queen ruled her own small, absolute domain - the thorn barrier sealing Thornqueen Sylva's corrupted grove, woven entirely from corrupted nature energy she spun herself. Maeve Boyle called her threads nearly invisible in the dark, and that precision was hers alone, not borrowed from any greater power. It would be a full decade of story-time before the heroes learned this wasn't the last time they'd meet her - ten chapters later, a very different empress would find a use for those same webs, empowered by power the Widow Queen never had to ask for.",
  },
  boss_004: {
    epithet: 'Queen of the Thorned Grove',
    lore: "Sylva didn't fall to the corruption. She chose it, merging with dark energy in a desperate bid to protect a forest she watched dying around her - and the corruption accepted the trade, then kept taking more than she offered. Carmen Vidal's grief on the battlefield was real: Sylva was consuming, and by the time the World Tree's roots erupted like reaching arms, there wasn't enough of the original protector left to pull back from what she'd become. Her defeat wasn't a victory over an invader. It was, as Valen insisted with every Trump Card thrown, a rescue that arrived too late to save anything but the forest itself.",
  },

  // ── CHAPTER 5: VERDANT RUIN ────────────────────────────────────────────────
  mob_014: {
    epithet: 'Corrupted Water Guardian',
    lore: "Water Guardians were built to protect the realm's rivers from exactly this kind of blight - and instead became its primary vector. Carmen Vidal's grief was sharp and specific: these were meant to stop the corruption, not spread it, and now every guardian that falls releases another cloud of tainted spore into water that used to be sacred.",
  },
  'mini-boss_010': {
    epithet: 'The Frostveil Sorceress',
    lore: "What separated the Sorceress from every other corrupted guardian in the Bloom Swarm was that she studied. Maeve Boyle noticed it first - she'd weaponized the bloom's infectious spores with ice, freezing them mid-air so they pierce flesh instead of merely infecting it, a refinement that required watching how the heroes fought and adapting specifically around it. She was proof the corruption spreading through Verdant Ruin wasn't purely instinctual. Something behind it was learning.",
  },
  boss_005: {
    epithet: 'The Bloom Devourer',
    lore: "Verdara is the only enemy the heroes faced in the war's early chapters who was never an outside invader corrupting something pure. Carmen Vidal said it plainly at the forest core: Verdara didn't come from outside - she was born from inside the corruption itself, a being that formed the way an infection eventually grows a mind of its own. Zimara's correction to Carmen's grief was the harder truth: Verdara doesn't carry the corruption. She *is* the corruption now, with no original self left underneath to save.",
  },

  // ── CHAPTER 6: SHADOWBLOOM ─────────────────────────────────────────────────
  mob_010: {
    epithet: 'Rotclaw Ghoul',
    lore: "Rotclaw Ghouls are what's left of creatures that died inside Nyx's black garden and never got the mercy of staying dead - reanimated by the same shadow-poison that's been quietly infecting every forest the heroes have passed through since Chapter Four. Reika Kurosawa was the first to notice they were operating alongside Frostveil Sirens with real coordination, which meant something was directing both - long before anyone knew Nyx's name.",
  },
  mob_009: {
    epithet: 'Frostveil Siren',
    lore: "The Sirens sing in frequencies designed to fracture concentration rather than eardrums, disguising themselves in petals as though shadow could pass for spring. Valen's instinct to silence them first, before engaging anything else in the Thorn Wraith host, was correct for a reason nobody fully understood until later: their song was the coordination channel Nyx used to direct every other creature in the garden at once.",
  },
  mob_013: {
    epithet: 'Forest Marionette',
    lore: "Forest Marionettes would become one of the most feared recurring enemies of the entire war, and their first appearance here - in Nyx's black garden - already showed why. Dario Ferraro's later assessment, chapters after this, would name the trait precisely: they have no fear because they feel nothing, which makes them the hardest enemies in Aetheria to break through conventional means. They aren't corrupted nature spirits like the Ravagers or Wardens. They were built empty from the start, strings pulled by whichever shadow-aligned power currently holds them - first Nyx, and later, far more times than the heroes would like to count.",
  },
  'mini-boss_011': {
    epithet: 'The Fallen Valkyrie',
    lore: "Zimara recognized the shattered divine armor before she recognized anything else about her: this was a Celestial Fallen Valkyrie, divine once, broken deeply enough that Reika Kurosawa couldn't even guess at the cause. She guards the entrance to Nyx's black garden not out of loyalty earned, but because whatever broke her left nothing else for her to be loyal to. Valen's order to strike fast rather than try to save her wasn't cruelty - it was recognition that some falls go too deep to reverse mid-battle.",
  },
  boss_006: {
    epithet: 'The Shadowbloom Queen',
    lore: "Nyx is the answer to a question the heroes didn't know they'd been asking since Chapter Four: who has been coordinating the corruption spreading through every forest they've passed through? Kaori Adachi's realization at the World Tree's poisoned heart confirmed it - Nyx had been poisoning the forests from within all along, patient enough to let Thornqueen Sylva and Verdara rise and fall as symptoms while she remained the disease underneath. She rules from a garden where the World Tree itself weeps shadow instead of sap, proof that by the time you can see corruption, its source has usually already moved on to somewhere deeper.",
  },

  // ── CHAPTER 7: ABYSSAL GATE ────────────────────────────────────────────────
  mob_011: {
    epithet: 'Stormbreaker Titan',
    lore: "Stormbreaker Titans are void-forged shock troops built for one purpose: break through fortified lines by sheer mass and momentum, then let the actual invasion follow through the gap. They poured through the Abyssal Gate in formation rather than as a mob, the first clear sign the heroes had that the void legions crossing this breach were an organized military, not a swarm.",
  },
  'mini-boss_007': {
    epithet: 'The Abyss Prophet',
    lore: "The Prophet doesn't fight blind - he reads futures, which is exactly why Valentina Ardente's counter-strategy was to abandon patterns entirely and fight on pure instinct. Kaori Adachi felt something immense waking on the other side of the gate the moment the Prophet's forces engaged, and it's since become clear the Prophet's foresight wasn't a personal gift. It was borrowed from something that could already see centuries ahead - the same something Kaori Adachi would recognize, with far more history than he'd ever shared, one stage later.",
  },
  boss_007: {
    epithet: 'The Abyss Sovereign',
    lore: "Kaori Adachi's words at the obsidian throne's descent were the shortest and heaviest of the entire chapter: this is what took everything from me. The Abyss Sovereign is ancient even by the standards of the multiversal threats the heroes had already faced - Lysha and Pyrevex were incursions from elsewhere, but the Sovereign's obsidian throne descending through Aetheria's own torn sky suggested a far older, far more personal connection to this world specifically, and to the man who fought him with nothing held back.",
  },

  // ── CHAPTER 8: ECLIPSE RISING ──────────────────────────────────────────────
  mob_012: {
    epithet: 'Dark Huntress',
    lore: "Dark Huntresses flank rather than charge, disciplined enough that Aisling Doyle immediately clocked someone commanding the Eclipse vanguard with real military coordination. They hunt in the dimming light with patience the Stormbreaker Titans they march alongside completely lack - precision predators serving a sky that was going dark on purpose.",
  },
  'mini-boss_004': {
    epithet: 'The Void Samurai Warlord',
    lore: "Reika Kurosawa named the danger precisely: his blade cuts through dimensional barriers, which makes every conventional defense the heroes have irrelevant to him. But Maeve Boyle saw the deeper truth - he honors the fight, refusing cheap tricks even against enemies he could dismantle with them. Valentina Ardente's read was the one that mattered most: a warrior who fights with honor can be outfought with skill, not exploited. This first meeting would not be the last. A greater version of this same warlord waits at the very edge of existence, chapters from now, guarding a passage he believes should never be closed.",
  },
  boss_008: {
    epithet: 'The Radiant Dragon Emperor',
    lore: "Zimara's correction mattered: the Emperor doesn't merely use divine light, he IS divine light given physical form, ancient beyond any measure the heroes had available. His arrival proved something Aurariel's fall in Chapter Three had only hinted at - that holy radiance, unchecked and absolute, is every bit as capable of annihilation as the darkest void. Aisling Doyle's counter-strategy, shadow and void techniques against a being of pure light, marked the first time the heroes fought fire with its precise opposite rather than matching element for element, a lesson that would matter again when they faced a being who'd fused both sides completely.",
  },

  // ── CHAPTER 9: CELESTIAL FRACTURE ──────────────────────────────────────────
  'mini-boss_008': {
    epithet: 'The Clockwork Commander',
    lore: "The Commander doesn't fight with instinct or rage - he calculates, reorganizing the battlefield mid-combat faster than human intuition can track. Aisling Doyle found every gap the heroes exploited closed before they could reach it. Zimara found his one true weakness: his processing has a thermal limit, and pushed hard enough, his perfect calculations fail under overload - proof that even flawless order eventually breaks against enough coordinated chaos.",
  },
  boss_009: {
    epithet: 'Fusion of Light and Dark',
    lore: "Valkor is the first being the heroes encountered who had actually succeeded at what Mother Eclipse would later achieve naturally - merging perfect light and perfect darkness into one form. The difference, Kaori Adachi realized too late to prevent the attempt, is that Valkor forced the synthesis rather than letting it settle: he absorbed both sides of the celestial fracture and tried to rewrite what reality allows by sheer will. Five factions stopping that rewrite before it completed was the first time unity itself - not any single element - was the thing that actually won the fight.",
  },

  // ── CHAPTER 10: VOID QUEEN'S REIGN ─────────────────────────────────────────
  'mini-boss_012': {
    epithet: 'The Nature Assassin',
    lore: "She moves through Queen Nythera's corrupted garden without disturbing a single petal, and Carmen Vidal's warning explained why nobody could hide from her there: she reads the plant network itself, feeling every heroes' position through the roots beneath their feet. What almost none of the heroes suspected at the time was that she wasn't the most dangerous member of her family. Fifteen chapters later, at the edge of everything named, they would meet her elder sister - and understand exactly where she learned this kind of patience.",
  },
  boss_010: {
    epithet: 'The Void Queen',
    lore: "Zimara's assessment of Nythera cuts to the heart of what makes her uniquely dangerous: she didn't conquer the celestial realm by force. She infected it, and it surrendered willingly. She is void energy given a throne, having absorbed dimensional power from every realm the abyss has ever touched - not a foreign invader smashing through a gate, but a slow, willing corruption that the celestial realm let happen to itself one compromise at a time.",
  },

  // ── CHAPTER 11: TITAN'S MARCH ──────────────────────────────────────────────
  'mini-boss_005': {
    epithet: 'The Infernal Berserker King',
    lore: "He doesn't walk toward a fight - Dario Ferraro watched him detonate in its direction. He feeds on pain, both the pain he inflicts and the pain he takes, which means every hit landed against him only makes him hungrier and stronger. Aisling Doyle's read made the strategy obvious: long battles favor him completely, so the only safe fight against the Berserker King is one that ends before his rage has time to peak.",
  },
  boss_011: {
    epithet: 'The Infernal Titan King',
    lore: "Dario Ferraro called him basically unkillable under normal conditions, and at building-scale height with each footstep erasing landmarks centuries old, that assessment wasn't hyperbole. Carmen Vidal found the one flaw in his design - a volcanic core on his chest sustaining both his size and his heat - and Maeve Boyle's insight completed the plan: concentrated cold or void energy against that single point destabilizes the entire titan. Precision, not brute force, is what actually brings down something this size.",
  },

  // ── CHAPTER 12: TIME'S END ─────────────────────────────────────────────────
  'mini-boss_006': {
    epithet: 'The Frost Revenant Knight',
    lore: "He has died before Chronos's arrival at this battlefield - multiple times, each death recorded as another layer of frost on his armor. Zimara's diagnosis was the grim one: he can't truly die while Chronos still holds his timeline, because Chronos simply loops the death backward and rebinds him to service each time. Defeating him for good required something rarer than damage - enough simultaneous force to make the death total before the loop could reset it.",
  },
  boss_012: {
    epithet: 'The God of Time',
    lore: "Chronos doesn't fight to win in the moment - he fights by rewriting when the moment happened at all, undoing the heroes' victories as fast as they achieve them. Zimara's answer to Valen's question - how do you fight someone who controls when things happen? - was the only one that could possibly work: act in the exact instant he can't predict, before he has time to see it coming and erase it. Facing a literal god of time, chapters after facing gates, empires, and swarms, was the moment the war stopped being about strength and started being about acting faster than causality itself.",
  },

  // ── CHAPTER 13: ETERNAL WINTER ─────────────────────────────────────────────
  'mini-boss_013': {
    epithet: 'The Storm Siren Empress',
    lore: "Aisling Doyle's correction to how the heroes understood her was essential: the Empress doesn't control storms. She IS the storm, her voice tuned to weather frequencies so precisely that each note calls lightning and each breath becomes blizzard. Zimara identified the one vulnerability in a being made of pure weather - interrupt the song before its crescendo, and the storm that depends on it collapses along with it.",
  },
  boss_013: {
    epithet: 'The Frostbound Monarch',
    lore: "The Monarch had been watching the entire war since before Chapter One, letting every other threat - Lysha, Pyrevex, Nyx, Nythera - test the heroes first while he studied and prepared. Aisling Doyle's warning at the throne's approach was chilling in its precision: he had designed counters for every single Trump Card the heroes had ever used, built specifically around their exact abilities. His defeat marked what the heroes believed, in that moment, was the true end of the war - the culmination of everything five factions had earned through blood and sacrifice. History would prove that belief wrong almost immediately.",
  },

  // ── CHAPTER 14: CRIMSON EMPIRE ─────────────────────────────────────────────
  boss_014: {
    epithet: 'The Crimson Empress',
    lore: "Seraphine never fought the heroes directly until Chapter Fourteen - she simply waited and fed. Reika Kurosawa's realization was devastating in hindsight: she'd been absorbing a fraction of the power from every Trump Card the heroes used since Chapter One, harvesting their victories as fuel for her own ascension. Valen named the truth plainly - Seraphine had engineered the entire war so the heroes would grow strong enough to be worth harvesting. Every previous villain, however dangerous, had unknowingly been charging this one.",
  },

  // ── CHAPTER 15: WORLD'S LAST HOUR ──────────────────────────────────────────
  boss_015: {
    epithet: 'The World Eater Leviathan',
    lore: "Kaori Adachi's description carried the true weight of what the heroes were facing: the World Eater doesn't conquer or corrupt anything - it simply consumes, and it existed before the universe itself had a name to lose. Zimara's account of its history was absolute: every realm it has touched is gone, not conquered or corrupted but erased so completely that they were removed from having ever existed at all. It surfaced from the cosmic abyss having sent an entire herald of lesser threats ahead of it - antibodies clearing resistance before the main body ever had to arrive. Facing it meant fighting not to win in any conventional sense, but simply to remain real in a universe actively being eaten alive around them.",
  },

  // ── CHAPTER 16: CATHEDRAL OF CHAINS ────────────────────────────────────────
  mob_015: {
    epithet: 'Iron Shade Knight',
    lore: "These knights weren't Seraphine's, even though they guarded ground beneath her fallen palace - Reika Kurosawa realized they answered to someone else entirely, someone Seraphine herself had kept chained in the cathedral basement. Their loyalty to Visalia predates the Crimson Empire that unknowingly grew on top of her.",
  },
  mob_016: {
    epithet: 'Forest Revenant',
    lore: "Reanimated remnants of the forest corruption era, drawn to Visalia's cathedral the way moths are drawn to any concentration of old, patient darkness. They serve without understanding why - proof that Visalia's influence has been quietly touching every corrupted thing in Aetheria for far longer than anyone realized.",
  },
  mob_017: {
    epithet: 'Earth Sentinel',
    lore: "Stone constructs that predate the cathedral itself, part of the same ancient binding architecture that once sealed the Stone Keeper beneath the floor. When Seraphine fell and cracked the foundations, the Sentinels were among the first things to stir - proof the entire cathedral had been holding something down for far longer than the Crimson Empire's brief reign.",
  },
  'mini-boss_014': {
    epithet: 'The Stone Keeper',
    lore: "Dario Ferraro's realization mid-battle was uncomfortable: the ancient seals on the cathedral's stone pillars had been BINDING the Keeper, not decorating the architecture. Seraphine's fall cracked those foundations, and the heroes accidentally freed an earth guardian that had been sealed for centuries - meaning their victory in Chapter Fourteen had unintentionally caused the very threat they now had to put back down.",
  },
  boss_016: {
    epithet: 'The True Architect',
    lore: "Visalia predates Seraphine by centuries and was never her subordinate - Kaori Adachi's realization at the cathedral altar reframed the entire Crimson Empire's history: Seraphine wasn't the architect of the war's cruelty. Visalia was, engineering every conflict, every empire, every battle from the shadows while feeding on the collective bloodshed they generated. The Crimson Empire had been drawing from Visalia's reservoir the entire time without ever knowing it existed. Everything Seraphine harvested from the heroes' Trump Cards ultimately flowed to her.",
  },

  // ── CHAPTER 17: THE HOLLOW CROWN ───────────────────────────────────────────
  mob_019: {
    epithet: 'Void Wraith Archer',
    lore: "Soldiers of a kingdom erased so completely that no record, map, or memory acknowledges it ever existed. Kaori Adachi called their resolve the kind that doesn't fade with death - they fight for a name and a history that history itself refuses to admit was real.",
  },
  mob_020: {
    epithet: 'Tomb Specter',
    lore: "Guardians of the erased kingdom's burial grounds, loyal to a throne with no name and a grievance with no official record. Maeve Boyle recognized the particular resolve in how they fight - like soldiers with something to prove not to an enemy, but to a world that pretended they never existed.",
  },
  'mini-boss_015': {
    epithet: 'Lady Silkgrave',
    lore: "Zimara identified her instantly beneath the crystal spider limbs and the royal funeral dress: she was the queen of the erased kingdom before history took both her and her king. Reika Kurosawa's grim comparison explained the divergence in how the two of them survived erasure - the King became fury, consumed by rage at being forgotten. Silkgrave became something else entirely, weaving a perfectly preserved tomb kingdom in the dark rather than raging against the world that discarded her, centuries of grief transformed into patient, silent architecture instead of vengeance.",
  },
  boss_017: {
    epithet: 'The Crownless King',
    lore: "Every name carved into his black-gold armor belongs to someone whose story was erased alongside his own - Kaori Adachi understood immediately that he carries their weight because he refuses to let an entire kingdom be forgotten twice. The void where his face should be marks exactly where his identity was taken, leaving him certain only that he was wronged, and that the wrong was systematic rather than accidental. Reika Kurosawa's warning proved correct: something this old and this specifically angry doesn't have a clean weakness to exploit. Only a will that had to be met with an equal and opposite one.",
  },

  // ── CHAPTER 18: DIVIDED HEAVEN ─────────────────────────────────────────────
  mob_021: {
    epithet: 'Dark Golem',
    lore: "Constructed by the volcanic monastery's forge-cultists as weapons rather than worshippers, built specifically to survive the heat of a goddess achieving perfect convergence. Dario Ferraro's read was correct - whoever built them wanted something that could stand near Mother Eclipse's awakening without melting, faith or devotion never a factor in the design.",
  },
  mob_022: {
    epithet: 'Obsidian Sentinel',
    lore: "Sister constructs to the Dark Golems, forged from the same volcanic monastery's molten stone to guard against anyone attempting to interrupt Mother Eclipse's convergence before it completed. Their purpose was never combat glory - only buying enough time for two cosmic energies to finish becoming one.",
  },
  'mini-boss_016': {
    epithet: 'The Furnace Saint',
    lore: "Once a holy knight, his faith was tested past its breaking point until it transformed into something molten - Valentina Ardente described the glowing cavity where his chest armor used to be, a cursed weapon literally forged from his own melted conviction. Dario Ferraro's grimmest observation was the truest one: he believes converting souls into fuel for Mother Eclipse's awakening is holy work. You cannot reason with devotion that has been refined this far beyond doubt - you can only oppose it with equal, unshaken conviction of your own.",
  },
  boss_018: {
    epithet: 'The Balanced Goddess',
    lore: "Mother Eclipse achieved what Celestial Valkor tried and failed to force nine chapters earlier - true, natural equilibrium between divine light and absolute darkness, two cosmic bodies merged into one being with neither side dominant. Kaori Adachi, who had faced beings of pure void and witnessed entities of pure light separately, had never encountered anything like her: she transcends elemental categories entirely, existing in the space between all of them rather than as any single extreme. Reika Kurosawa's assessment closed the door on ordinary strategy - no elemental advantage applies to something that embodies everything and its opposite simultaneously. Only total, unified commitment from every faction at once ever stood a chance.",
  },

  // ── CHAPTER 19: THE LIVING ARCHIVE ─────────────────────────────────────────
  mob_018: {
    epithet: 'Phantom Silk Crawler',
    lore: "Parasitic constructs that nest between the spines of the Archive's oldest volumes, spinning threads from unread pages the way spiders spin webs from silk. They aren't guardians so much as symptoms - proof that even the Archive's own shelves have started to rot from how much knowledge has been crammed, unread and unprocessed, into a space never meant to hold this much.",
  },
  mob_023: {
    epithet: 'Star Map Wanderer',
    lore: "Ancient navigators whose cosmic charts originally drew the Archive Devourer to this location, now trapped inside its stacks forever. Kaori Adachi's diagnosis was bleak: they're feeding the Devourer dimensional information on an endless loop, their life's navigational work consumed and repeated back to them as a cage rather than a legacy.",
  },
  mob_024: {
    epithet: 'Dimensional Rift Stalker',
    lore: "Aisling Doyle identified them as the Archive's immune system given a body - creatures that attack anything entering the library without belonging to it. The heroes, by every definition the Stalkers could measure, did not belong there at all, which made every step deeper into the stacks a fight for the right to keep moving forward.",
  },
  'mini-boss_017': {
    epithet: 'The Void-Touched Navigator',
    lore: "An ancient sailor who mapped too many dimensions and brought too much of the void home with him - Reika Kurosawa described the star maps carved permanently into his skin, a ghostly compass behind him that reads dimensions instead of directions. Zimara's realization was the tragic core of the fight: the Archive claimed him when his knowledge became valuable enough to partially consume, leaving him aware but bound to serve. Kaori Adachi saw the opening in that - partial consumption means part of him is still present, still aware this is wrong, still hating every second of it.",
  },
  boss_019: {
    epithet: 'The Devourer of Knowledge',
    lore: "The Archive Devourer doesn't destroy the knowledge it consumes - Zimara was precise about the horror of it: it contains everything, every secret, every lost civilization's final recorded words, every spell ever written, all still trapped and aware somewhere inside it. Kaori Adachi's warning before the final clash cut deepest: it had already read the heroes' complete history from a thousand different sources, meaning any documented technique or established pattern was already known and countered before it was even attempted. Reika Kurosawa's answer - pure improvisation, giving it nothing that had ever appeared in any text - was the first time the heroes' greatest weapon against an ancient threat was simply doing something no one had ever written down before.",
  },

  // ── CHAPTER 20: BEFORE THE FIRST BREATH ────────────────────────────────────
  mob_025: {
    epithet: 'Porcelain Guard',
    lore: "Manifestations of the First Dream's subconscious, crafted with the same delicate, deliberate beauty as everything the ancient dreamer imagines - dreams defending a dreamer who believes it must never be disturbed, regardless of the cost to whatever intrudes.",
  },
  mob_026: {
    epithet: 'Celestial String Dancer',
    lore: "Elegant, weightless constructs that move like performance rather than combat, born from the same dreaming subconscious that birthed the Porcelain Guards and, eventually, the Last Marionette herself. Even in battle, they carry an unmistakable grace - as if violence itself were something the First Dream had never quite learned to imagine correctly.",
  },
  'mini-boss_018': {
    epithet: 'The Last Marionette',
    lore: "Zimara recognized her as the First Dream's most beloved creation - made to be beautiful, to perform, to prove that the dream's capacity for joy had no limit. Aisling Doyle noticed the cracks first: porcelain fractured from eons of maintaining a performance for a sleeping audience of exactly one. Kaori Adachi's read on her resolve was the saddest truth in the entire encounter - she believes that if the dream ends, she ends with it, and will not willingly step aside from a stage she's guarded since before recorded history began. Valen's final act wasn't a killing blow so much as a mercy - giving a lonely, eternal performer the ending curtain she'd been building toward the entire time.",
  },
  boss_020: {
    epithet: 'The Dreaming Origin',
    lore: "The First Dream existed before the universe had rules, before cause and effect were invented, before anything anywhere had a name - Kaori Adachi's assessment placed it below the void, below the shadow, below everything the heroes had previously understood as deep. It is the original consciousness that dreamed existence into being in the first place, and it was never evil in any sense that word could apply - it simply predates the concept entirely. The heroes' victory here wasn't destruction; destroying the dream would have unmade the reality it was dreaming, themselves included. It was persuasion - proving to something vast, ancient, and utterly without context for a world outside its own imagination that the dream it had made was worth continuing exactly as it was.",
  },

  // ── CHAPTER 21: SHADOW SOVEREIGN ───────────────────────────────────────────
  mob_027: {
    epithet: 'Shadow Feline',
    lore: "Scouts sent by the Shadow Sovereign to test the heroes' perimeter before she committed to a full assault - silent, fast, and utterly disposable in her eyes. Kaori Adachi recognized immediately that these weren't random creatures but a deliberate probe, testing exactly how much resistance stood between the Sovereign and open war.",
  },
  mob_028: {
    epithet: 'Void Viper',
    lore: "Serpentine void constructs that move through the space between shadows rather than across open ground, part of the same vanguard sent to measure the heroes before the Shadow Sovereign revealed herself. Their venom doesn't poison the body so much as the certainty - victims report doubting things they were sure of only moments before.",
  },
  mob_032: {
    epithet: 'Dark Crowmancer',
    lore: "Corrupted spellcasters who commune with murders of shadow-crows as living extensions of their own senses, scouting far ahead of the Shadow Sovereign's main forces. Valen's question after the vanguard fell - how far back does this go? - was aimed squarely at what these scouts represented: centuries of patient preparation the heroes hadn't even known was happening.",
  },
  'mini-boss_019': {
    epithet: 'The Kitsune Specter',
    lore: "Aisling Doyle identified her as a fox spirit bound to the Shadow Sovereign's service, her consciousness split across nine phantom tails simultaneously - never fully present in any single place. Kaori Adachi found the exploit: every fox spirit has a single node holding all nine phantoms together, and severing that node collapses the illusion completely. Finding that node while she moved at full speed required every ounce of coordination five factions had built across twenty prior chapters of fighting side by side.",
  },
  boss_021: {
    epithet: 'The Shadow Sovereign',
    lore: "She had been consolidating power in the dark realm since before any of the heroes were born, patient enough to wait three hundred years for the exact right moment to move. Reika Kurosawa's realization was chilling in scope: she'd been absorbing shadow energy from every battle the heroes had ever fought, across every single prior chapter - every darkness they dispelled had fed her rather than weakened the dark as a whole. Zimara found the one thing shadow energy this vast had never been forced to absorb: pure, faction-unified light, five elements combined into something the Sovereign's centuries of preparation had never modeled. She planned for every scenario except total, genuine cooperation - which, as Kaori Adachi noted, has always been the heroes' real edge against enemies who plan alone.",
  },

  // ── CHAPTER 22: THE COSMIC WEAVE ───────────────────────────────────────────
  mob_029: {
    epithet: 'Bone Harpy',
    lore: "Creatures that formed when cosmic energy from a dying star crystallized without structure or intention - Zimara's read was that these are by-products, not designed servants, evidence of just how much raw stellar material was being consumed and reshaped above the crystallized field.",
  },
  mob_030: {
    epithet: 'Crystal Drake',
    lore: "Smaller echoes of dead starlight given crude draconic form, drifting through the collapsed star field where Caelestra's cosmic weave was under construction. Valentina Ardente noticed the deliberate patterns in how they clustered - proof someone was shaping the star's remains into something with real intention, not merely letting the collapse scatter randomly.",
  },
  mob_031: {
    epithet: 'Abyss Spider',
    lore: "Void-touched arachnids that thread the gaps between crystallized starlight, weaving structural support for whatever Caelestra was assembling from a dying sun's remains. Their webs are laced with condensed stellar radiation - beautiful, and lethal to anything that touches them without preparation.",
  },
  'mini-boss_020': {
    epithet: 'The Obsidian Scholar',
    lore: "Kaori Adachi's assessment was precise: she's spent her entire existence translating stellar collapse events into usable magical formulae, and what she guards is the culmination of that life's research. Reika Kurosawa's correction mattered - she didn't build the cosmic weave herself. She found the theoretical blueprint for it inside a dying star's final light and handed the execution to someone capable of actually wielding that scale of power. She is the architect of the idea, not the force behind it - which made stopping her, rather than merely defeating her, the only way to ensure the theory could never be applied again.",
  },
  boss_022: {
    epithet: 'The Cosmic Weaver',
    lore: "Zimara named the scale of what Caelestra had done: she absorbed the memories of dying worlds, every civilization that burned out and every consciousness that reached for more than it could hold, keeping all of it rather than letting it fade with the stars that once housed it. Valen recognized this wasn't simple power - it was responsibility carried at a scale no single being should have to hold. Reika Kurosawa's warning shaped how the heroes approached her: beings who absorb that much memory eventually lose track of which instincts are truly theirs and which were merely borrowed from the dead. She was not defeated so much as reminded - by five factions acting as one living, present voice - that one world still choosing to exist mattered more than all the preserved memory of a thousand that no longer did.",
  },

  // ── CHAPTER 23: DEMON GLACIER ──────────────────────────────────────────────
  'mini-boss_021': {
    epithet: 'Lysse the Youngest',
    lore: "Kaori Adachi recognized her at once as the youngest of the Crimson sisters - the same ancient bloodline that produced Visalia, though younger by that lineage's standards still made her older than empires. Reika Kurosawa's read explained her presence at the frozen underworld's threshold: the Crimson bloodline has always been drawn to things that refuse to die, and an ice demon sealed before recorded history is the most interesting specimen she's ever had access to. She wasn't serving Glacidra. She was studying her, using the chaos of the demon's emergence as cover for research the rest of her bloodline didn't yet know she was conducting.",
  },
  boss_023: {
    epithet: 'The Frost Demon',
    lore: "Something older than any written seal had been holding Glacidra beneath the ice - Zimara noted that whatever documentation once existed for her original sealing had either been lost or deliberately destroyed. Her frost is not weather or even cold in any conventional sense; Zimara's assessment was precise and alarming: it removes the possibility of heat from the fabric of space itself rather than merely lowering its temperature, corrupting the dimensional matter she touches permanently. Valentina Ardente found the only workable strategy against a being who changes the rules of physics simply by existing: don't fight the ice she generates. Fight her, the singular source all of it comes from, and let the corrupted zones re-stabilize on their own once that source is gone.",
  },

  // ── CHAPTER 24: THE ELDER CRIMSON ──────────────────────────────────────────
  'mini-boss_022': {
    epithet: 'The Fae Enchantress',
    lore: "Zimara's assessment cut through the Enchantress's pleasant smile immediately: her hexes aren't cast in the moment, they're ambient, layered into the Elder Crimson's domain for so many centuries that the air itself has become a passive weapon. Valentina Ardente understood the smile correctly - she knew the heroes couldn't approach conventionally, and let them see exactly enough of that certainty to make the fight feel lost before it started. It wasn't. Void disruption stripped the ambient saturation her enchantments needed to anchor to, proving even magic layered for millennia can be dismantled with the right kind of pressure.",
  },
  boss_024: {
    epithet: 'The Elder Crimson',
    lore: "Lady Lyssiel is the original source of the entire Crimson bloodline - everything Visalia became in the Cathedral of Chains, everything the youngest sister Lysse aspires to become, traces back to her. Kaori Adachi's realization was the most unsettling of the whole encounter: she had been watching the heroes since Chapter One, observing every battle and every Trump Card and every alliance without ever once intervening, because she had simply been finishing her assessment of whether they were worth her attention at all. Reika Kurosawa's answer to what that assessment concluded was the most dangerous compliment the heroes had ever received from an enemy - that they were, at last, worth fighting. Lady Lyssiel had watched every empire in Aetheria's history rise and fall from a domain older than any of them without ever once needing to move. She moved for this fight, and only this one.",
  },

  // ── CHAPTER 25: THE FIRST ENTITY ───────────────────────────────────────────
  'mini-boss_023': {
    epithet: 'Briar the Elder',
    lore: "Aisling Doyle recognized the resemblance immediately - this was the elder sister of the Nature Assassin the heroes had faced fifteen chapters earlier in Queen Nythera's garden, except serving the primordial dark rather than any single sovereign's domain for far, far longer. Reika Kurosawa understood her purpose precisely: she isn't an obstacle so much as a guardian of the boundary between the named world and the First Entity beyond it, testing through combat - the only language old enough for both sides of that threshold - whether the heroes were worthy of the conversation they were attempting to start. Zimara's insight shaped the whole fight: with Briar, the approach mattered as much as the outcome. Victory alone wasn't enough. Winning with discipline and genuine respect was what actually earned the right to pass.",
  },
  boss_025: {
    epithet: 'The Origin',
    lore: "Kaori Adachi named it the First Entity: Aetheria's original inhabitant, older than the gods the heroes had already fought, older than the void, older than the very concept of darkness. It didn't create the world - it was simply already present when the world arrived. Zimara's clarification mattered more than any battle strategy: it isn't malevolent, because malevolence was invented long after it already existed. What it has instead is magnitude - so much more than everything else that its mere existence exerts pressure on reality itself. The heroes couldn't destroy something that predates the concept of destruction, and couldn't reason with it in a language that postdates it by an immeasurable margin. Reika Kurosawa's answer was to communicate in something older than language: pure, undiluted existence at full intensity, every faction and every element at once, making the argument that a world this alive was worth leaving intact simply by refusing to stop living. And in its final moment - the detail that changed everything the heroes thought they understood about the scale of what they were fighting - the Origin didn't look at them at all. It looked upward, toward something even it had no name for. Something above everything it had ever known.",
  },

  // ── CHAPTER 26: VOID ETERNAL ───────────────────────────────────────────────
  'mini-boss_024': {
    epithet: 'The Chronomancer Eternal',
    lore: "Zimara's diagnosis was as vast as it was unsettling: he has lived through every possible version of this war, existing in countless overlapping timelines at once, and has already watched the heroes lose in most of them. Valentina Ardente's counter was the only strategy that could work against someone who has literally already seen every predictable outcome - become unpredictable, chaotic, pure instinct, giving him nothing stable across any timeline for his foresight to anchor to. He is the Void Eternal's warden precisely because he understands, better than any other guardian the heroes have faced, exactly how repetition can be turned into a weapon.",
  },
  boss_026: {
    epithet: 'The Living Absence',
    lore: "Reika Kurosawa's description was the most precise definition any enemy in the war had ever received: the Void Eternal is not a ruler, and it is not a destroyer. It is the silence that follows every ending - what remains, structurally, once a story is finished being told. Zimara's warning carried the true stakes: if it succeeds, even the heroes' hard-won victories would be unmade entirely, leaving no legend, no story, and no echo of the resistance that came before. It fed on the fragments of every defeated foe the heroes had ever faced, reforming their history as ammunition against them - the war's past turned into a weapon aimed at its own future. The heroes' answer wasn't strategy. It was refusal - proof that something could endure even the deliberate erasure of everything that came before it.",
  },

  // ── CHAPTER 27: CELESTIAL RECKONING ────────────────────────────────────────
  'mini-boss_025': {
    epithet: 'Seraph of the Scales',
    lore: "Golden scales vast enough to weigh entire stars materialize wherever this Seraph chooses to stand - Kaori Adachi's read on the imbalance was blunt: one side holds the order of the multiverse, the other holds the heroes alone. Reika Kurosawa's rebuttal defined the heroes' entire philosophy against cosmic judgment: they had never been balanced, only ever the disruption, and the only strategy against a being built to measure was to overload the scale until it could no longer measure them at all.",
  },
  boss_027: {
    epithet: 'The Grand Reckoning',
    lore: "Zimara's assessment removed any comfort from the confrontation: the Grand Reckoning doesn't hate the heroes. It simply perceives their continued survival as an error in a cosmic equation that governs realities far beyond Aetheria alone. It represents the original judges - beings who maintain balance across multiple universes, and who had, until now, judged the heroes' repeated defiance of fate to be a threat worth correcting directly. Valen's answer reframed the entire fight: if survival itself was the error, then the heroes would simply become the glitch the equation could never successfully calculate away.",
  },

  // ── CHAPTER 28: SERAPHIC JUDGMENT ──────────────────────────────────────────
  'mini-boss_026': {
    epithet: 'Ophaniel the Vigilant',
    lore: "It doesn't walk - Zimara described it rotating into being, a sphere of interlocking rings lined with unblinking eyes. She identified it as a watcher-class seraph, its entire purpose built around observation, resorting to violence only when observation alone fails to deter an intruder. Aisling Doyle's warning was specific: it had already seen every attack pattern the heroes possessed, predicting strikes before they landed. Reika Kurosawa's counter - pure improvisation, nothing for it to have already catalogued - was the one language a thousand watching eyes had genuinely never learned to read.",
  },
  boss_028: {
    epithet: 'The Last Seraph',
    lore: "Highest of the herald choir sent ahead to judge whether the heroes' continued defiance had earned the right to be noticed by whatever the choir was truly protecting. Zimara's assessment made the stakes clear: beyond this seraph, there is no more judgment left in the choir's hierarchy to pass - only whatever waits on the other side of its verdict. Kaori Adachi's read softened the confrontation without lessening it: it doesn't hate the heroes, and doesn't even fully register them as a threat. It simply needs to be certain, absolutely certain, before letting anything else beyond it notice they exist at all. And in the instant the Last Seraph fell, something ancient and unblinking, far above the light, finally opened its eyes toward the battlefield for the first time.",
  },

  // ── CHAPTER 29: THE SILENT VIGIL ───────────────────────────────────────────
  'mini-boss_027': {
    epithet: 'The Recording Eye',
    lore: "A single vast eye that formed where the earlier silent sentinels once stood, its pupil holding a perfect reflection of every battle the heroes had ever fought. Zimara's read on its purpose was unnerving in its detachment: it isn't attacking to win. It's attacking to see how the story ends before deciding whether that ending is even worth keeping in the record at all. Kaori Adachi recognized the deeper shift - a being sworn only to watch had chosen, for the first time, to act, which meant something in the pattern it had been tracking across the entire war had finally changed enough to warrant intervention.",
  },
  boss_029: {
    epithet: 'The Silent Watcher',
    lore: "Sworn since the birth of the very first reality to observe and never interfere - no matter what it witnessed, no matter how easily it could have helped - the Silent Watcher had maintained an unbroken vow for longer than Kaori Adachi could put a number to. Zimara understood exactly what its presence here meant: if it was finally choosing to act, the heroes weren't just another battle to it anymore. They were the exception it had decided was worth breaking a billion-year-old oath to intervene for. Its defeat wasn't the end of the mystery - it was confirmation that something, somewhere above even a being this ancient, had been worth warning about all along.",
  },

  // ── CHAPTER 30: BEYOND CREATION ────────────────────────────────────────────
  'mini-boss_028': {
    epithet: 'Echo of the One Above All',
    lore: "Not the source itself, but a fragment cast off from something that speaks and simply expects reality to obey - and Zimara's warning was the most important one of the entire final chapter: even this echo, a mere reflection of the true authority, was almost more than the heroes could withstand directly. Kaori Adachi's framing put twenty-nine chapters of escalation into a single sentence: they had already fought the first being in creation and the eye that watches all things. Whatever waited beyond this echo had authored them both.",
  },
  boss_030: {
    epithet: 'The One Above All',
    lore: "It had no form, no name, and no single moment of arrival, because Zimara understood it had never truly been absent - it simply was, and always had been, above everything the heroes had ever called reality. Kaori Adachi's final assessment placed the entire war in true perspective: the Origin the heroes fought in Chapter Twenty-Five was the first being inside creation. This is what stands outside it entirely - above the Origin, above the Silent Watcher who broke a billion-year vow just to warn them it existed. There is nothing higher than this in any reality the heroes could ever reach. It doesn't rule through malice and wouldn't end them out of cruelty; to something this far above every story ever told, the heroes were simply a chapter it hadn't yet decided the worth of. Valen's final answer, backed by every hero, every faction, and every Trump Card earned since the very first shattered barrier, wasn't a bid to replace what stood above all creation. It was proof - offered directly to the top of existence itself - that everything allowed to exist beneath it had been worth creating in the first place.",
  },
};

const tierFromImageKey = (imageKey) => {
  if (imageKey.startsWith('mini-boss_')) return 'mini-boss';
  if (imageKey.startsWith('boss_')) return 'boss';
  return 'mob';
};

export const getBestiaryEntry = (imageKey) => {
  const entry = BESTIARY[imageKey];
  if (!entry) return null;
  return { imageKey, tier: tierFromImageKey(imageKey), ...entry };
};

export { tierFromImageKey };

// ── Unlock derivation - no persisted "encountered" list needed. Both are pure
// functions of completedChapters (stage IDs) crossed against ENEMY_GROUPS. ──

// Every imageKey the player has met across all completed stages, story only.
export const getEncounteredImageKeys = (completedStageIds) => {
  const completed = new Set(completedStageIds || []);
  const keys = new Set();
  ENEMY_GROUPS.forEach((group) => {
    if (!completed.has(group.id)) return;
    group.enemies.forEach((e) => keys.add(e.imageKey));
  });
  return keys;
};

// imageKeys appearing in this stage that never appeared in any earlier stage
// (by STAGE_ORDER) - used to fire a "New Bestiary Entry" notification exactly
// once, the moment a stage clear introduces a creature for the first time.
export const getNewlyIntroducedImageKeys = (stageId) => {
  const idx = STAGE_ORDER.indexOf(stageId);
  if (idx < 0) return [];
  const group = ENEMY_GROUPS.find((g) => g.id === stageId);
  if (!group) return [];

  const seenBefore = new Set();
  for (let i = 0; i < idx; i++) {
    const earlierGroup = ENEMY_GROUPS.find((g) => g.id === STAGE_ORDER[i]);
    earlierGroup?.enemies.forEach((e) => seenBefore.add(e.imageKey));
  }
  const thisStageKeys = new Set(group.enemies.map((e) => e.imageKey));
  return [...thisStageKeys].filter((k) => !seenBefore.has(k));
};

// Every unique creature the story can ever introduce - name/tier/first chapter
// - independent of lore or unlock state. The Codex grid needs this even for
// still-locked entries (to know how many total exist, and which tier they are).
// Cached at module scope: ENEMY_GROUPS/STAGE_ORDER are static imports that never
// change at runtime, so recomputing this scan on every render would be wasted work.
let _catalogCache = null;
export const getEnemyCatalog = () => {
  if (_catalogCache) return _catalogCache;
  const catalog = [];
  const seen = new Set();
  STAGE_ORDER.forEach((stageId) => {
    const group = ENEMY_GROUPS.find((g) => g.id === stageId);
    if (!group) return;
    group.enemies.forEach((e) => {
      if (seen.has(e.imageKey)) return;
      seen.add(e.imageKey);
      catalog.push({
        imageKey: e.imageKey,
        name: e.name,
        tier: tierFromImageKey(e.imageKey),
        chapter: Math.floor(stageId / 100),
      });
    });
  });
  _catalogCache = catalog;
  return catalog;
};

// Combat stats (hp/atk/def/effect/skills) from this creature's first story
// appearance - for the Codex detail screen's "Combat Profile" section. Stats
// scale up on later reappearances, but the first encounter is what "chapter
// first appears" already refers to elsewhere in the Codex, so this stays
// consistent with that framing rather than showing a maxed-out later version.
export const getEnemyCombatSnapshot = (imageKey) => {
  for (const stageId of STAGE_ORDER) {
    const group = ENEMY_GROUPS.find((g) => g.id === stageId);
    const enemy = group?.enemies.find((e) => e.imageKey === imageKey);
    if (enemy) {
      return {
        hp: enemy.maxHp ?? enemy.hp,
        atk: enemy.atk,
        def: enemy.def,
        effect: enemy.effect || null,
        skills: enemy.skills || [],
      };
    }
  }
  return null;
};
