import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { Pregunta } from '../../types';
import {
    Lightbulb, Target, Map, Flame, Zap, Share2, LayoutDashboard, Search,
    GitBranch, ShieldCheck, BookOpen, BarChart3, LineChart, MessageSquareWarning, Fingerprint
} from 'lucide-react';

import { SugerenciasPanel } from '../SugerenciasPanel';
import { TendenciasHistoricas } from '../TendenciasHistoricas';
import { AnalisisAnuladas } from '../AnalisisAnuladas';
import { PrediccionTemas } from '../PrediccionTemas';
import { AnalisisDistractores } from '../AnalisisDistractores';
import { MapaCalor } from '../MapaCalor';
import { MapaConceptos } from '../MapaConceptos';
import { ChiCuadrado } from '../ChiCuadrado';
import { ChiSegmentado } from '../ChiSegmentado';
import { PreguntasCalientes } from '../PreguntasCalientes';
import { AnalisisConfusion } from '../AnalisisConfusion';
import { GrafoCoocurrenciaViz } from '../GrafoCoocurrencia';
import { CoberturaTematica } from '../CoberturaTematica';
import { MatrizCorrelacion } from '../MatrizCorrelacion';
import { PantallaCompleta } from '../PantallaCompleta';
import { Duplicados } from '../Duplicados';
import { DificultadCruzada } from '../DificultadCruzada';
import { SimuladorPuntuacion } from '../SimuladorPuntuacion';
import { PatronesOrganismo } from '../PatronesOrganismo';
import { AnalisisPosicionComp } from '../AnalisisPosicion';
import { VocabularioEmergente } from '../VocabularioEmergente';

// ——— Componente LazySection ———
// Renderiza cuando entra en el viewport O cuando forceVisible es true.
const LazySection: React.FC<{ children: React.ReactNode; fallbackHeight?: number; forceVisible?: boolean }> = ({ children, fallbackHeight = 200, forceVisible = false }) => {
    const ref = useRef<HTMLDivElement>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        if (forceVisible) { setVisible(true); return; }
        const el = ref.current;
        if (!el) return;
        const observer = new IntersectionObserver(
            ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
            { rootMargin: '400px 0px' }
        );
        observer.observe(el);
        return () => observer.disconnect();
    }, [forceVisible]);

    return (
        <div ref={ref}>
            {visible ? children : <div style={{ minHeight: fallbackHeight }} />}
        </div>
    );
};

// Estilo CSS para scroll-margin que compensa header + filtros sticky
const SCROLL_MARGIN_STYLE: React.CSSProperties = { scrollMarginTop: '320px' };

// ——— Definición de grupos y secciones ———
interface SeccionDef {
    id: string;
    label: string;
    icon: React.ReactNode;
}

interface GrupoDef {
    titulo: string;
    emoji: string;
    secciones: SeccionDef[];
}

const GRUPOS: GrupoDef[] = [
    {
        titulo: 'Estrategia de estudio',
        emoji: '🎯',
        secciones: [
            { id: 'sec-sugerencias', label: 'Sugerencias', icon: <Lightbulb className="w-3.5 h-3.5" /> },
            { id: 'sec-tendencias', label: 'Tendencias', icon: <LineChart className="w-3.5 h-3.5" /> },
            { id: 'sec-prediccion', label: 'Predicción', icon: <Target className="w-3.5 h-3.5" /> },
            { id: 'sec-cobertura', label: 'Cobertura', icon: <ShieldCheck className="w-3.5 h-3.5" /> },
            { id: 'sec-simulador', label: 'Simulador nota', icon: <Target className="w-3.5 h-3.5" /> },
            { id: 'sec-vocabulario', label: 'Vocab. emergente', icon: <Lightbulb className="w-3.5 h-3.5" /> },
        ],
    },
    {
        titulo: 'Análisis de contenido',
        emoji: '📊',
        secciones: [
            { id: 'sec-mapacalor', label: 'Mapa de calor', icon: <Map className="w-3.5 h-3.5" /> },
            { id: 'sec-calientes', label: 'P. calientes', icon: <Flame className="w-3.5 h-3.5" /> },
            { id: 'sec-conceptos', label: 'Conceptos clave', icon: <BookOpen className="w-3.5 h-3.5" /> },
            { id: 'sec-grafo', label: 'Co-ocurrencia', icon: <Share2 className="w-3.5 h-3.5" /> },
        ],
    },
    {
        titulo: 'Dificultad y trampas',
        emoji: '⚠️',
        secciones: [
            { id: 'sec-dificultad', label: 'Dificultad cruzada', icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { id: 'sec-posicion', label: 'Posición / correcta', icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { id: 'sec-distractores', label: 'Distractores', icon: <Fingerprint className="w-3.5 h-3.5" /> },
            { id: 'sec-confusion', label: 'Confusión', icon: <Zap className="w-3.5 h-3.5" /> },
            { id: 'sec-anuladas', label: 'Anuladas', icon: <MessageSquareWarning className="w-3.5 h-3.5" /> },
            { id: 'sec-duplicados', label: 'Duplicados', icon: <Search className="w-3.5 h-3.5" /> },
        ],
    },
    {
        titulo: 'Rigor estadístico',
        emoji: '🔬',
        secciones: [
            { id: 'sec-chi', label: 'Chi-cuadrado', icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { id: 'sec-chiseg', label: 'Chi² segmentado', icon: <BarChart3 className="w-3.5 h-3.5" /> },
            { id: 'sec-correlacion', label: 'Correlación', icon: <GitBranch className="w-3.5 h-3.5" /> },
            { id: 'sec-patrones', label: 'Patrones org./esc.', icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
        ],
    },
];

const ALL_SECCIONES = GRUPOS.flatMap(g => g.secciones);

interface PanelEstadisticasProps {
    preguntas: Pregunta[];
    onVerPregunta: (id: string) => void;
    setMaterias: (v: string[]) => void;
}

export const PanelEstadisticas: React.FC<PanelEstadisticasProps> = ({ preguntas, onVerPregunta }) => {
    const [seccionActiva, setSeccionActiva] = useState('sec-sugerencias');
    const [forceAllVisible, setForceAllVisible] = useState(false);

    // IntersectionObserver para resaltar la sección activa al hacer scroll manual
    useEffect(() => {
        const ids = ALL_SECCIONES.map(s => s.id);
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        setSeccionActiva(entry.target.id);
                    }
                });
            },
            { rootMargin: '-120px 0px -60% 0px', threshold: 0.1 }
        );
        // Re-observe when sections become visible
        const timer = setTimeout(() => {
            ids.forEach(id => {
                const el = document.getElementById(id);
                if (el) observer.observe(el);
            });
        }, 100);
        return () => { clearTimeout(timer); observer.disconnect(); };
    }, [forceAllVisible]);

    const scrollTo = useCallback((id: string) => {
        // Forzar que todas las secciones se rendericen antes de hacer scroll;
        // así la altura de la página es la real y el destino no se mueve.
        if (!forceAllVisible) {
            setForceAllVisible(true);
            // Esperar un ciclo de render para que los componentes se monten
            requestAnimationFrame(() => {
                setTimeout(() => {
                    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }, 50);
            });
        } else {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [forceAllVisible]);

    return (
        <div id="panel-estadisticas" role="tabpanel" className="animate-fade-slide"
            style={{ display: 'grid', gridTemplateColumns: '180px minmax(0, 1fr)', gap: '16px', alignItems: 'start' }}>

            {/* ═══ Sidebar de navegación agrupado ═══ */}
            <nav style={{
                position: 'sticky', top: '140px',
                display: 'flex', flexDirection: 'column', gap: '0px',
                padding: '10px', borderRadius: '10px',
                backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-secondary)',
                fontSize: '11px', maxHeight: 'calc(100vh - 160px)', overflowY: 'auto',
            }}>
                {GRUPOS.map((grupo, gi) => (
                    <div key={gi}>
                        {/* Encabezado de grupo */}
                        <div style={{
                            fontSize: '9px', fontWeight: 800, textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            color: 'var(--text-tertiary)',
                            padding: '8px 8px 4px 8px',
                            marginTop: gi > 0 ? '6px' : '0',
                            borderTop: gi > 0 ? '1px solid var(--border-secondary)' : 'none',
                        }}>
                            {grupo.emoji} {grupo.titulo}
                        </div>
                        {grupo.secciones.map(s => (
                            <a key={s.id} href={`#${s.id}`}
                                onClick={e => { e.preventDefault(); scrollTo(s.id); }}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '5px 8px', borderRadius: '6px',
                                    color: seccionActiva === s.id ? 'var(--accent-primary)' : 'var(--text-primary)',
                                    textDecoration: 'none',
                                    fontWeight: seccionActiva === s.id ? 800 : 600,
                                    cursor: 'pointer', transition: 'all 0.15s',
                                    backgroundColor: seccionActiva === s.id ? 'var(--bg-tertiary)' : 'transparent',
                                    borderLeft: seccionActiva === s.id ? '3px solid var(--accent-primary)' : '3px solid transparent',
                                }}
                                onMouseEnter={e => { if (seccionActiva !== s.id) e.currentTarget.style.backgroundColor = 'var(--bg-tertiary)'; }}
                                onMouseLeave={e => { if (seccionActiva !== s.id) e.currentTarget.style.backgroundColor = 'transparent'; }}
                            >
                                <span style={{ color: seccionActiva === s.id ? 'var(--accent-primary)' : 'var(--primary)', display: 'flex' }}>{s.icon}</span>
                                {s.label}
                            </a>
                        ))}
                    </div>
                ))}
            </nav>

            {/* ═══ Contenido principal ═══ */}
            <div className="space-y-6">

                {/* ————— 🎯 ESTRATEGIA DE ESTUDIO ————— */}
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', padding: '0 0 4px 4px', borderBottom: '1px solid var(--border-secondary)' }}>
                    🎯 Estrategia de estudio
                </div>
                <div id="sec-sugerencias" style={SCROLL_MARGIN_STYLE}><SugerenciasPanel preguntas={preguntas} /></div>
                <div id="sec-tendencias" style={SCROLL_MARGIN_STYLE}><TendenciasHistoricas preguntas={preguntas} /></div>
                <div id="sec-prediccion" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><PrediccionTemas preguntas={preguntas} /></LazySection></div>
                <div id="sec-cobertura" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><CoberturaTematica preguntas={preguntas} /></LazySection></div>
                <div id="sec-simulador" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><SimuladorPuntuacion preguntas={preguntas} /></LazySection></div>
                <div id="sec-vocabulario" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><VocabularioEmergente preguntas={preguntas} /></LazySection></div>

                {/* ————— 📊 ANÁLISIS DE CONTENIDO ————— */}
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', padding: '0 0 4px 4px', borderBottom: '1px solid var(--border-secondary)' }}>
                    📊 Análisis de contenido
                </div>
                <div id="sec-mapacalor" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><PantallaCompleta titulo="Mapa de calor"><MapaCalor preguntas={preguntas} /></PantallaCompleta></LazySection></div>
                <div id="sec-calientes" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><PreguntasCalientes preguntas={preguntas} onVerPregunta={onVerPregunta} /></LazySection></div>
                <div id="sec-conceptos" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><MapaConceptos preguntas={preguntas} onVerPregunta={onVerPregunta} /></LazySection></div>
                <div id="sec-grafo" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><PantallaCompleta titulo="Grafo de co-ocurrencia"><GrafoCoocurrenciaViz preguntas={preguntas} /></PantallaCompleta></LazySection></div>

                {/* ————— ⚠️ DIFICULTAD Y TRAMPAS ————— */}
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', padding: '0 0 4px 4px', borderBottom: '1px solid var(--border-secondary)' }}>
                    ⚠️ Dificultad y trampas
                </div>
                <div id="sec-dificultad" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><DificultadCruzada preguntas={preguntas} /></LazySection></div>
                <div id="sec-posicion" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><AnalisisPosicionComp preguntas={preguntas} /></LazySection></div>
                <div id="sec-distractores" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><AnalisisDistractores preguntas={preguntas} /></LazySection></div>
                <div id="sec-confusion" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><AnalisisConfusion preguntas={preguntas} /></LazySection></div>
                <div id="sec-anuladas" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><AnalisisAnuladas preguntas={preguntas} /></LazySection></div>
                <div id="sec-duplicados" style={SCROLL_MARGIN_STYLE}>
                    <LazySection fallbackHeight={300} forceVisible={forceAllVisible}>
                        <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
                            <h2 className="text-lg font-bold text-heading mb-4">Detección de duplicados y patrones</h2>
                            <Duplicados preguntas={preguntas} />
                        </div>
                    </LazySection>
                </div>

                {/* ————— 🔬 RIGOR ESTADÍSTICO ————— */}
                <div style={{ fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--text-tertiary)', padding: '0 0 4px 4px', borderBottom: '1px solid var(--border-secondary)' }}>
                    🔬 Rigor estadístico
                </div>
                <div id="sec-chi" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><ChiCuadrado preguntas={preguntas} /></LazySection></div>
                <div id="sec-chiseg" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><ChiSegmentado preguntas={preguntas} /></LazySection></div>
                <div id="sec-correlacion" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><PantallaCompleta titulo="Correlación entre categorías"><MatrizCorrelacion preguntas={preguntas} /></PantallaCompleta></LazySection></div>
                <div id="sec-patrones" style={SCROLL_MARGIN_STYLE}><LazySection forceVisible={forceAllVisible}><PatronesOrganismo preguntas={preguntas} /></LazySection></div>
            </div>
        </div>
    );
};
