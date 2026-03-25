"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, CheckCircle } from "lucide-react";
import type { Planification } from "./types";

interface PlanificationBlocksProps {
  blocks: Planification["blocks"];
  disciplineColor?: string;
}

export function PlanificationBlocks({
  blocks,
  disciplineColor,
}: PlanificationBlocksProps) {
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  if (sortedBlocks.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold flex items-center gap-2 text-white">
        <FileText className="w-6 h-6 text-lime-400" />
        Bloques de Entrenamiento
      </h3>
      {sortedBlocks.map((block, index) => (
        <Card key={block.id || index}>
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-lg text-white">
              <span
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-md"
                style={{
                  backgroundColor: disciplineColor || "hsl(var(--primary))",
                }}
              >
                {index + 1}
              </span>
              {block.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Items directos del bloque */}
            {block.items && block.items.length > 0 && (
              <ul className="space-y-3 mb-4">
                {block.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="flex items-start gap-3">
                    <CheckCircle
                      className="w-5 h-5 mt-0.5 flex-shrink-0"
                      style={{
                        color: disciplineColor || "hsl(var(--primary))",
                      }}
                    />
                    <span className="text-base text-zinc-100">{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Sub-bloques */}
            {block.subBlocks && block.subBlocks.length > 0 && (
              <div className="space-y-4">
                {block.subBlocks.map((subBlock) => (
                  <div key={subBlock.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className="w-1 h-4 rounded-full flex-shrink-0"
                        style={{
                          backgroundColor:
                            disciplineColor || "hsl(var(--primary))",
                        }}
                      />
                      <h4 className="text-sm font-semibold text-zinc-300">
                        {subBlock.subtitle}
                      </h4>
                    </div>
                    {subBlock.items.length > 0 ? (
                      <ul className="space-y-2 pl-3">
                        {subBlock.items.map((item, i) => (
                          <li key={i} className="flex items-start gap-3">
                            <CheckCircle
                              className="w-4 h-4 mt-0.5 flex-shrink-0"
                              style={{
                                color: disciplineColor || "hsl(var(--primary))",
                              }}
                            />
                            <span className="text-sm text-zinc-100">
                              {item}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-zinc-400 pl-3">
                        Sin ejercicios
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Fallback cuando no hay nada */}
            {(!block.items || block.items.length === 0) &&
              (!block.subBlocks || block.subBlocks.length === 0) && (
                <p className="text-sm text-zinc-400 mb-4">
                  Sin ejercicios específicos
                </p>
              )}

            {block.notes && (
              <div className="mt-4 pt-4 border-t border-zinc-800/50">
                <p className="text-xs font-medium text-zinc-400 mb-2">
                  Notas del bloque:
                </p>
                <p className="text-sm text-zinc-200 bg-zinc-950/60 p-3 rounded-md whitespace-pre-wrap border border-zinc-800/40">
                  {block.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
