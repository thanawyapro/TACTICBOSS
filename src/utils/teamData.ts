import { TacticalBoardState, TacticalPlayer } from '../types';
import { SupportedLang } from './lang';

export interface PopularTeam {
  id: string;
  name: string;
  league?: string;
  defaultFormation: string;
  style: string;
  strength: string;
  weakness: string;
  color: string;
  players: Array<{ name: string; role: string; x: number; y: number }>;
  recommendedUserStyle: string;
  recommendedOpponentStyle: string;
  labels?: { style: Record<SupportedLang, string>; strength: Record<SupportedLang, string>; weakness: Record<SupportedLang, string> };
}

type F = '4-3-3' | '4-2-3-1' | '3-5-2' | '3-2-4-1' | '4-4-2';
const POS: Record<F, Array<[number, number, string]>> = {
  '4-3-3': [[50,88,'GK'],[85,68,'Attacking Fullback'],[62,74,'CB'],[38,74,'Ball Playing Defender'],[15,68,'Defensive Fullback'],[50,55,'Anchor Man'],[66,44,'Box to Box'],[34,44,'Advanced Playmaker'],[85,23,'Winger'],[50,15,'Poacher'],[15,23,'Inside Forward']],
  '4-2-3-1': [[50,88,'GK'],[85,68,'Attacking Fullback'],[62,74,'CB'],[38,74,'Ball Playing Defender'],[15,68,'Defensive Fullback'],[62,56,'Box to Box'],[38,56,'Anchor Man'],[85,32,'Winger'],[50,31,'Advanced Playmaker'],[15,32,'Inside Forward'],[50,15,'Complete Forward']],
  '3-5-2': [[50,88,'GK'],[70,75,'CB'],[50,77,'CB'],[30,75,'Ball Playing Defender'],[88,48,'Wingback'],[65,45,'Box to Box'],[50,55,'Deep Lying Playmaker'],[35,45,'Advanced Playmaker'],[12,48,'Wingback'],[62,17,'Complete Forward'],[38,17,'Poacher']],
  '3-2-4-1': [[50,88,'GK'],[68,74,'CB'],[50,76,'Ball Playing Defender'],[32,74,'CB'],[60,58,'Deep Lying Playmaker'],[40,58,'Anchor Man'],[86,34,'Wide Midfielder'],[62,32,'Inside Forward'],[38,32,'Advanced Playmaker'],[14,34,'Winger'],[50,15,'Target Man']],
  '4-4-2': [[50,88,'GK'],[85,68,'Attacking Fullback'],[62,74,'CB'],[38,74,'CB'],[15,68,'Defensive Fullback'],[85,44,'Wide Midfielder'],[62,52,'Box to Box'],[38,52,'Anchor Man'],[15,44,'Winger'],[62,17,'Poacher'],[38,17,'Complete Forward']]
};
const arEnEsFr = (ar: string, en: string, es: string, fr: string) => ({ ar, en, es, fr });
const labels = {
  possession: { style: arEnEsFr('استحواذ وتمركز','Possession and positional play','Posesión y juego posicional','Possession et jeu de position'), strength: arEnEsFr('تحكم في الوسط وزوايا تمرير متعددة','Midfield control and multiple passing angles','Control del centro y varias líneas de pase','Contrôle du milieu et plusieurs angles de passe'), weakness: arEnEsFr('مساحات خلف الخط المتقدم','Space behind the high line','Espacios detrás de la línea alta','Espaces derrière la ligne haute') },
  quick: { style: arEnEsFr('تحولات سريعة وهجوم مباشر','Quick transitions and direct attack','Transiciones rápidas y ataque directo','Transitions rapides et attaque directe'), strength: arEnEsFr('سرعة هجومية وإنهاء الفرص','Attacking pace and finishing','Velocidad ofensiva y definición','Vitesse offensive et finition'), weakness: arEnEsFr('مساحة بعد فقد الكرة','Space after losing possession','Espacio tras perder el balón','Espace après la perte du ballon') },
  press: { style: arEnEsFr('ضغط عالٍ منظم','Organized high press','Presión alta organizada','Pressing haut organisé'), strength: arEnEsFr('افتكاك مبكر وتحولات قصيرة','Early recoveries and short transitions','Recuperaciones tempranas y transiciones cortas','Récupérations hautes et transitions courtes'), weakness: arEnEsFr('خطورة عند كسر الضغط','Vulnerable when the press is beaten','Vulnerable al superar la presión','Vulnérable si le pressing est battu') },
  direct: { style: arEnEsFr('لعب مباشر ومتوازن','Balanced direct play','Juego directo equilibrado','Jeu direct équilibré'), strength: arEnEsFr('وضوح الأدوار والوصول السريع للمرمى','Clear roles and fast progression','Roles claros y progresión rápida','Rôles clairs et progression rapide'), weakness: arEnEsFr('قلة السيطرة إذا ابتعدت الخطوط','Less control when lines separate','Menos control si se separan las líneas','Moins de contrôle si les lignes se séparent') },
  wingbacks: { style: arEnEsFr('كتلة متقاربة وأظهرة جناح','Compact block with wingbacks','Bloque compacto con carrileros','Bloc compact avec pistons'), strength: arEnEsFr('أمان العمق وعرض الملعب','Central security and width','Seguridad central y amplitud','Sécurité axiale et largeur'), weakness: arEnEsFr('المساحة خلف الأظهرة الجناح','Space behind wingbacks','Espacio detrás de los carrileros','Espace derrière les pistons') }
};

function team(id: string, name: string, formation: F, profile: keyof typeof labels, color: string, names: string[], league = 'Featured'): PopularTeam {
  const shape = POS[formation];
  const styles: Record<keyof typeof labels, { user: string; opponent: string }> = {
    possession: { user: 'استحواذ', opponent: 'استحواذ' },
    quick: { user: 'مرتدات', opponent: 'سرعة من الأطراف' },
    press: { user: 'ضغط عالي', opponent: 'ضغط عالي' },
    direct: { user: 'متوازن', opponent: 'كرات طويلة' },
    wingbacks: { user: 'دفاعي', opponent: 'دفاع متأخر' }
  };
  return {
    id, name, league, defaultFormation: formation,
    style: labels[profile].style.ar,
    strength: labels[profile].strength.ar,
    weakness: labels[profile].weakness.ar,
    color,
    recommendedUserStyle: styles[profile].user,
    recommendedOpponentStyle: styles[profile].opponent,
    labels: labels[profile],
    players: shape.map(([x, y, role], i) => ({ name: names[i] || role, role, x, y }))
  };
}

const CURRENT: Record<string, PopularTeam> = {
  real: team('real-madrid', 'Real Madrid', '4-3-3', 'quick', '#f8fafc', ['Courtois','Carvajal','Rüdiger','Militão','Mendy','Tchouaméni','Valverde','Bellingham','Rodrygo','Mbappé','Vinícius Jr.'], 'LaLiga'),
  barca: team('barcelona', 'FC Barcelona', '4-3-3', 'possession', '#a50044', ['Ter Stegen','Koundé','Araújo','Cubarsí','Balde','De Jong','Gavi','Pedri','Lamine Yamal','Lewandowski','Raphinha'], 'LaLiga'),
  atletico: team('atletico-madrid', 'Atlético Madrid', '3-5-2', 'wingbacks', '#c8102e', ['Oblak','Witsel','Giménez','Hermoso','Molina','De Paul','Koke','Llorente','Lino','Griezmann','Morata'], 'LaLiga'),
  psg: team('psg', 'Paris SG', '4-3-3', 'press', '#004170', ['Donnarumma','Hakimi','Marquinhos','Beraldo','Nuno Mendes','Vitinha','João Neves','Fabián Ruiz','Dembélé','Ramos','Kvaratskhelia'], 'Ligue 1'),
  city: team('man-city', 'Manchester City', '3-2-4-1', 'possession', '#6cabdd', ['Ederson','Walker','Rúben Dias','Gvardiol','Kovacic','Rodri','Bernardo Silva','Foden','De Bruyne','Doku','Haaland'], 'Premier League'),
  liverpool: team('liverpool', 'Liverpool', '4-3-3', 'press', '#c8102e', ['Alisson','Alexander-Arnold','Konaté','Van Dijk','Robertson','Mac Allister','Szoboszlai','Jones','Salah','Núñez','Luis Díaz'], 'Premier League'),
  arsenal: team('arsenal', 'Arsenal', '4-3-3', 'possession', '#ef0107', ['Raya','White','Saliba','Gabriel','Timber','Rice','Ødegaard','Havertz','Saka','Jesus','Martinelli'], 'Premier League'),
  chelsea: team('chelsea', 'Chelsea', '4-2-3-1', 'quick', '#034694', ['Sánchez','James','Disasi','Colwill','Cucurella','Caicedo','Enzo Fernández','Palmer','Nkunku','Mudryk','Jackson'], 'Premier League'),
  united: team('man-united', 'Manchester United', '4-2-3-1', 'direct', '#da291c', ['Onana','Dalot','Martínez','Maguire','Shaw','Mainoo','Casemiro','Amad','Bruno Fernandes','Garnacho','Højlund'], 'Premier League'),
  spurs: team('tottenham', 'Tottenham Hotspur', '4-3-3', 'press', '#ffffff', ['Vicario','Porro','Romero','Van de Ven','Udogie','Bissouma','Maddison','Sarr','Kulusevski','Richarlison','Son'], 'Premier League'),
  newcastle: team('newcastle', 'Newcastle United', '4-3-3', 'press', '#241f20', ['Pope','Trippier','Schar','Botman','Burn','Guimarães','Joelinton','Longstaff','Almirón','Isak','Gordon'], 'Premier League'),
  bayern: team('bayern', 'FC Bayern München', '4-2-3-1', 'press', '#dc052d', ['Neuer','Kimmich','Upamecano','Kim','Davies','Goretzka','Pavlović','Olise','Musiala','Sané','Kane'], 'Bundesliga'),
  dortmund: team('dortmund', 'Borussia Dortmund', '4-2-3-1', 'quick', '#facc15', ['Kobel','Ryerson','Süle','Schlotterbeck','Maatsen','Sabitzer','Can','Malen','Brandt','Adeyemi','Füllkrug'], 'Bundesliga'),
  leverkusen: team('leverkusen', 'Bayer Leverkusen', '3-5-2', 'possession', '#111111', ['Hrádecký','Tah','Tapsoba','Hincapié','Frimpong','Xhaka','Palacios','Wirtz','Grimaldo','Boniface','Schick'], 'Bundesliga'),
  rb: team('rb-leipzig', 'RB Leipzig', '4-2-3-1', 'quick', '#d50032', ['Gulácsi','Henrichs','Orbán','Simakan','Raum','Schlager','Haidara','Olmo','Xavi Simons','Openda','Sesko'], 'Bundesliga'),
  inter: team('inter', 'Inter', '3-5-2', 'wingbacks', '#0068a8', ['Sommer','Pavard','Acerbi','Bastoni','Dumfries','Barella','Çalhanoğlu','Mkhitaryan','Dimarco','Thuram','Lautaro'], 'Serie A'),
  milan: team('ac-milan', 'AC Milan', '4-2-3-1', 'quick', '#c8102e', ['Maignan','Calabria','Tomori','Thiaw','Theo Hernández','Reijnders','Bennacer','Pulisic','Loftus-Cheek','Leão','Morata'], 'Serie A'),
  napoli: team('napoli', 'Napoli', '4-3-3', 'quick', '#1a5fb4', ['Meret','Di Lorenzo','Rrahmani','Juan Jesus','Olivera','Lobotka','Anguissa','Zieliński','Politano','Osimhen','Kvaratskhelia'], 'Serie A'),
  juventus: team('juventus', 'Juventus', '4-3-3', 'direct', '#f8fafc', ['Perin','Danilo','Bremer','Gatti','Cambiaso','Locatelli','McKennie','Rabiot','Chiesa','Vlahović','Yıldız'], 'Serie A'),
  roma: team('roma', 'Roma', '4-3-3', 'direct', '#8e1111', ['Svilar','Karsdorp','Mancini',"N'Dicka",'Spinazzola','Paredes','Pellegrini','Cristante','Dybala','Lukaku','El Shaarawy'], 'Serie A'),
  benfica: team('benfica', 'Benfica', '4-2-3-1', 'possession', '#e10600', ['Trubin','Bah','Otamendi','António Silva','Aursnes','João Neves','Florentino','Di María','Rafa Silva','Neres','Arthur Cabral'], 'Portugal'),
  porto: team('porto', 'FC Porto', '4-4-2', 'direct', '#00428c', ['Diogo Costa','João Mário','Pepe','Carmo','Wendell','Pepê','Varela','Eustáquio','Galeno','Evanilson','Taremi'], 'Portugal'),
  ajax: team('ajax', 'Ajax', '4-3-3', 'possession', '#d2122e', ['Gorter','Rensch','Sutalo','Hato','Wijndal','Tahirović','Taylor','Berghuis','Bergwijn','Brobbey','Akpom'], 'Netherlands'),
  psv: team('psv', 'PSV Eindhoven', '4-3-3', 'press', '#e4002b', ['Benítez','Teze','Ramalho','Boscagli','Dest','Veerman','Schouten','Til','Bakayoko','De Jong','Lozano'], 'Netherlands'),
  galatasaray: team('galatasaray', 'Galatasaray', '4-2-3-1', 'direct', '#a01d21', ['Muslera','Boey','Nelsson','Abdülkerim','Angeliño','Torreira','Demirbay','Ziyech','Mertens','Kerem','Icardi'], 'Turkey'),
  fenerbahce: team('fenerbahce', 'Fenerbahçe', '4-2-3-1', 'quick', '#001f5b', ['Livaković','Osayi-Samuel','Djiku','Becão','Ferdi','Fred','İsmail Yüksek','Tadić','Szymanski','Saint-Maximin','Džeko'], 'Turkey'),
  flamengo: team('flamengo', 'CR Flamengo', '4-2-3-1', 'quick', '#c8102e', ['Rossi','Varela','Léo Pereira','Fabrício Bruno','Ayrton Lucas','Pulgar','De La Cruz','Luiz Araújo','Arrascaeta','Everton Cebolinha','Pedro'], 'Brazil'),
  palmeiras: team('palmeiras', 'SE Palmeiras', '4-3-3', 'direct', '#006437', ['Weverton','Mayke','Gómez','Murilo','Piquerez','Zé Rafael','Richard Ríos','Veiga','Dudu','Rony','Endrick'], 'Brazil'),
  boca: team('boca-juniors', 'Boca Juniors', '4-4-2', 'direct', '#0033a0', ['Romero','Advíncula','Figal','Rojo','Blanco','Medina','Pol Fernández','Equi Fernández','Zenón','Cavani','Merentiel'], 'Argentina'),
  river: team('river-plate', 'River Plate', '4-2-3-1', 'possession', '#ffffff', ['Armani','Herrera','Díaz','González Pírez','Enzo Díaz','Aliendro','Fonseca','Barco','Nacho Fernández','Solari','Borja'], 'Argentina'),
  alhilal: team('al-hilal', 'Al Hilal', '4-3-3', 'quick', '#0054a6', ['Bono','Cancelo','Koulibaly','Al-Bulaihi','Lodi','Rúben Neves','Milinković-Savić','Malcom','Salem Al-Dawsari','Mitrović','Neymar'], 'Saudi Pro League')
};

const LEGACY: Record<string, PopularTeam> = {
  real19: team('real-madrid-19', 'Real Madrid', '4-3-3', 'direct', '#f8fafc', ['Keylor Navas','Carvajal','Varane','Sergio Ramos','Marcelo','Casemiro','Modrić','Kroos','Bale','Benzema','Isco'], 'LaLiga'),
  barca19: team('barcelona-19', 'FC Barcelona', '4-3-3', 'possession', '#a50044', ['Ter Stegen','Sergi Roberto','Piqué','Umtiti','Jordi Alba','Busquets','Rakitić','Coutinho','Messi','Suárez','Dembélé'], 'LaLiga'),
  juve19: team('juventus-19', 'Juventus', '4-3-3', 'direct', '#f8fafc', ['Szczęsny','Cancelo','Bonucci','Chiellini','Alex Sandro','Pjanić','Matuidi','Dybala','Douglas Costa','Cristiano Ronaldo','Mandžukić'], 'Serie A'),
  psg19: team('psg-19', 'Paris SG', '4-3-3', 'quick', '#004170', ['Buffon','Meunier','Marquinhos','Thiago Silva','Bernat','Verratti','Rabiot','Di María','Mbappé','Cavani','Neymar'], 'Ligue 1'),
  city19: team('city-19', 'Manchester City', '4-3-3', 'possession', '#6cabdd', ['Ederson','Walker','Stones','Laporte','Mendy','Fernandinho','De Bruyne','David Silva','Sterling','Agüero','Sané'], 'Premier League'),
  liverpool20: team('liverpool-20', 'Liverpool', '4-3-3', 'press', '#c8102e', ['Alisson','Alexander-Arnold','Gomez','Van Dijk','Robertson','Fabinho','Henderson','Wijnaldum','Salah','Firmino','Mané'], 'Premier League'),
  bayern21: team('bayern-21', 'FC Bayern München', '4-2-3-1', 'press', '#dc052d', ['Neuer','Pavard','Boateng','Alaba','Davies','Goretzka','Kimmich','Gnabry','Müller','Sané','Lewandowski'], 'Bundesliga'),
  psg22: team('psg-22', 'Paris SG', '4-3-3', 'quick', '#004170', ['Donnarumma','Hakimi','Marquinhos','Kimpembe','Nuno Mendes','Verratti','Wijnaldum','Di María','Messi','Mbappé','Neymar'], 'Ligue 1'),
  city23: team('city-23', 'Manchester City', '4-3-3', 'possession', '#6cabdd', ['Ederson','Walker','Rúben Dias','Laporte','Cancelo','Rodri','De Bruyne','Gündoğan','Mahrez','Haaland','Foden'], 'Premier League'),
  pesBarca21: team('barcelona-pes21', 'FC Barcelona', '4-3-3', 'possession', '#a50044', ['Ter Stegen','Sergi Roberto','Piqué','Lenglet','Jordi Alba','Busquets','De Jong','Coutinho','Messi','Griezmann','Dembélé'], 'LaLiga'),
  pesUnited21: team('united-pes21', 'Manchester United', '4-2-3-1', 'quick', '#da291c', ['De Gea','Wan-Bissaka','Lindelöf','Maguire','Shaw','Pogba','Matić','Greenwood','Bruno Fernandes','Rashford','Martial'], 'Premier League'),
  pesArsenal19: team('arsenal-pes19', 'Arsenal', '4-2-3-1', 'direct', '#ef0107', ['Leno','Bellerín','Sokratis','Koscielny','Monreal','Torreira','Xhaka','Mkhitaryan','Özil','Iwobi','Aubameyang'], 'Premier League'),
  pesMilan19: team('milan-pes19', 'AC Milan', '4-3-3', 'direct', '#c8102e', ['Donnarumma','Calabria','Musacchio','Romagnoli','Rodríguez','Biglia','Kessié','Bonaventura','Suso','Higuaín','Çalhanoğlu'], 'Serie A'),
  pesInter19: team('inter-pes19', 'Inter', '4-2-3-1', 'direct', '#0068a8', ['Handanović','Vrsaljko','Škriniar','Miranda','Asamoah','Brozović','Vecino','Politano','Nainggolan','Perišić','Icardi'], 'Serie A')
};

const ids = (...keys: string[]) => keys.map((k) => CURRENT[k] || LEGACY[k]).filter(Boolean) as PopularTeam[];

const FULL_30 = ids(
  'real','barca','atletico','city','liverpool','arsenal','chelsea','united','spurs','newcastle',
  'psg','bayern','dortmund','leverkusen','rb','inter','milan','napoli','juventus','roma',
  'benfica','porto','ajax','psv','galatasaray','fenerbahce','flamengo','palmeiras','boca','river'
);

const GAME_TEAMS: Record<string, PopularTeam[]> = {
  'ea-fc-26': FULL_30,
  'ea-fc-25': FULL_30,
  'ea-fc-24': FULL_30,
  'fifa-23': [LEGACY.city23, CURRENT.psg, CURRENT.real, CURRENT.liverpool, CURRENT.bayern, CURRENT.barca, CURRENT.inter, CURRENT.milan, CURRENT.napoli, CURRENT.juventus, CURRENT.arsenal, CURRENT.city],
  'fifa-22': [LEGACY.psg22, CURRENT.city, CURRENT.bayern, CURRENT.liverpool, CURRENT.real, CURRENT.barca, CURRENT.inter, CURRENT.milan, CURRENT.napoli, CURRENT.juventus, CURRENT.arsenal, CURRENT.psg],
  'fifa-21': [LEGACY.bayern21, LEGACY.liverpool20, CURRENT.city, CURRENT.psg, CURRENT.barca, CURRENT.real, CURRENT.inter, CURRENT.milan, CURRENT.napoli, CURRENT.juventus],
  'fifa-20': [LEGACY.liverpool20, CURRENT.city, CURRENT.barca, CURRENT.real, CURRENT.psg, CURRENT.bayern, CURRENT.inter, CURRENT.milan, CURRENT.napoli, CURRENT.juventus],
  'fifa-19': [LEGACY.barca19, LEGACY.real19, LEGACY.juve19, LEGACY.psg19, LEGACY.city19, LEGACY.pesInter19, LEGACY.pesMilan19, LEGACY.pesArsenal19],
  'efootball-modern': ids('barca','milan','arsenal','united','dortmund','inter','bayern','napoli','juventus','roma','psg','city','liverpool','chelsea','flamengo','palmeiras','boca','river','benfica','porto','alhilal'),
  'efootball-2026': ids('barca','milan','arsenal','united','dortmund','inter','bayern','napoli','juventus','roma','psg','city','liverpool','chelsea','flamengo','palmeiras','boca','river','benfica','porto','alhilal'),
  'efootball-2025': ids('barca','milan','arsenal','united','inter','bayern','flamengo','palmeiras','napoli','juventus','roma','psg','city','liverpool','chelsea','benfica','porto','alhilal'),
  'efootball-2024': ids('barca','milan','arsenal','united','inter','bayern','flamengo','palmeiras','napoli','juventus','roma','psg','city','liverpool'),
  'efootball-2023': ids('barca','milan','arsenal','united','inter','bayern','napoli','juventus','roma','psg','city','liverpool'),
  'efootball-2022': ids('barca','united','bayern','juventus','arsenal','milan','inter','napoli','roma'),
  'pes-2021': [LEGACY.pesBarca21, LEGACY.bayern21, LEGACY.pesUnited21, CURRENT.juventus, CURRENT.arsenal, CURRENT.inter, CURRENT.milan, CURRENT.napoli, CURRENT.liverpool, CURRENT.city],
  'pes-2020': [LEGACY.pesBarca21, LEGACY.bayern21, LEGACY.pesUnited21, CURRENT.juventus, CURRENT.arsenal, CURRENT.inter, CURRENT.milan, CURRENT.napoli],
  'pes-2019': [LEGACY.barca19, LEGACY.liverpool20, LEGACY.pesArsenal19, LEGACY.pesInter19, LEGACY.pesMilan19, LEGACY.real19, LEGACY.juve19, LEGACY.psg19]
};

export function getPopularTeamsForGame(gameId?: string | null): PopularTeam[] {
  return GAME_TEAMS[gameId || 'ea-fc-26'] || GAME_TEAMS['ea-fc-26'];
}

export function getTeamByName(gameId: string | undefined, name: string): PopularTeam | undefined {
  return getPopularTeamsForGame(gameId).find((t) => t.name === name || t.id === name);
}

export function teamField(team: PopularTeam, field: 'style' | 'strength' | 'weakness', lang: SupportedLang): string {
  return team.labels?.[field]?.[lang] || team[field];
}

export function boardFromTeams(gameId: string | undefined, ownTeamName: string, oppTeamName: string, _fallbackFormation: string, _fallbackOppFormation: string): TacticalBoardState | null {
  const own = getTeamByName(gameId, ownTeamName);
  const opp = getTeamByName(gameId, oppTeamName);
  if (!own && !opp) return null;
  const ownPlayers: TacticalPlayer[] = (own?.players || []).map((p, i) => ({ id: `home-${i}`, role: p.role, name: p.name, x: p.x, y: p.y, isOpponent: false }));
  const oppPlayers: TacticalPlayer[] = (opp?.players || []).map((p, i) => ({ id: `opp-${i}`, role: p.role, name: p.name, x: p.x, y: 100 - p.y, isOpponent: true }));
  return { players: [...ownPlayers, ...oppPlayers], teamColor: own?.color || '#8b5cf6', opponentColor: opp?.color || '#ef4444' };
}

export function dailyTeamPlan(gameId?: string | null): { team: PopularTeam; opponent: PopularTeam; title: string } {
  const teams = getPopularTeamsForGame(gameId);
  const day = Math.floor(Date.now() / 86400000);
  const team = teams[day % teams.length];
  const opponent = teams[(day + 3) % teams.length];
  return { team, opponent, title: `${team.name} ${team.defaultFormation} × ${opponent.name}` };
}
