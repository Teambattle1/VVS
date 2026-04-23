-- VVS Tilbudssystem - Seed data
-- Globale pakke-skabeloner (organization_id = NULL)
-- Hver org kan kopiere og tilpasse priser efter eget ønske

-- Ryd evt. gamle globale rows før re-seed
delete from public.vvs_package_templates where organization_id is null;

insert into public.vvs_package_templates
  (organization_id, name, category, lucide_icon, description, pricing_model, base_price, base_hours, hourly_rate, active)
values
  -- =========================
  -- Badeværelse
  -- =========================
  (null, 'Toilet standard',               'bathroom', 'Toilet',        'Montering og tilslutning af toilet (gulvstående).',              'fixed',        3200,   2.5, null, true),
  (null, 'Toilet m/ skjult cisterne',     'bathroom', 'Toilet',        'Indbygget cisterne i væg, tilslutning af toilet.',                'fixed',        6800,   5,   null, true),
  (null, 'Bad / brusekabine',             'bathroom', 'ShowerHead',    'Brusekabine med armatur og afløb.',                                'package_plus', 4500,   4,   null, true),
  (null, 'Badekar',                       'bathroom', 'Bath',          'Rørføring og tilslutning af badekar.',                             'package_plus', 5800,   5,   null, true),
  (null, 'Håndvask enkelt',               'bathroom', 'Droplet',       'Montering af enkelt håndvask inkl. tilslutning.',                  'fixed',        1800,   1.5, null, true),
  (null, 'Dobbelt håndvask',              'bathroom', 'Droplets',      'Montering af dobbelt håndvask inkl. tilslutning.',                 'fixed',        2800,   2.5, null, true),
  (null, 'Blandingsbatteri bad',          'bathroom', 'Waves',         'Udskiftning af blandingsbatteri til bad.',                         'fixed',        1400,   1,   null, true),
  (null, 'Blandingsbatteri vask',         'bathroom', 'Waves',         'Udskiftning af blandingsbatteri til håndvask.',                    'fixed',        1200,   1,   null, true),
  (null, 'Gulvafløb',                     'bathroom', 'CircleDot',     'Etablering/udskiftning af gulvafløb.',                             'hourly',       0,      4,   695, true),
  (null, 'Gulvvarme (vådrum)',            'bathroom', 'Flame',         'Gulvvarme i badeværelse.',                                         'hourly',       0,      8,   695, true),
  (null, 'Radiator badeværelse',          'bathroom', 'Thermometer',   'Montering af radiator.',                                           'fixed',        2800,   2.5, null, true),
  (null, 'Ventilation / udsugning',       'bathroom', 'Wind',          'Installation af mekanisk udsugning.',                              'fixed',        2400,   2,   null, true),

  -- =========================
  -- Køkken
  -- =========================
  (null, 'Køkkenvask enkelt',             'kitchen',  'Utensils',      'Montering af enkelt køkkenvask.',                                  'fixed',        1900,   1.5, null, true),
  (null, 'Køkkenvask dobbelt',            'kitchen',  'Utensils',      'Montering af dobbelt køkkenvask.',                                 'fixed',        2600,   2.5, null, true),
  (null, 'Blandingsbatteri køkken',       'kitchen',  'Waves',         'Udskiftning af blandingsbatteri til køkken.',                      'fixed',        1300,   1,   null, true),
  (null, 'Opvaskemaskine tilslutning',    'kitchen',  'Refrigerator',  'Tilslutning af opvaskemaskine (vand + afløb).',                    'fixed',        1200,   1,   null, true),
  (null, 'Vandfilter under vask',         'kitchen',  'Filter',        'Montering af vandfilter under køkkenvask.',                        'fixed',        1600,   1.5, null, true),

  -- =========================
  -- Bryggers / Vaskerum
  -- =========================
  (null, 'Vaskemaskine tilslutning',      'utility',  'WashingMachine','Tilslutning af vaskemaskine (vand + afløb).',                      'fixed',        1100,   1,   null, true),
  (null, 'Tørretumbler (kondens/afløb)',  'utility',  'WashingMachine','Tilslutning af tørretumbler.',                                     'fixed',        900,    1,   null, true),
  (null, 'Udslagsvask',                   'utility',  'Droplet',       'Montering af udslagsvask.',                                        'fixed',        2200,   2,   null, true),
  (null, 'Gulvafløb bryggers',            'utility',  'CircleDot',     'Etablering af gulvafløb i bryggers.',                              'hourly',       0,      4,   695, true),

  -- =========================
  -- Teknikrum
  -- =========================
  (null, 'Varmtvandsbeholder udskiftning','technical','Container',     'Udskiftning af varmtvandsbeholder.',                               'package_plus', 8800,   6,   null, true),
  (null, 'Fjernvarmeunit udskiftning',    'technical','Flame',         'Udskiftning af fjernvarmeunit.',                                   'package_plus', 14500,  8,   null, true),
  (null, 'Cirkulationspumpe',             'technical','CircleDot',     'Udskiftning af cirkulationspumpe.',                                'fixed',        2400,   2,   null, true),
  (null, 'Shuntventil',                   'technical','Settings2',     'Installation/udskiftning af shuntventil.',                         'fixed',        1800,   1.5, null, true),
  (null, 'Ekspansionsbeholder',           'technical','Container',     'Installation af ekspansionsbeholder.',                             'fixed',        1400,   1.5, null, true),

  -- =========================
  -- Udendørs
  -- =========================
  (null, 'Udendørs vandhane',             'outdoor',  'Droplet',       'Installation af frostsikker vandhane udendørs.',                   'fixed',        2200,   2,   null, true),
  (null, 'Havevanding / drypslange',      'outdoor',  'Sprout',        'Tilslutning af havevanding / drypslange.',                         'hourly',       0,      3,   695, true),
  (null, 'Nedløbsrør tilkobling',         'outdoor',  'CloudRain',     'Tilkobling af nedløbsrør.',                                        'hourly',       0,      2,   695, true),
  (null, 'Tagbrønd / rendeafløb',         'outdoor',  'CloudRain',     'Etablering af tagbrønd eller rendeafløb.',                         'hourly',       0,      4,   695, true),

  -- =========================
  -- Diverse / Rørarbejde
  -- =========================
  (null, 'Rørføring pr. meter',           'misc',     'GitBranch',     'Rørføring pr. løbende meter.',                                     'hourly',       0,      0.5, 695, true),
  (null, 'Gennemboring væg',              'misc',     'Drill',         'Gennemboring af væg for rørføring.',                               'fixed',        600,    0.5, null, true),
  (null, 'Dykpumpe',                      'misc',     'ArrowDownToLine','Installation af dykpumpe.',                                       'fixed',        3200,   2.5, null, true),
  (null, 'Rottespærre',                   'misc',     'Shield',        'Installation af rottespærre.',                                     'fixed',        2800,   2,   null, true),
  (null, 'Inspektion med kamera',         'misc',     'Camera',        'Rørinspektion med kamera.',                                        'hourly',       0,      1,   895, true);
