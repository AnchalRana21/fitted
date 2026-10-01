import { Document, Font, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import { isRoleLine } from "@/lib/resume";
import { headerParts, sectionKind, splitDates, splitLabel, splitLead } from "@/lib/resume-layout";
import type { Resume, Section } from "@/lib/schemas";

const BOLD = "Helvetica-Bold";

// Wrap whole words only; automatic hyphenation splits words like "manage-ment".
Font.registerHyphenationCallback((word) => [word]);

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 44,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    lineHeight: 1.3,
    color: "#111",
  },
  header: { alignItems: "center", textAlign: "center" },
  name: { fontSize: 20, lineHeight: 1.2, fontFamily: BOLD, textTransform: "uppercase", marginBottom: 2 },
  headline: { fontSize: 10.5, marginBottom: 1 },
  contact: { color: "#333" },
  section: { marginTop: 8 },
  heading: {
    fontSize: 11,
    fontFamily: BOLD,
    textTransform: "uppercase",
    letterSpacing: 1,
    borderBottomWidth: 0.75,
    borderBottomColor: "#222",
    paddingBottom: 2,
    marginBottom: 2,
  },
  paragraph: { marginBottom: 1 },
  bold: { fontFamily: BOLD },
  role: { flexDirection: "row", justifyContent: "space-between", marginTop: 2, marginBottom: 1 },
  roleMain: { flex: 1, paddingRight: 12, fontFamily: BOLD },
  roleDates: { fontFamily: BOLD },
  bullet: { flexDirection: "row", marginBottom: 1 },
  dot: { width: 10 },
  text: { flex: 1 },
});

type Parts = { lead: string; sep: string; rest: string } | null;

function Paragraph({ text, parts }: { text: string; parts: Parts }) {
  if (!parts) return <Text style={styles.paragraph}>{text}</Text>;
  return (
    <Text style={styles.paragraph}>
      <Text style={styles.bold}>{parts.lead}</Text>
      {parts.sep}
      {parts.rest}
    </Text>
  );
}

function sectionBody(section: Section): ReactElement[] {
  const kind = sectionKind(section.title);
  if (kind === "summary") {
    return [<Text key="summary" style={styles.paragraph}>{section.bullets.map((b) => b.text).join(" ")}</Text>];
  }
  if (kind === "skills" || kind === "other") {
    const split = kind === "skills" ? splitLabel : splitLead;
    return section.bullets.map((b) => <Paragraph key={b.id} text={b.text} parts={split(b.text)} />);
  }
  return section.bullets.map((b) => {
    if (isRoleLine(b.text)) {
      const parts = splitDates(b.text);
      return (
        <View key={b.id} style={styles.role} wrap={false}>
          <Text style={styles.roleMain}>{parts ? parts.main : b.text}</Text>
          {parts && <Text style={styles.roleDates}>{parts.dates}</Text>}
        </View>
      );
    }
    return (
      <View key={b.id} style={styles.bullet}>
        <Text style={styles.dot}>•</Text>
        <Text style={styles.text}>{b.text}</Text>
      </View>
    );
  });
}

export function ResumePdf({ resume }: { resume: Resume }) {
  const name = resume.sections.find((s) => s.title === "Header")?.bullets[0]?.text || "Resume";
  return (
    <Document title={`${name} – Resume`} author={name}>
      <Page size="LETTER" style={styles.page}>
        {resume.sections.map((section) => {
          if (section.title === "Header") {
            const header = headerParts(section.bullets.map((b) => b.text));
            return (
              <View key={section.id} style={styles.header}>
                {header.name && <Text style={styles.name}>{header.name}</Text>}
                {header.headline && <Text style={styles.headline}>{header.headline}</Text>}
                {header.contacts.map((line, i) => (
                  <Text key={i} style={styles.contact}>
                    {line}
                  </Text>
                ))}
              </View>
            );
          }
          // Keep the heading with the first item so a heading never ends a page on its own.
          const [first, ...rest] = sectionBody(section);
          return (
            <View key={section.id} style={styles.section}>
              <View wrap={false}>
                <Text style={styles.heading} minPresenceAhead={40}>
                  {section.title}
                </Text>
                {first}
              </View>
              {rest}
            </View>
          );
        })}
      </Page>
    </Document>
  );
}
