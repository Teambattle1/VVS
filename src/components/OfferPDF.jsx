import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  pdf,
} from '@react-pdf/renderer'
import { jobTotal, roomTotal, packageTotal, toInclVat } from '../lib/pricing.js'
import { ROOM_TYPES } from '../lib/mockTemplates.js'

Font.register({
  family: 'Manrope',
  fonts: [
    { src: 'https://fonts.gstatic.com/s/manrope/v15/xn7gYHE41ni1AdIRggexSg.ttf' },
    { src: 'https://fonts.gstatic.com/s/manrope/v15/xn7gYHE41ni1AdIRggmxSg.ttf', fontWeight: 700 },
    { src: 'https://fonts.gstatic.com/s/manrope/v15/xn7gYHE41ni1AdIRggnxSg.ttf', fontWeight: 800 },
  ],
})

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Manrope', fontSize: 10, color: '#0F172A' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20, paddingBottom: 16, borderBottom: 2, borderColor: '#0EA5E9' },
  brandName: { fontSize: 20, fontWeight: 800, color: '#0F172A' },
  brandAccent: { color: '#0EA5E9' },
  orgMeta: { fontSize: 9, color: '#475569', lineHeight: 1.5 },
  title: { fontSize: 22, fontWeight: 800, marginBottom: 4 },
  subline: { fontSize: 10, color: '#64748b', marginBottom: 16 },
  sectionTitle: { fontSize: 12, fontWeight: 700, marginTop: 16, marginBottom: 6, color: '#0F172A' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 },
  rowLabel: { color: '#475569' },
  rowValue: { color: '#0F172A', fontWeight: 700 },
  card: { padding: 10, marginBottom: 8, backgroundColor: '#F8FAFC', borderRadius: 6 },
  pkgTitle: { fontSize: 11, fontWeight: 700, marginBottom: 4 },
  pkgMeta: { fontSize: 9, color: '#64748b', marginBottom: 4 },
  item: { flexDirection: 'row', justifyContent: 'space-between', fontSize: 9, paddingVertical: 1, color: '#475569' },
  itemName: { flex: 1 },
  itemPrice: { width: 80, textAlign: 'right' },
  totalBar: {
    marginTop: 24,
    padding: 12,
    backgroundColor: '#0F172A',
    borderRadius: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    color: '#fff',
  },
  totalLabel: { color: '#fff', fontSize: 12, fontWeight: 700 },
  totalValue: { color: '#fff', fontSize: 16, fontWeight: 800 },
  totalSub: { fontSize: 8, color: '#94a3b8', textAlign: 'right' },
  footer: {
    position: 'absolute',
    bottom: 20,
    left: 40,
    right: 40,
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
  },
})

function formatMoney(v) {
  return new Intl.NumberFormat('da-DK', { maximumFractionDigits: 0 }).format(v || 0) + ' kr'
}

function OfferDoc({ job, org }) {
  const total = jobTotal(job)
  const totalIncl = toInclVat(total)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brandName}>
              VVS <Text style={styles.brandAccent}>FLOW</Text>
            </Text>
            <Text style={styles.orgMeta}>
              {org?.name || 'VVS firma'}
              {'\n'}
              {org?.address || ''}
              {'\n'}
              {org?.contact_email || ''} · {org?.contact_phone || ''}
              {org?.cvr ? `\nCVR: ${org.cvr}` : ''}
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={{ fontSize: 12, fontWeight: 700 }}>TILBUD</Text>
            <Text style={styles.orgMeta}>{job.job_number}</Text>
            <Text style={styles.orgMeta}>
              {new Date().toLocaleDateString('da-DK', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
          </View>
        </View>

        <Text style={styles.title}>{job.title}</Text>
        <Text style={styles.subline}>
          Til: {job.customer.name} · {job.customer.address}
        </Text>

        {(job.rooms || []).map((room) => {
          const typeLabel = ROOM_TYPES.find((t) => t.value === room.room_type)?.label || room.room_type
          const rTotal = roomTotal(room)
          return (
            <View key={room.id} wrap={false}>
              <Text style={styles.sectionTitle}>
                {room.name} · {typeLabel}
              </Text>
              {(room.packages || []).map((pkg) => {
                const pTotal = packageTotal(pkg)
                return (
                  <View key={pkg.id} style={styles.card}>
                    <Text style={styles.pkgTitle}>{pkg.name}</Text>
                    {pkg.notes ? <Text style={styles.pkgMeta}>{pkg.notes}</Text> : null}
                    {pkg.timeline_text ? (
                      <Text style={styles.pkgMeta}>Tidsplan: {pkg.timeline_text}</Text>
                    ) : null}
                    {(pkg.items || [])
                      .filter((it) => it.customer_selected !== false)
                      .map((it) => (
                        <View key={it.id} style={styles.item}>
                          <Text style={styles.itemName}>
                            {it.name_snapshot} {it.quantity !== 1 ? `× ${it.quantity}` : ''}
                          </Text>
                          <Text style={styles.itemPrice}>
                            {formatMoney((it.quantity || 1) * it.unit_price)}
                          </Text>
                        </View>
                      ))}
                    <View style={[styles.row, { marginTop: 4, paddingTop: 4, borderTopWidth: 1, borderColor: '#e2e8f0' }]}>
                      <Text style={styles.rowLabel}>Pakke i alt (ekskl. moms)</Text>
                      <Text style={styles.rowValue}>{formatMoney(pTotal)}</Text>
                    </View>
                  </View>
                )
              })}
              <View style={[styles.row, { paddingLeft: 10, paddingRight: 10 }]}>
                <Text style={styles.rowLabel}>{room.name} i alt (ekskl. moms)</Text>
                <Text style={styles.rowValue}>{formatMoney(rTotal)}</Text>
              </View>
            </View>
          )
        })}

        <View style={styles.totalBar}>
          <View>
            <Text style={styles.totalLabel}>SAMLET TILBUD</Text>
            <Text style={styles.totalSub}>
              {formatMoney(total)} ekskl. moms
            </Text>
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Text style={styles.totalValue}>{formatMoney(totalIncl)}</Text>
            <Text style={styles.totalSub}>inkl. 25% moms</Text>
          </View>
        </View>

        <Text style={styles.footer}>
          Tilbuddet er gældende i 30 dage. Prisen er inkl. materialer (som angivet) og arbejdsløn.
          Forbehold for uforudsete komplikationer og skjulte installationer.
        </Text>
      </Page>
    </Document>
  )
}

export async function downloadOfferPDF(job, org) {
  const blob = await pdf(<OfferDoc job={job} org={org} />).toBlob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${job.job_number}-tilbud.pdf`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}
