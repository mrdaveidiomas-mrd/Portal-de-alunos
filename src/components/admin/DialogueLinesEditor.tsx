"use client";

import { useState } from "react";

import {
  parseDialogueLines,
  speakersOf,
  type SpeakerGender,
} from "@/lib/blocks/dialogue";

// Editor do bloco de diálogo: as falas e, para cada personagem encontrado nelas,
// o gênero da voz. Sem escolha, a voz é inferida pelo nome e pode sair trocada.
// A escolha vai como JSON num hidden input; textarea e selects são form controls,
// então o `onChange` do <form> do BlockForm já dispara o autosave.
export function DialogueLinesEditor({
  initialLines = "",
  initialGenders = {},
  areaClassName,
  selectClassName,
}: {
  initialLines?: string;
  initialGenders?: Record<string, SpeakerGender>;
  areaClassName: string;
  selectClassName: string;
}) {
  const [lines, setLines] = useState(initialLines);
  const [genders, setGenders] = useState(initialGenders);
  const speakers = speakersOf(parseDialogueLines(lines));

  function chooseGender(speaker: string, value: string) {
    setGenders((prev) => {
      const next = { ...prev };
      if (value === "female" || value === "male") next[speaker] = value;
      else delete next[speaker];
      return next;
    });
  }

  return (
    <>
      <textarea
        name="lines"
        value={lines}
        onChange={(e) => setLines(e.target.value)}
        placeholder={"Personagem: fala"}
        rows={4}
        className={areaClassName}
      />
      <p className="text-xs text-fg-tertiary">
        Uma fala por linha no formato “Personagem: texto”.
      </p>

      <input
        type="hidden"
        name="speaker_genders"
        value={JSON.stringify(genders)}
        readOnly
      />

      {speakers.length > 0 && (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-xs text-fg-secondary">
            Voz de cada personagem
          </legend>
          {speakers.map((speaker) => (
            <label
              key={speaker}
              className="grid grid-cols-2 items-center gap-3 text-sm text-fg-primary"
            >
              <span className="truncate" title={speaker}>
                {speaker}
              </span>
              <select
                value={genders[speaker] ?? ""}
                onChange={(e) => chooseGender(speaker, e.target.value)}
                className={selectClassName}
              >
                <option value="">Automático (pelo nome)</option>
                <option value="female">Feminino</option>
                <option value="male">Masculino</option>
              </select>
            </label>
          ))}
          <p className="text-xs text-fg-tertiary">
            O modo automático adivinha pelo nome e pode errar. Escolha o gênero
            para garantir a voz certa.
          </p>
        </fieldset>
      )}
    </>
  );
}
