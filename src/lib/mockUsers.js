// Mock team-medlemmer pr. org. Alle har default-kode '1234'.
export const INITIAL_TEAM = [
  { id: 'u-0', name: 'Anders Elmgren', email: 'a@a.dk',                phone: '+45 20 00 00 00', role: 'org_admin', active: true, password: '1234' },
  { id: 'u-1', name: 'Mikkel Montør',  email: 'mikkel@vvs-kbh.dk',     phone: '+45 20 11 22 33', role: 'org_admin', active: true, password: '1234' },
  { id: 'u-2', name: 'Anne Rasmussen', email: 'anne@vvs-kbh.dk',       phone: '+45 20 44 55 66', role: 'montor',    active: true, password: '1234' },
  { id: 'u-3', name: 'Jesper Sørensen',email: 'jesper@vvs-kbh.dk',     phone: '+45 20 77 88 99', role: 'montor',    active: true, password: '1234' },
  { id: 'u-4', name: 'Louise Kjær',    email: 'louise@vvs-kbh.dk',     phone: '+45 30 11 22 33', role: 'montor',    active: true, password: '1234' },
]

export const ROLES = [
  { value: 'org_admin', label: 'Org-admin' },
  { value: 'montor', label: 'Montør' },
]
