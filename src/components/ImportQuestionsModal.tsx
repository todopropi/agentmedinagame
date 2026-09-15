import React, { useState } from 'react';
import { Question } from '../types';
import { addCustomQuestions } from '../data/questionsBank';
import { Upload, FileText, CheckCircle2, AlertCircle, X, Download } from 'lucide-react';

interface ImportQuestionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onQuestionsImported: (count: number) => void;
}

export const ImportQuestionsModal: React.FC<ImportQuestionsModalProps> = ({
  isOpen,
  onClose,
  onQuestionsImported
}) => {
  const [inputText, setInputText] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setInputText(content);
    };
    reader.readAsText(file);
  };

  const processImport = () => {
    try {
      if (!inputText.trim()) {
        setStatusMsg({ type: 'error', text: 'Introdueix o penja un fitxer amb preguntes.' });
        return;
      }

      let parsed: any;
      try {
        parsed = JSON.parse(inputText);
      } catch (err) {
        setStatusMsg({ type: 'error', text: 'El format ha de ser JSON vàlid (array d\'objectes Question).' });
        return;
      }

      if (!Array.isArray(parsed)) {
        setStatusMsg({ type: 'error', text: 'El JSON ha de ser una llista d\'objectes [ { pregunta, opcions, resposta, ... } ].' });
        return;
      }

      const validQuestions: Question[] = [];

      parsed.forEach((item, idx) => {
        if (item.pregunta && Array.isArray(item.opcions) && item.opcions.length >= 2 && typeof item.resposta === 'number') {
          validQuestions.push({
            id: item.id || `custom_${Date.now()}_${idx}`,
            ambit: item.ambit || 'Àmbit A',
            seccio: item.seccio || 'General',
            guiaTema: item.guiaTema || 'Temari Guia 2026',
            guiaPagina: item.guiaPagina || 'Guia Oficial',
            pregunta: item.pregunta,
            opcions: item.opcions,
            resposta: item.resposta,
            explicacio: item.explicacio || 'Explicació oficial del temari.',
            clauTribunal: item.clauTribunal || undefined,
            confusionAlert: item.confusionAlert || undefined
          });
        }
      });

      if (validQuestions.length === 0) {
        setStatusMsg({ type: 'error', text: 'No s\'han trobat preguntes vàlides en el contingut proporcionat.' });
        return;
      }

      addCustomQuestions(validQuestions);
      setStatusMsg({ type: 'success', text: `S'han importat amb èxit ${validQuestions.length} preguntes al banc del joc!` });
      onQuestionsImported(validQuestions.length);

      setTimeout(() => {
        onClose();
      }, 1800);
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Error en processar les preguntes.' });
    }
  };

  const sampleTemplate = JSON.stringify([
    {
      "ambit": "Àmbit B",
      "seccio": "Estatut d'Autonomia",
      "guiaTema": "Tema B.2",
      "guiaPagina": "Pàg. 45",
      "pregunta": "¿Quina és la institució que representa el poble de Catalunya?",
      "opcions": ["El Consell Executiu", "El Parlament de Catalunya", "El Síndic de Greuges", "La Generalitat"],
      "resposta": 1,
      "explicacio": "L'article 55 de l'Estatut d'Autonomia de Catalunya estableix que el Parlament representa el poble de Catalunya.",
      "clauTribunal": "No confondre Parlament (poder legislatiu) amb Generalitat (sistema institucional complet)."
    }
  ], null, 2);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-sky-500/20 text-sky-400 rounded-xl">
              <Upload className="w-5 h-5" />
            </span>
            <h3 className="text-lg font-black text-white">
              Importador de Preguntes Externes
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1 text-xs text-slate-300">
          <p>
            Pots carregar fitxers de preguntes personals en format JSON o enganxar-los directament aquí per incorporar-los al <b>Tauler de l'Oca</b> i als <b>Duels 1v1</b>.
          </p>

          {/* Upload Button */}
          <div className="flex items-center gap-3">
            <label className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-sky-400 font-bold rounded-xl border border-slate-700 flex items-center gap-2 cursor-pointer transition-colors">
              <Upload className="w-4 h-4" />
              <span>Pujar fitxer .json</span>
              <input
                type="file"
                accept=".json,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              onClick={() => setInputText(sampleTemplate)}
              className="px-3 py-2 text-slate-400 hover:text-white underline cursor-pointer text-xs"
            >
              Carregar plantilla d'exemple
            </button>
          </div>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={9}
            placeholder="Enganxa aquí el contingut JSON de les teves preguntes..."
            className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
          />

          {statusMsg && (
            <div className={`p-3 rounded-xl border flex items-center gap-2 text-xs ${
              statusMsg.type === 'success'
                ? 'bg-emerald-950/60 border-emerald-500 text-emerald-200'
                : 'bg-red-950/60 border-red-500 text-red-200'
            }`}>
              {statusMsg.type === 'success' ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0" />}
              <span>{statusMsg.text}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl text-xs cursor-pointer"
          >
            Cancel·lar
          </button>
          <button
            type="button"
            onClick={processImport}
            className="px-5 py-2 bg-sky-500 hover:bg-sky-400 text-slate-950 font-black rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-sky-500/20"
          >
            <Upload className="w-4 h-4" />
            <span>Processar & Afegir al Banc</span>
          </button>
        </div>
      </div>
    </div>
  );
};
