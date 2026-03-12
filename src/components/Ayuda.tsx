import React from 'react';
import { FileSpreadsheet, FolderTree, Info, BookOpen, Layers, FileText, AppWindow } from 'lucide-react';

export const Ayuda: React.FC = () => {
    // Estilos reutilizables con variables CSS para modo claro/oscuro
    const cardStyle: React.CSSProperties = {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: '12px',
        border: '1px solid var(--border-secondary)',
        overflow: 'hidden',
    };

    const cardHeaderBase: React.CSSProperties = {
        padding: '16px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        borderBottom: '1px solid var(--border-secondary)',
    };

    const h2Style: React.CSSProperties = {
        fontSize: '18px',
        fontWeight: 700,
        color: 'var(--text-primary)',
        letterSpacing: '-0.01em',
    };

    const levelCard = (
        borderColor: string,
        accentColor: string,
        icon: React.ReactNode,
        num: string,
        title: string,
        subtitle: string,
        items: { label: string; muted?: boolean }[]
    ) => (
        <div style={{
            display: 'flex', flexDirection: 'column', height: '100%',
            backgroundColor: 'var(--bg-secondary)', borderRadius: '8px',
            border: `1px solid ${borderColor}`, overflow: 'hidden',
        }}>
            <div style={{
                padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '10px',
                borderBottom: `1px solid ${borderColor}`,
            }}>
                <div style={{
                    width: '32px', height: '32px', borderRadius: '50%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    backgroundColor: accentColor, color: '#fff',
                }}>
                    {icon}
                </div>
                <div>
                    <h3 style={{ fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.2 }}>{num}. {title}</h3>
                    <p style={{ fontSize: '11px', color: 'var(--text-secondary)', fontWeight: 500 }}>{subtitle}</p>
                </div>
            </div>
            <div style={{ padding: '14px 16px', flexGrow: 1, backgroundColor: 'var(--bg-tertiary)' }}>
                <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {items.map((item, i) => (
                        <li key={i} style={{
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontSize: '13px',
                            color: item.muted ? 'var(--text-tertiary)' : 'var(--text-primary)',
                            fontWeight: item.muted ? 400 : 500,
                            fontStyle: item.muted ? 'italic' : 'normal',
                        }}>
                            <span style={{
                                width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                                backgroundColor: item.muted ? 'var(--text-tertiary)' : accentColor,
                            }} />
                            {item.label}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '48px' }}>

            {/* ═══ TAXONOMÍA ═══ */}
            <div style={cardStyle}>
                <div style={{ ...cardHeaderBase, background: 'var(--bg-tertiary)' }}>
                    <FolderTree className="w-6 h-6" style={{ color: 'var(--accent-primary)' }} />
                    <h2 style={h2Style}>Taxonomía y Clasificación Oficial</h2>
                </div>
                <div style={{ padding: '24px' }}>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.7, maxWidth: '700px', fontSize: '14px' }}>
                        El sistema clasifica los conceptos de estudio y las preguntas a través de una rigurosa jerarquía
                        temática de <strong style={{ color: 'var(--text-primary)' }}>cuatro niveles</strong>.
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
                        {levelCard(
                            'var(--border-primary)', '#4f46e5',
                            <BookOpen size={14} />, '1', 'Materias', 'Nivel General',
                            [
                                { label: 'Informática' }, { label: 'Seguridad' }, { label: 'Administración electrónica' },
                                { label: 'Legislación' }, { label: 'Psicotécnicos' }, { label: 'Comunicación' },
                                { label: 'Varia', muted: true },
                            ]
                        )}
                        {levelCard(
                            'var(--border-primary)', '#2563eb',
                            <Layers size={14} />, '2', 'Bloques', 'Subdivisión Analítica',
                            [
                                { label: 'Hardware' }, { label: 'Software' }, { label: 'Redes' },
                                { label: 'Seguridad Informática' }, { label: 'Análisis de datos' },
                                { label: 'Administración electrónica' }, { label: 'Protección de datos' },
                                { label: '+ Salud, PRL, Reprografía…', muted: true },
                            ]
                        )}
                        {levelCard(
                            'var(--border-primary)', '#059669',
                            <FileText size={14} />, '3', 'Temas', 'Concepto Específico',
                            [
                                { label: 'Software de sistema' }, { label: 'Procesador de texto' },
                                { label: 'Hoja de cálculo' }, { label: 'Sistema gestor de BD' },
                                { label: 'Cliente de correo' }, { label: 'Cliente de páginas web' },
                            ]
                        )}
                        {levelCard(
                            'var(--border-primary)', '#d97706',
                            <AppWindow size={14} />, '4', 'Aplicaciones', 'Software o Estándar Real',
                            [
                                { label: 'Windows 10' }, { label: 'Windows 11' },
                                { label: 'Word 365' }, { label: 'Excel 365' },
                                { label: 'Access 365' }, { label: 'Outlook 365 Clásico' },
                                { label: 'Writer 25.2' }, { label: 'Calc 25.2' },
                            ]
                        )}
                    </div>
                </div>
            </div>

            {/* ═══ FORMATO CSV ═══ */}
            <div style={cardStyle}>
                <div style={{ ...cardHeaderBase, background: 'var(--bg-tertiary)' }}>
                    <FileSpreadsheet className="w-6 h-6" style={{ color: 'var(--accent-success)' }} />
                    <h2 style={h2Style}>Formato y Cabeceras del CSV</h2>
                </div>
                <div style={{ padding: '24px' }}>

                    {/* Aviso */}
                    <div style={{
                        display: 'flex', alignItems: 'flex-start', gap: '12px',
                        padding: '14px 16px', borderRadius: '8px', marginBottom: '24px',
                        backgroundColor: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)',
                    }}>
                        <Info className="w-5 h-5" style={{ color: 'var(--accent-warning)', flexShrink: 0, marginTop: '2px' }} />
                        <p style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.6 }}>
                            El motor de ingesta requiere un archivo de texto plano <code style={{
                                backgroundColor: 'var(--bg-hover)', padding: '2px 6px', borderRadius: '4px',
                                fontWeight: 700, border: '1px solid var(--border-primary)', fontSize: '12px',
                            }}>.csv</code>. El delimitador estricto es el carácter tubería (<code style={{
                                backgroundColor: 'var(--bg-hover)', padding: '2px 6px', borderRadius: '4px',
                                fontWeight: 700, fontFamily: 'monospace', border: '1px solid var(--border-primary)', fontSize: '12px',
                            }}>|</code>).
                        </p>
                    </div>

                    {/* Tabla de campos */}
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid var(--border-primary)' }}>
                                    {['Campo (Cabecera)', 'Obligatorio', 'Descripción y Uso Analítico'].map(h => (
                                        <th key={h} style={{
                                            padding: '10px 14px', textAlign: 'left', fontSize: '11px', fontWeight: 700,
                                            color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em',
                                            backgroundColor: 'var(--bg-tertiary)',
                                        }}>{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {[
                                    { campo: 'ejercicio', oblig: 'Sí', color: 'var(--accent-success)', desc: 'Código del metadato (ej. INAP_AUX_21_LI_1A_EXT). De aquí se extrae el organismo, año, turno, etc.' },
                                    { campo: 'año', oblig: 'No (Fallback)', color: 'var(--accent-warning)', desc: 'Si no se provee, se intentará deducir del campo ejercicio. Vital para la regresión lineal.' },
                                    { campo: 'numero', oblig: 'Sí', color: 'var(--accent-success)', desc: 'Id original de la pregunta en la plantilla física del examen.' },
                                    { campo: 'materia', oblig: 'Sí', color: 'var(--accent-success)', desc: 'Nivel 1 de la taxonomía (ej. «informática», «legislación»). Obligatorio.' },
                                    { campo: 'bloque', oblig: 'Opcional', color: 'var(--text-tertiary)', desc: 'Nivel 2: subdivisión analítica dentro de la materia (ej. «Hardware», «Redes»).' },
                                    { campo: 'tema', oblig: 'Opcional', color: 'var(--text-tertiary)', desc: 'Nivel 3: concepto específico dentro del bloque (ej. «Hoja de cálculo»).' },
                                    { campo: 'aplicacion', oblig: 'Opcional', color: 'var(--text-tertiary)', desc: 'Nivel 4: software o estándar concreto (ej. «Excel», «Word»). Se normaliza automáticamente.' },
                                    { campo: 'pregunta', oblig: 'Sí', color: 'var(--accent-success)', desc: 'El enunciado literal propuesto por el Tribunal.' },
                                    { campo: 'respuesta_a', oblig: 'Sí', color: 'var(--accent-success)', desc: 'Texto literal de la alternativa A.' },
                                    { campo: 'respuesta_b', oblig: 'Sí', color: 'var(--accent-success)', desc: 'Texto literal de la alternativa B.' },
                                    { campo: 'respuesta_c', oblig: 'Sí', color: 'var(--accent-success)', desc: 'Texto literal de la alternativa C.' },
                                    { campo: 'respuesta_d', oblig: 'Sí', color: 'var(--accent-success)', desc: 'Texto literal de la alternativa D. Las vacías o erróneas se catalogan como distractores.' },
                                    { campo: 'correcta', oblig: 'Sí*', color: 'var(--accent-success)', desc: 'Letra exacta («A», «B», «C» o «D»). Imprescindible para el estadístico Chi-Cuadrado. *Salvo que esté anulada.' },
                                    { campo: 'anulada', oblig: 'Opcional', color: 'var(--text-tertiary)', desc: 'Escribir VERDADERO si ha sido impugnada. Computa para el cálculo de dificultad.' },
                                    { campo: 'observaciones', oblig: 'Opcional', color: 'var(--text-tertiary)', desc: 'Texto libre para anotaciones. Se preserva en la importación y la exportación.' },
                                ].map((row, i) => (
                                    <tr key={row.campo} style={{
                                        borderBottom: '1px solid var(--border-secondary)',
                                        backgroundColor: i % 2 === 1 ? 'var(--bg-tertiary)' : 'transparent',
                                    }}>
                                        <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{row.campo}</td>
                                        <td style={{ padding: '10px 14px', fontWeight: 600, color: row.color }}>{row.oblig}</td>
                                        <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{row.desc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
