import {
  LEGAL_CONTACT_EMAIL,
  type LegalDocument,
  type TextPart,
} from '@/app/features/legal_terms/legal.documents';

function Parts({ parts }: { parts: TextPart[] }) {
  return (
    <>
      {parts.map((part, index) => {
        if (typeof part === 'string') return <span key={index}>{part}</span>;
        if ('strong' in part) {
          return (
            <strong key={index} className="font-semibold">
              {part.strong}
            </strong>
          );
        }
        if ('em' in part) {
          return <em key={index}>{part.em}</em>;
        }
        return (
          <a
            key={index}
            href={`mailto:${LEGAL_CONTACT_EMAIL}`}
            className="underline underline-offset-2"
          >
            {part.email}
          </a>
        );
      })}
    </>
  );
}

export default function LegalArticle({ doc }: { doc: LegalDocument }) {
  return (
    <div className="space-y-9">
      {doc.sections.map((section, index) => (
        <section key={section.id} id={section.id} className="scroll-mt-28 space-y-3">
          <h2 className="text-xl text-neutral-950">
            {index + 1}. {section.heading}
          </h2>
          {section.blocks.map((block, blockIndex) => {
            if (block.kind === 'p') {
              return (
                <p key={blockIndex} className="text-[15px] leading-7 text-neutral-800">
                  <Parts parts={block.parts} />
                </p>
              );
            }
            if (block.kind === 'ul') {
              return (
                <ul key={blockIndex} className="list-disc space-y-2 pl-5 text-[15px] leading-7 text-neutral-800">
                  {block.items.map((parts, itemIndex) => (
                    <li key={itemIndex}>
                      <Parts parts={parts} />
                    </li>
                  ))}
                </ul>
              );
            }
            return (
              <div
                key={blockIndex}
                className="overflow-x-auto rounded-xl border border-neutral-200"
              >
                <table className="w-full min-w-[32rem] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50">
                      {block.headers.map((header) => (
                        <th
                          key={header}
                          className="px-3 py-2.5 font-semibold text-neutral-950"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {block.rows.map((row) => (
                      <tr
                        key={row[0]}
                        className="border-b border-neutral-100 last:border-0"
                      >
                        {row.map((cell, cellIndex) => (
                          <td
                            key={cell}
                            className={`px-3 py-2.5 align-top text-neutral-800 ${cellIndex === 0 ? 'font-medium text-neutral-950' : ''}`}
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
