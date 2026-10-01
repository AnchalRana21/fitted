import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { isRoleLine } from "@/lib/resume";
import type { Resume } from "@/lib/schemas";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4, color: "#111" },
  name: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  contact: { color: "#444" },
  section: { marginTop: 12 },
  heading: {
    fontSize: 10,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    borderBottomWidth: 0.5,
    borderBottomColor: "#999",
    paddingBottom: 2,
    marginBottom: 4,
  },
  role: { fontFamily: "Helvetica-Bold", marginTop: 4 },
  bullet: { flexDirection: "row", marginBottom: 2 },
  dot: { width: 10 },
  text: { flex: 1 },
});

export function ResumePdf({ resume }: { resume: Resume }) {
  return (
    <Document title="Resume">
      <Page size="A4" style={styles.page}>
        {resume.sections.map((section) =>
          section.title === "Header" ? (
            <View key={section.id}>
              {section.bullets.map((b, i) => (
                <Text key={b.id} style={i === 0 ? styles.name : styles.contact}>
                  {b.text}
                </Text>
              ))}
            </View>
          ) : (
            <View key={section.id} style={styles.section}>
              <Text style={styles.heading}>{section.title}</Text>
              {section.bullets.map((b) =>
                isRoleLine(b.text) ? (
                  <Text key={b.id} style={styles.role}>
                    {b.text}
                  </Text>
                ) : (
                  <View key={b.id} style={styles.bullet}>
                    <Text style={styles.dot}>•</Text>
                    <Text style={styles.text}>{b.text}</Text>
                  </View>
                ),
              )}
            </View>
          ),
        )}
      </Page>
    </Document>
  );
}
