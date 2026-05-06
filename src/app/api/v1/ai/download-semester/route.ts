import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Document, Packer, Paragraph, Table, TableCell, TableRow, WidthType, HeadingLevel, AlignmentType, BorderStyle, TextRun } from "docx";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const semesterId = searchParams.get("semesterId");

    if (!semesterId) {
      return NextResponse.json({ error: "semesterId is required" }, { status: 400 });
    }

    const semesterData = await prisma.semester.findUnique({
      where: { id: semesterId },
      include: {
        modules: {
          orderBy: { id: "asc" },
          include: {
            subjects: {
              orderBy: { id: "asc" },
              include: {
                lectures: {
                  orderBy: { order: "asc" },
                  include: {
                    videos: true,
                    files: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!semesterData) {
      return NextResponse.json({ error: "Semester not found" }, { status: 404 });
    }

    const semester = semesterData as any;
    const sections = [];

    // Title Page / Header
    sections.push({
      children: [
        new Paragraph({
          children: [
            new TextRun({
              text: `Academic Curriculum: ${semester.name}`,
              bold: true,
              size: 32,
            }),
          ],
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 },
        }),
      ],
    });

    for (const mod of semester.modules) {
      const moduleTableRows = [
        new TableRow({
          children: [
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Subject", bold: true })],
                }),
              ],
              shading: { fill: "E0E0E0" },
            }),
            new TableCell({
              children: [
                new Paragraph({
                  children: [new TextRun({ text: "Lectures & Resources", bold: true })],
                }),
              ],
              shading: { fill: "E0E0E0" },
            }),
          ],
        }),
      ];

      for (const subj of mod.subjects) {
        const lectureBullets = subj.lectures.map((lec: any) => {
          const links = [];
          if (lec.videos.length > 0) links.push(`[Video: ${lec.videos[0].url}]`);
          if (lec.files.length > 0) links.push(`[File: ${lec.files[0].url}]`);
          
          return new Paragraph({
            text: `• ${lec.title} ${links.join(" ")}`,
            spacing: { before: 100 },
          });
        });

        moduleTableRows.push(
          new TableRow({
            children: [
              new TableCell({
                children: [
                  new Paragraph({
                    children: [new TextRun({ text: subj.name, bold: true })],
                  }),
                ],
                verticalAlign: "center",
              }),
              new TableCell({
                children: lectureBullets,
              }),
            ],
          })
        );
      }

      sections.push({
        children: [
          new Paragraph({
            children: [
              new TextRun({
                text: `Module: ${mod.name}`,
                bold: true,
                size: 28,
              }),
            ],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 400, after: 200 },
          }),
          new Table({
            rows: moduleTableRows,
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
              top: { style: BorderStyle.SINGLE, size: 1 },
              bottom: { style: BorderStyle.SINGLE, size: 1 },
              left: { style: BorderStyle.SINGLE, size: 1 },
              right: { style: BorderStyle.SINGLE, size: 1 },
            },
          }),
        ],
      });
    }

    const doc = new Document({ sections });
    const buffer = await Packer.toBuffer(doc);

    return new Response(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="MedOneX_${semester.name.replace(/\s+/g, "_")}.docx"`,
      },
    });

  } catch (e: any) {
    console.error("Export failed:", e);
    return NextResponse.json({ error: "Failed to generate document" }, { status: 500 });
  }
}
