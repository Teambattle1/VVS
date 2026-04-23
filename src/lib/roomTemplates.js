// Faerdige rum-skabeloner (preset dimensioner + valgfri forslag til pakker)
// Bruges i AddRoomDialog. Montoer kan stadig justere bagefter.

export const ROOM_PRESETS = [
  // Badeværelse
  {
    id: 'preset-bath-small',
    label: 'Lille badeværelse',
    room_type: 'bathroom',
    width_cm: 180,
    length_cm: 220,
    hint: '4m² · toilet + vask + bruser',
    suggested_templates: ['t-bath-01', 't-bath-05', 't-bath-03'],
  },
  {
    id: 'preset-bath-std',
    label: 'Standard badeværelse',
    room_type: 'bathroom',
    width_cm: 260,
    length_cm: 320,
    hint: '8m² · fuld udstyr',
    suggested_templates: ['t-bath-02', 't-bath-06', 't-bath-03', 't-bath-09'],
  },
  {
    id: 'preset-bath-large',
    label: 'Stort badeværelse',
    room_type: 'bathroom',
    width_cm: 320,
    length_cm: 400,
    hint: '13m² · badekar + bruser',
    suggested_templates: ['t-bath-02', 't-bath-06', 't-bath-04', 't-bath-03', 't-bath-10'],
  },

  // Køkken
  {
    id: 'preset-kitchen-std',
    label: 'Standard køkken',
    room_type: 'kitchen',
    width_cm: 300,
    length_cm: 400,
    hint: 'Vask + opvaskemaskine',
    suggested_templates: ['t-kit-02', 't-kit-03', 't-kit-04'],
  },

  // Bryggers
  {
    id: 'preset-utility',
    label: 'Bryggers',
    room_type: 'utility',
    width_cm: 200,
    length_cm: 240,
    hint: 'Vaskemaskine + tumbler',
    suggested_templates: ['t-util-01', 't-util-02', 't-util-04'],
  },

  // Teknikrum
  {
    id: 'preset-technical',
    label: 'Teknikrum',
    room_type: 'technical',
    width_cm: 180,
    length_cm: 220,
    hint: 'VV-beholder + pumper',
    suggested_templates: ['t-tech-01', 't-tech-03'],
  },

  // Udendørs
  {
    id: 'preset-outdoor',
    label: 'Udendørs',
    room_type: 'outdoor',
    width_cm: 400,
    length_cm: 400,
    hint: 'Vandhane + nedløb',
    suggested_templates: ['t-out-01', 't-out-03'],
  },
]
