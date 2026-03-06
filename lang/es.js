let es;
export default es = {

  banner: {
    title: "Información",
    text: "Este sitio web está siendo desarrollado por Gerard Llorach-Tó. No dude en ponerse en contacto conmigo si encuentra errores o tiene sugerencias en {gerard} o en {icatmar}. Si está familiarizado con GitHub y sus 'issues', por favor use el {github}.",
    links: {
      github_repo: "repositorio de GitHub"
    }
  },
  
  information: {
    tooltipTitle: "Cookies y privacidad",
    warningTitle: "¡Advertencia!",
    warningMessage: "Los datos en tiempo real podrían no estar disponibles del 4 al {lastDay} de octubre de 2024 debido a mantenimiento. Disculpen las molestias.",
    closeButton: "Cerrar",
    acknowledgment1: "La red ICATMAR HF Radar ha sido establecida con el apoyo del Fondo Europeo de Pesca y Asuntos Marítimos, el Fondo Europeo de Pesca, Asuntos Marítimos y Acuicultura y los fondos proporcionados por la Generalidad de Cataluña. La red ha sido diseñada, implementada y gestionada por los esfuerzos de la Dirección General de Política Marítima y Pesca Sostenible (Generalidad de Cataluña) e Instituto de Ciencias del Mar (CSIC), Barcelona.",
    acknowledgment2: "Estos datos fueron recopilados y puestos a disposición de forma gratuita por ICATMAR y los programas que contribuyen a ella. Los datos fueron recopilados por la Generalidad de Cataluña y procesados por ICATMAR con el apoyo del Fondo Europeo de Pesca, Asuntos Marítimos y Acuicultura (FEAMP) y el Programa de Fondos Climáticos de la Generalidad de Cataluña.",
    acknowledgment3: "Estos datos siguen los estándares Copernicus; son públicos y gratuitos. El usuario asume todos los riesgos por el uso de los datos. El usuario debe mostrar la citación en cualquier publicación o producto que utilice los datos. El usuario debe contactar con ICATMAR antes de cualquier uso comercial de los datos.",
    acknowledgment4: "El conjunto de datos de velocidad de corrientes de la superficie marina por radar HF de ICATMAR está bajo licencia Creative Commons Atribución 4.0 Internacional. Debe haber recibido una copia de la licencia junto con este trabajo. Si no es así, consulte http://creativecommons.org/licenses/by/4.0/."
  },

  download: {
    downloadData: "Descargar datos",
    downloadSettings: "Ajustes de descarga",
    selectVariable: "Selecciona la variable",
    currents: "Velocidades de superficie marina",
    waves: "Olas",
    chooseFileFormat: "Elige el formato de archivo",
    netCDF: "netCDF",
    geojson: "geojson",
    warningTuv: "Advertencia: los archivos tuv no tienen control de calidad.",
    selectTimeSpan: "Selecciona el intervalo de tiempo",
    displayedTime: "Tiempo mostrado",
    last24h: "Últimas 24h",
    last3days: "Últimos 3 días",
    latestMonth: "Último mes",
    estimatedSize: "Tamaño estimado del archivo: {size} MB",
    disclaimer: "Estos datos son públicos y gratuitos. El usuario asume todos los riesgos por el uso de los datos. El usuario debe mostrar la citación en cualquier publicación o producto que utilice los datos. El usuario debe contactar con ICATMAR antes de cualquier uso comercial de los datos. El conjunto de datos de velocidad de corrientes de la superficie marina por radar HF de ICATMAR está bajo una {ccby}.",
    cookiesWarning: "Descargar los datos implica el reconocimiento de nuestro uso de cookies para monitorizar la actividad de descarga y mejorar nuestros servicios.",
    downloadButton: "Descargar",
    cancelButton: "Cancelar",
    downloadingData: "Descargando datos...",
    accessFTP: "Acceder al servidor FTP"
  },

  cookies: {
    tooltipTitle: "Cookies y privacidad",
    bannerTitle: "Configuración de cookies",
    bannerText: "Utilizamos cookies y recopilamos información para mejorar la experiencia del usuario y rastrear nuestro impacto. No se da uso comercial a los datos.",
    acceptButton: "Aceptar",
    denyButton: "Rechazar"
  },

  mapOptions: {
    baseLayer: "Capa base",
    isobaths: "Isóbatas",
    inSituObservations: "Observaciones in situ",
    weatherAndSeaModels: "Modelos meteo-oceanográficos"
  },
  
  "Auto-refresh": "Auto-actualización",

  "Advanced interface": "Interfaz avanzada",

  "Data source": "Fuente de datos",

  "Currents": "Corrientes",
  "particles": "partículas",
  "points": "puntos",
  "LOADING": "CARGANDO",

  "Date": "Fecha",

  "buoyButtonTitle": "Centra la cámara en la boya de superfície",
  "baseButtonTitle": "Centra la cámara en el observatorio submarino",

  "waveButtonTitle": "Configura el oleaje",
  "windButtonTitle": "Modifica el viento",

  "externalLinkButton": "Ve a la fuente de datos",
  "measuresButton": "Obre/Cierra el panel de datos",

  "compassButtonTitle": "Orienta la camara hacia el norte",



  "WSPD": "Velocidad del viento",
  "WDIR": "Dirección del viento",
  "Hm0": "Altura oleaje (media)",
  "Hmax": "Altura máxima de oleaje",
  "Mdir": "Dirección oleaje (media)",
  "Spr1": "Difusión direccional oleaje",
  "AIRT": "Temperatura del aire",
  "TEMP": "Temperatura (base submarina)",
  "PSAL": "Salinidad (base submarina)",

  "Wind": "Viento",
  "Waves": "Oleaje",

  "Wave height": "Altura de oleaje",
  "Swell direction": "Dirección del oleaje",
  "Wave steepness": "Periodo",

  "Wind speed": "Velocidad del viento",
  "Wind direction": "Dirección del viento",
  "Wave significant height": "Altura significante de oleaje",
  "Air temperature": "Temperatura del aire",
  "Atmospheric pressure": "Pressión atmosférica",
  "Sea surface temperature": "Temperatura superficial del mar",
  "Sea bottom temperature": "Temperatura del fondo del mar",
  "Salinity": "Salinidad",

  "Chlorophyll": "Clorofila",
  "Sea temperature anomaly": "Anomalía de temperatura del mar",
  "Data from": "Datos de",
  "Current": "Corrientes",



  infoPanel: {
    title: "Acerca de la aplicación",
    p1: `Esta aplicación es una simulación 3D de las condiciones meteorológicas y oceanográficas
        del observatorio de submarino OBSEA. La simulación se basa en los datos recogidos por el
        observatorio. El objetivo de esta aplicación es transferir el conocimiento
        e información adquirida por el observatorio. Esta aplicación está siendo desarrollada por la
        `,
    p1_1: `en colaboració con `,
    BlueNetCat: 'Xarxa Marítima de Catalunya (BlueNetCat)',
    OBSEA_UPC: 'OBSEA de la Universitat Politècnica de Catalunya (UPC)',
    p1_2: `. Agradecimientos sinceros al Grupo de las Tecnologias de la Interacción (GTI) de la Universitat
    Pompeu Fabra por las consultas ténicas y a Emilio García por las consultas teóricas. El código de la 
    aplicación se puede encontrar en el `,
    github: `repositorio github.`,

    aboutObsea: `Acerca de OBSEA`,
    p2: `Tomado del sitio web de OBSEA: "La investigación marina requiere cada día más información medioambiental, 
    con mejores resoluciones temporales y series más largas. Los métodos tradicionales no son adecuados por 
    ecosistemas marinos con dinámicas muy lentas, con la adquisición continúa de datos durante largos periodos 
    es posible detectar cambios climáticos a la vegada que acontecimientos singulares.`,
    p2_1: `OBSEA es un observatorio submarino cableado a unos 4 km de la costa de Vilanova i la Geltrú a
     la zona protegida de pesca, e interconectado a la costa por un cable mixto de energía y comunicaciones. 
     La ventaja principal de disponer de un observatorio cableado es la de poder proporcionar energía a los 
     instrumentos científicos y disponer de un enlace de comunicación de banda ancha. De este modo se puede 
     tener información en tiempo real y se evitan los inconvenientes de los sistemas alimentados con baterías.
      La solución adoptada es la implementación de una red ethernet óptica que transmite continuamente los 
      datos de los instrumentos oceanográficos conectados al observatorio. Con el OBSEA se puede realizar una 
      observación en tiempo real de múltiples parámetros del medio marino. Desde la estación terrestre se proporciona 
      la alimentación por los dispositivos y el enlace de fibra óptica por las comunicaciones a la vez que se hace 
      la gestión de alarmas y se almacenan los datos. Con un tramo de unos 1000 metros de cable terrestre se conecta 
      con la arqueta de anclaje, punto donde el cable submarino inicia su recorrido hasta la ubicación del nodo a 
      unos 4 km de la costa y a unos 20 metros de profundidad."`,

    contact: "Contacto",
    p3: `Para consultas sobre la aplicación, póngase en contacto con Gerard Llorach (gllorach at bluenetcat.eu).
     Para consultas sobre los datos, por favor contactar a Enoc Martínez (enoc.martinez at upc.edu).`,

    funding: "Financiación",
    p4: `La Xarxa Marítima de Catalunya (BlueNetCat) está financiada por
    la Generalitat de Catalunya y por el Fondo Europeo de Desarrollo Regional (FEDER).`,

  },



  seaPanel: {
    title: "Parámetros de la simulación del mar",
    p1: "Esta simulación está hecha con olas de Gestner, según el",
    p1_1: "tutorial de Jasper Flick",
    p2: `La simulación genera los parámetros de 16 olas seguns las medidas de oleaje, tales com la altura media de oleaje,
    la altura máxima de oleaje y la dirección del oleaje.`,
    oceanSteepness: "Modifica como de picado está el mar",
    waveSignificantHeight: "Modifica la altura significante de oleaje",
    meanWaveDirection: "Modifica la dirección promedio de las olas",
    swellParams: "Modifica los parámetros del oleaje principal",
  },


  windPanel: {
    title: "Parámetros de la simulación de viento",
    p1: "La simulación de tejido está hecha con verlet integration (Hitman's ragdoll), siguiendo el",
    p1_1: "tutorial de Jared Counts",
    p2: `La simulación está basada en las medidas de la velocidad del viento y su dirección, que modifican
        las fuerzas que afectan la tela.`,
    windParams: 'Modifica el viento',
  },

  timeControl: {
    "timeSliderTip": "Arrastra para seleccionar la fecha",
    "dailyMax": "Máximo diario (OBSEA)",
    "halfHourly": "Promedio 30min (OBSEA)",
    "playPause": "Reproducir/Parar",
    "stepForward": "Desplázate al siguiente punto",
    "stepBackward": "Desplázate al punto anterior",
    "forward": "Avance rápido",
    "backward": "Marcha atrás"
  },





  "January": "Enero",
  "February": "Febrero",
  "March": "Marzo",
  "April": "Abril",
  "May": "Mayo",
  "June": "Junio",
  "July": "Julio",
  "August": "Agosto",
  "September": "Septiembre",
  "October": "Octubre",
  "November": "Noviembre",
  "December": "Diciembre",
  "Jan": "Ene",
  // "Feb": ,
  // "Mar": ,
  "Apr": "Abr",
  // "May": "May",
  // "Jun": ,
  // "Jul": ,
  "Aug": "Ago",
  // "Sep": "Sep",
  // "Oct": ,
  // "Nov": ,
  "Dec": "Dic",



  "Data": "Datos",

  "Cookies title": "Valoramos tu privacidad",
  "Cookies text": `Usamos tecnología como las galletas en nuestro sitio web para mejorar la
  experiencia de usuario y analizar el tráfico. Haz click en "Acepto" para dar consentimiento.
  Puedes cambiar tu elección en cualquier momento a través de este menú.`,
  "Cookies accept": "Aceptar",
  "Cookies deny": "Denegar",
}