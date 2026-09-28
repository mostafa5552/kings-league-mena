// ============================================
// config.js - إعدادات Kings League MENA
// ============================================

export const FIELD = {
    length: 60,
    width: 32,
    lineThickness: 0.1,
    penaltyDepth: 13,
    penaltyWidth: 26,
    penaltySpot: 9,
    goalWidth: 5,
    goalHeight: 2.2,
    wallHeight: 2.5,
};

export const MATCH_RULES = {
    halfDuration: 20,
    totalDuration: 40,
    coloredBallMinute: 17,
    secondHalfStart: 20,
    fullReturnMinute: 23,
    matchBallMinute: 36,
    weaponsOpenFirstHalf: 5,
    weaponsCloseFirstHalf: 17,
    weaponsOpenSecondHalf: 23,
    weaponsCloseSecondHalf: 36,
};

export const TEAMS = {
    RA2: {
        id: 'RA2', name: 'RA2 FC', shortName: 'RA2',
        logo: 'https://i.supaimg.com/51fed601-7bff-487e-8197-3189211d9777/02730e1c-dc76-49b2-8e50-7b0d8df317fe.png',
        primary: { shirt: 0xFF6B00, shorts: 0xFF6B00, trim: 0x000000 },
        secondary: { shirt: 0x000000, shorts: 0x000000, trim: 0xFF6B00 }
    },
    DR7: {
        id: 'DR7', name: 'DR7 FC', shortName: 'DR7',
        logo: 'https://i.supaimg.com/51fed601-7bff-487e-8197-3189211d9777/41d177f0-ea9d-47ba-8b57-9c1cf09a324f.webp',
        primary: { shirt: 0x1E40AF, shorts: 0x1E40AF, trim: 0xFFFFFF },
        secondary: { shirt: 0xFFFFFF, shorts: 0x808080, trim: 0x1E40AF }
    },
    FWAZ: {
        id: 'FWAZ', name: 'FWAZ', shortName: 'FWZ',
        logo: 'https://i.supaimg.com/51fed601-7bff-487e-8197-3189211d9777/fbdf5123-ebff-44aa-a389-80342f2782eb.webp',
        primary: { shirt: 0x7C3AED, shorts: 0x7C3AED, trim: 0xFFFFFF },
        secondary: { shirt: 0xFFFFFF, shorts: 0x000000, trim: 0x7C3AED }
    },
    ABO: {
        id: 'ABO', name: 'ABO FC', shortName: 'ABO',
        logo: 'https://i.supaimg.com/51fed601-7bff-487e-8197-3189211d9777/76dca4b7-7981-4d50-a5f8-09d38cd135a2.webp',
        primary: { shirt: 0x1E3A8A, shorts: 0x0EA5E9, trim: 0xFFFFFF },
        secondary: { shirt: 0xFFFFFF, shorts: 0x1E3A8A, trim: 0x0EA5E9 }
    },
    B3S: {
        id: 'B3S', name: '3BS', shortName: '3BS',
        logo: 'https://i.supaimg.com/51fed601-7bff-487e-8197-3189211d9777/8cfa642f-6c16-41eb-914e-0e6550833c7f.webp',
        primary: { shirt: 0x065F46, shorts: 0x000000, trim: 0xFFFFFF },
        secondary: { shirt: 0xFFFFFF, shorts: 0xFFFFFF, trim: 0x065F46 }
    },
    TURBO: {
        id: 'TURBO', name: 'Turbo', shortName: 'TRB',
        logo: 'https://i.supaimg.com/51fed601-7bff-487e-8197-3189211d9777/44823516-1678-48ae-bcf6-f72a9511fae8.png',
        primary: { shirt: 0xEAB308, shorts: 0x000000, trim: 0xEAB308 },
        secondary: { shirt: 0x374151, shorts: 0x000000, trim: 0xEAB308 }
    },
    REDZONE: {
        id: 'REDZONE', name: 'Red Zone', shortName: 'RDZ',
        logo: 'https://i.supaimg.com/51fed601-7bff-487e-8197-3189211d9777/823721c2-d499-4698-b408-ffbf616a4d9a.png',
        primary: { shirt: 0xDC2626, shorts: 0xDC2626, trim: 0x000000 },
        secondary: { shirt: 0x000000, shorts: 0x000000, trim: 0xDC2626 }
    },
    BAKHIRA: {
        id: 'BAKHIRA', name: 'Bakhira F.C.', shortName: 'BKH',
        logo: 'https://i.supaimg.com/51fed601-7bff-487e-8197-3189211d9777/ab9cbd7c-734d-4b9b-a200-4db98ecf3c41.png',
        primary: { shirt: 0x14B8A6, shorts: 0xFFFFFF, trim: 0x14B8A6 },
        secondary: { shirt: 0xFFFFFF, shorts: 0xFFFFFF, trim: 0x14B8A6 }
    },
    ULTRA: {
        id: 'ULTRA', name: 'Ultra Chmicha', shortName: 'ULT',
        logo: 'https://i.supaimg.com/51fed601-7bff-487e-8197-3189211d9777/612a5ae4-e017-4903-b2fd-517ff5c72282.png',
        primary: { shirt: 0x000000, shorts: 0x000000, trim: 0xEAB308 },
        secondary: { shirt: 0xEAB308, shorts: 0x000000, trim: 0x000000 }
    },
    RISING: {
        id: 'RISING', name: 'Rising Peaks', shortName: 'RSG',
        logo: 'https://i.supaimg.com/51fed601-7bff-487e-8197-3189211d9777/d3bcff24-b372-449b-81a2-cb6793e601db.png',
        primary: { shirt: 0xEC4899, shorts: 0x000000, trim: 0xEC4899 },
        secondary: { shirt: 0xFFFFFF, shorts: 0xEC4899, trim: 0xEC4899 }
    }
};

export const TEAM_IDS = Object.keys(TEAMS);

export const WEAPONS = {
    PENALTY:        { id: 'PENALTY',        name: 'ركلة جزاء',      icon: '⚽', desc: 'ركلة جزاء مباشرة', rarity: 'common' },
    SHOOTOUT:       { id: 'SHOOTOUT',       name: 'شووت آوت',       icon: '🏃', desc: 'انفراد من المنتصف - 5 ثوانٍ', rarity: 'rare' },
    DOUBLE_GOAL:    { id: 'DOUBLE_GOAL',    name: 'الهدف المضاعف',  icon: '2️⃣', desc: 'كل هدف = هدفين - 4 دقائق', rarity: 'rare' },
    SUSPENSION:     { id: 'SUSPENSION',     name: 'الإيقاف الزمني', icon: '🚫', desc: 'طرد لاعب من الخصم - 4 دقائق', rarity: 'epic' },
    STAR_PLAYER:    { id: 'STAR_PLAYER',    name: 'اللاعب النجم',   icon: '⭐', desc: 'أهدافه = هدفين', rarity: 'epic' },
    REVERSE_PENALTY:{ id: 'REVERSE_PENALTY',name: 'العقوبة العكسية',icon: '🔄', desc: 'لاعب الخصم يسدد ضد فريقه', rarity: 'legendary' },
    JOKER:          { id: 'JOKER',          name: 'الجوكر',         icon: '🃏', desc: 'استخدم أي بطاقة أو اسرق بطاقة الخصم', rarity: 'legendary' }
};

export const RARITY_COLORS = {
    common: 0x888888, rare: 0x3B82F6, epic: 0xA855F7, legendary: 0xFFD700
};

export function canPlayAgainst(teamA, teamB) {
    const a = TEAMS[teamA].primary;
    const b = TEAMS[teamB].primary;
    const dist = Math.sqrt(
        Math.pow(((a.shirt >> 16) & 0xFF) - ((b.shirt >> 16) & 0xFF), 2) +
        Math.pow(((a.shirt >> 8) & 0xFF) - ((b.shirt >> 8) & 0xFF), 2) +
        Math.pow((a.shirt & 0xFF) - (b.shirt & 0xFF), 2)
    );
    return dist > 100;
}

export const PLAYER_CONFIG = {
    height: 1.7,
    bodyRadius: 0.25,
    headRadius: 0.18,
    legHeight: 0.6,
    runSpeed: 8,
    sprintSpeed: 12,
    accel: 20,
    friction: 8,
    kickPower: 22,
    passPower: 15,
    shootPower: 28,
};

export const BALL_CONFIG = {
    radius: 0.11,
    mass: 0.43,
    friction: 0.4,
    restitution: 0.55,
    airDrag: 0.02,
    maxSpeed: 35,
};

export const PHYSICS = {
    gravity: -9.8 * 2,
    timeStep: 1/120,
};

// ============================================
// Rosters - 10 فرق
// ============================================
export const TEAM_ROSTERS = {
    TURBO: { roster: [
        { number: 1,  name: 'Ahmed Awad', position: 'GK' },
        { number: 12, name: 'Eslam Ahmed', position: 'GK' },
        { number: 2,  name: 'Eslam Mohamed', position: 'DEF' },
        { number: 3,  name: 'Islam Arafa', position: 'DEF' },
        { number: 4,  name: 'Zeiad Abdo', position: 'DEF' },
        { number: 5,  name: 'Ahmed Abdalla', position: 'MID' },
        { number: 6,  name: 'Amr Abdelrahman', position: 'MID' },
        { number: 7,  name: 'Hussien Mostafa', position: 'MID' },
        { number: 8,  name: 'Islam Moursy', position: 'MID' },
        { number: 9,  name: 'Moaaz Hemida', position: 'MID' },
        { number: 10, name: 'Omar Mohamed', position: 'MID' },
        { number: 11, name: 'Youssef Elnabarawy', position: 'MID' },
        { number: 13, name: 'Abd Elgleel', position: 'FW' },
        { number: 14, name: 'Shehab Mostafa', position: 'FW' },
        { number: 15, name: 'Abdelrahman Issa', position: 'FW' },
    ]},
    ULTRA: { roster: [
        { number: 12, name: 'Hamza Benadraa', position: 'GK' },
        { number: 1,  name: 'Marc Briones', position: 'GK' },
        { number: 18, name: 'Abdenacer Afi', position: 'DEF' },
        { number: 8,  name: 'Alex "Capi" Domingo', position: 'DEF' },
        { number: 13, name: 'Sagar Escoto', position: 'DEF' },
        { number: 23, name: 'Dani Liñares', position: 'MID' },
        { number: 19, name: 'Soufiane El Jadi', position: 'MID' },
        { number: 20, name: 'Ali Acha', position: 'FW' },
        { number: 7,  name: 'Marc Granero', position: 'FW' },
        { number: 9,  name: 'Masi Dabo', position: 'FW' },
        { number: 10, name: 'Walid Jaadi', position: 'FW' },
        { number: 99, name: 'Youssef Chakiri', position: 'FW' },
    ]},
    B3S: { roster: [
        { number: 99, name: 'JMK', position: 'GK' },
        { number: 1,  name: 'Mohammad Kanbar', position: 'GK' },
        { number: 24, name: 'Abde Bakkali', position: 'DEF' },
        { number: 7,  name: 'Amir Aljawabrah', position: 'DEF' },
        { number: 19, name: 'Jarrah Alnaser', position: 'DEF' },
        { number: 4,  name: 'Sahir Boumhand', position: 'DEF' },
        { number: 27, name: 'Amine Kheche', position: 'MID' },
        { number: 25, name: 'Giannelli Imbula', position: 'MID' },
        { number: 14, name: 'Mostafa Muhamed', position: 'MID' },
        { number: 11, name: 'Bader Alnaimat', position: 'FW' },
        { number: 8,  name: 'Carlos Omabegho', position: 'FW' },
        { number: 10, name: 'Khaled Abbas', position: 'FW' },
        { number: 9,  name: 'Moussa Sao', position: 'FW' },
    ]},
    ABO: { roster: [
        { number: 1,  name: 'Manel Jiménez', position: 'GK' },
        { number: 22, name: 'Moayad Alkarnib', position: 'GK' },
        { number: 4,  name: 'Faisal Gul Ahmad', position: 'DEF' },
        { number: 17, name: 'Johnatan Baton', position: 'DEF' },
        { number: 5,  name: 'Obada Barud', position: 'DEF' },
        { number: 91, name: 'Abdulrazaq Alshanqiti', position: 'MID' },
        { number: 20, name: 'Fahad Aljohani', position: 'MID' },
        { number: 89, name: 'Habib Abu Bakar', position: 'MID' },
        { number: 14, name: 'Malek Althaqafi', position: 'MID' },
        { number: 9,  name: 'Abdulraheem S.A. Jashan', position: 'FW' },
        { number: 7,  name: 'Bilal Fadili', position: 'FW' },
        { number: 19, name: 'Galde Hugue', position: 'FW' },
    ]},
    DR7: { roster: [
        { number: 40, name: 'Davi "Major" Natã', position: 'GK' },
        { number: 43, name: 'Saleh Alhawsawi', position: 'GK' },
        { number: 5,  name: 'Abdul Ilah Hussein', position: 'DEF' },
        { number: 12, name: 'Alwaleed Alsalhi', position: 'DEF' },
        { number: 47, name: 'Denilson Lobón', position: 'DEF' },
        { number: 4,  name: 'Nawaf Arwan', position: 'DEF' },
        { number: 6,  name: 'Saleh Alqarni', position: 'DEF' },
        { number: 18, name: 'Moath Alasiri', position: 'MID' },
        { number: 19, name: 'Abdullah Alaqeeli', position: 'FW' },
        { number: 11, name: 'Faris Almaleh', position: 'FW' },
        { number: 7,  name: 'Igo Canindé', position: 'FW' },
        { number: 24, name: 'Jhon Palacios', position: 'FW' },
        { number: 9,  name: 'Sultan Azaz', position: 'FW' },
    ]},
    FWAZ: { roster: [
        { number: 99, name: 'Igor Campos', position: 'GK' },
        { number: 24, name: 'Marouane Mzirira', position: 'GK' },
        { number: 17, name: 'David Loaiza', position: 'DEF' },
        { number: 5,  name: 'Everton "Chiclete" Araújo', position: 'DEF' },
        { number: 6,  name: 'Mohamed Bencherif', position: 'DEF' },
        { number: 7,  name: 'Abdulaziz Al Dabl', position: 'MID' },
        { number: 80, name: 'Fouad El Amrani', position: 'MID' },
        { number: 10, name: 'Gerard Verge', position: 'MID' },
        { number: 26, name: 'Lucas "Pulguinha"', position: 'MID' },
        { number: 8,  name: 'Sohaib Rektout', position: 'MID' },
        { number: 88, name: 'Cristian Hernández', position: 'FW' },
        { number: 11, name: 'Maicol Hernández', position: 'FW' },
        { number: 29, name: 'Muhannad Ali', position: 'FW' },
    ]},
    RA2: { roster: [
        { number: 22, name: 'Albaraa Aldosari', position: 'GK' },
        { number: 1,  name: 'Eloy Amoedo', position: 'GK' },
        { number: 87, name: 'Hussam Tah', position: 'DEF' },
        { number: 21, name: 'Sergio Juste', position: 'DEF' },
        { number: 88, name: 'Abulaziz Maiga', position: 'MID' },
        { number: 10, name: 'David Reyes', position: 'MID' },
        { number: 13, name: 'Mansour Alzahrani', position: 'MID' },
        { number: 8,  name: 'Mark Sorroche', position: 'MID' },
        { number: 11, name: 'Ossama Said Aly Essa', position: 'MID' },
        { number: 6,  name: 'Théo Chendri', position: 'MID' },
        { number: 7,  name: 'Diego Jiménez', position: 'FW' },
        { number: 77, name: 'Nawaf Saleh', position: 'FW' },
    ]},
    BAKHIRA: { roster: [
        { number: 59, name: 'Bilal Hmidouch', position: 'GK' },
        { number: 1,  name: 'Mame Cheikh', position: 'GK' },
        { number: 5,  name: 'Ben Hssayen', position: 'DEF' },
        { number: 45, name: 'Herbert Paul', position: 'DEF' },
        { number: 13, name: 'Maicon Silva', position: 'DEF' },
        { number: 6,  name: 'Mehdi Gacem', position: 'DEF' },
        { number: 39, name: 'Memos Sözer', position: 'DEF' },
        { number: 26, name: 'Walid Soudi', position: 'DEF' },
        { number: 10, name: 'Amar Cekic', position: 'FW' },
        { number: 8,  name: 'Karim Tarfi', position: 'FW' },
        { number: 11, name: 'Luiz "Pepinho" Souza', position: 'FW' },
        { number: 90, name: 'Yacine Boucharoud', position: 'FW' },
    ]},
    REDZONE: { roster: [
        { number: 59, name: 'Abdallah Almbaidin', position: 'GK' },
        { number: 1,  name: 'Camilo Gaviria', position: 'GK' },
        { number: 5,  name: 'Daniel Pérez', position: 'DEF' },
        { number: 23, name: 'Mahmoud Mishael', position: 'DEF' },
        { number: 6,  name: 'Mohamed Amin', position: 'DEF' },
        { number: 4,  name: 'Ahmad Mohammad', position: 'MID' },
        { number: 10, name: 'Jero Martín', position: 'MID' },
        { number: 20, name: 'Khalid Dardas', position: 'MID' },
        { number: 27, name: 'Mahmoud Badran', position: 'MID' },
        { number: 8,  name: 'Mohamed Abdelfattah', position: 'MID' },
        { number: 7,  name: 'Christian Ronchi', position: 'FW' },
        { number: 11, name: 'Gilles Vidal', position: 'FW' },
        { number: 30, name: 'Julen Álvarez', position: 'FW' },
        { number: 9,  name: 'Samer Ahmad', position: 'FW' },
    ]},
    RISING: { roster: [
        { number: 1,  name: 'Player 1', position: 'GK' },
        { number: 12, name: 'Player 12', position: 'GK' },
        { number: 2,  name: 'Player 2', position: 'DEF' },
        { number: 3,  name: 'Player 3', position: 'DEF' },
        { number: 4,  name: 'Player 4', position: 'MID' },
        { number: 5,  name: 'Player 5', position: 'MID' },
        { number: 6,  name: 'Player 6', position: 'MID' },
        { number: 7,  name: 'Player 7', position: 'MID' },
        { number: 8,  name: 'Player 8', position: 'FW' },
        { number: 9,  name: 'Player 9', position: 'FW' },
        { number: 10, name: 'Player 10', position: 'FW' },
    ]},
};

// ============================================
// Stats Templates
// ============================================
export const PLAYER_STATS_TEMPLATES = {
    GK:  { speed: 6, strength: 8, accuracy: 7, skill: 5, defense: 9, reflexes: 9 },
    DEF: { speed: 7, strength: 9, accuracy: 6, skill: 5, defense: 9, reflexes: 0 },
    MID: { speed: 8, strength: 7, accuracy: 8, skill: 8, defense: 7, reflexes: 0 },
    FW:  { speed: 9, strength: 7, accuracy: 9, skill: 9, defense: 5, reflexes: 0 }
};

export function generatePlayerStats(role, number) {
    const base = PLAYER_STATS_TEMPLATES[role] || PLAYER_STATS_TEMPLATES.MID;
    const seed = (number * 13 + 7) % 3;
    const variation = (seed - 1) * 0.5;
    return {
        speed: Math.max(1, Math.min(10, base.speed + variation)),
        strength: Math.max(1, Math.min(10, base.strength + variation)),
        accuracy: Math.max(1, Math.min(10, base.accuracy + variation)),
        skill: Math.max(1, Math.min(10, base.skill + variation)),
        defense: Math.max(1, Math.min(10, base.defense + variation)),
        reflexes: base.reflexes,
    };
}

export function getTeamRoster(teamId) {
    return TEAM_ROSTERS[teamId]?.roster || [];
}

export function selectStartingSeven(teamId) {
    const roster = getTeamRoster(teamId);
    if (roster.length === 0) return [];

    const goalkeepers = roster.filter(p => p.position === 'GK');
    const defenders = roster.filter(p => p.position === 'DEF');
    const midfielders = roster.filter(p => p.position === 'MID');
    const forwards = roster.filter(p => p.position === 'FW');

    const starting = [
        goalkeepers[0],
        defenders[0],
        defenders[1] || defenders[0],
        midfielders[0],
        midfielders[1] || midfielders[0],
        forwards[0],
        forwards[1] || forwards[0],
    ].filter(p => p);

    while (starting.length < 7) {
        const remaining = roster.filter(p => !starting.includes(p));
        if (remaining.length === 0) break;
        starting.push(remaining[0]);
    }

    return starting.slice(0, 7);
}