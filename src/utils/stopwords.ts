/**
 * Lista centralizada y exhaustiva de stopwords para el análisis
 * de preguntas de oposiciones en español.
 *
 * Incluye lista fija + filtrado dinámico por sufijos verbales.
 */

const STOPWORDS_ARRAY = [
    // ─── Artículos ─────────────────────────────────
    'el', 'la', 'los', 'las', 'un', 'una', 'unos', 'unas', 'lo', 'al', 'del',

    // ─── Preposiciones ─────────────────────────────
    'a', 'ante', 'bajo', 'con', 'contra', 'de', 'desde', 'en',
    'entre', 'hacia', 'hasta', 'para', 'por', 'según', 'segun',
    'sin', 'sobre', 'tras', 'mediante', 'durante',

    // ─── Conjunciones ──────────────────────────────
    'y', 'e', 'o', 'u', 'ni', 'que', 'pero', 'sino', 'aunque',
    'porque', 'pues', 'como', 'cuando', 'donde', 'si', 'mas',

    // ─── Pronombres ────────────────────────────────
    'yo', 'tu', 'el', 'ella', 'ello', 'nosotros', 'vosotros', 'ellos', 'ellas',
    'me', 'te', 'se', 'nos', 'os', 'le', 'les',
    'mi', 'mis', 'su', 'sus', 'nuestro', 'nuestra', 'nuestros', 'nuestras',
    'este', 'esta', 'estos', 'estas', 'ese', 'esa', 'esos', 'esas',
    'aquel', 'aquella', 'aquellos', 'aquellas',
    'algo', 'alguien', 'nada', 'nadie', 'todo', 'toda', 'todos', 'todas',
    'otro', 'otra', 'otros', 'otras', 'mismo', 'misma', 'mismos', 'mismas',
    'cual', 'cuales',

    // ─── Interrogativos ────────────────────────────
    'qué', 'que', 'quién', 'quien', 'quienes', 'cuál', 'cual', 'cuáles',
    'cómo', 'como', 'dónde', 'donde', 'cuándo', 'cuando', 'cuánto', 'cuánta',

    // ─── Adverbios ─────────────────────────────────
    'no', 'sí', 'si', 'ya', 'más', 'mas', 'menos', 'muy', 'también',
    'solo', 'sólo', 'aún', 'aun', 'además', 'nunca', 'siempre',
    'bien', 'mal', 'aquí', 'ahí', 'allí', 'así', 'entonces', 'después',
    'antes', 'luego',

    // ─── Verbos funcionales (todas las conjugaciones comunes) ────
    'ser', 'soy', 'eres', 'es', 'somos', 'sois', 'son',
    'era', 'eras', 'eran', 'fue', 'fueron', 'sido', 'siendo',
    'será', 'serán', 'sería', 'sean', 'sea',
    'estar', 'estoy', 'está', 'están', 'estamos', 'estaba', 'estaban',
    'esté', 'estén', 'estuvo',
    'haber', 'he', 'ha', 'han', 'hemos', 'hay', 'había', 'habían', 'haya', 'hubo',
    'tener', 'tengo', 'tiene', 'tienen', 'tenemos', 'tenía', 'tenga', 'tengan', 'tuvo',
    'poder', 'puedo', 'puede', 'pueden', 'podemos', 'podía', 'podrá', 'podría', 'pudo',
    'deber', 'debo', 'debe', 'deben', 'debemos', 'debía', 'debería',
    'hacer', 'hago', 'hace', 'hacen', 'hacemos', 'hacía', 'hizo', 'hecho',
    'ir', 'voy', 'va', 'van', 'vamos', 'iba', 'iban',
    'dar', 'doy', 'da', 'dan', 'damos', 'dado', 'dio',
    'decir', 'digo', 'dice', 'dicen', 'dicho', 'dijo',
    'ver', 've', 'ven', 'vemos', 'visto',
    'saber', 'sé', 'sabe', 'saben', 'sabemos', 'supo', 'sabía', 'supiera', 'supiese',
    'querer', 'quiero', 'quiere', 'quieren', 'queremos', 'quiso', 'quisiera', 'quisiese', 'querría',
    'poner', 'pongo', 'pone', 'ponen', 'puesto', 'puso', 'pusiera', 'pusiese', 'pondría',
    'llevar', 'llevo', 'lleva', 'llevan', 'llevara', 'llevaría',
    'parecer', 'parece', 'parecen', 'pareciera', 'parecería',
    'conocer', 'conozco', 'conoce', 'conocen', 'conociera',
    'existir', 'existe', 'existen', 'existiera',
    'necesitar', 'necesita', 'necesitan', 'necesitara',
    'venir', 'viene', 'vienen', 'viniera', 'vendría',
    'salir', 'sale', 'salen', 'saliera', 'saldría',
    'creer', 'cree', 'creen', 'creyera', 'creería',
    'pensar', 'piensa', 'piensan', 'pensara', 'pensaría',
    'pasar', 'pasa', 'pasan', 'pasara', 'pasaría',
    'quedar', 'queda', 'quedan', 'quedara', 'quedaría',
    'entrar', 'entra', 'entran', 'entrara',
    'caer', 'cae', 'caen', 'cayera',
    'hablar', 'habla', 'hablan', 'hablara',
    'volver', 'vuelve', 'vuelven', 'volviera', 'volvería',
    'tomar', 'toma', 'toman', 'tomara', 'tomaría',
    'dejar', 'deja', 'dejan', 'dejara', 'dejaría',
    'traer', 'trae', 'traen', 'trajera', 'traería',
    'suponer', 'supone', 'suponen', 'supusiera', 'supondría',
    'ofrecer', 'ofrece', 'ofrecen', 'ofreciera',
    'conseguir', 'consigue', 'consiguen', 'consiguiera',
    'comenzar', 'comienza', 'comienzan',
    'empezar', 'empieza', 'empiezan',
    'acabar', 'acaba', 'acaban',
    'terminar', 'termina', 'terminan',
    'intentar', 'intenta', 'intentan',
    'lograr', 'logra', 'logran',
    'alcanzar', 'alcanza', 'alcanzan',
    'convertir', 'convierte', 'convierten',
    'recoge', 'recogen', 'recoger',
    'perder', 'pierde', 'pierden',
    'ganar', 'gana', 'ganan',
    'ocupar', 'ocupa', 'ocupan',
    'sentar', 'sienta', 'sientan',
    'sentir', 'siente', 'sienten',
    'constar', 'consta', 'constan',
    'constituir', 'constituye', 'constituyen',
    'expresar', 'expresa', 'expresan',
    'regular', 'regula', 'regulan', 'regulado', 'regulada',
    'aprobar', 'aprueba', 'aprueban', 'aprobado', 'aprobada',
    'adoptar', 'adopta', 'adoptan',
    'celebrar', 'celebra', 'celebran',
    'componer', 'compone', 'componen',
    'integrar', 'integra', 'integran', 'integrado',
    'figurar', 'figura', 'figuran',
    'atribuir', 'atribuye', 'atribuyen',
    'asumir', 'asume', 'asumen',
    'prever', 'prevé', 'prevén', 'previsto', 'prevista',
    'ejercer', 'ejerce', 'ejercen',
    'ostentar', 'ostenta', 'ostentan',
    'desempeñar', 'desempeña', 'desempeñan',
    'depender', 'depende', 'dependen',
    'pertenecer', 'pertenece', 'pertenecen',
    'redactar', 'redacta', 'redactan',
    'publicar', 'publica', 'publican', 'publicado', 'publicada',
    'dictar', 'dicta', 'dictan',
    'resolver', 'resuelve', 'resuelven', 'resuelto',
    'recaer', 'recae', 'recaen',
    'carecer', 'carece', 'carecen',
    'proceder', 'procede', 'proceden',
    'remitir', 'remite', 'remiten',
    'velar', 'vela', 'velan',
    'promover', 'promueve', 'promueven',
    'fomentar', 'fomenta', 'fomentan',
    'impulsar', 'impulsa', 'impulsan',
    'garantizar', 'garantiza', 'garantizan',
    'elaborar', 'elabora', 'elaboran', 'elaborado',
    'otorgar', 'otorga', 'otorgan',
    'requerir', 'requiere', 'requieren',
    'solicitar', 'solicita', 'solicitan',
    'formular', 'formula', 'formulan',
    'desarrollar', 'desarrolla', 'desarrollan', 'desarrollado',
    'gestionar', 'gestiona', 'gestionan',
    'administrar', 'administra', 'administran',
    'supervisar', 'supervisa', 'supervisan',
    'coordinar', 'coordina', 'coordinan',
    'dirigir', 'dirige', 'dirigen',
    'definida', 'definido', 'definidos',
    'prevista', 'previsto', 'previstos',
    'compuesta', 'compuesto', 'compuestos',
    'entender', 'entiende', 'entienden',
    'significar', 'significa', 'significan',
    'supuesto', 'supuesta', 'supuestos',

    // ─── Verbos de enunciados de examen ────────────
    'señale', 'señalar', 'indique', 'indicar', 'indica',
    'seleccione', 'seleccionar', 'elija', 'elegir',
    'marque', 'marcar', 'identifique', 'identificar',
    'responda', 'responder', 'conteste', 'contestar',
    'considere', 'considerar', 'determine', 'determinar',
    'complete', 'completar', 'defina', 'definir',
    'explique', 'explicar', 'mencione', 'mencionar',
    'describa', 'describir', 'enumere', 'enumerar',
    'denomine', 'denominar', 'denominado', 'denominada', 'denominados',
    'llamado', 'llamada', 'llamados',
    'referido', 'referida', 'referidos',
    'corresponde', 'corresponden', 'correspondiente', 'correspondientes',
    'relacione', 'relacionar', 'relacionado', 'relacionada',

    // ─── Verbos genéricos (inf + conjugaciones) ────
    'realizar', 'realiza', 'realizan', 'realizado',
    'utilizar', 'utiliza', 'utilizan', 'utilizado',
    'permitir', 'permite', 'permiten', 'permitido',
    'contener', 'contiene', 'contienen', 'contenido', 'contenidos',
    'formar', 'forma', 'forman', 'formado',
    'encontrar', 'encuentra', 'encuentran',
    'establecer', 'establece', 'establecen', 'establecido',
    'obtener', 'obtiene', 'obtienen', 'obtenido',
    'producir', 'produce', 'producen', 'producido',
    'recibir', 'recibe', 'reciben', 'recibido',
    'incluir', 'incluye', 'incluyen', 'incluido', 'incluidos',
    'presentar', 'presenta', 'presentan',
    'mostrar', 'muestra', 'muestran',
    'aparecer', 'aparece', 'aparecen',
    'representar', 'representa', 'representan',
    'servir', 'sirve', 'sirven',
    'tratar', 'trata', 'tratan',
    'referir', 'refiere', 'refieren',
    'aplicar', 'aplica', 'aplican', 'aplicado',
    'consistir', 'consiste', 'consisten',
    'resultar', 'resulta', 'resultan', 'resultado', 'resultados',
    'proporcionar', 'proporciona', 'proporcionan',
    'generar', 'genera', 'generan', 'generado',
    'crear', 'crea', 'crean', 'creado',
    'poseer', 'posee', 'poseen',
    'cumplir', 'cumple', 'cumplen',
    'disponer', 'dispone', 'disponen',
    'contar', 'cuenta', 'cuentan',
    'seguir', 'sigue', 'siguen',
    'mantener', 'mantiene', 'mantienen',
    'llamar', 'llama', 'llaman',
    'abrir', 'abre', 'abren', 'abierto',
    'cerrar', 'cierra', 'cierran', 'cerrado',
    'cambiar', 'cambia', 'cambian',
    'modificar', 'modifica', 'modifican',
    'eliminar', 'elimina', 'eliminan',
    'añadir', 'añade', 'añaden',
    'insertar', 'inserta', 'insertan',
    'copiar', 'copia', 'copian',
    'mover', 'mueve', 'mueven',
    'guardar', 'guarda', 'guardan',
    'configurar', 'configura', 'configuran',
    'ejecutar', 'ejecuta', 'ejecutan',
    'iniciar', 'inicia', 'inician',
    'acceder', 'accede', 'acceden',
    'escribir', 'escribe', 'escriben',
    'leer', 'lee', 'leen',
    'buscar', 'busca', 'buscan',
    'trabajar', 'trabaja', 'trabajan',
    'designar', 'designa', 'designan',
    'situar', 'sitúa', 'sitúan',
    'colocar', 'coloca', 'colocan',

    // ─── Palabras de interfaz / UI ─────────────────
    'clic', 'clci', 'click', 'doble', 'botón', 'boton',
    'pulsar', 'pulsa', 'pinchar', 'pincha',
    'presionar', 'presiona', 'arrastrar', 'arrastra', 'soltar', 'suelta',
    'seleccionar', 'selecciona',
    'desplegar', 'despliega',
    'pestaña', 'pestana', 'pestañas',
    'menú', 'menu', 'menús',
    'barra', 'barras', 'ventana', 'ventanas',
    'cuadro', 'cuadros', 'panel', 'paneles',
    'icono', 'iconos', 'herramienta', 'herramientas',
    'ratón', 'raton', 'teclado',

    // ─── Vocabulario genérico de exámenes ──────────
    'pregunta', 'preguntas', 'respuesta', 'respuestas',
    'opción', 'opcion', 'opciones',
    'comillas', 'describe',
    'correcta', 'correctas', 'correcto', 'correctos',
    'incorrecta', 'incorrectas', 'incorrecto', 'incorrectos',
    'verdadera', 'verdaderas', 'verdadero', 'verdaderos',
    'falsa', 'falsas', 'falso', 'falsos',
    'afirmación', 'afirmacion', 'afirmaciones',
    'siguiente', 'siguientes', 'anterior', 'anteriores',
    'respecto', 'relación', 'relacion',
    'cuestion', 'cuestión', 'cuestiones',
    'enunciado', 'enunciados',
    'alternativa', 'alternativas',
    'ejemplo', 'ejemplos',
    'puede', 'cambiar', 'tabla', 'permite', 'necesario', 'elementos',
    'texto', 'pueden', 'diseño', 'opciones',

    // ─── Palabras genéricas / abstractas ───────────
    'tipo', 'tipos', 'modo', 'modos', 'forma', 'formas',
    'parte', 'partes', 'clase', 'clases',
    'caso', 'casos', 'vez', 'veces',
    'manera', 'maneras', 'punto', 'puntos',
    'lugar', 'lugares', 'hecho', 'hechos',
    'cosa', 'cosas', 'medio', 'medios',
    'fin', 'fines', 'base', 'bases',
    'proceso', 'procesos', 'grupo', 'grupos',
    'conjunto', 'conjuntos', 'serie', 'series',
    'nivel', 'niveles', 'nombre', 'nombres',
    'número', 'numero', 'números', 'numeros',
    'valor', 'valores', 'elemento', 'elementos',
    'carácter', 'caracter', 'caracteres',
    'estado', 'estados', 'condición', 'condicion', 'condiciones',
    'través', 'traves', 'efecto', 'efectos',
    'causa', 'causas', 'periodo', 'períodos', 'periodos',
    'momento', 'momentos', 'tiempo', 'tiempos',
    'objeto', 'objetos', 'materia', 'materias',
    'ámbito', 'ambito', 'ámbitos',
    'aspecto', 'aspectos', 'dato', 'datos',
    'información', 'informacion',
    'documento', 'documentos', 'archivo', 'archivos',
    'fichero', 'ficheros', 'carpeta', 'carpetas',
    'campo', 'campos', 'función', 'funcion', 'funciones',
    'sistema', 'sistemas', 'usuario', 'usuarios',
    'acción', 'accion', 'acciones',
    'tarea', 'tareas', 'paso', 'pasos', 'contenido',
    'combinación', 'combinacion',

    // ─── Adjetivos genéricos ───────────────────────
    'general', 'generales', 'especial', 'especiales',
    'principal', 'principales',
    'propio', 'propia', 'propios', 'propias',
    'nuevo', 'nueva', 'nuevos', 'nuevas',
    'último', 'ultima', 'últimos', 'últimas',
    'primero', 'primera', 'primeros', 'primeras',
    'segundo', 'segunda', 'segundos', 'segundas',
    'tercero', 'tercera', 'terceros', 'terceras',
    'posible', 'posibles', 'necesario', 'necesaria',
    'determinado', 'determinada', 'determinados',
    'diferente', 'diferentes', 'común', 'comun', 'comunes',
    'distinto', 'distinta', 'distintos', 'distintas',
    'mayor', 'mayores', 'menor', 'menores',
    'mejor', 'mejores', 'peor', 'peores',
    'igual', 'iguales',
    'cierto', 'cierta', 'ciertos', 'ciertas',
    'alguno', 'alguna', 'algunos', 'algunas',
    'ninguno', 'ninguna', 'ningunos', 'ningunas',
    'cada', 'demás', 'demas', 'ambos', 'ambas',
    'respectivo', 'respectiva',
    'solo', 'sola', 'solos', 'solas',
    'único', 'unica', 'únicos',
    'dicho', 'dicha', 'dichos', 'dichas',

    // ─── Conectores ────────────────────────────────
    'asimismo', 'igualmente', 'incluso',
    'tanto', 'poco', 'mientras', 'aunque',
    'acuerdo', 'conforme',

    // ─── Numerales ─────────────────────────────────
    'uno', 'dos', 'tres', 'cuatro', 'cinco',
    'seis', 'siete', 'ocho', 'nueve', 'diez',
    'primer', 'tercer',
];

/**
 * Sufijos verbales para filtrado dinámico.
 * Descarta automáticamente conjugaciones como «creamos», «escribimos», etc.
 */
const SUFIJOS_VERBALES = [
    'amos', 'emos', 'imos',   // 1.ª pers. plural
    'ando', 'endo', 'iendo',  // gerundio
    'aron', 'eron', 'ieron',  // pretérito 3.ª pl.
    'aban', 'eban', 'iban',   // imperfecto 3.ª pl.
    'aran', 'eran', 'iran',   // futuro subj. 3.ª pl.
    'aria', 'eria', 'iria',   // condicional 3.ª sg.
    'arias', 'erias', 'irias',// condicional 2.ª sg.
    'iera', 'iese',           // subj. imperfecto (-iera/-iese)
    'ieras', 'ieses',         // subj. imperfecto 2.ª sg.
    'ieran', 'iesen',         // subj. imperfecto 3.ª pl.
    'iere', 'ieren',          // subj. futuro
    'arse', 'erse', 'irse',   // infinitivo reflexivo
    'aban',                   // imperfecto 3.ª pl.
    'adas', 'idos', 'idas',   // participios plurales
    'ante', 'ente', 'iente',  // participios activos (si > 6 chars)
    'anza', 'encia',          // sustantivos deverbales
    'cion', 'sion',           // sufijos nominales (sin tilde porque está normalizado)
    'miento',                 // sustantivos deverbales
    'mente',                  // adverbios
];

const sufijosNorm = SUFIJOS_VERBALES.map(s =>
    s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
);

const baseSet: Set<string> = new Set(
    STOPWORDS_ARRAY.map(w =>
        w.toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
    )
);

/**
 * Comprueba si una palabra (ya normalizada, sin tildes, minúsculas) es stopword.
 * Comprueba lista estática + filtro dinámico por sufijos verbales.
 */
export function esStopword(palabra: string): boolean {
    if (baseSet.has(palabra)) return true;
    // Filtrar conjugaciones verbales por sufijo (solo si > 6 chars para evitar falsos positivos)
    if (palabra.length > 6) {
        for (const suf of sufijosNorm) {
            if (palabra.endsWith(suf)) return true;
        }
    }
    return false;
}

/**
 * Objeto con interfaz .has() para compatibilidad con los filtros existentes.
 */
export const STOP_WORDS = {
    has(word: string): boolean {
        return esStopword(word);
    },
};
