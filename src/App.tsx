import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Upload, Sun, Moon, FileSpreadsheet, ChevronUp } from 'lucide-react';
import { procesarCSV, parsearCatalogo, csvTieneIdCuestionario } from './utils/parser';
import type { DatasetAnalisis, Pregunta, CuestionarioMeta } from './types';
import { useFiltros } from './hooks/useFiltros';
import { useFiltrosCatalogo } from './hooks/useFiltrosCatalogo';
import { AppHeader, type Vista } from './components/layout/AppHeader';
import { BarraFiltros } from './components/layout/BarraFiltros';
import { PanelEstadisticas } from './components/layout/PanelEstadisticas';
import { ModalPregunta } from './components/layout/ModalPregunta';
import { ModalCuestionarioId } from './components/layout/ModalCuestionarioId';
import { Resumen } from './components/Resumen';
import { TablaPreguntas } from './components/TablaPreguntas';
import { VisorDataset } from './components/VisorDataset';
import { Generador } from './components/Generador';
import { BusquedaSemantica } from './components/BusquedaSemantica';
import { Comparativa } from './components/Comparativa';
import { ExamenSimulado } from './components/ExamenSimulado';
import { Ayuda } from './components/Ayuda';
import { CatalogoCuestionarios } from './components/CatalogoCuestionarios';
import { guardarDataset, recuperarDataset, guardarCatalogo, recuperarCatalogo } from './utils/storage';
import { descargarInforme } from './utils/generarInforme';
import Papa from 'papaparse';

// Claves editables de Pregunta — protege contra prototype pollution en guardarEdicion
const ALLOWED_EDICION_KEYS = new Set<string>([
  'materia', 'bloque', 'tema', 'aplicacion',
  'enunciado', 'opciones', 'correcta', 'anulada',
  'observaciones', 'conceptos_clave',
]);

function App() {
  // ——— Dataset ———
  const [dataset, setDataset] = useState<DatasetAnalisis | null>(null);
  const [loading, setLoading] = useState(false);
  const [nombresArchivos, setNombresArchivos] = useState<string[]>([]);

  // ——— Catálogo de cuestionarios ———
  const [catalogo, setCatalogo] = useState<CuestionarioMeta[]>([]);

  // ——— Modal para pedir id_cuestionario ———
  const [modalIdAbierto, setModalIdAbierto] = useState(false);
  const [archivosEnEspera, setArchivosEnEspera] = useState<{ file: File; idCuestionario: string }[]>([]);

  // ——— Ediciones inline ———
  const [ediciones, setEdiciones] = useState<Record<string, Partial<Pregunta>>>({});

  // ——— Modo oscuro ———
  const [dark, setDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
    localStorage.setItem('theme', dark ? 'dark' : 'light');
  }, [dark]);

  // ——— Estado para expandir tarjeta de pregunta ———
  const [preguntaAExpandir, setPreguntaAExpandir] = useState<string | null>(null);

  // ——— Vista activa ———
  const [vistaActual, setVistaActual] = useState<Vista>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('vistaActual');
      if (stored) return stored as Vista;
    }
    return 'resumen';
  });

  useEffect(() => {
    localStorage.setItem('vistaActual', vistaActual);
  }, [vistaActual]);

  // ——— Botón Ir arriba ———
  const [mostrarIrArriba, setMostrarIrArriba] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setMostrarIrArriba(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ——— Cerrar el modal con ESC ———
  useEffect(() => {
    if (!preguntaAExpandir) return;
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreguntaAExpandir(null);
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [preguntaAExpandir]);

  // ——— Preguntas con ediciones aplicadas ———
  const preguntasEditadas = useMemo(() => {
    if (!dataset) return [];
    return dataset.preguntas.map(p => {
      const edit = ediciones[p.id];
      return edit ? { ...p, ...edit } : p;
    });
  }, [dataset, ediciones]);

  // ——— Hooks de filtros ———
  const catFiltros = useFiltrosCatalogo(catalogo);
  const filtros = useFiltros({
    preguntasEditadas,
    catalogoFiltrado: catFiltros.catalogoFiltrado,
    hayFiltrosCatalogo: catFiltros.hayFiltrosCatalogo,
  });

  // ——— Carga de archivos ———
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const checks = await Promise.all(files.map(async f => ({
      file: f,
      tieneId: await csvTieneIdCuestionario(f),
    })));

    const sinId = checks.filter(c => !c.tieneId);
    if (sinId.length > 0) {
      setArchivosEnEspera(checks.map(c => ({ file: c.file, idCuestionario: c.tieneId ? '' : '' })));
      setModalIdAbierto(true);
      return;
    }

    await procesarArchivos(files.map(f => ({ file: f })));
  };

  const procesarArchivos = async (archivos: { file: File; idCuestionario?: string }[]) => {
    setLoading(true);
    try {
      const resultados = await Promise.all(
        archivos.map(a => procesarCSV(a.file, a.idCuestionario))
      );

      const nuevasPreguntas = resultados.flatMap(r => r.preguntas);
      const nuevosConceptos = resultados.flatMap(r => r.conceptos_globales);
      const nuevosEjercicios = resultados.flatMap(r => r.ejercicios_unicos);
      const nuevosCuestionarios = resultados.flatMap(r => r.cuestionarios_cargados);
      const nombres = archivos.map(a => a.file.name);

      const nuevoDataset: DatasetAnalisis = {
        preguntas: dataset ? [...dataset.preguntas, ...nuevasPreguntas] : nuevasPreguntas,
        conceptos_globales: dataset ? [...dataset.conceptos_globales, ...nuevosConceptos] : nuevosConceptos,
        ejercicios_unicos: Array.from(new Set([...(dataset?.ejercicios_unicos || []), ...nuevosEjercicios])),
        cuestionarios_cargados: Array.from(new Set([...(dataset?.cuestionarios_cargados || []), ...nuevosCuestionarios])),
      };

      setDataset(nuevoDataset);
      setNombresArchivos(prev => [...prev, ...nombres]);
      setEdiciones({});
      guardarDataset(nuevoDataset, [...nombresArchivos, ...nombres]).catch(() => { });
    } catch (error) {
      console.error('Error procesando archivo:', error);
    } finally {
      setLoading(false);
    }
  };

  const confirmarModalId = async () => {
    const valido = archivosEnEspera.every(a => a.idCuestionario.trim() !== '');
    if (!valido) return;
    setModalIdAbierto(false);
    await procesarArchivos(archivosEnEspera.map(a => ({ file: a.file, idCuestionario: a.idCuestionario || undefined })));
    setArchivosEnEspera([]);
  };

  // ——— Carga de catálogo CSV ———
  const handleCargarCatalogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const nuevoCatalogo = await parsearCatalogo(file);
      setCatalogo(nuevoCatalogo);
      guardarCatalogo(nuevoCatalogo).catch(() => { });
    } catch (error) {
      console.error('Error procesando catálogo:', error);
    }
  };

  // ——— Restaurar sesión automáticamente ———
  useEffect(() => {
    recuperarDataset().then(result => {
      if (result && !dataset) {
        setDataset(result.data);
        setNombresArchivos(result.nombreArchivos);
      }
    }).catch(() => { });
    recuperarCatalogo().then(cat => {
      if (cat) setCatalogo(cat);
    }).catch(() => { });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ——— Guardar edición de una pregunta ———
  const guardarEdicion = useCallback((id: string, cambios: Partial<Pregunta>) => {
    const cambiosValidados = Object.fromEntries(
      Object.entries(cambios).filter(([k]) => ALLOWED_EDICION_KEYS.has(k))
    ) as Partial<Pregunta>;
    setEdiciones(prev => ({
      ...prev,
      [id]: { ...(prev[id] || {}), ...cambiosValidados },
    }));
  }, []);

  // ——— Navegación a pregunta (modal) ———
  const navegarAPregunta = useCallback((id: string) => {
    setPreguntaAExpandir(id);
  }, []);

  // ——— Descarga CSV corregido ———
  const descargarCSV = () => {
    const rows = preguntasEditadas.map(p => ({
      id_cuestionario: p.id_cuestionario,
      ejercicio: p.id.split('_').slice(0, -1).join('_'),
      año: p.metadatos.año,
      numero: p.numero_original,
      materia: p.materia,
      bloque: p.bloque,
      tema: p.tema,
      aplicacion: p.aplicacion,
      pregunta: p.enunciado,
      respuesta_a: p.opciones.A || '',
      respuesta_b: p.opciones.B || '',
      respuesta_c: p.opciones.C || '',
      respuesta_d: p.opciones.D || '',
      correcta: p.correcta || '',
      anulada: p.anulada ? 'VERDADERO' : 'FALSO',
      observaciones: p.observaciones || '',
    }));

    const csv = Papa.unparse(rows, { delimiter: '|', header: true });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dataset_corregido_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  // ——— Exportar filtrado ———
  const exportarFiltrado = () => {
    if (filtros.preguntasFiltradas.length === 0) return;
    const rows = filtros.preguntasFiltradas.map(p => ({
      id_cuestionario: p.id_cuestionario,
      ejercicio: p.id.split('_').slice(0, -1).join('_'),
      año: p.metadatos.año,
      numero: p.numero_original,
      materia: p.materia,
      bloque: p.bloque,
      tema: p.tema,
      aplicacion: p.aplicacion,
      pregunta: p.enunciado,
      respuesta_a: p.opciones.A || '',
      respuesta_b: p.opciones.B || '',
      respuesta_c: p.opciones.C || '',
      respuesta_d: p.opciones.D || '',
      correcta: p.correcta || '',
      anulada: p.anulada ? 'VERDADERO' : 'FALSO',
      observaciones: p.observaciones || '',
    }));
    const csv = Papa.unparse(rows, { delimiter: '|', header: true });
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `dataset_filtrado_${filtros.preguntasFiltradas.length}preg_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
  };

  const totalEdiciones = Object.keys(ediciones).length;

  // ——— Callbacks de navegación desde modal ———
  const crearFiltroDesdeModal = useCallback((setter: (v: string[]) => void) => {
    return (valor: string) => {
      setter([valor]);
      setVistaActual('ejercicios');
      setPreguntaAExpandir(null);
    };
  }, []);

  // ═══════════════════════════════════════════
  // PANTALLA DE CARGA INICIAL
  // ═══════════════════════════════════════════
  if (!dataset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-app p-4">
        <div className="max-w-xl w-full bg-card p-8 rounded-xl shadow-lg border" style={{ borderColor: 'var(--border-secondary)' }}>
          <div className="text-center">
            <button
              onClick={() => setDark(!dark)}
              className="absolute top-4 right-4 p-2 rounded-lg bg-muted text-body hover:bg-hover-custom transition-colors"
              aria-label={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
            >
              {dark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <Upload className="w-12 h-12 mx-auto mb-4" style={{ color: 'var(--accent-primary)' }} />
            <h1 className="text-2xl font-bold text-heading mb-2">Análisis Estratégico de Oposiciones</h1>
            <p className="text-body mb-6">Herramienta de análisis para optimizar la preparación</p>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <label
                className="cursor-pointer inline-flex items-center gap-2 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                {loading ? 'Procesando…' : 'Seleccionar CSV de preguntas'}
                <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} disabled={loading} />
              </label>
              <label
                className="cursor-pointer inline-flex items-center gap-2 px-5 py-3 rounded-lg font-semibold transition-colors border"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', backgroundColor: 'var(--bg-secondary)' }}
              >
                <FileSpreadsheet className="w-4 h-4" />
                {catalogo.length > 0 ? `Catálogo (${catalogo.length})` : 'Cargar catálogo CSV'}
                <input type="file" accept=".csv" className="hidden" onChange={handleCargarCatalogo} />
              </label>
            </div>
            <p className="text-xs text-muted mt-4">Formato CSV con delimitador «|» · Se pueden seleccionar varios archivos de preguntas a la vez</p>
          </div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════
  // INTERFAZ PRINCIPAL
  // ═══════════════════════════════════════════
  return (
    <div className="min-h-screen bg-app">
      {/* ———— HEADER ———— */}
      <AppHeader
        nombresArchivos={nombresArchivos}
        totalPreguntas={preguntasEditadas.length}
        totalEjercicios={dataset.ejercicios_unicos.length}
        totalCuestionarios={(dataset.cuestionarios_cargados || []).length}
        totalEdiciones={totalEdiciones}
        hayFiltrosActivos={filtros.hayFiltrosActivos}
        totalFiltradas={filtros.preguntasFiltradas.length}
        vistaActual={vistaActual}
        dark={dark}
        loading={loading}
        onExportarFiltrado={exportarFiltrado}
        onDescargarInforme={() => descargarInforme(filtros.preguntasFiltradas, nombresArchivos.join(', '))}
        onDescargarCSV={descargarCSV}
        onToggleDark={() => setDark(!dark)}
        onReemplazar={() => { setDataset(null); setEdiciones({}); setNombresArchivos([]); }}
        onFileUpload={handleFileUpload}
        onSetVista={setVistaActual}
      />

      {/* ———— FILTROS GLOBALES ———— */}
      {vistaActual !== 'ayuda' && vistaActual !== 'generador' && vistaActual !== 'catalogo' && (
        <BarraFiltros
          totalFiltradas={filtros.preguntasFiltradas.length}
          totalDataset={dataset?.preguntas.length ?? 0}
          hayFiltrosActivos={filtros.hayFiltrosActivos}
          disponibles={filtros.disponibles}
          state={filtros.state}
          setMaterias={filtros.setMaterias}
          setBloques={filtros.setBloques}
          setTemas={filtros.setTemas}
          setAplicaciones={filtros.setAplicaciones}
          setCorrectas={filtros.setCorrectas}
          setAnulada={filtros.setAnulada}
          setAños={filtros.setAños}
          setOrganismos={filtros.setOrganismos}
          setEscalas={filtros.setEscalas}
          setAccesos={filtros.setAccesos}
          setEjercicios={filtros.setEjercicios}
          setCuestionarios={filtros.setCuestionarios}
          setBusqueda={filtros.setBusqueda}
          limpiar={filtros.limpiar}
          limpiarCatalogo={catFiltros.limpiar}
        />
      )}

      {/* ———— CONTENIDO PRINCIPAL ———— */}
      <main className="max-w-[1400px] mx-auto p-4 lg:p-6">

        {vistaActual === 'resumen' && (
          <div id="panel-resumen" role="tabpanel" className="animate-fade-slide">
            <Resumen preguntas={filtros.preguntasFiltradas} />
          </div>
        )}

        {vistaActual === 'estadisticas' && (
          <PanelEstadisticas
            preguntas={filtros.preguntasFiltradas}
            onVerPregunta={navegarAPregunta}
            setMaterias={filtros.setMaterias}
          />
        )}

        {vistaActual === 'ejercicios' && (
          <div id="panel-ejercicios" role="tabpanel" className="animate-fade-slide space-y-6">
            <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
              <h2 className="text-lg font-bold text-heading mb-4">
                Cuestionarios y Distractores ({filtros.preguntasFiltradas.length} resultados)
              </h2>
              <TablaPreguntas
                preguntas={filtros.preguntasFiltradas}
                onGuardarEdicion={guardarEdicion}
                onFiltrarMateria={(m) => filtros.setMaterias([m])}
                onFiltrarBloque={(b) => filtros.setBloques([b])}
                onFiltrarTema={(t) => filtros.setTemas([t])}
                onFiltrarAplicacion={(a) => filtros.setAplicaciones([a])}
                onFiltrarAño={(a) => filtros.setAños([a])}
                onFiltrarEscala={(e) => filtros.setEscalas([e])}
                onFiltrarAcceso={(a) => filtros.setAccesos([a])}
                onFiltrarEjercicio={(e) => filtros.setEjercicios([e])}
                preguntaExpandida={preguntaAExpandir}
              />
            </div>
          </div>
        )}

        {vistaActual === 'tabla' && (
          <div id="panel-tabla" role="tabpanel" className="animate-fade-slide">
            <VisorDataset preguntas={filtros.preguntasFiltradas} onVerPregunta={navegarAPregunta} />
          </div>
        )}

        {vistaActual === 'generador' && (
          <div id="panel-generador" role="tabpanel" className="animate-fade-slide">
            <Generador preguntas={filtros.preguntasFiltradas} />
          </div>
        )}

        {vistaActual === 'conceptos' && (
          <div id="panel-conceptos" role="tabpanel" className="animate-fade-slide">
            <div className="bg-card border rounded-xl p-6" style={{ borderColor: 'var(--border-secondary)' }}>
              <h2 className="text-lg font-bold text-heading mb-4">Búsqueda Semántica por Concepto</h2>
              <BusquedaSemantica preguntas={filtros.preguntasFiltradas} onVerPregunta={navegarAPregunta} />
            </div>
          </div>
        )}

        {vistaActual === 'comparativa' && (
          <div id="panel-comparativa" role="tabpanel" className="animate-fade-slide">
            <Comparativa preguntas={filtros.preguntasFiltradas} />
          </div>
        )}

        {vistaActual === 'simulacro' && (
          <div id="panel-simulacro" role="tabpanel" className="animate-fade-slide">
            <ExamenSimulado preguntas={filtros.preguntasFiltradas} />
          </div>
        )}

        {vistaActual === 'ayuda' && (
          <div id="panel-ayuda" role="tabpanel" className="animate-fade-slide">
            <Ayuda />
          </div>
        )}

        {vistaActual === 'catalogo' && (
          <div id="panel-catalogo" role="tabpanel" className="animate-fade-slide">
            <CatalogoCuestionarios
              catalogo={catalogo}
              catalogoFiltradoGlobal={catFiltros.catalogoFiltrado}
              cuestionariosCargados={dataset?.cuestionarios_cargados || []}
              onCargarCatalogo={handleCargarCatalogo}
              onVerCuestionario={(id) => { filtros.setCuestionarios([id]); setVistaActual('ejercicios'); }}
              catVersionesDisponibles={catFiltros.disponibles.versiones} catVersionesActivas={catFiltros.state.versiones} setCatVersionesActivas={catFiltros.setVersiones}
              catTiposDisponibles={catFiltros.disponibles.tipos} catTiposActivos={catFiltros.state.tipos} setCatTiposActivos={catFiltros.setTipos}
              catEstadosDisponibles={catFiltros.disponibles.estados} catEstadosActivos={catFiltros.state.estados} setCatEstadosActivos={catFiltros.setEstados}
              catSODisponibles={catFiltros.disponibles.so} catSOActivos={catFiltros.state.so} setCatSOActivos={catFiltros.setSo}
              catOfimaticaDisponibles={catFiltros.disponibles.ofimatica} catOfimaticaActiva={catFiltros.state.ofimatica} setCatOfimaticaActiva={catFiltros.setOfimatica}
            />
          </div>
        )}
      </main>

      {/* ———— BOTONES FLOTANTES ———— */}
      {mostrarIrArriba && (
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 items-center">
          {vistaActual === 'ejercicios' && (
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('contraerTodasLasFichas'))}
              className="p-3 rounded-full shadow-lg border bg-card text-muted hover:text-heading transition-all flex items-center justify-center"
              style={{ borderColor: 'var(--border-secondary)' }}
              aria-label="Contraer todas las fichas"
              title="Contraer todas"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="4 14 10 14 10 20" />
                <polyline points="20 10 14 10 14 4" />
                <line x1="14" y1="10" x2="21" y2="3" />
                <line x1="3" y1="21" x2="10" y2="14" />
              </svg>
            </button>
          )}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="p-3 rounded-full shadow-lg border bg-card text-muted hover:text-heading transition-all flex items-center justify-center"
            style={{ borderColor: 'var(--border-secondary)' }}
            aria-label="Ir arriba"
            title="Ir arriba"
          >
            <ChevronUp className="w-6 h-6" />
          </button>
        </div>
      )}

      {/* ——— MODALES ——— */}
      {preguntaAExpandir && dataset && (
        <ModalPregunta
          preguntaId={preguntaAExpandir}
          preguntas={dataset.preguntas}
          preguntasNavegacion={filtros.preguntasFiltradas}
          cuestionarioNombre={catalogo.find(c => c.id_cuestionario === dataset.preguntas.find(p => p.id === preguntaAExpandir)?.id_cuestionario)?.cuestionario}
          onNavegar={setPreguntaAExpandir}
          onCerrar={() => setPreguntaAExpandir(null)}
          onGuardarEdicion={guardarEdicion}
          onFiltrarMateria={crearFiltroDesdeModal(filtros.setMaterias)}
          onFiltrarBloque={crearFiltroDesdeModal(filtros.setBloques)}
          onFiltrarTema={crearFiltroDesdeModal(filtros.setTemas)}
          onFiltrarAplicacion={crearFiltroDesdeModal(filtros.setAplicaciones)}
          onFiltrarAño={crearFiltroDesdeModal(filtros.setAños)}
          onFiltrarEscala={crearFiltroDesdeModal(filtros.setEscalas)}
          onFiltrarAcceso={crearFiltroDesdeModal(filtros.setAccesos)}
          onFiltrarEjercicio={crearFiltroDesdeModal(filtros.setEjercicios)}
        />
      )}

      {modalIdAbierto && (
        <ModalCuestionarioId
          archivosEnEspera={archivosEnEspera}
          catalogo={catalogo}
          onCambiarId={(i, id) => {
            const copia = [...archivosEnEspera];
            copia[i] = { ...copia[i], idCuestionario: id };
            setArchivosEnEspera(copia);
          }}
          onConfirmar={confirmarModalId}
          onCancelar={() => { setModalIdAbierto(false); setArchivosEnEspera([]); }}
        />
      )}
    </div>
  );
}

export default App;
