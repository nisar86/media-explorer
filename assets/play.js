/*
 *
 * Media Explorer
 * by Nisar Abed (info@nisar.it | Nisar.it)
 *
 */
'use strict';
(function($) {
  $(document).ready(function() {

    const APP_NAME = 'Media Explorer';
    const APP_VER  = '1.0';
    // Set App Title
    document.title = APP_NAME;


    /*
     *
     * File Icons
     *
     */
    // File Icons > MAME Types
    const fileIcons_mimeCategories = {
        image:   {'icon_image'  : ['image/jpeg','image/png','image/gif','image/webp','image/tiff','image/bmp','image/heif','image/heic','image/svg+xml','image/x-icon']}, 
        video:   {'icon_video'  : ['video/mp4','video/mov','video/x-ms-wmv','video/x-msvideo','video/x-flv','video/webm','video/mpeg','video/x-matroska']},
        audio:   {'icon_audio'  : ['audio/mpeg','audio/aac','audio/ogg','audio/wav','audio/x-flac','audio/aiff']},
        pdf:     {'icon_pdf'    : ['application/pdf']},
        text:    {'icon_text'   : ['application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document','text/markdown','text/plain']},
        calc:    {'icon_calc'   : ['application/vnd.ms-excel','application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']},
        json:    {'icon_json'   : ['application/json']},
        code:    {'icon_code'   : ['application/xml','text/html']},
        archive: {'icon_archive': ['application/zip','application/x-7z-compressed','application/x-rar-compressed','application/x-tar','application/gzip']},
        app:     {'icon_app'    : ['application/x-msdownload','application/x-mach-binary','application/x-sh','application/x-bat']},
        file:    {'icon_file'   : ['file']},
    };

    // File Icons > Extensions
    const fileIcons_extCategories = {
        image:   {'icon_image'  : ['svg','png','jpg','jpeg','gif','webp','ico','bmp','tif','tiff','heif','heic','avif']},
        video:   {'icon_video'  : ['mp4','webm','mkv','mov','ogv']},
        audio:   {'icon_audio'  : ['mp3','wav','wma','aac','m4a','flac','aiff','alac','ogg']},
        pdf:     {'icon_pdf'    : ['pdf']},
        text:    {'icon_text'   : ['txt','log','ini','conf','cfg','rtf','md','markdown','sql','odt','aae']},
        calc:    {'icon_calc'   : ['csv','tsv','xls','xlsx','xlsm','xlsb','ods','fods','numbers']}, 
        json:    {'icon_json'   : ['json']},
        code:    {'icon_code'   : ['html','htm','xhtml','css','js','jsx','xml','php','asp','ts','tsx','map']},
        archive: {'icon_archive': ['zip','tar','gz','tgz','rar','7z','dmg','iso','jar','apk','deb','rpm','cab','bz2']},
        app:     {'icon_app'    : ['exe','msi','bat','sh']}
    };


    /*
     *
     * Returns a simpler object suitable for frequent lookups.
     * The returned object maps strings (extensions or MIME types) to the corresponding icon name.
     * Example:
     * source = { cat1: { 'ico1': [str1, str2] } }
     * result = { str1:'ico1', str2:'ico1' }
     * 
     */
    function getFileIconsObj(iconsCats_data){
        let iconsObj = {};
        // Retrieve data for each category.
        for (const category in iconsCats_data) {
            const map = iconsCats_data[category];
            // Iterate each property of the map.
            for (const iconName in map) {
                const strings = map[iconName];
                if (!Array.isArray(strings)) continue;
                // Iterate the strings in the array.
                for (let str of strings) {
                    if (typeof str !== 'string') continue;
                    // Trim whitespace and convert to lowercase.
                    str = str.trim().toLowerCase();
                    if (!str) continue;
                    // Avoid overwriting an existing mapping.
                    if (iconsObj[str] && iconsObj[str] !== iconName) continue;
                    iconsObj[str] = iconName;
                }
            }
        }
        return iconsObj;
    }
    // Return MAME Types & Extensions
    const fileIcons_mimeType = getFileIconsObj(fileIcons_mimeCategories);
    const fileIcons_extension = getFileIconsObj(fileIcons_extCategories);


    /* 
     * 
     * Object that stores the file count.
     * 
     */
    let fileCounter = {};


    /* 
     * 
     * Browser Supported Extensions (iFrame)
     * 
     */
    const ext_webStatic  = ['html','htm','xhtml','css','js','json','xml'];
    const ext_webDynamic = ['php','asp'];
    const ext_textSimple = ['txt','log','ini','conf','cfg'];
    const ext_textFormat = ['rtf','csv','tsv','md','markdown'];
    const ext_database   = ['sql'];
    const ext_docComp    = ['pdf'];
    const ext_image      = ['svg','png','jpg','jpeg','gif','webp'];
    const ext_video      = ['mp4','webm'];
    const ext_audio      = ['mp3','wav'];

    // Browser-compatible extensions.
    const bsExt_compatible = [].concat(ext_webStatic, ext_webDynamic, ext_textSimple, ext_textFormat, ext_database, ext_docComp, ext_image, ext_video, ext_audio);

    const bsExt_safariNotCompatible = ['ogg','ogv','ogx'];
    // All extensions (compatible + Safari exceptions).
    const bsExt_generic = [].concat(bsExt_compatible, bsExt_safariNotCompatible);
    // Use Set because for repeated membership checks it is much more performant than an Array. 
    // Array requires a sequential scan; Set uses a hash table for O(1) lookups. 
    const bsExt_setGeneric = new Set(bsExt_generic);
    const bsExt_setSafari  = new Set(bsExt_compatible);
    // File extensions that are compatible (in an iframe) per browser type. 
    const browserSupport_extension = {
        safari:  bsExt_setSafari,
        chrome:  bsExt_setGeneric,
        edge:    bsExt_setGeneric,
        firefox: bsExt_setGeneric,
        opera:   bsExt_setGeneric,
        brave:   bsExt_setGeneric
    };

    // Extensions allowed in FSA mode for folder preview.
    const fsaFolderPreview_allowedExt = [].concat(ext_image, ext_video);

    // Array of file names to exclude.
    const excludedFiles = ['.DS_Store', 'Thumbs.db'];

    // Defaults
    let navigationPath       = [];   // Current path (for Breadcrumbs).
    let basePath             = '';   // Path to the selected folder, used to generate file links (Fsa Mode + getLink()).
    let currentLoadToken     = 0;    // Identifies the current load operation.
    let fsa_directoryHandle  = null; // FSA Mode: Directory Handle.
    let php_directoryTarget  = null; // PHP Mode: Directory Target.
    const currentLoader      = '.loading_indicator'; // Loader Class
    const blobURLs           = [];   // Array to store URL blobs.
    const autoFreeMemory     = true; // Frees browser memory (blobs) when resources are no longer needed.
    const skipExcludedFiles  = true; // Skip files in the excluded files list.
    const skipHiddenFiles    = true; // Skip files in the hidden files list.
    const langDefault        = 'en';
    const langAllowed        = ['en','it'];
    const appInfo_btn        = '.footer .app_info.btn_show_modal_app_info';
    const appInfo_modal      = '.modal.app_info';
    const langSelector       = '.options select.select_lang';
    const fsaSelectFolder    = '.options .btn_select_folder';
    const maxPreviewSize     = '.options .max_preview_size';
    const fsaNAMoreInfo      = '.header .messages .btn_fsa_na_info';
    const phpNAMoreInfo      = '.header .messages .btn_php_na_info';
    const optBasePath        = '.options .base_path';
    const inputPath          = optBasePath+' input.input_base_path';
    const inputSubfolderPath = optBasePath+' input.view_subfolder_path';
    const inputServerFolder  = '.options input.input_server_folder';
    const inputSearch        = '.options input.search_input';
    const itemsSize_label    = '.options .size_control label';
    const showModalConvLimit = 'show_modal show_select_hhconv_limit';
    const itemsSize_select   = itemsSize_label+' input[type="range"].size_selector';
    const itemsSize_default  = {'desktop':6,'mobile':2};
    const modalBrowserNS     = '.modal.browser_not_supported';
    const modalOptions       = '.modal.options';
    const modalErrors        = '.modal.errors';
    const headerMsg          = '.header .messages';
    const goMobile_widthPx   = 1126;
    const totalsCounter      = '.footer .counter';
    const tt_summary         = totalsCounter+' .tt_summary';
    const totalsCounterBox   = totalsCounter+' .box';
    const convertHeifHeic    = true;
    const maxHHConvDefault   = 1;
    const mediaTimeoutMs     = 8000;
    const phpEndpointPath    = 'php/server-list-files.php';
    const fileAccessMode_OptFsa  = '.options .opt_file_access_mode_fsa';
    const fileAccessMode_OptPhp  = '.options .opt_file_access_mode_php';
    // HEIF/HEIC Conversion Counter.
    let fcCounter_HHCurConv = 0; // Current file to convert.
    let fcCounter_HHTotal   = 0; // All files to convert.
    // Preview Control
    const previewActive_all    = true; // Enable all previews. Set to false to disable every preview type.
    const previewActive_video  = true; // Enable video previews. 
    const previewActive_image  = true; // Enable image previews without conversion. 
    const previewActive_HHimg  = true; // Enable image previews with conversion (handles HEIF/HEIC for non‑Safari browsers). 
    const previewMaxMB_default = 0;    // Default maximum file size for previews (0 disables the limit).


    // Video Previews 
    const videoPrevCmd_class = 'preview_controls';
    const videoPrevCmd_fx    = 'fx_show_item';
    const videoPrevCmd_html  = ''+
        '<span class="btn btn_play">&#9654;</span>'+
        '<span class="btn btn_pause hidden">&#9208;</span>'+
        '<span class="btn btn_unmute">&#128263;</span>'+
        '<span class="btn btn_mute hidden">&#128264;</span>';


    /*
     *
     * File System Access API > Check Availability
     * 
     */
    function isFileSystemAccessAvailable() {
        return typeof window.showDirectoryPicker === 'function';
    }


    // File Access Mode: fsa_mode/php_mode
    let fileAccessMode_default = 'fsa_mode';
    if( isFileSystemAccessAvailable() === false ){
        fileAccessMode_default = 'php_mode';
    }


    /*
     *
     * Is Mobile Device
     * Check if mobile mode should be enabled.
     *
     */
    function isMobileDevice() {
        if($(window).width() <= goMobile_widthPx) return true;
        return false;
    }
    // Set Default by Device.
    let itemsSize_defaultValue = itemsSize_default.desktop;
    if(isMobileDevice()){
        itemsSize_defaultValue = itemsSize_default.mobile;
    }


    /*
     *
     * Detect the operating system.
     * 
     */
    function getOS() {
        const platform  = window.navigator.platform.toLowerCase();
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (/android/.test(userAgent)) return 'android';
        if (/iphone|ipad|ipod/.test(platform) || /iphone|ipad|ipod/.test(userAgent)) return 'ios';
        if (platform.includes('win')) return 'windows';
        if (platform.includes('mac')) return 'macos';
        if (platform.includes('linux')) return 'linux';
        return 'unknown';
    }
    const isOS = getOS();


    /*
     *
     * Detect the browser (expandable).
     * If the browser is detected, return the browser name; otherwise return an empty string.
     * 
     */
    function getBrowser() {
        if (typeof navigator === 'undefined') return '';
        const ua = navigator.userAgent || '';
        // Create an object containing all the data and an array with all the browser names.
        const browsersTest = {
            safari:  /Safari/.test(ua) && !/Chrome|Chromium|CriOS|CrMo|Android|Edg|OPR|FxiOS|Brave/i.test(ua),
            chrome:  /Chrome|Chromium|CriOS|CrMo/i.test(ua) && !/Edg|OPR|Brave/i.test(ua),
            edge:    /Edg\//i.test(ua),
            firefox: /Firefox|FxiOS/i.test(ua),
            opera:   /OPR\/|Opera/i.test(ua) && !/Edg/i.test(ua),
            brave:   /Brave\//i.test(ua) // Reliable only if Brave exposes 'Brave' in the user agent (UA).
        };
        const browsersKeys = Object.keys(browsersTest); // ['browser1','browser2',...]
        // Detect and return the first match.
        for (let browserCheck of browsersKeys) {
            if (browsersTest[browserCheck]) return browserCheck;
        }
        return '';
    }
    const isBrowser = getBrowser();


    /*
     * 
     * Obtain a valid CSS class from a variable.
     * If a class cannot be obtained, return an empty string.
     * 
     */
    function getCssClass(myVar) {
        if (myVar == null) return '';
        var myClass = String(myVar).trim().toLowerCase();
        return /^[a-z0-9_-]+$/.test(myClass) ? myClass : '';
    }
    // Browser Body Class
    // Useful for managing appearance when browsers exhibit different behaviors.
    if(isBrowser !== ''){
        var browserClass = 'browser_'+getCssClass(isBrowser);
        $('body').addClass(browserClass);
    }


    /*
     *
     * Lang
     * 
     */
    // All Texts
    const appTexts = {
        appDesc : {
            en : 'Media Explorer is a tool for browsing files and folders in a media‑style gallery from the web browser.',
            it : 'Media Explorer è uno strumento per esplorare file e cartelle in una galleria multimediale dal browser web.'},
        appDesc_more : {
            en : 'It lets you navigate content on your local computer or on a PHP server, showing previews for media files and folders. It plays audio and video and also displays images in slideshow mode. Visit the GitHub repository for more information.',
            it : 'Permette di navigare contenuti sul computer locale o su un server PHP mostrando le anteprime dei file multimediali e delle cartelle. Riproduce audio e video e visualizza le immagini anche in modalità slideshow. Visita il repository su GitHub per maggiori informazioni.'},
        aboutMEApp : {
            en : 'About Media Explorer',
            it : 'Informazioni su Media Explorer'},
        txt_credits : {
            en : 'Credits',
            it : 'Crediti'},
        link_dev : {
            en : 'Developer: Nisar Abed - Nisar.it',
            it : 'Sviluppatore: Nisar Abed - Nisar.it'},
        dev_by : {
            en : 'developed by Nisar Abed',
            it : 'sviluppato da Nisar Abed'},
        link_repo : {
            en : 'Repository: Media Explorer on GitHub.com',
            it : 'Repository: Media Explorer su GitHub.com'},
        link_license : {
            en : 'License',
            it : 'Licenza'},
        link_readme : {
            en : 'Readme',
            it : 'Leggimi'},
        noHtml5Audio : { 
            en : 'Your browser does not support HTML5 audio.', 
            it : 'Il tuo browser non supporta gli audio HTML5.'},
        noHtml5Video : { 
            en : 'Your browser does not support HTML5 video.', 
            it : 'Il tuo browser non supporta i video HTML5.'},
        newTab : { 
            en : 'New Tab', 
            it : 'Nuova Scheda'},
        fileAccessMode : { 
            en : 'File Access Mode', 
            it : 'Modalità Accesso File'},
        selectFolder : { 
            en : 'Select Folder', 
            it : 'Seleziona Cartella'},
        selectFolderInfo : { 
            en : 'Select the folder with the media to display.', 
            it : 'Seleziona la cartella con i media da visualizzare.'},
        directLink : { 
            en : 'Direct Link', 
            it : 'Link Diretto'},
        basePathInfo : { 
            en : 'Enter the absolute path to the selected folder (File System Path). If you do not specify a path (leave the field empty), the links will point to the browser’s blob storage (File System Access API Security Policy).', 
            it : 'Inserire il Percorso Assoulto alla cartella selezionata (File System Path). Se non definisci alcun percorso (campo vuoto) i link punteranno alle memorie blob del browser (Policy di sicurezza File System Access API).'},
        txtInsert : { 
            en : 'Insert', 
            it : 'Inserire'},
        txtSelectServerFolder : { 
            en : 'Enter the path of the folder to read. Leave blank to use the default folder.', 
            it : 'Inserisci il percorso della cartella da leggere. Lascia vuoto per utilizzare la cartella predefinita.'},
        dirPathWin : { 
            en : 'C:\path\to\the\selected\folder', 
            it : 'C:\percorso\fino\alla\cartella\selezionata'},
        dirPathUnix : { 
            en : '/path/to/the/selected/folder', 
            it : '/percorso/fino/alla/cartella/selezionata'},
        txtSubfolderPath : { 
            en : 'Subfolder Path (Created Automatically)', 
            it : 'Path Sottocartelle (Creato Automaticmanete)'},
        txtSearchPh : { 
            en : 'Search files or folders...', 
            it : 'Cerca file o cartelle...'},
        txtSizeLabel : { 
            en : 'Items per Row', 
            it : 'Elementi per Riga'},
        txtUxThemeLight : { 
            en : 'Switch to Light Theme', 
            it : 'Passa al Tema Chiaro'},
        txtUxThemeDark : { 
            en : 'Switch to Dark Theme', 
            it : 'Passa al Tema Scuro'},
        txtUxViewGallery : { 
            en : 'Switch to Gallery View', 
            it : 'Passa alla Vista Gallera'},
        txtUxViewList : { 
            en : 'Switch to List View', 
            it : 'Passa alla Vista Elenco'},
        txtLangEn : { 
            en : 'English', 
            it : 'Inglese'},
        txtLangIt : { 
            en : 'Italian', 
            it : 'Italiano'},
        txtGoUp : { 
            en : 'Go Up', 
            it : 'Vai Su'},
        txtLoader : { 
            en : 'Loading...', 
            it : 'Caricamento...'},
        txtBrowserNotCompTitle : { 
            en : 'Browser not compatible', 
            it : 'Browser non compatibile'},
        txtBrowserNotCompDesc : { 
            en : 'This browser does not support the <strong>File System Access API</strong>!<br> <strong>Use a compatible browser, for example:</strong>', 
            it : 'Questo browser non supporta le <strong>File System Access API</strong>!<br> <strong>Usa browser compatibile, ad esempio:</strong>'},
        txtBrowserNotCompMsg : { 
            en : 'Browser not compatible with the file access mode you are using.', 
            it : 'Browser non compatibile con la modalità di accesso file in uso.'},
        txtClose : { 
            en : 'Close', 
            it : 'Chiudi'},
        txtSubfolderPh : { 
            en : 'subfolder/path/...',
            it : 'percorso/sottocartella/...'},
        txtFamLabelFSA : { 
            en : 'Disk and Local Network',
            it : 'Disco e Rete Locale'},
        txtFamLabelPHP : { 
            en : 'PHP Web Server',
            it : 'Web Server PHP'},
        txtFamInfo : { 
            en : 'File Access Mode: choose [Disk and Local Network] to access files on your computer, device, and local networks (using the File System Access API). Choose [PHP Web Server] to browse files on a running PHP web server (this app must be deployed on the web server).',
            it : 'Modalità Accesso File: scegli [Disco e Rete Locale] per accedere ai file sul computer, sul dispositivo e sulle reti locali (usando File System Access API). Scegli [Web Server PHP] per esplorare i file su un server web PHP in esecuzione (è necessario caricare questa app sul server web).'},
        txtMoreInfo : { 
            en : 'More Information',
            it : 'Più Informazioni'},
        txtItems : {
            en : 'items',
            it : 'elementi'},
        txtFolders : {
            en : 'folders',
            it : 'cartelle'},
        txtFiles : {
            en : 'files',
            it : 'file'},
        txtFileLoading : {
            en : 'File Loading...',
            it : 'File in Caricamento...'},
        txtSetDefault : { 
            en : 'Set Default',
            it : 'Imposta Predefinito'},
        txtRestart : { 
            en : 'Restart',
            it : 'Riavvia'},
        txtHHFileConvLabel : {
            en : 'HEIF/HEIC file conversion.',
            it : 'Conversione file HEIF/HEIC.'},
        txtHHFileConvTitle : {
            en : 'HEIF/HEIC file conversion in progress. Show conversion info and options.', 
            it : 'Conversione dei file HEIF/HEIC in corso. Mostra info e opzioni di conversione.'},
        txtHHConvInfo : { 
            en : 'The browser you are using does not natively support HEIF/HEIC formats; therefore conversion is necessary to view them. If you want to avoid conversion, use Safari.',
            it : 'Il browser in uso non supporta nativamente i formati HEIF/HEIC; quindi è necessaro eseguire la conversione per poterli visualizzare, se vuoi evitare la conversione usa Safari.'},
        txtHHConvTitle : {
            en : 'HEIF/HEIC file Conversion',
            it : 'Conversione file HEIF/HEIC'},
        txtChangedLimitTo : { 
            en : 'Simultaneous conversion limit set to',
            it : 'Limite conversioni simultanee impostato a'},
        txtAppRestartText : { 
            en : 'To apply the new settings you will need to reload the app and start over. A value that is too high can overload the system; if you notice any problems, restore the default value.',
            it : 'Per usare le nuove impostazioni dovrai ricaricare l’app e ripartire dall’inizio. Un valore troppo alto può appesantire il sistema, se noti problemi ripristina il valore predefinito.'},
        txtSeconds : {
            en : 'Seconds',
            it : 'Secondi'},
        txtSecondsShort : {
            en : 'Sec.',
            it : 'Sec.'},
        txtsls_slideTimeInfo : {
            en : 'Duration in seconds of a single slide.',
            it : 'Durata in secondi di una singola slide.'},
        txtMg_selectModeInfo : {
            en : 'Select whether to queue audio and video files or only files of the same type.',
            it : 'Seleziona se riprodurre in coda file audio e video o solo file dello stesso tipo.'},
        txtMg_separateMode : {
            en : 'Same Type',
            it : 'Stesso Tipo'},
        txtMg_mixedMode : {
            en : 'Audio/Video',
            it : 'Audio/Video'},
        txtMg_queue : {
            en : 'Queue',
            it : 'Coda'},
        txtMg_setPauseInfo : {
            en : 'Seconds of pause between one media and another.',
            it : 'Secondi di pausa tra un media e l\'altro.'},
        txtPlay : {
            en : 'Play',
            it : 'Play'},
        txtStop : {
            en : 'Stop',
            it : 'Stop'},
        txtHttpSatus : {
            en : 'HTTP Status',
            it : 'Stato HTTP'},
        txtDesc : {
            en : 'Description',
            it : 'Descrizione'},
        txtTotal : {
            en : 'Total',
            it : 'In Totale'},
        txtFileTypes : {
            en : 'File Types',
            it : 'Tipi di File'},
        txtCounter : {
            en : 'Counter',
            it : 'Contatore'},
        txtMaxPreviewSize : {
            en : 'Maximum preview size (MB)',
            it : 'Dimensione massima anteprime (MB)'},
        txtMaxPreviewSizeDesc : {
            en : 'Maximum file size that can be used as a preview (MB). 0 disables the limit.',
            it : 'Dimensione massima dei file che possono essere usati come anteprima (MB). 0 disabilita il limite.'},
        // Errors
        txtError : { 
            en : 'Error', 
            it : 'Errore'},
        txtErrorDirGeneric : { 
            en : '<strong>An error occurred while selecting the folder.</strong>', 
            it : '<strong>Si è verificato un errore durante la selezione della cartella.</strong>'},
        txtErrorDirNotAllowed : { 
            en : '<strong>Permissions Denied.</strong> <br> The selected directory cannot be accessed.', 
            it : '<strong>Permessi Negati.</strong> <br> Non è possibile accedere alla directory selezionata.'},
        txtErrorDirChange : { 
            en : '<strong>Changing Directory</strong> <br> The selected directory could not be accessed. <br> Please check the folder\'s permissions or status.',
            it : '<strong>Cambio Directory</strong> <br> Non è stato possibile accedere alla directory selezionata. <br> Verificare i permessi o lo stato della cartella.'},
        txtErrorNoPhpSer : { 
            en : 'PHP Server Unavailable',
            it : 'Server PHP Non Disponibile'},
        txtErrorNoPhpSerInfo : {
            en : '<strong>PHP Server Unavailable</strong> <br> You can use this type of file access mode <br> only if the PHP server is running.',
            it : '<strong>Server PHP Non Disponibile</strong> <br> Puoi eseguire questo tipo di modalità di accesso ai file <br> solo se il Server PHP è in esecuzione.'},
        txtErrorFileList : { 
            en : 'Error retrieving the file list:',
            it : 'Errore nel recupero della lista file:'},
        txtErrorLoadList : { 
            en : 'Error loading file list via PHP.',
            it : 'Errore caricamento lista file via PHP.'},
        txtErrorJson : { 
            en : 'Non JSON response',
            it : 'Risposta non JSON'},
        txtErrorPhpServer : {
            en : 'Php Server Error',
            it : 'Errore Server Php'},
        txtErrorFolderNF : { 
            en : 'The path you entered does not exist.',
            it : 'Il percorso che hai inserito non esiste.'},
        txtErrorPhpEpNotSet : { 
            en : 'Directory not set in the PHP endpoint.',
            it : 'Directory non impostata nell\'endpoint PHP.'},
        txtErrorPhpEpNotSetDesc : { 
            en : 'To use PHP file-access mode you must set the directory in the file "'+phpEndpointPath+'".',
            it : 'Per usare la modalità di accesso file PHP devi impostare la directory nel file "'+phpEndpointPath+'".'},
        txtErrorDocRootNotFound : { 
            en : 'Document root not found.',
            it : 'Document root non trovata.'},
        txtErrorDocUnabReadDir : { 
            en : 'Unable to read directory.',
            it : 'Impossibile leggere la directory.'},
        txtErrorIntSrvError : { 
            en : 'Internal Server Error.',
            it : 'Errore Interno del Server.'},
        txtErrorIntSrvErrorDesc : { 
            en : 'The PHP server cannot complete the request.',
            it : 'Il server PHP non può completare la richiesta.'},
        txtErrorInvalidPath : { 
            en : 'Invalid path.',
            it : 'Percorso non valido.'},
        txtErrorHHConvFailed : {
            en : 'HEIF/HEIC conversion failed',
            it : 'Conversione HEIF/HEIC non riuscita'},
        txtErrorAudioReset : {
            en : 'Audio Reset Error',
            it : 'Errore Reset Audio'},
        txtErrorAudioChange : {
            en : 'Audio Change Error',
            it : 'Errore Cambio Audio'},
        txtErrorAudioClose : {
            en : 'Audio Close Error',
            it : 'Errore Chiusura Audio'},
        txtErrorMediaGallery : {
            en : 'Media Gallery Play Error',
            it : 'Errore Riproduzione Media Gallery'},
        txtErrorLoading : {
            en : 'Loading Error',
            it : 'Errore Caricamento'},
        txtErrorLoadingTimeout : {
            en : 'Loading Timeout Error',
            it : 'Errore Timeout Caricamento'},
        txtErrorPhpEp404 : {
            en : 'PHP endpoint not found.',
            it : 'Endpoint PHP non trovato.'},
        txtErrorPhpEp404Desc : {
            en : 'Check that "'+phpEndpointPath+'" exists and that both the directory and file names are correct.',
            it : 'Verifica che "'+phpEndpointPath+'" esista e che i nomi della directory e del file siano corretti.'}
    }

    // Defaults Text Vars
    let txtNoHtml5Audio         = appTexts.noHtml5Audio.en;
    let txtNoHtml5Video         = appTexts.noHtml5Video.en;
    let txtDirectLink           = appTexts.directLink.en;
    let txtLoader               = appTexts.txtLoader.en;
    let txtSelectFolderInfo     = appTexts.selectFolderInfo.en;
    let txtBrowserNotCompMsg    = appTexts.txtBrowserNotCompMsg.en;
    let txtMoreInfo             = appTexts.txtMoreInfo.en;
    let txtItems                = appTexts.txtItems.en;
    let txtFolders              = appTexts.txtFolders.en;
    let txtFiles                = appTexts.txtFiles.en;
    let txtFileLoading          = appTexts.txtFileLoading.en;
    let txtHHFileConvLabel      = appTexts.txtHHFileConvLabel.en;
    let txtHHFileConvTitle      = appTexts.txtHHFileConvTitle.en;
    let txtSeconds              = appTexts.txtSeconds.en;
    let txtSecondsShort         = appTexts.txtSecondsShort.en;
    let txtsls_slideTimeInfo    = appTexts.txtsls_slideTimeInfo.en;
    let txtMg_selectModeInfo    = appTexts.txtMg_selectModeInfo.en;
    let txtMg_separateMode      = appTexts.txtMg_separateMode.en;
    let txtMg_mixedMode         = appTexts.txtMg_mixedMode.en;
    let txtMg_queue             = appTexts.txtMg_queue.en;
    let txtMg_setPauseInfo      = appTexts.txtMg_setPauseInfo.en;
    let txtPlay                 = appTexts.txtPlay.en;
    let txtStop                 = appTexts.txtStop.en;
    let txtHttpSatus            = appTexts.txtHttpSatus.en;
    let txtDesc                 = appTexts.txtDesc.en;
    let txtTotal                = appTexts.txtTotal.en;
    let txtFileTypes            = appTexts.txtFileTypes.en;
    let txtCounter              = appTexts.txtCounter.en;
    // Errors
    let txtError                = appTexts.txtError.en;
    let txtErrorFileList        = appTexts.txtErrorFileList.en;
    let txtErrorLoadList        = appTexts.txtErrorLoadList.en;
    let txtErrorJson            = appTexts.txtErrorJson.en;
    let txtErrorPhpServer       = appTexts.txtErrorPhpServer.en;
    let txtErrorFolderNF        = appTexts.txtErrorFolderNF.en;
    let txtErrorPhpEpNotSet     = appTexts.txtErrorPhpEpNotSet.en;
    let txtErrorPhpEpNotSetDesc = appTexts.txtErrorPhpEpNotSetDesc.en;
    let txtErrorDocRootNotFound = appTexts.txtErrorDocRootNotFound.en;
    let txtErrorDocUnabReadDir  = appTexts.txtErrorDocUnabReadDir.en;
    let txtErrorIntSrvError     = appTexts.txtErrorIntSrvError.en;
    let txtErrorIntSrvErrorDesc = appTexts.txtErrorIntSrvErrorDesc.en;
    let txtErrorInvalidPath     = appTexts.txtErrorInvalidPath.en;
    let txtErrorNoPhpSer        = appTexts.txtErrorNoPhpSer.en;
    let txtErrorHHConvFailed    = appTexts.txtErrorHHConvFailed.en;
    let txtErrorAudioReset      = appTexts.txtErrorAudioReset.en;
    let txtErrorAudioChange     = appTexts.txtErrorAudioChange.en;
    let txtErrorAudioClose      = appTexts.txtErrorAudioClose.en;
    let txtErrorMediaGallery    = appTexts.txtErrorMediaGallery.en;
    let txtErrorLoading         = appTexts.txtErrorLoading.en;
    let txtErrorLoadingTimeout  = appTexts.txtErrorLoadingTimeout.en;
    let txtErrorPhpEp404        = appTexts.txtErrorPhpEp404.en;
    let txtErrorPhpEp404Desc    = appTexts.txtErrorPhpEp404Desc.en;

    // If the string is present the result is true.
    function isInArray(str, arr) { 
        return arr.includes(str); 
    }

    // Set Lang (Default EN)
    function setLang(langCode){
        // If the lang code is not allowed the language is English.
        if ( !isInArray(langCode, langAllowed) ) { 
            langCode = 'en'; 
        }
        localStorage.setItem('lang_current', langCode);
        // Change Language
        $('html').attr('lang',langCode);
        $('meta[name="description"]').attr('content', appTexts.appDesc[langCode]);
        txtNoHtml5Audio = appTexts.noHtml5Audio[langCode];
        txtNoHtml5Video = appTexts.noHtml5Video[langCode];
        $(appInfo_btn).attr('title',appTexts.aboutMEApp[langCode]);
        $(appInfo_modal+' .app_desc').text(appTexts.appDesc[langCode]+' '+appTexts.appDesc_more[langCode]);
        $(appInfo_modal+' .txt_credits').text(appTexts.txt_credits[langCode]+':');
        $(appInfo_modal+' .modal_title .link_dev').attr('title',appTexts.link_dev[langCode]);
        $(appInfo_modal+' .modal_title .link_dev').text(appTexts.dev_by[langCode]);
        $(appInfo_modal+' .link_repo').attr('title',appTexts.link_repo[langCode]);
        $(appInfo_modal+' .link_license').attr('title',appTexts.link_license[langCode]);
        $(appInfo_modal+' .link_license').text(appTexts.link_license[langCode]);
        $(appInfo_modal+' .link_readme').attr('title',appTexts.link_readme[langCode]);
        $(appInfo_modal+' .link_readme').text(appTexts.link_readme[langCode]);
        $('.btn_new_tab').attr('title', appTexts.newTab[langCode]);
        $('.file_access_mode label').attr('title', appTexts.fileAccessMode[langCode]);
        $(fsaSelectFolder).text(appTexts.selectFolder[langCode]);
        txtDirectLink = appTexts.directLink[langCode];
        $('.options .info_base_path').attr('tooltip', appTexts.basePathInfo[langCode]);
        const isWindows = (isOS === 'windows');
        const ibp_placeholder = isWindows ? appTexts.dirPathWin[langCode] : appTexts.dirPathUnix[langCode];
        $('.options .base_path .input_base_path').attr('placeholder', ibp_placeholder).attr('title', appTexts.txtInsert[langCode]+': '+ibp_placeholder);
        $('.options .base_path .view_subfolder_path').attr('title', appTexts.txtSubfolderPath[langCode]);
        $('.options .select_server_folder label').attr('title', appTexts.txtSelectServerFolder[langCode]);
        $(modalOptions+' .section.select_hhconv_limit .title').text(appTexts.txtHHConvTitle[langCode]);
        $(modalOptions+' .section.select_hhconv_limit .text1').html(appTexts.txtHHConvInfo[langCode]);
        $(modalOptions+' .section.select_hhconv_limit .text2').html(appTexts.txtChangedLimitTo[langCode]);
        $(modalOptions+' .section.select_hhconv_limit .text3').html(appTexts.txtAppRestartText[langCode]);
        $(modalOptions+' .section.select_hhconv_limit .btn_set_default .btn_label').text(appTexts.txtSetDefault[langCode]+' ('+maxHHConvDefault+')');
        $(modalOptions+' .section.select_hhconv_limit .btn_reload_app .btn_label').text(appTexts.txtRestart[langCode]);
        $(inputServerFolder).attr('placeholder', appTexts.txtSubfolderPh[langCode]);
        $(inputSearch).attr('placeholder', appTexts.txtSearchPh[langCode]);
        $(itemsSize_label).attr('data-title', appTexts.txtSizeLabel[langCode]);
        $(itemsSize_label).attr('title', itemsSize_labelTitle(localStorage.getItem('itemsSize_Current') || itemsSize_defaultValue) );
        $('.options .btn_change_theme .light').attr('title', appTexts.txtUxThemeLight[langCode]);
        $('.options .btn_change_theme .dark').attr('title', appTexts.txtUxThemeDark[langCode]);
        $('.options .btn_change_view .gallery').attr('title', appTexts.txtUxViewGallery[langCode]);
        $('.options .btn_change_view .list').attr('title', appTexts.txtUxViewList[langCode]);
        $('.options .btn_lang.lang_en').attr('title', appTexts.txtLangEn[langCode]);
        $('.options .btn_lang.lang_it').attr('title', appTexts.txtLangIt[langCode]);
        txtLoader = appTexts.txtLoader[langCode];
        $('.loading_indicator').attr('title', appTexts.txtLoader[langCode]);
        $(totalsCounterBox+'.loading').text(appTexts.txtLoader[langCode]);
        $('.btn_up').attr('title', appTexts.txtGoUp[langCode]);
        $(modalBrowserNS+' .content h3.modal_title').text(appTexts.txtBrowserNotCompTitle[langCode]);
        $(modalBrowserNS+' .content .info_txt').html(appTexts.txtBrowserNotCompDesc[langCode]);
        $('.btn_close_modal .btn_label').text(appTexts.txtClose[langCode]);
        txtSelectFolderInfo = appTexts.selectFolderInfo[langCode];
        $(headerMsg+' .notice.wellcome_mode_fsa h2').text(appTexts.selectFolderInfo[langCode]);
        txtBrowserNotCompMsg = appTexts.txtBrowserNotCompMsg[langCode];
        $(headerMsg+' .notice.er_browser_not_comp h2').text(appTexts.txtBrowserNotCompMsg[langCode]);
        $('.file_access_mode select.fam_select option[value="fsa_mode"]').text(appTexts.txtFamLabelFSA[langCode]);
        $('.file_access_mode select.fam_select option[value="php_mode"]').text(appTexts.txtFamLabelPHP[langCode]);
        $('.file_access_mode .info_fam').attr('tooltip', appTexts.txtFamInfo[langCode]);
        txtMoreInfo = appTexts.txtMoreInfo[langCode];
        $(fsaNAMoreInfo).text(appTexts.txtMoreInfo[langCode]);
        $(phpNAMoreInfo).text(appTexts.txtMoreInfo[langCode]);
        txtItems = appTexts.txtItems[langCode];
        $(totalsCounterBox+'.items .label').text(appTexts.txtItems[langCode]);
        $(tt_summary+' .items .label').text(appTexts.txtItems[langCode]);
        txtFolders = appTexts.txtFolders[langCode];
        $(totalsCounterBox+'.folders .label').text(appTexts.txtFolders[langCode]);
        $(tt_summary+' .folders .label').text(appTexts.txtFolders[langCode]);
        txtFiles = appTexts.txtFiles[langCode];
        $(totalsCounterBox+'.files .label').text(appTexts.txtFiles[langCode]);
        $(tt_summary+' .files .label').text(appTexts.txtFiles[langCode]);
        txtFileLoading = appTexts.txtFileLoading[langCode];
        txtHHFileConvLabel = appTexts.txtHHFileConvLabel[langCode];
        txtHHFileConvTitle = appTexts.txtHHFileConvTitle[langCode];
        txtSeconds = appTexts.txtSeconds[langCode];
        txtSecondsShort = appTexts.txtSecondsShort[langCode];
        txtsls_slideTimeInfo = appTexts.txtsls_slideTimeInfo[langCode];
        txtMg_selectModeInfo = appTexts.txtMg_selectModeInfo[langCode];
        txtMg_separateMode = appTexts.txtMg_separateMode[langCode];
        txtMg_mixedMode = appTexts.txtMg_mixedMode[langCode];
        txtMg_queue = appTexts.txtMg_queue[langCode];
        txtMg_setPauseInfo = appTexts.txtMg_setPauseInfo[langCode];
        txtHttpSatus = appTexts.txtHttpSatus[langCode];
        txtDesc = appTexts.txtDesc[langCode];
        txtTotal = appTexts.txtTotal[langCode];
        $(tt_summary+' .count_all .title').text(appTexts.txtTotal[langCode]);
        txtFileTypes = appTexts.txtFileTypes[langCode];
        $(tt_summary+' .count_files .title').text(appTexts.txtFileTypes[langCode]);
        txtCounter = appTexts.txtCounter[langCode];
        $(totalsCounter+' .btn_counter').attr('title', appTexts.txtCounter[langCode]);
        $(maxPreviewSize+' label').attr('title', appTexts.txtMaxPreviewSize[langCode]);
        $(maxPreviewSize+' .info_fam').attr('tooltip', appTexts.txtMaxPreviewSizeDesc[langCode]);
        // Errors
        txtError = appTexts.txtError[langCode];
        $(modalErrors+' h3.modal_title').text(appTexts.txtError[langCode]);
        $(headerMsg+' .notice .error .txt_error').text(appTexts.txtError[langCode]);
        $(modalErrors+' .info_error.directory_generic_error').html(appTexts.txtErrorDirGeneric[langCode]);
        $(modalErrors+' .info_error.directory_not_allowed_error').html(appTexts.txtErrorDirNotAllowed[langCode]);
        $(modalErrors+' .info_error.directory_change_error').html(appTexts.txtErrorDirChange[langCode]);
        $(modalErrors+' .info_error.php_server_unavailable_error').html(appTexts.txtErrorNoPhpSerInfo[langCode]);
        txtErrorFileList = appTexts.txtErrorFileList[langCode];
        txtErrorLoadList = appTexts.txtErrorLoadList[langCode];
        txtErrorJson = appTexts.txtErrorJson[langCode];
        txtErrorPhpServer = appTexts.txtErrorPhpServer[langCode];
        $(headerMsg+' .notice.er_http .title').text(appTexts.txtErrorPhpServer[langCode]);
        txtErrorFolderNF = appTexts.txtErrorFolderNF[langCode];
        $(headerMsg+' .notice.er_http_400').text(appTexts.txtErrorFolderNF[langCode]);
        $(headerMsg+' .notice.er_http_400 .title').text(appTexts.txtErrorFolderNF[langCode]);
        txtErrorPhpEpNotSet = appTexts.txtErrorPhpEpNotSet[langCode];
        $(headerMsg+' .notice.er_http_dir_not_set .title').text(appTexts.txtErrorPhpEpNotSet[langCode]);
        txtErrorPhpEpNotSetDesc = appTexts.txtErrorPhpEpNotSetDesc[langCode];
        $(headerMsg+' .notice.er_http_dir_not_set .desc').text(appTexts.txtErrorPhpEpNotSetDesc[langCode]);
        txtErrorDocRootNotFound = appTexts.txtErrorDocRootNotFound[langCode];
        $(headerMsg+' .notice.er_http_doc_root_not_found .title').text(appTexts.txtErrorDocRootNotFound[langCode]);
        $(headerMsg+' .notice.er_http_unable_read_dir .title').text(appTexts.txtErrorDocRootNotFound[langCode]);
        txtErrorDocUnabReadDir = appTexts.txtErrorDocUnabReadDir[langCode];
        txtErrorIntSrvError = appTexts.txtErrorIntSrvError[langCode];
        txtErrorIntSrvErrorDesc = appTexts.txtErrorIntSrvErrorDesc[langCode];
        $(headerMsg+' .notice.er_http_500 .desc').text(appTexts.txtErrorIntSrvErrorDesc[langCode]);
        $(headerMsg+' .notice.er_http_500 .title').text(appTexts.txtErrorIntSrvError[langCode]);
        txtErrorInvalidPath = appTexts.txtErrorInvalidPath[langCode];
        $(headerMsg+' .notice.er_http_400 .desc').text(appTexts.txtErrorInvalidPath[langCode]);
        txtErrorNoPhpSer = appTexts.txtErrorNoPhpSer[langCode];
        $(headerMsg+' .notice.er_php_server_unavailable h2').text(appTexts.txtErrorNoPhpSer[langCode]);
        txtErrorHHConvFailed = appTexts.txtErrorHHConvFailed[langCode];
        txtErrorAudioReset = appTexts.txtErrorAudioReset[langCode];
        txtErrorAudioChange = appTexts.txtErrorAudioChange[langCode];
        txtErrorAudioClose = appTexts.txtErrorAudioClose[langCode];
        txtErrorMediaGallery = appTexts.txtErrorMediaGallery[langCode];
        txtErrorLoading = appTexts.txtErrorLoading[langCode];
        txtErrorLoadingTimeout = appTexts.txtErrorLoadingTimeout[langCode];
        txtErrorPhpEp404 = appTexts.txtErrorPhpEp404[langCode];
        $(headerMsg+' .notice.er_php_ep_not_found .title').text(appTexts.txtErrorPhpEp404[langCode]);
        txtErrorPhpEp404Desc = appTexts.txtErrorPhpEp404Desc[langCode];
        $(headerMsg+' .notice.er_php_ep_not_found .desc').text(appTexts.txtErrorPhpEp404Desc[langCode]);
    }

    // Init & Change Lang
    let langCurrent = localStorage.getItem('lang_current') || langDefault;
    setLang(langCurrent);
    // Lang Switch
    $(langSelector).val(langCurrent);
    $(langSelector).on('change', function() {
        let newLang = $(langSelector).val();
        setLang(newLang);
    });


    /*
     *
     * Modal Info
     * 
     */
    $(appInfo_btn+' .version').text(' v'+APP_VER);
    // Show App Info
    $(document).on('click', appInfo_btn, function() {
        showModal('.app_info', true);
    });
    // Infos
    $(appInfo_modal+' .app_title').html(APP_NAME+' <small>v'+APP_VER+'</small>');


    /*
     *
     * Sanitize Text
     * Validate the string and return plain text only.
     * Remove entire blocks that may contain dangerous code. 
     * Escapes HTML special characters (& < > " ') to prevent any interpretation as markup.
     * Normalizes whitespace and collapses multiple whitespace into single spaces.
     * 
     */
    // Regex 
    // Find code blocks.
    // script|style|iframe|object|embed|template|noscript|svg --> Blocks to remove.
    // [\s\S]*? --> Matches any character in non-greedy mode (also across multiple lines).
    // 'gi'     --> (g) Find all matches + (i) case-insensitive.
    const sanText_regexBlocks  = /<(?:script|style|iframe|object|embed|template|noscript|svg)[\s\S]*?<\/(?:script|style|iframe|object|embed|template|noscript|svg)>/gi;
    const sanText_regexSpaces  = /\s+/g;     // Find whitespace sequences.
    const sanText_regexSpChars = /[&<>"']/g; // Find HTML special characters.
    function sanitizeText(input){
        // Returns an empty string for null/undefined.
        if (input == null) return '';
        // Force to string type (numbers/booleans get converted).
        var string = String(input);
        // Remove blocks that may contain dangerous code.
        string = string.replace(sanText_regexBlocks, '');
        // 2) Replace HTML special characters with their escapes to prevent markup interpretation.
        // Perform in a single progressive pass to save memory.
        string = string.replace(sanText_regexSpChars, function(char){
            return char === '&' ? '&amp;'  :
                   char === '<' ? '&lt;'   :
                   char === '>' ? '&gt;'   :
                   char === '"' ? '&quot;' :
                   char === "'" ? '&#39;'  :
                   char; // Default.
        });
        // Replace sequences of whitespace with a single space and trim.
        string = string.replace(sanText_regexSpaces,' ').trim();
        return string;
    }


    /*
     *
     * Items Size
     *
     */
    function calcInvertedPosition(min, max, current){ 
        return max - (current - min); 
    }
    function itemsSize_labelTitle(txtSize){ 
        let txtLabel = $(itemsSize_label).attr('data-title');
        return txtLabel+': '+txtSize; 
    }
    // Configure the input range.
    const itemsSize_allowedSizes = [1,2,3,4,5,6,7,8,9,10,11,12];
    const itemsSize_minSize = Math.min(...itemsSize_allowedSizes);
    const itemsSize_maxSize = Math.max(...itemsSize_allowedSizes);
    let itemsSize_current = localStorage.getItem('itemsSize_Current') || itemsSize_defaultValue;
    $(itemsSize_select).attr({
        min: itemsSize_minSize, 
        max: itemsSize_maxSize, 
        step: 1, 
        value: calcInvertedPosition(itemsSize_minSize, itemsSize_maxSize, itemsSize_current), // Range Position.
    });
    // Show selected value.
    $(itemsSize_label).attr('title', itemsSize_labelTitle(itemsSize_current) );
    // Change Items Size.
    function itemsSize_change(getSize){
        let size = Number(getSize);
        // Save Logical value.
        localStorage.setItem('itemsSize_Current', size);
        // Change Range Position.
        const inputRangeVal = calcInvertedPosition(itemsSize_minSize, itemsSize_maxSize, size);
        $(itemsSize_select).val(inputRangeVal);
        // Change Title Value.
        $(itemsSize_label).attr('title', itemsSize_labelTitle(String(size)) );
        // Remove all existing body classes.
        itemsSize_allowedSizes.forEach(function(oneAllowedSize) {
            $('body').removeClass(`col_x${oneAllowedSize}`);
        });
        // Add New body class.
        if (itemsSize_allowedSizes.includes(size)) {
            $('body').addClass(`col_x${size}`);
        }
    }
    // Init Size (logical value)
    itemsSize_change(itemsSize_current);
    // Btn Change Size.
    $(itemsSize_select).on('change', function() {
        const inputRangeVal = Number($(this).val()); // Inverted from logical value.
        // Set Logical value
        const selectedSize = calcInvertedPosition(itemsSize_minSize, itemsSize_maxSize, inputRangeVal);
        itemsSize_change(selectedSize);
    });


    /*
     *
     * Reset App
     * Reset the App to its starting condition.
     * 
     */
    function resetApp(){
        // Reset UI
        $(inputPath).attr('readonly', 'readonly').attr('disabled', 'disabled').val('');
        $(inputSubfolderPath).attr('readonly', 'readonly').attr('disabled', 'disabled').val('');
        $(inputServerFolder).attr('readonly', 'readonly').attr('disabled', 'disabled').val('');
        $(inputSearch).attr('readonly','readonly').attr('disabled','disabled').val('');
        $(itemsSize_select).attr('readonly','readonly').attr('disabled','disabled');
        $(fileAccessMode_OptFsa+','+fileAccessMode_OptPhp).css('display','none');
        setCounter(0);
        $(headerMsg).html('');
        $('#finder').html('');
        $('#breadcrumb').html('');
        $('.info_box').html('').hide(0);
        // Reset Data
        navigationPath = [];
        basePath       = '';
        fsa_directoryHandle = null;
        php_directoryTarget = null;
        freeUpBrowserMemory();
    }


    /*
     *
     * Set Counter
     * Show the number of items displayed in the counter.
     * or show loading.
     * 
     */
    function setCounter(n_items=0, n_folders=0, n_files=0, counter_fileExt=null){
        // console.log(n_items); // Debug
        // Reset
        $(totalsCounter+' .btn_counter.active').click();
        $(totalsCounter+' .counter_box').removeClass('btn_counter').attr('title','');
        $(totalsCounterBox).removeClass('visible last').hide(0);
        // Loading
        if(n_items === 'loading'){
            $(totalsCounterBox+'.loading').text(txtLoader).show(0);
            return;
        }
        // Show Counter Data
        if( $.isNumeric(n_items) ){
            // Returns the line with the contents of an entry.
            function getItemContent(no='0', label=''){
                return '<span class="no">'+no+'</span> <span class="label">'+label+'</span>';
            }
            // Show items by type: files, folders, other.
            let other = n_items - n_folders - n_files;
            if(other     > 0) console.log(other);
            if(n_folders > 0) $(totalsCounterBox+'.folders').html(getItemContent(n_folders,txtFolders)).show(0);
            if(n_files   > 0) $(totalsCounterBox+'.files').html(getItemContent(n_files,txtFiles)).show(0);
            if(n_items   > 0) $(totalsCounterBox+'.items').html(getItemContent(n_items,txtItems)).show(0);
            // Add the .visible class to displayed .box elements to show the comma.
            $(totalsCounterBox).each(function() {
                if ($(this).is(':visible')) $(this).addClass('visible');
            });
            // Find the last .box.visible element and add the .last class to show the period.
            $(totalsCounterBox).last().addClass('last');
            // If the counter is present.
            if(counter_fileExt!==null){
                // Finder Item Count
                let countFI_title = '<div class="row title">'+txtTotal+'</div>';
                let countFI_cbox  = '';
                    if(n_items   > 0) countFI_cbox += '<div class="tbox items">'  +getItemContent(n_items,txtItems)+    '</div>';
                    if(n_folders > 0) countFI_cbox += '<div class="tbox folders">'+getItemContent(n_folders,txtFolders)+'</div>';
                    if(n_files   > 0) countFI_cbox += '<div class="tbox files">'  +getItemContent(n_files,txtFiles)+    '</div>';
                let countFI_counter = '<div class="row">'+countFI_cbox+'</div>';
                let countFI = '<div class="count_all">'+countFI_title+countFI_counter+'</div>';
                // File Extension Count
                // If there are any files, show the extension count.
                let countFE = '';
                if(n_files > 0){
                    let countFE_title = '<div class="row title">'+txtFileTypes+'</div>';
                    let countFE_data = '';
                    // Sort data alphabetically, create rows, and remove separator (added with CSS).
                    let fileSummary = Object.keys(counter_fileExt)
                    .sort().map(ext => '<div class="tbox">'+getItemContent(counter_fileExt[ext],'.'+ext)+'</div>').join('');
                    countFE_data += '<div class="row">'+fileSummary+'</div>';
                    countFE = '<div class="count_files separator">'+countFE_title+countFE_data+'</div>';
                }
                // Show Data.
                $(tt_summary).html(countFI+countFE);
                $(totalsCounter+' .counter_box').addClass('btn_counter').attr('title',txtCounter);
                $(tt_summary+' .count_all .tbox').last().addClass('last');
                $(tt_summary+' .count_files .tbox').last().addClass('last');
            }
            return;
        }
        return;
    }

    // Button > Pin the counter tooltip.
    $(document).on('click',totalsCounter+' .btn_counter',function(){
        $(this).toggleClass('active');
        let isActive = $(this).hasClass('active');
        if(isActive){ 
            $(tt_summary).show(0); 
        } else {
            $(tt_summary).hide(0);
        }
    });
    // Show counter tooltip on hover.
    $(document).on('mouseover',totalsCounter+' .btn_counter',function(){
        let isActive = $(this).hasClass('active');
        if(!isActive){ 
            $(tt_summary).show(0); 
        }
    });
    $(document).on('mouseout',totalsCounter+' .btn_counter',function(){
        let isActive = $(this).hasClass('active');
        if(!isActive){ 
            $(tt_summary).hide(0); 
        }
    });


    /*
     *
     * Init File Access Mode
     * [File System Access API] or [PHP Server]
     * 
     */
    const selectFam  = '.file_access_mode select.fam_select';
    function fileAccessMode_init(selectedEngine){
        resetApp();
        // Set File Access Mode
        switch(selectedEngine){
            // File System Access API
            case 'fsa_mode':
                $(fileAccessMode_OptFsa).css('display','inline-block');
                localStorage.setItem('fileAccessMode_current', 'fsa_mode');
                $(selectFam).val('fsa_mode');
                if( isFileSystemAccessAvailable() ){
                    $(headerMsg).append('<div class="notice wellcome_mode_fsa"><h2>'+txtSelectFolderInfo+'</h2></div>');
                } else {
                    let btn_naInfo = '<div class="btn btn_fsa_na_info">'+txtMoreInfo+'</div>';
                    $(headerMsg).append('<div class="notice er_browser_not_comp"><h2>'+txtBrowserNotCompMsg+'</h2>'+btn_naInfo+'</div>');
                }
            break;
            // PHP Server
            case 'php_mode':
                $(fileAccessMode_OptPhp).css('display','inline-block');
                localStorage.setItem('fileAccessMode_current', 'php_mode');
                $(selectFam).val('php_mode');
                loadDirectoryByPhpServer();
            break;
        }
    }
    // Init "File Access Mode" on startup and change.
    fileAccessMode_init(localStorage.getItem('fileAccessMode_current') || fileAccessMode_default);
    $(selectFam).on('change', function() {
        fileAccessMode_init( $(this).val() );
    });


    /*
     *
     * Preview Control
     * 
     */
    const maxPreviewSize_input = $(maxPreviewSize+' input.input_max_preview_size');
    // Convert MB <-> Byte.
    function mbToByte(MB){
        const number = Number(MB);
        if (!Number.isFinite(number)) return 0; // Invalid values ​​return 0.
        return number * 1000000;
    }
    function byteToMb(bytes){
        const number = Number(bytes);
        if (!Number.isFinite(number)) return 0; // Invalid values ​​return 0.
        return number / 1000000;
    }
    // Maximum file size that can be used as a preview (MB).
    let previewMaxBytes = Number(localStorage.getItem('preview_max_bytes')) || mbToByte(previewMaxMB_default);
    // Set Input
    maxPreviewSize_input.val(byteToMb(previewMaxBytes)).attr('placeholder', previewMaxMB_default);
    // Set maximum preview file size (MB).
    // If the value is valid, enter the new maximum, otherwise (negative values) leave unchanged (0 disables the limit).
    async function changeMaxPreviewSize(){
        let newMax_mb = maxPreviewSize_input.val();
        if(newMax_mb >= 0) {
            previewMaxBytes = mbToByte(newMax_mb);
            localStorage.setItem('preview_max_bytes', previewMaxBytes);
            if(newMax_mb==='') maxPreviewSize_input.val(0);
            // console.log(previewMaxBytes); // Debug
            // Reload the view with the new settings.
            let fileAccessMode = localStorage.getItem('fileAccessMode_current');
            switch(fileAccessMode){
                case 'fsa_mode':
                    // console.log(fsa_directoryHandle); // Debug
                    await loadDirectoryByFSA(fsa_directoryHandle);
                break;
                case 'php_mode':
                    // console.log(php_directoryTarget); // Debug
                    await loadDirectoryByPhpServer(php_directoryTarget);
                break;
            }
            // Another method to reload
            // $('#breadcrumb.breadcrumb .path_folder:last').click();
        } else {
            maxPreviewSize_input.val(byteToMb(previewMaxBytes));
        }
    }
    maxPreviewSize_input.on('change', function() {
        changeMaxPreviewSize();
    });
    maxPreviewSize_input.on('keydown', function(e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            changeMaxPreviewSize();
        }
    });

    
    /*
     *
     * Stop unwanted loads
     * Check the token and stop the asynchronous loading
     * 
     */
    function checkTokenAndStop(loadToken,url=null){
        if (loadToken !== currentLoadToken) {
            // console.log('Loading Canceled ('+loadToken+' !== '+currentLoadToken+')');
            if(url !== null) {
                URL.revokeObjectURL(url);
            }
            $(currentLoader).hide(0);
            return true;
        }
        return false;
    }


    /*
     *
     * Free Up the Browser Memory
     * 
     */
    function freeUpBrowserMemory(){
        if( autoFreeMemory == true ) {
            // console.log('Free Up Memory', blobURLs);
            // Revoke all blob URLs that have been stored.
            for (const blobURL of blobURLs) {
                URL.revokeObjectURL(blobURL);
            }
            blobURLs.length = 0; // Clear the array.
            // console.log('Freed Memory', blobURLs);
        }
    }


    /*
     *
     * Folder Selection
     * 
     */
    async function handleFolderSelection() {
        if ( isFileSystemAccessAvailable() ) {
            try {
                // Import Current Token. 
                // The user might close the window without taking any action.
                let loadToken = currentLoadToken;
                const currentDirHandle = await window.showDirectoryPicker();
                if (checkTokenAndStop(loadToken)) return;

                const rootFolderName = currentDirHandle.name || "Root";
                navigationPath = [{
                    name: `${rootFolderName}`, // Debug: `${rootFolderName} (root)`
                    handle: currentDirHandle,
                    path: ''
                }];
                // Activate Base path Input
                $(inputPath).removeAttr('readonly').removeAttr('disabled');
                $(inputSubfolderPath).removeAttr('disabled');
                $(inputSearch).removeAttr('readonly').removeAttr('disabled');
                $(itemsSize_select).removeAttr('readonly').removeAttr('disabled');

                // Show loading.
                $(currentLoader).show();
                fsa_directoryHandle = currentDirHandle;
                await loadDirectoryByFSA(fsa_directoryHandle);
                if (checkTokenAndStop(loadToken)) return;

            } catch (error) {
                // console.error(error);
                if (error.name !== 'AbortError') {
                    // Show the error in the modal window.
                    showModal(modalErrors, true);
                    if (error.name === 'NotAllowedError') {
                        $(modalErrors+' .title_error').show(0);
                        $(modalErrors+' .info_error.directory_not_allowed_error').show(0);
                    } else {
                        $(modalErrors+' .title_error').show(0);
                        $(modalErrors+' .info_error.directory_generic_error').show(0);
                    }
                }
                if( navigationPath.length === 0 ) {
                    $('#finder').empty();
                }
            } finally {
                // Always hide the loading indicator (both on success and on error).
                $(currentLoader).hide();
            }
        } else {
            showModal(modalBrowserNS, true);
        }
    }
    // Button to select a starting folder.
    $(document).on('click', fsaSelectFolder, async function() {
        handleFolderSelection();
    });

    // Browser Not Available: Show info modal.
    $(document).on('click', fsaNAMoreInfo, function() {
        showModal(modalBrowserNS, true);
    });

    $(document).on('click', phpNAMoreInfo, function() {
        showModal(modalErrors, true);
        $(modalErrors+' .info_error.php_server_unavailable_error').show(0);
    });


    /*
     * 
     * Generate URL
     * 
     */

    // Add Base Path Url Prefix.
    // Based on the syntax used in the file path by the operating system in use.
    // Move the folder to your OS terminal to see the path.
    function getBasePath(inputPath){
        // The URL to a file can be local (:///) or network (://).
        const urlFile_network = 'file://';
        const urlFile_local   = 'file:///';
        let urlFile  = urlFile_network;
        let urlPath  = inputPath;
        const unixLikeOS = ['linux', 'android', 'macos', 'ios'];
        let isUnixLikeOS = unixLikeOS.includes(isOS);
        if(isOS==='windows'){
            // Local or network URL? The decision is up to the user.
            const isLocalPath = /^[A-Za-z]:/.test(inputPath);
            if(isLocalPath) urlFile = urlFile_local;
            // Remove the Windows shell quotes "".
            urlPath = inputPath.replace("/\""/g,''); // .replace(/"/g,''); 
        }else if(isUnixLikeOS){
            // Remove Unix shell escapes '\'.
            urlPath = inputPath.replace(/\\/g,'');
        }
        // Use encodeURI to convert spaces and more into url syntax, 
        // this string must always end with a single "/".
        const basePath = urlFile+encodeURI(urlPath).replace(/\/+$/,'')+'/';
        return basePath;
    }


    // Get Navigation Path
    // No starting slash + Ending slash included + No slash if empty.
    // this/part/of/the/url/
    function getNavigationPath(path) {
        let trimmed = path.replace(/^\/+|\/+$/g, '');
        let trimmedPath = trimmed ? trimmed + '/' : '';
        return trimmedPath;
    }


    /*
     *
     * Base Path
     * 
     */
    $(document).on('input', inputPath, function(event) {
        let basePathValue = event.target.value.trim();
        if(basePathValue !== ''){
            basePath=getBasePath(basePathValue);
        } else {
            basePath='';
        }
        if (typeof window.global_reloadPath === 'function') {
            window.global_reloadPath();
        }
    });
    // Add Final Slash (on blur).
    $(document).on('blur', inputPath, function() {
        let val = $(this).val().trim();
        if (val !== '' && !val.endsWith('/')) {
            $(this).val(val + '/');
        }
    });


    /*
     *
     * Reload Path
     * 
     */
    window.global_reloadPath = async function(targetIndex = null) {
        // Display the loading screen at the start.
        $(currentLoader).show();
        const loadToken = currentLoadToken;
        try {
            // Correct and eliminate repetitions.
            if (targetIndex !== null) {
                // Free the memory.
                freeUpBrowserMemory();
                // Breadcrumb mode: navigate to a specific index.
                navigationPath = navigationPath.slice(0, targetIndex + 1);
                const targetFolderHandle = navigationPath[targetIndex].handle;
                fsa_directoryHandle = targetFolderHandle;
                await loadDirectoryByFSA(fsa_directoryHandle);
                if (checkTokenAndStop(loadToken)) return;
            } else {
                // Generic mode: reloads the current directory.
                const currentFolderHandle = navigationPath[navigationPath.length - 1].handle;
                fsa_directoryHandle = currentFolderHandle;
                await loadDirectoryByFSA(fsa_directoryHandle);
                if (checkTokenAndStop(loadToken)) return;
            }
        } catch (error) {
            // console.error(error);
            // Show the error in the modal window.
            showModal(modalErrors, true);
            if (error.name === 'NotAllowedError') {
                $(modalErrors+' .info_error.directory_not_allowed_error').show(0);
            } else {
                $(modalErrors+' .info_error.directory_change_error').show(0);
            }
            // Reset the breadcrumb to a previous state.
            if (navigationPath.length > 1) {
                navigationPath.pop();
                await window.global_reloadPath(navigationPath.length - 1);
                if (checkTokenAndStop(loadToken)) return;
            }
        } finally {
            // Always hide loading (on success or failure).
            $(currentLoader).hide();
        }
    };


    /*
     *
     * Excluded Files
     * Checks whether a file should be excluded
     * 
     */
    function isExcludedFile(fileName) {
        if( skipExcludedFiles == true ) {
            return excludedFiles.includes(fileName);
        }
        return false;
    }


    /*
     *
     * Hidden Files
     * Check if a file is hidden
     *
     */
    function isHiddenFile(fileName) {
        if( skipHiddenFiles == true ) {
            return fileName.startsWith('.');
        }
        return false;
    }


    /*
     *
     * Check if HEIC/HEIF format is convertible on non-Safari browsers.
     * Safari doesn't need this function because it is natively compatible with HEIC/HEIF.
     *
     */
    function isHeifHeicConvertibleOnNonSafari(fileName){
        if(convertHeifHeic !== true) return false;
        fileName = fileName.toLowerCase(); // Case insensitive.
        // IF the browser is not Safari.
        if( isBrowser !== 'safari' ){
            // HEIC/HEIF extension.
            if( fileName.endsWith('.heic') || fileName.endsWith('.heif') ){
                // The conversion function exists.
                if (typeof heic2any === 'function') return true;
            }
        }
        return false;
    }


    /*
     *
     * Semaphore
     * Limits the number of asynchronous operations executed concurrently.
     * - Configurable: 
     *   createSemaphore(1..4); Maximum simultaneous operations.
     * 
     */
    function createSemaphore(max=1) {
        // Defaults
        let running = 0;
        const queue = [];
        // Accepts a task (async) and controls its execution.
        return async function run(task) {
            // If we've reached the allowed maximum.
            if (running >= max) {
                // Create a Promise and push its resolver into the queue to wait for its turn.
                await new Promise(resolve => queue.push(resolve));
            }
            running++; // Occupy one slot.
            try {
                // Execute the task.
                return await task();
            } finally {
                running--; // Free one slot.
                const next = queue.shift(); // Take the next resolver.
                if (next) next(); // If a resolver exists, call it to unblock the next caller.
            }
        };
    }
    let maxHHConvCurrent = localStorage.getItem('maxHHConv_current') || maxHHConvDefault;
    let convertHeifHeicSemaphore = createSemaphore(maxHHConvCurrent);


    /*
     *
     * Change HEIF/HEIC Conversion Limit.
     * The conversion is performed via a Promise for each item. 
     * Promises cannot be cancelled once started, 
     * so if I increase the limit it cannot be decreased for Promises that have already started
     * therefore the user is asked to reload the app to apply the new limit.
     * 
     */
    const selectHHConvLimit_input = modalOptions+' .section.select_hhconv_limit .set_limit input[type="number"]';
    // Show Modal
    $(document).on('click','.show_select_hhconv_limit',function(){
        showModal(modalOptions, true);
        $(modalOptions+' .section.select_hhconv_limit').show(0);
        $(selectHHConvLimit_input).val(maxHHConvCurrent);
    });
    // Change Limit
    $(document).on('change',selectHHConvLimit_input,function(){
        let newMax = parseInt($(this).val(),10) || null;
        // If the value is defined and is a number set the new conversion limit.
        if (typeof newMax !== 'undefined' && Number.isFinite(Number(newMax))) {
            localStorage.setItem('maxHHConv_current', newMax);
        }
    });
    // Reset Limit
    $(document).on('click',modalOptions+' .section.select_hhconv_limit .btn_set_default',function(){
        localStorage.setItem('maxHHConv_current', maxHHConvDefault);
        let maxHHConvCurrent = localStorage.getItem('maxHHConv_current');
        $(selectHHConvLimit_input).val(maxHHConvCurrent); // Get (and test) saved data.
    });


    /*
     *
     * Disable links by class (.link_disabled).
     * 
     */
    $(document).on('click','a.link_disabled',function(e){
        e.preventDefault(); 
    });


    /*
     *
     * Checks whether the file extension is compatible with the current browser.
     * If it is, fileExtCheck_compatibility() returns true.
     * 
     */
    // Extracts the file extension from a URL or filename.
    // I place the function outside fileExtCheck_compatibility() to save memory.
    function getExtensionByUrl(url) {
        // trim()      | Remove whitespace and search for the match.
        // \.          | Find the dot before the extension.
        // ([a-z0-9]+) | Capture the extension without the dot.
        // (?=[?#]|$)  | Ensure that immediately after there is '?' or '#' or the end of the string.
        // i           | Case‑insensitive match.
        // The result of the match is an array; the extension is at [1].
        const m = url.trim().match(/\.([a-z0-9]+)(?=[?#]|$)/i);
        //  If an extension is found, convert it to lowercase.
        return m ? m[1].toLowerCase() : '';
    }
    // If the file extension is compatible with the current browser returns true.
    function fileExtCheck_compatibility(url, browserName) {
        if (typeof url !== 'string' || typeof browserName !== 'string') return false;
        const fileExtension  = getExtensionByUrl(url);
        if (!fileExtension) return false;
        const currentBrowser = browserName.trim().toLowerCase();
        const set = browserSupport_extension[currentBrowser];
        return Boolean(set && set.has(fileExtension));
    }


    /*
     * 
     * Increment the count based on the extension type or reset the counter.
     * 
     */
    function countFileTypesByExt(ext=null, action='count'){
        if(action==='reset'){
            fileCounter = {}; // Default.
            return;
        }
        if(action==='count'){
            if( ext==null || typeof ext !== 'string' ) return;
            // Remove spaces from the file extension.
            ext = ext.trim();
            // If the key does not exist, we initialize it to 0, then increment it.
            if (!fileCounter[ext]) {
                fileCounter[ext] = 0;
            }
            fileCounter[ext] += 1;
        }
        return;
    }


    /*
     *
     * Load Directory Contents
     * 
     * Load and display the contents of a folder on the computer/device.
     * - Use the same UI style as the web server (PHP) mode,
     *   present in the function loadDirectoryByPhpServer();
     * 
     */
    async function loadDirectoryByFSA(dirHandle) {
        if(dirHandle==null) return;
        $(currentLoader).show(0);
        // Increment the token whenever a new loading starts.
        currentLoadToken++;
        const loadToken = currentLoadToken;
        // Select items and clear previous contents.
        $(headerMsg).html('');
        $('#finder').html('');
        $('#breadcrumb').html('');
        setCounter('loading');

        // Create a Dynamic Breadcrumb.
        navigationPath.forEach((folder, index) => {
            // Folder Link.
            const breadcrumbFolder = document.createElement('div');
            breadcrumbFolder.textContent = folder.name;
            breadcrumbFolder.className = 'path_folder';
            // Click event on the folder name.
            // Pass the current index to global_reloadPath().
            breadcrumbFolder.addEventListener('click', async () => {
                await window.global_reloadPath(index);
                if (checkTokenAndStop(loadToken)) return;
            });
            if (index === 0) {
                // Add Root Icon.
                const root_icon = document.createElement('div');
                root_icon.className = 'icon folder root';
                breadcrumbFolder.prepend(root_icon);
            }
            // Add the link to the breadcrumb.
            breadcrumb.appendChild(breadcrumbFolder);
            // Add the separator between folders, except for the last one.
            if (index < navigationPath.length - 1) {
                const separator = document.createElement('span');
                separator.innerHTML = '&gt;'; // Icon >
                separator.className = 'separator';
                breadcrumb.appendChild(separator);
            }
        });

        // Variables used to generate the Direct Link.
        const pathLast = navigationPath[navigationPath.length - 1]?.path || '';
        const pathNav  = pathLast;

        // Subfolder path for path viewer.
        let showSubfolderPath = pathNav;
        if (showSubfolderPath.startsWith('/')) {
            showSubfolderPath = showSubfolderPath.substring(1);
        }
        // Show subfolder path + Full path tooltip.
        if( $(inputPath).val() !== '') {
            $(inputSubfolderPath).val(showSubfolderPath);
            let fullPath = basePath+showSubfolderPath;
            $(optBasePath).attr('tooltip', fullPath).attr('tooltip-pos', 'bottom');
        } else {
            $(inputSubfolderPath).val('');
            $(optBasePath).removeAttr('tooltip').removeAttr('tooltip-pos');
        }

        // Array for saving folders for previews.
        const filePreviews   = [];
        const folderPreviews = [];
        // Folders and files of the file system.
        const entries = [];
        // Lists files and subfolders in the current directory.
        for await (const [name, handle] of dirHandle) {
            if (checkTokenAndStop(loadToken)) return;
            // Skip hidden and excluded files.
            if ( isExcludedFile(name) || isHiddenFile(name) ) {
                continue; // Skip the file.
            }
            entries.push({ name, handle });
        }
        // Sort entities: folders before files, alphabetically.
        entries.sort((a, b) => {
            if (a.handle.kind === b.handle.kind) {
                return a.name.localeCompare(b.name);
            }
            return a.handle.kind === 'directory' ? -1 : 1;
        });

        // Reset HEIF/HEIC Conversion Counter.
        fcCounter_HHCurConv = 0;
        fcCounter_HHTotal   = 0;

        // Count by file type
        countFileTypesByExt(null,'reset');

        // Process sorted entities.
        for (const { name, handle } of entries) {

            if (checkTokenAndStop(loadToken)) return;
            // Create the main container (item folder/file).
            const preview = document.createElement('div');
            preview.className = `${handle.kind === 'directory' ? 'folder' : 'file'} item`;
            // Create the inner container.
            const box = document.createElement('div');
            box.className = 'box';
            const previewBox = document.createElement('div');
            previewBox.className = `preview`;

            // Files
            if (handle.kind === 'file') {

                const file = await handle.getFile();
                if (checkTokenAndStop(loadToken)) return;

                // File Data
                const fileName = file.name;

                // Returns the URL pointing to the file; depending on the 
                // current situation it may be either a blob URL or an absolute URL.
                function getLink(basePath='', navPath='', blobFile=null){
                    // Get Blob
                    // console.log(basePath); // Debug
                    if(basePath==='' && blobFile!==null) return blobFile;
                    // Get Absolute Url.
                    navPath = getNavigationPath(navPath);
                    const pathLink = basePath+navPath+fileName;
                    return pathLink;
                } 

                // Check the media for a preview.
                const fileMime = file.type || '';
                const file_isImage = fileMime.startsWith('image/');
                const file_isVideo = fileMime.startsWith('video/');
                const file_isAudio = fileMime.startsWith('audio/');
                const file_isReadable = fileExtCheck_compatibility(fileName, isBrowser);
                // Check once to use it multiple times.
                const isHeifConvertible = isHeifHeicConvertibleOnNonSafari(fileName);

                // Get File Extension
                const extension = fileName.split('.').pop().toLowerCase();
                // Increment the counter based on the extension type.
                // For this calculation, it is not necessary to check whether the file is compatible with the browser.
                countFileTypesByExt(extension);

                // Get Blob.
                let blobFile = URL.createObjectURL(file);
                blobURLs.push(blobFile); // Store the URL blob.

                // Init Link
                const link  = document.createElement('a');
                link.title  = fileName;
                link.href   = getLink(basePath, pathNav, blobFile);
                link.target = '_blank';

                // Init DirectLink
                const directLink  = document.createElement('a');

                // Add direct link to file types that use modal preview.
                let withDirectLink = file_isImage || file_isVideo || file_isAudio || file_isReadable || isHeifConvertible;
                if (withDirectLink) {
                    directLink.title = txtDirectLink+': '+fileName;
                    directLink.classList.add('direct_link');
                    directLink.setAttribute('download', fileName);
                    directLink.target = '_blank';
                    directLink.href = getLink(basePath, pathNav, blobFile);
                    // The direct link is always accessible to the user.
                    box.appendChild(directLink);
                }
                
                // File Audio
                if (file_isAudio) {
                    link.className = 'popup-audio';
                    link.setAttribute('data_mime', fileMime);
                }

                // Files readable by the browser. 
                if(file_isReadable) {
                    let file_identified = file_isImage || file_isVideo || file_isAudio || isHeifConvertible;
                    // That are NOT already identified types. 
                    if(!file_identified){
                        link.className = 'popup-iframe';
                    }
                }

                // Get File Icon
                function getFileIcon(file) {
                    // Get and try with the MIME Type.
                    let mimeType = file.type;
                    // HEIC Files Icon
                    // In non‑Safari browsers the MIME type is not present, so we add it to display the correct icon.
                    if(isHeifConvertible){ 
                        mimeType = 'image/heif'; 
                    }
                    let fileClass = fileIcons_mimeType[mimeType];
                    // If the MIME type is not available, try the extension.
                    if (!fileClass) {
                        const extension = fileName.split('.').pop().toLowerCase();
                        fileClass = fileIcons_extension[extension];
                    }
                    // If you can't find the icon, use the generic one.
                    return fileClass || fileIcons_mimeType['file'];
                }
                // Set a generic icon at the start.
                const fileClass = getFileIcon(file);
                const fileDefaultIcon = document.createElement('div');
                fileDefaultIcon.classList.add('file_icon', fileClass);
                previewBox.appendChild(fileDefaultIcon);

                // We insert the label (text) inside the link.
                const label = document.createElement('div');
                label.textContent = name;
                label.className = `label`;
                link.appendChild(previewBox);
                link.appendChild(label);
                box.appendChild(link);

                // Add to file list for preview loading.
                filePreviews.push({ file, previewBox, link, blobFile, basePath, name });

            // Directorys
            } else if (handle.kind === 'directory') {

                // Link to the folder.
                const link = document.createElement('a');
                link.href = "#";
                link.title = handle.name;
                link.appendChild(previewBox);

                // Label (folder text) in the link.
                const label = document.createElement('div');
                label.textContent = name;
                label.className = `label`;
                link.appendChild(label);

                // Folder Click Event.
                link.addEventListener('click', async (e) => {
                    e.preventDefault();
                    navigationPath.push({ 
                        name: name,
                        handle: handle,
                        // Real Path.
                        path: `${navigationPath[navigationPath.length - 1].path}/${name}`
                    });
                    // Free the memory.
                    freeUpBrowserMemory();
                    // Load the folder.
                    fsa_directoryHandle = handle;
                    await loadDirectoryByFSA(fsa_directoryHandle);
                    if (checkTokenAndStop(loadToken)) return;
                });
                const folderView = document.createElement('div');
                folderView.className = `folder_view`;
                link.appendChild(folderView);
                box.appendChild(link);
                // Add folders to the preview list.
                
                folderPreviews.push({ handle, previewBox});

            }
            preview.appendChild(box);
            finder.appendChild(preview);
        }

        // Loading previews in the background after initial display.
        loadFolderPreview(folderPreviews, loadToken);
        loadFilePreviews(filePreviews, loadToken);
        $(currentLoader).hide(0);

        // Apply the search filter.
        if ($(inputSearch).length && $(inputSearch).val().trim() !== '') {
            applySearchFilter();
        }
        // Items Counter
        let count_items = entries.length; // All Items.
        // All Folders
        // filter() returns only the elements for which the callback returns true.
        let count_folders = entries.filter(item => {
            // Convert the value of kind to a string and prepare it for comparison.
            let kind = (item.handle?.kind || '').toString().toLowerCase();
            // Counts the elements that return true.
            return kind === 'directory';
        }).length;
        // All Files
        // Same method used to count folders...
        let count_files = entries.filter(item => {
            let kind = (item.handle?.kind || '').toString().toLowerCase();
            return kind === 'file';
        }).length;
        // Show Data
        setCounter(count_items, count_folders, count_files, fileCounter);
        // Debug: 
        // console.log(entries);
        // console.log(entries[0].handle);

    }


    /*
     *
     * Load Folder Preview
     * 
     */
    async function loadFolderPreview(folderPreviews, loadToken) {
        $(currentLoader).show(0);
        // Extensions allowed for previews.
        const allowedExt_string = fsaFolderPreview_allowedExt.join('|');
        const allowedExt_regex  = new RegExp('\\.('+allowedExt_string+')$','i');
        // Check the files in the directory.
        for (const { handle, previewBox } of folderPreviews) {
            // Avoid asynchronous race errors.
            // Block if the token is no longer valid before starting.
            if (checkTokenAndStop(loadToken)) return;

            // Collect the files in the folder and sort them alphabetically.
            let dirPreview_fileName   = null;
            let dirPreview_fileHandle = null;
            let dirPreview_fileNameCheck = null;
            for await (const [name, childHandle] of handle) {
                if (checkTokenAndStop(loadToken)) break;
                // If the item in the folder is a file.
                if (childHandle.kind !== 'file') continue;
                // If the file has a supported extension (image or video).
                if (!allowedExt_regex.test(name)) continue;
                // File name for alphabetical comparison.
                // 1) Convert to string.
                // 2) Normalize (consists of characters in the same Unicode form).
                // 3) Convert to lowercase using local language rules (for a more exact alphabetical order in each language).
                const nameCheck = String(name).normalize('NFC').toLocaleLowerCase();
                // Check and choose the file that comes first in alphabetical order.
                if (dirPreview_fileName === null || nameCheck < dirPreview_fileNameCheck) {
                    dirPreview_fileName   = name;
                    dirPreview_fileHandle = childHandle;
                    dirPreview_fileNameCheck = nameCheck;
                }
            }

            if (checkTokenAndStop(loadToken)) return;
            // If we didn't find any preview files, you're done.
            if (!dirPreview_fileHandle) continue;

            // If we have found a preview file we load its properties with getFIle().
            const file = await dirPreview_fileHandle.getFile();
            if (checkTokenAndStop(loadToken)) return;

            // Mime Type
            const mimeType = file.type || '';
            const isImage = mimeType.startsWith('image/');
            const isVideo = mimeType.startsWith('video/');

            // File Size
            // If the file size in bytes is missing, fileSize_byte will be null.
            const fileSize_byte = file.size || null;
            const fileSize_verified = fileSize_byte !== null;
            // If the maximum value is 0, there is no limit, so allow uploads.
            // If you know the file size, allow uploads only for files within the maximum limit.
            const isAllowedFileSize = previewMaxBytes === 0 || fileSize_verified && fileSize_byte <= previewMaxBytes;

            let folderPreviewImage = null;
            // If the file is the correct size and is a compatible image or video.
            // If the browser doesn't natively support a Mime Type, the MimeType will be blank.
            // Therefore, the preview image will not be applied.
            if (isAllowedFileSize && (isImage || isVideo)) {
                // Store blob URL and return the object.
                const folderPreviewUrl = URL.createObjectURL(file);
                blobURLs.push(folderPreviewUrl);
                folderPreviewImage = {
                    previewUrl: folderPreviewUrl,
                    type:       mimeType
                };
            }

            // IF Previews are active, generate folder preview-
            if(previewActive_all && folderPreviewImage){

                // Preview Data
                const { type, previewUrl } = folderPreviewImage;
                const isVideo = type.startsWith('video/');
                const isImage = type.startsWith('image/');

                // Video Preview
                if (previewActive_video && isVideo) {

                    const video = document.createElement('video');
                    video.src = previewUrl;
                    video.controls = false;
                    video.muted = true;
                    video.preload = 'metadata';
                    video.addEventListener('loadedmetadata', () => {
                        const targetTime = video.duration / 2;
                        video.currentTime = targetTime;
                    });
                    video.addEventListener('seeked', () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = video.videoWidth;
                        canvas.height = video.videoHeight;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                        const imgUrl = `url("${canvas.toDataURL()}")`;
                        previewBox.style.backgroundImage = imgUrl;
                        URL.revokeObjectURL(video.src);
                        video.remove();
                    });
                    previewBox.appendChild(video);

                // Image Preview
                // Do not use as a preview if conversion is needed.
                } else if(previewActive_image && isImage) {

                    const imgUrl = `url("${previewUrl}")`;
                    previewBox.style.backgroundImage = imgUrl;
                    
                }
            }
        }
        $(currentLoader).hide(0);
    }


    /*
     *
     * Load File Previews
     * 
     */
    async function loadFilePreviews(filePreviews, loadToken) {
        $(currentLoader).show(0);
        for (const { file, previewBox, link, blobFile, basePath, name } of filePreviews) {
            if (checkTokenAndStop(loadToken)) return;

            // File Size
            // If the file size in bytes is missing, fileSize_byte will be null.
            const fileSize_byte = file.size || null;
            const fileSize_verified = fileSize_byte !== null;
            // If the maximum value is 0, there is no limit, so allow uploads.
            // If you know the file size, allow uploads only for files within the maximum limit.
            const isAllowedFileSize = previewMaxBytes === 0 || fileSize_verified && fileSize_byte <= previewMaxBytes;
            
            // IF Previews are active.
            if (previewActive_all && isAllowedFileSize) {

                // Save direct link to the file.
                // With basePath the link is absolute, without it is a blob.
                const directLinkHref = link.href;

                // Check once and for all.
                const isHeifConvertible = isHeifHeicConvertibleOnNonSafari(file.name);

                // HEIC/HEIF files: Non-safari previews run asynchronously.
                if( !isHeifConvertible ){

                    const isImage = file.type.startsWith('image/');
                    const isVideo = file.type.startsWith('video/');

                    // Images (Safari detects image/heif).
                    if (previewActive_image && isImage) {

                        const img = document.createElement('img');
                        // Use Blob only when no basepath is defined (so there is no absolute path).
                        img.src = blobFile;
                        link.href = blobFile;
                        if(basePath!==''){
                            img.src = directLinkHref;
                            link.href = directLinkHref;
                        }
                        while (previewBox.firstChild) {
                            previewBox.removeChild(previewBox.firstChild);
                        }
                        previewBox.appendChild(img);
                        link.classList.add('popup-image');

                    // Video
                    } else if (previewActive_video && isVideo) {

                        // Use Blob only when no basepath is defined (so there is no absolute path).
                        const video = document.createElement('video');
                        video.title = `${name} (${file.type.split('/')[1]})`;
                        video.controls = false;
                        video.muted = true;
                        video.preload = 'metadata';
                        link.href = blobFile;
                        if(basePath!==''){
                            link.href = directLinkHref;
                        }
                        video.innerHTML = '<source src="'+link.href+'" type="'+file.type+'">'+txtNoHtml5Video;
                        while (previewBox.firstChild) {
                            previewBox.removeChild(previewBox.firstChild);
                        }
                        previewBox.appendChild(video);
                        // Get Controls
                        const videoControls = document.createElement('div');
                        videoControls.classList.add(videoPrevCmd_class, videoPrevCmd_fx);
                        videoControls.innerHTML = videoPrevCmd_html;
                        previewBox.appendChild(videoControls);
                        link.classList.add('popup-video');

                    }

                // HEIF/HEIC Preview
                } else if(previewActive_HHimg && isHeifConvertible) {

                    const fileName = file.name;
                
                    // The link is not ready.
                    link.href = '#';
                    link.title = txtFileLoading+' '+fileName;
                    link.classList.add('loading_preview','link_disabled');
                    fcCounter_HHTotal++; // All files to convert.
                    // Capture the token at the time of scheduling.
                    const loadToken = currentLoadToken;

                    // This Promise is created with an async function and uses a semaphore to avoid incorrect DOM manipulations.
                    // When using new Promise() with multiple completion paths (events/timeouts), add a settled flag.
                    // To avoid waiting, I create a promise that will schedule the conversions.
                    const convertPromiseHH_fsa = convertHeifHeicSemaphore(async() => {
                        // resolve(false); // Debug Errors
                        // Initial check: If the token has expired, exit.
                        if (checkTokenAndStop(loadToken)) return null;
                        // Perform the conversion only if it is required.
                        if (loadToken === currentLoadToken) {
                            fcCounter_HHCurConv++; // Current file to convert.
                            // Informs the user of the operation in progress.
                            updateInfoBoxCounter(fcCounter_HHCurConv, fcCounter_HHTotal, true, showModalConvLimit);
                            // heic2any() returns a Blob (or an array of Blobs).
                            const jpgBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
                            const blob = (jpgBlob instanceof Blob) ? jpgBlob : new Blob([jpgBlob], { type: 'image/jpeg' });
                            const url  = URL.createObjectURL(blob);
                            // Once finished, hide the message.
                            updateInfoBoxCounter(fcCounter_HHCurConv, fcCounter_HHTotal, false, showModalConvLimit);
                            return url;
                        }
                    });
                    // We handle the result when it's ready (so we don't use await).
                    convertPromiseHH_fsa.then(url => {
                        // Cancel conversion if URL is invalid.
                        if (!url) return;
                        // If token has changed or nodes are no longer in the DOM revoke and ignore.
                        if (checkTokenAndStop(loadToken, url)) return;
                        let blobFile_converted = url;
                        blobURLs.push(blobFile_converted); // Store the URL blob.
                        const img = document.createElement('img');
                        img.src = blobFile_converted;
                        while (previewBox.firstChild) {
                            previewBox.removeChild(previewBox.firstChild);
                        }
                        previewBox.appendChild(img);
                        link.href   = blobFile_converted;
                        link.title  = fileName;
                        link.target = '_blank';
                        link.classList.remove('loading_preview','link_disabled');
                        link.classList.add('popup-image');
                    }).catch(error => {
                        // When clicked, I open the blob or the absolute position (with basePath) in a new window.
                        link.href   = directLink.href; // Equal to direct link.
                        link.title  = fileName;
                        link.target = '_blank';
                        link.classList.remove('loading_preview','link_disabled');
                        // I hide direct link because it would behave like the normal link.
                        directLink.remove();
                        console.error(txtErrorHHConvFailed, error);
                    });

                }

            }
        }
        $(currentLoader).hide(0);
    }
    

    /*
     *
     * Show HEIF/HEIC conversion progress.
     * Informs the user of the operation in progress.
     * 
     */
    function updateInfoBoxCounter(currentConversion, totalConversion, isActive=true, boxClass=''){
        const infoBox = $('.info_box');
        if(isActive === true) {
            let loaderIcon = '<div class="icon"><div class="loading_indicator spinner"></div></div>';
            let loaderCounter = '<div class="counter"><span class="current">'+String(currentConversion)+'</span><span class="total">'+String(totalConversion)+'</span></div>';
            let loaderMsg = loaderIcon+'<div class="text"></div>'+loaderCounter+'<div class="clear"></div>';
            if( boxClass !== ''){ 
                infoBox.addClass(boxClass);
                if(boxClass === showModalConvLimit){ infoBox.attr('title',txtHHFileConvTitle); }
            }
            infoBox.html(loaderMsg).show(0).find('.text').text(txtHHFileConvLabel);
        } else {
            infoBox.html('').hide(0);
        }
    }


    /*
     *
     * Returns the file size (in bytes) using an HTTP HEAD request
     * without downloading the file.
     * Works only for resources served over HTTP/HTTPS and if the server exposes the header.
     * The file size in bytes is read from the Content-Length header.
     * If it fails it returns null.
     * 
     */
    async function getFileSizeInByte_byHttpHead(url, timeoutMs=8000) {
        if (!url) return null;
        // Creo un AbortController per annullare la fetch se viene raggiunto il timeout.
        const controller = new AbortController();
        const signal     = controller.signal;
        const timeoutId  = setTimeout(() => controller.abort(), timeoutMs);
        try {
            // HTTP HEAD request to obtain only the headers without downloading the file.
            const response = await fetch(url, { method: 'HEAD', signal });
            // Clear the timeout since we received a response.
            clearTimeout(timeoutId);
            // If the response status is not successful, consider the operation failed.
            if (!response.ok) return null;
            // Read the Content-Length header (string or null).
            const clBytes = response.headers.get('Content-Length');
            if (clBytes == null) return null;
            // Accept only strings composed exclusively of digits.
            const trimBytes = String(clBytes).trim();
            if (!/^\d+$/.test(trimBytes)) return null;
            // If needed, convert to a number and check it is a finite number.
            const sizeBytes = Number(trimBytes);
            return Number.isFinite(sizeBytes) ? sizeBytes : null;
        } catch (error) {
            // console.error(error); // Debug
            // In case of error return null (can happen for timeout, CORS/network, etc.)
            return null;
        } finally {
            // Always clear the timeout to ensure cleanup.
            clearTimeout(timeoutId);
        }
    }


    /*
     *
     * Load Directory By PHP Server
     * 
     * Load and display the contents of a folder on the PHP server.
     * - Use the same UI style as the FSA (File System Access API) mode 
     *   present in the function loadDirectoryByFSA();"
     * 
     */
    async function loadDirectoryByPhpServer(subPath='') {
        // Refresh the token to cancel uploads that are no longer needed.
        currentLoadToken++;
        const loadToken = currentLoadToken;
        // console.log(loadToken); // Debug Token
        // Endpoint: Absolute path to the PHP file that returns the data.
        const endpoint = new URL(phpEndpointPath, window.location.href);
        // Parameter subPath: Relative path of the folder to read.
        if (typeof subPath === 'string' && subPath.trim() !== '') {
            endpoint.searchParams.set('sub', subPath);
        }
        // Save the endpoint (URL object) in a string constant.
        const PHP_ENDPOINT = endpoint.href;
        // Abort the script if the page is not served by a web server.
        const absURL = new URL(PHP_ENDPOINT, window.location.href);
        if (location.protocol === 'file:' || (absURL.protocol !== 'http:' && absURL.protocol !== 'https:')) {
            $(currentLoader).hide(0);
            let btn_naInfo = '<div class="btn btn_php_na_info">'+txtMoreInfo+'</div>';
            $(headerMsg).append('<div class="notice er_php_server_unavailable"><h2>'+txtErrorNoPhpSer+'</h2>'+btn_naInfo+'</div>');
            return;
        }
        // Generate breadcrumbs and page elements.
        try {
            // Prepare an Error object to use in case of failure. 
            // Send a request to the PHP endpoint and parse the response body as JSON. 
            const res = await fetch(PHP_ENDPOINT, { method: 'GET', credentials: 'same-origin' });
            // If it’s valid JSON, use that object.
            let body_json = null;
            try {
                body_json = await res.json();
            } catch (error) {
                console.error(txtErrorJson, error);
            }
            // If the HTTP response indicates an error (e.g. 400, 500), 
            // build an error object with the relevant info. 
            if (!res.ok) {
                // Extract Server Error.
                function getServerErrorByPhpEndpoint(httpStatus, sourceJson) {
                    let res_httpStatus = '';
                    let res_errorID    = '';
                    let res_desc       = '';
                    if (httpStatus) res_httpStatus = httpStatus;
                    if (sourceJson) {
                        if (sourceJson.error) res_errorID = sourceJson.error;
                        if (sourceJson.desc)  res_desc = sourceJson.desc;
                    }
                    return { httpStatus: res_httpStatus, errorID: res_errorID, errorDesc: res_desc }
                }
                const errorContent = getServerErrorByPhpEndpoint(res.status,body_json);
                // Create an Error object containing the error code 
                // and other properties useful for the user. 
                const serverError = new Error(errorContent.httpStatus);
                serverError.httpStatus = errorContent.httpStatus;
                serverError.errorID    = errorContent.errorID;
                serverError.errorDesc  = errorContent.errorDesc;
                throw serverError;
            }
            // Show Loader
            $(currentLoader).show(0);
            setCounter('loading');
            // Activate inputs.
            $(inputServerFolder).removeAttr('readonly').removeAttr('disabled');
            $(inputSearch).removeAttr('readonly').removeAttr('disabled');
            $(itemsSize_select).removeAttr('readonly').removeAttr('disabled');
            // Clear the UI (finder and breadcrumb) to insert the new contents.
            $(headerMsg).html('');
            $('#finder').html('');
            $('#breadcrumb').html('');
            // Generate breadcrumb.
            // Add clickable path segments.
            const folderPathSegments = (subPath || '').split('/').filter(Boolean);
            // The clickable 'root' segment returns to the home page.
            const rootName = `${window.location.host}`; // Debug: `${window.location.host} (root)`;
            const rootElm = document.createElement('div');
            rootElm.textContent = rootName;
            rootElm.className = 'path_folder';
            rootElm.addEventListener('click', async () => {
                await loadDirectoryByPhpServer('');
                if (checkTokenAndStop(loadToken)) return;
            });
            // Add Root Icon
            const root_icon = document.createElement('div');
            root_icon.className = 'icon folder root';
            rootElm.prepend(root_icon);
            breadcrumb.appendChild(rootElm);
            // Add a separator after the root if there are path segments.
            if (folderPathSegments.length > 0) {
                const sep     = document.createElement('span');
                sep.innerHTML = '&gt;';
                sep.className = 'separator';
                breadcrumb.appendChild(sep);
            }
            // Create a breadcrumb entry for each segment of subPath.
            let allFolderPathSegments = [];
            folderPathSegments.forEach((seg, idx) => {
                // Create breadcrumb.
                allFolderPathSegments.push(seg);
                const oneBreadcrumb = document.createElement('div');
                oneBreadcrumb.textContent = seg;
                oneBreadcrumb.className = 'path_folder';
                const targetSub = allFolderPathSegments.slice(0, idx + 1).join('/');
                php_directoryTarget = targetSub;
                // Breadcrumb click event.
                oneBreadcrumb.addEventListener('click', async () => {
                    await loadDirectoryByPhpServer(php_directoryTarget);
                    if (checkTokenAndStop(loadToken)) return;
                });
                breadcrumb.appendChild(oneBreadcrumb);
                // Segment separator (skip the last one).
                if (idx < folderPathSegments.length - 1) {
                    const sepAfter = document.createElement('span');
                    sepAfter.innerHTML = '&gt;';
                    sepAfter.className = 'separator';
                    breadcrumb.appendChild(sepAfter);
                }
            });
            // Request the file list from the server and check the response.
            const response = await fetch(absURL.href, { cache: 'no-store' });
            if (!response.ok) { throw new Error(`HTTP ${response.status}`); }
            // JSON Response Problem.
            const ct = response.headers.get('content-type') || '';
            if (!ct.includes('application/json')) throw new Error(txtErrorJson);
            // Read the JSON response.
            const payload = await response.json();
            if (checkTokenAndStop(loadToken)) return;
            // Defaults
            let entries = [];
            let folderPreview = null;
            // Get Data.
            if (payload && typeof payload === 'object') {
                entries       = Array.isArray(payload.entries) ? payload.entries : [];
                folderPreview = payload.folder_preview ?? null;
            } else {
                // Error retrieving the file list.
                console.error(txtErrorFileList);
            }
            // Apply filters to hidden/excluded files.
            const entriesFiltered = entries.filter(e => {
                if (typeof isHiddenFile   === 'function' && isHiddenFile(e.name)  ) return false;
                if (typeof isExcludedFile === 'function' && isExcludedFile(e.name)) return false;
                return true;
            });
            // Sort
            // Folders before files, names in alphabetical order.
            entriesFiltered.sort((a, b) => {
                if (Boolean(a.is_dir) === Boolean(b.is_dir)) {
                    return (a.name || '').localeCompare(b.name || '');
                }
                return a.is_dir ? -1 : 1;
            });

            // Reset HEIF/HEIC Conversion Counter.
            fcCounter_HHCurConv = 0;
            fcCounter_HHTotal   = 0;

            // Count by file type
            countFileTypesByExt(null,'reset');

            // Items
            for (const entry of entriesFiltered) {

                if (checkTokenAndStop(loadToken)) return;
                // Get data
                const isDir = Boolean(entry.is_dir);
                const name  = entry.name || '';
                // Item (same classes and structure as the FSA method).
                const preview = document.createElement('div');
                preview.className = `${isDir ? 'folder' : 'file'} item`;
                const box = document.createElement('div');
                box.className = 'box';
                const previewBox = document.createElement('div');
                previewBox.className = 'preview';
                // Array che conterranno le preview generate in modo asincrono.
                const previewPromises_image = [];
                const previewPromises_video = [];

                // If it is a file.
                if (!isDir) {

                    // Build link, icon, label and direct link."
                    const link  = document.createElement('a');
                    link.title  = name;
                    const hrefDefault = '#';
                    const href  = entry.url || hrefDefault;
                    link.href   = href;
                    link.target = '_blank';
                    // Determine the class for the file icon.
                    let fileClass = null;

                    // Try to find the icon using the exact MIME (e.g. image/png).
                    if (entry.mime && typeof fileIcons_mimeType === 'object') {
                        fileClass = fileIcons_mimeType[entry.mime];
                    }
                    // Try the macro-MIME (e.g. image/*).
                    if (!fileClass && entry.mime && typeof fileIcons_mimeType === 'object') {
                        const topType = entry.mime.split('/')[0]; // es. "image" da "image/png".
                        const macroKey = `${topType}/*`;
                        fileClass = fileIcons_mimeType[macroKey];
                    }
                    // If still nothing, try the extension map (e.g. 'jpg' => icon).
                    if (!fileClass && name && typeof fileIcons_extension === 'object') {
                        const ext = (name.split('.').pop() || '').toLowerCase();
                        if (ext) fileClass = fileIcons_extension[ext];
                    }
                    // If no icon was found, use the generic one.
                    if (!fileClass && typeof fileIcons_mimeType === 'object') {
                        fileClass = fileIcons_mimeType['file'];
                    }

                    // Check the media for a preview.
                    const fileMime     = entry.mime || '';
                    const file_isImage = fileMime.startsWith('image/');
                    const file_isVideo = fileMime.startsWith('video/');
                    const file_isAudio = fileMime.startsWith('audio/');
                    const file_isReadable = fileExtCheck_compatibility(href, isBrowser);

                    // Get File Extension
                    const extension = name.split('.').pop().toLowerCase();
                    // Increment the counter based on the extension type.
                    // For this calculation, it is not necessary to check whether the file is compatible with the browser.
                    countFileTypesByExt(extension);

                    // Check once to use it multiple times.
                    const isHeifConvertible = isHeifHeicConvertibleOnNonSafari(name);
                    // Create the icon element in the preview.
                    const fileDefaultIcon = document.createElement('div');
                    fileDefaultIcon.classList.add('file_icon', fileClass);
                    previewBox.appendChild(fileDefaultIcon);
                    
                    // Direct Link.
                    const directLink = document.createElement('a');

                    // Add direct link to file types that use modal preview.
                    let withDirectLink = file_isImage || file_isVideo || file_isAudio || file_isReadable || isHeifConvertible;
                    if (withDirectLink) {
                        directLink.title = `${txtDirectLink}: ${name}`;
                        directLink.classList.add('direct_link');
                        directLink.setAttribute('download', name); 
                        directLink.target = '_blank';
                        directLink.href = href;
                        box.appendChild(directLink);
                    }

                    // Files readable by the browser. 
                    if(file_isReadable) {
                        let file_identified = file_isImage || file_isVideo || file_isAudio || isHeifConvertible;
                        // That are NOT already identified types. 
                        if(!file_identified){
                            link.className = 'popup-iframe';
                        }
                    }

                    // File Audio
                    if (file_isAudio) {
                        link.className = 'popup-audio';
                        link.setAttribute('data_mime', fileMime);
                    }

                    // href is present in all cases.
                    // If the url is not valid fileSize_byte will be null.
                    const fileSize_byte     = await getFileSizeInByte_byHttpHead(href);
                    const fileSize_verified = fileSize_byte !== null;
                    // If the maximum value is 0, there is no limit, so allow uploads.
                    // If you know the file size, allow uploads only for files within the maximum limit.
                    const isAllowedFileSize = previewMaxBytes === 0 || fileSize_verified && fileSize_byte <= previewMaxBytes;

                    // IF Previews are active.
                    if (previewActive_all && isAllowedFileSize) {

                        // Generate Previews and Popup.
                        // In this order --> Images (without conversion) --> Videos --> Images (with conversion HEIC/HEIF).

                        // Images Previews (HEIF/HEIC conversion not necessary).
                        if (previewActive_image && file_isImage && !isHeifConvertible) {

                            // We create a promise for each image.
                            const promiseImagePreview = new Promise((resolve) => {
                                // If canceled, resolve immediately with false (or an object indicating cancellation).
                                if (checkTokenAndStop(loadToken)) {
                                    // If I have already changed the view, the file will appear anyway, 
                                    // so I mark it in the code (class) and hide it.
                                    preview.classList.add('expired_promise');
                                    preview.style.display = 'none';
                                    resolve(false);
                                    return;
                                }
                                // Create Image
                                const image = document.createElement('img');
                                image.alt = name;
                                image.src = entry.url || '';
                                // Prevent the same Promise from being repeated unintentionally.
                                let settled = false;
                                // Loading Timeout
                                let loadTimeout = setTimeout(function(){ 
                                    console.log(txtErrorLoadingTimeout+': '+entry.name);
                                    whenEnds(false);
                                }, mediaTimeoutMs);
                                // Clean: Remove Timeout and listener.
                                function cleanup_images() {
                                    clearTimeout(loadTimeout);
                                    image.removeEventListener('load', onLoad);
                                    image.removeEventListener('error', onError);
                                }
                                // Once the loading is complete, act according to the outcome.
                                function whenEnds(result){
                                    // If the Promise repeats itself, do not make any changes.
                                    if (settled) return;
                                    settled = true;
                                    cleanup_images();
                                    // I may have changed views after the promise was fired, so I'll check again.
                                    if (checkTokenAndStop(loadToken)) {
                                        // If I have already changed the view, the file will appear anyway, 
                                        // so I mark it in the code (class) and hide it.
                                        preview.classList.add('expired_promise');
                                        preview.style.display = 'none';
                                        resolve(false);
                                        return;
                                    }
                                    if(result===true){
                                        // Remove the icon and load preview image.
                                        fileDefaultIcon.remove();
                                        previewBox.appendChild(image);
                                        link.className = 'popup-image';
                                        resolve(true);
                                    } else {
                                        link.classList.remove('popup-image', 'popup-iframe');
                                        console.log(txtErrorLoading+': '+entry.name);
                                        resolve(false);
                                    }
                                }
                                // End Promise
                                function onLoad()  {  whenEnds(true); }
                                function onError() { whenEnds(false); }
                                // Add Listeners
                                image.addEventListener('load', onLoad);
                                image.addEventListener('error', onError);
                            });
                            previewPromises_image.push(promiseImagePreview);

                        // Video Previews.
                        } else if(previewActive_video && file_isVideo) {

                            // We create a promise for each video.
                            const videoPromise = new Promise((resolve) => {
                                // If canceled, resolve immediately with false (or an object indicating cancellation).
                                if (checkTokenAndStop(loadToken)) {
                                    // If I have already changed the view, the file will appear anyway, 
                                    // so I mark it in the code (class) and hide it.
                                    preview.classList.add('expired_promise');
                                    preview.style.display = 'none';
                                    resolve(false);
                                    return;
                                }
                                // Create video element (Preview).
                                const video    = document.createElement('video');
                                video.preload  = 'metadata';
                                video.title    = entry.name || '';
                                video.controls = false;
                                video.muted    = true;
                                // Video source.
                                const source   = document.createElement('source');
                                source.type    = entry.mime || 'video/mp4';
                                source.src     = entry.url  || '';
                                video.appendChild(source);
                                video.appendChild(document.createTextNode(txtNoHtml5Video));
                                // Prevent the same Promise from being repeated unintentionally.
                                let settled = false;
                                // Loading Timeout
                                let loadTimeout = setTimeout(function(){ 
                                    console.log(txtErrorLoadingTimeout+': '+entry.name);
                                    whenEnds(false); 
                                }, mediaTimeoutMs);
                                // Clean: Remove Timeout and listener.
                                function cleanup_videos() {
                                    clearTimeout(loadTimeout);
                                    video.removeEventListener('loadedmetadata', onLoaded);
                                    video.removeEventListener('error', onError);
                                }
                                // Once the loading is complete, act according to the outcome.
                                function whenEnds(result){
                                    // If the Promise repeats itself, do not make any changes.
                                    if (settled) return;
                                    settled = true;
                                    cleanup_videos();
                                    // I may have changed views after the promise was fired, so I'll check again.
                                    if (checkTokenAndStop(loadToken)) {
                                        // If I have already changed the view, the file will appear anyway, 
                                        // so I mark it in the code (class) and hide it.
                                        preview.classList.add('expired_promise');
                                        preview.style.display = 'none';
                                        resolve(false);
                                        return;
                                    }
                                    if(result===true){
                                        // Remove the icon and insert the preview video.
                                        fileDefaultIcon.remove();
                                        previewBox.appendChild(video);
                                        const videoControls = document.createElement('div');
                                        videoControls.classList.add(videoPrevCmd_class, videoPrevCmd_fx);
                                        videoControls.innerHTML = videoPrevCmd_html;
                                        previewBox.appendChild(videoControls);
                                        try { video.load(); } catch(e){}
                                        link.className = 'popup-video';
                                        resolve(true);
                                    } else {
                                        // Treat the link as a generic file without a preview.
                                        try { video.pause(); video.remove(); } catch(e){}
                                        link.classList.remove('popup-video', 'popup-iframe');
                                        directLink.remove();
                                        console.log(txtErrorLoading+': '+entry.name);
                                        resolve(false);
                                    }
                                }
                                // End Promise
                                function onLoaded() { whenEnds(true); }
                                function onError() { whenEnds(false); }
                                // Add Listeners
                                video.addEventListener('loadedmetadata', onLoaded);
                                video.addEventListener('error', onError);
                            });
                            previewPromises_video.push(videoPromise);
                        
                        }

                        // Wait, load all images.
                        await Promise.all(previewPromises_image);
                        // Wait, load all videos.
                        await Promise.all(previewPromises_video);

                        // HEIF/HEIC images Previews (Not Safari, requires conversion).
                        if(previewActive_HHimg && isHeifConvertible) {

                            // The link is not ready.
                            const preventClick = function (e) { e.preventDefault(); };
                            link.addEventListener('click', preventClick);
                            link.title = txtFileLoading+' '+name;
                            link.target = '_self';
                            link.classList.add('loading_preview');
                            link.href = '#';
                            fcCounter_HHTotal++; // All files to convert.
                            // Capture the token at the time of scheduling.
                            const loadToken = currentLoadToken;
                            // This Promise is created with an async function and uses a semaphore to avoid incorrect DOM manipulations.
                            // When using new Promise() with multiple completion paths (events/timeouts), add a settled flag.
                            // To avoid waiting, I create a promise that will schedule the conversions.
                            const convertPromiseHH_php = convertHeifHeicSemaphore(async() => {
                                // Initial check: If the token has expired, exit.
                                if (checkTokenAndStop(loadToken)) return null;
                                // Perform the conversion only if it is required.
                                if (loadToken === currentLoadToken) {
                                    fcCounter_HHCurConv++; // Current file to convert.
                                    // Informs the user of the operation in progress.
                                    updateInfoBoxCounter(fcCounter_HHCurConv, fcCounter_HHTotal, true, showModalConvLimit);
                                    let url = null;
                                    try {
                                        // Fetch the HEIF/HEIC file as a Blob.
                                        const resp = await fetch(href,{credentials:'same-origin'});
                                        if (!resp.ok) throw new Error('Fetch failed: ' + resp.status);
                                        const file = await resp.blob();
                                        // heic2any() returns a Blob (or an array of Blobs).
                                        const jpgBlob = await heic2any({ blob: file, toType: "image/jpeg", quality: 0.9 });
                                        const blob = (jpgBlob instanceof Blob) ? jpgBlob : new Blob([jpgBlob], { type: 'image/jpeg' });
                                        url = URL.createObjectURL(blob);
                                    } catch (error) {
                                        console.error(txtErrorHHConvFailed, error);
                                    }
                                    // Once finished, hide the message.
                                    updateInfoBoxCounter(fcCounter_HHCurConv, fcCounter_HHTotal, false, showModalConvLimit);
                                    return url;
                                }
                            });
                            convertPromiseHH_php.then(url => {
                                // Cancel conversion if URL is invalid.
                                if (!url) return;
                                // If token has changed or nodes are no longer in the DOM revoke and ignore.
                                if (checkTokenAndStop(loadToken,url)) return;
                                const blobFile = url;
                                blobURLs.push(blobFile); // Store the URL blob.
                                const img = document.createElement('img');
                                img.src = blobFile;
                                while (previewBox.firstChild) {
                                    previewBox.removeChild(previewBox.firstChild);
                                }
                                previewBox.appendChild(img);
                                link.removeEventListener('click', preventClick);
                                link.href   = blobFile;
                                link.title  = name;
                                link.target = '_blank';
                                link.classList.remove('loading_preview');
                                link.classList.add('popup-image');
                            }).catch(error => {
                                link.removeEventListener('click', preventClick);
                                link.title = name;
                                link.target = '_blank';
                                link.classList.remove('loading_preview');
                                link.href = href;
                                directLink.remove();
                                console.error(txtErrorHHConvFailed, error);
                            });

                        }

                    }

                    // Label (file name).
                    const label = document.createElement('div');
                    label.textContent = name;
                    label.className = 'label';
                    // Assemble the link.
                    link.appendChild(previewBox);
                    link.appendChild(label);
                    box.appendChild(link);

                // If it is a folder.
                } else {

                    // Navigation link.
                    const link = document.createElement('a');
                    link.href = '#';
                    link.title = name;
                    link.appendChild(previewBox);
                    // Label
                    const label = document.createElement('div');
                    label.textContent = name;
                    label.className = 'label';
                    link.appendChild(label);

                    // Click event on the folder.
                    link.addEventListener('click', async (e) => {
                        e.preventDefault();
                        // Rebuild the subPath.
                        const nextSub = subPath ? `${subPath}/${name}` : name;
                        // Reload from the server.
                        await loadDirectoryByPhpServer(nextSub);
                        if (checkTokenAndStop(loadToken)) return;
                    });

                    // Show the folder.
                    const folderView = document.createElement('div');
                    folderView.className = 'folder_view';
                    link.appendChild(folderView);
                    box.appendChild(link);

                    // Folder preview.
                    // If a preview is present.
                    if (entry.is_dir) {

                        const itemPreview = entry.folder_preview || null;

                        let isAllowedFileSize = false;
                        // Check that the preview exists 
                        // (itemPreview and itemPreview.preview must exist).
                        if (itemPreview?.preview != null){
                            // Check that the preview file size is allowed.
                            const fileSize_byte     = await getFileSizeInByte_byHttpHead(itemPreview.preview);
                            const fileSize_verified = fileSize_byte !== null;
                            // If the maximum value is 0, there is no limit, so allow uploads.
                            // If you know the file size, allow uploads only for files within the maximum limit.
                            isAllowedFileSize = previewMaxBytes === 0 || fileSize_verified && fileSize_byte <= previewMaxBytes;
                        }

                        // IF Previews are active.
                        if (previewActive_all && isAllowedFileSize) {

                            // Check once to use it multiple times.
                            const isHeifConvertible = isHeifHeicConvertibleOnNonSafari(itemPreview.preview);

                            // Display image or video depending on the MIME type.
                            const mime = (itemPreview.type || '').toLowerCase();
                            // Check if the media has a preview available.
                            // First check the image, if not there check the video.
                            const isImage = mime.startsWith('image/');
                            const isVideo = mime.startsWith('video/');

                            // Image Preview
                            // Do not use as a preview if conversion is needed.
                            if (previewActive_image && isImage && !isHeifConvertible ) {

                                previewBox.style.backgroundImage = `url("${itemPreview.preview}")`;

                            // Video Preview
                            } else if (previewActive_video && isVideo) {

                                const video = document.createElement('video');
                                video.src = itemPreview.preview;
                                video.controls = false;
                                video.muted = true;
                                video.preload = 'metadata';
                                video.addEventListener('loadedmetadata', () => {
                                    const targetTime = video.duration / 2;
                                    video.currentTime = targetTime;
                                });
                                video.addEventListener('seeked', () => {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = video.videoWidth;
                                    canvas.height = video.videoHeight;
                                    const ctx = canvas.getContext('2d');
                                    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                                    const imgUrl = `url("${canvas.toDataURL()}")`;
                                    previewBox.style.backgroundImage = imgUrl;
                                    URL.revokeObjectURL(video.src);
                                    video.remove();
                                });
                            }

                        } else {

                            // No preview available, show folder icon.
                            const folderIcon = document.createElement('div');
                            folderIcon.className = 'file_icon icon-folder';
                            previewBox.appendChild(folderIcon);

                        }

                    }

                }

                // Assemble the item and add it to the finder.
                preview.appendChild(box);
                finder.appendChild(preview);
            }

            // Apply the search filter.
            if ($(inputSearch).length && $(inputSearch).val().trim() !== '') {
                applySearchFilter();
            }

            // Items Counter
            let count_items = entriesFiltered.length; // All Items.
            // All Folders
            // filter() returns only the elements for which the callback returns true.
            let count_folders = entriesFiltered.filter(item => {
                // Convert the value of is_dir to a boolean value and prepare it for comparison.
                let is_dir = Boolean(item?.is_dir);
                // Counts the elements that return true.
                return is_dir === true;
            }).length;
            // All Files
            // Same method used to count folders...
            let count_files = entriesFiltered.filter(item => {
                let is_file = !Boolean(item?.is_dir);
                return is_file === true;
            }).length;
            // Show Data
            setCounter(count_items, count_folders, count_files, fileCounter);
            // Debug: 
            // console.log(entriesFiltered);

        // If there are errors.
        } catch (error) {

            function returnErrorInfo(httpStatus, errorID, errorDesc){
                return '['+txtHttpSatus+': '+httpStatus+']['+txtError+': '+errorID+']['+txtDesc+': '+errorDesc+']';
            }

            // Show the error in the console.
            if(error.httpStatus=='404'){
                // PHP endpoint not found.
                console.error(txtErrorPhpEp404, error);
            }else if(error.errorID==='500_DIR_NOT_SETTED'){
                // Expected Error: Directory not set in the PHP endpoint.
                console.log(txtErrorPhpEpNotSet, error, returnErrorInfo(error.httpStatus, error.errorID, error.errorDesc));
            } else {
                console.error(txtErrorLoadList, error,  returnErrorInfo(error.httpStatus, error.errorID, error.errorDesc));
            }

            // Default
            let notice_showError = true;
            let notice_title     = txtErrorPhpServer;
            let notice_desc      = '';
            let notice_class     = 'er_http';
            // PHP Endpoint Errors
            if(error.httpStatus=='404'){
                notice_title     = txtErrorPhpEp404;
                notice_desc      = txtErrorPhpEp404Desc;
                notice_class     = 'er_php_ep_not_found';
            }else if(error.httpStatus=='400'){
                switch(error.errorID){
                    case '400_INVALID_PATH':
                        notice_title = txtErrorFolderNF;
                        notice_desc  = txtErrorInvalidPath;
                        notice_class = 'er_http_400';
                    break;
                }
            }else if(error.httpStatus=='500'){
                switch(error.errorID){
                    case '500_DIR_NOT_SETTED':
                        notice_showError = false;
                        notice_title = txtErrorPhpEpNotSet;
                        notice_desc  = txtErrorPhpEpNotSetDesc;
                        notice_class = 'er_http_dir_not_set';
                    break;
                    case '500_DOC_ROOT_NOT_FOUND':
                        notice_title = txtErrorDocRootNotFound;
                        notice_class = 'er_http_doc_root_not_found';
                    break;
                    case '500_UNABLE_READ_DIR':
                        notice_title = txtErrorDocUnabReadDir;
                        notice_class = 'er_http_unable_read_dir';
                    break;
                    default:
                        notice_title = txtErrorIntSrvError;
                        notice_desc  = txtErrorIntSrvErrorDesc;
                        notice_class = 'er_http_500';
                }
            }
            let notice_error = '';
            if(notice_showError===true){
                const errorInfo = ' HTTP '+sanitizeText(error.httpStatus);
                notice_error = '<div class="error"><span class="txt_error">'+txtError+'</span>'+errorInfo+'</div>';
            }
            if(notice_title!==''){notice_title = '<h2 class="title">'+sanitizeText(notice_title)+'</h2>';  }
            if(notice_desc !==''){notice_desc  = '<div class="desc">'+sanitizeText(notice_desc)+'</div>';  }
            $(headerMsg).append('<div class="notice '+notice_class+'">'+notice_error+notice_title+notice_desc+'</div>');
            setCounter(0);

        // Once finished (even in case of error).
        } finally {

            // Close the loader.
            $(currentLoader).hide(0);

        }
    }


    /*
     * 
     * Get Server Folder By Input
     * 
     */
    function getServerFolderByInput(inputSelector) {
        // Set Input.
        const InputSF = $(inputSelector);
        if (InputSF.length === 0) return null;
        // Normalize the path.
        function normalizeSubPath(raw) {
            // Remove NUL, trim, and leading/trailing slashes.
            if (typeof raw !== 'string') return '';
            let s = raw.replace(/\0/g, '');
            s = s.trim();
            s = s.replace(/^\/+|\/+$/g, '');
            return s;
        }
        // Open the subfolder
        async function openFromInput() {
            const raw = InputSF.val() || '';
            // Synchronize all inputs with the same task.
            $(inputServerFolder).each(function() {
                $(this).val(raw);
            });
            const sub = normalizeSubPath(raw);
            // Suspend execution of openFromInput() until 
            // the promise from loadDirectoryByPhpServer() is resolved.
            try {
                await loadDirectoryByPhpServer(sub);
            } catch (err) {
                console.error(txtErrorDirGeneric, err);
            }
        }
        // Events: Press ENTER to navigate.
        InputSF.on('keydown', function(e) {
            if (e.key === 'Enter' || e.keyCode === 13) {
                e.preventDefault();
                openFromInput();
            }
        });
        // Utility: synchronize the input with a subPath.
        function syncInput(subPath) {
            const normalizedPath = normalizeSubPath(subPath || '');
            InputSF.val(normalizedPath);
        }
        syncInput(InputSF.val());
        // Save the initial state.
        let valBefore = null;
        InputSF.on('focus',function(){ 
            valBefore = $(this).val();
        });
        // On blur.
        InputSF.on('blur', function() {
            // Run only if something changed.
            const valAfter = $(this).val();
            if (valBefore !== valAfter) {
                openFromInput();
            }
        });

    }
    // Execute for all inputs with the same task.
    $(inputServerFolder).each(function() {
        const selector = this;
        getServerFolderByInput(selector);
    });


    /*
     *
     * Magnific Popup
     *
     */
    function initMagnificPopup() {

        // Item that contains the additional controls of Magnific Popup.
        const mfp_controlsBox = '.mfp-controls-box';


        /* 
         *
         * Modal Images + SlideShow
         * 
         */
        const slideShow_cBox      = mfp_controlsBox+'.slideshow';
        const slideShow_btnClass  = '.mfp-slideshow-btn';
        const slideShow_htmlPlay  = '<span title="'+txtPlay+'">&#9658;</span>';
        const slideShow_htmlStop  = '<span title="'+txtStop+'">&#9724;</span>';
        const slideShow_settings  = '.mfp-slideshow-time';
        const slideShow_timeInput = slideShow_settings+' input[type="number"]';
        let slideShow_player      = null;
        let slideShow_isActive    = false;
        let slideShow_time        = 2;

        // SlideShow > Init
        function slideShow_init(){
            if ( $(slideShow_btnClass).length === 0 ) {
                let sls_playStopBtn = '<div class="mfp-option btn mfp-slideshow-btn" title="'+txtPlay+'">'+slideShow_htmlPlay+'</div>';
                let inputTime       = '<input type="number" min="1" max="99" value="'+slideShow_time+'" title="'+txtSeconds+'">';
                let textTime        = '<span class="label">'+txtSecondsShort+'</span>';
                let sls_slideTime   = '<div class="mfp-option mfp-slideshow-time" title="'+txtsls_slideTimeInfo+'">'+inputTime+textTime+'</div>';
                let sls_controls    = '<div class="mfp-controls-box slideshow">'+sls_slideTime+sls_playStopBtn+'</div>';
                $('body').append(sls_controls);
            } else {
                $(slideShow_cBox+' .mfp-slideshow-time').attr('title',txtsls_slideTimeInfo);
                $(slideShow_cBox+' .mfp-slideshow-time input[type="number"]').attr('title',txtSeconds);
                $(slideShow_cBox+' .mfp-slideshow-time .label').text(txtSecondsShort);
            }
            $(slideShow_cBox).show(0);
        }

        // SlideShow > Stop
        function slideShow_stop() {
            slideShow_isActive = false;
            clearInterval(slideShow_player);
            $(slideShow_btnClass).html(slideShow_htmlPlay).attr('title',txtPlay);
        }

        // Init Modal images
        $('.finder').on('click','.popup-image',function(e){
            e.preventDefault();
            slideShow_init();
            const imageItems = $('.popup-image');
            const imagesAll = imageItems.map(function(){
                return { src: $(this).attr('href') };
            }).get();
            // Index position of the clicked element.
            const imageIndex = imageItems.index(this);
            $.magnificPopup.open({
                items: imagesAll,
                type: 'image',
                gallery: {
                    enabled: true
                },
                callbacks: {
                    // Btn SlideShow [Hide]
                    close: function() {
                        $(slideShow_cBox).hide(0);
                        slideShow_stop();
                    }
                }
            },imageIndex);
        });

        // SlideShow > Play / Stop
        function slideShow_play() {
            if (!slideShow_isActive) {
                $(slideShow_btnClass).html(slideShow_htmlStop).attr('title',txtStop);
                slideShow_isActive = true;
                let slideShow_ms = slideShow_time * 1000;
                // console.log(slideShow_ms);
                slideShow_player = setInterval(function() {
                    if ($.magnificPopup.instance.isOpen) {
                        $.magnificPopup.instance.next();
                        $(slideShow_btnClass).html(slideShow_htmlStop).attr('title',txtStop);
                    } else {
                        slideShow_stop();
                    }
                }, slideShow_ms);
            } else {
                slideShow_stop();
            }
        }

        // SlideShow > Set Slide Time
        $(document).on('change',slideShow_timeInput, function(){
            let newTime = parseInt($(this).val(),10) || 0;
            slideShow_time = newTime;
            slideShow_stop();
        });

        // SlideShow > Play / Stop
        $(document).on('click',slideShow_btnClass, function(){
            slideShow_play();
        });


        /* 
         *
         * Media Gallery (Audio + Video)
         * 
         */
        const mediaGallery_cBox       = mfp_controlsBox+'.mediagallery';
        const mediaGallery_btnClass   = '.mfp-mediagallery-btn';
        const mediaGallery_pauseClass = '.mfp-mediagallery-pause';
        const mediaGallery_modeClass  = '.mfp-mediagallery-mode';
        const mediaGallery_pauseInput = mediaGallery_pauseClass+' input';
        const mediaGallery_modeSelect = mediaGallery_modeClass+' select';
        const mediaGallery_htmlPlay   = '<span title="'+txtPlay+'">&#9658;</span>';
        const mediaGallery_htmlStop   = '<span title="'+txtStop+'">&#9724;</span>';
        const mediaGallery_selectors  = '.mfp-content video,.mfp-content audio';
        const mediaGallery_defMode    = 'mixed'; // Default: 'separate' or 'mixed'.
        let mediaGallery_mode         = localStorage.getItem('mediaGalleryMode_current') || mediaGallery_defMode;
        let mediaGallery_isActive     = false;
        let mediaGallery_time         = 2;
        let mediaGallery_timer        = null;
        let mediaGallery_lastMedia    = null;
        let mediaGallery_openAfterClose = null; 

        // Video
        // Generate the popup HTML for MagnificPopup.
        function mfpGethtml_video(src){
            let html = '<div class="video-popup-wrapper">'+
                '<video controls autoplay style="width:100%">'+
                    '<source src="'+src+'" type="video/mp4">'+txtNoHtml5Video+
                '</video>'+
                '</div>';
            return html;
        }

        // Audio
        // Generate the popup HTML for MagnificPopup.
        function mfpGethtml_audio(src, type, title){
            // Since the appearance of the audio player can vary slightly from one browser to another, 
            // if the browser is recognized, a class is added to the body which I then use to manage its appearance.
            let html = '<div class="audio-popup-wrapper">'+
                '<div class="title" title="'+title+'">'+title+'</div>'+
                '<div class="audio_box">'+
                    '<audio controls>'+
                        '<source src="'+src+'" type="'+type+'">'+txtNoHtml5Audio+
                    '</audio>'+
                '</div>'+
            '</div>';
            return html;
        }

        // Video Aspect Ratio
        // Apply the current video's aspect ratio to the container.
        function mfpVideo_getAspectRatio(v) {
            let w = v.videoWidth, h = v.videoHeight;
            let wrap = v.closest('.video-popup-wrapper');
            if (wrap && w && h) {
                wrap.style.aspectRatio = w + ' / ' + h;
            }
        }

        /*
         *
         * Generic builder for mixed gallery (keeps DOM order).
         * Returns an array of objects representing all the media (video + audio) in a container.
         * 
         */
        function mediaGallery_getAllMediaItems(selector) {
            // Container to search for media to load in the modal ('.finder').
            const container = document.querySelector(selector);
            // Select both audio and video triggers in DOM order.
            const triggers = Array.from(container.querySelectorAll('.popup-video,.popup-audio'));
            // Map each trigger into item object.
            return triggers.map(function(mediaItem){
                let isVideo = mediaItem.matches('.popup-video');
                let isAudio = mediaItem.matches('.popup-audio');
                if (isVideo) {
                    const videoSrc = mediaItem.getAttribute('href');
                    var html = mfpGethtml_video(videoSrc);
                    return {src: html, type:'inline', trigger: mediaItem };
                } else if(isAudio) {
                    const audioSrc   = mediaItem.getAttribute('href');
                    const audioTitle = mediaItem.getAttribute('title');
                    const audioType  = mediaItem.getAttribute('data_mime');
                    var html = mfpGethtml_audio(audioSrc,audioType,audioTitle);
                    return {src: html, type:'inline', trigger: mediaItem };
                }
            });
        }

        // Media Gallery > Change Mode
        $(document).on('change',mediaGallery_modeSelect,function(){
            let newMode = $(this).val();
            if( newMode === 'separate' || newMode === 'mixed' ){
                localStorage.setItem('mediaGalleryMode_current',newMode);
                mediaGallery_mode = localStorage.getItem('mediaGalleryMode_current');
                $(mediaGallery_modeSelect).val(mediaGallery_mode); // Get (and test) saved data.
                // Reload the modal with the new gallery mode.
                mediaGallery_openAfterClose = mediaGallery_lastMedia;
                $.magnificPopup.close();
                // Another, more crude way to reload the modal.
                // $(this).closest('.mfp-content').find('.mfp-close').click();
                // mediaGallery_lastMedia.click();
            }
        });


        /*
         *
         * Media Gallery > Open Change Mode Select
         * Open the select with the .open-select method.
         * 
         */
        $(document).on('click', mediaGallery_modeSelect, function() {
            const modeSelect = $(this);
            const msContainer = $(mediaGallery_modeClass);
            let isCloseSelect = modeSelect.attr('size') <= 1 || !modeSelect.attr('size');
            // If the select is closed, open it (with the .open-select method).
            if (isCloseSelect) {
                let itemWidth  = msContainer.width();
                let itemheight = msContainer.height();
                msContainer.addClass('open-select').css({'width': itemWidth, 'height': itemheight});
                modeSelect.attr('size', modeSelect.find('option').length);
            // If the select is open, close it.
            } else {
                modeSelect.attr('size', 1);
                msContainer.removeClass('open-select').css({'width': '','height': ''});
            }
        });


        // Media Gallery > Init 
        function mediaGallery_init() {
            if ( $(mediaGallery_btnClass).length === 0 ) {
                let mg_playStopBtn = '<div class="mfp-option btn mfp-mediagallery-btn" title="'+txtPlay+'">'+mediaGallery_htmlPlay+'</div>';
                let inputTime      = '<input type="number" min="0" max="99" value="'+mediaGallery_time+'" title="'+txtSeconds+'">';
                let textTime       = '<span class="label">'+txtSecondsShort+'</span>';
                let mg_setPause    = '<div class="mfp-option mfp-mediagallery-pause" title="'+txtMg_setPauseInfo+'">'+inputTime+textTime+'</div>';
                let textMode       = '<span class="label">'+txtMg_queue+'</span>';
                let optionsMode    = '<option value="separate">'+txtMg_separateMode+'</option>'+'<option value="mixed">'+txtMg_mixedMode+'</option>';
                let mg_selectMode  = '<div class="mfp-option mfp-mediagallery-mode" title="'+txtMg_selectModeInfo+'">'+textMode+'<select>'+optionsMode+'</select></div>';
                let mg_controls    = '<div class="mfp-controls-box mediagallery">'+mg_selectMode+mg_setPause+mg_playStopBtn+'</div>';
                $('body').append(mg_controls);
            } else {
                $(mediaGallery_cBox+' .mfp-mediagallery-pause').attr('title',txtMg_setPauseInfo);
                $(mediaGallery_cBox+' .mfp-mediagallery-pause input[type="number"]').attr('title',txtSeconds);
                $(mediaGallery_cBox+' .mfp-mediagallery-pause .label').text(txtSecondsShort);
                $(mediaGallery_cBox+' .mfp-mediagallery-mode').attr('title',txtMg_selectModeInfo);
                $(mediaGallery_cBox+' .mfp-mediagallery-mode select option[value="separate"]').text(txtMg_separateMode);
                $(mediaGallery_cBox+' .mfp-mediagallery-mode select option[value="mixed"]').text(txtMg_mixedMode);
                $(mediaGallery_cBox+' .mfp-mediagallery-mode .label').text(txtMg_queue);
            }
            $(mediaGallery_cBox).show(0);
            $(mediaGallery_modeSelect).val(mediaGallery_mode);
        }

        // Media Gallery > Pause and Next.
        function mediaGallery_pauseNext() {
            // If there is already a timer, delete it.
            if (mediaGallery_timer) {
                clearTimeout(mediaGallery_timer);
                mediaGallery_timer = null;
            }
            // Advance after waiting for mediaGallery_time.
            mediaGallery_timer = setTimeout(function() {
                if (mediaGallery_isActive && $.magnificPopup.instance.isOpen) { 
                    $.magnificPopup.instance.next(); 
                }
            }, mediaGallery_time * 1000);
        }

        // Media Gallery > Play / Stop.
        function mediaGallery_play() {
            // If activated
            if (!mediaGallery_isActive) {
                mediaGallery_isActive = true;
                // Start playing current media.
                $(mediaGallery_btnClass).html(mediaGallery_htmlStop).attr('title',txtStop);
                // Select the first media item in the popup (video or audio).
                let media = document.querySelector(mediaGallery_selectors);
                if (media) {
                    try {
                        // Start playback, if the play promise is rejected avoid unhandled errors with catch().
                        media.play().catch(()=>{});
                        // When media ends, advance the gallery if still active.
                        media.onended = function() {
                            if (mediaGallery_isActive && $.magnificPopup.instance.isOpen) {
                                mediaGallery_pauseNext();
                            }
                        };
                    } catch(error){ 
                        console.warn(txtErrorMediaGallery, error); 
                    }
                }
            } else {
                mediaGallery_stop(false);
            }
        }

        // Media Gallery > Stop.
        function mediaGallery_stop(closeUI=false) {
            mediaGallery_isActive = false;
            // Select the first media item in the popup (video or audio).
            let media = document.querySelector(mediaGallery_selectors);
            // Remove ended handler (if any), to prevent it from running when the media ends.
            if (media) media.onended = null;
            $(mediaGallery_btnClass).html(mediaGallery_htmlPlay).attr('title',txtPlay);
            // When I close the media gallery I also close the UI.
            if(closeUI===true){
                // If there is a media element try pausing it.
                if (media && !media.paused) {
                    try { media.pause(); } catch(e){}
                }
                // Clear pending pause timer.
                if (mediaGallery_timer) { 
                    clearTimeout(mediaGallery_timer); 
                    mediaGallery_timer = null; 
                }
                // Hide media gallery controls.
                $(mediaGallery_cBox).hide(0);
            }
        }

        // Media Gallery > Play / Pause
        $(document).on('click', mediaGallery_btnClass, function(){
            mediaGallery_play();
        });

        // Media Gallery > Set Pause Time
        $(document).on('change', mediaGallery_pauseInput, function(){
            let newTime = parseInt($(this).val(),10) || 0;
            mediaGallery_time = newTime;
        });


        /* 
         *
         * MagnificPopup.open for media files (video and audio).
         * Opens single files and gallery items (mixed and separate).
         * 
         */
        function mfpMediaGallery_openPopup(itemsAll, startIndex){
            let mfpQs_video = '.mfp-content video';
            let mfpQs_audio = '.mfp-content audio';
            // Media Gallery > Go Next (with Pause).
            function madiaGallery_goNext(){
                if (mediaGallery_isActive) {
                    let media = document.querySelector(mediaGallery_selectors);
                    if (media) {
                        try { 
                            // Start playback; if blocked, .catch() prevents unhandled errors in the console.
                            media.play().catch(()=>{});
                            // When the media playback ends.
                            media.onended = function(){
                                // If the gallery is active and the modal is open, go to the next track using the timed method.
                                if (mediaGallery_isActive && $.magnificPopup.instance.isOpen) mediaGallery_pauseNext();
                            }; 
                        } catch(e){} // Prevent the script from stopping in case of synchronous errors.
                    }
                }
            }
            $.magnificPopup.open({
                items: itemsAll,
                gallery: { enabled: true },
                callbacks: {
                    open: function() {
                        mediaGallery_init();
                        // Video
                        var video = document.querySelector(mfpQs_video);
                        if (video) {
                            // Get and apply video size.
                            blobURLs.push(video.src);
                            video.addEventListener('loadedmetadata', function() {
                                mfpVideo_getAspectRatio(video);
                            }, { once: true });
                        }
                        // Audio
                        var audio = document.querySelector(mfpQs_audio);
                        if (audio) {
                            // Select the newly created player and force reset.
                            try {
                                audio.pause();
                                audio.currentTime = 0;
                                audio.load(); // Reload the sources to ensure that the browser uses the new sources (src).
                                audio.play(); // Auto Play.
                            } catch (error) {
                                console.warn(txtErrorAudioReset, error);
                            }
                        }
                        madiaGallery_goNext();
                    },
                    // Use afterChange because the media must already be present in the DOM.
                    afterChange: function() {
                        // Video
                        var video = document.querySelector(mfpQs_video);
                        if (video) {
                            // Get and apply video size.
                            blobURLs.push(video.src);
                            // If the metadata is already ready, apply it now.
                            if (video.readyState >= 1 && video.videoWidth && video.videoHeight) {
                                mfpVideo_getAspectRatio(video);
                            } else {
                                // Otherwise wait for loadedmetadata (once avoids further calls).
                                video.addEventListener('loadedmetadata', function() {
                                    mfpVideo_getAspectRatio(video);
                                }, { once: true });
                            }
                        }
                        // Audio
                        var audio = document.querySelector(mfpQs_audio);
                        if (audio) {
                            // To handle track changes in the modal window we use the afterChange event, 
                            // because during the change event the audio is not yet present in the DOM.
                            // Select the newly created player and force reset.
                            try {
                                audio.pause();
                                audio.currentTime = 0;
                                audio.load(); // Reload the sources to ensure that the browser uses the new sources (src).
                                audio.play(); // Auto Play.
                            } catch (error) {
                                console.warn(txtErrorAudioChange, error);
                            }
                        }
                        madiaGallery_goNext();
                    },
                    close: function(){
                        // Audio
                        var audio = document.querySelector(mfpQs_audio);
                        if (audio) {
                            // Remove any references to free up memory.
                            try { 
                                audio.pause(); 
                                audio.removeAttribute('src'); 
                                audio.load(); // Reloads the empty player freeing up resources linked to the source.
                            } catch(error){
                                console.warn(txtErrorAudioClose, error);
                            }
                        }
                        // Media Gallery
                        mediaGallery_stop(true);
                        // Se è richiesta la riappertura del modal.
                        if(mediaGallery_openAfterClose){
                            // Defer the re-open to the next macrotask (setTimeout 0).
                            // This ensures that the modal closing and all related synchronous operations 
                            // and microtasks are completed before reopening.
                            setTimeout(function() {
                                $(mediaGallery_openAfterClose).trigger('click');
                                mediaGallery_openAfterClose = null;
                            }, 0);
                        }
                    }
                }
            },startIndex);
        }


        /* 
         *
         * Modal Video
         * 
         */
        $('.finder').on('click', '.popup-video', function(e) {
            e.preventDefault();
            // If the preview video exists, pause it.
            var videoPreview = $(this).find('video');
            if (videoPreview.length > 0) {
                videoPreview[0].pause();
            }
            // Init the media gallery and start the video.
            mediaGallery_lastMedia = $(this);
            let itemsAll   = null;
            let startIndex = null;
            switch(mediaGallery_mode){
                case 'mixed':
                    // Mixed mode, audio and video files.
                    itemsAll   = mediaGallery_getAllMediaItems('.finder');
                    startIndex = itemsAll.findIndex(it => it.trigger === this);
                break;
                case 'separate':
                    // Saparate mode, only audio files.
                    var videoItems = $('.popup-video');
                    var videoAll   = videoItems.map(function() {
                        var videoSrc = $(this).find('video source').attr('src');
                        var html_videoPopup = mfpGethtml_video(videoSrc);
                        return { src: html_videoPopup, type: 'inline' };
                    }).get();
                    itemsAll   = videoAll;
                    startIndex = videoItems.index(this);
                break;
            }
            mfpMediaGallery_openPopup(itemsAll, startIndex);
        });


        /*
         * 
         * Modal Audio
         * 
         */
        $('.finder').on('click', '.popup-audio', function(e){
            e.preventDefault();
            mediaGallery_lastMedia = $(this);
            let itemsAll   = null;
            let startIndex = null;
            switch(mediaGallery_mode){
                case 'mixed':
                    // Mixed mode, audio and video files.
                    itemsAll   = mediaGallery_getAllMediaItems('.finder');
                    startIndex = itemsAll.findIndex(it => it.trigger === this);
                break;
                case 'separate':
                    // Saparate mode, only audio files.
                    var audioItems = $('.popup-audio');
                    var audioAll   = audioItems.map(function() {
                        var audioSrc   = $(this).attr('href');
                        var audioTitle = $(this).attr('title');
                        var audioType  = $(this).attr('data_mime');
                        var html_audioPopup = mfpGethtml_audio(audioSrc,audioType,audioTitle);
                        return { src: html_audioPopup, type: 'inline' };
                    }).get();
                    itemsAll   = audioAll;
                    startIndex = audioItems.index(this);
                break;
            }
            mfpMediaGallery_openPopup(itemsAll, startIndex);
        });


        /*
         * 
         * Modal iFrame
         * 
         * It opens files and web pages readable by the browser in an iframe.
         * It can also display media (images, video, audio), but using the dedicated media methods is recommended.
         * It supports static and dynamic pages: if the browser or server does not execute the page, 
         * the source may be shown.
         * 
         */
        $('.finder').on('click', '.popup-iframe', function(e){
            e.preventDefault();
            let fileSrc   = $(this).attr('href');
            let emptyPage = 'about:blank';
            const wrapper = '.iframe-popup-wrapper';
            const iframe  = wrapper+' iframe';
            $.magnificPopup.open({
                items: {
                src: '<div class="iframe-popup-wrapper">'+
                        '<iframe src="'+emptyPage+'" frameborder="0" allowfullscreen></iframe>'+
                     '</div>'
                },
                type:'inline',
                callbacks: {
                    open: function() {
                        const loaderClass = 'loading_iframe';
                        $(wrapper).addClass(loaderClass);
                        $(iframe).attr('src', fileSrc);
                        // Al load rimuovi la classe e rimuovi il listener.
                        $(iframe).on('load',function(){
                            $(wrapper).removeClass(loaderClass);
                        });
                    },
                    close: function() {
                        // Clear iframes and free up memory.
                        $(iframe).attr('src',emptyPage);
                    }
                }
            });
        });

    }
    initMagnificPopup();


    /*
     *
     * Video Preview Controls
     * Allows you to interact with the preview video without opening it in the modal.
     * 
     */
    const videoPrevCmd_box = '.popup-video .preview_controls';
    const videoPrev        = '.popup-video video';
    // Ignore the link and stop the "bubbling" of the .popup-video modal.
    function videoPreview_isolateEvents(e){
        e.preventDefault();
        e.stopPropagation();
    }
    // Pause the video with the button.
    $('.finder').on('click',videoPrevCmd_box+' .btn_pause', function(e) {
        videoPreview_isolateEvents(e);
        const videoLink = $(this).closest('a.popup-video');
        const videoPreview = videoLink.find('video').get(0);
        videoPreview.pause();
        videoLink.find('.preview_controls .btn_pause').hide(0);
        videoLink.find('.preview_controls .btn_play').show(0);
    });
    // Play the video with the button.
    $('.finder').on('click',videoPrevCmd_box+' .btn_play', function(e) {
        videoPreview_isolateEvents(e);
        const videoLink = $(this).closest('a.popup-video');
        const videoPreview = videoLink.find('video').get(0);
        videoPreview.play();
        videoLink.find('.preview_controls .btn_play').hide(0);
        videoLink.find('.preview_controls .btn_pause').show(0).removeClass('hidden');
    });
    // Mute the video.
    $('.finder').on('click',videoPrevCmd_box+' .btn_mute', function(e) {
        videoPreview_isolateEvents(e);
        const videoLink = $(this).closest('a.popup-video');
        const videoPreview = videoLink.find('video').get(0);
        videoPreview.muted = true;
        videoLink.find('.preview_controls .btn_mute').hide(0);
        videoLink.find('.preview_controls .btn_unmute').show(0);
    });
    // Turn on the video audio.
    $('.finder').on('click',videoPrevCmd_box+' .btn_unmute', function(e) {
        videoPreview_isolateEvents(e);
        const videoLink = $(this).closest('a.popup-video');
        const videoPreview = videoLink.find('video').get(0);
        videoPreview.muted = false;
        videoLink.find('.preview_controls .btn_unmute').hide(0);
        videoLink.find('.preview_controls .btn_mute').show(0).removeClass('hidden');
    });
    // Start the video by hovering over it.
    $('.finder').on('mouseover', videoPrev, function() {
        const videoPreview = $(this)[0];
        videoPreview.play();
        const videoControls = $(this).closest('a.popup-video').find('.preview_controls');
        videoControls.find('.btn_play').hide(0);
        videoControls.find('.btn_pause').show(0).removeClass('hidden');
    });
    // Stop video when mouse goes away.
    $('.finder').on('mouseout', videoPrev, function() {
        const videoPreview = $(this)[0];
        videoPreview.pause();
        const videoControls = $(this).closest('a.popup-video').find('.preview_controls');
        videoControls.find('.btn_pause').hide(0);
        videoControls.find('.btn_play').show(0);
    });


    /*
     *
     * Change Graphic Theme
     *
     */
    const defaultTheme = 'theme_dark';
    let   currentTheme = localStorage.getItem('uiTheme_current') || defaultTheme;
    $('body').addClass(currentTheme);
    $(document).on('click','.btn_change_theme',function() {
        $('body').toggleClass('theme_dark').toggleClass('theme_light');
        if( $('body').hasClass('theme_dark') ){
            localStorage.setItem('uiTheme_current', 'theme_dark');
        } else {
            localStorage.setItem('uiTheme_current', 'theme_light');
        }
    });


    /*
     *
     * Change Graphic View
     * 
     */
    const defaultView = 'view_gallery';
    let   currentView = localStorage.getItem('uiView_current') || defaultView;
    $('body').addClass(currentView);
    $(document).on('click','.btn_change_view',function(){
        $('body').toggleClass('view_gallery').toggleClass('view_list');
        if( $('body').hasClass('view_gallery') ){
            localStorage.setItem('uiView_current', 'view_gallery');
        } else {
            localStorage.setItem('uiView_current', 'view_list');
        }
    });


    /*
     *
     * Modals
     *
     */
    // Show / Hide Modals
    function showModal(idClass,view){
        const modalAnimate = 200;
        switch(view){
            case true:   $('.modal'+idClass).fadeIn(modalAnimate);  break;
            case false:  $('.modal'+idClass).fadeOut(modalAnimate); break;
        }
    }
    $(document).on('click','.btn_close_modal',function(){
        $(this).closest('.modal').fadeOut(200);
    });
    $(document).on('click',modalErrors+' .btn_close_modal',function(){
        $(modalErrors+' .info_error').fadeOut(200);
    });
    $(document).on('click',modalOptions+' .btn_close_modal',function(){
        $(modalOptions+' .section').fadeOut(200);
    });


    /*
     *
     * Reload Page
     *
     */
    $(document).on('click','.btn_reload_app',function(){
        location.reload();
    });


    /*
     *
     * Btn Up
     *
     */
    const btnUp = '.btn_up';
    $(document).on('click',btnUp,function(){
        $('html, body').animate({scrollTop: $('#page_top').offset().top},200);
    });
    // On Scroll Fx
    $(window).on('scroll', function() {
        // Calculate the page scroll percentage.
        let scrollTop = $(window).scrollTop();
        let winHeight = $(window).height();
        // Scroll Beyond 50%
        if (scrollTop > winHeight / 2) {
            if ($(btnUp).css('display') === 'none') {
                $(btnUp).css('display', 'block').stop().animate({opacity:1}, 200);
            }
        } else {
            if ($(btnUp).css('display') === 'block') {
                $(btnUp).stop().animate({opacity:0}, 200, function() {
                    $(btnUp).css('display', 'none');
                });
            }
        }
    });


    /*
     *
     * New Tab
     *
     */
    $(document).on('click','.btn_new_tab',function(){
        window.open(window.location.origin + window.location.pathname, '_blank');
    });


    /*
     *
     * Search Filter
     *
     */
    // Debounce Helper: Don't execute functions until the user interacts.
    function debounceHelper(debounceFn, timeMs) {
        let timerID;
        return function(...args) { 
            clearTimeout(timerID);
            var self = this;
            timerID = setTimeout(function() {
                debounceFn.apply(self, args);
            }, timeMs);
        };
    }
    // Apply filter on items (Folders and Files).
    function applySearchFilter(){
        const searchInputText = ($(inputSearch).val() || '').trim().toLowerCase();
        const searchTerms = searchInputText.split(/\s+/).filter(Boolean);
        const pageItems = document.querySelectorAll('#finder .item');
        for (const oneItem of pageItems) {
            const itemName = (oneItem.querySelector('.label')?.textContent || '').toLowerCase();
            const itemIsMatch = searchTerms.every(t => itemName.includes(t));
            oneItem.style.display = (searchTerms.length === 0 || itemIsMatch) ? '' : 'none';
        }
    }
    // Apply the search filter via Debounce Helper.
    $(document).on('input',inputSearch, 
        debounceHelper(applySearchFilter, 150) 
    );


    /*
     *
     * Mobile Menu
     *
     */
    const boxMainMenu   = '.header .box_main_menu';
    const boxMobileMenu = '.header .box_mobile_menu';
    const btnMainMenuMobile = boxMobileMenu+' .options .btn_menu';
    // Apply/Remove Mobile Mode.
    function getUxMobile(){
        if (isMobileDevice()) {
            $('body').addClass('ux_mobile');
            $(boxMobileMenu).show(0);
            $(boxMainMenu).hide(0);
        } else {
            $('body').removeClass('ux_mobile');
            $(boxMobileMenu).hide(0);
            $(boxMainMenu).show(0);
        }
        $(btnMainMenuMobile).removeClass('open');
    }
    // Debounce: Reduce the number of calls during resize.
    var resizeTimer;
    $(window).on('resize', function() {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(function() {
            getUxMobile();
        }, 100);
    });
    // Init UX.
    getUxMobile();
    // Open Menu Mobile.
    $(document).on('click',btnMainMenuMobile,function(){
        let mainMenu_isOpen = $(btnMainMenuMobile).hasClass('open');
        if( mainMenu_isOpen ) {
            $(btnMainMenuMobile).removeClass('open');
            $(boxMainMenu).slideUp(200);
        } else {
            $(btnMainMenuMobile).addClass('open');
            $(boxMainMenu).slideDown(200);
        }
    });


  });
})(jQuery);
