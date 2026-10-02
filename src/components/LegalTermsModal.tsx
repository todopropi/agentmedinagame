import React from 'react';
import { ShieldAlert, FileText, Lock, AlertTriangle, CheckCircle2, X } from 'lucide-react';
import { AudioEngine } from '../utils/audio';

interface LegalTermsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LegalTermsModal: React.FC<LegalTermsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl text-slate-100"
      >
        {/* Header */}
        <div className="p-4 sm:p-6 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Avís Legal i Condicions d'Ús</span>
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 border border-red-500/30 uppercase">
                  Oficial
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Propietat intel·lectual, protecció de continguts i limitació de llicència
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              AudioEngine.playClick();
              onClose();
            }}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            title="Tancar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body with scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-300 leading-relaxed pr-3">
          {/* Important Highlight Banner */}
          <div className="p-3.5 sm:p-4 rounded-2xl bg-red-950/40 border border-red-500/40 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-black text-red-200">
                PROHIBICIÓ EXPRESSA DE DIFUSIÓ I LUCRAMENT SENSE AUTORITZACIÓ
              </p>
              <p className="text-xs text-red-300/90 leading-normal">
                Tots els materials, bancs de preguntes, regles mnemotècniques, recursos gràfics i algoritmes pedagògics integrats a l'aplicació <strong>Agent Medina</strong> estan protegits per la legislació de propietat intel·lectual. Queda expressament prohibit compartir, difondre o comercialitzar qualsevol part del contingut sense el consentiment per escrit de l'administrador.
              </p>
            </div>
          </div>

          {/* Secció 1 */}
          <div className="space-y-2 pt-2">
            <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>1. Titularitat i Propietat Intel·lectual</span>
            </h3>
            <p className="text-slate-300">
              La plataforma <strong>Agent Medina (MEED - Cos d'Opositors CME)</strong>, incloent-hi sense limitació el seu codi font, disseny d'interfície, bancs de preguntes oficials i adaptades, explicacions pedagògiques literals de les guies d'estudi de Mossos d'Esquadra, regles mnemotècniques i sistemes de simulació de duels, és propietat exclusiva del seu creador i equip administrador.
            </p>
          </div>

          {/* Secció 2 */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400" />
              <span>2. Llicència d'Ús Estricta, Personal i Intransferible</span>
            </h3>
            <p className="text-slate-300">
              L'accés i subscripció a l'aplicació concedeix a l'usuari una llicència d'ús <strong>única, personal, intransferible i no exclusiva</strong>, destinada exclusivament a la preparació individual de la convocatòria d'accés al Cos de Mossos d'Esquadra (Escala Bàsica / Comissaria General).
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-300 text-xs">
              <li>El compte d'usuari no es pot cedir, compartir, revendre ni llogar a terceres persones.</li>
              <li>La detecció de sessions simultànies anòmales o compartició de credencials pot provocar el bloqueig cautelar del perfil.</li>
            </ul>
          </div>

          {/* Secció 3 */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-rose-400 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              <span>3. Conductes Terminantment Prohibides</span>
            </h3>
            <p className="text-slate-300">
              Queda totalment prohibit als usuaris o tercers:
            </p>
            <div className="space-y-2 pl-2 text-xs">
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-rose-300">a) Difusió no autoritzada:</strong> Capturar, copiar, extreure mitjançant eines automatitzades (scraping), imprimir o distribuir preguntes, respostes o esquemes a canals de Telegram, WhatsApp, fòrums, xarxes socials o plataformes d'opositors.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-rose-300">b) Lucrament econòmic o comercial:</strong> Comercialitzar, revendre, incloure en cursos, acadèmies o plataformes terceres els materials o l'accés a l'app sense acord comercial signat amb el titular.
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                <strong className="text-rose-300">c) Enginyeria inversa:</strong> Descompilar, desmuntar o intentar obtenir el codi font o la base de dades privada de preguntes i usuaris de l'aplicació.
              </div>
            </div>
          </div>

          {/* Secció 4 */}
          <div className="space-y-2">
            <h3 className="text-sm font-black text-amber-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>4. Conseqüències Legals i Règim Sancionador</span>
            </h3>
            <p className="text-slate-300">
              La vulneració d'aquestes condicions facultarà l'administració d'Agent Medina a:
            </p>
            <ul className="list-disc list-inside space-y-1 pl-2 text-slate-300 text-xs">
              <li><strong>Cancel·lació immediata del compte</strong> i revocació de qualsevol subscripció o mèrits sense dret a compensació econòmica ni reemborsament.</li>
              <li><strong>Exercici de les accions civils i penals</strong> escaients en defensa dels drets de propietat intel·lectual i pels danys i perjudicis patrimonials causats (Articles 270 i següents del Codi Penal).</li>
            </ul>
          </div>

          {/* Secció 5 */}
          <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl text-center text-[11px] text-slate-400">
            Per a consultes sobre llicències educatives, acords d'acadèmia o autoritzacions de divulgació oficial, contacteu amb l'administració de la plataforma a través dels canals establerts.
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 bg-slate-950/90 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
          <div className="space-y-0.5">
            <p className="text-xs font-bold text-amber-300">
              ⚠️ Si estàs utilitzant aquesta app, acceptes expressament aquests termes.
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              L'accés i ús continuat de la plataforma implica la plena conformitat amb la propietat intel·lectual i condicions legals.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              AudioEngine.playClick();
              onClose();
            }}
            className="py-2.5 px-6 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black rounded-xl text-xs transition-all cursor-pointer shadow-lg shadow-amber-500/20 whitespace-nowrap shrink-0"
          >
            Entès i Tancar
          </button>
        </div>
      </div>
    </div>
  );
};
