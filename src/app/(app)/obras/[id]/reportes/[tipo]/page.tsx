import { reportSheet } from "@/lib/files";
import Link from "next/link";

export default async function PrintReportPage({ params }: { params: Promise<{ id: string; tipo: string }> }) {
  const { id, tipo } = await params;
  const sheet = await reportSheet(id, tipo);
  return (
    <article className="space-y-4 bg-white p-4">
      <div className="no-print flex gap-3 text-sm">
        <Link href={`/obras/${id}/reportes`}>Volver</Link>
        <a href={`/api/obras/${id}/excel?tipo=${tipo}`}>Excel</a>
        <a href={`/api/obras/${id}/word?tipo=${tipo}`}>Word</a>
        <span>Para PDF, use la impresión del navegador.</span>
      </div>
      <header>
        <p className="font-serif text-2xl text-primary">Cimenta</p>
        <h1 className="text-xl">{sheet.title}</h1>
        {sheet.meta.map((line) => <p key={line} className="text-sm text-stone-600">{line}</p>)}
      </header>
      <table className="w-full border-collapse text-sm">
        <thead><tr>{sheet.headers.map((header) => <th key={header} className="border-b px-2 py-1 text-left">{header}</th>)}</tr></thead>
        <tbody>
          {sheet.rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex} className="border-b px-2 py-1">{cell}</td>)}</tr>)}
        </tbody>
      </table>
    </article>
  );
}
